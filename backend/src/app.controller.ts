import { Controller, Post, Body } from '@nestjs/common';
// Caminho correto se o serviço estiver diretamente em obligations/
import { ObligationSchedulerService } from './modules/obligations/obligation-scheduler.service';

// OU, se estiver dentro de services/:
// import { ObligationSchedulerService } from './modules/obligations/services/obligation-scheduler.service';
@Controller()
export class AppController {
  constructor(private readonly scheduler: ObligationSchedulerService) {}

  /**
   * Endpoint temporário para validar manualmente a geração de tarefas.
   * POST /generate-tasks
   */
  @Post('generate-tasks')
  async generateTasks(@Body() body: { companyId: string }) {
    // Validação básica
    if (!body?.companyId) {
      return { success: false, message: 'companyId é obrigatório' };
    }

    try {
      // Chama o serviço passando o companyId (se necessário filtrar por tenant)
      // Se o serviço atual ignora o companyId e gera para todos, ajuste conforme necessidade
// Troque esta linha:
// await this.scheduler.generateMonthlyTasks(body.companyId);

// Por esta:
await this.scheduler.runManualTrigger(body.companyId);
      
      return { 
        success: true, 
        message: 'Tarefas geradas com sucesso',
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erro ao gerar tarefas' 
      };
    }
  }
}