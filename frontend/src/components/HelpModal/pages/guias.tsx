/**
 * =================================================================
 * Conteúdo de ajuda: Guias de Imposto
 * =================================================================
 */
export const guiasContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Cálculo automático de guias de imposto (DAS do Simples Nacional e ISS) com memória de cálculo auditável.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Fiscal</span>
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Aurora</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Aurora calcula automaticamente:</strong> Todo mês, baseado nas NFS-e importadas, o sistema calcula DAS e ISS.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Revise o valor:</strong> Confira o cálculo e a memória (passo a passo de como chegou naquele valor).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Aprove e imprima:</strong> Clique em "Aprovar" e depois "Imprimir" para gerar o PDF da guia oficial.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Regra de Ouro</h3>
      <p className="text-sm text-slate-700">
        <strong>A Aurora calcula, mas quem transmite é você.</strong> O sistema prepara a guia, mas o envio ao portal oficial (e-CAC/Prefeitura) é manual — compliance fiscal.
      </p>
    </div>
  </div>
);