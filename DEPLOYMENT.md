# Deploy CoinSwift

CoinSwift is a static paper-trading demo. It requires no database, backend, API key, or environment variable.

## Vercel

1. Import the GitHub repository into Vercel.
2. Select the Vite framework preset, or keep the detected defaults.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. No environment variables or external services are required.

You can also deploy the generated `dist/` folder to any static web host.

## Limitations

Accounts, balances, and trade history are stored only in the current browser and can be cleared or modified by that browser's user. They are not securely authenticated on a server and do not sync across devices. Prices and trades are simulated; this app cannot process real money or connect to an exchange.
