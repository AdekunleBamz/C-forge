# C-forge Contract Operations

The deployed `CForgeToken` contract has a small owner-operated surface for production support.

## Owner Actions

- `setTreasury` updates where CELO and stablecoin fees are sent.
- `setStableFee` updates a stablecoin mint fee or enables a new supported token.
- `setPaused` pauses minting without affecting ERC-20 transfers.
- `transferOwnership` moves owner permissions to a new wallet.

## Post-Change Checks

- Read `treasury`, `paused`, and the edited `stableMintFee` value after any owner action.
- Complete one read-only app load after an owner action to confirm the UI still reflects the deployed contract.
