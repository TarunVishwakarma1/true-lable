# syntax=docker/dockerfile:1
#
# Build context is the `web/` workspace root (turbo prune needs the whole
# monorepo graph to compute the subset this app actually depends on):
#   docker build -f apps/docs/Dockerfile -t <tag> .
#
# bun installs deps (fast, reads bun.lock) but Next's Turbopack build/server
# runs under Node — Bun's CommonJS interop with Next 16's compiled server
# chunks currently breaks `next build` (upstream Bun bug, not this app).

FROM node:24-slim AS base
RUN npm install --global bun@1.3.8 turbo@2.10.12

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune docs --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=docs

FROM node:24-slim AS runtime
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/docs/public ./apps/docs/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/docs/server.js"]
