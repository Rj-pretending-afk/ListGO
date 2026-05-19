export type ListPermission = 'public' | 'verified' | 'invite_only' | 'private'

export type ListBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string }

export interface List {
  id: string
  title: string
  background: ListBackground
  cardOpacity?: number  // 保留字段（已移至模块级别），可能存在于旧数据
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

export interface ModuleBackground {
  type: 'color' | 'image'
  value: string        // hex color; '' for image type
  imageData?: string   // base64 data URL or https:// URL
  opacity: number      // 0-1
  size: 'cover' | 'contain' | 'auto'
}

export type Module = TextModule | TodoModule | VoteModule

export interface TextModule {
  id: string
  type: 'text'
  content: string
  background?: ModuleBackground
}

export interface TodoModule {
  id: string
  type: 'todo'
  subtitle?: string
  items: TodoItem[]
  background?: ModuleBackground
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
  votes: Record<string, string[]>
  background?: ModuleBackground
}

export interface VoteOption {
  id: string
  text: string
}
