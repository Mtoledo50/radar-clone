/**
 * =================================================================
 * Conteúdo de ajuda: Mentoria (Visão de Futuro)
 * =================================================================
 */
export const mentoriaContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Plano de ação personalizado baseado no seu Score — o sistema identifica onde você precisa melhorar e sugere ações concretas.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Inteligência</span>
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
            <strong>Defina sua visão:</strong> Onde você quer chegar em 1, 3 e 5 anos? (clientes, equipe, faturamento).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Veja seus focos:</strong> O sistema identifica suas 2 dimensões mais fracas e sugere 3 ações para cada.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Marque como concluída:</strong> Conforme for executando, marque as ações e veja a barra de progresso subir.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Checklist "Meu Plano"</h3>
      <p className="text-sm text-slate-700">
        Use a sub-aba "Meu Plano" para adicionar ações customizadas além das sugeridas pelo sistema. Tudo persiste e é auditável.
      </p>
    </div>
  </div>
);