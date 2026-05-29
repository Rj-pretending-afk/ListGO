import { authStorage } from './auth'
import type { List } from '../types/list.types'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getToken()

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? 'Request failed'
    throw new Error(msg)
  }
  return data as T
}

export const api = {
  get:    <T>(path: string)               => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
}

function listPayload(list: List) {
  return {
    id:               list.id,
    title:            list.title,
    ownerToken:       list.ownerToken,
    modules:          list.modules,
    background:       list.background,
    cardOpacity:      list.cardOpacity,
    invitedUsernames: list.invitedUsernames,
    permission:       list.permission ?? 'public',
    version:          list.version,
    createdAt:        list.createdAt,
    updatedAt:        list.updatedAt,
  }
}

export const userApi = {
  search: (q: string) =>
    api.get<{ id: string; username: string; displayName: string; avatarColor: string; avatarImage?: string }[]>(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (username: string) =>
    api.get<import('../types/user.types').PublicProfile>(`/users/${encodeURIComponent(username)}/profile`),
}

export const claimApi = {
  preview: (ownerToken: string) =>
    api.get<{ id: string; title: string; updated_at: number }[]>(
      `/claim/preview?ownerToken=${encodeURIComponent(ownerToken)}`
    ),
  claim: (ownerToken: string, listIds: string[]) =>
    api.post<{ ok: boolean }>('/claim', { ownerToken, listIds }),
}

export const inviteRequestApi = {
  create: () => api.post<{ ok: boolean }>('/invite-request', {}),
}

export const pokeApi = {
  send: (recipientId: string) => api.post<{ ok: boolean }>('/pokes', { recipientId }),
  inbox: () => api.get<import('../types/user.types').PokeInfo[]>('/pokes/inbox'),
  markRead: (pokeId: string) => api.put<{ ok: boolean }>(`/pokes/${pokeId}/read`, {}),
}

export const notificationApi = {
  getAll: () => api.get<import('../types/user.types').NotificationsResponse>('/notifications'),
  markPokeRead: (pokeId: string) => api.put<{ ok: boolean }>(`/pokes/${pokeId}/read`, {}),
  markInvitationRead: (id: string) => api.put<{ ok: boolean }>(`/list-invitations/${id}/read`, {}),
}

export const friendApi = {
  sendRequest: (addresseeId: string) => api.post<{ ok: boolean }>('/friends/request', { addresseeId }),
  accept: (id: string) => api.put<{ ok: boolean }>(`/friends/${id}/accept`, {}),
  remove: (id: string) => api.delete<{ ok: boolean }>(`/friends/${id}`),
  block: (id: string) => api.put<{ ok: boolean }>(`/friends/${id}/block`, {}),
  list: () => api.get<import('../types/user.types').FriendInfo[]>('/friends'),
  requests: () => api.get<import('../types/user.types').FriendRequest[]>('/friends/requests'),
}

export const adminApi = {
  getInviteRequests: () => api.get<import('../types/user.types').InviteRequestInfo[]>('/admin/invite-requests'),
  acceptInviteRequest: (id: string) => api.put<{ ok: boolean; newCode: string }>(`/admin/invite-requests/${id}/accept`, {}),
  rejectInviteRequest: (id: string) => api.put<{ ok: boolean }>(`/admin/invite-requests/${id}/reject`, {}),
  generateUserInviteCode: (userId: string) => api.post<{ ok: boolean; code: string }>(`/admin/users/${userId}/invite-code`, {}),
  getUsers: () => api.get<{ id: string; username: string; displayName: string | null; avatarColor: string; avatarImage?: string; isAdmin: boolean; createdAt: number; listCount: number }[]>('/admin/users'),
  getUserLists: (userId: string) => api.get<{ id: string; title: string; permission: string; version: number; updated_at: number }[]>(`/admin/users/${userId}/lists`),
  setDisplayName: (userId: string, displayName: string) => api.put<{ ok: boolean }>(`/admin/users/${userId}/displayname`, { displayName }),
  setAdmin: (userId: string, adminLevel: number) => api.put<{ ok: boolean }>(`/admin/users/${userId}/admin`, { adminLevel }),
  resetPassword: (userId: string, password: string) => api.put<{ ok: boolean }>(`/admin/users/${userId}/password`, { password }),
  deleteUser: (userId: string) => api.delete<{ ok: boolean }>(`/admin/users/${userId}`),
  getList: (listId: string) => api.get<Record<string, unknown>>(`/admin/lists/${listId}`),
  deleteList: (listId: string) => api.delete<{ ok: boolean }>(`/admin/lists/${listId}`),
}

export const voteApi = {
  cast: (moduleId: string, listId: string, optionIds: string[], voterId: string, isAnon: boolean, displayName?: string) =>
    api.post<{ ok: boolean; votes: Record<string, string[]>; voterNames: Record<string, string>; version: number }>(`/votes/${moduleId}`, {
      listId,
      optionIds,
      ...(isAnon ? { anonymousId: voterId } : {}),
      ...(displayName ? { displayName } : {}),
    }),
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const token = authStorage.getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/upload/image`, {
      method: 'POST',
      // No Content-Type header — browser sets multipart boundary automatically
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    const data = await res.json() as { url?: string; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Upload failed')
    return data as { url: string }
  },
}

export interface PresenceUser {
  userId:      string
  color:       string
  displayName?: string
  isAnonymous: boolean
  avatarImage?: string
  username?:   string
}

export const presenceApi = {
  join: (listId: string, data: { color: string; displayName?: string; isAnonymous: boolean; anonId?: string }) =>
    api.post<PresenceUser[]>(`/presence/${listId}`, data),
  leave: (listId: string, anonId?: string) =>
    api.delete<{ ok: boolean }>(`/presence/${listId}${anonId ? `?anonId=${encodeURIComponent(anonId)}` : ''}`),
  get: (listId: string) =>
    api.get<PresenceUser[]>(`/presence/${listId}`),
}

export interface InvitedListEntry {
  id: string
  title: string
  ownerUsername: string
  ownerAvatarColor: string
  ownerAvatarImage?: string
  moduleCount: number
  updatedAt: number
  invitedAt: number
}

export const listApi = {
  fetchOwned: () =>
    api.get<List[]>('/lists'),

  invited: () =>
    api.get<InvitedListEntry[]>('/lists/invited'),

  invite: (listId: string, username: string) =>
    api.post<{ ok: boolean }>(`/lists/${listId}/invite`, { username }),

  create: (list: List) =>
    api.post<{ ok: boolean }>('/lists', listPayload(list)),

  update: (list: List) =>
    api.put<{ ok: boolean; version: number }>(`/lists/${list.id}`, {
      title:            list.title,
      ownerToken:       list.ownerToken,
      modules:          list.modules,
      background:       list.background,
      cardOpacity:      list.cardOpacity,
      invitedUsernames: list.invitedUsernames,
      permission:       list.permission ?? 'public',
      version:          list.version,
    }),

  patchModule: (listId: string, module: unknown) => {
    const m = module as { id: string }
    return request<{ ok: boolean }>(`/lists/${listId}/modules/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify(module),
    })
  },

  delete: (id: string, ownerToken?: string) => {
    const qs = ownerToken ? `?ownerToken=${encodeURIComponent(ownerToken)}` : ''
    return api.delete<{ ok: boolean }>(`/lists/${id}${qs}`)
  },

  poll: (id: string, since: number, ownerToken?: string) => {
    const qs = `?since=${since}${ownerToken ? `&ownerToken=${encodeURIComponent(ownerToken)}` : ''}`
    return api.get<Record<string, unknown>>(`/lists/${id}${qs}`)
  },
}
