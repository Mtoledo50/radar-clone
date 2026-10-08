
---

## 📁 `docs/adrs/ADR-123-integracao-obrigacoes-watch-folder.md`

```markdown
# ADR-123: Integração Catálogo de Obrigações × Watch Folder

**Data:** 2026-10-09  
**Status:** 🚧 Proposta (campos criados, worker pendente)  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

## 📋 Contexto

A ADR-113 já implementava **Watch Folder via chokidar** para monitorar pastas e disparar envios quando novos arquivos apareciam. No entanto, essa implementação era **genérica**: monitorava uma única pasta configurada globalmente, sem vínculo com o catálogo de obrigações.

O problema: cada obrigação (ex: "DAS", "Pró-labore", "Alvará Sanitário") pode ter:
- **Pastas diferentes** (ex: `/servidor/das/`, `/servidor/prolabore/`)
- **Padrões de arquivo diferentes** (ex: `DAS_*.pdf` vs `PROLAB_*.xml`)
- **Ações pós-processamento diferentes** (manter vs mover vs deletar)

Sem essa configuração por obrigação, o watch folder não conseguia disparar o **primeiro gatilho** do fluxo de envio de forma inteligente.

## 🎯 Decisão

1. **Adicionar 3 campos** no model `ObligationSchedule`:
   - `folderPath` (string): caminho completo da pasta de monitoramento
   - `fileNamePattern` (string): padrão de nome com wildcards (`*`, `?`)
   - `postProcessAction` (enum): `manter` | `mover` | `deletar`

2. **Expor esses campos no modal de edição** de obrigações, em seção dedicada "📁 Localização de Arquivos (Watch Folder)".

3. **Implementar worker** (pendente) que:
   - Lê todas as obrigações ativas com `folderPath` configurado
   - Registra watchers dinâmicos via chokidar para cada pasta única
   - Ao detectar arquivo novo, filtra por `fileNamePattern`
   - Dispara o primeiro gatilho do fluxo de envio (cria `ObligationDelivery` com status `PENDENTE`)
   - Executa `postProcessAction` após sucesso

## 💡 Implementação

**Schema (pendente):** `backend/prisma/schema.prisma`

```prisma
model ObligationSchedule {
  // ... campos existentes ...
  
  // ✅ NOVOS CAMPOS: Watch Folder
  folderPath          String?
  fileNamePattern     String?
  postProcessAction   PostProcessAction @default(MANTER)
  
  deliveries ObligationDelivery[]
}

enum PostProcessAction {
  MANTER
  MOVER
  DELETAR
}

Frontend: frontend/src/app/dashboard/admin/obrigacoes/page.tsx

// Interface atualizada
interface ObligationSchedule {
  // ... campos existentes ...
  folderPath?: string;
  fileNamePattern?: string;
  postProcessAction?: 'manter' | 'mover' | 'deletar';
}

// Estado do modal com novos campos
const [formData, setFormData] = useState({
  // ... campos existentes ...
  folderPath: (schedule as any)?.folderPath || '',
  fileNamePattern: (schedule as any)?.fileNamePattern || '',
  postProcessAction: (schedule as any)?.postProcessAction || 'manter',
});

// Seção dedicada no modal
<section className="space-y-4">
  <h3>
    <FolderKanban size={16} /> Localização de Arquivos (Watch Folder)
  </h3>
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <input
      type="text"
      value={formData.folderPath}
      onChange={(e) => setFormData({ ...formData, folderPath: e.target.value })}
      placeholder="Ex: /servidor/obrigacoes/fiscal/das"
    />
    <input
      type="text"
      value={formData.fileNamePattern}
      placeholder="Ex: DAS_*.pdf"
    />
    <select value={formData.postProcessAction}>
      <option value="manter">Manter na pasta</option>
      <option value="mover">Mover para processados</option>
      <option value="deletar">Excluir após processamento</option>
    </select>
  </div>
</section>

Worker (pendente): backend/src/obligations/obligation-watch.worker.ts

// Pseudocódigo do worker
import { watch } from 'chokidar';

async function startWatchers() {
  const obligations = await prisma.obligationSchedule.findMany({
    where: { isActive: true, folderPath: { not: null } }
  });
  
  const uniqueFolders = [...new Set(obligations.map(o => o.folderPath))];
  
  uniqueFolders.forEach(folder => {
    const watcher = watch(folder, { ignoreInitial: true });
    
    watcher.on('add', async (filePath) => {
      const fileName = path.basename(filePath);
      
      // Filtra obrigações desta pasta
      const matchingObligations = obligations.filter(o => {
        if (o.folderPath !== folder) return false;
        return matchPattern(fileName, o.fileNamePattern);
      });
      
      for (const ob of matchingObligations) {
        // Cria delivery pendente
        await prisma.obligationDelivery.create({
          data: {
            scheduleId: ob.id,
            status: 'PENDENTE',
            obs: `Arquivo detectado: ${fileName}`
          }
        });
        
        // Executa ação pós-processamento
        if (ob.postProcessAction === 'DELETAR') {
          fs.unlinkSync(filePath);
        } else if (ob.postProcessAction === 'MOVER') {
          fs.moveSync(filePath, `${folder}/processados/${fileName}`);
        }
      }
    });
  });
}

✅ Consequências
Positivas
✅ Configuração granular: cada obrigação tem sua própria pasta e padrão.
✅ Primeiro gatilho automático: arquivo na pasta → delivery criado sem intervenção manual.
✅ Flexibilidade: usuário define ação pós-processamento conforme necessidade.
✅ Integração natural: campos expostos no modal existente, zero fricção de UX.
Negativas
⚠️ Worker ainda não implementado: campos existem no frontend mas não têm efeito prático até o worker ser criado.
⚠️ Performance: múltiplos watchers em pastas diferentes podem consumir memória (mitigável com debounce).
⚠️ Segurança: caminhos de pasta devem ser validados para evitar path traversal.
⚠️ Conflito de padrões: se duas obrigações monitoram a mesma pasta com padrões sobrepostos, o mesmo arquivo pode gerar múltiplos deliveries.
📚 Referências
Arquivos: frontend/src/app/dashboard/admin/obrigacoes/page.tsx
ADRs relacionadas: ADR-113 (Watch Folder via chokidar), ADR-118 (CNPJ no nome do arquivo), ADR-119 (Pasta enviados/competência)
Sprint: Integração Watch Folder (Sprint OB-3 — pendente)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial (status: proposta)

