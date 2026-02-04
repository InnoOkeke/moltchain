# Moltchain Agent - Docker Image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY skills ./skills

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy remaining files
COPY openclaw.json .
COPY .openclaw ./.openclaw

# Start the agent
CMD ["npx", "openclaw", "start"]
