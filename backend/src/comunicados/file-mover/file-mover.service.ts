// backend/src/comunicados/file-mover/file-mover.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MoverOptions {
  subpasta?: string; // ex: '2026-09' ou 'erros' ou 'rejeitados'
  sufixo?: string;   // para evitar colisão
}

@Injectable()
export class FileMoverService {
  private readonly logger = new Logger(FileMoverService.name);
  private readonly pastaBase: string;

  constructor(private readonly config: ConfigService) {
    this.pastaBase = this.config.get<string>('WATCH_FOLDER_PATH')
      ?? path.join(process.cwd(), 'data', 'enviar');
  }
/**
 * F15 — Localiza o caminho REAL do arquivo.
 * O caminhoAbsoluto gravado no banco pode ficar desatualizado (o arquivo
 * já foi movido para pendentes/, erros/, etc.). Este método verifica os
 * candidatos em ordem e retorna o primeiro que existe no disco.
 */
async resolverCaminhoAtual(
  caminhoAbsoluto: string,
  nomeOriginal: string,
): Promise<string> {
  const base =
    this.config.get<string>('WATCH_FOLDER_PATH') ?? 'C:\\Documentos\\Enviar';

  const candidatos = [
    caminhoAbsoluto,
    require('path').join(base, 'pendentes', nomeOriginal),
    require('path').join(base, 'erros', nomeOriginal),
    require('path').join(base, 'rejeitados', nomeOriginal),
    require('path').join(base, nomeOriginal),
  ];

  for (const candidato of candidatos) {
    try {
      await fs.access(candidato);
      return candidato; // achou!
    } catch {
      // não existe aqui — tenta o próximo
    }
  }
  return caminhoAbsoluto; // não achou em lugar nenhum — erro será tratado depois
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
   * Se já existir arquivo com mesmo nome, adiciona sufixo numérico.
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

  /**
   * Move para enviados/YYYY-MM/ (padrão de auditoria ADR-119)
   */
  async moverParaEnviados(caminhoOrigem: string, competencia: string | null): Promise<string> {
    const ym = competencia && /^\d{4}-\d{2}$/.test(competencia)
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
    // Verificação síncrona simples — para nomes de arquivo únicos em pasta local
    // o risco de colisão durante o fs.existsSync é desprezível
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