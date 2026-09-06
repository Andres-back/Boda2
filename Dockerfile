# ============================================================
# Stage 1: install dependencies
# ============================================================
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: build Next.js and generate Prisma client
# ============================================================
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

RUN pnpm prisma:generate
RUN pnpm build

# ============================================================
# Stage 3: production runner
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# curl: healthcheck, postgresql-client: pg_isready, openssl: operational tooling.
RUN apk add --no-cache curl openssl postgresql-client

# The entrypoint runs versioned migrations and the idempotent seed.
RUN npm install -g prisma@5.22.0 tsx

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma

COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=4 \
    CMD curl --fail --silent --show-error --output /dev/null http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
