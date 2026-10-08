
---

### 📂 `docs/adrs/ADR-117-human-in-the-loop-envio.md`

```markdown
# ADR-117: Human-in-the-Loop Obrigatório no Envio de E-mails

**Data:** 2026-09  
**Status:** ✅ Aceita (Regra Crítica)  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O módulo de Envio automatiza o disparo de e-mails com documentos fiscais. Envio errado pode gerar:
- Exposição de dados sensíveis ao cliente errado
- Multas por LGPD
- Perda de confiança do cliente

## 🎯 Decisão

**Todo envio de e-mail exige aprovação humana explícita**, mesmo que o arquivo tenha sido detectado automaticamente pelo Watch Folder.

### Fluxo:
1. Watch Folder detecta arquivo → cria registro `PENDENTE_APROVACAO`
2. Contador vê preview do e-mail (assunto, corpo, destinatário, anexos)
3. Contador clica em "Aprovar e Enviar"
4. Sistema envia e muda status para `ENVIADO`

### Regras:
1. **Preview Obrigatório:** Contador vê exatamente o que será enviado
2. **Confirmação Explícita:** Botão "Aprovar" (não é automático)
3. **Auditoria:** Registro de quem aprovou e quando (`aprovadoPor`, `aprovadoEm`)
4. **Edição Permitida:** Contador pode editar assunto/corpo antes de aprovar

## 💡 Implementação

### Schema Prisma

```prisma
model EmailEnvio {
  id              String   @id @default(uuid())
  companyId       String
  
  // Dados do e-mail
  clienteId       String
  emailDestinatario String
  assunto         String
  corpoHtml       String   @db.Text
  anexos          Json     // [{nomeOriginal, caminhoRelativo, tamanhoBytes}]
  
  // Status e aprovação
  status          StatusEnvio @default(PENDENTE_APROVACAO)
  aprovadoPor     String?  // userId
  aprovadoEm      DateTime?
  
  enviadoPor      String?
  enviadoEm       DateTime?
  
  // Tracking
  tokenDownload   String   @unique
  linkExpiraEm    DateTime?
  
  @@map("email_envios")
}

enum StatusEnvio {
  PENDENTE_APROVACAO
  ENVIANDO
  ENVIADO
  FALHOU
  CANCELADO
}

Frontend: Preview e Aprovação

// frontend/src/app/dashboard/comunicados/fila/page.tsx

export default function FilaAprovacaoPage() {
  const [envios, setEnvios] = useState<EmailEnvio[]>([]);

  const aprovar = async (envioId: string) => {
    await api.post(`/email-envios/${envioId}/aprovar`);
    toast.success('E-mail aprovado e enviado');
    fetchEnvios();
  };

  return (
    <div>
      {envios.map(envio => (
        <div key={envio.id} className="bg-white p-4 rounded shadow mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{envio.assunto}</h3>
              <p className="text-sm text-gray-600">Para: {envio.emailDestinatario}</p>
              <div className="mt-2 text-sm">
                <strong>Anexos:</strong>
                <ul className="list-disc list-inside">
                  {envio.anexos.map((anexo, i) => (
                    <li key={i}>{anexo.nomeOriginal}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => aprovar(envio.id)}
                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
              >
                ✅ Aprovar e Enviar
              </button>
              <button
                onClick={() => cancelar(envio.id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

Backend: Endpoint de Aprovação
// backend/src/comunicados/email-envio/email-envio.controller.ts

@Post(':id/aprovar')
@UseGuards(JwtAuthGuard)
async aprovar(@Param('id') id: string, @CurrentUser() user: any) {
  const envio = await this.prisma.emailEnvio.update({
    where: { id, companyId: user.companyId },
    data: {
      status: 'ENVIANDO',
      aprovadoPor: user.id,
      aprovadoEm: new Date(),
    },
  });

  // Disparar envio assíncrono
  await this.emailEnvioService.enviar(envio.id);

  return { success: true };
}

✅ Consequências

Positivas

✅ Segurança: Contador revisa antes de enviar
✅ Auditoria: Registro de quem aprovou
✅ Flexibilidade: Pode editar antes de aprovar

Negativas

❌ Friction: Exige intervenção manual (mas é necessária)

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/email-envio/email-envio.controller.ts
frontend/src/app/dashboard/comunicados/fila/page.tsx

ADRs relacionadas:

ADR-030 (Human-in-the-Loop obrigatório)
ADR-113 (Watch Folder)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial (Sprint F15)

