export type TopFile = {
  relative_path: string
  size_bytes: number
}

export type CadoTypeCount = {
  cado_type: string
  count: number
}

export type CfSstBytes = {
  column_family: string
  sst_bytes: number
}

export type RocksdbInventory = {
  cado_type_counts: CadoTypeCount[]
  /** Primary indexed transaction rows; null when the inventory could not count. */
  indexed_transactions_count: number | null
  /** Primary indexed event rows; null when the inventory could not count. */
  indexed_events_count: number | null
  cf_sst_bytes: CfSstBytes[]
  pinboard_blob_cf_sst_bytes: number | null
  other_cf_sst_bytes: number | null
}

export type TendermintNode = {
  node_id: string
  home_dir_bytes: number
  data_dir_bytes: number
  blockstore_db_bytes: number
  state_db_bytes: number
  cs_wal_bytes: number
  evidence_db_bytes: number
  tx_index_db_bytes: number
  volume_total_bytes: number
  volume_available_bytes: number
  top_files: TopFile[]
}

export type AbciApp = {
  node_id: string
  data_dir_bytes: number
  rocksdb_bytes: number
  capacity_bytes: number
  volume_total_bytes: number
  volume_available_bytes: number
  top_files: TopFile[]
  rocksdb_inventory?: RocksdbInventory
}

export type DiskSnapshot = {
  collected_at: string
  /** Chain tip at sample time; null/undefined when the collector could not reach RPC. */
  block_height?: number | null
  tendermint_nodes?: TendermintNode[] | null
  abci_apps?: AbciApp[] | null
}

export type DiskHistory = DiskSnapshot[]
