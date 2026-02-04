# Moltchain Agent - Docker Image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/scripts/package.json ./packages/scripts/
COPY skills/moltchain/package.json ./skills/moltchain/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY packages ./packages
COPY skills ./skills
COPY openclaw.json .
COPY .openclaw ./.openclaw

# Ensure environment is non-interactive for npx/pnpm
ENV CI=true

# Start the agent
CMD ["pnpm", "exec", "openclaw", "start"]
