/**
 * =================================================================
 * Conteúdo de ajuda: Tarefas
 * =================================================================
 */
export const tarefasContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      O dia a dia operacional — quem faz o quê, até quando e com que prioridade.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Operacional</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Crie uma tarefa:</strong> Defina título, responsável, prazo, categoria (Fiscal, Contábil, DP, etc) e status inicial.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Use filtros:</strong> Veja só as suas tarefas, as atrasadas ou por categoria específica.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Atualize o status:</strong> Mova a tarefa pelo fluxo: Backlog → A Fazer → Em Andamento → Revisão → Concluída.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Categorias disponíveis</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
        <div>• Fiscal</div>
        <div>• Contábil</div>
        <div>• DP (Departamento Pessoal)</div>
        <div>• Societário</div>
        <div>• Financeiro</div>
        <div>• Comercial</div>
        <div>• Interno</div>
      </div>
    </div>
  </div>
);