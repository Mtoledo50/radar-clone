
---

### 📂 `docs/adrs/ADR-119-pasta-enviados-competencia.md`

```markdown
# ADR-119: Pasta de Enviados com Subpastas por Competência

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

Após enviar um e-mail com anexo, o arquivo original precisa ser movido para uma pasta de histórico (auditoria).

**Problema:**
- Onde armazenar arquivos enviados?
- Como organizar por cliente e competência?

## 🎯 Decisão

Estrutura de pastas organizada por competência (mês/ano):


C:\Documentos\Enviar
├── (raiz) → arquivos aguardando processamento
├── enviados/
│ ├── 2026-08/
│ │ ├── DAS_12345678000195_082026.pdf
│ │ └── DARF_98765432000112_082026.pdf
│ ├── 2026-09/
│ │ └── ...
├── erros/
│ └── (arquivos com CNPJ inválido ou cliente não encontrado)
└── rejeitados/
└── (arquivos cancelados pelo contador)


### Regras:
1. **Subpasta por Competência:** `enviados/YYYY-MM/`
2. **Nome Original Preservado:** Não renomear arquivo
3. **Anti-Duplicidade:** Se arquivo já existe na pasta de destino, adicionar timestamp

## 💡 Implementação

```typescript
// backend/src/comunicados/file-mover/file-mover.service.ts

@Injectable()
export class FileMoverService {
  constructor(private configService: ConfigService) {}

  async moverParaEnviados(caminhoOriginal: string, competencia: string) {
    const pastaBase = this.configService.get('WATCH_FOLDER_PATH');
    const destino = path.join(pastaBase, 'enviados', competencia, path.basename(caminhoOriginal));

    // Criar pasta se não existir
    fs.mkdirSync(path.dirname(destino), { recursive: true });

    // Anti-duplicidade
    if (fs.existsSync(destino)) {
      const ext = path.extname(destino);
      const nome = path.basename(destino, ext);
      const timestamp = Date.now();
      const novoDestino = path.join(path.dirname(destino), `${nome}_${timestamp}${ext}`);
      fs.renameSync(caminhoOriginal, novoDestino);
    } else {
      fs.renameSync(caminhoOriginal, destino);
    }
  }

  async moverParaErros(caminhoOriginal: string, motivo: string) {
    const pastaBase = this.configService.get('WATCH_FOLDER_PATH');
    const destino = path.join(pastaBase, 'erros', path.basename(caminhoOriginal));

    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.renameSync(caminhoOriginal, destino);

    // Registrar motivo em arquivo de log
    const logFile = path.join(path.dirname(destino), 'erros.log');
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${path.basename(caminhoOriginal)} - ${motivo}\n`);
  }
}

✅ Consequências

Positivas

✅ Organizado: Arquivos separados por competência
✅ Auditoria: Histórico completo de envios
✅ Anti-Duplicidade: Timestamp evita sobrescrever

Negativas

❌ Espaço em Disco: Arquivos não são deletados (acumulam)
❌ Limpeza Manual: Exige script periódico para remover antigos

📚 Referências

Arquivos que usam esta ADR:

backend/src/comunicados/file-mover/file-mover.service.ts

ADRs relacionadas:

ADR-113 (Watch Folder)
ADR-117 (Human-in-the-Loop no envio)

🔄 Histórico de Revisões

Data            Autor               Mudança
2026-09         Marcos Toledo       Criação inicial (Sprint F15)

