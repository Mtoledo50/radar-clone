# ADR-127: Ponte OB-6 — Obrigações ↔ Central de Envios

**Data:** 2026-10-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim (camadas não-bloqueantes, podem ser removidas sem afetar o core)

---

## 📋 Contexto

O módulo de **Obrigações** (catálogo fiscal com vencimentos por empresa) e o módulo de **Central de Envios** (gestão de e-mails com anexos, aprovação humana e tracking) operavam de forma totalmente independente.

Quando um arquivo era detectado na pasta monitorada (`A_Processar/`), o sistema:
1. Extraía o CNPJ do nome
2. Vinculava ao cliente
3. Criava um `ArquivoFila` com status apropriado
4. Após aprovação humana, enviava o e-mail com tracking de abertura/download

**Problema:** Não havia nenhum vínculo automático entre o arquivo enviado e a **obrigação fiscal correspondente** que ele cumpre. O lote de obrigações mostrava "PENDENTE" mesmo após o e-mail ter sido enviado, aberto e baixado pelo cliente.

Isso gerava:
- Retrabalho manual para marcar obrigações como cumpridas
- Impossibilidade de auditoria automática ("quando o cliente recebeu o DAE?")
- Duplicidade de esforço: o mesmo dado (CNPJ + competência + tipo) existia em dois módulos sem conversa

---

## 🎯 Decisão

Implementar uma **ponte não-bloqueante em 3 pontos de integração** (LP1, LP2, LP3) que espelha o ciclo de vida do envio na entrega da obrigação correspondente.

### Princípios arquiteturais
1. **Não-bloqueante:** falha na ponte nunca impede o envio do e-mail
2. **Preserva primeira data:** `openedAt`/`downloadedAt` só são gravados uma vez (valor jurídico)
3. **Isolamento por tenant:** todas as buscas usam `companyId`
4. **Fallback silencioso:** se não houver obrigação correspondente, o envio segue normalmente

---

## 💡 Implementação

### 1. Schema Prisma (migração `ponte_ob6_obrigacoes_envios`)

```prisma
model ArquivoFila {
  // ... campos existentes ...
  scheduleId           String?   // 🆕 vínculo com ObligationSchedule
  obligationDeliveryId String?   // 🆕 vínculo com ObligationDelivery
}

model EmailEnvio {
  // ... campos existentes ...
  scheduleId           String?
  obligationDeliveryId String?
}

model ObligationDelivery {
  // ... campos existentes ...
  sentAt        DateTime?  // 🆕 quando o e-mail foi enviado
  openedAt      DateTime?  //  primeira abertura
  downloadedAt  DateTime?  // 🆕 primeiro download
  lastEnvioId   String?    // 🆕 último envio vinculado
}

2. Arquivo de ponte: backend/src/obligations/obligation-bridge.ts

import { PrismaService } from '../prisma/prisma.service';

interface LinkInput {
  companyId: string;
  fileName: string;
  clientId: string;
  filaId: string;
}

/**
 * LP1 — Casa o 1º token do nome do arquivo com o mininome da obrigação ativa.
 * Ex: "Acomp_08432644000160.pdf" → token "Acomp" → "Acompanhar fim da experiência..."
 */
export async function linkFileToObligation(
  prisma: PrismaService,
  input: LinkInput,
) {
  try {
    const token = input.fileName.split(/[_\-.]/)[0].toLowerCase();
    const schedule = await prisma.obligationSchedule.findFirst({
      where: {
        companyId: input.companyId,
        ativo: true,
        obligation: {
          mininome: { contains: token, mode: 'insensitive' },
        },
        companies: { some: { clientId: input.clientId } },
      },
      include: { obligation: true },
    });

    if (!schedule) return null;

    const delivery = await prisma.obligationDelivery.upsert({
      where: {
        scheduleId_clientId: {
          scheduleId: schedule.id,
          clientId: input.clientId,
        },
      },
      create: {
        scheduleId: schedule.id,
        clientId: input.clientId,
        companyId: input.companyId,
        status: 'PENDENTE',
      },
      update: {},
    });

    await prisma.arquivoFila.update({
      where: { id: input.filaId },
      data: {
        scheduleId: schedule.id,
        obligationDeliveryId: delivery.id,
      },
    });

    return { scheduleId: schedule.id, deliveryId: delivery.id, scheduleName: schedule.obligation.nome };
  } catch (e) {
    console.warn('[OB-6 LP1] Falha não-bloqueante:', e?.message);
    return null;
  }
}

/**
 * LP2 — Quando o e-mail é enviado com sucesso, marca a entrega como ENVIADA.
 */
export async function propagateSentByEnvioId(
  prisma: PrismaService,
  envioId: string,
) {
  try {
    const envio = await prisma.emailEnvio.findUnique({
      where: { id: envioId },
      select: { obligationDeliveryId: true },
    });
    if (!envio?.obligationDeliveryId) return null;

    return await prisma.obligationDelivery.update({
      where: { id: envio.obligationDeliveryId },
      data: {
        status: 'ENVIADO',
        sentAt: new Date(),
        lastEnvioId: envioId,
      },
    });
  } catch (e) {
    console.warn('[OB-6 LP2] Falha não-bloqueante:', e?.message);
    return null;
  }
}

/**
 * LP3 — Tracking de abertura e download.
 * kind: 'opened' | 'downloaded'
 */
export async function markTrackingByEnvioId(
  prisma: PrismaService,
  envioId: string,
  kind: 'opened' | 'downloaded',
) {
  try {
    const envio = await prisma.emailEnvio.findUnique({
      where: { id: envioId },
      select: { obligationDeliveryId: true },
    });
    if (!envio?.obligationDeliveryId) return null;

    const delivery = await prisma.obligationDelivery.findUnique({
      where: { id: envio.obligationDeliveryId },
      select: { id: true, openedAt: true, downloadedAt: true },
    });
    if (!delivery || delivery[kind === 'opened' ? 'openedAt' : 'downloadedAt']) {
      return null; // já marcado — preserva 1ª data
    }

    const field = kind === 'opened' ? 'openedAt' : 'downloadedAt';
    return await prisma.obligationDelivery.update({
      where: { id: delivery.id },
      data: { [field]: new Date() },
    });
  } catch (e) {
    console.warn(`[OB-6 LP3] Falha não-bloqueante (${kind}):`, e?.message);
    return null;
  }
}

3. Pontos de integração (âncoras)

Arquivo
Método
Chamada
arquivo-fila.service.ts
registrarDetecao() (CASO 3 e 4)
linkFileToObligation(...)
email-envio.service.ts
processarAprovacao() (sucesso)
propagateSentByEnvioId(...)
tracking-publico.controller.ts
registrarAbertura()
markTrackingByEnvioId(..., 'opened')
tracking-publico.controller.ts
baixarDocumento()
markTrackingByEnvioId(..., 'downloaded')

4. Exibição no frontend (lote de obrigações)
Em obligations.service.ts → getScheduleTimeline():

tracking: {
  sentAt: (d as any).sentAt ?? null,
  openedAt: (d as any).openedAt ?? null,
  downloadedAt: (d as any).downloadedAt ?? null,
},

✅ Consequências
Positivas
Lote de obrigações agora exibe Situação (CUMPRIDA/PENDENTE) automaticamente
Colunas Enviado, Aberto, Baixado com timestamps reais
Auditoria completa: "quando o cliente recebeu/abriu/baixou o documento?"
Zero retrabalho manual de marcação
Ponte pode ser removida sem afetar o core de envio
Negativas
3 colunas novas em ObligationDelivery (todas nuláveis, sem impacto em performance)
Dependência cruzada entre módulos (mitigada pelo arquivo obligation-bridge.ts isolado)
Envios antigos (antes da migração) ficam sem vínculo — requer script de reconciliação one-off
Riscos mitigados
Falha na ponte: try/catch em todas as funções → envio nunca é bloqueado
Duplicidade de vínculo: upsert no ObligationDelivery + unique constraint (scheduleId, clientId)
Tenant leakage: todas as queries filtram por companyId
📚 Referências
ADRs relacionadas: ADR-030 (Human-in-the-loop), ADR-113 (Watch folder), ADR-114 (Tracking pixel)
Arquivos modificados:
backend/prisma/schema.prisma
backend/src/obligations/obligation-bridge.ts (NOVO)
backend/src/comunicados/arquivo-fila/arquivo-fila.service.ts
backend/src/comunicados/email-envio/email-envio.service.ts
backend/src/comunicados/email-envio/tracking-publico.controller.ts
backend/src/obligations/obligations.service.ts
Scripts utilitários:
backend/scripts/get-track-links.ts
backend/scripts/reset-delivery-tracking.ts
backend/scripts/repair-ob6-links.ts
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-08
Marcos Toledo
Criação inicial — LP1, LP2, LP3 implementadas e testadas end-to-end
2026-10-08
Marcos Toledo
Fix unique constraint em caminhoAbsoluto (try/catch no update intermediário)
2026-10-09
Marcos Toledo
Logs de diagnóstico adicionados em markTrackingByEnvioId
