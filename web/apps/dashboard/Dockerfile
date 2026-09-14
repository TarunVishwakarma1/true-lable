# syntax=docker/dockerfile:1
#
# Build context is the `web/` workspace root (turbo prune needs the whole
# monorepo graph to compute the subset this app actually depends on):
#   docker build -f apps/dashboard/Dockerfile -t <tag> .
#
# bun installs deps (fast, reads bun.lock) but Next's Turbopack build/server
# runs under Node — Bun's CommonJS interop with Next 16's compiled server
# chunks currently breaks `next build` (upstream Bun bug, not this app).

FROM node:24-slim AS base
RUN npm install --global bun@1.3.8 turbo@2.10.12

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune dashboard --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
# `bun install`'s postinstall runs `prisma generate`, which needs the schema
# FILE present (not just DATABASE_URL) — but out/json/ is package.json files
# only, by design, so a build can cache the install layer separately from
# source. out/full/ (copied wholesale in the builder stage below) has the
# real schema, but that's too late for this postinstall — so the schema
# alone comes in early, ahead of the source it's normally bundled with.
COPY --from=pruner /app/out/full/apps/dashboard/prisma ./apps/dashboard/prisma
# `prisma generate` only reads the schema's env("DATABASE_URL") reference —
# it never connects — but still errors if the var is unset. The real URL is
# injected at runtime instead.
ENV DATABASE_URL="postgresql://build:build@build:5432/build"
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ENV DATABASE_URL="postgresql://build:build@build:5432/build"
# NEXT_PUBLIC_* vars are inlined into the browser bundle at build time, not
# read at runtime — they have to arrive as build args, not a k8s ConfigMap.
# Not secrets: by definition anything NEXT_PUBLIC_ ships to every visitor.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_DOCS_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL
RUN turbo run build --filter=dashboard

FROM node:24-slim AS runtime
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/dashboard/server.js"]
