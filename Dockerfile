FROM node:22-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
ENV HUSKY=0
RUN npm ci

# Copy source code
COPY . .

# Build-time env vars inlined into the client bundle.
# Pass them with `docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...`
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ARG VITE_IDEAM_APP_TOKEN

# Set Nitro preset for Node.js server
ENV NITRO_PRESET=node-server
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_IDEAM_APP_TOKEN=$VITE_IDEAM_APP_TOKEN

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server

# Copy built output
COPY --from=base /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
