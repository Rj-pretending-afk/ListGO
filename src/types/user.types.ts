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
  bio?: string
  hasRequestedInvite?: boolean
  inviteCodes: InviteCodeInfo[]
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'

export interface PublicProfile {
  id: string
  username: string
  displayName: string
  avatarColor: string
  avatarImage?: string
  bio?: string
  pokeMessage?: string
  isSelf: boolean
  friendshipStatus?: FriendshipStatus
  friendshipId?: string
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
  pokeMessageSnapshot?: string
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

export interface FriendInfo {
  id: string
  userId: string
  username: string
  displayName: string
  avatarColor: string
  avatarImage?: string
  createdAt: number
}

export interface FriendRequest {
  id: string
  requesterId: string
  requesterUsername: string
  requesterDisplayName: string
  requesterAvatarColor: string
  requesterAvatarImage?: string
  createdAt: number
}

export interface NotificationsResponse {
  pokes: PokeInfo[]
  listInvitations: ListInvitationNotif[]
  friendRequests: FriendRequest[]
  pendingAdminRequests?: number
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
