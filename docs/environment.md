# Environment Reference

C-forge reads public app settings and private deploy settings from environment variables.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS` | Browser | Optional token address override for the deployed CFRG contract. |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Browser | Optional WalletConnect project id for wallet integrations. |
| `CELO_RPC_URL` | Deploy script | Celo RPC endpoint used by the deploy script. |
| `CELO_PRIVATE_KEY` | Deploy script | Deployer private key. Never expose this as a public variable. |
| `CFORGE_TREASURY` | Deploy script | Treasury wallet passed to the contract constructor. |

Use `.env.local` for app development and a separate deploy shell/session for private deploy variables.
