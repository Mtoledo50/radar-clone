/**
 * =================================================================
 * Conteúdo de ajuda: Lançamentos Contábeis
 * =================================================================
 */
export const lancamentosContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Registro de partidas dobradas (Débito e Crédito) para escrituração contábil oficial.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Contábil</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Crie um lançamento:</strong> Defina data, histórico e pelo menos 2 contas (uma debitada, outra creditada).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Use o autocomplete:</strong> Busque contas por código ou nome. O sistema sugere contas usadas anteriormente.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Espelhe o valor:</strong> O sistema só deixa salvar se Débito = Crédito (partida dobrada).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Promova do bancário:</strong> Meses fechados no bancário podem ser promovidos automaticamente para lançamentos contábeis.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Regra contábil</h3>
      <p className="text-sm text-slate-700">
        <strong>Toda partida tem 2 lados:</strong> Débito (aplicação) e Crédito (origem). Ex: Pagamento de aluguel → D Despesa com Aluguel / C Banco.
      </p>
    </div>
  </div>
);