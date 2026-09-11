import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WatchFolderService } from './watch-folder.service';

@ApiTags('Watch Folder')
@ApiBearerAuth('JWT')
@Controller('api/watch-folder')
export class WatchFolderController {
  constructor(private readonly watchFolder: WatchFolderService) {}

  @Get('status')
  @ApiOperation({ summary: 'Status do watcher' })
  @ApiResponse({ status: 200, description: 'Status atual' })
  status() {
    return this.watchFolder.status();
  }

  @Post('iniciar')
  @ApiOperation({ summary: 'Ativa o watcher em runtime' })
  @ApiResponse({ status: 200, description: 'Watcher ativado' })
  @ApiResponse({ status: 409, description: 'Watcher já estava ativo' })
  async iniciar() {
    const status = this.watchFolder.status();
    if (status.ativo) {
      return { ok: false, message: 'Watcher já está ativo', status };
    }
    const novoStatus = await this.watchFolder.iniciar();
    return { ok: true, status: novoStatus };
  }

  @Post('parar')
  @ApiOperation({ summary: 'Desativa o watcher' })
  @ApiResponse({ status: 200, description: 'Watcher desativado' })
  async parar() {
    const status = await this.watchFolder.parar();
    return { ok: true, status };
  }

  @Post('scan')
  @ApiOperation({
    summary: 'Varredura manual da pasta',
    description: 'Reprocessa arquivos na raiz que não dispararam evento add',
  })
  @ApiResponse({ status: 200, description: 'Resultado da varredura' })
  async scan() {
    const resultado = await this.watchFolder.scanManual();
    return { ok: true, ...resultado };
  }
}