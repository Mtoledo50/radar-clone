
---

### 📂 `docs/adrs/ADR-032-cofres-aes-256-gcm.md`

```markdown
# ADR-032: Cofres de Credenciais com AES-256-GCM

**Data:** 2026-08  
**Status:** ✅ Aceita (Regra Crítica de Segurança)  
**Decisor:** Marcos Toledo  
**Reversível:** Não (exigência LGPD)

---

## 📋 Contexto

O sistema armazena credenciais sensíveis:
- Senhas de portais governamentais (e-CAC, PGDAS, prefeituras)
- Procurações eletrônicas
- Certificados digitais A1 (.pfx com senha)
- Tokens de API de terceiros

**Problema:**
- Armazenar senhas em texto puro no banco é uma violação grave da LGPD
- Se o banco for comprometido, todas as credenciais vazam
- Contadores precisam acessar essas credenciais para operar portais

**Dilema:**
Como armazenar credenciais de forma segura, mas ainda acessível para automação?

---

## 🎯 Decisão

Implementar **cofres criptografados** usando **AES-256-GCM** (Advanced Encryption Standard com Galois/Counter Mode), com a chave mestra armazenada em variável de ambiente (nunca no código ou no banco).

### Regras Inegociáveis:

1. **Criptografia Simétrica:**
   - Algoritmo: AES-256-GCM (recomendado pelo NIST)
   - Chave mestra: 32 bytes (256 bits) em variável de ambiente
   - IV (Initialization Vector): 12 bytes aleatórios por criptografia
   - Tag de autenticação: 16 bytes (garante integridade)

2. **Nunca Armazenar em Texto Puro:**
   - Senhas, tokens e certificados **SEMPRE** criptografados no banco
   - Logs e erros **NUNCA** devem imprimir credenciais (mesmo parcial)

3. **Acesso Auditável:**
   - Toda leitura de credencial gera log em `CredentialAccessAudit`
   - Quem acessou, quando, qual credencial, qual IP

4. **Rotação de Chave:**
   - Chave mestra pode ser rotacionada (ex: anualmente)
   - Credenciais antigas são re-criptografadas com nova chave em background

---

## 💡 Implementação

### Backend: Serviço de Cofre

```typescript
// backend/src/common/crypto/vault.service.ts

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class VaultService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Chave mestra em variável de ambiente (32 bytes = 256 bits)
    const keyHex = process.env.VAULT_MASTER_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('VAULT_MASTER_KEY deve ter 64 caracteres hexadecimais (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Criptografa um valor sensível
   * 
   * @param plaintext - Texto puro (ex: senha do e-CAC)
   * @returns String no formato "iv:authTag:ciphertext" (base64)
   */
  encrypt(plaintext: string): string {
    // IV aleatório de 12 bytes
    const iv = crypto.randomBytes(12);
    
    // Criptografar
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Tag de autenticação (16 bytes)
    const authTag = cipher.getAuthTag();
    
    // Retornar no formato "iv:authTag:ciphertext" (base64)
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
   */
  decrypt(encrypted: string): string {
    const [ivBase64, authTagBase64, ciphertextBase64] = encrypted.split(':');
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }
}

Backend: Modelo de Dados

// backend/prisma/schema.prisma

model CredentialVault {
  id          String   @id @default(uuid())
  companyId   String
  clientId    String?  // NULL = credencial do escritório (ex: e-CAC)
  
  service     String   // ECAC | PGDAS | PREFEITURA_SP | DOMINIO | CERTIFICATE_A1
  login       String   // Usuário ou CNPJ
  
  // 🔒 CRIPTOGRAFADO (AES-256-GCM)
  secretEnc   String   // Senha ou conteúdo do .pfx (formato "iv:authTag:ciphertext")
  
  metadata    Json?    // {expiresAt: "2027-12-31", owner: "João Silva"}
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([companyId, clientId, service, login])
  @@map("credential_vault")
}

model CredentialAccessAudit {
  id              String   @id @default(uuid())
  companyId       String
  credentialId    String
  accessedBy      String   // userId
  action          String   // READ | UPDATE | DELETE
  ipAddress       String?
  userAgent       String?
  accessedAt      DateTime @default(now())
  
  @@index([companyId, accessedAt])
  @@map("credential_access_audits")
}

Backend: Serviço de Acesso Auditável

// backend/src/legal/services/credential.service.ts

@Injectable()
export class CredentialService {
  constructor(
    private prisma: PrismaService,
    private vault: VaultService,
  ) {}

  async getSecret(credentialId: string, userId: string, req: Request): Promise<string> {
    const credential = await this.prisma.credentialVault.findUnique({
      where: { id: credentialId },
    });

    if (!credential) throw new NotFoundException();

    // Auditoria de acesso
    await this.prisma.credentialAccessAudit.create({
      data: {
        companyId: credential.companyId,
        credentialId: credential.id,
        accessedBy: userId,
        action: 'READ',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Descriptografar
    return this.vault.decrypt(credential.secretEnc);
  }
}

Geração da Chave Mestra (PowerShell)

# Gerar chave de 32 bytes (64 caracteres hexadecimais)
$key = -join ((1..32) | ForEach-Object { "{0:X2}" -f (Get-Random -Maximum 256) })
Write-Host "Chave gerada (copie para o .env):"
Write-Host "VAULT_MASTER_KEY=$key"

Variável de Ambiente
# backend/.env
VAULT_MASTER_KEY=A1B2C3D4E5F6...64 caracteres hexadecimais...

✅ Consequências

Positivas

✅ Segurança Forte: AES-256-GCM é padrão militar/bancário
✅ LGPD Compliant: Credenciais nunca em texto puro
✅ Auditoria Completa: Todo acesso é registrado
✅ Rotação de Chave: Possível sem re-criptografar manualmente

Negativas

❌ Complexidade: Exige gerenciamento seguro da chave mestra (ex: AWS KMS, Azure Key Vault em produção)
❌ Performance: Criptografia/descriptografia adiciona ~5ms por operação (aceitável)
❌ Recuperação: Se a chave mestra for perdida, todas as credenciais são irrecuperáveis

📚 Referências

Arquivos que usam esta ADR:

backend/src/common/crypto/vault.service.ts
backend/src/legal/services/credential.service.ts
backend/src/digital-employee/skills/certificate-skill.ts (Aurora)

ADRs relacionadas:

ADR-059 (Cofre local com chave em env)
ADR-110 (Mascaramento LGPD no frontend)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial
2026-09             Marcos Toledo       Adicionado exemplo de geração de chave