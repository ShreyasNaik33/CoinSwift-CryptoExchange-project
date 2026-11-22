import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { ensureSchema, getPool } from './_lib/db';
import { allowMethod, authenticatedUser, handleApiError, HttpError, readBody, setNoStore, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function wallet(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'POST')) return;

  let client: PoolClient | undefined;
  try {
    await ensureSchema();
    const user = await authenticatedUser(request);
    const body = readBody(request);
    const action = body.action;
    const amountUsd = Number(body.amountUsd);
    const amountCents = Math.round(amountUsd * 100);
    if (action !== 'DEPOSIT' && action !== 'WITHDRAW') throw new HttpError(400, 'Choose a supported wallet action.');
    if (!Number.isFinite(amountUsd) || amountCents < 100 || amountCents > 100_000) {
      throw new HttpError(400, 'Paper wallet amount must be between $1 and $1,000.');
    }

    client = await getPool().connect();
    await client.query('BEGIN');
    const update = action === 'DEPOSIT'
      ? 'UPDATE accounts SET cash_cents = cash_cents + $1 WHERE user_id = $2 RETURNING cash_cents'
      : 'UPDATE accounts SET cash_cents = cash_cents - $1 WHERE user_id = $2 AND cash_cents >= $1 RETURNING cash_cents';
    const result = await client.query<{ cash_cents: string }>(update, [amountCents, user.id]);
    if (!result.rows[0]) throw new HttpError(409, action === 'WITHDRAW' ? 'Insufficient paper cash balance.' : 'Paper wallet was not found.');
    await client.query(
      'INSERT INTO wallet_activity (id, user_id, action, amount_cents) VALUES ($1, $2, $3, $4)',
      [randomUUID(), user.id, action, amountCents],
    );
    await client.query('COMMIT');
    response.status(200).json({ cashUsd: Number(result.rows[0].cash_cents) / 100 });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Wallet transaction rollback failed', rollbackError));
    handleApiError(error, response);
  } finally {
    client?.release();
  }
}
