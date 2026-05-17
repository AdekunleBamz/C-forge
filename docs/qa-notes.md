# QA Notes

## Pre-Smoke-Test

- Run `npm run typecheck` before smoke testing a new build.
- Confirm `NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS` is set and matches the deployed CFRG contract before each test session.

## Web Wallet

- Connect a Celo-compatible wallet.
- Refresh once after connecting and confirm the wallet label remains understandable.
- Confirm the app asks for Celo mainnet before minting.
- Confirm the CELO mint fee reads `0.002 CELO`.
- Confirm the CFRG balance refreshes after a successful mint.
- Confirm the app shows a clear message if the token address is not configured.

## MiniPay

- Open the app inside MiniPay.
- Confirm stablecoin options show USDm, USDC, and USDT.
- Confirm the selected stablecoin balance and allowance load.
- Confirm minting stays on Celo mainnet.
- Save the wallet type used for each mint smoke test.
