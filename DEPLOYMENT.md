# Deploy CoinSwift

CoinSwift is a static paper-trading demo. It requires no database, backend, API key, or environment variable. The production build bundles the app's JavaScript and CSS into one self-contained `dist/index.html`.

## Vercel

1. Import the GitHub repository into Vercel.
2. Keep the Vite framework preset, build command `npm run build`, and output directory `dist`.
3. Deploy. No environment variables or external services are required.

The only file in the generated output is `dist/index.html`; it can also be deployed directly to any static host.

## Limitations

Accounts, balances, and trade history are stored only in the current browser and can be cleared or modified by that browser's user. They are not securely authenticated on a server and do not sync across devices. Prices and trades are simulated; this app cannot process real money or connect to an exchange.
