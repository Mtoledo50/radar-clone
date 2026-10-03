
---

### 📂 `docs/adrs/ADR-110-mascaramento-lgpd.md`

```markdown
# ADR-110: Mascaramento LGPD no Backend (Últimos 3 Dígitos Preservados)

**Data:** 2026-09  
**Status:** ✅ Aceita (Regra Crítica de Compliance)  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência LGPD)

---

## 📋 Contexto

O Extrator Bancário processa PDFs que contêm dados sensíveis (CPF, CNPJ, nomes completos). Exibir esses dados no frontend sem mascaramento viola a LGPD.

**Problema:**
- Como permitir que o contador identifique o documento sem expor dados completos?
- Onde aplicar o mascaramento: backend ou frontend?

## 🎯 Decisão

Aplicar mascaramento **no backend** antes de enviar dados ao frontend:

- **CPF:** `123.456.789-00` → `***.456.789-**` (preserva últimos 3 dígitos do meio)
- **CNPJ:** `12.345.678/0001-95` → `**.345.678/****-**` (preserva últimos 3 dígitos do meio)
- **Nome:** `JOÃO DA SILVA` → `JOÃO D***` (preserva primeiro nome)

### Regras:
1. **Backend é Responsável:** Frontend nunca recebe dados completos
2. **Logs Também Mascaram:** Erros e logs não imprimem dados sensíveis
3. **Override para Admin:** Apenas usuários com perfil `CONTADOR` podem ver dados completos (via endpoint separado)

## 💡 Implementação

```python
# extrator-bancario/backend/app/services/lgpd_service.py

import re

def mascarar_documento(doc: str) -> str:
    """
    Mascara CPF ou CNPJ, preservando últimos 3 dígitos do meio.
    
    Exemplos:
    - CPF: 123.456.789-00 → ***.456.789-**
    - CNPJ: 12.345.678/0001-95 → **.345.678/****-**
    """
    # Remover pontuação
    digits = re.sub(r'\D', '', doc)
    
    if len(digits) == 11:  # CPF
        return f"***.{digits[3:6]}.{digits[6:9]}-**"
    elif len(digits) == 14:  # CNPJ
        return f"**.{digits[2:5]}.{digits[5:8]}/****-**"
    else:
        return doc  # Não é CPF/CNPJ, retornar como está

def mascarar_nome(nome: str) -> str:
    """
    Mascara nome, preservando primeiro nome.
    
    Exemplo: JOÃO DA SILVA → JOÃO D***
    """
    parts = nome.split()
    if len(parts) <= 1:
        return nome
    
    first_name = parts[0]
    last_initial = parts[-1][0] if parts[-1] else ''
    
    return f"{first_name} {last_initial}***"

    Aplicação no Parser

# extrator-bancario/backend/app/parsers/base_parser.py

def parse(self, text: str) -> list[dict]:
    entries = self._extract_entries(text)
    
    # Mascaramento LGPD antes de retornar
    for entry in entries:
        if 'counterparty_doc' in entry:
            entry['counterparty_doc'] = mascarar_documento(entry['counterparty_doc'])
        if 'counterparty_name' in entry:
            entry['counterparty_name'] = mascarar_nome(entry['counterparty_name'])
    
    return entries

✅ Consequências
Positivas
✅ LGPD Compliant: Dados sensíveis nunca chegam ao frontend
✅ Identificável: Contador ainda consegue identificar o documento (últimos 3 dígitos)
✅ Centralizado: Mascaramento em um único lugar (backend)
Negativas
❌ Perda de Informação: Contador não vê dados completos (mas pode solicitar via endpoint admin)
❌ Performance: Mascaramento adiciona ~1ms por documento (desprezível)
📚 Referências
Arquivos que usam esta ADR:
extrator-bancario/backend/app/services/lgpd_service.py
extrator-bancario/backend/app/parsers/base_parser.py
ADRs relacionadas:
ADR-032 (Cofres AES-256-GCM)
ADR-059 (Cofre local com reveal auditável)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial

