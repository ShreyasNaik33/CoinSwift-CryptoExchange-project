import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { ensureSchema, getPool } from '../_lib/db';
import { allowMethod, assertSessionConfig, handleApiError, HttpError, readBody, setNoStore, setSessionCookie, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function register(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'POST')) return;

  let client: PoolClient | undefined;
  try {
    assertSessionConfig();
    await ensureSchema();
    const body = readBody(request);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2 || name.length > 80) throw new HttpError(400, 'Name must be between 2 and 80 characters.');
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new HttpError(400, 'Password must be 8 to 72 bytes long.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    client = await getPool().connect();
    await client.query('BEGIN');
    const userId = randomUUID();
    const user = await client.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [userId, name, email, passwordHash],
    );
    await client.query('INSERT INTO accounts (user_id) VALUES ($1)', [userId]);
    await client.query('COMMIT');

    setSessionCookie(response, userId);
    response.status(201).json({ user: user.rows[0] });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Registration rollback failed', rollbackError));
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    handleApiError(error, response);
  } finally {
    client?.release();
  }
}
