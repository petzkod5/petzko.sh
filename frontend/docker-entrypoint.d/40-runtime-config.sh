#!/bin/sh
# Regenerate the SPA's runtime config (window.__APP_ENV__) from environment
# variables at container startup. Lets the deployment environment label be set
# per-deploy via BUILD_ENV (e.g. from the Helm chart) without rebuilding.
#
# Runs automatically: nginx's entrypoint executes /docker-entrypoint.d/*.sh.
set -eu

: "${BUILD_ENV:=prod}"
conf="/usr/share/nginx/html/config.js"

printf 'window.__APP_ENV__ = { buildEnv: "%s" };\n' "$BUILD_ENV" > "$conf"
echo "runtime-config: buildEnv=${BUILD_ENV}"
