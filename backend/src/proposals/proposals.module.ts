import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals.controller';
import { PublicProposalsController } from './public-proposals.controller';
import { ProposalsService } from './proposals.service';

@Module({
  controllers: [
    ProposalsController,
    PublicProposalsController, // 🔥 IMPORTANTE: Registrar o controller público
  ],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}