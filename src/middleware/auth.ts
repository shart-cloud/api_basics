import { Context, Next } from 'hono';
import { Env } from '../types';
import { extractBearerToken, verifyAccessToken } from '../lib/auth';
import { formatResponse } from '../lib/formatters';

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return formatResponse(c, {
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Authorization: Bearer <token>',
    }, 401);
  }

  const payload = verifyAccessToken(token, c.env.JWT_SECRET);

  if (!payload) {
    return formatResponse(c, {
      error: 'Unauthorized',
      message: 'Invalid or expired access token',
    }, 401);
  }

  // Store user info in context
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);

  await next();
}
