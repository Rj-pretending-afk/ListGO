import { create } from 'zustand'
import { db } from './db'
import { generateListId, generateModuleId, generateItemId } from './shortid'
import { getOwnerToken } from './ownerToken'
import { listApi } from './api'
import type { List, ListBackground, Module, TodoModule, VoteModule } from '../types/list.types'

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debouncedSync(list: List) {
  clearTimeout(syncTimers.get(list.id))
  syncTimers.set(list.id, setTimeout(() => {
    syncTimers.delete(list.id)
    listApi.update(list).catch(console.error)
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
  uploadToCloud: (id: string) => Promise<void>
  claimLists: (listIds: string[], newOwnerId: string) => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
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

  uploadToCloud: async (id) => {
    const list = get().lists.find(l => l.id === id)
    if (!list) return
    await listApi.create(list)
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
}))
