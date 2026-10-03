
---

### 📂 `docs/adrs/ADR-112-human-in-the-loop-fluxo.md`

```markdown
# ADR-112: Human-in-the-Loop no Fluxo do Extrator (Lançamentos Chegam como "Pendente")

**Data:** 2026-09  
**Status:** ✅ Aceita (Regra Crítica)  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O Extrator Bancário classifica automaticamente lançamentos com base em regras aprendidas. Porém, classificação errada pode gerar erros contábeis graves.

**Problema:**
Como garantir que o contador revise antes de importar para o sistema contábil?

## 🎯 Decisão

**Todos os lançamentos extraídos chegam com `status: "pendente"`**, exigindo revisão humana antes de:
1. Salvar regras de classificação (após edição manual)
2. Exportar CSV final

### Fluxo:
1. Upload de PDF → Extração → Lançamentos com `status: "pendente"`
2. Contador revisa na tabela editável (pode editar conta de débito/crédito)
3. Contador clica em "Salvar Regras Aprendidas" → Regras persistidas
4. Contador clica em "Exportar CSV" → CSV gerado com dados revisados

## 💡 Implementação

### Frontend: Tabela Editável

```tsx
// extrator-bancario/frontend/src/components/TabelaLancamentos.tsx

export function TabelaLancamentos({ lancamentos, onEditarConta }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Valor</th>
          <th>Conta Débito</th>
          <th>Conta Crédito</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {lancamentos.map((lanc, i) => (
          <tr key={i} className={lanc.status === 'pendente' ? 'bg-yellow-50' : ''}>
            <td>{lanc.data}</td>
            <td>{lanc.descricao}</td>
            <td>R$ {lanc.valor.toFixed(2)}</td>
            <td>
              <input
                value={lanc.contaDebito}
                onChange={(e) => onEditarConta(i, 'contaDebito', e.target.value)}
                className="border px-2 py-1"
              />
            </td>
            <td>
              <input
                value={lanc.contaCredito}
                onChange={(e) => onEditarConta(i, 'contaCredito', e.target.value)}
                className="border px-2 py-1"
              />
            </td>
            <td>
              {lanc.status === 'pendente' && <span className="text-yellow-600">🟡 Pendente</span>}
              {lanc.status === 'revisado' && <span className="text-green-600">✅ Revisado</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

Backend: Endpoint de Exportação (Exige Revisão)

# extrator-bancario/backend/app/main.py

@app.post("/api/exportar-csv")
async def exportar_csv(lancamentos: list[dict]):
    # Verificar se todos foram revisados
    pendentes = [l for l in lancamentos if l.get('status') != 'revisado']
    
    if pendentes:
        raise HTTPException(
            status_code=400,
            detail=f"Existem {len(pendentes)} lançamentos pendentes de revisão. Revise todos antes de exportar."
        )
    
    # Gerar CSV
    filepath = gerar_csv(lancamentos)
    return FileResponse(filepath, filename="extrato_contabil.csv")

    ✅ Consequências
Positivas
✅ Segurança Contábil: Contador revisa tudo antes de importar
✅ Aprendizado: Correções manuais alimentam regras automáticas
✅ Rastreabilidade: Status de cada lançamento é auditável
Negativas
❌ Friction: Exige revisão manual (mas é necessária)
❌ Tempo: Contador gasta tempo revisando (mas economiza tempo de digitação)
📚 Referências
Arquivos que usam esta ADR:
extrator-bancario/frontend/src/components/TabelaLancamentos.tsx
extrator-bancario/backend/app/main.py
ADRs relacionadas:
ADR-030 (Human-in-the-Loop obrigatório)
ADR-109 (Persistência de regras)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial

