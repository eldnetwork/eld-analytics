import { describe, expect, it } from 'vitest'
import type { DiskSnapshot } from '../api/types'
import { snapshotTotals, toSeries } from './series'

function snapshot(partial: Partial<DiskSnapshot> & { collected_at: string }): DiskSnapshot {
  return {
    tendermint_nodes: [],
    abci_apps: [],
    ...partial,
  }
}

describe('snapshotTotals', () => {
  it('sums tendermint and ABCI data dirs', () => {
    const totals = snapshotTotals(
      snapshot({
        collected_at: '2026-10-12T00:00:00Z',
        tendermint_nodes: [
          {
            node_id: 'tm-0',
            home_dir_bytes: 0,
            data_dir_bytes: 100,
            blockstore_db_bytes: 0,
            state_db_bytes: 0,
            cs_wal_bytes: 0,
            evidence_db_bytes: 0,
            tx_index_db_bytes: 0,
            volume_total_bytes: 1000,
            volume_available_bytes: 400,
            top_files: [],
          },
        ],
        abci_apps: [
          {
            node_id: 'abci-0',
            data_dir_bytes: 50,
            rocksdb_bytes: 30,
            capacity_bytes: 20,
            volume_total_bytes: 1000,
            volume_available_bytes: 350,
            top_files: [],
          },
        ],
      }),
    )

    expect(totals.tendermint_total).toBe(100)
    expect(totals.abci_total).toBe(50)
    expect(totals.abci_rocksdb).toBe(30)
    expect(totals.abci_capacity).toBe(20)
    expect(totals.cluster_total).toBe(150)
    expect(totals.volume_total).toBe(1000)
    expect(totals.volume_available).toBe(350)
  })
})

describe('toSeries', () => {
  it('sorts by collected_at and maps per-node keys', () => {
    const series = toSeries([
      snapshot({
        collected_at: '2026-10-12T01:00:00Z',
        tendermint_nodes: [
          {
            node_id: 'tm-0',
            home_dir_bytes: 0,
            data_dir_bytes: 20,
            blockstore_db_bytes: 0,
            state_db_bytes: 0,
            cs_wal_bytes: 0,
            evidence_db_bytes: 0,
            tx_index_db_bytes: 0,
            volume_total_bytes: 0,
            volume_available_bytes: 0,
            top_files: [],
          },
        ],
      }),
      snapshot({
        collected_at: '2026-10-12T00:00:00Z',
        abci_apps: [
          {
            node_id: 'abci-0',
            data_dir_bytes: 10,
            rocksdb_bytes: 0,
            capacity_bytes: 0,
            volume_total_bytes: 0,
            volume_available_bytes: 0,
            top_files: [],
          },
        ],
      }),
    ])

    expect(series).toHaveLength(2)
    expect(series[0]?.collected_at).toBe('2026-10-12T00:00:00Z')
    expect(series[0]?.['abci_abci-0']).toBe(10)
    expect(series[1]?.['tm_tm-0']).toBe(20)
  })
})
