import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DiskSnapshot } from '../api/types'
import { formatBytes, formatShortTime, formatTime, sum } from '../lib/format'
import { snapshotTotals, toSeries } from '../lib/series'

type Props = {
  latest: DiskSnapshot
  history: DiskSnapshot[]
}

const COLORS = {
  tendermint: '#62d58b',
  abci: '#ff7a18',
  cluster: '#8eb2ff',
  grid: 'var(--lh-border)',
  tick: 'var(--lh-faint)',
  muted: 'var(--lh-muted)',
}

function BytesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__time">{formatTime(label)}</div>
      <ul>
        {payload.map((entry) => (
          <li key={entry.name}>
            <span style={{ background: entry.color }} />
            {entry.name}: {formatBytes(entry.value ?? 0)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DiskWidget({ latest, history }: Props) {
  const series = toSeries(history.length ? history : [latest])
  const totals = snapshotTotals(latest)
  const volumeUsedPct =
    totals.volume_total > 0
      ? ((totals.volume_total - totals.volume_available) / totals.volume_total) * 100
      : 0
  const tmTotals = {
    data: sum(latest.tendermint_nodes.map((n) => n.data_dir_bytes)),
    txIndex: sum(latest.tendermint_nodes.map((n) => n.tx_index_db_bytes)),
    evidence: sum(latest.tendermint_nodes.map((n) => n.evidence_db_bytes)),
  }
  const abciTotals = {
    data: sum(latest.abci_apps.map((n) => n.data_dir_bytes)),
    rocksdb: sum(latest.abci_apps.map((n) => n.rocksdb_bytes)),
    capacity: sum(latest.abci_apps.map((n) => n.capacity_bytes)),
    indexedTx: sum(
      latest.abci_apps.map((n) => n.rocksdb_inventory?.indexed_transactions_count ?? 0),
    ),
    indexedEvents: sum(latest.abci_apps.map((n) => n.rocksdb_inventory?.indexed_events_count ?? 0)),
  }

  return (
    <section className="disk-widget">
      <header className="disk-widget__header">
        <div>
          <p className="eyebrow">Disk analytics</p>
          <h2>Cluster storage</h2>
        </div>
        <div className="disk-widget__meta">
          <span>Latest sample</span>
          <strong>{formatTime(latest.collected_at)}</strong>
          {latest.block_height != null ? (
            <>
              <span>Block height</span>
              <strong>{latest.block_height.toLocaleString()}</strong>
            </>
          ) : null}
        </div>
      </header>

      <div className="stat-strip">
        <div className="stat">
          <span>Cluster data</span>
          <strong>{formatBytes(totals.cluster_total)}</strong>
        </div>
        <div className="stat">
          <span>Tendermint</span>
          <strong>{formatBytes(totals.tendermint_total)}</strong>
        </div>
        <div className="stat">
          <span>ABCI apps</span>
          <strong>{formatBytes(totals.abci_total)}</strong>
        </div>
        <div className="stat">
          <span>Volume free</span>
          <strong>{formatBytes(totals.volume_available)}</strong>
          <em>{volumeUsedPct.toFixed(1)}% used</em>
        </div>
      </div>

      <div className="chart-panel">
        <div className="chart-panel__title">
          <h3>Disk over time</h3>
          <p>
            {series.length === 1
              ? 'Only one sample so far — the line will fill in as history grows.'
              : `${series.length} samples from /analytics/disk/history`}
          </p>
        </div>
        <div className="chart-panel__body">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="collected_at"
                tickFormatter={formatShortTime}
                tick={{ fill: COLORS.tick, fontSize: 11, fontFamily: 'IoskeleyMono, monospace' }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v: number) => formatBytes(v, 0)}
                tick={{ fill: COLORS.tick, fontSize: 11, fontFamily: 'IoskeleyMono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<BytesTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="plainline"
                wrapperStyle={{
                  fontSize: 11,
                  color: COLORS.muted,
                  fontFamily: 'IoskeleyMono, monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              />
              <Area
                type="monotone"
                dataKey="abci_total"
                name="ABCI data"
                stroke={COLORS.abci}
                fill={COLORS.abci}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="tendermint_total"
                name="Tendermint data"
                stroke={COLORS.tendermint}
                fill={COLORS.tendermint}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="cluster_total"
                name="Cluster total"
                stroke={COLORS.cluster}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: series.length < 3 ? 4 : 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="latest-grid">
        <div className="panel">
          <h3>Tendermint nodes</h3>
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Data</th>
                <th>Tx index</th>
                <th>Evidence</th>
                <th>Top file</th>
              </tr>
            </thead>
            <tbody>
              {latest.tendermint_nodes.map((node) => (
                <tr key={node.node_id}>
                  <td>{node.node_id}</td>
                  <td>{formatBytes(node.data_dir_bytes)}</td>
                  <td>{formatBytes(node.tx_index_db_bytes)}</td>
                  <td>{formatBytes(node.evidence_db_bytes)}</td>
                  <td className="path">
                    {node.top_files[0]
                      ? `${node.top_files[0].relative_path} (${formatBytes(node.top_files[0].size_bytes)})`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Total</td>
                <td>{formatBytes(tmTotals.data)}</td>
                <td>{formatBytes(tmTotals.txIndex)}</td>
                <td>{formatBytes(tmTotals.evidence)}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="panel">
          <h3>ABCI apps</h3>
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Data</th>
                <th>RocksDB</th>
                <th>Capacity</th>
                <th>Indexed tx / events</th>
              </tr>
            </thead>
            <tbody>
              {latest.abci_apps.map((app) => (
                <tr key={app.node_id}>
                  <td>{app.node_id}</td>
                  <td>{formatBytes(app.data_dir_bytes)}</td>
                  <td>{formatBytes(app.rocksdb_bytes)}</td>
                  <td>{formatBytes(app.capacity_bytes)}</td>
                  <td>
                    {app.rocksdb_inventory
                      ? `${app.rocksdb_inventory.indexed_transactions_count} / ${app.rocksdb_inventory.indexed_events_count}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td>Total</td>
                <td>{formatBytes(abciTotals.data)}</td>
                <td>{formatBytes(abciTotals.rocksdb)}</td>
                <td>{formatBytes(abciTotals.capacity)}</td>
                <td>
                  {abciTotals.indexedTx} / {abciTotals.indexedEvents}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="cado-grid">
        {latest.abci_apps.map((app) => {
          const counts = (app.rocksdb_inventory?.cado_type_counts ?? []).filter(
            (row) => row.count > 0,
          )
          return (
            <div className="panel" key={app.node_id}>
              <h3>Cado inventory (node {app.node_id})</h3>
              {counts.length === 0 ? (
                <p className="panel-empty">No counted types</p>
              ) : (
                <ul className="pill-list pill-list--stack">
                  {counts.map((row) => (
                    <li key={row.cado_type}>
                      <span>{row.cado_type}</span>
                      <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="panel panel--full">
        <h3>Largest ABCI files (node 1)</h3>
        <ul className="file-list">
          {(latest.abci_apps[0]?.top_files ?? []).map((file) => (
            <li key={file.relative_path}>
              <code>{file.relative_path}</code>
              <span>{formatBytes(file.size_bytes)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
