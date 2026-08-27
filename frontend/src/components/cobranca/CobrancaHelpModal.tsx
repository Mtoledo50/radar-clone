// =================================================================
// INÍCIO: frontend/src/components/cobranca/CobrancaHelpModal.tsx
// =================================================================
'use client';

import { X } from 'lucide-react';

interface CobrancaHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CobrancaHelpModal({ isOpen, onClose }: CobrancaHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-orange-50 p-6 rounded-t-xl border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cobrança & CNAB</h2>
              <p className="text-sm text-slate-600 mt-1">Guia rápido de uso</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Descrição */}
          <p className="text-slate-700">
            Automatize a cobrança de clientes e a comunicação com o banco via arquivos CNAB 240/400, 
            com aprovação humana em cada etapa.
          </p>

          {/* Tags */}
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
              Operacional
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
              Financeiro
            </span>
          </div>

          {/* Como usar */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-teal-600">✓</span> Como usar
            </h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
                <p className="text-slate-700">
                  <strong>Aba Cobranças:</strong> Crie cobranças manualmente ou importe do banco de clientes 
                  (o sistema autopreenche nome, CNPJ e honorário ao selecionar um cliente da casa).
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
                <p className="text-slate-700">
                  <strong>Aba Remessas:</strong> Gere o arquivo <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">.rem</code> com 
                  todas as cobranças pendentes e envie ao banco. O sistema registra o histórico e marca as cobranças como "Gerada".
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
                <p className="text-slate-700">
                  <strong>Aba Retornos:</strong> Faça upload do arquivo de retorno do banco (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">.ret</code> ou <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">.txt</code>). 
                  O sistema identifica os pagamentos e aplica a baixa automática nas cobranças correspondentes.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
                <p className="text-slate-700">
                  <strong>Aba Régua:</strong> Configure regras de cobrança automática (ex: "Lembrete +3 dias por e-mail"). 
                  Ao executar, o sistema cria eventos pendentes de aprovação — você revisa, ajusta o destinatário se necessário, e aprova o envio.
                </p>
              </li>
            </ol>
          </div>

          {/* Fluxo de vida */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Fluxo de vida da cobrança</h3>
            <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700 space-y-2">
              <div>PENDENTE → GERADA (remessa ao banco) → ENVIADA → PAGA (retorno do banco)</div>
              <div className="text-slate-500">                    ↓</div>
              <div>VENCIDA (derivada automaticamente)</div>
              <div className="text-slate-500">                    ↓</div>
              <div>Evento de Régua → AGUARDANDO_APROVAÇÃO → APROVADO → ENVIADO</div>
            </div>
          </div>

          {/* Regras de Ouro */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Regras de Ouro</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="text-teal-600">•</span>
                <span><strong>Nunca dispare sem aprovação:</strong> O sistema prepara, sugere e monta a mensagem, mas <strong>obriga</strong> um humano a clicar em "Aprovar" antes de qualquer comunicação sair (ADR-084).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-600">•</span>
                <span><strong>Destinatário inteligente:</strong> O sistema busca o <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">contactEmail</code> ou <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">contactPhone</code> do cliente vinculado. Se não houver vínculo, você pode sobrescrever manualmente no evento antes de aprovar (ADR-087).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-600">•</span>
                <span><strong>Falha real = FALHOU:</strong> Se o envio falhar (ex: e-mail inválido), o evento muda para status "Falhou" — sem fallback silencioso (ADR-086).</span>
              </li>
            </ul>
          </div>

          {/* Páginas relacionadas */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-orange-600">→</span> Páginas relacionadas
            </h3>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors">
                funcionario-digital
              </span>
              <span className="px-3 py-1 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors">
                cobranca
              </span>
              <span className="px-3 py-1 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors">
                clientes
              </span>
            </div>
          </div>
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
// =================================================================
// FIM: frontend/src/components/cobranca/CobrancaHelpModal.tsx
// =================================================================