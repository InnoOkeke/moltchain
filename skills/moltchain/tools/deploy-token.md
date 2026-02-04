---
name: deploy-token
description: Deploys a new ERC20/ERC1155 token or micro-dApp via Neynar/Clanker on Base.
---

### When to use
Use this tool only after a strong narrative (strength >= 7) has been detected.

### Parameters
- `name`: (string) The name of the token.
- `symbol`: (string) The token symbol.
- `reason`: (string) Brief explanation of why this token is being deployed.
- `type`: (string) 'erc20', 'erc1155', 'vote', or 'registry'. Defaults to 'erc20'.

### Execution
```bash
pnpm deploy:token --name "{{name}}" --symbol "{{symbol}}" --reason "{{reason}}" --type "{{type}}"
```
