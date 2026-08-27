/**
 * =================================================================
 * Conteúdo de ajuda: Propostas Comerciais
 * =================================================================
 */
export const propostasContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Motor de propostas comerciais: wizard de 5 passos, link público, tracking de engajamento e PDF/Excel.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Comercial</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Escolha o cliente:</strong> Selecione da carteira ou crie um prospect novo.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Selecione o plano:</strong> START, PRIME, BLACK ou crie um personalizado com serviços avulsos.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Adicione serviços avulsos:</strong> IRPF, BPO, LGPD, consultoria — tudo que não está no plano base.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Defina desconto (opcional):</strong> O sistema calcula ganho vs concessão e mostra o "dinheiro na mesa".
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">5</span>
          <p className="text-slate-700">
            <strong>Envie o link:</strong> O cliente vê a proposta online, você rastreia se ele abriu e recebe notificação.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Funil de Vendas</h3>
      <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700">
        DRAFT → SENT → VIEWED → CLOSED_WON (ganhou) ou CLOSED_LOST (perdeu)
      </div>
    </div>
  </div>
);