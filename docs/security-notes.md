# Security Notes

- Keep `CELO_PRIVATE_KEY` out of browser-visible variables and Vercel public settings.
- `CELO_PRIVATE_KEY` is used only by the deploy script and must never be set as a `NEXT_PUBLIC_*` variable.
- Verify the treasury wallet before deployment.
- Confirm stablecoin token addresses before enabling or changing fees.
- Use `setPaused(true)` if minting needs to stop while ERC-20 transfers remain available.
- Recheck the deployed contract address after every redeploy.
- Never paste a production private key into browser-visible `NEXT_PUBLIC_*` variables.
- Confirm owner and treasury addresses before each production mint release.
- Review shared screenshots so wallet prompts do not expose private signer details.
