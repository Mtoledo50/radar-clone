import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import { FSWatcher } from 'chokidar';
import * as fs from 'fs/promises';
import { ArquivoFilaService } from '../arquivo-fila/arquivo-fila.service';

export interface WatchFolderStatus {
  ativo: boolean;
  pasta: string;
  iniciadoEm: Date | null;
  arquivosDetectados: number;
  arquivosIgnorados: number;
}

@Injectable()
export class WatchFolderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchFolderService.name);
  private watcher: FSWatcher | null = null;
  private processados = new Set<string>();
  private iniciadoEm: Date | null = null;
  private arquivosDetectados = 0;
  private arquivosIgnorados = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly arquivoFilaService: ArquivoFilaService,
  ) {}

  async onModuleInit() {
    const enabled = this.config.get<string>('WATCH_FOLDER_ENABLED', 'true') === 'true';
    if (enabled) {
      // Pequeno delay para garantir que o Prisma está pronto
      await new Promise((r) => setTimeout(r, 2000));
      await this.iniciar();
    } else {
      this.logger.warn('⚠️  Watch Folder desabilitado (WATCH_FOLDER_ENABLED=false)');
    }
  }

  async onModuleDestroy() {
    await this.parar();
  }

  /**
   * Inicia o watcher na pasta configurada.
   * ADR-113: monitora pasta configurável, ignora temporários
   */
  async iniciar(): Promise<WatchFolderStatus> {
    if (this.watcher) {
      this.logger.warn('Watcher já está ativo');
      return this.status();
    }

    const pasta = this.config.get<string>('WATCH_FOLDER_PATH')
      ?? 'C:\\Documentos\\Enviar';

    try {
      await fs.mkdir(pasta, { recursive: true });
    } catch (err) {
      this.logger.error(`Não foi possível criar pasta ${pasta}: ${err}`);
      throw err;
    }

    const stabilityMs = parseInt(
      this.config.get<string>('WATCH_FOLDER_STABILITY_MS', '2000'), 10);

    this.watcher = chokidar.watch(pasta, {
      ignoreInitial: true,
      depth: 0, // só raiz (subpastas são de saída: enviados/erros/etc)
      ignored: [
        /(^|[\/\\])\../,                        // ocultos
        /~\$.*$/,                               // temporários Office/LibreOffice
        /\.(tmp|part|crdownload|download)$/i,   // downloads em andamento
        /\.lock$/i,                             // arquivos de lock
      ],
      awaitWriteFinish: {
        stabilityThreshold: stabilityMs,
        pollInterval: 200,
      },
    });

    this.watcher
      .on('add', (caminho) => this.aoDetectar(caminho))
      .on('error', (err) => this.logger.error(`Erro no watcher: ${err}`));

    this.iniciadoEm = new Date();
    this.logger.log(`👁️  Watch Folder ativo em: ${pasta}`);
    return this.status();
  }

  async parar(): Promise<WatchFolderStatus> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.iniciadoEm = null;
      this.logger.log('🛑 Watch Folder parado');
    }
    return this.status();
  }

  /**
   * Varredura manual — útil após restart do servidor para pegar arquivos
   * que estavam na pasta mas não dispararam evento 'add'.
   */
  async scanManual(): Promise<{ novos: number; ignorados: number }> {
    const pasta = this.config.get<string>('WATCH_FOLDER_PATH')
      ?? 'C:\\Documentos\\Enviar';

    let novos = 0;
    let ignorados = 0;

    try {
      const arquivos = await fs.readdir(pasta);
      for (const nome of arquivos) {
        const caminho = `${pasta}\\${nome}`;
        try {
          const stat = await fs.stat(caminho);
          if (!stat.isFile()) continue;

          // Ignora subpastas conhecidas
          if (['enviados', 'pendentes', 'rejeitados', 'erros'].includes(nome)) {
            ignorados++;
            continue;
          }

          const chave = `${caminho}:${stat.size}`;
          if (this.processados.has(chave)) {
            ignorados++;
            continue;
          }

          await this.aoDetectar(caminho);
          novos++;
        } catch (err) {
          this.logger.warn(`Erro ao processar ${nome}: ${err}`);
          ignorados++;
        }
      }
    } catch (err) {
      this.logger.error(`Erro na varredura manual: ${err}`);
    }

    return { novos, ignorados };
  }

  private async aoDetectar(caminho: string) {
    try {
      const stat = await fs.stat(caminho);
      const chave = `${caminho}:${stat.size}`;

      if (this.processados.has(chave)) {
        this.logger.debug(`Já processado: ${caminho}`);
        return;
      }

      this.processados.add(chave);
      this.arquivosDetectados++;

      this.logger.log(`📄 Novo arquivo detectado: ${caminho} (${stat.size} bytes)`);

      // Delega para o ArquivoFilaService que vai:
      // 1. Parsear CNPJ e metadados
      // 2. Buscar cliente no banco
      // 3. Gravar ArquivoFila com status apropriado
      // 4. Mover para pasta adequada (pendentes/erros)
      await this.arquivoFilaService.registrarDetecao(caminho, stat.size);
    } catch (err) {
      this.arquivosIgnorados++;
      this.logger.error(`Erro ao processar ${caminho}: ${err}`);
    }
  }

  status(): WatchFolderStatus {
    return {
      ativo: this.watcher !== null,
      pasta: this.config.get<string>('WATCH_FOLDER_PATH') ?? 'C:\\Documentos\\Enviar',
      iniciadoEm: this.iniciadoEm,
      arquivosDetectados: this.arquivosDetectados,
      arquivosIgnorados: this.arquivosIgnorados,
    };
  }

  /**
   * Limpa o set de processados (para testes).
   */
  resetProcessados(): void {
    this.processados.clear();
    this.arquivosDetectados = 0;
    this.arquivosIgnorados = 0;
  }
}