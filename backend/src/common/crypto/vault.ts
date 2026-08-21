// =================================================================
// INÍCIO: backend/src/common/crypto/vault.ts
// =================================================================
/**
 * 🔐 Vault AES-256-GCM (ADR-059 — FD-8)
 * Cofre local p/ senhas, procurações e certificado A1.
 * Chave em env VAULT_KEY (64 hex) — nunca em código/banco.
 * Formato do payload: iv.tag.ciphertext (base64).
 */
import * as crypto from 'crypto';

const ALG = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.VAULT_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'VAULT_KEY ausente/inválida no .env (esperado 64 hex). ' +
      'Gere: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(hex, 'hex');
}

/** Cifra um segredo (senha, .pfx+senha, token). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${enc.toString('base64')}`;
}

/** Decifra um payload iv.tag.ct. Lança erro se autenticidade falhar. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Payload de cofre corrompido');
  const decipher = crypto.createDecipheriv(ALG, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
// =================================================================
// FIM: backend/src/common/crypto/vault.ts
// =================================================================