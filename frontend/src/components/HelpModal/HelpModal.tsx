/**
 * =================================================================
 * HelpModal — Modal genérico de ajuda contextual
 * =================================================================
 * Componente reutilizável que recebe conteúdo dinâmico.
 * Usado em conjunto com o hook useHelpModal e o config helpContent.
 *
 * Uso:
 *   <HelpModal
 *     isOpen={isOpen}
 *     onClose={closeHelp}
 *     title={content.title}
 *     subtitle={content.subtitle}
 *     content={content.content}
 *   />
 * =================================================================
 */
'use client';

import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose, title, subtitle, content }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-orange-50 p-6 rounded-t-xl border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo dinâmico */}
        <div className="p-6">
          {content}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 p-4 rounded-b-xl border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}