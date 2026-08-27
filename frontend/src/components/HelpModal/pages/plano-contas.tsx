/**
 * =================================================================
 * Conteúdo de ajuda: Plano de Contas
 * =================================================================
 */
export const planoContasContent = (
  <div className="space-y-4">
    <p className="text-slate-700">
      Estrutura contábil do seu escritório (padrão SCI 90113) com 1.207 contas organizadas por tipo.
    </p>

    <div className="flex gap-2">
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Contábil</span>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-teal-600">✓</span> Como usar
      </h3>
      <ol className="space-y-3">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-slate-700">
            <strong>Navegue pela árvore:</strong> Contas organizadas por tipo (Ativo, Passivo, Receita, Despesa) com hierarquia pai→filho.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-slate-700">
            <strong>Crie contas novas:</strong> Clique em "Nova Conta" e defina código, nome, tipo e natureza (devedora/credora).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-slate-700">
            <strong>Edite ou desative:</strong> Contas em uso não podem ser excluídas (soft delete preserva histórico).
          </p>
        </li>
      </ol>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">Multi-planos por cliente</h3>
      <p className="text-sm text-slate-700">
        Cada cliente pode ter um plano de contas ativo diferente (ex: SCI 90113 ou SCI 90132). O sistema usa o plano ativo do cliente para balancete, sugestões e exportação SCI.
      </p>
    </div>
  </div>
);