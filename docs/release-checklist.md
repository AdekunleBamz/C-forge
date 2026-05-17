# C-forge Release Checklist

Use this checklist before promoting a Vercel deployment.

## Local Checks

- Run `npm run lint` to confirm the app passes the configured lint command.
- Run `npm run typecheck` to confirm TypeScript still compiles.
- Run `npm run build` to confirm the Next.js production bundle builds.
- Confirm local SDK package versions match the release candidate before building.
- Confirm `NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS` points to the intended Celo mainnet token.
- Confirm the Vercel project has the same public token address before promoting production.

## Runtime Checks

- Open the app in a normal browser and confirm the CELO mint fee is `0.002 CELO`.
- Open the app in MiniPay and confirm stablecoin mint options show the expected USDm, USDC, and USDT fees.
- Confirm the displayed contract address matches the deployed CFRG token address.
- Confirm total supply and connected wallet balance load from Celo mainnet.
- Attach one mint hash and Vercel preview URL to the release notes.
