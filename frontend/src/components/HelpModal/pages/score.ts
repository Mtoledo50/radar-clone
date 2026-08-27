/**
 * =================================================================
 * Conteúdo de ajuda: Score do Escritório
 * =================================================================
 */
export const scoreContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Nota de 0 a 100 da saúde do seu escritório, baseada em 5 dimensões ponderadas.
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
            <strong>Veja sua nota total:</strong> 0–100 com barra colorida (vermelho → amarelo → verde).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Analise por dimensão:</strong> Mercado (25%), Pessoas (20%), Comercial (20%), Crescimento (15%), Gestão (20%).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Leia os insights:</strong> O sistema aponta seus 2 pontos fracos e 1 forte automaticamente.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Níveis</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
        <div>🥉 Bronze: 0–39</div>
        <div>🥈 Prata: 40–59</div>
        <div> Ouro: 60–79</div>
        <div>💎 Diamante: 80–100</div>
      </div>
    </div>
  </div>
);