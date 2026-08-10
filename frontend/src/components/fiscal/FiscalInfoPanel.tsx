'use client';

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * =================================================================
 * ℹ️ FiscalInfoPanel — Documentação viva do módulo fiscal (Sprint 20)
 * =================================================================
 * Painel colapsável que explica, DENTRO da própria página:
 *   - o que cada métrica (card) significa
 *   - como cada valor é calculado (fórmula)
 *   - como interpretar o resultado
 *
 * Uso: <FiscalInfoPanel page="estoque" />
 * Páginas suportadas: estoque, notas, apuracao, sped,
 *                     comparativo, relatorio
 * =================================================================
 */
interface Block {
  h: string;
  items: string[];
}

const CONTENT: Record<string, { title: string; blocks: Block[] }> = {
  estoque: {
    title: 'Como funciona o Estoque Fiscal',
    blocks: [
      {
        h: '📊 Métricas (cards)',
        items: [
          'Produtos no Catálogo: total de produtos cadastrados no escopo selecionado (inclui saldo zero).',
          'Valor em Estoque: soma de (Saldo atual × Custo Médio) — quanto dinheiro está parado em estoque.',
          'Produtos com Saldo: produtos com saldo atual maior que zero.',
          'NCMs Distintos: quantos NCMs diferentes existem. Produtos vindos do PDF sem NCM usam 00000000 — corrija com o lápis (✏️).',
        ],
      },
      {
        h: '🧾 Colunas da tabela',
        items: [
          'COD_EST: código do produto no SEU catálogo.',
          'COD_NF: código que o fornecedor usou na NF-e (vem do XML).',
          'Cód. Unificado: código aplicado pela planilha ("Unificar códigos") — NÃO altera o COD_EST.',
          'Origem: de onde o produto veio — Estoque Inicial (PDF), NF-e, ou ambos.',
          'NF-e / Emissão NF / Importação: última nota de entrada, data da nota e data em que entrou no sistema.',
          'Custo Médio: média ponderada móvel — recalculada a cada entrada.',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'A tabela mostra a POSIÇÃO ATUAL do estoque por produto.',
          '🕐 Kardex: histórico completo (entradas, ajustes) com custo médio após cada movimento.',
          '✏️ Lápis: edita código, descrição, NCM, saldo e custo — mudança de saldo gera ajuste auditável.',
          '⚖️ Controle: ajuste manual de sobra/quebra com justificativa obrigatória.',
        ],
      },
    ],
  },
  notas: {
    title: 'Como funciona Notas Fiscais',
    blocks: [
      {
        h: '📊 Métricas (cards)',
        items: [
          'Notas no Período: quantidade de NF-e importadas no filtro de datas.',
          'Valor Total: soma dos valores das notas do período.',
          'Crédito ICMS: soma do ICMS das entradas — é o valor que ABATE a apuração (+ST quando houver).',
          'Fornecedores: quantos fornecedores diferentes emitiram notas.',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'Cada NF-e importada cria ENTRADA de estoque + crédito de ICMS automaticamente.',
          '👁 Olho: vê itens, impostos e o vínculo com o catálogo.',
          '🗑 Lixeira: exclui a nota COM estorno do estoque (recalcula saldo e custo médio).',
        ],
      },
    ],
  },
  apuracao: {
    title: 'Como funciona a Apuração de ICMS',
    blocks: [
      {
        h: '📊 A lógica do imposto',
        items: [
          'Créditos = ICMS automático das NF-e de ENTRADA do mês.',
          'Débitos = informados manualmente (vendas × alíquota).',
          'Saldo = Débitos − Créditos.',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'Saldo POSITIVO = ICMS a pagar (guia do mês).',
          'Saldo NEGATIVO = crédito acumulado para compensar nos próximos meses.',
          'Feche o mês (status FECHADA) para travar o valor da guia.',
        ],
      },
    ],
  },
  sped: {
    title: 'Como funciona o SPED Fiscal (Bloco H)',
    blocks: [
      {
        h: '📊 O que é',
        items: [
          'Bloco H = inventário físico do SPED na data-base (mês/ano selecionados).',
          'Itens e valores vêm do saldo atual dos produtos do escopo.',
        ],
      },
      {
        h: '📤 Exportações',
        items: [
          '.txt: layout oficial H001/H005/H010/H990 — NÃO customizável (exigência legal).',
          'CSV: conferência no Excel com colunas escolhidas no botão "Campos".',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'Valor Total do Inventário = soma dos (saldos × custo médio) na data-base.',
          'Valide o .txt no PVA da Receita Federal antes de transmitir.',
        ],
      },
    ],
  },
  comparativo: {
    title: 'Como funciona o Comparativo de Estoque',
    blocks: [
      {
        h: '📊 Métricas (cards)',
        items: [
          'Conferidos: tinham saldo inicial, sem NF-e, e o atual bate com o inicial.',
          'Movimentados por NF-e: receberam entradas via nota.',
          'Divergentes: saldo atual ≠ teórico — precisam de auditoria.',
          'Sem Saldo: tudo zerado.',
        ],
      },
      {
        h: '🧮 A fórmula',
        items: [
          'Teórico = Inicial (PDF) + Entradas NF-e + Ajustes manuais.',
          'Divergência = Atual − Teórico (o esperado é ZERO).',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'Divergência ≠ 0 indica edição manual, ajuste ou falha de importação.',
          '👁 Olho: abre o detalhe da conciliação com as evidências (saldo inicial, NF-es com fornecedor, ajustes).',
        ],
      },
    ],
  },
  relatorio: {
    title: 'Como funciona o Relatório de Inventário',
    blocks: [
      {
        h: '📊 O que é',
        items: [
          'Inventário no layout H010 estendido (17 colunas) para SPED / Imposto de Renda.',
          'Lista apenas produtos que ESTÃO nas notas importadas E têm saldo ≠ 0.',
        ],
      },
      {
        h: '🧾 Colunas principais',
        items: [
          'Código do Produto: código atual do catálogo (COD_EST).',
          'Referência: o NOME do produto.',
          'Tributos (ICMS, ST, IPI, PIS, COFINS): somados das NF-e de aquisição.',
          'Valor p/ IR: saldo × custo médio (valor do inventário para o Imposto de Renda).',
        ],
      },
      {
        h: '🔍 Como interpretar o resultado',
        items: [
          'É a FOTO FISCAL do estoque: quanto vale e quanto imposto foi pago nas aquisições.',
          'Use "Exportar CSV" para entregar no modelo de 17 colunas.',
        ],
      },
    ],
  },
};

export default function FiscalInfoPanel({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const content = CONTENT[page];
  if (!content) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Info className="h-4 w-4 text-teal-600" />
          {content.title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.blocks.map((b, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-bold text-slate-700 mb-2">{b.h}</p>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {b.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}