/**
 * =================================================================
 * Conteúdo de ajuda: Projetos
 * =================================================================
 */
export const projetosContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Organize entregas e demandas do escritório como projetos com prazo, responsáveis e progresso automático.
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
            <strong>Crie um projeto:</strong> Defina nome, status (Planejamento, Ativo, Pausado, Concluído), prioridade e cor de identificação.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Vincule a um cliente (opcional):</strong> Se o projeto é para um cliente específico, associe aqui para rastrear no histórico dele.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Adicione tarefas:</strong> O progresso do projeto é calculado automaticamente baseado nas tarefas concluídas.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">KPIs de Projetos</h3>
      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>Ativos:</strong> Projetos em andamento no momento.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>Atrasados:</strong> Projetos com prazo vencido e não concluídos.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-teal-600">•</span>
          <span><strong>Progresso Geral:</strong> Média de conclusão de todos os projetos ativos.</span>
        </li>
      </ul>
    </div>
  </div>
);