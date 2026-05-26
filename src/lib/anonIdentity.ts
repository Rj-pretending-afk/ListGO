import { AVATAR_COLORS } from './colors'

const KEY = 'listgo_anon_identity'

export interface AnonIdentity {
  color: string    // hex value from AVATAR_COLORS
  nickname: string // empty string = no nickname
}

export function getAnonIdentity(): AnonIdentity {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AnonIdentity
  } catch { /* ignore */ }
  return { color: AVATAR_COLORS[0].value, nickname: '' }
}

export function setAnonIdentity(identity: AnonIdentity): void {
  localStorage.setItem(KEY, JSON.stringify(identity))
}

export function hasSetAnonIdentity(): boolean {
  return localStorage.getItem(KEY) !== null
}

export function getAnonDisplayName(identity: AnonIdentity): string {
  if (identity.nickname.trim()) return identity.nickname.trim()
  const found = AVATAR_COLORS.find(c => c.value === identity.color)
  return found ? `${found.label}色访客` : '访客'
}
