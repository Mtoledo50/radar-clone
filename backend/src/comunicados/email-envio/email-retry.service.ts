// ============================================================================
// SPRINT F17-A — EmailRetryService
// ----------------------------------------------------------------------------
// Retry automatico de envios FALHOU + reenvio manual.
//
// Regras:
//   - CRON a cada 30s busca FALHOU com tentativas < 3 e proximoRetryEm vencido
//   - Backoff exponencial entre tentativas: 1min -> 5min -> 25min
//   - Reenvio MANUAL ignora backoff e limite (humano no comando)
//   - Email ENVIADO nunca e reenviado (anti-duplicidade)
//   - Cada tentativa grava evento ENVIADO/FALHA com tentativa + origem
//
// FIX F17-A-TS: metadata do provider.enviar() conforma com a interface
// EnviarEmailInput ({ envioId, companyId }) — campos extras via cast.
// ============================================================================
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusEnvio, TipoEventoEmail } from '@prisma/client';
import { EmailProviderFactory } from '../email-provider/email-provider.factory';
import { FileMoverService } from '../file-mover/file-mover.service';
import { existsSync } from 'fs';

// Backoff exponencial em minutos, indexado por (tentativa - 1)
const BACKOFF_MIN = [1, 5, 25];
// Total maximo de tentativas automaticas (envio original + 2 retries)
const MAX_TENTATIVAS = 3;

@Injectable()
export class EmailRetryService {
  private readonly logger = new Logger(EmailRetryService.name);
  // Trava anti-sobreposicao: se um ciclo ainda roda, o proximo espera
  private executando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: EmailProviderFactory,
    private readonly fileMover: FileMoverService,
  ) {}

  // --------------------------------------------------------------------------
  // CRON: fila de retry automatico (a cada 30 segundos)
  // --------------------------------------------------------------------------
  @Cron('*/30 * * * * *')
  async processarFilaRetry() {
    if (this.executando) return; // ciclo anterior ainda rodando
    this.executando = true;
    try {
      const agora = new Date();
      const pendentes = await this.prisma.emailEnvio.findMany({
        where: {
          status: StatusEnvio.FALHOU,
          tentativas: { lt: MAX_TENTATIVAS },
          OR: [{ proximoRetryEm: null }, { proximoRetryEm: { lte: agora } }],
        },
        orderBy: { createdAt: 'asc' },
        take: 10, // lote pequeno: nao sufoca o SMTP
      });

      if (pendentes.length === 0) return;
      this.logger.log(`Retry CRON: ${pendentes.length} envio(s) na fila`);

      for (const envio of pendentes) {
        try {
          await this.executarTentativa(envio.id, 'CRON');
        } catch (err: any) {
          this.logger.error(`Retry CRON falhou p/ ${envio.id}: ${err.message}`);
        }
      }
    } finally {
      this.executando = false;
    }
  }

  // --------------------------------------------------------------------------
  // REENVIO MANUAL (botao na tela) — ignora backoff e limite
  // --------------------------------------------------------------------------
  async reenviarManual(envioId: string) {
    return this.executarTentativa(envioId, 'MANUAL');
  }

  // --------------------------------------------------------------------------
  // NUCLEO: executa UMA tentativa de envio (usada por CRON e MANUAL)
  // --------------------------------------------------------------------------
  async executarTentativa(envioId: string, origem: 'CRON' | 'MANUAL') {
    const envio = await this.prisma.emailEnvio.findUnique({
      where: { id: envioId },
    });
    if (!envio) throw new NotFoundException('Envio nao encontrado');

    // Anti-duplicidade: email ja entregue nunca e reenviado
    if (envio.status === StatusEnvio.ENVIADO) {
      throw new ConflictException('Email ja foi enviado com sucesso.');
    }

    // ── Resolve o anexo pelo ArquivoFila vinculado (caminho real no disco) ──
    let anexos: { nome: string; caminho: string }[] = [];
    const fila = await this.prisma.arquivoFila.findFirst({
      where: { envioId },
    });
    if (fila) {
      const caminhoReal = await this.fileMover.resolverCaminhoAtual(
        fila.caminhoAbsoluto,
        fila.nomeOriginal,
      );
      if (existsSync(caminhoReal)) {
        anexos = [{ nome: fila.nomeOriginal, caminho: caminhoReal }];
      } else {
        this.logger.warn(`Anexo nao localizado p/ ${envioId}: ${caminhoReal}`);
      }
    }

    const tentativa = envio.tentativas + 1;
    this.logger.log(
      `Tentativa ${tentativa} (${origem}) p/ ${envioId} -> ${envio.emailDestinatario}`,
    );

    // ── Envia pelo provider configurado (corpo/assunto ja renderizados) ────
    const provider = this.providerFactory.getProvider();
    const resultado = await provider.enviar({
      para: envio.emailDestinatario,
      assunto: envio.assunto,
      corpoHtml: envio.corpoHtml,
      anexos,
      // FIX F17-A-TS: a interface EnviarEmailInput so declara
      // { envioId, companyId } — tentativa/origem entram via cast e
      // aparecem apenas no log do provider. A auditoria oficial
      // (tentativa/origem) fica no EmailEvento (campo Json).
      metadata: {
        envioId: envio.id,
        companyId: envio.companyId,
        tentativa,
        origem,
      } as any,
    });

    // ── SUCESSO ─────────────────────────────────────────────────────────────
    if (resultado.sucesso) {
      await this.prisma.emailEvento.create({
        data: {
          envioId,
          tipo: TipoEventoEmail.ENVIADO,
          metadata: {
            provider: provider.nome,
            tentativa,
            origem,
            providerMessageId: resultado.providerMessageId,
          } as any,
        },
      });
      await this.prisma.emailEnvio.update({
        where: { id: envioId },
        data: {
          status: StatusEnvio.ENVIADO,
          enviadoEm: new Date(),
          tentativas: tentativa,
          ultimoErro: null,
          proximoRetryEm: null,
        },
      });
      // Sincroniza a fila (se o arquivo estava marcado como ERRO)
      if (fila && fila.status !== 'ENVIADO') {
        await this.prisma.arquivoFila.update({
          where: { id: fila.id },
          data: { status: 'ENVIADO', envioId },
        });
      }
      this.logger.log(
        `Envio ${envioId} recuperado na tentativa ${tentativa} (${origem})`,
      );
      return { ok: true, tentativa, origem };
    }

    // ── FALHA: agenda proximo retry com backoff ─────────────────────────────
    const backoff = BACKOFF_MIN[Math.min(tentativa - 1, BACKOFF_MIN.length - 1)];
    const proximoRetryEm = new Date(Date.now() + backoff * 60 * 1000);

    await this.prisma.emailEvento.create({
      data: {
        envioId,
        tipo: TipoEventoEmail.FALHA,
        metadata: {
          provider: provider.nome,
          tentativa,
          origem,
          erro: resultado.erro,
        } as any,
      },
    });
    await this.prisma.emailEnvio.update({
      where: { id: envioId },
      data: {
        status: StatusEnvio.FALHOU,
        tentativas: tentativa,
        ultimoErro: resultado.erro,
        // So agenda retry automatico se ainda houver tentativas restantes
        proximoRetryEm: tentativa < MAX_TENTATIVAS ? proximoRetryEm : null,
      },
    });
    this.logger.warn(
      `Tentativa ${tentativa} (${origem}) falhou p/ ${envioId}: ${resultado.erro}`,
    );
    return { ok: false, tentativa, origem, erro: resultado.erro, proximoRetryEm };
  }
}