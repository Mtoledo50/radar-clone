'use client';

/**
 * =================================================================
 * 🧾 TaxAuditTable — Auditoria Tributária por Item (Sprint F6)
 * =================================================================
 * Renderiza a tabela Base × Alíquota = Valor para ICMS/IPI/PIS/COFINS.
 *
 * 🆕 Quando encontra DIVERGÊNCIA (⚠), exibe uma linha extra com:
 *   1) EXPLICAÇÃO DO ERRO — diagnóstico guiado pelos dados:
 *      - base+alíquota zeradas com valor > 0 → parser antigo / grupo não tratado
 *      - só alíquota zerada → pICMS/pIPI/pPIS/pCOFINS ausente no grupo do XML
 *      - só base zerada → vBC ausente no grupo do XML
 *      - tudo preenchido mas não bate → redução de base / benefício fiscal
 *   2) RESULTADO ESPERADO — calculado (base × alíquota) ou implícito
 *      (alíquota = valor ÷ base, ou base = valor ÷ alíquota).
 *
 * 🧠 ADR-031: cálculo determinístico — a matemática é exibida,
 * nunca "adivinhada". Tolerância de arredondamento: R$ 0,02.
 * =================================================================
 */

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Converte Decimal/string do Prisma para number com segurança. */
const n = (v: number | string | null | undefined) => {
  const x = parseFloat(String(v ?? 0));
  return isNaN(x) ? 0 : x;
};

// =================================================================
// 🧠 Motor de diagnóstico: retorna status + explicação + esperado
// =================================================================
interface AuditResult {
  ok: boolean;
  expected: number;   // base × alíquota (o que DEVERIA ser)
  diff: number;       // |expected - valor da nota|
  diagnosis: string | null;  // explicação do erro (null se OK)
  fix: string | null;        // resultado esperado / ação corretiva
}

function audit(tax: string, base: number, rate: number, value: number): AuditResult {
  const expected = round2((base * rate) / 100);
  const diff = round2(Math.abs(expected - value));
  const ok = diff <= 0.02;

  // ✅ Sem divergência — nada a explicar
  if (ok) return { ok, expected, diff, diagnosis: null, fix: null };

  // ❌ CASO 1: base E alíquota zeradas, mas a nota tem valor
  // → típico de nota importada com o parser ANTIGO (pré-Sprint F6)
  if (base <= 0 && rate <= 0 && value > 0) {
    return {
      ok, expected, diff,
      diagnosis:
        `${tax}: a nota informa ${brl(value)}, mas a BASE e a ALÍQUOTA ` +
        `não foram capturadas do XML (campos zerados no banco).`,
      fix:
        `Resultado esperado: base × alíquota = ${brl(value)}. ` +
        `AÇÃO: reimporte esta NF-e com o parser da Sprint F6 para capturar ` +
        `vBC e p${tax}. Se persistir, o XML usa grupo não tratado ` +
        `(ex.: IPIQtde, PISOutr, COFINSOutr).`,
    };
  }

  // ❌ CASO 2: há base e valor, mas a alíquota não foi capturada
  if (base > 0 && rate <= 0 && value > 0) {
    const implied = round2((value / base) * 100);
    return {
      ok, expected, diff,
      diagnosis:
        `${tax}: ALÍQUOTA não capturada (tag p${tax} ausente no grupo do XML), ` +
        `mas há base ${brl(base)} e valor ${brl(value)}.`,
      fix:
        `Resultado esperado: alíquota implícita de ${implied}% ` +
        `(${brl(value)} ÷ ${brl(base)}). Confira o CST de ${tax} no XML.`,
    };
  }

  // ❌ CASO 3: há alíquota e valor, mas a base não foi capturada
  if (base <= 0 && rate > 0 && value > 0) {
    const impliedBase = round2(value / (rate / 100));
    return {
      ok, expected, diff,
      diagnosis:
        `${tax}: BASE não capturada (tag vBC ausente no grupo do XML), ` +
        `mas há alíquota ${rate}% e valor ${brl(value)}.`,
      fix:
        `Resultado esperado: base implícita de ${brl(impliedBase)} ` +
        `(${brl(value)} ÷ ${rate}%).`,
    };
  }

  // ❌ CASO 4: tudo preenchido, mas base × alíquota ≠ valor da nota
  return {
    ok, expected, diff,
    diagnosis:
      `${tax}: DIVERGÊNCIA DE CÁLCULO — ${brl(base)} × ${rate}% = ${brl(expected)}, ` +
      `mas a nota informa ${brl(value)}.`,
    fix:
      `Resultado esperado: ${brl(expected)} (diferença de ${brl(diff)}). ` +
      `Verifique redução de base (pRedBC), diferimento (pDif) ou benefício fiscal no XML.`,
  };
}

// =================================================================
// 🎨 Linha da tabela (valor) + linha de explicação quando diverge
// =================================================================
function AuditRow({
  tax,
  base,
  rate,
  value,
}: {
  tax: string;
  base: number;
  rate: number;
  value: number;
}) {
  const r = audit(tax, base, rate, value);

  return (
    <>
      {/* Linha principal: Base × Alíq. = Esperado vs Nota + Status */}
      <tr>
        <td className="py-1.5 px-2 font-medium text-slate-700">{tax}</td>
        <td className="py-1.5 px-2 text-right text-slate-600">{brl(base)}</td>
        <td className="py-1.5 px-2 text-center text-slate-400">×</td>
        <td className="py-1.5 px-2 text-right text-slate-600">{rate.toFixed(2)}%</td>
        <td className="py-1.5 px-2 text-center text-slate-400">=</td>
        <td className="py-1.5 px-2 text-right text-slate-600">{brl(r.expected)}</td>
        <td className="py-1.5 px-2 text-right font-medium text-slate-800">{brl(value)}</td>
        <td className="py-1.5 px-2 text-center">
          {r.ok ? (
            <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">
              ✓ OK
            </span>
          ) : (
            <span
              className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold"
              title={`Divergência de ${brl(r.diff)}`}
            >
              ⚠ {brl(r.diff)}
            </span>
          )}
        </td>
      </tr>

      {/* 🆕 Linha de EXPLICAÇÃO + RESULTADO ESPERADO (só quando diverge) */}
      {!r.ok && (
        <tr className="bg-amber-50/60">
          <td colSpan={8} className="px-3 py-2 text-[11px] leading-relaxed">
            <p className="text-amber-800">
              <span className="font-bold">❌ Erro:</span> {r.diagnosis}
            </p>
            <p className="text-amber-700 mt-0.5">
              <span className="font-bold">🎯 Esperado:</span> {r.fix}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

// =================================================================
// 📦 Componente principal: tabela completa dos 4 tributos
// =================================================================
export default function TaxAuditTable({ item }: { item: any }) {
  return (
    <div className="mt-3 bg-white rounded border border-slate-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="py-1.5 px-2 text-left font-medium">Tributo</th>
            <th className="py-1.5 px-2 text-right font-medium">Base</th>
            <th className="py-1.5 px-2 text-right font-medium">×</th>
            <th className="py-1.5 px-2 text-right font-medium">Alíq.</th>
            <th className="py-1.5 px-2 text-right font-medium">=</th>
            <th className="py-1.5 px-2 text-right font-medium">Esperado</th>
            <th className="py-1.5 px-2 text-right font-medium">Nota</th>
            <th className="py-1.5 px-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <AuditRow
            tax="ICMS"
            base={n(item.icmsBase)}
            rate={n(item.icmsRate)}
            value={n(item.icmsValue)}
          />
          <AuditRow
            tax="IPI"
            base={n(item.ipiBase)}
            rate={n(item.ipiRate)}
            value={n(item.ipiValue)}
          />
          <AuditRow
            tax="PIS"
            base={n(item.pisBase)}
            rate={n(item.pisRate)}
            value={n(item.pisValue)}
          />
          <AuditRow
            tax="COFINS"
            base={n(item.cofinsBase)}
            rate={n(item.cofinsRate)}
            value={n(item.cofinsValue)}
          />
        </tbody>
      </table>
    </div>
  );
}