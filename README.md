# Dissect

**Cut it open. See what's inside.** A contract dissector for Robinhood Chain.

Paste any contract address, even one that was never verified. Dissect pulls the raw bytecode from the chain, disassembles it, finds every function in its dispatcher, names them, and explains in plain English what the deployer can do to holders.

## What it finds

| Organ | Meaning |
|---|---|
| Mint switch | New tokens can be printed |
| Blacklist | Wallets can be blocked from selling (honeypot) |
| Adjustable tax | Buy/sell tax can be changed after you buy |
| Withdraw | Tokens or ETH can be pulled out of the contract |
| Swappable code | EIP-1967 / beacon / EIP-1167 proxies and `upgradeTo` (proxies are followed to the real code) |
| Trading switch, limits | Owner controls trading and wallet caps |
| Self-destruct, delegatecall, callcode, tx.origin | Dangerous opcodes |
| Mystery functions | Selectors with no public name |

It also reads live values (owner, taxes, limits, supply) straight from the contract. If the owner is renounced, owner-only switches are marked dormant.

Every report has a share link (`/c/<address>`) with its own preview image for X.

## How

- `src/lib/evm.ts`: disassembler, metadata stripping, selector extraction, proxy detection
- `src/lib/signatures.ts`: catalogue of known functions and what they let someone do
- `src/lib/diagnose.ts`: findings and verdict (pure, tested)
- `src/lib/dissect.ts`: fetches bytecode, follows proxies, names unknown selectors via the openchain and 4byte signature databases, and reads live values

Optional environment variables: `RPC_URL`, `EXPLORER_URL`, `BLOCKSCOUT_API_KEY`, `NEXT_PUBLIC_SITE_URL` (same meaning as in Second Look).

```bash
npm install
npm run dev   # http://localhost:3000
npm test
```

Dissect reads code, not intentions. Not financial advice.
