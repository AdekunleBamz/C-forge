# C-forge

C-forge is a Celo mainnet MiniPay/web app for minting the `cforge` token with symbol `CFRG`.

Repository: https://github.com/AdekunleBamz/C-forge

- Web wallet mint fee: `0.002 CELO`
- MiniPay mint fee: `0.0002 USDm`, `0.0002 USDC`, or `0.0002 USDT`
- Mint output: `1000 CFRG`
- Chain: Celo mainnet
- Deployed CFRG contract: `0x24A3b0B4A60Cf33dFb37E4725d987E6002828F04`

The SDK is a separate repo at `/Users/apple/C-forge-sdk` and is split into tiny sibling packages.

SDK repository: https://github.com/AdekunleBamz/C-forge-sdk

## Setup

```bash
cd /Users/apple/C-forge
PATH=/usr/local/bin:$PATH npm install
cp .env.example .env.local
```

Set deployment-only values only when running the deploy script, not for normal frontend development.

Deploy the contract:

```bash
PATH=/usr/local/bin:$PATH npm run deploy:celo
```

Run deploy commands from a shell that has deploy-only variables loaded, then close that shell before frontend work.

Set the deployed address:

```bash
NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS=0x24A3b0B4A60Cf33dFb37E4725d987E6002828F04
```

See [Environment reference](docs/environment.md) for public app variables and deploy-only variables.

Run the app:

```bash
PATH=/usr/local/bin:$PATH npm run dev
```

## SDK packages

The app consumes local file dependencies from `/Users/apple/C-forge-sdk`:

- `@bamzzstudio/cforge-addresses`
- `@bamzzstudio/cforge-abi`
- `@bamzzstudio/cforge-core`
- `@bamzzstudio/cforge-wallets`
- `@bamzzstudio/cforge-react`

Each package can be published independently later.

Run app release checks after SDK package updates so ABI, addresses, and UI helpers stay aligned.

## Operational Notes

- [Release checklist](docs/release-checklist.md)
- [MiniPay minting notes](docs/minipay-minting.md)
- [Contract operations](docs/contract-operations.md)
- [QA notes](docs/qa-notes.md)
- [Security notes](docs/security-notes.md)

Keep release evidence tied to the mint hash so support can match screenshots, wallet prompts, and explorer links quickly.
