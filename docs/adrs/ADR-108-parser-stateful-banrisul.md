
---

### 📂 `docs/adrs/ADR-108-parser-stateful-banrisul.md`

```markdown
# ADR-108: Parser Stateful para Banrisul (Lida com Quebra de Linha do OCR)

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O Extrator Bancário precisa processar PDFs de extratos do Banrisul. O OCR (Mistral) frequentemente quebra linhas de forma inconsistente:


13/08 PIX CRED CLARO S.A.
123.456.789-00 JOÃO SILVA
R$ 150,00


Em vez de uma linha única, o OCR gera 3 linhas separadas.

## 🎯 Decisão

Implementar **parser stateful** que mantém estado entre linhas:

1. **Estado 1:** Aguardando data + tipo + descrição
2. **Estado 2:** Aguardando CPF/CNPJ + nome
3. **Estado 3:** Aguardando valor

Quando todos os 3 estados são preenchidos, cria um lançamento completo.

## 💡 Implementação

```python
# extrator-bancario/backend/app/parsers/banrisul_parser.py

class BanrisulParser:
    def __init__(self):
        self.state = 'WAITING_DATE'
        self.current_entry = {}
    
    def parse(self, text: str) -> list[dict]:
        entries = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if self.state == 'WAITING_DATE':
                # Procurar padrão: DD/MM + tipo + descrição
                match = re.match(r'(\d{2}/\d{2})\s+(PIX CRED|PIX DEB|TED|DOC)\s+(.+)', line)
                if match:
                    self.current_entry = {
                        'date': match.group(1),
                        'type': match.group(2),
                        'description': match.group(3),
                    }
                    self.state = 'WAITING_CPF'
            
            elif self.state == 'WAITING_CPF':
                # Procurar padrão: CPF/CNPJ + nome
                match = re.match(r'(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})\s+(.+)', line)
                if match:
                    self.current_entry['counterparty_doc'] = match.group(1)
                    self.current_entry['counterparty_name'] = match.group(2)
                    self.state = 'WAITING_VALUE'
            
            elif self.state == 'WAITING_VALUE':
                # Procurar padrão: R$ valor
                match = re.match(r'R\$\s*([\d.,]+)', line)
                if match:
                    value_str = match.group(1).replace('.', '').replace(',', '.')
                    self.current_entry['value'] = float(value_str)
                    
                    # Entry completa, adicionar à lista
                    entries.append(self.current_entry)
                    
                    # Reset estado
                    self.current_entry = {}
                    self.state = 'WAITING_DATE'
        
        return entries

✅ Consequências
Positivas
✅ Tolerante a OCR Ruim: Lida com quebras de linha inconsistentes
✅ Robusto: Se uma linha falhar, não quebra o parser inteiro
Negativas
❌ Complexidade: Parser stateful é mais complexo que regex simples
❌ Específico do Banrisul: Cada banco exige parser próprio
📚 Referências
Arquivos que usam esta ADR:
extrator-bancario/backend/app/parsers/banrisul_parser.py
ADRs relacionadas:
ADR-107 (Mistral OCR)
ADR-109 (Persistência de regras)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial