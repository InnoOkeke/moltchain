---
name: sunset-review
description: Identifies deployed contracts that have low activity and should be sunsetted.
---

### When to use
Use this tool every hour (or as triggered by cron) to review past deployments for potential sunsetting.

### Parameters
None

### Execution
```bash
pnpm --filter scripts exec tsx src/daemon/agent.ts --task engagement
```
*Note: The engagement task in agent.ts also handles sunset automation.*
