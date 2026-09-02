# 🛠️ Padrão de Desenvolvimento

## Regras inegociáveis
1. **Nunca commitar sem gate:** `npx tsc --noEmit` (backend) passando. Frontend sem erro de build.
2. **Commit atômico por funcionalidade** + **tag de checkpoint** a cada bloco estável:
   `git tag stable-AAAA-MM-DD` → rollback vira 1 comando.
3. **Arquivo inteiro, nunca fragmento:** quando receber código de IA/par, substitua o
   arquivo COMPLETO. Colar trechos no meio foi a causa #1 de imports quebrados.
4. **Todo controller tem service; todo service está no `providers` do módulo.**
   (Checklist anti-TS2307/TS2305 — ver 04-MAPA-MODULOS.md)
5. **Segredos só em `.env`** (local). `.env.example` é o modelo commitado.
6. **Nunca commitar binários** (zip, dump, pdf de teste) — ver `.gitignore`.
7. **Ordem de boot:** Postgres → backend (`/health` 200) → frontend. Usar `scripts/start-dev.ps1`.

## Definition of Done (por feature)
- [ ] Compila sem erro (`tsc --noEmit`)
- [ ] Funciona no fluxo real (teste manual no navegador)
- [ ] Multi-tenant: toda query filtra `companyId`
- [ ] DTO validado com class-validator
- [ ] Toast/feedback de UX em todas as ações
- [ ] Commit + tag se for checkpoint estável

## Protocolo de trabalho com IA
- Pedir **arquivo completo** quando a alteração tocar >1 método.
- Ao aplicar, **substituir o arquivo inteiro** e rodar o gate antes do commit.
- Se aparecer erro de módulo não encontrado: conferir (a) arquivo existe,
  (b) nome da classe = nome do arquivo, (c) registrado no módulo.