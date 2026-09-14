// ============================================================================
// SPRINT F13 — MÓDULO COMUNICADOS (ADR-113, ADR-117, ADR-118)
// ArquivoFilaService: coração da fila de aprovação humana.
//
// Fluxo: WatchFolder detecta arquivo → este service faz o parsing (CNPJ,
// tipo, competência), busca o cliente no banco, resolve o email e grava o
// registro na fila com o status apropriado:
//   ERRO                  → sem CNPJ no nome        → pasta erros/
//   SEM_CLIENTE           → CNPJ ok, cliente não    → pasta pendentes/
//   SEM_EMAIL             → cliente ok, sem email   → pasta pendentes/
//   AGUARDANDO_APROVACAO  → tudo ok, humano aprova  → pasta pendentes/
//
// Integração com Bloco 3: o método aprovar() delega para EmailEnvioService
// que orquestra o pipeline completo de envio (ADR-030, ADR-114, ADR-119).
// ============================================================================
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusArquivoFila, TipoDocumentoComunicado } from '@prisma/client';
import { MetadadosArquivoService } from '../cnpj-parser/metadados-arquivo.service';
import { FileMoverService } from '../file-mover/file-mover.service';
import { AprovarArquivoDto } from './dto/aprovar-arquivo.dto';
import { VincularClienteDto } from './dto/vincular-cliente.dto';
import { EmailEnvioService } from '../email-envio/email-envio.service';

// Nota: import de 'fs/promises' removido — não era utilizado neste service
// (quem move arquivos é o FileMoverService).

export interface FiltroArquivoFila {
  status?: StatusArquivoFila;
  page?: number;
  perPage?: number;
}

@Injectable()
export class ArquivoFilaService {
  private readonly logger = new Logger(ArquivoFilaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metadados: MetadadosArquivoService,
    private readonly fileMover: FileMoverService,
    private readonly emailEnvio: EmailEnvioService,
  ) {}

  // --------------------------------------------------------------------------
  // REGISTRO DE DETECÇÃO (chamado pelo WatchFolderService)
  // --------------------------------------------------------------------------
  /**
   * Pipeline completo de um arquivo recém-detectado na pasta monitorada:
   * 1. Extrai metadados do nome (CNPJ + tipo + competência) — ADR-118
   * 2. Detecta MIME pela extensão
   * 3. Resolve o tenant (companyId) — ADR-004
   * 4. Evita duplicidade (caminho já registrado)
   * 5. Busca o cliente pelo CNPJ (comparação NORMALIZADA — ver Bug B)
   * 6. Resolve o email (ClientContact — Sprint F12)
   * 7. Grava ArquivoFila + move o arquivo para a pasta de destino
   */
  async registrarDetecao(caminhoAbsoluto: string, tamanhoBytes: number) {
    // ── 1. Metadados do nome do arquivo ────────────────────────────────────
    const nomeOriginal = caminhoAbsoluto.split(/[/\\]/).pop()!;
    const meta = this.metadados.extrair(nomeOriginal);

    this.logger.log(
      `🔎 Metadados: CNPJ=${meta.cnpj ?? 'N/A'} | ` +
        `tipo=${meta.tipoDocumento} | comp=${meta.competencia ?? 'N/A'}`,
    );

    // ── 2. MIME type básico pela extensão ──────────────────────────────────
    const ext = nomeOriginal.split('.').pop()?.toLowerCase() ?? '';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      txt: 'text/plain',
      zip: 'application/zip',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mime = mimeMap[ext] ?? 'application/octet-stream';

    // ── 3. Tenant (multi-tenant ADR-004) ────────────────────────────────────
    // TODO(produção): companyId deve vir do contexto do watcher (uma pasta
    // por tenant). Hoje usamos a primeira company (ambiente single-tenant dev).
    const company = await this.prisma.company.findFirst();
    if (!company) {
      this.logger.error('❌ Nenhuma company cadastrada no banco');
      return;
    }

    // ── 4. Anti-duplicidade: mesmo caminho já processado? ──────────────────
    const existente = await this.prisma.arquivoFila.findUnique({
      where: { caminhoAbsoluto },
    });
    if (existente) {
      this.logger.warn(`Arquivo já registrado: ${caminhoAbsoluto}`);
      return;
    }

    // ── CASO 1: Sem CNPJ no nome → ERRO + pasta erros/ ─────────────────────
    if (!meta.cnpj) {
      const fila = await this.prisma.arquivoFila.create({
        data: {
          companyId: company.id,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          status: StatusArquivoFila.ERRO,
          erro: 'CNPJ não detectado no nome do arquivo',
        },
      });
      await this.fileMover.moverParaErros(caminhoAbsoluto);
      this.logger.warn(`❌ CNPJ não detectado → movido para erros/ (${fila.id})`);
      return;
    }

    // ── 5. Busca do cliente pelo CNPJ ───────────────────────────────────────
    // 🐛 BUG B — CORREÇÃO BLINDADA:
    // O CNPJ pode estar gravado no banco COM pontuação ("08.432.644/0001-60",
    // origem: importador S3D da UI) ou SEM pontuação ("08432644000160",
    // origem: script ts-node). Comparação de string bruta falhava.
    // Solução: normalizamos AMBOS os lados (só dígitos) antes de comparar.
    const cnpjLimpo = meta.cnpj.replace(/\D/g, '');
    const clientesDaCompany = await this.prisma.client.findMany({
      where: { companyId: company.id },
      select: { id: true, cnpj: true, companyName: true },
    });
    const cliente =
      clientesDaCompany.find(
        (c) => (c.cnpj ?? '').replace(/\D/g, '') === cnpjLimpo,
      ) ?? null;

    // Log de diagnóstico: mostra o formato gravado no banco (ajuda a auditar
    // qual importador populou o registro)
    if (cliente) {
      this.logger.debug(
        `🔗 Match CNPJ: arquivo=${cnpjLimpo} | banco=${cliente.cnpj}`,
      );
    }

    // ── CASO 2: CNPJ válido mas cliente não cadastrado → SEM_CLIENTE ───────
    if (!cliente) {
      const fila = await this.prisma.arquivoFila.create({
        data: {
          companyId: company.id,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          cnpjDetectado: meta.cnpj,
          confianca: 0.3, // CNPJ ok, mas sem vínculo → confiança parcial
          tipoDocumento: meta.tipoDocumento,
          competencia: meta.competencia,
          status: StatusArquivoFila.SEM_CLIENTE,
          erro: `Cliente com CNPJ ${meta.cnpj} não encontrado`,
        },
      });
      await this.fileMover.moverParaPendentes(caminhoAbsoluto);
      this.logger.warn(`⚠️  Cliente não encontrado → pendentes/ (${fila.id})`);
      return;
    }

    // ── 6. Resolução do email do cliente (ClientContact — Sprint F12) ──────
    const email = await this.resolverEmailCliente(cliente.id, company.id);

    // ── CASO 3: Cliente existe mas sem email → SEM_EMAIL ───────────────────
    if (!email) {
      const fila = await this.prisma.arquivoFila.create({
        data: {
          companyId: company.id,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          cnpjDetectado: meta.cnpj,
          clienteId: cliente.id,
          confianca: 0.7, // cliente ok, falta email
          tipoDocumento: meta.tipoDocumento,
          competencia: meta.competencia,
          status: StatusArquivoFila.SEM_EMAIL,
          erro: 'Cliente encontrado mas sem email cadastrado',
        },
      });
      await this.fileMover.moverParaPendentes(caminhoAbsoluto);
      this.logger.warn(`⚠️  Cliente sem email → pendentes/ (${fila.id})`);
      return;
    }

    // ── CASO 4: Tudo ok → AGUARDANDO_APROVACAO (ADR-030: humano decide) ────
    const fila = await this.prisma.arquivoFila.create({
      data: {
        companyId: company.id,
        nomeOriginal,
        caminhoAbsoluto,
        tamanhoBytes,
        mime,
        cnpjDetectado: meta.cnpj,
        clienteId: cliente.id,
        clienteEmail: email,
        confianca: 1.0, // CNPJ + cliente + email = confiança total
        tipoDocumento: meta.tipoDocumento,
        competencia: meta.competencia,
        status: StatusArquivoFila.AGUARDANDO_APROVACAO,
      },
    });
    await this.fileMover.moverParaPendentes(caminhoAbsoluto);
    this.logger.log(
      `✅ Cliente encontrado: ${cliente.companyName} (${email}) → fila (${fila.id})`,
    );
  }

  // --------------------------------------------------------------------------
  // RESOLUÇÃO DE EMAIL DO CLIENTE
  // --------------------------------------------------------------------------
  /**
   * Resolve o email de destino buscando em ClientContact (Sprint F12).
   * Ordem de precedência:
   *   1. Contato marcado como primário (isPrimary) que tenha email
   *   2. Qualquer contato do cliente que tenha email
   * Obs.: a model Client NÃO possui campo email direto — emails vivem
   * exclusivamente em ClientContact.
   */
  private async resolverEmailCliente(
    clienteId: string,
    companyId: string,
  ): Promise<string | null> {
    // 1. Contato primário com email
    const primario = await this.prisma.clientContact.findFirst({
      where: {
        companyId,
        clientId: clienteId,
        isPrimary: true,
        email: { not: null },
      },
    });
    if (primario?.email) return primario.email;

    // 2. Qualquer contato com email
    const qualquer = await this.prisma.clientContact.findFirst({
      where: { companyId, clientId: clienteId, email: { not: null } },
    });
    if (qualquer?.email) return qualquer.email;

    // 3. Sem email cadastrado em nenhum contato
    return null;
  }

  // --------------------------------------------------------------------------
  // LISTAGEM (com filtros + paginação padrão do projeto)
  // --------------------------------------------------------------------------
  /**
   * Lista a fila com filtro opcional por status e paginação.
   * Retorna { data, meta } no padrão de paginação da API (docs/API.md §2.4).
   */
  async listar(filtro: FiltroArquivoFila) {
    const { status, page = 1, perPage = 20 } = filtro;
    const skip = (page - 1) * perPage;

    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.arquivoFila.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.arquivoFila.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  // --------------------------------------------------------------------------
  // DETALHE + PREVIEW (para a tela de aprovação humana — ADR-117)
  // --------------------------------------------------------------------------
  /**
   * Detalhe completo do arquivo na fila, incluindo o PREVIEW do email que
   * será enviado. O humano vê exatamente o que vai sair antes de aprovar.
   */
  async detalhe(id: string) {
    const fila = await this.prisma.arquivoFila.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    if (!fila) throw new NotFoundException('Arquivo não encontrado na fila');

    const preview = await this.montarPreview(fila);
    return { ...fila, previewEmail: preview };
  }

  /**
   * Monta o preview do email SEM gravar nada.
   * Resolução de template (ADR-115): tipoDocumento exato → GENERICO → fallback.
   */
  private async montarPreview(fila: any) {
    // Template específico do tipo de documento (ex: DAS)
    const template = fila.tipoDocumento
      ? await this.prisma.emailTemplate.findUnique({
          where: {
            companyId_tipoDocumento: {
              companyId: fila.companyId,
              tipoDocumento: fila.tipoDocumento,
            },
          },
        })
      : null;

    // Fallback: template GENERICO ativo do tenant
    const templateFallback =
      template ??
      (await this.prisma.emailTemplate.findFirst({
        where: {
          companyId: fila.companyId,
          tipoDocumento: TipoDocumentoComunicado.GENERICO,
          ativo: true,
        },
      }));

    const assunto =
      templateFallback?.assunto ?? `Documento ${fila.nomeOriginal}`;
    const corpoHtml =
      templateFallback?.corpoHtml ?? `<p>Segue anexo: ${fila.nomeOriginal}</p>`;

    return {
      assunto,
      corpoHtml,
      anexos: [{ nome: fila.nomeOriginal, tamanhoBytes: fila.tamanhoBytes }],
    };
  }

  // --------------------------------------------------------------------------
  // APROVAÇÃO HUMANA (ADR-030 / ADR-117)
  // --------------------------------------------------------------------------
  /**
   * Aprova o envio. Regra de Ouro ADR-030: NADA é enviado sem esta chamada.
   * Delega o pipeline completo para o EmailEnvioService:
   *   1. Cria EmailEnvio (AGENDADO)
   *   2. Renderiza template Handlebars
   *   3. Injeta pixel de tracking
   *   4. Gera token de download + expiração
   *   5. Move arquivo para enviados/YYYY-MM/
   *   6. Envia via provider (LOG/SMTP/SendGrid)
   *   7. Grava evento ENVIADO ou FALHA
   */
  async aprovar(id: string, dto: AprovarArquivoDto, usuarioId: string) {
    // ── Validação prévia: só pode aprovar quem está AGUARDANDO_APROVACAO ──
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    if (fila.status !== StatusArquivoFila.AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Arquivo não está apto para aprovação (status: ${fila.status})`,
      );
    }

    // ── BLOCO 3 ATIVO: delega para EmailEnvioService ───────────────────────
    return this.emailEnvio.processarAprovacao(id, dto, usuarioId);
  }

  /**
   * Aprovação em lote. Falhas individuais NÃO abortam o lote:
   * cada item retorna status ok/erro com motivo (parcial é aceitável).
   */
  async aprovarLote(ids: string[], usuarioId: string) {
    const resultados: { id: string; status: 'ok' | 'erro'; motivo?: string }[] =
      [];

    for (const id of ids) {
      try {
        await this.aprovar(id, {}, usuarioId);
        resultados.push({ id, status: 'ok' });
      } catch (err: any) {
        resultados.push({ id, status: 'erro', motivo: err.message });
      }
    }

    return {
      aprovados: resultados.filter((r) => r.status === 'ok').length,
      falhas: resultados.filter((r) => r.status === 'erro'),
    };
  }

  // --------------------------------------------------------------------------
  // REJEIÇÃO (ADR-030: motivo obrigatório)
  // --------------------------------------------------------------------------
  /**
   * Rejeita o arquivo com motivo obrigatório e move para rejeitados/.
   * Falha ao mover o arquivo NÃO invalida a rejeição (loga warning).
   */
  async rejeitar(id: string, motivo: string) {
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    // Grava a rejeição + motivo (auditoria ADR-030)
    await this.prisma.arquivoFila.update({
      where: { id },
      data: {
        status: StatusArquivoFila.REJEITADO,
        motivoRejeicao: motivo,
      },
    });

    try {
      // 🔧 FIX F15-2: localiza o caminho REAL do arquivo antes de mover.
      // O caminhoAbsoluto do banco pode estar desatualizado (o arquivo já
      // foi movido para pendentes/ durante a detecção).
      const caminhoReal = await this.fileMover.resolverCaminhoAtual(
        fila.caminhoAbsoluto,
        fila.nomeOriginal,
      );
      await this.fileMover.moverParaRejeitados(caminhoReal);
    } catch (err) {
      this.logger.warn(`Falha ao mover para rejeitados: ${err}`);
    }

    return { ok: true };
  }

  // --------------------------------------------------------------------------
  // VÍNCULO MANUAL (quando o parser não encontrou o cliente)
  // --------------------------------------------------------------------------
  /**
   * Vínculo manual arquivo ↔ cliente. Usado quando o CNPJ não foi detectado
   * ou não existe cliente para aquele CNPJ (status SEM_CLIENTE / ERRO).
   * Após vincular, o registro volta para AGUARDANDO_APROVACAO.
   */
  async vincularCliente(id: string, dto: VincularClienteDto) {
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    const cliente = await this.prisma.client.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    // Email: override manual > email resolvido dos contatos
    const email =
      dto.emailDestinatario ??
      (await this.resolverEmailCliente(cliente.id, fila.companyId));

    if (!email) {
      throw new ConflictException(
        'Cliente sem email. Informe emailDestinatario no body.',
      );
    }

    await this.prisma.arquivoFila.update({
      where: { id },
      data: {
        clienteId: cliente.id,
        clienteEmail: email,
        // Mantém o CNPJ detectado; se não havia, usa o do cliente (normalizado)
        cnpjDetectado: fila.cnpjDetectado ?? (cliente as any).cnpj,
        confianca: 1.0, // vínculo manual = confiança total
        status: StatusArquivoFila.AGUARDANDO_APROVACAO,
        erro: null, // limpa o erro anterior
      },
    });

    return { ok: true };
  }
}