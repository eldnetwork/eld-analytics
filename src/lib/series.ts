import type { DiskSnapshot } from '../api/types'
import { sum } from './format'

export type SeriesPoint = {
  collected_at: string
  label: string
  tendermint_total: number
  abci_total: number
  abci_rocksdb: number
  abci_capacity: number
  cluster_total: number
  [key: `tm_${string}`]: number | string
  [key: `abci_${string}`]: number | string
}

export function isDiskSnapshot(value: unknown): value is DiskSnapshot {
  if (value == null || typeof value !== 'object') return false
  return typeof (value as DiskSnapshot).collected_at === 'string'
}

export function snapshotTotals(snapshot: DiskSnapshot | null | undefined) {
  const tendermintNodes = snapshot?.tendermint_nodes ?? []
  const abciApps = snapshot?.abci_apps ?? []
  const tendermint_total = sum(tendermintNodes.map((n) => n.data_dir_bytes))
  const abci_total = sum(abciApps.map((n) => n.data_dir_bytes))
  const abci_rocksdb = sum(abciApps.map((n) => n.rocksdb_bytes))
  const abci_capacity = sum(abciApps.map((n) => n.capacity_bytes))
  const volume_total =
    abciApps[0]?.volume_total_bytes ?? tendermintNodes[0]?.volume_total_bytes ?? 0
  const volume_available = Math.min(
    ...[
      ...abciApps.map((n) => n.volume_available_bytes),
      ...tendermintNodes.map((n) => n.volume_available_bytes),
    ].filter((n) => Number.isFinite(n)),
  )
  return {
    tendermint_total,
    abci_total,
    abci_rocksdb,
    abci_capacity,
    cluster_total: tendermint_total + abci_total,
    volume_total,
    volume_available: Number.isFinite(volume_available) ? volume_available : 0,
  }
}

export function toSeries(history: Array<DiskSnapshot | null | undefined>): SeriesPoint[] {
  return history
    .filter(isDiskSnapshot)
    .sort((a, b) => a.collected_at.localeCompare(b.collected_at))
    .map((snapshot) => {
      const totals = snapshotTotals(snapshot)
      const point: SeriesPoint = {
        collected_at: snapshot.collected_at,
        label: snapshot.collected_at,
        tendermint_total: totals.tendermint_total,
        abci_total: totals.abci_total,
        abci_rocksdb: totals.abci_rocksdb,
        abci_capacity: totals.abci_capacity,
        cluster_total: totals.cluster_total,
      }

      for (const node of snapshot.tendermint_nodes ?? []) {
        point[`tm_${node.node_id}`] = node.data_dir_bytes
      }
      for (const app of snapshot.abci_apps ?? []) {
        point[`abci_${app.node_id}`] = app.data_dir_bytes
      }

      return point
    })
}
