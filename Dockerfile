# --------------------------------------------------------
# 1️⃣ Build Stage
# --------------------------------------------------------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Install build dependencies
    RUN apk add --no-cache libc6-compat
    
    # Copy package files first (better caching)
    COPY package.json pnpm-lock.yaml* ./
    
    # Install pnpm
    RUN npm install -g pnpm
    
    # Install dependencies (full)
    RUN pnpm install
    
    # Copy all project files
    COPY . .
    
    # Build Next.js (standalone mode)
    RUN pnpm build
    
    # --------------------------------------------------------
    # 2️⃣ Production Runner (Small Image)
    # --------------------------------------------------------
    FROM node:20-alpine AS runner
    
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Install pnpm (only CLI)
    RUN npm install -g pnpm
    
    # Copy built standalone server
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/static ./.next/static
    
    # Expose frontend port
    EXPOSE 3000
    
    # Start Next.js standalone server
    CMD ["node", "server.js"]
    