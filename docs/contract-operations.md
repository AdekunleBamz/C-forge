# C-forge Contract Operations

The deployed `CForgeToken` contract has a small owner-operated surface for production support.

## Owner Actions

- `setTreasury` updates where CELO and stablecoin fees are sent.
- `setStableFee` updates a stablecoin mint fee or enables a new supported token.
- `setPaused` pauses minting without affecting ERC-20 transfers.
- `transferOwnership` moves owner permissions to a new wallet.

Before changing treasury, confirm the new address can receive native CELO and ERC-20 stablecoins.

Before transferring ownership, confirm the new owner wallet can sign Celo mainnet transactions.

## Post-Change Checks

- Read `treasury`, `paused`, and the edited `stableMintFee` value after any owner action.
- Confirm stablecoin fee units match the token decimals before calling `setStableFee`.
- Complete one read-only app load after an owner action to confirm the UI still reflects the deployed contract.
- Record the owner wallet, action, and transaction hash in the operation note.
- Attach the public explorer link to every owner action note.
