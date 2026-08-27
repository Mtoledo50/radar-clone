/**
 * =================================================================
 * Conteúdo de ajuda: Precificação
 * =================================================================
 */
export const precificacaoContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Calcule quanto cobrar de cada cliente baseado em horas demandadas, custo hora e margem de lucro desejada.
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
            <strong>Informe as horas:</strong> Quantas horas/mês o cliente demanda (ex: 20h de contabilidade + 5h de fiscal).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Defina seu custo hora:</strong> Quanto custa para você produzir 1 hora de trabalho (salários + encargos + overhead ÷ horas produtivas).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Escolha a margem:</strong> Percentual de lucro desejado (ex: 30%). O sistema calcula o valor ideal automaticamente.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Gere a proposta:</strong> Clique em "Criar Proposta" para enviar ao cliente com link público e tracking.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Dica rápida</h3>
      <p className="text-sm text-slate-700">
        Use a calculadora para <strong>revisar honorários antigos</strong> — muitos clientes estão pagando abaixo do ideal sem você saber.
      </p>
    </div>
  </div>
);