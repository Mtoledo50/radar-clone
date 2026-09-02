/**
 * 🏢 ADR-104 — Grade de setores × serviços do Workspace do Cliente.
 * Cada `code` é o vínculo com o catálogo do escritório (Camada 2 sincroniza
 * com o plano comercial; hoje a ativação é manual na ficha).
 */
export interface ServiceShortcut { code: string; label: string; route: string }
export interface SectorDef { id: string; label: string; services: ServiceShortcut[] }

export const WORKSPACE_SECTORS: SectorDef[] = [
  {
    id: 'contabil', label: '📒 Contábil',
    services: [
      { code: 'CONT_LANCAMENTOS', label: 'Lançamentos Contábeis', route: '/dashboard/lancamentos' },
      { code: 'CONT_EXTRATO', label: 'Importação de Extrato (SCI)', route: '/dashboard/contabil' },
      { code: 'CONT_CICLO', label: 'Balancete / Livro Caixa / Razão', route: '/dashboard/contabil/ciclo-contabil' },
      { code: 'CONT_CONCILIACAO', label: 'Conciliação (Manual + Automática)', route: '/dashboard/lancamentos/revisao' },
      { code: 'CONT_RAZAO', label: 'Extrato / Razão Analítico', route: '/dashboard/contabil/extrato' },
      { code: 'CONT_PLANO', label: 'Plano de Contas', route: '/dashboard/contabil/plano-contas' },
      { code: 'CONT_DRE', label: 'DRE do Cliente + PDF', route: '/dashboard/bi/dre-cliente' },
    ],
  },
  {
    id: 'bancario', label: '🏦 Bancos',
    services: [
      { code: 'BAN_FECHAMENTO', label: 'Fechamento Mensal + DRE Bancário', route: '/dashboard/fechamento' },
      { code: 'BAN_PDF', label: 'Extratos PDF → CSV', route: '/dashboard/fechamento/extrato-pdf' },
      { code: 'BAN_COBRANCA', label: 'Cobrança & CNAB', route: '/dashboard/funcionario-digital/cobranca' },
    ],
  },
  {
    id: 'fiscal', label: '🧾 Fiscal',
    services: [
      { code: 'FIS_ESCRITURACAO', label: 'Escrituração Fiscal Completa', route: '/dashboard/fiscal' },
      { code: 'FIS_NFE', label: 'Notas Fiscais (NF-e)', route: '/dashboard/fiscal/notas' },
      { code: 'FIS_NFSE', label: 'NFS-e (importação)', route: '/dashboard/funcionario-digital/nfse' },
      { code: 'FIS_ESTOQUE', label: 'Estoque / Kardex', route: '/dashboard/fiscal/estoque' },
      { code: 'FIS_APURACAO', label: 'Apuração ICMS', route: '/dashboard/fiscal/apuracao' },
      { code: 'FIS_SPED', label: 'SPED Fiscal', route: '/dashboard/fiscal/sped' },
    ],
  },
  {
    id: 'tributario', label: '⚖️ Impostos / Tributário',
    services: [
      { code: 'TRI_GUIAS', label: 'Guias de Imposto (Simples/ISS)', route: '/dashboard/funcionario-digital/guias' },
      { code: 'TRI_PLANEJAMENTO', label: 'Planejamento Tributário', route: '/dashboard/planejamento-tributario' },
      { code: 'TRI_REFORMA', label: 'Simulador / Reforma Tributária', route: '/dashboard/reforma-tributaria' },
    ],
  },
  {
    id: 'pessoal', label: '👥 Pessoal (DP)',
    services: [
      { code: 'PES_COLABORADORES', label: 'Colaboradores do Cliente', route: '/dashboard/pessoas' },
      { code: 'PES_TURNOVER', label: 'Turnover / Admissões', route: '/dashboard/turnover' },
    ],
  },
  {
    id: 'gestao', label: '📈 Gestão / BI',
    services: [
      { code: 'GES_PROJETOS', label: 'Projetos & Tarefas do Cliente', route: '/dashboard/projetos' },
      { code: 'GES_PORTAL', label: 'Portal do Cliente', route: '/dashboard/bi' },
    ],
  },
];