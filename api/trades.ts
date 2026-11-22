import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { MARKET_ASSETS } from '../shared/market';
import { ensureSchema, getPool } from './_lib/db';
import { allowMethod, authenticatedUser, handleApiError, HttpError, readBody, setNoStore, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function trade(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'POST')) return;

  let client: PoolClient | undefined;
  try {
    await ensureSchema();
    const user = await authenticatedUser(request);
    const body = readBody(request);
    const assetId = typeof body.assetId === 'string' ? body.assetId : '';
    const side = body.side;
    const amountUsd = Number(body.amountUsd);
    const asset = MARKET_ASSETS.find((item) => item.id === assetId);
    const totalCents = Math.round(amountUsd * 100);
    if (!asset || (side !== 'BUY' && side !== 'SELL')) throw new HttpError(400, 'Choose a supported asset and trade side.');
    if (!Number.isFinite(amountUsd) || totalCents < 100 || totalCents > 100_000_000) {
      throw new HttpError(400, 'Trade amount must be between $1 and $1,000,000.');
    }

    const quantity = Number(((totalCents / 100) / asset.price).toFixed(12));
    client = await getPool().connect();
    await client.query('BEGIN');
    const accountResult = await client.query<{ cash_cents: string }>(
      'SELECT cash_cents FROM accounts WHERE user_id = $1 FOR UPDATE',
      [user.id],
    );
    const cashCents = Number(accountResult.rows[0]?.cash_cents);
    if (!Number.isFinite(cashCents)) throw new HttpError(404, 'Paper wallet was not found.');

    const holdingResult = await client.query<{ quantity: string }>(
      'SELECT quantity::text FROM holdings WHERE user_id = $1 AND asset_id = $2 FOR UPDATE',
      [user.id, asset.id],
    );
    const currentQuantity = Number(holdingResult.rows[0]?.quantity || 0);
    if (side === 'BUY' && cashCents < totalCents) throw new HttpError(409, 'Insufficient paper cash balance.');
    if (side === 'SELL' && currentQuantity < quantity) throw new HttpError(409, `Insufficient ${asset.symbol} balance.`);

    if (side === 'BUY') {
      await client.query('UPDATE accounts SET cash_cents = cash_cents - $1 WHERE user_id = $2', [totalCents, user.id]);
      await client.query(
        `INSERT INTO holdings (user_id, asset_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, asset_id) DO UPDATE SET quantity = holdings.quantity + EXCLUDED.quantity`,
        [user.id, asset.id, quantity],
      );
    } else {
      await client.query('UPDATE accounts SET cash_cents = cash_cents + $1 WHERE user_id = $2', [totalCents, user.id]);
      await client.query('UPDATE holdings SET quantity = quantity - $1 WHERE user_id = $2 AND asset_id = $3', [quantity, user.id, asset.id]);
    }

    const orderId = randomUUID();
    await client.query(
      'INSERT INTO orders (id, user_id, side, asset_id, symbol, quantity, unit_price, total_cents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [orderId, user.id, side, asset.id, asset.symbol, quantity, asset.price, totalCents],
    );
    const updatedAccount = await client.query<{ cash_cents: string }>('SELECT cash_cents FROM accounts WHERE user_id = $1', [user.id]);
    await client.query('COMMIT');

    response.status(201).json({
      order: { id: orderId, side, assetId: asset.id, symbol: asset.symbol, quantity, unitPrice: asset.price, totalUsd: totalCents / 100 },
      cashUsd: Number(updatedAccount.rows[0].cash_cents) / 100,
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch((rollbackError: unknown) => console.error('Trade rollback failed', rollbackError));
    handleApiError(error, response);
  } finally {
    client?.release();
  }
}
