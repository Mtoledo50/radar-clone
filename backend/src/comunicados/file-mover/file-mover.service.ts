// backend/src/comunicados/file-mover/file-mover.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MoverOptions {
  subpasta?: string; // ex: '2026-09' ou 'erros' ou 'rejeitados'
  sufixo?: string;   // para evitar colisao
}

@Injectable()
export class FileMoverService {
  private readonly logger = new Logger(FileMoverService.name);
  private readonly pastaBase: string;

  constructor(private readonly config: ConfigService) {
    this.pastaBase =
      this.config.get<string>('WATCH_FOLDER_PATH') ??
      path.join(process.cwd(), 'data', 'enviar');
  }

  /**
   * F15 — Localiza o caminho REAL do arquivo.
   * O caminhoAbsoluto gravado no banco pode ficar desatualizado (o arquivo
   * ja foi movido para pendentes/, enviados/YYYY-MM/, etc.).
   *
   * FIX F15-5: agora tambem varre enviados/<YYYY-MM>/ — sem isso, o link de
   * download de um arquivo JA APROVADO retornava 404.
   */
  async resolverCaminhoAtual(
    caminhoAbsoluto: string,
    nomeOriginal: string,
  ): Promise<string> {
    const base = this.pastaBase;

    // 1) Candidatos fixos (ordem do ciclo de vida)
    const candidatos = [
      caminhoAbsoluto,
      path.join(base, 'pendentes', nomeOriginal),
      path.join(base, 'erros', nomeOriginal),
      path.join(base, 'rejeitados', nomeOriginal),
      path.join(base, nomeOriginal),
    ];
    for (const candidato of candidatos) {
      try {
        await fs.access(candidato);
        return candidato; // achou!
      } catch {
        // nao existe aqui — tenta o proximo
      }
    }

    // 2) FIX F15-5: varre enviados/<YYYY-MM>/ (arquivo ja aprovado)
    try {
      const meses = await fs.readdir(path.join(base, 'enviados'));
      for (const mes of meses) {
        const candidato = path.join(base, 'enviados', mes, nomeOriginal);
        try {
          await fs.access(candidato);
          return candidato; // achou em enviados/2026-09/ etc.
        } catch {
          // tenta o proximo mes
        }
      }
    } catch {
      // pasta enviados/ nao existe ainda — segue em frente
    }

    return caminhoAbsoluto; // nao achou em lugar nenhum — erro tratado depois
  }

  /**
   * Garante que a estrutura de pastas existe:
   *   {pastaBase}/
   *     enviados/{YYYY-MM}/
   *     pendentes/
   *     rejeitados/
   *     erros/
   */
  async garantirEstrutura(): Promise<void> {
    const subpastas = ['enviados', 'pendentes', 'rejeitados', 'erros'];
    await fs.mkdir(this.pastaBase, { recursive: true });
    for (const sub of subpastas) {
      await fs.mkdir(path.join(this.pastaBase, sub), { recursive: true });
    }
  }

  /**
   * Move um arquivo da raiz para uma subpasta (ADR-119).
   * Se ja existir arquivo com mesmo nome, adiciona sufixo numerico.
   * @returns Caminho absoluto do arquivo movido
   */
  async mover(caminhoOrigem: string, options: MoverOptions = {}): Promise<string> {
    await this.garantirEstrutura();

    const nomeBase = path.basename(caminhoOrigem);
    const { name, ext } = path.parse(nomeBase);

    let destino: string;
    if (options.subpasta) {
      const subDir = path.join(this.pastaBase, options.subpasta);
      await fs.mkdir(subDir, { recursive: true });
      destino = path.join(subDir, this.nomeUnico(name, ext, subDir));
    } else {
      destino = path.join(this.pastaBase, this.nomeUnico(name, ext, this.pastaBase));
    }

    try {
      await fs.rename(caminhoOrigem, destino);
      this.logger.debug(`Movido: ${caminhoOrigem} → ${destino}`);
      return destino;
    } catch (err) {
      // rename falha entre volumes — tenta copy+unlink
      await fs.copyFile(caminhoOrigem, destino);
      await fs.unlink(caminhoOrigem);
      return destino;
    }
  }

  /** Move para enviados/YYYY-MM/ (padrao de auditoria ADR-119) */
  async moverParaEnviados(
    caminhoOrigem: string,
    competencia: string | null,
  ): Promise<string> {
    const ym =
      competencia && /^\d{4}-\d{2}$/.test(competencia)
        ? competencia
        : this.ymAtual();
    return this.mover(caminhoOrigem, { subpasta: path.join('enviados', ym) });
  }

  async moverParaPendentes(caminho: string): Promise<string> {
    return this.mover(caminho, { subpasta: 'pendentes' });
  }

  async moverParaRejeitados(caminho: string): Promise<string> {
    return this.mover(caminho, { subpasta: 'rejeitados' });
  }

  async moverParaErros(caminho: string): Promise<string> {
    return this.mover(caminho, { subpasta: 'erros' });
  }

  private nomeUnico(name: string, ext: string, dir: string): string {
    let candidato = `${name}${ext}`;
    let counter = 1;
    while (fsSyncExists(path.join(dir, candidato))) {
      candidato = `${name}_${counter}${ext}`;
      counter++;
      if (counter > 9999) throw new Error('Muitos arquivos com mesmo nome');
    }
    return candidato;
  }

  private ymAtual(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  }
}

function fsSyncExists(p: string): boolean {
  try {
    require('fs').accessSync(p);
    return true;
  } catch {
    return false;
  }
}