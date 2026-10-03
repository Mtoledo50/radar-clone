
---

### 📂 `docs/adrs/ADR-106-proxy-nestjs-python.md`

```markdown
# ADR-106: Proxy NestJS → Python com Fallback Gracioso

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O Radar Frontend (Next.js) precisa acessar o Extrator Backend (Python) para processar PDFs de extratos bancários. Expor o Extrator diretamente ao frontend cria:
- Problemas de CORS
- Exposição de API interna
- Dificuldade de autenticação

## 🎯 Decisão

Criar um **endpoint proxy** no Radar Backend (NestJS) que:
1. Recebe requisição do frontend
2. Encaminha para o Extrator Backend (Python)
3. Retorna resposta ao frontend

### Regras:
1. **Fallback Gracioso:** Se Extrator estiver offline, retorna erro 503 com mensagem clara
2. **Timeout:** 60 segundos (PDFs grandes podem demorar)
3. **Autenticação:** Proxy exige JWT válido (mesma auth do Radar)
4. **Sem Cache:** PDFs são processados sob demanda

## 💡 Implementação

### Backend NestJS

```typescript
// backend/src/accounting/accounting.controller.ts

@Controller('accounting')
export class AccountingController {
  @Post('extract-pdf-unified')
  @UseGuards(JwtAuthGuard)
  async extractPdfUnified(
    @UploadedFile() file: Express.Multer.File,
    @Query('bank') bank: string = 'auto'
  ) {
    try {
      // Encaminhar para Extrator Python
      const formData = new FormData();
      formData.append('file', new Blob([file.buffer]), file.originalname);
      formData.append('bank', bank);

      const response = await fetch('http://localhost:8000/api/parse-extrato', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000), // 60s timeout
      });

      if (!response.ok) {
        throw new Error(`Extrator retornou ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException(
          'Extrator Bancário está offline. Verifique se o serviço Python está rodando na porta 8000.'
        );
      }
      throw error;
    }
  }
}

Frontend

// frontend/src/lib/api.ts

// Frontend chama o proxy do Radar Backend, não o Extrator diretamente
export async function extractPdf(file: File, bank: string = 'auto') {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/accounting/extract-pdf-unified?bank=${bank}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return response.data;
}

✅ Consequências
Positivas
✅ Segurança: Extrator não é exposto ao frontend
✅ Simplicidade: Frontend chama apenas um endpoint (Radar Backend)
✅ Fallback: Mensagem clara se Extrator estiver offline
Negativas
❌ Latência: Requisição passa por 2 hops (frontend → NestJS → Python)
❌ Dependência: Se NestJS cair, Extrator também fica inacessível
📚 Referências
Arquivos que usam esta ADR:
backend/src/accounting/accounting.controller.ts
frontend/src/lib/api.ts
ADRs relacionadas:
ADR-105 (CORS multi-origem)
ADR-107 (Mistral OCR)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial
