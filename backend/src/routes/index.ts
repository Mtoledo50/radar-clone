import { Router } from 'express';
import { TaxAnalysisController } from '../controllers/TaxAnalysisController';

const routes = Router();
const taxController = new TaxAnalysisController();

// ... suas outras rotas

/**
 * @route POST /api/tax-analysis/generate
 * @desc Gera o relatório da Reforma Tributária
 * @access Private (se houver autenticação no Radar)
 */
routes.post(
  '/tax-analysis/generate', 
  taxController.uploadFiles, // Middleware para processar os uploads
  taxController.generateReport
);

export default routes;