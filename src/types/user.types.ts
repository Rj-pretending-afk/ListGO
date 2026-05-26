export interface User {
  id: string
  username: string
  displayName: string
  avatarColor: string
  avatarImage?: string
  theme?: string
  isAdmin: boolean
  pokeMessage?: string
  hasRequestedInvite?: boolean
  inviteCodes: InviteCodeInfo[]
}

export interface InviteCodeInfo {
  code: string
  used: boolean
  usedAt: number | null
  usedByUsername?: string
  revoked: boolean
}

export interface PokeInfo {
  id: string
  senderId: string
  senderUsername: string
  senderDisplayName: string
  senderAvatarColor: string
  senderAvatarImage?: string
  status: string
  createdAt: number
}

export interface InviteRequestInfo {
  id: string
  requesterId: string
  requesterUsername: string
  requesterDisplayName: string
  requesterAvatarColor: string
  requesterAvatarImage?: string
  status: string
  createdAt: number
}
