# C-forge

C-forge is a Celo mainnet MiniPay/web app for minting the `cforge` token with symbol `CFRG`.

Repository: https://github.com/AdekunleBamz/C-forge

- Web wallet mint fee: `0.002 CELO`
- MiniPay mint fee: `0.0002 USDm`, `0.0002 USDC`, or `0.0002 USDT`
- Mint output: `1000 CFRG`
- Chain: Celo mainnet

The SDK is a separate repo at `/Users/apple/C-forge-sdk` and is split into tiny sibling packages.

SDK repository: https://github.com/AdekunleBamz/C-forge-sdk

## Setup

```bash
cd /Users/apple/C-forge
PATH=/usr/local/bin:$PATH npm install
cp .env.example .env.local
```

Deploy the contract:

```bash
PATH=/usr/local/bin:$PATH npm run deploy:celo
```

Set the deployed address:

```bash
NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS=0x...
```

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
