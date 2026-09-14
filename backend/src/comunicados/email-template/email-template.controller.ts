// ============================================================================
// SPRINT F16-A — EmailTemplateController (ADR-115)
// ----------------------------------------------------------------------------
// CRUD de templates de email + preview renderizado com dados de demonstracao.
//
// FIX F16-A-SCHEMA: Adicionado campo 'nome' (obrigatorio no schema Prisma).
// Fallback: se o frontend nao enviar 'nome', usa o 'tipoDocumento'.
// ============================================================================
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TipoDocumentoComunicado } from '@prisma/client';
import { EmailTemplateService } from './email-template.service';

@Controller('api/email-templates')
export class EmailTemplateController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: EmailTemplateService,
  ) {}

  // --------------------------------------------------------------------------
  // Helper: tenant atual (dev single-tenant)
  // --------------------------------------------------------------------------
  private async companyId(): Promise<string> {
    const company = await this.prisma.company.findFirst();
    if (!company) throw new NotFoundException('Nenhuma company cadastrada');
    return company.id;
  }

  // --------------------------------------------------------------------------
  // GET /api/email-templates
  // --------------------------------------------------------------------------
  @Get()
  async listar() {
    const companyId = await this.companyId();
    const data = await this.prisma.emailTemplate.findMany({
      where: { companyId },
      orderBy: [{ tipoDocumento: 'asc' }],
    });
    return { data, meta: { total: data.length } };
  }

  // --------------------------------------------------------------------------
  // GET /api/email-templates/:id
  // --------------------------------------------------------------------------
  @Get(':id')
  async detalhe(@Param('id') id: string) {
    const tpl = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('Template nao encontrado');
    return tpl;
  }

  // --------------------------------------------------------------------------
  // POST /api/email-templates
  // --------------------------------------------------------------------------
  @Post()
  async criar(
    @Body()
    body: {
      nome?: string; // 🆕 Opcional no body (frontend antigo), obrigatorio no DB
      tipoDocumento: string;
      assunto: string;
      corpoHtml: string;
      ativo?: boolean;
    },
  ) {
    const companyId = await this.companyId();

    // FIX F16-A-SCHEMA: 'nome' e obrigatorio. Fallback = tipoDocumento.
    const data: Prisma.EmailTemplateUncheckedCreateInput = {
      companyId,
      nome: body.nome ?? body.tipoDocumento,
      tipoDocumento: body.tipoDocumento as TipoDocumentoComunicado,
      assunto: body.assunto,
      corpoHtml: body.corpoHtml,
      ativo: body.ativo ?? true,
    };

    return this.prisma.emailTemplate.create({ data });
  }

  // --------------------------------------------------------------------------
  // PUT /api/email-templates/:id  (atualizacao parcial)
  // --------------------------------------------------------------------------
  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body()
    body: {
      nome?: string;
      tipoDocumento?: string;
      assunto?: string;
      corpoHtml?: string;
      ativo?: boolean;
    },
  ) {
    const existe = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Template nao encontrado');

    const data: Prisma.EmailTemplateUncheckedUpdateInput = {
      nome: body.nome ?? existe.nome, // Mantem ou atualiza
      tipoDocumento:
        (body.tipoDocumento as TipoDocumentoComunicado) ?? existe.tipoDocumento,
      assunto: body.assunto ?? existe.assunto,
      corpoHtml: body.corpoHtml ?? existe.corpoHtml,
      ativo: body.ativo ?? existe.ativo,
    };

    return this.prisma.emailTemplate.update({ where: { id }, data });
  }

  // --------------------------------------------------------------------------
  // DELETE /api/email-templates/:id
  // --------------------------------------------------------------------------
  @Delete(':id')
  async remover(@Param('id') id: string) {
    const existe = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Template nao encontrado');
    await this.prisma.emailTemplate.delete({ where: { id } });
    return { ok: true };
  }

  // --------------------------------------------------------------------------
  // POST /api/email-templates/preview
  // Renderiza assunto+corpo com contexto de demonstracao (sem gravar nada)
  // --------------------------------------------------------------------------
  @Post('preview')
  async preview(@Body() body: { assunto: string; corpoHtml: string }) {
    const contextoDemo = {
      cliente: {
        nome: 'FERNANDA LOPES TOLEDO (DEMO)',
        cnpj: '08.432.644/0001-60',
        id: 'demo-cliente',
      },
      documento: {
        tipo: 'DAS',
        competencia: '2026-01',
        nome: 'DAS_08432644000160_JAN2026.pdf',
        tamanhoBytes: 26,
      },
      link: {
        download: 'https://radar-api.contacerta.com.br/track/download/demo',
        expiraEm: '21/09/2026',
      },
      empresa: { nome: 'Conta Certa Demo', id: 'demo-empresa' },
      setor: { nome: 'Fiscal' },
    };

    return {
      assunto: this.templateService.renderizar(body.assunto ?? '', contextoDemo),
      corpoHtml: this.templateService.renderizar(
        body.corpoHtml ?? '',
        contextoDemo,
      ),
    };
  }
}