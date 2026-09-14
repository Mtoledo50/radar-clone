// ============================================================================
// SPRINT F13 + F18-A — WatchFolderService (Multi-tenant — ADR-004)
// ----------------------------------------------------------------------------
// Monitora pasta raiz (WATCH_FOLDER_PATH) e subpastas recursivamente.
//
// 🆕 F18-A: Detecta companyId pelo nome da subpasta (= company.slug).
//
// Estrutura suportada:
//   <raiz>/arquivo.pdf                  → fallback (primeira company)
//   <raiz>/<slug>/arquivo.pdf           → companyId pelo slug
//   <raiz>/<slug>/subpasta/.../arq.pdf  → recursivo, mesmo slug
//
// Integração:
//   chokidar detecta → extrai slug → valida company → lê tamanho (fs.stat)
//   → chama fila.registrarDetecao(caminho, tamanho, companyId)
// ============================================================================
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { stat } from 'fs/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { ArquivoFilaService } from '../arquivo-fila/arquivo-fila.service';
import { FileMoverService } from '../file-mover/file-mover.service';

@Injectable()
export class WatchFolderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchFolderService.name);
  private watcher: chokidar.FSWatcher | null = null;
  private readonly pastaBase: string;
  private readonly habilitado: boolean;

  // 🆕 F18-A: Cache de slug → companyId (evita query a cada arquivo)
  private slugParaCompanyId = new Map<string, string>();
  private fallbackCompanyId: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly fila: ArquivoFilaService,
    private readonly fileMover: FileMoverService,
  ) {
    this.pastaBase =
      this.config.get<string>('WATCH_FOLDER_PATH') ??
      path.join(process.cwd(), 'data', 'enviar');
    this.habilitado =
      this.config.get<string>('WATCH_FOLDER_ENABLED', 'true') === 'true';
  }

  async onModuleInit() {
    if (!this.habilitado) {
      this.logger.warn('⚠️  Watch Folder DESABILITADO (WATCH_FOLDER_ENABLED=false)');
      return;
    }
    await this.fileMover.garantirEstrutura();
    await this.carregarCacheDeSlugs();
    await this.iniciarWatcher();
  }

  async onModuleDestroy() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * 🆕 F18-A: Carrega todos os slugs das companies ativas em memória.
   * Usa company.slug se existir, senão normaliza company.name.
   */
  private async carregarCacheDeSlugs() {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
    });
    this.slugParaCompanyId.clear();
    for (const c of companies) {
      // Fallback: se schema não tiver 'slug', usa name normalizado
      const slug = (c as any).slug ?? this.normalizarSlug(c.name);
      this.slugParaCompanyId.set(slug, c.id);
      this.logger.debug(`🔗 Slug mapeado: "${slug}" → company ${c.id} (${c.name})`);
    }
    this.fallbackCompanyId = companies[0]?.id ?? null;
    this.logger.log(
      `📋 Cache de slugs carregado: ${this.slugParaCompanyId.size} empresa(s)`,
    );
  }

  /**
   * Normaliza nome em slug: minúsculo, sem acentos, espaços/underscores → "-"
   */
  private normalizarSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]+/g, '-')      // não alnum vira "-"
      .replace(/^-+|-+$/g, '')          // trim de hifens
      .substring(0, 60);                // limite 60 chars
  }

  private async iniciarWatcher() {
    this.watcher = chokidar.watch(this.pastaBase, {
      ignored: [
        /(^|[/\\])\../,                // dotfiles
        /~\$/,                         // temporários Office
        /\.tmp$/i,
        /node_modules/,
      ],
      persistent: true,
      ignoreInitial: false,            // processa arquivos existentes no boot
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (caminhoAbsoluto) => this.processarNovoArquivo(caminhoAbsoluto))
      .on('error', (err) => this.logger.error(`Watcher error: ${err.message}`))
      .on('ready', () => {
        this.logger.log(`👁️  Watch Folder ativo em: ${this.pastaBase} (multi-tenant)`);
      });
  }

  /**
   * 🆕 F18-A: Processa arquivo detectado, resolvendo companyId pelo caminho.
   */
  private async processarNovoArquivo(caminhoAbsoluto: string) {
    const nomeArquivo = path.basename(caminhoAbsoluto);

    // Ignora arquivos das subpastas internas do próprio sistema
    const caminhoRel = path.relative(this.pastaBase, caminhoAbsoluto);
    if (
      caminhoRel.startsWith('pendentes') ||
      caminhoRel.startsWith('enviados') ||
      caminhoRel.startsWith('erros') ||
      caminhoRel.startsWith('rejeitados')
    ) {
      return;
    }

    this.logger.log(`📄 Novo arquivo detectado: ${caminhoAbsoluto}`);

    // 🆕 F18-A: Resolve companyId pelo caminho
    const companyId = this.resolverCompanyIdDoCaminho(caminhoAbsoluto);
    if (!companyId) {
      this.logger.error(
        `❌ Não foi possível determinar companyId para: ${caminhoAbsoluto}`,
      );
      await this.fileMover.moverParaErros(caminhoAbsoluto).catch(() => null);
      return;
    }

    // 🆕 F18-A: Lê o tamanho do arquivo antes de processar
    let tamanhoBytes = 0;
    try {
      const st = await stat(caminhoAbsoluto);
      tamanhoBytes = st.size;
    } catch (err: any) {
      this.logger.warn(`Não foi possível ler tamanho: ${err.message}`);
    }

    try {
      // 🆕 F18-A: chamada adaptada ao método real do ArquivoFilaService
      await this.fila.registrarDetecao(caminhoAbsoluto, tamanhoBytes, companyId);
    } catch (err: any) {
      this.logger.error(`Falha ao processar ${nomeArquivo}: ${err.message}`);
      await this.fileMover.moverParaErros(caminhoAbsoluto).catch(() => null);
    }
  }

  /**
   * 🆕 F18-A: Extrai o slug do caminho e resolve o companyId.
   *   <raiz>/arquivo.pdf                  → fallbackCompanyId
   *   <raiz>/<slug>/arquivo.pdf           → slugParaCompanyId.get(slug)
   *   <raiz>/<slug>/sub/.../arquivo.pdf   → slugParaCompanyId.get(slug)
   */
  private resolverCompanyIdDoCaminho(caminhoAbsoluto: string): string | null {
    const caminhoRel = path
      .relative(this.pastaBase, caminhoAbsoluto)
      .replace(/\\/g, '/'); // normaliza separador
    const partes = caminhoRel.split('/');

    // Arquivo direto na raiz → fallback
    if (partes.length === 1) {
      if (!this.fallbackCompanyId) {
        this.logger.warn('⚠️  Nenhum company cadastrado para fallback');
      }
      return this.fallbackCompanyId;
    }

    // Primeira parte do caminho = slug da empresa
    const slug = partes[0];
    const companyId = this.slugParaCompanyId.get(slug);
    if (!companyId) {
      this.logger.warn(`⚠️  Slug "${slug}" não encontrado em nenhuma company ativa`);
    }
    return companyId ?? null;
  }

  /**
   * Recarrega cache de slugs (útil após criar nova empresa).
   */
  async recarregarCache() {
    await this.carregarCacheDeSlugs();
  }

  /**
   * Status do watcher (para healthcheck/API).
   */
  getStatus() {
    return {
      habilitado: this.habilitado,
      pastaBase: this.pastaBase,
      companies: Array.from(this.slugParaCompanyId.entries()).map(
        ([slug, id]) => ({ slug, companyId: id }),
      ),
      fallbackCompanyId: this.fallbackCompanyId,
      totalCompanies: this.slugParaCompanyId.size,
    };
  }
}