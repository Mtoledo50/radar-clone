/**
 * =================================================================
 * Conteúdo de ajuda: NFS-e (Notas Fiscais de Serviço)
 * =================================================================
 */
export const nfseContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Gestão de Notas Fiscais de Serviço: importação de XML, coleta automática por e-mail e vínculo com clientes.
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
            <strong>Upload manual:</strong> Arraste arquivos XML de NFS-e (emitidas ou recebidas) para a área de upload.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Coleta automática:</strong> A Aurora coleta NFS-e do e-mail a cada 30 minutos (se configurado).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Vínculo com cliente:</strong> O sistema tenta vincular por CNPJ automaticamente. Se não reconhecer, vai para a fila de revisão.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">4</span>
          <p className="text-slate-700">
            <strong>Revise e aprove:</strong> Confira os dados extraídos e aprove para integrar ao ciclo contábil.
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Status das NFS-e</h3>
      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="text-green-600"></span>
          <span><strong>IMPORTED:</strong> Processada e vinculada a um cliente.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-amber-600">🟡</span>
          <span><strong>REVIEW:</strong> Aguardando revisão (cliente não identificado).</span>
        </li>
        <li className="flex gap-2">
          <span className="text-blue-600">🔵</span>
          <span><strong>ACCOUNTED:</strong> Integrada ao ciclo contábil.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-red-600">🔴</span>
          <span><strong>REJECTED:</strong> Rejeitada (dados inválidos).</span>
        </li>
      </ul>
    </div>
  </div>
);