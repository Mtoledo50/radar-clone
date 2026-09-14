// ============================================================================
// SPRINT F13 + F18-A — WatchFolderController
// ----------------------------------------------------------------------------
// Endpoints:
//   GET  /api/watch-folder/status   status do watcher + mapeamento de slugs
//   POST /api/watch-folder/reload   recarrega cache de slugs após criar company
// ============================================================================
import { Controller, Get, Post } from '@nestjs/common';
import { WatchFolderService } from './watch-folder.service';

@Controller('api/watch-folder')
export class WatchFolderController {
  constructor(private readonly service: WatchFolderService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }

  /**
   * 🆕 F18-A: Recarrega o cache de slugs em memória.
   * Útil após criar uma nova empresa via admin, sem precisar reiniciar o backend.
   */
  @Post('reload')
  async reload() {
    await this.service.recarregarCache();
    return { ok: true, message: 'Cache de slugs recarregado' };
  }
}