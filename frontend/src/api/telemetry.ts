// Client for the live cluster telemetry endpoint on the edge Worker.
// The Worker returns a fleet shape (one entry per cluster) so this is
// multi-cluster ready; today the fleet usually has a single cluster.

export interface ClusterSnapshot {
  cluster_id: string
  role: string
  stale: boolean
  updated_at: number
  cluster: {
    k8s_version: string
    talos_version: string
    uptime_seconds: number
    nodes_ready: number
    nodes_total: number
  }
  resources: {
    cpu_used_cores: number
    cpu_total_cores: number
    mem_used_bytes: number
    mem_total_bytes: number
    storage_used_bytes?: number
    storage_total_bytes?: number
  }
  workloads: { pods_running: number; pods_total: number; namespaces: number }
  argocd?: { apps_synced: number; apps_total: number; apps_healthy: number }
  nodes: { name: string; cpu_pct: number; mem_pct: number; ready: boolean }[]
}

export interface FleetRollup {
  clusters_total: number
  clusters_online: number
  nodes: number
  pods: number
}

export interface TelemetryResponse {
  generated_at: number
  clusters: ClusterSnapshot[]
  fleet: FleetRollup
}

/** Fetch the latest fleet telemetry. Returns null on any error so the section
 *  can degrade to an "unavailable" readout instead of throwing. */
export async function fetchTelemetry(signal?: AbortSignal): Promise<TelemetryResponse | null> {
  try {
    const res = await fetch('/api/telemetry', {
      signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as TelemetryResponse
  } catch {
    return null
  }
}
