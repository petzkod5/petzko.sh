# syntax=docker/dockerfile:1

# ─────────────────────────── Stage 1: build ──────────────────────────────────
# Alpine-based Node for a small, FOSS build image. Pinned to the current LTS.
FROM node:22-alpine AS build

WORKDIR /app

# Install deps from the lockfile first so this layer caches unless deps change.
# (Don't set NODE_ENV=production here — the build needs devDependencies.)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build the static site (Vite → /app/dist).
COPY . .
RUN npm run build

# ────────────────────────── Stage 2: runtime ─────────────────────────────────
# Hardened, non-root nginx (runs as uid 101 "nginx", listens on 8080, writes
# its pid/temp to writable paths — no root, no privileged ports). Alpine-based.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root

# Our server config (SPA fallback, gzip, cache + security headers, /healthz).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets only — nothing from the build toolchain ships in the image.
COPY --from=build /app/dist /usr/share/nginx/html

# Startup hook that writes /config.js from BUILD_ENV (see the script).
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh

# Make the script executable and let the non-root user (and any OpenShift
# arbitrary uid in group 0) rewrite config.js at startup.
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh \
    && chown -R 101:0 /usr/share/nginx/html \
    && chmod -R g=u /usr/share/nginx/html

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

# USER (101) and CMD are inherited from the unprivileged base image.
