/**
 * =================================================================
 * Conteúdo de ajuda: Carteira de Clientes
 * =================================================================
 */
export const clientesContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Gerencie sua carteira de clientes: contratos, planos, honorários e status (ativo/inativo/prospect).
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Comercial</span>
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Operacional</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Busque por empresa, CNPJ ou contato:</strong> Use a barra de busca no topo para encontrar clientes rapidamente.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Importe em massa via CSV:</strong> Clique em "Importar CSV" para subir sua planilha de honorários (até 100 clientes de uma vez).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Cadastre manualmente:</strong> Clique em "Novo Contrato" para adicionar um cliente com plano, honorário e add-ons.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Exporte para Excel:</strong> Clique em "Exportar" para gerar um CSV com todos os dados da carteira.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">KPIs importantes</h3>
      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>MRR (Receita Recorrente Mensal):</strong> Soma dos honorários de todos os clientes ativos.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>Churn:</strong> Percentual de clientes que cancelaram no período.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>Ticket Médio:</strong> Honorário médio por cliente (MRR ÷ clientes ativos).</span>
        </li>
      </ul>
    </div>
  </div>
);