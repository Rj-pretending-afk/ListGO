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

export const claimApi = {
  preview: (ownerToken: string) =>
    api.get<{ id: string; title: string; updated_at: number }[]>(
      `/claim/preview?ownerToken=${encodeURIComponent(ownerToken)}`
    ),
  claim: (ownerToken: string, listIds: string[]) =>
    api.post<{ ok: boolean }>('/claim', { ownerToken, listIds }),
}

export const listApi = {
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
}
