'use client';

// =================================================================
// INÍCIO: frontend/src/components/contabil/FlowStepper.tsx
// =================================================================
/**
 * 🧭 FlowStepper — Guia visual do fluxo contábil mensal (Bloco 4)
 * Mostra os 6 passos da rotina com status REAL (via summary) e
 * navegação direta. Elimina o mistério de "Tela 2".
 *
 * ⚠️ Se a sua página de revisão manual for outra, troque SÓ a constante:
 */
import { useRouter } from 'next/navigation';
import { Upload, RefreshCw, Brain, BookOpen, BarChart3, Download, Check } from 'lucide-react';

const REVIEW_URL = '/dashboard/lancamentos/revisao'; // ← troque aqui se necessário
const EXTRATO_URL = '/dashboard/contabil/extrato';

interface FlowStepperProps {
  summary: { baseCount: number; pendingCount: number; reconciledCount: number } | null;
}

type StepStatus = 'done' | 'current' | 'todo';

export default function FlowStepper({ summary }: FlowStepperProps) {
  const router = useRouter();

  const imported = summary ? summary.pendingCount + summary.reconciledCount : 0;
  const hasRecon = summary ? summary.reconciledCount > 0 : false;
  const hasPending = summary ? summary.pendingCount > 0 : false;

  const steps: {
    n: number; title: string; caption: string; icon: any;
    status: StepStatus; href?: string; badge?: string;
  }[] = [
    {
      n: 1, title: 'Importar Extrato',
      caption: imported > 0 ? `${imported} lançamento(s)` : 'CSV ou Fechamento Bancário',
      icon: Upload, status: imported > 0 ? 'done' : 'current',
    },
    {
      n: 2, title: 'Conciliar Automático',
      caption: hasRecon ? `${summary!.reconciledCount} conciliado(s)` : hasPending ? 'pronto p/ conciliar' : 'aguardando extrato',
      icon: RefreshCw, status: hasRecon ? 'done' : hasPending ? 'current' : 'todo',
    },
    {
      n: 3, title: 'Revisão Manual',
      caption: hasPending ? `${summary!.pendingCount} pendente(s)` : 'nada pendente',
      icon: Brain, status: hasPending ? 'current' : hasRecon ? 'done' : 'todo',
      href: REVIEW_URL, badge: hasPending ? String(summary!.pendingCount) : undefined,
    },
    {
      n: 4, title: 'Extrato / Razão',
      caption: 'conferir e imprimir',
      icon: BookOpen, status: imported > 0 ? 'current' : 'todo', href: EXTRATO_URL,
    },
    {
      n: 5, title: 'DRE + PDF',
      caption: hasRecon ? 'liberado' : 'requer conciliação',
      icon: BarChart3, status: hasRecon ? 'current' : 'todo',
    },
    {
      n: 6, title: 'Exportar SCI',
      caption: hasRecon ? 'liberado' : 'requer conciliação',
      icon: Download, status: hasRecon ? 'current' : 'todo',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-bold text-slate-800">Fluxo do mês</span>
        <span className="text-xs text-slate-500">— passos com seta navegam; os demais rodam nesta tela</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {steps.map((s) => {
          const Icon = s.icon;
          const clickable = !!s.href;
          return (
            <button
              key={s.n}
              disabled={!clickable}
              onClick={() => s.href && router.push(s.href)}
              title={clickable ? `Abrir: ${s.title}` : s.title}
              className={`relative rounded-lg border p-3 text-left transition-colors ${
                clickable ? 'cursor-pointer hover:border-teal-400 hover:bg-teal-50' : 'cursor-default'
              } ${
                s.status === 'done'
                  ? 'border-emerald-300 bg-emerald-50'
                  : s.status === 'current'
                    ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-300'
                    : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    s.status === 'done'
                      ? 'bg-emerald-600 text-white'
                      : s.status === 'current'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {s.status === 'done' ? <Check size={14} /> : s.n}
                </div>
                <Icon size={16} className={s.status === 'todo' ? 'text-slate-400' : 'text-teal-600'} />
              </div>
              <p className="mt-2 text-xs font-bold leading-tight text-slate-800">{s.title}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{s.caption}</p>
              {s.badge && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/components/contabil/FlowStepper.tsx
// =================================================================