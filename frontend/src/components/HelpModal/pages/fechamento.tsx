/**
 * =================================================================
 * Conteúdo de ajuda: Fechamento + DRE Bancário
 * =================================================================
 */
export const fechamentoContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Ciclo completo de fechamento bancário: importação de extrato, classificação automática, DRE gerencial e fechamento do mês.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Bancário</span>
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Contábil</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Aba Extrato:</strong> Importe o CSV do banco (1 clique). O sistema classifica automaticamente usando a memória de aprendizado.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Aba DRE:</strong> Veja receitas e despesas por natureza (categoria). Exporte em PDF ou CSV para o cliente.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Aba Conciliação:</strong> Confira se débitos do banco batem com NF-e de entrada. O sistema sugere pares com score de confiança.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Fechar mês:</strong> Quando tudo estiver certo, clique em "Fechar mês" — o mês fica bloqueado para edição (trava de compliance).
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Regra de Ouro</h3>
      <p className="text-sm text-slate-700">
        <strong>Mês fechado é imutável.</strong> Se precisar corrigir algo, reabra o mês (exige justificativa) e refaça o fechamento.
      </p>
    </div>
  </div>
);