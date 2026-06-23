interface AppEnv {
  buildEnv?: string
  clusterId?: string
}

const runtime =
  (window as unknown as { __APP_ENV__?: AppEnv }).__APP_ENV__ ?? {}

/**
 * Deployment environment label shown in the TUI header (dev / staging / prod).
 * Injected at container startup into /config.js from the BUILD_ENV env var
 * (see docker-entrypoint.d/40-runtime-config.sh), so it's set per-deploy via
 * Helm without rebuilding the image. Falls back to "dev" for local work.
 */
export const buildEnv = runtime.buildEnv || 'dev'

/**
 * The cluster that served this page, injected at container startup into
 * /config.js from the CLUSTER_ID env (per-cluster Helm value). Drives the
 * ":system" / ":neofetch" "serving you" highlight and reflects the active origin
 * during a multi-cluster failover. Empty in local dev / unset deployments.
 */
export const servingCluster = runtime.clusterId || ''

/**
 * App version, baked in at build time from package.json (bumped per release by
 * semantic-release). Shown next to the build environment in the TUI header.
 */
export const appVersion = __APP_VERSION__
