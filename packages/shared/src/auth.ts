import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload } from './types';

// ============================================================================
// 1. PASSWORD HASHING & VERIFICATION (Node.js scrypt + Timing-Safe)
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, storedHashOrSecret: string): Promise<boolean> {
  if (!password || !storedHashOrSecret) return false;

  if (storedHashOrSecret.startsWith('scrypt$')) {
    const parts = storedHashOrSecret.split('$');
    if (parts.length !== 6) return false;
    const [, NStr, rStr, pStr, salt, expectedHashHex] = parts;
    const N = parseInt(NStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, 64, { N, r, p }, (err, derivedKey) => {
        if (err) return resolve(false);
        const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
        if (derivedKey.length !== expectedBuffer.length) return resolve(false);
        resolve(crypto.timingSafeEqual(derivedKey, expectedBuffer));
      });
    });
  }

  // Constant-time fallback comparison
  const passBuffer = Buffer.from(password);
  const secretBuffer = Buffer.from(storedHashOrSecret);
  if (passBuffer.length !== secretBuffer.length) {
    const h1 = crypto.createHash('sha256').update(password).digest();
    const h2 = crypto.createHash('sha256').update(storedHashOrSecret).digest();
    return crypto.timingSafeEqual(h1, h2);
  }
  return crypto.timingSafeEqual(passBuffer, secretBuffer);
}

// ============================================================================
// 2. SIGNED SESSION TOKENS (Web API Compatible: Node.js & Edge)
// ============================================================================

const DEFAULT_SECRET = 'temporary-dev-secret-please-change-in-production-min-32-chars';

export function getSecretKeyBytes(role: 'visitor' | 'editor'): Uint8Array {
  const envVar = role === 'visitor' ? process.env.VISITOR_SESSION_SECRET : process.env.EDITOR_SESSION_SECRET;
  const rawSecret = envVar || `${DEFAULT_SECRET}-${role}`;
  return new TextEncoder().encode(rawSecret);
}

export async function createSessionToken(role: 'visitor' | 'editor', durationDays = 7): Promise<string> {
  const secret = getSecretKeyBytes(role);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + durationDays * 24 * 60 * 60;

  return new SignJWT({ role, createdAt: now })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifySessionToken(token: string, expectedRole: 'visitor' | 'editor'): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getSecretKeyBytes(expectedRole);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (payload.role !== expectedRole) {
      return null;
    }

    return {
      role: payload.role as 'visitor' | 'editor',
      createdAt: (payload.createdAt as number) || 0,
      expiresAt: (payload.exp as number) || 0,
    };
  } catch {
    return null;
  }
}
