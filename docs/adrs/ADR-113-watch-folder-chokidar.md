
---

### 📂 `docs/adrs/ADR-113-watch-folder-chokidar.md`

```markdown
# ADR-113: Watch Folder via Chokidar (Monitoramento de Pasta Local)

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo de Envio com Tracking precisa detectar automaticamente quando um arquivo (DAS, DARF, NFS-e) é salvo em uma pasta local (`C:\Documentos\Enviar`) para processá-lo e enviá-lo por e-mail.

**Problema:**
- Upload manual via frontend é lento e propenso a erros
- Contador quer apenas salvar o arquivo na pasta e o sistema faz o resto

## 🎯 Decisão

Usar **`chokidar`** (biblioteca Node.js) para monitorar a pasta em tempo real:

1. **Detecção Automática:** Quando arquivo é criado/modificado, dispara processamento
2. **Debounce:** Aguarda 2 segundos sem alteração de tamanho (evita processar arquivo incompleto)
3. **Ignorar Temporários:** Ignora arquivos como `~$documento.xlsx`, `*.tmp`, `*.part`
4. **Anti-Duplicidade:** Hash do caminho + tamanho para evitar processar 2×

## 💡 Implementação

```typescript
// backend/src/comunicados/watch-folder/watch-folder.service.ts

import * as chokidar from 'chokidar';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class WatchFolderService implements OnModuleInit, OnModuleDestroy {
  private watcher: chokidar.FSWatcher;
  private readonly logger = new Logger(WatchFolderService.name);
  private processados = new Set<string>();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (this.configService.get('WATCH_FOLDER_ENABLED') !== 'true') {
      this.logger.log('Watch Folder desativado (WATCH_FOLDER_ENABLED != true)');
      return;
    }

    const pasta = this.configService.get('WATCH_FOLDER_PATH', 'C:\\Documentos\\Enviar');
    
    this.watcher = chokidar.watch(pasta, {
      ignoreInitial: true,
      depth: 0, // Apenas raiz (subpastas são de saída)
      ignored: [
        /(^|[\/\\])\../, // Ocultos
        /~\$.*$/, // Temporários Office
        /\.(tmp|part|crdownload|download)$/i, // Downloads incompletos
      ],
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Aguarda 2s sem alteração
        pollInterval: 200,
      },
    });

    this.watcher.on('add', (caminho) => this.aoDetectar(caminho));
    this.logger.log(`✅ Watch Folder ativo em: ${pasta}`);
  }

  onModuleDestroy() {
    this.watcher?.close();
  }

  private async aoDetectar(caminho: string) {
    const stat = fs.statSync(caminho);
    const chave = `${caminho}:${stat.size}`;

    if (this.processados.has(chave)) {
      this.logger.warn(`Arquivo já processado: ${caminho}`);
      return;
    }

    this.processados.add(chave);
    this.logger.log(`📄 Arquivo detectado: ${caminho}`);

    // Disparar processamento
    await this.processarArquivo(caminho);
  }

  private async processarArquivo(caminho: string) {
    // 1. Extrair CNPJ do nome do arquivo (ADR-118)
    const cnpj = this.extrairCnpj(caminho);
    if (!cnpj) {
      this.logger.error(`CNPJ não encontrado no nome: ${caminho}`);
      await this.moverParaPasta(caminho, 'erros');
      return;
    }

    // 2. Buscar cliente pelo CNPJ
    const cliente = await this.prisma.client.findFirst({
      where: { cnpj },
    });

    if (!cliente) {
      this.logger.error(`Cliente não encontrado para CNPJ: ${cnpj}`);
      await this.moverParaPasta(caminho, 'erros');
      return;
    }

    // 3. Criar registro na fila
    await this.prisma.arquivoFila.create({
      data: {
        companyId: cliente.companyId,
        nomeOriginal: path.basename(caminho),
        caminhoAbsoluto: caminho,
        cnpjDetectado: cnpj,
        clienteId: cliente.id,
        status: 'CLIENTE_IDENTIFICADO',
      },
    });

    this.logger.log(`✅ Arquivo vinculado ao cliente: ${cliente.name}`);
  }

  private async moverParaPasta(caminho: string, pasta: 'enviados' | 'erros' | 'rejeitados') {
    const destino = path.join(
      this.configService.get('WATCH_FOLDER_PATH'),
      pasta,
      path.basename(caminho)
    );
    
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.renameSync(caminho, destino);
  }
}

Variáveis de Ambiente

# backend/.env
WATCH_FOLDER_ENABLED=true
WATCH_FOLDER_PATH=C:\Documentos\Enviar

✅ Consequências
Positivas
✅ Automação Total: Contador só salva o arquivo na pasta
✅ Robusto: Debounce evita processar arquivo incompleto
✅ Organizado: Arquivos movidos para subpastas (enviados/erros/rejeitados)
Negativas
❌ Windows-Only: Caminho hardcoded (C:\Documentos\Enviar)
❌ Sem UI: Contador não vê status em tempo real (exige refresh)
📚 Referências
Arquivos que usam esta ADR:
backend/src/comunicados/watch-folder/watch-folder.service.ts
ADRs relacionadas:
ADR-114 (Tracking pixel + link proxy)
ADR-118 (Parser CNPJ no nome)
ADR-119 (Pasta enviados por competência)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial (Sprint F15)

