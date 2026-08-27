/**
 * =================================================================
 * Conteúdo de ajuda: Relatórios Mensais
 * =================================================================
 */
export const relatoriosContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      PDFs automáticos com o resumo financeiro de cada cliente, gerados pela Aurora no dia 5 de cada mês.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Aurora</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Veja a lista de relatórios:</strong> Todos os PDFs gerados aparecem aqui, organizados por cliente e período.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Baixe em PDF:</strong> Clique no botão de download para enviar ao cliente.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Gere manualmente:</strong> Clique em "Gerar agora" para criar o relatório de um cliente específico fora do cronograma.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Conteúdo do PDF</h3>
      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span>Receitas e despesas do mês</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span>Saldo final (lucro/prejuízo)</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span>Top 10 despesas por categoria</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span>Comparativo com mês anterior</span>
        </li>
      </ul>
    </div>
  </div>
);