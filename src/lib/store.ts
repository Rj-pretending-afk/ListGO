import { create } from 'zustand'
import { db } from './db'
import { generateListId, generateModuleId, generateItemId } from './shortid'
import type { List, Module, TodoModule, VoteModule } from '../types/list.types'

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
  lists: List[]
  loaded: boolean
  init: () => Promise<void>
  createList: (title: string) => Promise<string>
  updateListTitle: (id: string, title: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addModule: (listId: string, type: Module['type']) => Promise<void>
  updateModule: (listId: string, module: Module) => Promise<void>
  deleteModule: (listId: string, moduleId: string) => Promise<void>
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

  lists: [],
  loaded: false,

  init: async () => {
    const lists = await db.lists.orderBy('updatedAt').reverse().toArray()
    set({ lists, loaded: true })
  },

  createList: async (title) => {
    const id = generateListId()
    const t = ts()
    const list: List = {
      id, title,
      background: { type: 'color', value: '' },
      modules: [],
      permission: 'public',
      createdAt: t, updatedAt: t, lastAccessedAt: t,
      version: 1,
    }
    await db.lists.add(list)
    set(s => ({ lists: [list, ...s.lists] }))
    return id
  },

  updateListTitle: async (id, title) => {
    const t = ts()
    await db.lists.update(id, { title, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === id ? { ...l, title, updatedAt: t } : l) }))
  },

  deleteList: async (id) => {
    await db.lists.delete(id)
    set(s => ({ lists: s.lists.filter(l => l.id !== id) }))
  },

  addModule: async (listId, type) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const id = generateModuleId()
    let module: Module

    if (type === 'todo') {
      const m: TodoModule = { id, type: 'todo', items: [] }
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
      }
      module = m
    } else {
      module = { id, type: 'text', content: '' }
    }

    const t = ts()
    const modules = [...list.modules, module]
    await db.lists.update(listId, { modules, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, modules, updatedAt: t } : l) }))
  },

  updateModule: async (listId, updatedModule) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const t = ts()
    const modules = list.modules.map(m => m.id === updatedModule.id ? updatedModule : m)
    await db.lists.update(listId, { modules, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, modules, updatedAt: t } : l) }))
  },

  deleteModule: async (listId, moduleId) => {
    const list = get().lists.find(l => l.id === listId)
    if (!list) return

    const t = ts()
    const modules = list.modules.filter(m => m.id !== moduleId)
    await db.lists.update(listId, { modules, updatedAt: t })
    set(s => ({ lists: s.lists.map(l => l.id === listId ? { ...l, modules, updatedAt: t } : l) }))
  },
}))
