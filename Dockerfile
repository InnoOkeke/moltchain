# Moltchain Agent - Docker Image
FROM node:22-slim

# Prepare workspace
WORKDIR /app

# Install pnpm and essential build tools
RUN apt-get update && apt-get install -y python3 make g++ && \
    npm install -g pnpm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/scripts/package.json ./packages/scripts/
COPY skills/moltchain/package.json ./skills/moltchain/

# Install dependencies (recursive)
RUN pnpm install --no-frozen-lockfile

# Copy application source
COPY packages ./packages
COPY skills ./skills
COPY openclaw.json .
COPY .openclaw ./.openclaw

# Build the project to reduce runtime memory overhead
RUN pnpm build

# Debug: verify environment
RUN node --version && pnpm --version

# Autonomous agent boot
ENV CI=true
CMD ["pnpm", "start"]
