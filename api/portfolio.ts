import { MARKET_ASSETS } from '../shared/market';
import { ensureSchema, getPool } from './_lib/db';
import { allowMethod, authenticatedUser, handleApiError, setNoStore, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function portfolio(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'GET')) return;

  try {
    await ensureSchema();
    const user = await authenticatedUser(request);
    const [accountResult, holdingsResult, ordersResult] = await Promise.all([
      getPool().query<{ cash_cents: string }>('SELECT cash_cents FROM accounts WHERE user_id = $1', [user.id]),
      getPool().query<{ asset_id: string; quantity: string }>('SELECT asset_id, quantity::text FROM holdings WHERE user_id = $1 AND quantity > 0', [user.id]),
      getPool().query<{ id: string; side: 'BUY' | 'SELL'; asset_id: string; symbol: string; quantity: string; unit_price: string; total_cents: string; created_at: Date }>(
        'SELECT id, side, asset_id, symbol, quantity::text, unit_price::text, total_cents::text, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25',
        [user.id],
      ),
    ]);

    const cashCents = Number(accountResult.rows[0]?.cash_cents);
    const holdings = holdingsResult.rows.flatMap((holding) => {
      const asset = MARKET_ASSETS.find((item) => item.id === holding.asset_id);
      if (!asset) return [];
      const quantity = Number(holding.quantity);
      return [{ ...asset, quantity, value: quantity * asset.price }];
    });
    const orders = ordersResult.rows.map((order) => ({
      id: order.id,
      side: order.side,
      assetId: order.asset_id,
      symbol: order.symbol,
      quantity: Number(order.quantity),
      unitPrice: Number(order.unit_price),
      totalUsd: Number(order.total_cents) / 100,
      createdAt: order.created_at,
    }));

    response.status(200).json({
      user,
      cashUsd: Number.isFinite(cashCents) ? cashCents / 100 : 0,
      holdings,
      totalUsd: holdings.reduce((sum, item) => sum + item.value, Number.isFinite(cashCents) ? cashCents / 100 : 0),
      orders,
    });
  } catch (error) {
    handleApiError(error, response);
  }
}
