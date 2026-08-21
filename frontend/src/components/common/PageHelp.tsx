// =================================================================
// INÍCIO: frontend/src/components/common/PageHelp.tsx
// =================================================================
/**
 * 📚 Componente de ajuda universal das páginas
 * Modal com explicação: o que é, para quem serve, tipo de controle
 * e passos rápidos de uso.
 */
'use client';

import { useState } from 'react';
import { HelpCircle, X, Users, Shield, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { getPageHelp, PageHelpInfo } from '@/lib/page-help-catalog';

interface PageHelpProps {
  pathname: string;
}

const AUDIENCE_CFG: Record<string, { label: string; color: string; icon: any }> = {
  Empresa: { label: 'Uso Interno', color: 'bg-teal-100 text-teal-800', icon: Shield },
  Cliente: { label: 'Dados do Cliente', color: 'bg-blue-100 text-blue-800', icon: Users },
  Geral: { label: 'Uso Geral', color: 'bg-slate-100 text-slate-800', icon: Target },
};

const CONTROL_CFG: Record<string, { label: string; color: string }> = {
  Interno: { label: 'Controle Interno', color: 'bg-purple-100 text-purple-800' },
  Estratégico: { label: 'Estratégico', color: 'bg-orange-100 text-orange-800' },
  Operacional: { label: 'Operacional', color: 'bg-blue-100 text-blue-800' },
  Fiscal: { label: 'Fiscal/Contábil', color: 'bg-red-100 text-red-800' },
  Financeiro: { label: 'Financeiro', color: 'bg-green-100 text-green-800' },
};

export default function PageHelp({ pathname }: PageHelpProps) {
  const [open, setOpen] = useState(false);
  const info = getPageHelp(pathname);

  if (!info) return null;

  const audienceCfg = AUDIENCE_CFG[info.audience] || AUDIENCE_CFG.Geral;
  const controlCfg = CONTROL_CFG[info.controlType] || CONTROL_CFG.Operacional;
  const AudienceIcon = audienceCfg.icon;

  return (
    <>
      {/* Botão no header */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700 text-sm font-medium transition-colors"
        title="O que é esta página?"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">O que é isso?</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-orange-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{info.title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">Guia rápido de uso</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Descrição */}
              <p className="text-sm text-slate-700 leading-relaxed">{info.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${audienceCfg.color}`}>
                  <AudienceIcon className="h-3 w-3" />
                  {audienceCfg.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${controlCfg.color}`}>
                  {controlCfg.label}
                </span>
              </div>

              {/* Passos */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Como usar
                </h3>
                <ol className="space-y-2">
                  {info.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Páginas relacionadas */}
              {info.relatedPages && info.relatedPages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <ArrowRight className="h-4 w-4 text-orange-600" />
                    Páginas relacionadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {info.relatedPages.map((p) => (
                      <span key={p} className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setOpen(false)}
                className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// =================================================================
// FIM: frontend/src/components/common/PageHelp.tsx
// =================================================================