
---

### 📂 `docs/adrs/ADR-118-parser-cnpj-nome-arquivo.md`

```markdown
# ADR-118: Identificação de Cliente por CNPJ no Nome do Arquivo

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O Watch Folder detecta arquivos salvos em `C:\Documentos\Enviar`. Precisa identificar qual cliente do escritório aquele arquivo pertence.

**Problema:**
- Como extrair CNPJ do nome do arquivo de forma confiável?
- Nomes de arquivo variam: `DAS_12345678000195_082026.pdf`, `12.345.678-0001-95-DAS.pdf`, etc.

## 🎯 Decisão

**Regex flexível** que aceita CNPJ com ou sem pontuação:

```typescript
const REGEX_CNPJ = /\b(\d{2}[.\-\/]?\d{3}[.\-\/]?\d{3}[.\-\/]?\d{4}[.\-\/]?\d{2})\b/g;

Validação:

Extrair todos os matches do nome do arquivo
Remover pontuação
Validar dígitos verificadores (algoritmo oficial)
Buscar cliente no banco pelo CNPJ

Exemplos Suportados:

DAS_12345678000195_082026.pdf ✅
12.345.678-0001-95-DAS.pdf ✅
12345678/0001-95_DAS.pdf ✅
DAS_12345678000195.pdf ✅

💡 Implementação

// backend/src/comunicados/cnpj-parser/cnpj-parser.service.ts

@Injectable()
export class CnpjParserService {
  private readonly REGEX_CNPJ = /\b(\d{2}[.\-\/]?\d{3}[.\-\/]?\d{3}[.\-\/]?\d{4}[.\-\/]?\d{2})\b/g;

  extrairCnpj(nomeArquivo: string): string | null {
    const matches = nomeArquivo.match(this.REGEX_CNPJ);
    if (!matches) return null;

    for (const match of matches) {
      const cnpj = match.replace(/\D/g, ''); // Remover pontuação
      
      if (this.validarCnpj(cnpj)) {
        return this.formatarCnpj(cnpj);
      }
    }

    return null;
  }

  private validarCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false; // Todos iguais

    // Algoritmo oficial de validação
    const calcularDigito = (base: string, pesos: number[]) => {
      const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const P1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const P2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const digito1 = calcularDigito(cnpj.slice(0, 12), P1);
    const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, P2);

    return cnpj.endsWith(`${digito1}${digito2}`);
  }

  private formatarCnpj(cnpj: string): string {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

Extração de Competência
// backend/src/comunicados/cnpj-parser/cnpj-parser.service.ts

extrairCompetencia(nomeArquivo: string): string | null {
  // Padrão 1: MMYYYY ou MM-YYYY
  const match1 = nomeArquivo.match(/(\d{2})[.\-\/]?(\d{4})/);
  if (match1) {
    const mes = match1[1];
    const ano = match1[2];
    if (parseInt(mes) >= 1 && parseInt(mes) <= 12) {
      return `${ano}-${mes}`;
    }
  }

  // Padrão 2: Mês por extenso (JAN, FEV, MAR...)
  const meses: Record<string, string> = {
    JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
    JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
  };

  for (const [nome, num] of Object.entries(meses)) {
    if (nomeArquivo.toUpperCase().includes(nome)) {
      const anoMatch = nomeArquivo.match(/(20\d{2})/);
      if (anoMatch) {
        return `${anoMatch[1]}-${num}`;
      }
    }
  }

  return null;
}


✅ Consequências

Positivas

✅ Flexível: Aceita múltiplos formatos de CNPJ
✅ Validação Oficial: Algoritmo de dígitos verificadores
✅ Automático: Watch Folder identifica cliente sem intervenção


Negativas

❌ Falsos Positivos: Números aleatórios podem ser confundidos com CNPJ
❌ Dependência de Nome: Se arquivo não tem CNPJ no nome, falha

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/cnpj-parser/cnpj-parser.service.ts
backend/src/comunicados/watch-folder/watch-folder.service.ts

ADRs relacionadas:

ADR-113 (Watch Folder)

🔄 Histórico de Revisões
Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial (Sprint F15)


