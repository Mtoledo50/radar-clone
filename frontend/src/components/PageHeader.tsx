/**
 * =================================================================
 * PageHeader — Cabeçalho padrão para todas as páginas
 * =================================================================
 * Componente reutilizável que padroniza:
 * - Ícone + Título + Botão "?" (ajuda)
 * - Subtítulo descritivo
 * - Dica inline: "Para saber mais, clique no ?"
 *
 * Uso:
 *   <PageHeader
 *     icon={<Landmark className="h-8 w-8 text-teal-600" />}
 *     title="Cobrança & CNAB"
 *     subtitle="Régua de cobrança + remessa/retorno CNAB 240/400"
 *     onHelpClick={() => setShowHelp(true)}
 *   />
 * =================================================================
 */
'use client';

import { HelpCircle } from 'lucide-react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onHelpClick: () => void;
}

export default function PageHeader({ icon, title, subtitle, onHelpClick }: PageHeaderProps) {
  return (
    <div>
      {/* Linha 1: Ícone + Título + Botão ? */}
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <button
          onClick={onHelpClick}
          className="p-2 text-slate-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-slate-100"
          title="Guia completo de uso"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Linha 2: Subtítulo */}
      <p className="text-slate-600 mt-1">{subtitle}</p>

      {/* Linha 3: Dica inline (sempre visível) */}
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
        <span className="text-teal-500"></span>
        Para saber mais sobre o funcionamento desta página, clique no botão{' '}
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-[10px] font-bold text-slate-500">
          ?
        </span>
        {' '}ao lado do título.
      </p>
    </div>
  );
}