/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

interface ListRow {
  id: string; title: string; data: string
  owner_id: string | null; owner_token: string | null
  permission: string; version: number
  created_at: number; updated_at: number; last_accessed_at: number
  owner_theme?: string | null
  owner_username?: string | null
  owner_avatar_color?: string | null
  owner_avatar_image?: string | null
}

function serialize(row: ListRow) {
  const data = JSON.parse(row.data) as Record<string, unknown>
  return {
    id:            row.id,
    title:         row.title,
    ownerId:       row.owner_id ?? undefined,
    ownerToken:    row.owner_token ?? undefined,
    ownerTheme:       row.owner_theme ?? undefined,
    ownerUsername:    row.owner_username ?? undefined,
    ownerAvatarColor: row.owner_avatar_color ?? undefined,
    ownerAvatarImage: row.owner_avatar_image ?? undefined,
    permission:    row.permission,
    version:       row.version,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    lastAccessedAt: row.last_accessed_at,
    ...data,
  }
}

// ── POST /lists ──
export async function handleCreateList(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

  const id          = body.id as string
  const title       = body.title as string
  const ownerToken  = body.ownerToken as string | undefined
  const ownerId     = auth?.userId ?? null
  const tokenValue  = ownerId ? null : (ownerToken ?? null)

  if (!id || !title) return err('id and title required', 400)
  if (!ownerId && !tokenValue) return err('Unauthorized', 401)

  const { modules, background, cardOpacity, permission, invitedUsernames,
          version, createdAt, updatedAt } = body

  const data = JSON.stringify({ modules, background, cardOpacity, invitedUsernames })
  const now  = Date.now()

  await env.DB.prepare(`
    INSERT OR REPLACE INTO lists
      (id, title, data, owner_id, owner_token, permission, version, created_at, updated_at, last_accessed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, title, data, ownerId, tokenValue,
    permission ?? 'public',
    version ?? 1,
    createdAt ?? now, updatedAt ?? now, now
  ).run()

  return json({ ok: true })
}

// ── GET /lists (own lists index) ──
export async function handleGetUserLists(
  auth: AuthUser, env: Env, json: JsonFn
): Promise<Response> {
  const rows = await env.DB.prepare(
    'SELECT * FROM lists WHERE owner_id = ? ORDER BY updated_at DESC'
  ).bind(auth.userId).all<ListRow>()

  return json((rows.results ?? []).map(serialize))
}

// ── GET /lists/:id ──
export async function handleGetList(
  id: string, request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT l.*, u.theme AS owner_theme, u.username AS owner_username, u.avatar_color AS owner_avatar_color, u.avatar_image AS owner_avatar_image FROM lists l LEFT JOIN users u ON l.owner_id = u.id WHERE l.id = ?'
  ).bind(id).first<ListRow>()
  if (!row) return err('Not found', 404)

  const url         = new URL(request.url)
  const tokenParam  = url.searchParams.get('ownerToken')
  const isOwner     = auth
    ? row.owner_id === auth.userId
    : tokenParam !== null && row.owner_token === tokenParam

  if (!isOwner) {
    if (row.permission === 'private') return err('Forbidden', 403)
    if (row.permission === 'verified' && !auth) return err('Login required', 401)
    if (row.permission === 'invite_only') {
      if (!auth) return err('Login required', 401)
      const listData = JSON.parse(row.data) as { invitedUsernames?: string[] }
      if (!(listData.invitedUsernames ?? []).includes(auth.username)) return err('Forbidden', 403)
    }
  }

  // Always update last_accessed_at (30-day anonymous cleanup clock)
  void env.DB.prepare('UPDATE lists SET last_accessed_at = ? WHERE id = ?').bind(Date.now(), id).run()

  // ?since=N → return { upToDate: true } if server version hasn't advanced
  const since = url.searchParams.get('since')
  if (since !== null) {
    const sv = parseInt(since, 10)
    if (!isNaN(sv) && row.version <= sv) {
      return json({ upToDate: true, version: row.version })
    }
  }

  return json(serialize(row))
}

// ── PUT /lists/:id ──
export async function handleUpdateList(
  id: string, request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const existing = await env.DB.prepare(
    'SELECT owner_id, owner_token, version FROM lists WHERE id = ?'
  ).bind(id).first<{ owner_id: string | null; owner_token: string | null; version: number }>()
  if (!existing) return err('Not found', 404)

  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

  const ownerToken = body.ownerToken as string | undefined
  const isOwner    = auth
    ? existing.owner_id === auth.userId
    : ownerToken !== undefined && existing.owner_token === ownerToken

  if (!isOwner) return err('Forbidden', 403)

  // Optional optimistic-lock version check
  if (body.version !== undefined && existing.version !== Number(body.version)) {
    return err(`Version conflict: server=${existing.version} client=${body.version}`, 409)
  }

  const { title, modules, background, cardOpacity, permission, invitedUsernames } = body

  // Preserve votes that were written via the vote API — don't let a full document sync overwrite them
  const existingRow = await env.DB.prepare('SELECT data FROM lists WHERE id = ?').bind(id).first<{ data: string }>()
  const existingData = existingRow ? JSON.parse(existingRow.data) as { modules?: { id: string; type: string; votes?: Record<string, string[]> }[] } : {}
  const mergedModules = Array.isArray(modules)
    ? (modules as { id: string; type: string; votes?: Record<string, string[]> }[]).map(m => {
        if (m.type !== 'vote') return m
        const serverVotes = existingData.modules?.find(em => em.id === m.id)?.votes
        return serverVotes ? { ...m, votes: serverVotes } : m
      })
    : modules

  const data = JSON.stringify({ modules: mergedModules, background, cardOpacity, invitedUsernames })
  const now  = Date.now()

  await env.DB.prepare(`
    UPDATE lists SET title=?, data=?, permission=?, version=version+1, updated_at=?, last_accessed_at=?
    WHERE id=?
  `).bind(title, data, permission ?? 'public', now, now, id).run()

  const updated = await env.DB.prepare('SELECT version FROM lists WHERE id=?').bind(id).first<{ version: number }>()
  return json({ ok: true, version: updated?.version })
}

// ── PATCH /lists/:id/modules/:moduleId — collaborative edit for public-permission modules ──
export async function handleCollabUpdateModule(
  listId: string, moduleId: string, request: Request,
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT data, permission FROM lists WHERE id = ?'
  ).bind(listId).first<{ data: string; permission: string }>()
  if (!row) return err('Not found', 404)

  // Same read-access check as GET (non-owners only reach here)
  if (row.permission === 'private') return err('Forbidden', 403)
  if (row.permission === 'verified' && !auth) return err('Login required', 401)
  if (row.permission === 'invite_only') {
    if (!auth) return err('Login required', 401)
    const d = JSON.parse(row.data) as { invitedUsernames?: string[] }
    if (!(d.invitedUsernames ?? []).includes(auth.username)) return err('Forbidden', 403)
  }

  const listData = JSON.parse(row.data) as { modules?: Record<string, unknown>[] }
  const existing = (listData.modules ?? []).find((m): m is Record<string, unknown> => m.id === moduleId)
  if (!existing) return err('Module not found', 404)
  if (existing.editPermission !== 'public') return err('Forbidden', 403)

  let incoming: Record<string, unknown>
  try { incoming = await request.json() as Record<string, unknown> } catch { return err('Invalid JSON', 400) }

  // Merge: immutable server fields win; votes preserved server-side
  const merged: Record<string, unknown> = {
    ...existing,
    ...incoming,
    id:             moduleId,
    type:           existing.type,
    editPermission: 'public',
  }
  if (existing.type === 'vote') {
    merged.votes      = existing.votes
    merged.voterNames = existing.voterNames
  }

  const updatedModules = (listData.modules ?? []).map(m => m.id === moduleId ? merged : m)
  const newData = JSON.stringify({ ...listData, modules: updatedModules })
  await env.DB.prepare(
    'UPDATE lists SET data=?, version=version+1, updated_at=? WHERE id=?'
  ).bind(newData, Date.now(), listId).run()

  return json({ ok: true })
}

// ── DELETE /lists/:id ──
export async function handleDeleteList(
  id: string, request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const existing = await env.DB.prepare(
    'SELECT owner_id, owner_token FROM lists WHERE id = ?'
  ).bind(id).first<{ owner_id: string | null; owner_token: string | null }>()
  if (!existing) return err('Not found', 404)

  const url        = new URL(request.url)
  const ownerToken = url.searchParams.get('ownerToken')
  const isOwner    = auth
    ? existing.owner_id === auth.userId
    : ownerToken !== null && existing.owner_token === ownerToken

  if (!isOwner) return err('Forbidden', 403)

  await env.DB.prepare('DELETE FROM lists WHERE id=?').bind(id).run()
  return json({ ok: true })
}
