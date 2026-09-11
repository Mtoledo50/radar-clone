import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WatchFolderService } from './watch-folder.service';
import { EmailSenderService } from './email-sender.service';
import { EmailTrackingController } from './email-tracking.controller'; // ⚠️ Verifique se este import não está sublinhado em vermelho

@Module({
  imports: [ConfigModule],
  providers: [WatchFolderService, EmailSenderService],
  controllers: [EmailTrackingController], // ⚠️ ESSENCIAL: Deve estar exatamente assim
  exports: [WatchFolderService, EmailSenderService],
})
export class EmailModule {}