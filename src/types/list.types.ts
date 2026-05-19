export type ListPermission = 'public' | 'verified' | 'invite_only' | 'private'

export type ListBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string }

export interface List {
  id: string
  title: string
  background: ListBackground
  modules: Module[]
  ownerId?: string
  ownerToken?: string
  permission: ListPermission
  invitedUsernames?: string[]
  createdAt: number
  updatedAt: number
  lastAccessedAt: number
  version: number
}

export type Module = TextModule | TodoModule | VoteModule

export interface TextModule {
  id: string
  type: 'text'
  content: string
  imageUrl?: string
}

export interface TodoModule {
  id: string
  type: 'todo'
  subtitle?: string
  items: TodoItem[]
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
  doneBy?: string
}

export interface VoteModule {
  id: string
  type: 'vote'
  question: string
  options: VoteOption[]
  multiSelect: boolean
  anonymous: boolean
  // Phase 1: keyed by voterId; locally uses 'local' as the single voter key
  votes: Record<string, string[]>
}

export interface VoteOption {
  id: string
  text: string
}
