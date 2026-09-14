// ============================================================================
// SPRINT F13 + F15 + F17 + F18-A — ArquivoFilaService
// ----------------------------------------------------------------------------
// Coração da fila de aprovação humana.
//
// 🆕 F18-A: registrarDetecao() recebe companyId como parâmetro obrigatório
//           (resolvido pelo WatchFolderService via slug da pasta).
//           Remove o fallback `company.findFirst()` — isolamento total por tenant.
//
// Fluxo: WatchFolder detecta → este service faz parsing → busca cliente
// → grava na fila com status apropriado:
//   ERRO                  → sem CNPJ no nome        → pasta erros/
//   SEM_CLIENTE           → CNPJ ok, cliente não    → pasta pendentes/
//   SEM_EMAIL             → cliente ok, sem email   → pasta pendentes/
//   AGUARDANDO_APROVACAO  → tudo ok, humano aprova  → pasta pendentes/
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

export interface FiltroArquivoFila {
  status?: StatusArquivoFila;
  companyId?: string; // 🆕 F18-A: filtro por tenant
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
   * Pipeline completo de um arquivo recém-detectado na pasta monitorada.
   *
   * 🆕 F18-A: recebe companyId como parâmetro obrigatório
   *           (resolvido pelo WatchFolderService via slug da pasta).
   *
   * 1. Valida o companyId (tenant ADR-004)
   * 2. Extrai metadados do nome (CNPJ + tipo + competência) — ADR-118
   * 3. Detecta MIME pela extensão
   * 4. Evita duplicidade (caminho já registrado)
   * 5. Busca o cliente pelo CNPJ (comparação NORMALIZADA — Bug B)
   * 6. Resolve o email (ClientContact — Sprint F12)
   * 7. Grava ArquivoFila + move o arquivo para a pasta de destino
   */
  async registrarDetecao(
    caminhoAbsoluto: string,
    tamanhoBytes: number,
    companyId: string, // 🆕 F18-A: obrigatório (vem do WatchFolderService)
  ) {
    // ── 0. Validação do tenant (ADR-004) ──────────────────────────────────
    if (!companyId) {
      this.logger.error(
        `❌ companyId não fornecido para: ${caminhoAbsoluto}`,
      );
      await this.fileMover.moverParaErros(caminhoAbsoluto).catch(() => null);
      return;
    }

    const companyExiste = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!companyExiste) {
      this.logger.error(
        `❌ companyId inválido (${companyId}) para: ${caminhoAbsoluto}`,
      );
      await this.fileMover.moverParaErros(caminhoAbsoluto).catch(() => null);
      return;
    }

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

    // ── 3. Anti-duplicidade: mesmo caminho já processado? ──────────────────
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
          companyId,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          status: StatusArquivoFila.ERRO,
          erro: 'CNPJ não detectado no nome do arquivo',
        },
      });
      await this.fileMover.moverParaErros(caminhoAbsoluto);
      this.logger.warn(`❌ CNPJ não detectado → erros/ (${fila.id})`);
      return;
    }

    // ── 4. Busca do cliente pelo CNPJ (filtrado por companyId — 🆕 F18-A) ──
    // 🐛 BUG B — CORREÇÃO BLINDADA:
    // O CNPJ pode estar gravado no banco COM pontuação ou SEM pontuação.
    // Normalizamos AMBOS os lados (só dígitos) antes de comparar.
    const cnpjLimpo = meta.cnpj.replace(/\D/g, '');
    const clientesDaCompany = await this.prisma.client.findMany({
      where: { companyId }, // 🆕 F18-A: isolado por tenant
      select: { id: true, cnpj: true, companyName: true },
    });
    const cliente =
      clientesDaCompany.find(
        (c) => (c.cnpj ?? '').replace(/\D/g, '') === cnpjLimpo,
      ) ?? null;

    if (cliente) {
      this.logger.debug(
        `🔗 Match CNPJ: arquivo=${cnpjLimpo} | banco=${cliente.cnpj}`,
      );
    }

    // ── CASO 2: CNPJ válido mas cliente não cadastrado → SEM_CLIENTE ───────
    if (!cliente) {
      const fila = await this.prisma.arquivoFila.create({
        data: {
          companyId,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          cnpjDetectado: meta.cnpj,
          confianca: 0.3,
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

    // ── 5. Resolução do email do cliente (ClientContact — Sprint F12) ──────
    const email = await this.resolverEmailCliente(cliente.id, companyId);

    // ── CASO 3: Cliente existe mas sem email → SEM_EMAIL ───────────────────
    if (!email) {
      const fila = await this.prisma.arquivoFila.create({
        data: {
          companyId,
          nomeOriginal,
          caminhoAbsoluto,
          tamanhoBytes,
          mime,
          cnpjDetectado: meta.cnpj,
          clienteId: cliente.id,
          confianca: 0.7,
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

    // ── CASO 4: Tudo ok → AGUARDANDO_APROVACAO (ADR-030) ──────────────────
    const fila = await this.prisma.arquivoFila.create({
      data: {
        companyId,
        nomeOriginal,
        caminhoAbsoluto,
        tamanhoBytes,
        mime,
        cnpjDetectado: meta.cnpj,
        clienteId: cliente.id,
        clienteEmail: email,
        confianca: 1.0,
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
  private async resolverEmailCliente(
    clienteId: string,
    companyId: string,
  ): Promise<string | null> {
    const primario = await this.prisma.clientContact.findFirst({
      where: {
        companyId,
        clientId: clienteId,
        isPrimary: true,
        email: { not: null },
      },
    });
    if (primario?.email) return primario.email;

    const qualquer = await this.prisma.clientContact.findFirst({
      where: { companyId, clientId: clienteId, email: { not: null } },
    });
    if (qualquer?.email) return qualquer.email;

    return null;
  }

  // --------------------------------------------------------------------------
  // LISTAGEM (com filtros + paginação — 🆕 F18-A: filtro por companyId)
  // --------------------------------------------------------------------------
  async listar(filtro: FiltroArquivoFila) {
    const { status, companyId, page = 1, perPage = 20 } = filtro;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (status) where.status = status;
    if (companyId) where.companyId = companyId; // 🆕 F18-A

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
  // DETALHE + PREVIEW (ADR-117)
  // --------------------------------------------------------------------------
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

  private async montarPreview(fila: any) {
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
  async aprovar(id: string, dto: AprovarArquivoDto, usuarioId: string) {
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    if (fila.status !== StatusArquivoFila.AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Arquivo não está apto para aprovação (status: ${fila.status})`,
      );
    }

    return this.emailEnvio.processarAprovacao(id, dto, usuarioId);
  }

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
  async rejeitar(id: string, motivo: string) {
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    await this.prisma.arquivoFila.update({
      where: { id },
      data: {
        status: StatusArquivoFila.REJEITADO,
        motivoRejeicao: motivo,
      },
    });

    try {
      // FIX F15-2: localiza o caminho REAL antes de mover
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
  // VÍNCULO MANUAL
  // --------------------------------------------------------------------------
  async vincularCliente(id: string, dto: VincularClienteDto) {
    const fila = await this.prisma.arquivoFila.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException('Arquivo não encontrado');

    const cliente = await this.prisma.client.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

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
        cnpjDetectado: fila.cnpjDetectado ?? (cliente as any).cnpj,
        confianca: 1.0,
        status: StatusArquivoFila.AGUARDANDO_APROVACAO,
        erro: null,
      },
    });

    return { ok: true };
  }
}