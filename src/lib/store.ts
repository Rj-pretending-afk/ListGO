import { create } from 'zustand'
import { db } from './db'
import { generateListId, generateModuleId, generateItemId } from './shortid'
import { getOwnerToken } from './ownerToken'
import { listApi } from './api'
import type { List, ListBackground, ListPermission, Module, TodoModule, VoteModule } from '../types/list.types'

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()
let _cloudSyncing = false

// Tombstone: locally-deleted cloud list IDs — syncFromCloud must not re-add them
const TOMBSTONE_KEY = 'listgo_deleted_ids'
const deletedListIds = new Set<string>(JSON.parse(localStorage.getItem(TOMBSTONE_KEY) ?? '[]') as string[])
function addTombstone(id: string) {
  deletedListIds.add(id)
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify([...deletedListIds]))
}

// Confirmed-in-cloud: IDs returned by GET /lists at least once.
// Only these can be "remotely deleted" — newly created lists never confirmed yet are safe from removal.
const CONFIRMED_KEY = 'listgo_confirmed_ids'
const confirmedCloudIds = new Set<string>(JSON.parse(localStorage.getItem(CONFIRMED_KEY) ?? '[]') as string[])
function confirmInCloud(ids: string[]) {
  let changed = false
  for (const id of ids) { if (!confirmedCloudIds.has(id)) { confirmedCloudIds.add(id); changed = true } }
  if (changed) localStorage.setItem(CONFIRMED_KEY, JSON.stringify([...confirmedCloudIds]))
}

// Track per-list sync error so UI can surface it
const syncErrors = new Map<string, string>()
export const getSyncError = (id: string) => syncErrors.get(id)
export const clearSyncError = (id: string) => syncErrors.delete(id)
export const hasPendingSync = (id: string) => syncTimers.has(id)

// Patched by store init; allows debouncedSync to update version in Zustand+DB after a successful push
let _patchVersion: ((listId: string, version: number) => void) | null = null

function debouncedSync(list: List) {
  clearTimeout(syncTimers.get(list.id))
  syncTimers.set(list.id, setTimeout(async () => {
    syncTimers.delete(list.id)
    try {
      const result = await listApi.update(list)
      syncErrors.delete(list.id)
      if (result.version) _patchVersion?.(list.id, result.version)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'sync failed'
      // List not in D1 yet (initial create failed) — create it now
      if (msg.includes('Not found') || msg.includes('404')) {
        try {
          await listApi.create(list)
          syncErrors.delete(list.id)
        } catch (e2) {
          syncErrors.set(list.id, e2 instanceof Error ? e2.message : 'create failed')
        }
      } else {
        syncErrors.set(list.id, msg)
        console.error('[sync]', list.id, msg)
      }
    }
  }, 800))
}

export type StyleTheme = 'clay' | 'glass' | 'minimal' | 'brutal' | 'material' | 'bauhaus' | 'retro'
export type ColorMode = 'light' | 'dark'
export type Theme = `${StyleTheme}-${ColorMode}`

const VALID_THEMES = new Set<Theme>([
  'clay-light','clay-dark','glass-light','glass-dark','minimal-light','minimal-dark',
  'brutal-light','brutal-dark','material-light','material-dark','bauhaus-light','bauhaus-dark',
  'retro-light','retro-dark',
])

// Migrate pre-restructure theme names to new format
const THEME_MIGRATION: Record<string, Theme> = {
  'day': 'clay-light', 'dark': 'clay-dark', 'light-pink': 'clay-light', 'dark-pink': 'clay-dark',
  'glass': 'glass-light', 'minimal': 'minimal-light', 'brutal': 'brutal-light',
  'material': 'material-light', 'bauhaus': 'bauhaus-light', 'retro': 'retro-light',
}

export function parseTheme(t: string): Theme {
  if (VALID_THEMES.has(t as Theme)) return t as Theme
  return THEME_MIGRATION[t] ?? 'clay-light'
}

export function getStyle(theme: Theme): StyleTheme {
  return theme.slice(0, theme.lastIndexOf('-')) as StyleTheme
}

export function getMode(theme: Theme): ColorMode {
  return theme.endsWith('-dark') ? 'dark' : 'light'
}

const THEME_KEY = 'listgo_theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) ?? ''
  const theme = parseTheme(stored)
  document.documentElement.dataset.theme = theme
  return theme
}

function ts() {
  return Date.now()
}

interface AppStore {
  theme: Theme
  setTheme: (theme: string) => void
  setStyle: (style: StyleTheme) => void
  toggleMode: () => void
  timeFormat: 'relative' | 'absolute'
  toggleTimeFormat: () => void
  lists: List[]
  loaded: boolean
  init: () => Promise<void>
  createList: (title: string, ownerId?: string) => Promise<string>
  updateListTitle: (id: string, title: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addModule: (listId: string, type: Module['type']) => Promise<void>
  updateModule: (listId: string, module: Module) => void
  deleteModule: (listId: string, moduleId: string) => Promise<void>
  updateListBackground: (id: string, background: ListBackground) => Promise<void>
  reorderModules: (listId: string, fromIndex: number, toIndex: number) => void
  updateListPermission: (id: string, permission: ListPermission) => Promise<void>
  uploadToCloud: (id: string) => Promise<void>
  updateInvitedUsers: (id: string, usernames: string[]) => void
  claimLists: (listIds: string[], newOwnerId: string) => Promise<void>
  importList: (list: List) => Promise<void>
  applyRemoteList: (list: List) => void
  resolveConflict: (listId: string, choice: 'local' | 'remote', remoteList: List) => void
  patchModuleVotes: (listId: string, moduleId: string, votes: Record<string, string[]>, voterNames: Record<string, string>, version: number) => void
  syncFromCloud: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => {
  // Allow debouncedSync (module scope) to patch the version back into Zustand + DB
  _patchVersion = (listId, version) => {
    set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, version } : l) }))
    void db.lists.update(listId, { version })
  }

  return {
  theme: getInitialTheme(),

  setTheme: (themeStr) => {
    const theme = parseTheme(themeStr)
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },

  setStyle: (style) => {
    set(s => {
      const theme = `${style}-${getMode(s.theme)}` as Theme
      localStorage.setItem(THEME_KEY, theme)
      document.documentElement.dataset.theme = theme
      return { theme }
    })
  },

  toggleMode: () => {
    set(s => {
      const mode: ColorMode = getMode(s.theme) === 'light' ? 'dark' : 'light'
      const theme = `${getStyle(s.theme)}-${mode}` as Theme
      localStorage.setItem(THEME_KEY, theme)
      document.documentElement.dataset.theme = theme
      return { theme }
    })
  },

  timeFormat: 'relative' as const,
  toggleTimeFormat: () => set(s => ({ timeFormat: s.timeFormat === 'relative' ? 'absolute' : 'relative' })),

  lists: [],
  loaded: false,

  init: async () => {
    const lists = await db.lists.orderBy('updatedAt').reverse().toArray()
    set({ lists, loaded: true })
  },

  createList: async (title, ownerId) => {
    const id = generateListId()
    const t = ts()
    const list: List = {
      id, title,
      background: { type: 'color', value: '' },
      modules: [],
      permission: 'public',
      ownerId,
      ownerToken: ownerId ? undefined : getOwnerToken(),
      createdAt: t, updatedAt: t, lastAccessedAt: t,
      version: 1,
    }
    await db.lists.add(list)
    set(s => ({ lists: [list, ...s.lists] }))
    if (ownerId) listApi.create(list).catch(console.error)
    return id
  },

  updateListTitle: async (id, title) => {
    const t = ts()
    await db.lists.update(id, { title, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, title, updatedAt: t } : l) }))
    const next = get().lists.find(l => l.id === id)
    if (next?.ownerId) debouncedSync(next)
  },

  deleteList: async (id) => {
    const list = get().lists.find(l => l.id === id)
    await db.lists.delete(id)
    set(s => ({ lists: s.lists.filter(l => l.id !== id) }))
    if (list?.ownerId || list?.ownerToken) {
      // Record tombstone before attempting cloud delete so syncFromCloud won't re-add it
      if (list.ownerId) addTombstone(id)
      try {
        await listApi.delete(id, list.ownerToken)
      } catch (e) {
        // Cloud delete failed — tombstone already prevents re-sync, but log for visibility
        console.error('[delete]', id, e instanceof Error ? e.message : e)
      }
    }
  },

  addModule: async (listId, type) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const id = generateModuleId()
    const now = ts()
    let module: Module

    if (type === 'todo') {
      const m: TodoModule = { id, type: 'todo', items: [], createdAt: now, updatedAt: now }
      module = m
    } else if (type === 'vote') {
      const m: VoteModule = {
        id, type: 'vote',
        question: '',
        options: [
          { id: generateItemId(), text: '' },
          { id: generateItemId(), text: '' },
        ],
        multiSelect: false,
        anonymous: false,
        votes: {},
        createdAt: now,
        updatedAt: now,
      }
      module = m
    } else {
      module = { id, type: 'text', content: '', createdAt: now, updatedAt: now }
    }

    const t = now
    const modules = [...list.modules, module]
    const next = { ...list, modules, updatedAt: t }
    await db.lists.update(listId, { modules, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === listId ? next : l) }))
    if (next.ownerId) debouncedSync(next)
  },

  updateModule: (listId, updatedModule) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const t = ts()
    const stamped = { ...updatedModule, updatedAt: t }
    const modules = list.modules.map(m => m.id === updatedModule.id ? stamped : m)
    const next = { ...list, modules, updatedAt: t }
    // 先同步更新 Zustand（React 立即拿到正确值，不会在 IME 组合期间重置 DOM）
    set(s => ({ lists: s.lists.map(l => l.id === listId ? next : l) }))
    // 后台持久化，不阻塞 UI
    void db.lists.update(listId, { modules, updatedAt: t })
    if (next.ownerId) debouncedSync(next)
  },

  deleteModule: async (listId, moduleId) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const t = ts()
    const modules = list.modules.filter(m => m.id !== moduleId)
    const next = { ...list, modules, updatedAt: t }
    await db.lists.update(listId, { modules, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === listId ? next : l) }))
    if (next.ownerId) debouncedSync(next)
  },

  updateListBackground: async (id, background) => {
    const t = ts()
    await db.lists.update(id, { background, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, background, updatedAt: t } : l) }))
    const next = get().lists.find(l => l.id === id)
    if (next?.ownerId) debouncedSync(next)
  },

  reorderModules: (listId, fromIndex, toIndex) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return
    const modules = [...list.modules]
    const [moved] = modules.splice(fromIndex, 1)
    modules.splice(toIndex, 0, moved)
    const t = ts()
    const next = { ...list, modules, updatedAt: t }
    set(s => ({ lists: s.lists.map(l => l.id === listId ? next : l) }))
    void db.lists.update(listId, { modules, updatedAt: t })
    if (next.ownerId) debouncedSync(next)
  },

  updateListPermission: async (id, permission) => {
    await db.lists.update(id, { permission } as Partial<List>)
    set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, permission } : l) }))
    const next = get().lists.find(l => l.id === id)
    if (next?.ownerId) debouncedSync({ ...next, permission })
  },

  uploadToCloud: async (id) => {
    const list = get().lists.find(l => l.id === id)
    if (!list) return
    await listApi.create(list)
  },

  updateInvitedUsers: (id, usernames) => {
    const t = ts()
    set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, invitedUsernames: usernames, updatedAt: t } : l) }))
    void db.lists.update(id, { invitedUsernames: usernames, updatedAt: t })
    const next = get().lists.find(l => l.id === id)
    if (next?.ownerId) debouncedSync(next)
  },

  importList: async (list) => {
    const existing = get().lists.find(l => l.id === list.id)
    if (!existing) {
      await db.lists.add(list)
      set(s => ({ lists: [list, ...s.lists] }))
    }
  },

  claimLists: async (listIds, newOwnerId) => {
    const t = ts()
    await Promise.all(
      listIds.map(id => db.lists.update(id, { ownerId: newOwnerId, ownerToken: undefined, updatedAt: t }))
    )
    set(s => ({
      lists: s.lists.map(l =>
        listIds.includes(l.id)
          ? { ...l, ownerId: newOwnerId, ownerToken: undefined, updatedAt: t }
          : l
      ),
    }))
  },

  applyRemoteList: (list) => {
    set(s => ({ lists: s.lists.map(l => l.id === list.id ? list : l) }))
    void db.lists.put(list)
  },

  patchModuleVotes: (listId, moduleId, votes, voterNames, version) => {
    set(s => ({
      lists: s.lists.map(l => {
        if (l.id !== listId) return l
        const modules = l.modules.map(m =>
          m.id === moduleId && m.type === 'vote' ? { ...m, votes, voterNames } : m
        )
        return { ...l, modules, version }
      }),
    }))
    const list = get().lists.find(l => l.id === listId)
    if (list) void db.lists.put(list)
  },

  resolveConflict: (listId, choice, remoteList) => {
    if (choice === 'remote') {
      clearTimeout(syncTimers.get(listId))
      syncTimers.delete(listId)
      set(s => ({ lists: s.lists.map(l => l.id === listId ? remoteList : l) }))
      void db.lists.put(remoteList)
    } else {
      // Local wins: bump our version to remote's so the next debounce sync passes optimistic lock
      const list = get().lists.find(l => l.id === listId)
      if (!list) return
      const updated = { ...list, version: remoteList.version }
      set(s => ({ lists: s.lists.map(l => l.id === listId ? updated : l) }))
      void db.lists.update(listId, { version: remoteList.version })
      if (updated.ownerId) debouncedSync(updated)
    }
  },

  syncFromCloud: async () => {
    if (_cloudSyncing) return
    _cloudSyncing = true
    try {
      const remote = await listApi.fetchOwned()
      const remoteIds = new Set(remote.map(r => r.id))
      const local = get().lists

      // Mark all returned IDs as confirmed-in-cloud
      confirmInCloud(remote.map(r => r.id))

      // Detect remotely-deleted lists:
      // local list has ownerId + was confirmed in D1 before + NOT in remote now + not deleted by this device + no pending edit
      const toRemove = local.filter(l =>
        l.ownerId &&
        confirmedCloudIds.has(l.id) &&
        !remoteIds.has(l.id) &&
        !deletedListIds.has(l.id) &&
        !hasPendingSync(l.id)
      )

      const toAdd: List[] = []
      const toUpdate: List[] = []
      for (const r of remote) {
        const l = local.find(x => x.id === r.id)
        if (!l) {
          if (!deletedListIds.has(r.id)) toAdd.push(r)
        } else if (r.version > l.version && !hasPendingSync(r.id)) {
          toUpdate.push(r)
        }
      }

      if (!toAdd.length && !toUpdate.length && !toRemove.length) return

      await Promise.all([
        ...[...toAdd, ...toUpdate].map(l => db.lists.put(l)),
        ...toRemove.map(l => db.lists.delete(l.id)),
      ])

      set(s => {
        const removeIds = new Set(toRemove.map(l => l.id))
        const map = new Map(s.lists.filter(l => !removeIds.has(l.id)).map(l => [l.id, l]))
        for (const r of toUpdate) map.set(r.id, r)
        for (const r of toAdd) map.set(r.id, r)
        const result = Array.from(map.values())
        result.sort((a, b) => b.updatedAt - a.updatedAt)
        return { lists: result }
      })
    } catch {
      // silently ignore — user may be offline or token expired
    } finally {
      _cloudSyncing = false
    }
  },
  }
})
