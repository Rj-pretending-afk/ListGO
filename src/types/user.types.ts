export interface User {
  id: string
  username: string
  displayName: string
  avatarColor: string
  avatarImage?: string
  isAdmin: boolean
  inviteCodes: InviteCodeInfo[]
}

export interface InviteCodeInfo {
  code: string
  used: boolean
  usedAt: number | null
  revoked: boolean
}
