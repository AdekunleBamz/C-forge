# MiniPay Minting Notes

C-forge supports stablecoin minting for MiniPay users through `mintWithStable`.

## Supported Stablecoins

- USDm: `0.0002` with 18 decimals.
- USDC: `0.0002` with 6 decimals.
- USDT: `0.0002` with 6 decimals.

The app and contract both use Celo mainnet stablecoin addresses for these options.

Note: USDm uses 18 decimals while USDC and USDT use 6. The fee approval amount must be converted using the correct decimal count for the selected token.

## Review Checks

- Confirm the selected stablecoin has a non-zero fee in `stableMintFee`.
- Confirm the user completes the stablecoin approval before minting.
- Confirm the approval receipt is available before asking for the mint transaction.
- Keep MiniPay sessions on Celo mainnet; do not prompt MiniPay users to switch chains.

## Reviewer Notes

Share the CFRG contract address and supported stablecoin fee list with reviewers so they can compare the MiniPay screen against the deployed contract.

Capture the MiniPay app version used for the stablecoin mint review.

Repeat the stablecoin approval review after any supported token fee changes.
