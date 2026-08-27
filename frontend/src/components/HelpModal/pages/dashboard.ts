/**
 * =================================================================
 * Conteúdo de ajuda: Dashboard Executivo
 * =================================================================
 */
export const dashboardContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Visão geral do escritório com KPIs em tempo real: clientes ativos, faturamento, equipe e metas.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Uso Interno</span>
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Estratégico</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Visualize KPIs principais no topo:</strong> Clientes ativos, faturamento do mês, equipe e progresso das metas.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Clique em qualquer card:</strong> Navegue direto para a página detalhada (ex: clique em "Clientes" para ir à Carteira).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Use os filtros de período:</strong> Compare meses e veja tendências de crescimento.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Dica rápida</h3>
      <p className="text-sm text-slate-700">
        O Dashboard é seu "painel de controle" — comece o dia aqui para saber o que precisa de atenção.
      </p>
    </div>
  </div>
);