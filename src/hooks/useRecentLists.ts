const KEY = 'listgo_recent_lists'
const MAX = 20

export interface RecentListEntry {
  id: string
  title: string
  ownerUsername?: string
  updatedAt: number
  lastVisited: number
}

function load(): RecentListEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(entries: RecentListEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function getRecentLists(): RecentListEntry[] {
  return load()
}

export function recordRecentList(entry: Omit<RecentListEntry, 'lastVisited'>) {
  const entries = load().filter(e => e.id !== entry.id)
  entries.unshift({ ...entry, lastVisited: Date.now() })
  save(entries.slice(0, MAX))
}

export function removeRecentList(id: string) {
  save(load().filter(e => e.id !== id))
}
