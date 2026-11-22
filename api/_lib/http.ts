import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { getPool } from './db';

const SESSION_COOKIE = 'coinswift_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

export type ApiRequest = {
  method?: string;
  headers: IncomingHttpHeaders;
  body?: unknown;
};

export type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function setNoStore(response: ApiResponse): void {
  response.setHeader('Cache-Control', 'no-store');
}

export function allowMethod(request: ApiRequest, response: ApiResponse, method: string): boolean {
  if (request.method === method) return true;
  response.setHeader('Allow', method);
  response.status(405).json({ error: 'Method not allowed.' });
  return false;
}

export function readBody(request: ApiRequest): Record<string, unknown> {
  const body: unknown = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'A JSON request body is required.');
  }
  return body as Record<string, unknown>;
}

export function handleApiError(error: unknown, response: ApiResponse): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  console.error('CoinSwift API error', error);
  response.status(500).json({ error: 'The request could not be completed.' });
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
  }
  return secret;
}

export function assertSessionConfig(): void {
  sessionSecret();
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function setSessionCookie(response: ApiResponse, userId: string): void {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const payload = Buffer.from(`${userId}:${expiresAt}`).toString('base64url');
  const signature = sign(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${payload}.${signature}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_LIFETIME_SECONDS}${secure}`,
  );
}

export function clearSessionCookie(response: ApiResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
}

function sessionToken(request: ApiRequest): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  const pair = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return pair?.slice(SESSION_COOKIE.length + 1);
}

export async function authenticatedUser(request: ApiRequest): Promise<{ id: string; name: string; email: string }> {
  const token = sessionToken(request);
  const [payload, providedSignature, extra] = token?.split('.') || [];
  if (!payload || !providedSignature || extra) throw new HttpError(401, 'Please log in to continue.');

  let validSignature = false;
  try {
    const expected = Buffer.from(sign(payload));
    const provided = Buffer.from(providedSignature);
    validSignature = expected.length === provided.length && timingSafeEqual(expected, provided);
  } catch {
    throw new HttpError(500, 'Authentication is not configured on the server.');
  }
  if (!validSignature) throw new HttpError(401, 'Please log in to continue.');

  let decoded: string;
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    throw new HttpError(401, 'Please log in to continue.');
  }
  const separator = decoded.lastIndexOf(':');
  const userId = decoded.slice(0, separator);
  const expiresAt = Number(decoded.slice(separator + 1));
  if (separator <= 0 || !Number.isFinite(expiresAt) || expiresAt <= Date.now() / 1000) {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  const result = await getPool().query<{ id: string; name: string; email: string }>(
    'SELECT id, name, email FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rows[0]) throw new HttpError(401, 'Please log in to continue.');
  return result.rows[0];
}
