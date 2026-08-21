// =================================================================
// INÍCIO: backend/src/company/domain/extra-services-benchmark.ts
// =================================================================
/**
 * =================================================================
 * 💼 ExtraServicesBenchmark — Sprint C2 (domínio puro, ADR-053)
 * =================================================================
 * Catálogo curado v1 de SERVIÇOS EXTRAS que o mercado contábil cobra
 * à parte, com preço médio (mensal/avulso/hora). Cruzado com os
 * ServiceItem do escritório, deriva o "dinheiro na mesa" de serviços:
 * o que você ainda não vende e quanto isso vale por mês.
 *
 * 🧠 ADR-053: preços médios de mercado (curadoria v1) — sugestão,
 *    não promessa (filosofia ADR-031: humano decide o preço final).
 * 📐 Determinístico: zero IA, zero HTTP, zero Prisma.
 * =================================================================
 */

// =================================================================
// 📋 TIPOS (contrato estável)
// =================================================================

export type PriceUnit = 'mensal' | 'avulso' | 'hora';

export interface ExtraServiceDef {
  name: string;        // nome canônico de mercado
  category: string;    // categoria funcional
  avgPrice: number;    // preço médio de mercado (R$)
  unit: PriceUnit;     // unidade de cobrança
  keywords: string[];  // p/ casar com ServiceItem do escritório
  description: string; // o que é o serviço (UI)
}

export interface ExtraServiceEntry extends ExtraServiceDef {
  youOffer: boolean;        // escritório tem ServiceItem casado?
  yourPrice: number | null; // média round2 dos seus itens casados
}

export interface ExtraServicesBenchmarkResult {
  catalogSize: number;
  offeredCount: number;
  coveragePct: number;        // oferecidos ÷ catálogo × 100
  potentialMonthly: number;   // soma avgPrice mensais NÃO oferecidos
  notOfferedOneOff: number;   // qtd avulsos/hora não oferecidos
  services: ExtraServiceEntry[];
  insights: string[];
}

// =================================================================
// 🗂️ CATÁLOGO CURADO v1 (preços médios de mercado — 2026)
// =================================================================

export const EXTRA_SERVICES_CATALOG_V1: ExtraServiceDef[] = [
  {
    name: 'BPO Financeiro', category: 'Financeiro', avgPrice: 900, unit: 'mensal',
    keywords: ['bpo', 'financeiro', 'contas a pagar', 'contas a receber'],
    description: 'Gestão completa do financeiro do cliente (pagar, receber, conciliar).',
  },
  {
    name: 'Dashboard BPO', category: 'Financeiro', avgPrice: 300, unit: 'mensal',
    keywords: ['dashboard', 'indicadores', 'bi'],
    description: 'Painel mensal de indicadores financeiros p/ o cliente.',
  },
  {
    name: 'IRPF (por declaração)', category: 'Pessoa Física', avgPrice: 180, unit: 'avulso',
    keywords: ['irpf', 'imposto de renda', 'pessoa fisica', 'declaracao anual'],
    description: 'Declaração de ajuste anual dos sócios e PFs.',
  },
  {
    name: 'Abertura de Empresa', category: 'Societário', avgPrice: 350, unit: 'avulso',
    keywords: ['abertura', 'constituicao', 'registro', 'junta comercial'],
    description: 'Constituição + licenças + enquadramento tributário.',
  },
  {
    name: 'Baixa/Encerramento de Empresa', category: 'Societário', avgPrice: 300, unit: 'avulso',
    keywords: ['baixa', 'encerramento', 'distrato'],
    description: 'Encerramento com distrato e baixas em órgãos.',
  },
  {
    name: 'Mensalidade MEI', category: 'Pessoa Jurídica', avgPrice: 60, unit: 'mensal',
    keywords: ['mei'],
    description: 'DAS mensal + declaração anual do MEI.',
  },
  {
    name: 'Gestão de CNDs', category: 'Fiscal', avgPrice: 120, unit: 'mensal',
    keywords: ['cnd', 'certidao', 'certidoes', 'negativa'],
    description: 'Monitoramento e renovação de certidões dos clientes.',
  },
  {
    name: 'Regularização/Parcelamento', category: 'Fiscal', avgPrice: 400, unit: 'avulso',
    keywords: ['parcelamento', 'regulariza', 'debito', 'transacao'],
    description: 'Levantamento de débitos + parcelamentos/transação.',
  },
  {
    name: 'Consultoria Tributária (hora)', category: 'Consultoria', avgPrice: 250, unit: 'hora',
    keywords: ['consultoria', 'tributaria', 'planejamento tributario'],
    description: 'Hora técnica de planejamento/tributos.',
  },
  {
    name: 'Revisão Anual do Simples', category: 'Consultoria', avgPrice: 600, unit: 'avulso',
    keywords: ['revisao', 'simples nacional', 'enquadramento', 'recupera'],
    description: 'Recuperação de créditos + reenquadramento anual.',
  },
  {
    name: 'Projeto LGPD', category: 'Consultoria', avgPrice: 2500, unit: 'avulso',
    keywords: ['lgpd', 'compliance', 'privacidade', 'dados'],
    description: 'Adequação LGPD (diagnóstico + políticas + treinamento).',
  },
  {
    name: 'Folha/DP de terceiros', category: 'DP', avgPrice: 45, unit: 'mensal',
    keywords: ['folha', 'departamento pessoal', 'admissao', 'ferias'],
    description: 'DP mensal por colaborador de clientes sem DP próprio.',
  },
];

// =================================================================
// 🔧 HELPERS
// =================================================================

/** Minúsculo + sem acentos + sem espaços (matching tolerante). */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

/** round2 (ADR-020). */
export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// =================================================================
// 🎯 MOTOR DE BENCHMARK
// =================================================================

/**
 * Cruza o catálogo v1 com os ServiceItem do escritório.
 *
 * @param ownServices itens do catálogo do próprio escritório:
 *        [{ name, price }] (price pode ser null)
 */
export function computeExtraServicesBenchmark(
  ownServices: Array<{ name: string; price: number | null }>,
): ExtraServicesBenchmarkResult {
  const services: ExtraServiceEntry[] = EXTRA_SERVICES_CATALOG_V1.map((def) => {
    // Casa pelos keywords: algum keyword contido no nome do item próprio
    const matched = ownServices.filter((own) => {
      const n = normalizeText(own.name);
      return def.keywords.some((kw) => n.includes(normalizeText(kw)));
    });

    const prices = matched
      .map((m) => m.price)
      .filter((p): p is number => p !== null && p > 0);

    return {
      ...def,
      youOffer: matched.length > 0,
      yourPrice: prices.length > 0
        ? round2(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null,
    };
  });

  const offered = services.filter((s) => s.youOffer);
  const notOffered = services.filter((s) => !s.youOffer);

  const coveragePct =
    services.length > 0 ? Math.round((offered.length / services.length) * 100) : 0;

  // Potencial mensal: só os MENSAIS não oferecidos (determinístico)
  const potentialMonthly = round2(
    notOffered
      .filter((s) => s.unit === 'mensal')
      .reduce((sum, s) => sum + s.avgPrice, 0),
  );

  const notOfferedOneOff = notOffered.filter((s) => s.unit !== 'mensal').length;

  // Insights prontos p/ diretoria (máx. 4)
  const insights: string[] = [];
  insights.push(
    `Você vende ${offered.length} de ${services.length} serviços extras que o mercado cobra (${coveragePct}%).`,
  );
  if (potentialMonthly > 0) {
    insights.push(
      `Potencial de +R$ ${potentialMonthly.toFixed(2)}/mês com serviços mensais que você ainda não oferece.`,
    );
  }
  const topNotOffered = notOffered
    .slice()
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 2);
  for (const s of topNotOffered) {
    insights.push(
      `Oportunidade: ${s.name} (média de mercado R$ ${s.avgPrice.toFixed(2)}${s.unit === 'mensal' ? '/mês' : s.unit === 'hora' ? '/hora' : ''}).`,
    );
  }

  return {
    catalogSize: services.length,
    offeredCount: offered.length,
    coveragePct,
    potentialMonthly,
    notOfferedOneOff,
    services,
    insights,
  };
}
// =================================================================
// FIM: backend/src/company/domain/extra-services-benchmark.ts
// =================================================================