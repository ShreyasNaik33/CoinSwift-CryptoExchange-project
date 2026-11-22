export type MarketAsset = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  color: string;
  mark: string;
};

export const MARKET_ASSETS: MarketAsset[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 64892.42, change: 2.84, color: '#f7931a', mark: 'B' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3482.16, change: 1.62, color: '#627eea', mark: 'E' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 172.38, change: 5.27, color: '#14f195', mark: 'S' },
  { id: 'usdcoin', name: 'USD Coin', symbol: 'USDC', price: 1, change: 0.01, color: '#2775ca', mark: '$' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', price: 0.5284, change: -1.24, color: '#252525', mark: 'X' },
];
