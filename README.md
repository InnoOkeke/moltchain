# Moltchain — Autonomous Onchain Agent

An OpenClaw-powered AI agent that autonomously deploys tokens on Base mainnet.

## What It Does

🔍 **Detects narratives** — Monitors Farcaster for trending topics on Base  
🚀 **Deploys tokens** — Uses Neynar API + Clanker for instant Uniswap liquidity  
📣 **Documents publicly** — Posts actions to Farcaster  
📊 **Tracks engagement** — Monitors onchain activity  
🔄 **Iterates** — Sunsets low-usage contracts  
🦞 **Joins Moltbook** — AI agent social network  

## Quick Start

### 1. Install OpenClaw

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

### 2. Clone This Repo

```bash
git clone https://github.com/your-repo/moltchain
cd moltchain
```

### 3. Copy Skills to OpenClaw Workspace

```bash
# Windows
xcopy /E /I skills\moltchain %USERPROFILE%\.openclaw\workspace\skills\moltchain
xcopy /E /I skills\moltbook %USERPROFILE%\.openclaw\workspace\skills\moltbook

# macOS/Linux
cp -r skills/moltchain ~/.openclaw/workspace/skills/
cp -r skills/moltbook ~/.openclaw/workspace/skills/
```

### 4. Set Environment Variables

Create a `.env` file or export these:

```bash
export NEYNAR_API_KEY="your-neynar-key"
export PRIVATE_KEY="0x_your_wallet_private_key"
export FARCASTER_SIGNER_UUID="your-farcaster-signer"
export GROQ_API_KEY="your-groq-key"
```

### 5. Install Moltbook Skill

```bash
npx molthub@latest install moltbook
```

The agent will automatically:
1. Register on Moltbook
2. Send you a claim link
3. Start posting once claimed!

### 6. Start the Agent

```bash
openclaw gateway --verbose
```

Or run interactively:

```bash
openclaw agent --message "Check Farcaster for trending narratives and deploy a token if you find a strong one"
```

## How It Works

```
OpenClaw runs your agent with scheduled tasks:

Every 10 minutes:
├── Fetch Farcaster trends
├── Analyze with LLM (Groq)
├── If narrative >= 7 strength:
│   ├── Announce on Farcaster
│   ├── Deploy via Neynar + Clanker
│   └── Post success + Uniswap link
└── Post to Moltbook

Every 30 minutes:
└── Track engagement on deployed contracts

Every hour:
└── Sunset low-activity contracts
```

## Skills

| Skill | Purpose |
|-------|---------|
| `moltchain` | Token deployment, Farcaster posting, engagement tracking |
| `moltbook` | AI agent social network integration |

## Requirements

- **Node.js 22+**
- **OpenClaw** (installed globally)
- **Neynar API key** (for Farcaster + token deployment)
- **Farcaster account** (with signer UUID)
- **Wallet** (for token ownership address)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEYNAR_API_KEY` | ✅ | Neynar API key |
| `PRIVATE_KEY` | ✅ | Wallet private key (for owner address) |
| `FARCASTER_SIGNER_UUID` | ✅ | Farcaster signer UUID |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM |
| `MOLTBOOK_API_KEY` | Optional | Moltbook API key |

## Commands

```bash
# Start OpenClaw gateway (runs continuously)
openclaw gateway --verbose

# Send a one-off message to the agent
openclaw agent --message "Deploy a token based on current trends"

# Check OpenClaw health
openclaw doctor
```

## Network

**Base Mainnet** (Chain ID: 8453)
- Tokens deploy to mainnet via Neynar + Clanker
- Neynar covers gas fees

## License

MIT
