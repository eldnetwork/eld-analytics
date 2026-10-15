import type { DiskHistory, DiskSnapshot } from './types'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`)
  if (!response.ok) {
    throw new Error(`${path} failed (${response.status})`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

export function fetchHealth(): Promise<unknown> {
  return getJson('/health')
}

export function fetchLatestDisk(): Promise<DiskSnapshot | null> {
  return getJson('/analytics/disk/latest')
}

export function fetchDiskHistory(limit = 24): Promise<DiskHistory | null> {
  return getJson(`/analytics/disk/history?limit=${limit}`)
}
