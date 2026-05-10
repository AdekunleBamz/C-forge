# Security Notes

- Keep `CELO_PRIVATE_KEY` out of browser-visible variables and Vercel public settings.
- Verify the treasury wallet before deployment.
- Confirm stablecoin token addresses before enabling or changing fees.
- Use `setPaused(true)` if minting needs to stop while ERC-20 transfers remain available.
- Recheck the deployed contract address after every redeploy.
