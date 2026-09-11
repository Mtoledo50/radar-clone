import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StatusArquivoFila } from '@prisma/client';
import { ArquivoFilaService } from './arquivo-fila.service';
import { AprovarArquivoDto } from './dto/aprovar-arquivo.dto';
import { RejeitarArquivoDto } from './dto/rejeitar-arquivo.dto';
import { VincularClienteDto } from './dto/vincular-cliente.dto';

@ApiTags('Fila de Arquivos')
@ApiBearerAuth('JWT')
@Controller('api/arquivos-fila')
export class ArquivoFilaController {
  constructor(private readonly service: ArquivoFilaService) {}

  @Get()
  @ApiOperation({ summary: 'Lista a fila de arquivos detectados' })
  @ApiQuery({ name: 'status', required: false, enum: StatusArquivoFila })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  listar(
    @Query('status') status?: StatusArquivoFila,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.service.listar({
      status,
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do arquivo + preview do email montado' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Detalhe com preview' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  detalhe(@Param('id') id: string) {
    return this.service.detalhe(id);
  }

  @Post(':id/aprovar')
  @ApiOperation({
    summary: 'Aprova envio (Human-in-the-Loop — ADR-030)',
    description: 'Cria EmailEnvio com status AGENDADO. Nada é enviado sem esta chamada.',
  })
  @ApiParam({ name: 'id' })
  aprovar(@Param('id') id: string, @Body() dto: AprovarArquivoDto, @Req() req: any) {
    // TODO: extrair usuarioId do req.user (auth guard)
    const usuarioId = req.user?.id ?? 'system';
    return this.service.aprovar(id, dto, usuarioId);
  }

  @Post('aprovar-lote')
  @ApiOperation({ summary: 'Aprova vários arquivos de uma vez' })
  aprovarLote(@Body('ids') ids: string[], @Req() req: any) {
    const usuarioId = req.user?.id ?? 'system';
    return this.service.aprovarLote(ids ?? [], usuarioId);
  }

  @Post(':id/rejeitar')
  @ApiOperation({ summary: 'Rejeita o arquivo (move para rejeitados/)' })
  @ApiParam({ name: 'id' })
  rejeitar(@Param('id') id: string, @Body() dto: RejeitarArquivoDto) {
    return this.service.rejeitar(id, dto.motivo);
  }

  @Post(':id/vincular-cliente')
  @ApiOperation({
    summary: 'Vínculo manual quando CNPJ não foi detectado/encontrado',
  })
  @ApiParam({ name: 'id' })
  vincularCliente(@Param('id') id: string, @Body() dto: VincularClienteDto) {
    return this.service.vincularCliente(id, dto);
  }
}