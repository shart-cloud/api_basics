import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface TokenPayload {
  userId: string; // UUID
  email: string;
  type: 'access' | 'refresh';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, email: string, secret: string, expirySeconds: number): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, secret, {
    expiresIn: expirySeconds,
  });
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function generateRefreshToken(): string {
  // Generate a random token for refresh
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function verifyAccessToken(token: string, secret: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    if (payload.type !== 'access') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
