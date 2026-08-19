// backend/src/commercial-plans/domain/plan.ts

export interface PlanoComercial {
  id: string;
  nome: string;
  multiplicador: number;
  independente: boolean; // Não herda itens de planos menores
  ordem: number; // Menor multiplicador = menor ordem
  itens: ItemServico[];
}

export interface ItemServico {
  id: string;
  nome: string;
  categoria: CategoriaServico;
  descricao?: string;
}

export type CategoriaServico = 
  | 'FISCAL_TRIBUTARIO'
  | 'NOTAS_FISCAIS'
  | 'DEPARTAMENTO_PESSOAL'
  | 'RELATORIOS_ANALISES'
  | 'ATENDIMENTO_SUPORTE'
  | 'REUNIOES_CONSULTORIA'
  | 'TECNOLOGIA_INTEGRACOES'
  | 'BENEFICIOS_EXTRAS';