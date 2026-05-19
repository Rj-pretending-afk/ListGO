export type ListPermission = 'public' | 'verified' | 'invite_only' | 'private'

export type ListBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string }

export interface List {
  id: string
  title: string
  background: ListBackground
  cardOpacity?: number
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
  value: string
  imageData?: string
  opacity: number
  size: 'cover' | 'contain' | 'auto'
  posX?: number       // 0-100, background-position-x %
  posY?: number       // 0-100, background-position-y %
  sizePercent?: number // 10-300, overrides size enum when set
}

export interface ModuleFontSettings {
  size?: string    // CSS font-size e.g. '0.875rem' | '1rem' | '1.25rem' | '1.5rem'
  family?: string  // CSS font-family
  color?: string   // hex color
}

export type Module = TextModule | TodoModule | VoteModule

export interface TextModule {
  id: string
  type: 'text'
  content: string
  background?: ModuleBackground
  fontSettings?: ModuleFontSettings
  customLabel?: string
}

export interface TodoModule {
  id: string
  type: 'todo'
  subtitle?: string
  items: TodoItem[]
  background?: ModuleBackground
  fontSettings?: ModuleFontSettings
  customLabel?: string
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
  fontSettings?: ModuleFontSettings
  customLabel?: string
}

export interface VoteOption {
  id: string
  text: string
}
