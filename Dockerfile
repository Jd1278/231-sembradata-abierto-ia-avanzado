# ============================================================
# SembraData - Multi-Stage Production Dockerfile
# Runtime: Node.js 22 Alpine (Nitro SSR node-server preset)
# ============================================================

# ------------------------------------------------------------
# Stage 1: Build Dependencies & Application
# ------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies if required for node-gyp
RUN apk add --no-cache libc6-compat

# Copy package manifests for reproducible installation
COPY package.json package-lock.json ./

# Install clean dependencies using the lockfile
ENV HUSKY=0
RUN npm ci

# Copy source code (respecting .dockerignore)
COPY . .

# Build-time public environment arguments (inlined by Vite into client bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ARG VITE_IDEAM_APP_TOKEN

ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_IDEAM_APP_TOKEN=$VITE_IDEAM_APP_TOKEN

# Compile TypeScript and build Nitro SSR bundle (.output/)
RUN npm run build

# ------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Security: Run as unprivileged non-root user
USER node

# Copy compiled Nitro server output and static assets from builder stage
COPY --chown=node:node --from=builder /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
