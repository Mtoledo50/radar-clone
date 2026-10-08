# ADR-124: Módulo de Usuários com RBAC Granular e Edição Dual

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

## 📋 Contexto

A gestão de usuários no sistema precisava evoluir além do CRUD básico. Os requisitos eram:

1. **Edição dual:** Separar dados de acesso (login, email, role) de dados de colaborador (departamento, cargo), pois um usuário pode ser também um funcionário do escritório.
2. **Permissões granulares:** Sistema de permissões baseado em constants, não hardcoded.
3. **Redefinição de senha administrativa:** Admin pode resetar senha de qualquer usuário, gerando senha temporária e forçando troca no próximo login.
4. **Serialização BigInt:** Permissões armazenadas como BigInt no Postgres causavam erro 500 no `JSON.stringify` do Express.

## 🎯 Decisão

1. **Criar DTOs específicos** para cada tipo de atualização:
   - `UpdateUserDetailsDto`: nome, email, role
   - `UpdateEmployeeDto`: departamento, cargo
   
2. **Implementar endpoints separados:**
   - `GET /users/:id/details` — dados completos (usuário + employee + permissions)
   - `PATCH /users/:id/details` — atualiza dados de acesso
   - `PATCH /users/:id/employee` — atualiza dados de colaborador
   - `POST /users/:id/reset-password` — gera senha temporária + força troca

3. **Criar `permissions.constants.ts`** com enum de permissões centralizado.

4. **Corrigir serialização BigInt** convertendo para String antes de retornar ao frontend.

##  Implementação

**Backend:** `backend/src/users/users.controller.ts` + `users.service.ts`

```typescript
// Controller
@Get(':id/details')
async getUserDetails(@Param('id') id: string) {
  return this.usersService.findUserWithDetails(id);
}

@Patch(':id/details')
async updateUserDetails(@Param('id') id: string, @Body() dto: UpdateUserDetailsDto) {
  return this.usersService.updateUserDetails(id, dto);
}

@Post(':id/reset-password')
async resetPassword(@Param('id') id: string) {
  return this.usersService.resetPassword(id);
}

// Service - correção BigInt
async findUserWithDetails(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return {
    ...user,
    permissions: user.permissions.toString() // ✅ BigInt → String
  };
}

Frontend: frontend/src/app/dashboard/admin/usuarios/page.tsx
// Modal dual: duas abas (Dados de Acesso + Dados de Colaborador)
<TabGroup>
  <Tab label="Acesso">
    <input value={user.email} onChange={...} />
    <select value={user.role}>...</select>
  </Tab>
  <Tab label="Colaborador">
    <input value={employee.department} />
    <input value={employee.position} />
  </Tab>
</TabGroup>

✅ Consequências
Positivas
✅ Separação clara de responsabilidades (acesso vs colaborador).
✅ Permissões centralizadas em constants, fácil manutenção.
✅ Reset de senha com fluxo seguro (senha temporária + força troca).
✅ Correção do bug BigInt que causava erro 500.
Negativas
⚠️ Dois endpoints para atualizar um usuário (pode ser confuso para devs novos).
⚠️ Senha temporária enviada por email (ainda não implementado — usa console.log por enquanto).
📚 Referências
Arquivos: backend/src/users/, frontend/src/app/dashboard/admin/usuarios/page.tsx
ADRs relacionadas: ADR-004 (Multi-tenant), ADR-030 (Human-in-the-Loop)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial