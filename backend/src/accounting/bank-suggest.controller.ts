import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
// ⚠️ Use o MESMO caminho de JwtAuthGuard do accounting.controller.ts
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BankSuggestService } from './bank-suggest.service';

@UseGuards(JwtAuthGuard)
@Controller('accounting/bank-suggest')
export class BankSuggestController {
  constructor(private readonly svc: BankSuggestService) {}

  @Post('analyze')
  async analyze(@Request() req: any, @Body() body: { statementId: string }) {
    return this.svc.analyze(req.user.companyId, body.statementId);
  }

  @Post('apply')
  async apply(
    @Request() req: any,
    @Body() body: {
      statementId: string;
      clientId?: string | null;
      learn?: boolean;
      items: { bankTransactionId: string; debitAccountId: string; creditAccountId: string }[];
    },
  ) {
    return this.svc.apply(
      req.user.companyId,
      body.statementId,
      body.clientId ?? null,
      body.learn ?? true,
      body.items || [],
    );
  }
}