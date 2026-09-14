// ============================================================================
// SPRINT F15 — Hub de Comunicados
// Pagina central do modulo de Comunicados. Links para todas as sub-paginas.
// ============================================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Metricas {
  aguardando: number;
  enviados: number;
  abertos: number;
  baixados: number;
  falhas: number;
}

export default function ComunicadosHubPage() {
  const router = useRouter();
  const [metricas, setMetricas] = useState<Metricas>({
    aguardando: 0,
    enviados: 0,
    abertos: 0,
    baixados: 0,
    falhas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        // Busca fila (aguardando)
        const resFila = await fetch(
          `${API_URL}/api/arquivos-fila?status=AGUARDANDO_APROVACAO&perPage=1`,
        );
        const dataFila = await resFila.json();

        // Busca envios
        const resEnvios = await fetch(`${API_URL}/api/email-envios?perPage=999`);
        const dataEnvios = await resEnvios.json();
        const envios = dataEnvios.data || [];

        setMetricas({
          aguardando: dataFila.meta?.total || 0,
          enviados: envios.filter((e: any) => e.status === 'ENVIADO').length,
          abertos: envios.filter((e: any) => e.primeiraAberturaEm).length,
          baixados: envios.filter((e: any) => e.primeiroDownloadEm).length,
          falhas: envios.filter((e: any) => e.status === 'FALHOU').length,
        });
      } catch {
        // silencia erros de conexao
      } finally {
        setLoading(false);
      }
    };
    fetchMetricas();
  }, []);

  const cards = [
    {
      titulo: 'Fila de Aprovacao',
      descricao: 'Revise e aprove documentos antes do envio por email.',
      icone: '📬',
      rota: '/dashboard/comunicados/fila',
      cor: 'border-yellow-500',
      corBg: 'bg-yellow-50',
      metrica: metricas.aguardando,
      metricaLabel: 'pendentes',
      metricaCor: metricas.aguardando > 0 ? 'text-yellow-600' : 'text-green-600',
    },
    {
      titulo: 'Historico de Envios',
      descricao: 'Timeline completa: envio, abertura e download.',
      icone: '📧',
      rota: '/dashboard/comunicados/envios',
      cor: 'border-blue-500',
      corBg: 'bg-blue-50',
      metrica: metricas.enviados,
      metricaLabel: 'enviados',
      metricaCor: 'text-blue-600',
    },
    {
      titulo: 'Templates de Email',
      descricao: 'Edite os modelos de email por tipo de documento.',
      icone: '🎨',
      rota: '/dashboard/comunicados/templates',
      cor: 'border-purple-500',
      corBg: 'bg-purple-50',
      metrica: null,
      metricaLabel: 'configurar',
      metricaCor: 'text-purple-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Central de Comunicados
        </h1>
        <p className="text-slate-600 mt-2">
          Gerencie o envio automatico de documentos fiscais para seus clientes.
        </p>
      </div>

      {/* RESUMO RAPIDO */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <MiniCard label="Pendentes" value={metricas.aguardando} cor="text-yellow-600" />
          <MiniCard label="Enviados" value={metricas.enviados} cor="text-blue-600" />
          <MiniCard label="Abertos" value={metricas.abertos} cor="text-indigo-600" />
          <MiniCard label="Baixados" value={metricas.baixados} cor="text-green-600" />
          <MiniCard label="Falhas" value={metricas.falhas} cor="text-red-600" />
        </div>
      )}

      {/* CARDS DE NAVEGACAO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.rota}
            onClick={() => router.push(card.rota)}
            className={`cursor-pointer bg-white border-l-4 ${card.cor} rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 p-6 group`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{card.icone}</span>
              {card.metrica !== null ? (
                <span className={`text-3xl font-bold ${card.metricaCor}`}>
                  {card.metrica}
                </span>
              ) : (
                <span className={`text-sm font-medium ${card.metricaCor}`}>
                  {card.metricaLabel}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {card.titulo}
            </h2>
            <p className="text-sm text-slate-600">{card.descricao}</p>
            {card.metrica !== null && (
              <p className="text-xs text-slate-400 mt-3">
                {card.metrica} {card.metricaLabel}
              </p>
            )}
            <div className="mt-4 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Acessar →
            </div>
          </div>
        ))}
      </div>

      {/* FLUXO VISUAL */}
      <div className="mt-10 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Como funciona o pipeline
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <Step num="1" label="Arquivo detectado" cor="bg-slate-100" />
          <Arrow />
          <Step num="2" label="CNPJ + Cliente" cor="bg-orange-100" />
          <Arrow />
          <Step num="3" label="Fila de Aprovacao" cor="bg-yellow-100" />
          <Arrow />
          <Step num="4" label="Email Enviado" cor="bg-blue-100" />
          <Arrow />
          <Step num="5" label="Abertura + Download" cor="bg-green-100" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTES AUXILIARES
// ----------------------------------------------------------------------------
function MiniCard({
  label,
  value,
  cor,
}: {
  label: string;
  value: number;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-100 text-center">
      <p className={`text-2xl font-bold ${cor}`}>{value}</p>
      <p className="text-xs text-slate-500 uppercase mt-1">{label}</p>
    </div>
  );
}

function Step({ num, label, cor }: { num: string; label: string; cor: string }) {
  return (
    <div className={`${cor} px-4 py-3 rounded-lg text-center min-w-[120px]`}>
      <div className="text-xs text-slate-500 font-medium">Passo {num}</div>
      <div className="text-sm font-semibold text-slate-800 mt-1">{label}</div>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-300 text-xl font-bold mx-1">→</span>;
}