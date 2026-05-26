export interface User {
  id: string
  username: string
  displayName: string
  avatarColor: string
  avatarImage?: string
  theme?: string
  isAdmin: boolean
  isSuperAdmin: boolean
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

export interface ListInvitationNotif {
  id: string
  listId: string
  listTitle: string
  ownerUsername: string
  ownerAvatarColor: string
  ownerAvatarImage?: string
  status: string
  createdAt: number
}

export interface NotificationsResponse {
  pokes: PokeInfo[]
  listInvitations: ListInvitationNotif[]
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
