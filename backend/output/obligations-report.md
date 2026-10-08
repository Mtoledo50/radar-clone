# 📋 Relatório de Importação de Obrigações — Modo PREVIEW

**Total processado:** 204 linhas do Excel
**Sucesso:** 204
**Falhas de parsing:** 0

## 🔴 Slug duplicado (impede importação sem deduplicação manual)

### `dasn-simei-dec-anual-simples-nacional-para-o-mei` (2 ocorrências)
- Linha 69: DASN - SIMEI - Dec Anual Simples Nacional para o MEI
- Linha 70: DASN - SIMEI - DEC ANUAL SIMPLES NACIONAL PARA O MEI

### `declaracao-ir` (5 ocorrências)
- Linha 78: Declaração IR
- Linha 79: Declaração IR
- Linha 80: Declaração IR
- Linha 81: Declaração IR
- Linha 82: Declaração IR

### `sped-ecd-escrituracao-contabil-digital` (2 ocorrências)
- Linha 200: SPED ECD - Escrituração Contábil Digital
- Linha 201: SPED ECD - ESCRITURAÇÃO CONTÁBIL DIGITAL

## 🟡 MiniName colidente (confirma decisão ADR-149: miniName não é chave única)

### `BOMBEIRO` (2 ocorrências)
- Linha 7: ALVARÁ BOMBEIRO (BOMBEIRO)
- Linha 203: TAXA ALVARÁ BOMBEIRO (BOMBEIRO)

### `SAN` (2 ocorrências)
- Linha 9: ALVARÁ SANITÁRIO (SAN)
- Linha 205: TAXA ALVARÁ SANITÁRIO (SAN)

### `CND` (2 ocorrências)
- Linha 26: CND ESTADUAL (CND)
- Linha 28: CND PREFEITURA (CND)

### `CSLL- TRIM` (2 ocorrências)
- Linha 51: DARF CSLL - TRIMESTRAL - LUCRO PRESUMIDO (CSLL- TRIM)
- Linha 52: DARF CSLL - TRIMESTRAL - LUCRO REAL (CSLL- TRIM)

### `IRPJ` (4 ocorrências)
- Linha 57: DARF IRPJ - MENSAL - LUCRO PRESUMIDO (IRPJ)
- Linha 58: DARF IRPJ - MENSAL - LUCRO REAL (IRPJ)
- Linha 59: DARF IRPJ - TRIMESTRAL - LUCRO PRESUMIDO (IRPJ)
- Linha 60: DARF IRPJ - TRIMESTRAL- LUCRO REAL (IRPJ)

### `PGDAS` (3 ocorrências)
- Linha 67: DAS - Mensal (PGDAS)
- Linha 121: Extrato do Simples (PGDAS)
- Linha 191: RECIBO PGDAS (PGDAS)

### `DASN MEI` (2 ocorrências)
- Linha 69: DASN - SIMEI - Dec Anual Simples Nacional para o MEI (DASN MEI)
- Linha 70: DASN - SIMEI - DEC ANUAL SIMPLES NACIONAL PARA O MEI (DASN MEI)

### `DCTFWEB` (2 ocorrências)
- Linha 74: DCTFWEB 13º SALÁRIO - RECIBO (DCTFWEB)
- Linha 76: DCTFWEB MENSAL - RECIBO (DCTFWEB)

### `IR` (5 ocorrências)
- Linha 78: Declaração IR (IR)
- Linha 79: Declaração IR (IR)
- Linha 80: Declaração IR (IR)
- Linha 81: Declaração IR (IR)
- Linha 82: Declaração IR (IR)

### `DSN` (2 ocorrências)
- Linha 83: DECLARAÇÃO IRPF (DSN)
- Linha 84: Declaração sociedade uni profissional (DSN)

### `INFORME` (2 ocorrências)
- Linha 139: Informe de rendimento (INFORME)
- Linha 140: INFORME DE RENDIMENTOS (INFORME)

### `LIV-ENTR` (2 ocorrências)
- Linha 149: LIVRO DE SAIDAS (LIV-ENTR)
- Linha 151: LIVRO ENTRADAS (LIV-ENTR)

### `SEFAZ` (2 ocorrências)
- Linha 159: PARCELAMENTO ICMS - COD 1298 (SEFAZ)
- Linha 160: PARCELAMENTO ICMS - COD 57 (SEFAZ)

### `ECD` (2 ocorrências)
- Linha 200: SPED ECD - Escrituração Contábil Digital (ECD)
- Linha 201: SPED ECD - ESCRITURAÇÃO CONTÁBIL DIGITAL (ECD)

**Registros SEM mininome:** 29 (aceitável — campo informativo opcional)

## 🟠 Linhas com avisos parciais (algumas células de entrega não foram interpretadas)

_Todas as 204×12=2448 células de entrega foram interpretadas com sucesso._ ✅

## 🔴 Falhas totais de parsing (linhas descartadas)

_Nenhuma._ ✅

## 📊 Estatísticas gerais

| Departamento | Qtd obrigações |
|---|---|
| Fiscal | 107 |
| Pessoal | 57 |
| IRPF - MEI - Pessoa Física | 16 |
| Contábil | 9 |
| Legalização | 7 |
| Declaração IR | 5 |
| Financeiro | 3 |

| Competência | Qtd |
|---|---|
| PREVIOUS_MONTH | 150 |
| CURRENT_MONTH | 26 |
| PREVIOUS_YEAR | 15 |
| CURRENT_YEAR | 5 |
| TWO_MONTHS_BEFORE | 5 |
| THREE_MONTHS_BEFORE | 2 |
| NEXT_MONTH | 1 |

- **Exigem Robô/Aurora:** 0
- **Passíveis de multa:** 7
- **Sábado é dia útil:** 2
- **Inativas:** 0

---

> ⏭️ **Próximo passo:** revise este relatório. Se estiver satisfeito, rode o script `import-obligations-confirm.ts` (que ainda será criado) para gravar em `Obligation`/`ObligationRule`. Nenhuma alteração foi feita no banco até agora.
