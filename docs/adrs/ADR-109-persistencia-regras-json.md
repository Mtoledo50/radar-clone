
---

### 📂 `docs/adrs/ADR-109-persistencia-regras-json.md`

```markdown
# ADR-109: Persistência de Regras Aprendidas em JSON (Transição Futura para PostgreSQL)

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O Extrator Bancário aprende com as correções do contador: se você classifica "PIX - CLARO" como "Despesa com Telecom", todos os PIX da Claro nos próximos extratos virão classificados automaticamente.

**Problema:**
- Onde persistir essas regras?
- Banco de dados do Radar (PostgreSQL) ou arquivo local?

## 🎯 Decisão

**Fase 1 (Atual):** Persistir em arquivo JSON local (`extrator-bancario/backend/data/regras/regras_aprendidas.json`)

**Fase 2 (Futuro - Sprint F15):** Migrar para tabela PostgreSQL no Radar (multi-tenant)

### Regras:
1. **Merge Idempotente:** Regras são mescladas por `(descricao + conta)`, não duplicadas
2. **Estrutura Simples:**
   ```json
   [
     {
       "descricao": "PIX - CLARO",
       "conta": "Despesa com Telecom",
       "hits": 15,
       "ultimaAtualizacao": "2026-09-15T10:30:00Z"
     }
   ]

3. Ordenação por hits: Regras mais usadas aparecem primeiro (performance)

💡 Implementação

# extrator-bancario/backend/app/services/rules_service.py

import json
from pathlib import Path

RULES_FILE = Path('data/regras/regras_aprendidas.json')

def load_rules() -> list[dict]:
    if not RULES_FILE.exists():
        return []
    with open(RULES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_rule(descricao: str, conta: str):
    rules = load_rules()
    
    # Buscar regra existente (merge idempotente)
    existing = next((r for r in rules if r['descricao'] == descricao and r['conta'] == conta), None)
    
    if existing:
        existing['hits'] += 1
        existing['ultimaAtualizacao'] = datetime.now().isoformat()
    else:
        rules.append({
            'descricao': descricao,
            'conta': conta,
            'hits': 1,
            'ultimaAtualizacao': datetime.now().isoformat(),
        })
    
    # Ordenar por hits (desc)
    rules.sort(key=lambda r: r['hits'], reverse=True)
    
    # Salvar
    with open(RULES_FILE, 'w', encoding='utf-8') as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)

def find_rule(descricao: str) -> dict | None:
    rules = load_rules()
    # Busca fuzzy (contém)
    return next((r for r in rules if descricao.upper() in r['descricao'].upper()), None)

    ✅ Consequências
Positivas
✅ Simples: Arquivo JSON é fácil de debugar e versionar
✅ Rápido: Leitura/escrita em disco é instantânea para <1000 regras
✅ Portável: Pode ser copiado entre máquinas
Negativas
❌ Não Multi-Tenant: Regras são globais (não separadas por cliente)
❌ Sem Concorrência: Múltiplos usuários editando ao mesmo tempo pode corromper
📚 Referências
Arquivos que usam esta ADR:
extrator-bancario/backend/app/services/rules_service.py
extrator-bancario/backend/data/regras/regras_aprendidas.json
ADRs relacionadas:
ADR-108 (Parser stateful)
ADR-112 (Human-in-the-Loop)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial

