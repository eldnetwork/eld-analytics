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

export function snapshotTotals(snapshot: DiskSnapshot) {
  const tendermint_total = sum(snapshot.tendermint_nodes.map((n) => n.data_dir_bytes))
  const abci_total = sum(snapshot.abci_apps.map((n) => n.data_dir_bytes))
  const abci_rocksdb = sum(snapshot.abci_apps.map((n) => n.rocksdb_bytes))
  const abci_capacity = sum(snapshot.abci_apps.map((n) => n.capacity_bytes))
  const volume_total = snapshot.abci_apps[0]?.volume_total_bytes
    ?? snapshot.tendermint_nodes[0]?.volume_total_bytes
    ?? 0
  const volume_available = Math.min(
    ...[
      ...snapshot.abci_apps.map((n) => n.volume_available_bytes),
      ...snapshot.tendermint_nodes.map((n) => n.volume_available_bytes),
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

export function toSeries(history: DiskSnapshot[]): SeriesPoint[] {
  return [...history]
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

      for (const node of snapshot.tendermint_nodes) {
        point[`tm_${node.node_id}`] = node.data_dir_bytes
      }
      for (const app of snapshot.abci_apps) {
        point[`abci_${app.node_id}`] = app.data_dir_bytes
      }

      return point
    })
}
