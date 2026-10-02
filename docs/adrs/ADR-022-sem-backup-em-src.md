ADR-022: Proibido Arquivos de Backup ou Debug dentro de src/

Data: 2026-09
Status: ✅ Aceita
Decisor: Marcos Toledo
Reversível: Não (regra de higiene de código)

📋 Contexto

Durante o desenvolvimento, é comum criar cópias de segurança de arquivos antes de grandes refatorações (ex: layout copy.tsx, service.old.ts) ou scripts de debug (ex: check-encoding.ts que importa módulos do backend no frontend).

Problema:

O compilador TypeScript (tsc) e o bundler do Next.js processam todos os arquivos .ts/.tsx dentro de src/, inclusive cópias e scripts de debug.
Isso causa:

Erros de build de produção (ex: layout copy.tsx quebrando o App Router).
Aumento desnecessário do bundle.
Importações circulares ou inválidas (ex: frontend importando @prisma/client).

🎯 Decisão

É estritamente proibido manter arquivos de backup, cópias (.copy, .old, .bak) ou scripts de debug dentro do diretório src/ (tanto no frontend/src quanto no backend/src).

Regras:

1 - Backup: Se precisar fazer backup de um arquivo, mova-o para uma pasta docs/archive/ ou scripts/debug/ fora do src/, ou use o controle de versão (Git) para reverter se necessário.
2 - Debug: Scripts de teste pontuais devem ser criados em uma pasta scripts/ na raiz do projeto, nunca dentro de src/.
3 - Git: Adicionar padrões como *.copy.tsx, *.old.ts ao .gitignore não é suficiente, pois o build local ainda falhará.

💡 Implementação

Estrutura Permitida

radar-clone/
├── frontend/
│   └── src/               # APENAS código de produção válido
├── backend/
│   └── src/               # APENAS código de produção válido
├── scripts/               # ✅ Scripts de debug, migração manual, testes pontuais
└── docs/
    └── archive/           # ✅ Snapshots de código antigo ou documentação obsoleta

Exemplo de Violação Corrigida (Sprint 31)

* Antes: frontend/src/app/layout copy.tsx (causava erro de rota duplicada no Next.js).
* Depois: Arquivo deletado. O histórico pode ser recuperado via git log se necessário.
* Antes: frontend/src/check-encoding.ts importando @prisma/client.
* Depois: Movido para scripts/check-encoding.ts e executado via npx tsx scripts/check-encoding.ts.

✅ Consequências

Positivas

✅ Builds de Produção Confiáveis: Zero surpresas com arquivos esquecidos sendo compilados.
✅ Código Limpo: O diretório src/ reflete exatamente o que está em produção.
✅ Performance: Bundler processa menos arquivos.

Negativas

❌ Disciplina: Exige que desenvolvedores usem o Git corretamente em vez de "salvar cópias" manualmente.

📚 Referências

.gitignore (padrões de exclusão)
Correções aplicadas na Sprint 31 (Docker/Blindagem de Ambiente).

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial após falha de build por "layout copy.tsx"