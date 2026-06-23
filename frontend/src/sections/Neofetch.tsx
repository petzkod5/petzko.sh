import { useTelemetry } from '@/state/useTelemetry'
import type { ClusterSnapshot } from '@/api/telemetry'
import { servingCluster } from '@/config'
import styles from './Neofetch.module.css'

// Rivendell — mountains mirrored in the valley water, under the evening star.
const LOGO = String.raw`
         *
        /\
       /  \      /\
      /    \    /  \
     /      \  /    \
    /________\/______\
    ~~~~~~~~~~~~~~~~~~~
    \________/\______/
     \      /  \    /
      \    /    \  /
       \  /      \/
        \/
`

function pct(used: number, total: number): number {
  return total > 0 ? Math.round((used / total) * 100) : 0
}
function gib(bytes: number): number {
  return Math.round(bytes / 1024 ** 3)
}
function uptime(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.fact}>
      <span className={styles.key}>{k}</span>
      <span className={styles.val}>{v}</span>
    </div>
  )
}

const SWATCHES = [
  'var(--color-highlight)',
  'var(--color-accent-cyan)',
  'var(--color-accent-amber)',
  'var(--color-text-body)',
  'var(--color-text-secondary)',
  'var(--color-highlight)',
]

function Facts({ c }: { c: ClusterSnapshot }) {
  const cpu = pct(c.resources.cpu_used_cores, c.resources.cpu_total_cores)
  const mem = pct(c.resources.mem_used_bytes, c.resources.mem_total_bytes)
  return (
    <div className={styles.facts}>
      <div className={styles.title}>
        <span className={styles.user}>petzko</span>@<span className={styles.host}>{c.cluster_id}</span>
        {c.cluster_id === servingCluster && <span className={styles.serving}>(serving you)</span>}
        {c.stale && <span className={styles.stale}>(stale)</span>}
      </div>
      <div className={styles.sep} aria-hidden="true" />
      <Fact k="OS" v={`Talos ${c.cluster.talos_version || '—'}`} />
      <Fact k="Kernel" v={`k8s ${c.cluster.k8s_version || '—'}`} />
      <Fact k="Uptime" v={uptime(c.cluster.uptime_seconds)} />
      <Fact k="Role" v={c.role} />
      <Fact k="Nodes" v={`${c.cluster.nodes_ready}/${c.cluster.nodes_total} ready`} />
      <Fact
        k="CPU"
        v={`${c.resources.cpu_used_cores.toFixed(1)}/${Math.round(c.resources.cpu_total_cores)} cores (${cpu}%)`}
      />
      <Fact
        k="Memory"
        v={`${gib(c.resources.mem_used_bytes)}/${gib(c.resources.mem_total_bytes)} GiB (${mem}%)`}
      />
      <Fact k="Pods" v={`${c.workloads.pods_running}/${c.workloads.pods_total}`} />
      {c.services && c.services.length > 0 && <Fact k="Services" v={String(c.services.length)} />}
      {c.argocd && <Fact k="ArgoCD" v={`${c.argocd.apps_synced}/${c.argocd.apps_total} synced`} />}
      <div className={styles.swatches} aria-hidden="true">
        {SWATCHES.map((color, i) => (
          <span key={i} className={styles.sw} style={{ background: color }} />
        ))}
      </div>
    </div>
  )
}

/**
 * `:neofetch` — the classic system summary: an ASCII Rivendell logo beside a
 * two-column readout of the cluster, sourced from the live telemetry feed.
 * Degrades to an "unavailable" note when telemetry isn't reachable.
 */
export function Neofetch() {
  const { data, loading } = useTelemetry()
  const clusters = data?.clusters ?? []
  const c = clusters.find((x) => x.role === 'primary') ?? clusters[0] ?? null

  return (
    <div className={styles.wrap}>
      <pre className={styles.logo}>{LOGO}</pre>
      {loading && !c ? (
        <p className={styles.muted}>querying fleet…</p>
      ) : c ? (
        <Facts c={c} />
      ) : (
        <p className={styles.muted}>
          telemetry unavailable — the fleet collector isn’t reporting (expected on
          staging / local without the Worker).
        </p>
      )}
    </div>
  )
}

export default Neofetch
