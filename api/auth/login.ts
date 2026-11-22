import bcrypt from 'bcryptjs';
import { ensureSchema, getPool } from '../_lib/db';
import { allowMethod, assertSessionConfig, handleApiError, HttpError, readBody, setNoStore, setSessionCookie, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function login(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'POST')) return;

  try {
    assertSessionConfig();
    await ensureSchema();
    const body = readBody(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || email.length > 254 || !password || Buffer.byteLength(password, 'utf8') > 72) {
      throw new HttpError(400, 'Enter a valid email and password.');
    }

    const result = await getPool().query<{ id: string; name: string; email: string; password_hash: string }>(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, 'Email or password is incorrect.');
    }

    setSessionCookie(response, user.id);
    response.status(200).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    handleApiError(error, response);
  }
}
