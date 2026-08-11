import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { BankingService } from './banking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * 🏦 BankingController — Sprint 21 → 24
 * 🆕 24: categories (listar/criar) + close/reopen do mês
 */
@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Post('import')
  import(@Request() req, @Body() body: any) {
    return this.bankingService.importStatement(req.user.companyId, body.clientId ?? null, {
      year: Number(body.year),
      month: Number(body.month),
      fileName: body.fileName,
      rows: body.rows || [],
    });
  }

  @Get('statement')
  statement(
    @Request() req,
    @Query('clientId') clientId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.bankingService.getStatement(
      req.user.companyId,
      clientId || null,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  /** 🆕 Sprint 24: categorias do cliente (com seed automático) */
  @Get('categories')
  categories(@Request() req, @Query('clientId') clientId?: string) {
    return this.bankingService.listCategories(req.user.companyId, clientId || null);
  }

  /** 🆕 Sprint 24: criar categoria personalizada ("+ Natureza") */
  @Post('categories')
  createCategory(@Request() req, @Body() body: any) {
    return this.bankingService.createCategory(
      req.user.companyId,
      body.clientId ?? null,
      body.label,
      body.group,
    );
  }

  /** 🆕 Sprint 24: trava de compliance */
  @Post('close/:id')
  close(@Request() req, @Param('id') id: string) {
    return this.bankingService.closeStatement(req.user.companyId, id);
  }

  /** 🆕 Sprint 24: reabrir mês */
  @Post('reopen/:id')
  reopen(@Request() req, @Param('id') id: string) {
    return this.bankingService.reopenStatement(req.user.companyId, id);
  }

  @Patch('transactions/:id')
  updateTransaction(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.bankingService.updateTransaction(req.user.companyId, id, body);
  }

  @Post('transactions')
  createManual(@Request() req, @Body() body: any) {
    return this.bankingService.createManual(req.user.companyId, body.clientId ?? null, {
      year: Number(body.year),
      month: Number(body.month),
      date: body.date,
      description: body.description,
      amount: Number(body.amount),
      nature: body.nature,
    });
  }

  @Delete('transactions/:id')
  deleteTransaction(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteTransaction(req.user.companyId, id);
  }

  @Delete('statements/:id')
  deleteStatement(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteStatement(req.user.companyId, id);
  }
    /** 🆕 Sprint 24.1: editar categoria (renomear/trocar grupo) */
  @Patch('categories/:id')
  updateCategory(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.bankingService.updateCategory(req.user.companyId, id, {
      label: body.label,
      group: body.group,
    });
  }

  /** 🆕 Sprint 24.1: excluir categoria (se não estiver em uso) */
  @Delete('categories/:id')
  deleteCategory(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteCategory(req.user.companyId, id);
  }
}