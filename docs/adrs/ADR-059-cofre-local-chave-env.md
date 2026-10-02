# ADR-059: Cofre Local com Chave em Variável de Ambiente (Reveal Auditável)

**Data:** 2026-08  
**Status:** ✅ Aceita (Regra Crítica de Segurança)  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência LGPD e compliance contábil)

---

## 📋 Contexto

O módulo de Legalização (Sprint FD-8 da Aurora) precisa armazenar credenciais sensíveis para automação de portais governamentais e ERPs contábeis:
- Senhas do e-CAC (Receita Federal)
- Senhas do PGDAS-D (Simples Nacional)
- Senhas de portais de prefeituras (NFS-e, ISS)
- Procurações eletrônicas
- Certificados digitais A1 (.pfx com senha)
- Tokens de API de sistemas contábeis (Domínio, Questor, Sage)

**Problema:**
- Armazenar senhas em texto puro no banco é uma violação grave da LGPD (art. 46)
- Se o banco for comprometido (SQL injection, backup vazado), todas as credenciais vazam
- Contadores precisam acessar essas credenciais para operar portais manualmente quando necessário
- Não há sistema de auditoria de quem acessou qual credencial e quando

**Dilema:**
Como armazenar credenciais de forma segura, mas ainda acessível para automação e operação manual, com rastreabilidade completa?

---

## 🎯 Decisão

Implementar um **cofre local criptografado** usando **AES-256-GCM**, com a chave mestra armazenada em variável de ambiente (nunca no código ou no banco), e **toda leitura de credencial auditada** em tabela separada.

### Regras Inegociáveis:

1. **Criptografia Simétrica Forte:**
   - Algoritmo: AES-256-GCM (recomendado pelo NIST e LGPD)
   - Chave mestra: 32 bytes (256 bits) em variável de ambiente `VAULT_MASTER_KEY`
   - IV (Initialization Vector): 12 bytes aleatórios por criptografia
   - Tag de autenticação: 16 bytes (garante integridade + autenticidade)

2. **Nunca Armazenar em Texto Puro:**
   - Senhas, tokens e certificados **SEMPRE** criptografados no banco (campo `secretEnc`)
   - Logs e erros **NUNCA** devem imprimir credenciais (mesmo parcial)
   - Frontend **NUNCA** recebe a credencial descriptografada sem ação explícita do usuário (botão "Revelar")

3. **Reveal Auditável:**
   - Toda leitura de credencial gera registro em `CredentialAccessAudit`
   - Registro inclui: `accessedBy` (userId), `action` (READ/UPDATE/DELETE), `ipAddress`, `userAgent`, `accessedAt`
   - Auditoria é imutável (não há UPDATE/DELETE em `CredentialAccessAudit`)

4. **Rotação de Chave:**
   - Chave mestra pode ser rotacionada (ex: anualmente ou em caso de suspeita de vazamento)
   - Credenciais antigas são re-criptografadas com nova chave em background (job assíncrono)
   - Durante rotação, ambas as chaves (antiga e nova) ficam disponíveis temporariamente

5. **Acesso Restrito por Perfil:**
   - Apenas usuários com perfil `CONTADOR` ou `SUPERVISOR` (ADR-033) podem revelar credenciais
   - AUXILIAR e ANALISTA podem criar/atualizar, mas não revelar (apenas usar via automação)

---

## 💡 Implementação

### Backend: Serviço de Cofre (VaultService)

```typescript
// backend/src/common/crypto/vault.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Chave mestra em variável de ambiente (32 bytes = 256 bits = 64 caracteres hex)
    const keyHex = process.env.VAULT_MASTER_KEY;
    
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        'VAULT_MASTER_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes). ' +
        'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    
    this.key = Buffer.from(keyHex, 'hex');
    this.logger.log('Cofre criptográfico inicializado com sucesso');
  }

  /**
   * Criptografa um valor sensível
   * 
   * @param plaintext - Texto puro (ex: senha do e-CAC)
   * @returns String no formato "iv:authTag:ciphertext" (base64)
   * 
   * Exemplo de saída:
   * "dGVzdGl2ZTEyMw==:YXV0aHRhZzEyMw==:Y3J5cHRvZ3JhcGhlZHRleHQ="
   */
  encrypt(plaintext: string): string {
    if (!plaintext || plaintext.trim() === '') {
      throw new Error('Não é possível criptografar string vazia');
    }

    // IV aleatório de 12 bytes (recomendação NIST para GCM)
    const iv = crypto.randomBytes(12);
    
    // Criptografar com AES-256-GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Tag de autenticação (16 bytes) - garante integridade
    const authTag = cipher.getAuthTag();
    
    // Retornar no formato "iv:authTag:ciphertext" (base64)
    // Separador ":" foi escolhido por não aparecer em base64
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Descriptografa um valor
   * 
   * @param encrypted - String no formato "iv:authTag:ciphertext"
   * @returns Texto puro
   * @throws Error se a chave estiver errada ou os dados foram adulterados
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de credencial criptografada inválido (esperado iv:authTag:ciphertext)');
    }

    const [ivBase64, authTagBase64, ciphertextBase64] = parts;
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    
    // Validar tamanhos (defesa em profundidade)
    if (iv.length !== 12) {
      throw new Error(`IV inválido: esperado 12 bytes, recebido ${iv.length}`);
    }
    if (authTag.length !== 16) {
      throw new Error(`AuthTag inválido: esperado 16 bytes, recebido ${authTag.length}`);
    }
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Gera uma nova chave mestra (para rotação ou setup inicial)
   * 
   * @returns String hex de 64 caracteres (32 bytes)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

Backend: Modelo de Dados (Prisma

// backend/prisma/schema.prisma

// ═══════════════════════════════════════════════════════════════════
// COFRE DE CREDENCIAIS (ADR-059)
// ═══════════════════════════════════════════════════════════════════

model CredentialVault {
  id          String   @id @default(uuid())
  companyId   String
  
  // Vínculo opcional com cliente (NULL = credencial do escritório)
  clientId    String?
  
  // Identificação do serviço
  service     String   // ECAC | PGDAS | PREFEITURA_SP | DOMINIO | QUESTOR | CERTIFICATE_A1
  login       String   // Usuário, CNPJ ou identificador do serviço
  
  // 🔒 CRIPTOGRAFADO (AES-256-GCM)
  // Formato: "iv:authTag:ciphertext" (base64)
  secretEnc   String   @db.Text
  
  // Metadados (não sensíveis)
  metadata    Json?    // {expiresAt: "2027-12-31", owner: "João Silva", notes: "Certificado A1"}
  
  // Auditoria básica
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  // userId que criou
  
  // Relacionamentos
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  accessLogs  CredentialAccessAudit[]
  
  // Índices e constraints
  @@unique([companyId, clientId, service, login]) // Uma credencial por (tenant, cliente, serviço, login)
  @@index([companyId, service]) // Busca rápida por serviço
  @@map("credential_vault")
}

// ═══════════════════════════════════════════════════════════════════
// AUDITORIA DE ACESSO AO COFRE (ADR-059)
// ═══════════════════════════════════════════════════════════════════

model CredentialAccessAudit {
  id              String   @id @default(uuid())
  companyId       String
  
  // Qual credencial foi acessada
  credentialId    String
  
  // Quem acessou
  accessedBy      String   // userId
  
  // O que fez
  action          String   // READ | UPDATE | DELETE | REVEAL
  
  // Contexto do acesso
  ipAddress       String?  @db.VarChar(45) // IPv4 ou IPv6
  userAgent       String?  @db.Text
  endpoint        String?  // ex: "GET /legal/credentials/:id/reveal"
  
  // Quando
  accessedAt      DateTime @default(now())
  
  // Relacionamentos
  credential      CredentialVault @relation(fields: [credentialId], references: [id], onDelete: Cascade)
  
  // Índices
  @@index([companyId, accessedAt]) // Auditoria por tenant e data
  @@index([credentialId, accessedAt]) // Histórico de uma credencial específica
  @@map("credential_access_audits")
}

Backend: Serviço de Acesso Auditável
// backend/src/legal/services/credential.service.ts

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VaultService } from '../../common/crypto/vault.service';
import { Request } from 'express';

@Injectable()
export class CredentialService {
  private readonly logger = new Logger(CredentialService.name);

  constructor(
    private prisma: PrismaService,
    private vault: VaultService,
  ) {}

  /**
   * Revela uma credencial (descriptografa e retorna o texto puro)
   * 
   * ⚠️ OPERAÇÃO SENSÍVEL: Gera auditoria obrigatória
   * 
   * @param credentialId - ID da credencial
   * @param userId - ID do usuário que está acessando
   * @param req - Request HTTP (para capturar IP e User-Agent)
   * @returns Texto puro da credencial (senha, token, etc.)
   */
  async revealSecret(
    credentialId: string,
    userId: string,
    req: Request
  ): Promise<string> {
    // 1. Buscar credencial
    const credential = await this.prisma.credentialVault.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException(`Credencial ${credentialId} não encontrada`);
    }

    // 2. Auditoria de acesso (OBRIGATÓRIA antes de descriptografar)
    await this.prisma.credentialAccessAudit.create({
      data: {
        companyId: credential.companyId,
        credentialId: credential.id,
        accessedBy: userId,
        action: 'REVEAL',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
        endpoint: `${req.method} ${req.originalUrl}`,
      },
    });

    this.logger.warn(
      `Credencial revelada: ${credential.service}/${credential.login} ` +
      `por usuário ${userId} em ${new Date().toISOString()}`
    );

    // 3. Descriptografar e retornar
    try {
      return this.vault.decrypt(credential.secretEnc);
    } catch (error) {
      this.logger.error(`Falha ao descriptografar credencial ${credentialId}: ${error.message}`);
      throw new Error('Falha ao descriptografar credencial. Chave mestra pode estar incorreta.');
    }
  }

  /**
   * Cria ou atualiza uma credencial (criptografa automaticamente)
   */
  async upsertCredential(
    companyId: string,
    clientId: string | null,
    service: string,
    login: string,
    secret: string,
    metadata: any,
    userId: string
  ) {
    // Criptografar o segredo
    const secretEnc = this.vault.encrypt(secret);

    // Upsert (criar ou atualizar)
    const credential = await this.prisma.credentialVault.upsert({
      where: {
        companyId_clientId_service_login: {
          companyId,
          clientId: clientId || '',
          service,
          login,
        },
      },
      update: {
        secretEnc,
        metadata,
        updatedAt: new Date(),
      },
      create: {
        companyId,
        clientId,
        service,
        login,
        secretEnc,
        metadata,
        createdBy: userId,
      },
    });

    // Auditoria de criação/atualização
    await this.prisma.credentialAccessAudit.create({
      data: {
        companyId,
        credentialId: credential.id,
        accessedBy: userId,
        action: 'UPDATE',
        endpoint: 'POST /legal/credentials',
      },
    });

    return credential;
  }

  /**
   * Lista credenciais do tenant (SEM revelar os segredos)
   * Retorna apenas metadados e flag `hasSecret: true`
   */
  async listCredentials(companyId: string) {
    const credentials = await this.prisma.credentialVault.findMany({
      where: { companyId },
      select: {
        id: true,
        service: true,
        login: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        // ⚠️ NUNCA selecionar secretEnc aqui
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Adicionar flag hasSecret (sempre true, mas explícito para o frontend)
    return credentials.map(c => ({
      ...c,
      hasSecret: true,
    }));
  }

  /**
   * Deleta uma credencial (soft delete ou hard delete?)
   * 
   * ⚠️ HARD DELETE: Credenciais são sensíveis, não faz sentido manter histórico
   */
  async deleteCredential(credentialId

Backend: Controller com Guards de Perfil

// backend/src/legal/legal.controller.ts

import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { CredentialService } from './services/credential.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('legal/credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalController {
  constructor(private credentialService: CredentialService) {}

  /**
   * GET /legal/credentials
   * Lista credenciais do tenant (SEM segredos)
   */
  @Get()
  async list(@CurrentUser() user: any) {
    return this.credentialService.listCredentials(user.companyId);
  }

  /**
   * GET /legal/credentials/:id/reveal
   * Revela o segredo (exige perfil CONTADOR ou SUPERVISOR)
   * 
   * ⚠️ OPERAÇÃO AUDITADA
   */
  @Get(':id/reveal')
  @Roles('CONTADOR', 'SUPERVISOR') // Apenas perfis altos podem revelar
  async reveal(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    const secret = await this.credentialService.revealSecret(id, user.id, req);
    
    return {
      secret, // ⚠️ Frontend deve exibir com máscara e timeout
      warning: 'Esta informação é sensível. Não compartilhe.',
    };
  }

  /**
   * POST /legal/credentials
   * Cria ou atualiza credencial
   */
  @Post()
  async upsert(
    @CurrentUser() user: any,
    @Body() body: {
      clientId?: string;
      service: string;
      login: string;
      secret: string;
      metadata?: any;
    }
  ) {
    return this.credentialService.upsertCredential(
      user.companyId,
      body.clientId || null,
      body.service,
      body.login,
      body.secret,
      body.metadata,
      user.id
    );
  }

  /**
   * DELETE /legal/credentials/:id
   * Deleta credencial (hard delete)
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    await this.credentialService.deleteCredential(id, user.id, req);
    return { success: true };
  }

  /**
   * GET /legal/credentials/:id/audit
   * Histórico de acesso a uma credencial específica
   */
  @Get(':id/audit')
  async getAudit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prisma.credentialAccessAudit.findMany({
      where: { credentialId: id, companyId: user.companyId },
      orderBy: { accessedAt: 'desc' },
      take: 50, // Últimos 50 acessos
    });
  }
}

Frontend: Componente de Revelação com Timeout

// frontend/src/components/legal/CredentialReveal.tsx

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Props {
  credentialId: string;
  service: string;
  login: string;
}

export function CredentialReveal({ credentialId, service, login }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-hide após 30 segundos (segurança)
  useEffect(() => {
    if (revealed) {
      const timer = setTimeout(() => {
        setRevealed(false);
        setSecret('');
        toast.info('Credencial oculta automaticamente (timeout de segurança)');
      }, 30000); // 30 segundos

      return () => clearTimeout(timer);
    }
  }, [revealed]);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setSecret('');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/legal/credentials/${credentialId}/reveal`);
      setSecret(res.data.secret);
      setRevealed(true);
      
      toast.success('Credencial revelada (oculta em 30s)');
    } catch (error) {
      toast.error('Você não tem permissão para revelar esta credencial');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Copiado para a área de transferência');
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
        {revealed ? secret : '••••••••••••••••'}
      </div>
      
      <button
        onClick={handleReveal}
        disabled={loading}
        className="p-2 text-gray-600 hover:text-teal-600 disabled:opacity-50"
        title={revealed ? 'Ocultar' : 'Revelar (auditado)'}
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : revealed ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}
      </button>
      
      {revealed && (
        <button
          onClick={handleCopy}
          className="p-2 text-gray-600 hover:text-teal-600"
          title="Copiar"
        >
          {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
        </button>
      )}
    </div>
  );
}

Geração da Chave Mestra (PowerShell)

# Gerar chave de 32 bytes (64 caracteres hexadecimais)
$key = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "CHAVE MESTRA DO COFRE (VAULT_MASTER_KEY)"
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "Copie esta chave para o arquivo backend/.env:"
Write-Host ""
Write-Host "VAULT_MASTER_KEY=$key" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ATENÇÃO:" -ForegroundColor Yellow
Write-Host "  - Esta chave NUNCA deve ser commitada no Git"
Write-Host "  - Guarde em local seguro (ex: gerenciador de senhas)"
Write-Host "  - Se perdida, TODAS as credenciais serão irrecuperáveis"
Write-Host "  - Para rotacionar, use o script rotate-vault-key.ts"
Write-Host ""

Variável de Ambiente

# backend/.env
# ═══════════════════════════════════════════════════════════════
# COFRE CRIPTOGRÁFICO (ADR-059)
# ═══════════════════════════════════════════════════════════════

# Chave mestra para criptografia de credenciais (AES-256-GCM)
# Gerada com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# ⚠️ NUNCA commite este arquivo no Git!
VAULT_MASTER_KEY=a1b2c3d4e5f6...64 caracteres hexadecimais...

Script de Rotação de Chave (Opcional, Avançado

// backend/scripts/rotate-vault-key.ts

/**
 * Script para rotacionar a chave mestra do cofre.
 * 
 * Uso:
 * 1. Gerar nova chave: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 2. Adicionar nova chave no .env como VAULT_MASTER_KEY_NEW
 * 3. Executar: npx ts-node scripts/rotate-vault-key.ts
 * 4. Remover VAULT_MASTER_KEY_NEW e atualizar VAULT_MASTER_KEY com o novo valor
 * 
 * ⚠️ FAÇA BACKUP DO BANCO ANTES DE EXECUTAR!
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function rotateKey() {
  const oldKeyHex = process.env.VAULT_MASTER_KEY;
  const newKeyHex = process.env.VAULT_MASTER_KEY_NEW;

  if (!oldKeyHex || !newKeyHex) {
    throw new Error('VAULT_MASTER_KEY e VAULT_MASTER_KEY_NEW devem estar definidas no .env');
  }

  const oldKey = Buffer.from(oldKeyHex, 'hex');
  const newKey = Buffer.from(newKeyHex, 'hex');

  console.log('Iniciando rotação de chave do cofre...');

  // Buscar todas as credenciais
  const credentials = await prisma.credentialVault.findMany();
  console.log(`Encontradas ${credentials.length} credenciais para re-criptografar`);

  let success = 0;
  let failed = 0;

  for (const cred of credentials) {
    try {
      // Descriptografar com chave antiga
      const [ivBase64, authTagBase64, ciphertextBase64] = cred.secretEnc.split(':');
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const ciphertext = Buffer.from(ciphertextBase64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', oldKey, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

      // Criptografar com chave nova
      const newIv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', newKey, newIv);
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const newAuthTag = cipher.getAuthTag();

      const newSecretEnc = [
        newIv.toString('base64'),
        newAuthTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':');

      // Atualizar no banco
      await prisma.credentialVault.update({
        where: { id: cred.id },
        data: { secretEnc: newSecretEnc },
      });

      success++;
    } catch (error) {
      console.error(`Falha ao re-criptografar credencial ${cred.id}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nRotação concluída:`);
  console.log(`  ✅ Sucesso: ${success}`);
  console.log(`  ❌ Falha: ${failed}`);

  if (failed > 0) {
    console.warn('\n⚠️  Algumas credenciais falharam. Verifique os logs.');
  } else {
    console.log('\n✅ Todas as credenciais foram re-criptografadas com sucesso!');
    console.log('\nPróximos passos:');
    console.log('1. Remover VAULT_MASTER_KEY_NEW do .env');
    console.log('2. Atualizar VAULT_MASTER_KEY com o novo valor');
    console.log('3. Reiniciar o backend');
  }
}

rotateKey()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

  ✅ Consequências


Positivas

✅ Segurança Forte: AES-256-GCM é padrão militar/bancário, recomendado pelo NIST e LGPD
✅ LGPD Compliant: Credenciais nunca em texto puro, auditoria completa de acessos
✅ Auditoria Completa: Todo acesso é registrado com IP, User-Agent, timestamp e usuário
✅ Rotação de Chave: Possível sem re-criptografar manualmente (script automatizado)
✅ Reveal Controlado: Frontend exibe com timeout (30s) e botão de copiar, reduzindo risco de shoulder surfing

Negativas

❌ Complexidade: Exige gerenciamento seguro da chave mestra (ex: AWS KMS, Azure Key Vault em produção)
❌ Performance: Criptografia/descriptografia adicionam ~5ms por operação (aceitável para uso interativo)
❌ Recuperação: Se a chave mestra for perdida, todas as credenciais são irrecuperáveis (backup da chave é crítico)
❌ Dependência de Variável de Ambiente: Em ambientes serverless (Vercel, AWS Lambda), a chave deve ser injetada via secrets manager

📚 Referências

Arquivos que usam esta ADR:

backend/src/common/crypto/vault.service.ts (serviço de criptografia)
backend/src/legal/services/credential.service.ts (serviço de acesso auditável)
backend/src/legal/legal.controller.ts (endpoints com guards de perfil)
backend/prisma/schema.prisma (models CredentialVault e CredentialAccessAudit)
frontend/src/components/legal/CredentialReveal.tsx (componente de revelação com timeout)
backend/scripts/rotate-vault-key.ts (script de rotação de chave)

ADRs relacionadas:

ADR-032 (Cofres AES-256-GCM — padrão geral, esta ADR é a implementação específica local)
ADR-033 (Perfis de aprovação: CONTADOR/SUPERVISOR podem revelar)
ADR-110 (Mascaramento LGPD no frontend)
Legislação:
LGPD (Lei 13.709/2018), Art. 46: "Os agentes de tratamento devem adotar medidas de segurança... criptografia"
NIST SP 800-38D: Recommendation for GCM mode

🔄 Histórico de Revisões

Data                    Autor                   Mudança
2026-08                 Marcos Toledo           Criação inicial
2026-09                 Marcos Toledo           Adicionado script de rotação de chave
2026-10                 Marcos Toledo           Reforçada regra de reveal auditável com timeout no frontend