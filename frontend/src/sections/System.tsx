import { useEffect, useState, type ReactNode } from 'react'
import { useTelemetry } from '@/state/useTelemetry'
import type { ClusterSnapshot } from '@/api/telemetry'
import { servingCluster } from '@/config'
import styles from './System.module.css'

type Tone = 'ok' | 'warn' | 'danger'

// ── formatting helpers ──
const GIB = 1024 ** 3
const TIB = 1024 ** 4
function pct(used: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0
}
function fmtBytes(b: number): string {
  if (b >= TIB) return `${(b / TIB).toFixed(2)} TiB`
  return `${Math.round(b / GIB)} GiB`
}
function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
function uptime(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}d`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ── primitives ──
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.block}>
      <div className={styles.sectionLabel}>
        <span>{label}</span>
        <span className={styles.rule} aria-hidden="true" />
      </div>
      {children}
    </section>
  )
}

function Bar({ value, tone = 'ok', segments = 28 }: { value: number; tone?: Tone; segments?: number }) {
  const p = Math.max(0, Math.min(100, value))
  const filled = Math.round((p / 100) * segments)
  return (
    <div className={styles.bar} aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={`${styles.seg} ${i < filled ? styles[tone] : ''}`} />
      ))}
    </div>
  )
}

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>
}

function Panel({
  label,
  right,
  badge,
  big,
  unit,
  sub,
  bar,
}: {
  label: string
  right?: ReactNode
  badge?: ReactNode
  big: ReactNode
  unit?: string
  sub?: ReactNode
  bar: ReactNode
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelLabel}>{label}</span>
        {right && <span className={styles.panelRight}>{right}</span>}
        {badge}
      </div>
      <div className={styles.big}>
        {big}
        {unit && <span className={styles.bigUnit}>{unit}</span>}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {bar}
    </div>
  )
}

// ── the dashboard for one cluster ──
function ClusterView({ c }: { c: ClusterSnapshot }) {
  const cpu = pct(c.resources.cpu_used_cores, c.resources.cpu_total_cores)
  const mem = pct(c.resources.mem_used_bytes, c.resources.mem_total_bytes)

  const notRunning = Math.max(0, c.workloads.pods_total - c.workloads.pods_running)
  const podBadge: Tone = notRunning === 0 ? 'ok' : notRunning > 2 ? 'danger' : 'warn'

  const hasStorage =
    typeof c.resources.storage_total_bytes === 'number' && c.resources.storage_total_bytes > 0
  const stUsed = c.resources.storage_used_bytes ?? 0
  const stTotal = c.resources.storage_total_bytes ?? 0
  const stPct = pct(stUsed, stTotal)

  const ac = c.argocd
  const drift = ac ? Math.max(0, ac.apps_total - ac.apps_synced) : 0

  return (
    <>
      <Section label="COMPUTE">
        <div className={styles.grid2}>
          <Panel
            label="CPU"
            right={`${c.resources.cpu_used_cores.toFixed(1)} / ${Math.round(
              c.resources.cpu_total_cores,
            )} cores`}
            big={Math.round(cpu)}
            unit="%"
            bar={<Bar value={cpu} segments={32} />}
          />
          <Panel
            label="MEMORY"
            right={`${fmtBytes(c.resources.mem_used_bytes)} / ${fmtBytes(
              c.resources.mem_total_bytes,
            )}`}
            big={Math.round(mem)}
            unit="%"
            bar={<Bar value={mem} segments={32} />}
          />
        </div>
      </Section>

      <Section label="RESOURCES">
        <div className={styles.grid3}>
          <Panel
            label="PODS"
            badge={
              <Badge tone={podBadge}>
                {notRunning === 0 ? 'all ready' : `${notRunning} not ready`}
              </Badge>
            }
            big={c.workloads.pods_running}
            unit={`/ ${c.workloads.pods_total}`}
            sub={`${c.workloads.namespaces} namespaces`}
            bar={<Bar value={pct(c.workloads.pods_running, c.workloads.pods_total)} tone={podBadge} segments={20} />}
          />

          {ac && (
            <Panel
              label="ARGOCD"
              badge={<Badge tone={drift === 0 ? 'ok' : 'warn'}>{drift === 0 ? 'synced' : `${drift} drift`}</Badge>}
              big={ac.apps_synced}
              unit={`/ ${ac.apps_total} apps`}
              sub={`${ac.apps_healthy} healthy`}
              bar={<Bar value={pct(ac.apps_synced, ac.apps_total)} tone={drift === 0 ? 'ok' : 'warn'} segments={20} />}
            />
          )}

          {hasStorage && (
            <Panel
              label="LONGHORN"
              badge={<Badge tone={stPct > 90 ? 'danger' : 'ok'}>{stPct > 90 ? 'low space' : 'healthy'}</Badge>}
              big={fmtBytes(stTotal - stUsed).split(' ')[0]}
              unit={`${fmtBytes(stTotal - stUsed).split(' ')[1]} free`}
              sub={`of ${fmtBytes(stTotal)} · ${Math.round(stPct)}% used`}
              bar={<Bar value={stPct} tone={stPct > 90 ? 'danger' : 'ok'} segments={20} />}
            />
          )}
        </div>
      </Section>

      {c.nodes.length > 0 && (
        <Section label="NODES">
          <div className={styles.nodes}>
            {c.nodes.map((n) => (
              <div className={styles.node} key={n.name}>
                <span className={n.ready ? styles.nodeReady : styles.nodeDown}>
                  {n.ready ? '●' : '○'}
                </span>
                <span className={styles.nodeName}>{n.name}</span>
                <span className={styles.nodeMetric}>
                  <span className={styles.nodeMetricLabel}>cpu</span>
                  <Bar value={n.cpu_pct} segments={12} />
                  <span className={styles.nodeMetricVal}>{n.cpu_pct}%</span>
                </span>
                <span className={styles.nodeMetric}>
                  <span className={styles.nodeMetricLabel}>mem</span>
                  <Bar value={n.mem_pct} segments={12} />
                  <span className={styles.nodeMetricVal}>{n.mem_pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {c.services && c.services.length > 0 && (
        <Section label={`SERVICES [${c.services.length}]`}>
          <div className={styles.services}>
            {c.services.map((name) => (
              <span className={styles.service} key={name}>
                <span className={styles.serviceMark}>▸</span>
                {name}
              </span>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

export function System() {
  const { data, loading, error } = useTelemetry()
  const [now, setNow] = useState(() => Date.now())
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const clusters = data?.clusters ?? []
  // Default to the cluster actually serving this page, then the primary, then any.
  const active =
    clusters.find((c) => c.cluster_id === selected) ??
    clusters.find((c) => c.cluster_id === servingCluster) ??
    clusters.find((c) => c.role === 'primary') ??
    clusters[0] ??
    null
  // The serving cluster is reporting telemetry, so we can highlight its card.
  const servingInFleet = clusters.some((c) => c.cluster_id === servingCluster)

  return (
    <div className={styles.system}>
      <div className={styles.panelWrap}>
        <div className={styles.topbar}>
          <span className={styles.title}>SYSTEM</span>
          {active && !active.stale && (
            <span className={styles.live}>
              ● live · updated {ago(active.updated_at, now)} ago
            </span>
          )}
        </div>

        {loading && <p className={styles.muted}>querying fleet…</p>}

        {!loading && (error || clusters.length === 0) && (
          <p className={styles.muted}>
            telemetry unavailable — the fleet collector isn’t reporting (expected on
            staging / local without the Worker).
          </p>
        )}

        {active && (
          <>
            <div className={styles.clusters}>
              <span className={styles.clustersLabel}>CLUSTERS[{clusters.length}]</span>
              {clusters.map((c) => (
                <button
                  key={c.cluster_id}
                  type="button"
                  className={`${styles.chip} ${c.cluster_id === active.cluster_id ? styles.chipActive : ''}`}
                  onClick={() => setSelected(c.cluster_id)}
                >
                  <span className={c.stale ? styles.chipDotStale : styles.chipDot} aria-hidden="true" />
                  {c.cluster_id}
                  {c.cluster_id === servingCluster ? (
                    <span className={styles.chipServing}>serving you</span>
                  ) : (
                    <span className={c.stale ? styles.chipStatusStale : styles.chipStatus}>
                      {c.stale ? 'offline' : 'connected'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {servingCluster && !servingInFleet && (
              <div className={styles.servingNote}>● serving you: {servingCluster}</div>
            )}

            <div className={styles.head}>
              <span className={active.stale ? styles.headDotStale : styles.headDot} aria-hidden="true" />
              <span className={styles.headName}>{active.cluster_id}</span>
              <span className={styles.headRole}>{active.role}</span>
              {active.cluster_id === servingCluster && (
                <span className={styles.headServing}>● serving you</span>
              )}
            </div>
            <div className={styles.meta}>
              talos {active.cluster.talos_version || '—'} · k8s {active.cluster.k8s_version || '—'} ·{' '}
              {active.cluster.nodes_ready}/{active.cluster.nodes_total} nodes · up{' '}
              {uptime(active.cluster.uptime_seconds)}
            </div>

            <ClusterView c={active} />
          </>
        )}
      </div>
    </div>
  )
}

export default System
