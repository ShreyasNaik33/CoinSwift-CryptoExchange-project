# CoinSwift

CoinSwift is a static crypto **paper-trading demo** built with React and Vite. It has no backend, database, API keys, or environment variables to configure. Accounts and simulated portfolios are stored in the user's browser only.

## Local frontend

```powershell
npm install
npm run dev
```

`npm run dev` starts the website locally.

## Deploy

Import the repository into Vercel and deploy with the defaults: build command `npm run build`, output directory `dist`. No additional services or environment variables are required. See [DEPLOYMENT.md](./DEPLOYMENT.md).

This project is for demonstrations only. Browser-stored accounts are not server-secure or synced across devices; prices and trades are simulated and no real money is involved.
