interface AppEnv {
  buildEnv?: string
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
