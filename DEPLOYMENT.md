# CoinSwift deployment

CoinSwift is a paper-trading demo. Prices are illustrative, and balances, deposits, withdrawals, and orders are simulated. It does not connect to a real exchange or process real money.

## Deploy to Vercel

1. Create a PostgreSQL database with a provider such as Neon. Use its pooled connection string and require TLS.
2. Import this repository into Vercel. Vercel builds the Vite frontend from `npm run build` and deploys the `api/` functions.
3. Add these environment variables to the Vercel project for every environment you use:
   - `DATABASE_URL`: the PostgreSQL connection string.
   - `SESSION_SECRET`: a randomly generated secret with at least 32 bytes. For example, generate one locally with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
4. Redeploy after setting the variables. The API creates its tables on its first request.

Never commit `.env.local` or put production credentials in client-side `VITE_` variables. `.env.example` contains placeholders only.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `SESSION_SECRET` to development values.
3. Install the Vercel CLI, then run `vercel dev` to exercise both the frontend and serverless API locally. `npm run dev` starts the Vite frontend only.

Use a separate development database. The API persists accounts, paper cash, holdings, and trade history in PostgreSQL. Passwords are hashed, and authentication uses signed, HttpOnly cookies.

## Before a public launch

- Configure database backups, connection limits, and monitoring with the PostgreSQL provider.
- Enable platform-level rate limiting / WAF protections for authentication and trading endpoints.
- Add email verification and password recovery before using the accounts for anything beyond a demo.
- Do not use this paper-trading application for real-money exchange or custody.
