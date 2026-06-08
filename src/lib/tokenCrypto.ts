import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Cifrado de tokens sensibles (Google OAuth, etc.)
//
// Algoritmo: AES-256-GCM
// Derivación de clave: PBKDF2 con 100k iteraciones
// Almacenamiento: base64(iv + tag + ciphertext)
// ─────────────────────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits para GCM
const TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = 'sha256';

// Salt para derivar clave (diferente al del PIN)
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || 'vera-token-crypto-salt-v1';

/**
 * Deriva una clave de cifrado a partir del SECRET del session.
 * Usa PBKDF2 para asegurar que incluso si se conoce el SECRET,
 * se necesitan 100k iteraciones para obtener la clave.
 */
function deriveKey(secret: string): Buffer {
  return pbkdf2Sync(
    secret,
    ENCRYPTION_SALT,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
}

/**
 * Cifra un token (string) usando AES-256-GCM.
 *
 * @param plaintext Token en texto plano (JSON string)
 * @param secret String de derivación de clave
 * @returns Base64 string: iv(12) + tag(16) + ciphertext
 */
export function encryptToken(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combinar: iv + tag + ciphertext
  const combined = Buffer.concat([iv, tag, Buffer.from(ciphertext, 'hex')]);
  return combined.toString('base64');
}

/**
 * Descifra un token cifrado.
 *
 * @param encoded Base64 string que contiene: iv(12) + tag(16) + ciphertext
 * @param secret String de derivación de clave
 * @returns Token en texto plano
 * @throws Si el descifrado falla (tampering, wrong secret, etc.)
 */
export function decryptToken(encoded: string, secret: string): string {
  const key = deriveKey(secret);
  const combined = Buffer.from(encoded, 'base64');

  // Extraer componentes
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);

  return plaintext.toString('utf8');
}

/**
 * Helper para cifrar y serializar un objeto (ej: Google tokens)
 */
export function encryptObject<T>(obj: T, secret: string): string {
  const json = JSON.stringify(obj);
  return encryptToken(json, secret);
}

/**
 * Helper para descifrar y parsear un objeto
 */
export function decryptObject<T>(encoded: string, secret: string): T {
  const json = decryptToken(encoded, secret);
  return JSON.parse(json) as T;
}

/**
 * Usa SESSION_SECRET como clave de derivación por defecto.
 * Si el secret no está configurado, lanza error (por seguridad).
 */
function getDefaultSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET no configurado — imposible cifrar tokens');
  }
  return secret;
}

/**
 * Versiones que usan SESSION_SECRET por defecto
 */
export function encryptTokenDefault(plaintext: string): string {
  return encryptToken(plaintext, getDefaultSecret());
}

export function decryptTokenDefault(encoded: string): string {
  return decryptToken(encoded, getDefaultSecret());
}

export function encryptObjectDefault<T>(obj: T): string {
  return encryptObject(obj, getDefaultSecret());
}

export function decryptObjectDefault<T>(encoded: string): T {
  return decryptObject<T>(encoded, getDefaultSecret());
}
