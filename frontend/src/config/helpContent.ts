/**
 * =================================================================
 * Mapeamento de rotas → conteúdos de ajuda
 * =================================================================
 * Cada página do sistema tem uma entrada aqui.
 * O hook useHelpModal usa este mapa para carregar o conteúdo correto.
 * =================================================================
 */
import {
  cobrancaContent,
  dashboardContent,
  clientesContent,
  fechamentoContent,
  projetosContent,
  tarefasContent,
  precificacaoContent,
  propostasContent,
  nfseContent,
  guiasContent,
  relatoriosContent,
  planoContasContent,
  lancamentosContent,
  scoreContent,
  mentoriaContent,
} from '@/components/HelpModal/pages';

export interface HelpContent {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export const helpContentMap: Record<string, HelpContent> = {
  '/dashboard': {
    title: 'Dashboard Executivo',
    subtitle: 'Guia rápido de uso',
    content: dashboardContent,
  },
  '/dashboard/clientes': {
    title: 'Carteira de Clientes',
    subtitle: 'Gerencie contratos, planos e serviços avulsos',
    content: clientesContent,
  },
  '/dashboard/funcionario-digital/cobranca': {
    title: 'Cobrança & CNAB',
    subtitle: 'Régua de cobrança + remessa/retorno CNAB 240/400',
    content: cobrancaContent,
  },
  '/dashboard/fechamento': {
    title: 'Fechamento + DRE Bancário',
    subtitle: 'Ciclo completo de fechamento bancário por cliente',
    content: fechamentoContent,
  },
  '/dashboard/projetos': {
    title: 'Projetos',
    subtitle: 'Organize entregas e demandas do escritório',
    content: projetosContent,
  },
  '/dashboard/tarefas': {
    title: 'Tarefas',
    subtitle: 'O dia a dia operacional — quem faz o quê e até quando',
    content: tarefasContent,
  },
  '/dashboard/precificacao': {
    title: 'Precificação',
    subtitle: 'Calcule quanto cobrar baseado em horas e margem',
    content: precificacaoContent,
  },
  '/dashboard/precificacao/propostas': {
    title: 'Propostas Comerciais',
    subtitle: 'Motor de propostas com link público e tracking',
    content: propostasContent,
  },
  '/dashboard/funcionario-digital/nfse': {
    title: 'NFS-e',
    subtitle: 'Notas Fiscais de Serviço — importação e coleta automática',
    content: nfseContent,
  },
  '/dashboard/funcionario-digital/guias': {
    title: 'Guias de Imposto',
    subtitle: 'Cálculo automático de DAS e ISS com memória de cálculo',
    content: guiasContent,
  },
  '/dashboard/funcionario-digital/relatorios': {
    title: 'Relatórios Mensais',
    subtitle: 'PDFs automáticos com resumo financeiro por cliente',
    content: relatoriosContent,
  },
  '/dashboard/contabil/plano-contas': {
    title: 'Plano de Contas',
    subtitle: 'Estrutura contábil SCI 90113 com 1.207 contas',
    content: planoContasContent,
  },
  '/dashboard/lancamentos': {
    title: 'Lançamentos Contábeis',
    subtitle: 'Registro de partidas dobradas (Débito e Crédito)',
    content: lancamentosContent,
  },
  '/dashboard/score': {
    title: 'Score do Escritório',
    subtitle: 'Nota de 0 a 100 da saúde do seu escritório',
    content: scoreContent,
  },
  '/dashboard/mentoria': {
    title: 'Mentoria (Visão de Futuro)',
    subtitle: 'Plano de ação personalizado baseado no seu Score',
    content: mentoriaContent,
  },
};