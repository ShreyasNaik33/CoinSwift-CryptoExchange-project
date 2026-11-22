import { MARKET_ASSETS } from '../shared/market';
import { allowMethod, type ApiRequest, type ApiResponse } from './_lib/http';

export default function market(request: ApiRequest, response: ApiResponse): void {
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  if (!allowMethod(request, response, 'GET')) return;
  response.status(200).json({ mode: 'paper', assets: MARKET_ASSETS });
}
