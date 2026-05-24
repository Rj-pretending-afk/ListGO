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
    api.get<{ username: string; displayName: string }[]>(`/users/search?q=${encodeURIComponent(q)}`),
}

export const claimApi = {
  preview: (ownerToken: string) =>
    api.get<{ id: string; title: string; updated_at: number }[]>(
      `/claim/preview?ownerToken=${encodeURIComponent(ownerToken)}`
    ),
  claim: (ownerToken: string, listIds: string[]) =>
    api.post<{ ok: boolean }>('/claim', { ownerToken, listIds }),
}

export const adminApi = {
  getUsers: () => api.get<{ id: string; username: string; displayName: string | null; isAdmin: boolean; createdAt: number; listCount: number }[]>('/admin/users'),
  getUserLists: (userId: string) => api.get<{ id: string; title: string; permission: string; version: number; updated_at: number }[]>(`/admin/users/${userId}/lists`),
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
}

export const presenceApi = {
  join: (listId: string, data: { color: string; displayName?: string; isAnonymous: boolean; anonId?: string }) =>
    api.post<PresenceUser[]>(`/presence/${listId}`, data),
  leave: (listId: string, anonId?: string) =>
    api.delete<{ ok: boolean }>(`/presence/${listId}${anonId ? `?anonId=${encodeURIComponent(anonId)}` : ''}`),
  get: (listId: string) =>
    api.get<PresenceUser[]>(`/presence/${listId}`),
}

export const listApi = {
  fetchOwned: () =>
    api.get<List[]>('/lists'),

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

  delete: (id: string, ownerToken?: string) => {
    const qs = ownerToken ? `?ownerToken=${encodeURIComponent(ownerToken)}` : ''
    return api.delete<{ ok: boolean }>(`/lists/${id}${qs}`)
  },

  poll: (id: string, since: number, ownerToken?: string) => {
    const qs = `?since=${since}${ownerToken ? `&ownerToken=${encodeURIComponent(ownerToken)}` : ''}`
    return api.get<Record<string, unknown>>(`/lists/${id}${qs}`)
  },
}
