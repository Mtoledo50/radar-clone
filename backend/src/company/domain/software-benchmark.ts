// =================================================================
// INÍCIO: backend/src/company/domain/software-benchmark.ts
// =================================================================
/**
 * =================================================================
 * 📊 SoftwareBenchmark — Sprint C1 (domínio puro, ADR-052)
 * =================================================================
 * Benchmark de softwares do mercado contábil: compara o stack DO
 * tenant (Company.softwareStack) com o mercado (catálogo curado v1)
 * e com a rede real de tenants (quando a amostra é suficiente).
 *
 * 🧠 ADR-052 (benchmark híbrido):
 * - source 'rede'     → amostra real ≥ 10 escritórios (marketPct da rede)
 * - source 'hibrido'  → 1–9 escritórios (% do catálogo + contagem da rede)
 * - source 'catalogo' → 0 escritórios (catálogo curado v1)
 *
 * 📐 Determinístico (ADR-031): zero IA, zero HTTP, zero Prisma.
 *    100% testável em memória.
 * =================================================================
 */

// =================================================================
// 🗂️ CATÁLOGO CURADO v1 (mercado contábil BR — curadoria manual)
// =================================================================

export interface CatalogSoftware {
  name: string;      // nome canônico de mercado
  category: string;  // categoria funcional
  marketPct: number; // % de adoção no mercado (curadoria v1)
}

export const SOFTWARE_CATALOG_V1: CatalogSoftware[] = [
  // ── Gestão Contábil (core do escritório) ──
  { name: 'Domínio (Thomson Reuters)', category: 'Gestão Contábil', marketPct: 32 },
  { name: 'Questor', category: 'Gestão Contábil', marketPct: 21 },
  { name: 'Alter', category: 'Gestão Contábil', marketPct: 12 },
  { name: 'Prosoft', category: 'Gestão Contábil', marketPct: 9 },
  { name: 'SCI', category: 'Gestão Contábil', marketPct: 8 },
  { name: 'Sage', category: 'Gestão Contábil', marketPct: 6 },
  { name: 'TOTVS RM', category: 'Gestão Contábil', marketPct: 5 },
  { name: 'Mastersiga', category: 'Gestão Contábil', marketPct: 3 },
  // ── Folha / Departamento Pessoal ──
  { name: 'Domínio DP', category: 'Folha / DP', marketPct: 30 },
  { name: 'Questor DP', category: 'Folha / DP', marketPct: 18 },
  { name: 'TOTVS RM Folha', category: 'Folha / DP', marketPct: 14 },
  { name: 'Alter Folha', category: 'Folha / DP', marketPct: 10 },
  { name: 'Prosoft DP', category: 'Folha / DP', marketPct: 8 },
  // ── Fiscal / Tributos ──
  { name: 'Mastersiga Fiscal', category: 'Fiscal / Tributos', marketPct: 18 },
  { name: 'Questor Fiscal', category: 'Fiscal / Tributos', marketPct: 16 },
  { name: 'Domínio Fiscal', category: 'Fiscal / Tributos', marketPct: 15 },
  { name: 'TaxOne', category: 'Fiscal / Tributos', marketPct: 8 },
  // ── Financeiro / Faturamento do cliente ──
  { name: 'Conta Azul', category: 'Financeiro', marketPct: 24 },
  { name: 'Omie', category: 'Financeiro', marketPct: 16 },
  { name: 'Bling', category: 'Financeiro', marketPct: 14 },
  { name: 'QuickBooks', category: 'Financeiro', marketPct: 8 },
  // ── Assinatura Digital ──
  { name: 'D4Sign', category: 'Assinatura Digital', marketPct: 26 },
  { name: 'DocuSign', category: 'Assinatura Digital', marketPct: 24 },
  { name: 'ClickSign', category: 'Assinatura Digital', marketPct: 18 },
  { name: 'ZapSign', category: 'Assinatura Digital', marketPct: 10 },
];

/** Limiar p/ considerar a rede real como fonte primária (ADR-052). */
export const NETWORK_THRESHOLD = 10;

// =================================================================
// 📋 TIPOS DO RESULTADO (contrato estável p/ service/UI)
// =================================================================

export interface SoftwareEntry {
  name: string;         // nome canônico
  category: string;     // categoria funcional
  marketPct: number;    // % de mercado (catálogo OU rede, conforme source)
  youUse: boolean;      // o tenant usa?
  networkCount: number; // quantos escritórios da rede real usam
}

export interface CategoryBenchmark {
  category: string;
  youCovered: boolean;             // tenant tem algum software na categoria?
  top: SoftwareEntry | null;       // líder de mercado da categoria
  entries: SoftwareEntry[];        // ordenados por marketPct desc
  recommendation: string | null;   // frase de recomendação (ou null se OK)
}

export interface SoftwareBenchmarkResult {
  sampleSize: number;                          // nº de escritórios na rede
  source: 'rede' | 'hibrido' | 'catalogo';     // fonte dos % (ADR-052)
  coveragePct: number;                         // % de categorias cobertas pelo tenant
  categories: CategoryBenchmark[];
  insights: string[];                          // frases prontas p/ o diretor
}

// =================================================================
// 🔧 HELPERS DE NORMALIZAÇÃO / MATCHING
// =================================================================

/** Minúsculo + sem acentos + sem espaços (p/ casar "Conta Azul" ≡ "ContaAzul"). */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Casa um item do softwareStack com um nome canônico do catálogo.
 * Bidirecional (includes nos dois sentidos) p/ tolerar rótulos
 * diferentes ("Domínio" casa com "Domínio (Thomson Reuters)").
 */
export function softwareMatches(stackItem: string, catalogName: string): boolean {
  const a = normalizeText(stackItem);
  const b = normalizeText(catalogName);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

// =================================================================
// 🎯 MOTOR DE BENCHMARK
// =================================================================

/**
 * Calcula o benchmark completo.
 *
 * @param youStack      Company.softwareStack do tenant logado
 * @param networkStacks softwareStack de TODOS os outros tenants ativos
 */
export function computeSoftwareBenchmark(
  youStack: string[],
  networkStacks: string[][],
): SoftwareBenchmarkResult {
  const sampleSize = networkStacks.length;

  // Fonte dos percentuais (ADR-052)
  const source: SoftwareBenchmarkResult['source'] =
    sampleSize >= NETWORK_THRESHOLD ? 'rede' : sampleSize > 0 ? 'hibrido' : 'catalogo';

  // 1) Constrói o universo de softwares: catálogo + achados na rede
  const entries = new Map<string, SoftwareEntry>();
  for (const cat of SOFTWARE_CATALOG_V1) {
    entries.set(normalizeText(cat.name), {
      name: cat.name,
      category: cat.category,
      marketPct: cat.marketPct,
      youUse: false,
      networkCount: 0,
    });
  }

  // 2) Conta uso na rede real + descobre softwares fora do catálogo
  for (const stack of networkStacks) {
    const matchedInStack = new Set<string>(); // evita double-count no mesmo stack
    for (const item of stack) {
      // tenta casar com o catálogo primeiro
      let key: string | null = null;
      for (const cat of SOFTWARE_CATALOG_V1) {
        if (softwareMatches(item, cat.name)) { key = normalizeText(cat.name); break; }
      }
      // não casou → entra como "fora do catálogo" (categoria Outros)
      if (!key) {
        key = normalizeText(item);
        if (!entries.has(key)) {
          entries.set(key, { name: item, category: 'Outros', marketPct: 0, youUse: false, networkCount: 0 });
        }
      }
      if (!matchedInStack.has(key)) {
        matchedInStack.add(key);
        entries.get(key)!.networkCount += 1;
      }
    }
  }

  // 3) Marca o que o tenant usa
  for (const item of youStack) {
    for (const [key, entry] of entries) {
      if (softwareMatches(item, entry.name)) { entry.youUse = true; break; }
    }
  }

  // 4) Recalcula marketPct quando a rede é a fonte primária
  if (source === 'rede') {
    for (const entry of entries.values()) {
      entry.marketPct = Math.round((entry.networkCount / sampleSize) * 100);
    }
  }

  // 5) Agrupa por categoria (ordem do catálogo; "Outros" por último)
  const categoryOrder = [
    'Gestão Contábil', 'Folha / DP', 'Fiscal / Tributos', 'Financeiro',
    'Assinatura Digital', 'Outros',
  ];
  const byCategory = new Map<string, SoftwareEntry[]>();
  for (const entry of entries.values()) {
    // em modo catálogo/híbrido, ignora "Outros" sem uso na rede (ruído)
    if (entry.category === 'Outros' && entry.networkCount === 0 && !entry.youUse) continue;
    if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
    byCategory.get(entry.category)!.push(entry);
  }

  const categories: CategoryBenchmark[] = categoryOrder
    .filter((c) => byCategory.has(c))
    .map((c) => {
      const list = byCategory
        .get(c)!
        .sort((a, b) => b.marketPct - a.marketPct);
      const top = list[0] ?? null;
      const youCovered = list.some((e) => e.youUse);

      // Recomendação determinística (nunca imperativa — diretor decide)
      let recommendation: string | null = null;
      if (!youCovered) {
        recommendation = `Você não tem software em "${c}" — o padrão de mercado é ${top?.name} (${top?.marketPct}%).`;
      } else if (top && !top.youUse && top.marketPct >= 15) {
        recommendation = `Em "${c}", o líder de mercado é ${top.name} (${top.marketPct}%) — você usa outra solução.`;
      }

      return { category: c, youCovered, top, entries: list, recommendation };
    });

  // 6) Coverage: % de categorias-core cobertas (exclui "Outros")
  const core = categories.filter((c) => c.category !== 'Outros');
  const covered = core.filter((c) => c.youCovered).length;
  const coveragePct = core.length > 0 ? Math.round((covered / core.length) * 100) : 0;

  // 7) Insights prontos p/ o diretor (máx. 4)
  const insights: string[] = [];
  insights.push(
    `Seu escritório cobre ${covered} de ${core.length} categorias essenciais do mercado contábil (${coveragePct}%).`,
  );
  for (const c of categories) {
    if (c.recommendation && insights.length < 4) insights.push(c.recommendation);
  }
  if (source !== 'rede') {
    insights.push(
      `Amostra da rede: ${sampleSize} escritório(s) — percentuais baseados no catálogo de mercado v1 (ADR-052).`,
    );
  }

  return { sampleSize, source, coveragePct, categories, insights };
}
// =================================================================
// FIM: backend/src/company/domain/software-benchmark.ts
// =================================================================