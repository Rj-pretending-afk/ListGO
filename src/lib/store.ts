import { create } from 'zustand'
import { db } from './db'
import { generateListId, generateModuleId, generateItemId } from './shortid'
import { getOwnerToken } from './ownerToken'
import { listApi } from './api'
import type { List, ListBackground, ListPermission, Module, TodoModule, VoteModule } from '../types/list.types'

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

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
      syncErrors.set(list.id, msg)
      console.error('[sync]', list.id, msg)
    }
  }, 800))
}

export type Theme = 'day' | 'dark' | 'light-pink' | 'dark-pink'

const THEMES: Theme[] = ['day', 'dark', 'light-pink', 'dark-pink']
const THEME_KEY = 'listgo_theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  const theme = stored && THEMES.includes(stored) ? stored : 'dark'
  document.documentElement.dataset.theme = theme
  return theme
}

function ts() {
  return Date.now()
}

interface AppStore {
  theme: Theme
  cycleTheme: () => void
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
  claimLists: (listIds: string[], newOwnerId: string) => Promise<void>
  importList: (list: List) => Promise<void>
  applyRemoteList: (list: List) => void
  resolveConflict: (listId: string, choice: 'local' | 'remote', remoteList: List) => void
  patchModuleVotes: (listId: string, moduleId: string, votes: Record<string, string[]>, version: number) => void
}

export const useAppStore = create<AppStore>((set, get) => {
  // Allow debouncedSync (module scope) to patch the version back into Zustand + DB
  _patchVersion = (listId, version) => {
    set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, version } : l) }))
    void db.lists.update(listId, { version })
  }

  return {
  theme: getInitialTheme(),

  cycleTheme: () => {
    set(s => {
      const next = THEMES[(THEMES.indexOf(s.theme) + 1) % THEMES.length]
      localStorage.setItem(THEME_KEY, next)
      document.documentElement.dataset.theme = next
      return { theme: next }
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
    if (list?.ownerId) {
      listApi.delete(id).catch(console.error)
    } else if (list?.ownerToken) {
      listApi.delete(id, list.ownerToken).catch(console.error)
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

  patchModuleVotes: (listId, moduleId, votes, version) => {
    set(s => ({
      lists: s.lists.map(l => {
        if (l.id !== listId) return l
        const modules = l.modules.map(m =>
          m.id === moduleId && m.type === 'vote' ? { ...m, votes } : m
        )
        return { ...l, modules, version }
      }),
    }))
    // Write to IndexedDB so a page reload doesn't restore the stale version
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
  }
})
