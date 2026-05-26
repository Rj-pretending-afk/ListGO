/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response

interface SessionRow {
  user_id: string
  color: string
  display_name: string | null
  is_anonymous: number
  avatar_image: string | null
}

const ACTIVE_WINDOW_MS = 30_000

async function getActiveUsers(listId: string, env: Env, json: JsonFn): Promise<Response> {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS
  const rows = await env.DB.prepare(
    `SELECT s.user_id, s.color, s.display_name, s.is_anonymous, u.avatar_image
     FROM sessions s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.list_id = ? AND s.last_seen > ?`
  ).bind(listId, cutoff).all<SessionRow>()

  return json((rows.results ?? []).map(r => ({
    userId:      r.user_id,
    color:       r.color,
    displayName: r.display_name ?? undefined,
    isAnonymous: r.is_anonymous === 1,
    avatarImage: r.avatar_image ?? undefined,
  })))
}

// POST /presence/:listId — join or heartbeat; returns active users
export async function handleJoinPresence(
  listId: string,
  request: Request,
  auth: AuthUser | null,
  env: Env,
  json: JsonFn
): Promise<Response> {
  let body: { color?: string; displayName?: string; isAnonymous?: boolean; anonId?: string }
  try { body = await request.json() as typeof body } catch { body = {} }

  const userId = auth?.userId ?? (body.anonId ? `anon-${body.anonId}` : null)
  if (!userId) return json({ error: 'identity required' }, 400)

  await env.DB.prepare(
    `INSERT INTO sessions (user_id, list_id, color, display_name, is_anonymous, last_seen)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, list_id) DO UPDATE SET
       color = excluded.color,
       display_name = excluded.display_name,
       is_anonymous = excluded.is_anonymous,
       last_seen = excluded.last_seen`
  ).bind(
    userId,
    listId,
    body.color ?? '#10B981',
    body.displayName ?? null,
    body.isAnonymous ? 1 : 0,
    Date.now()
  ).run()

  return getActiveUsers(listId, env, json)
}

// GET /presence/:listId — poll active users (no auth required)
export async function handleGetPresence(
  listId: string,
  env: Env,
  json: JsonFn
): Promise<Response> {
  return getActiveUsers(listId, env, json)
}

// DELETE /presence/:listId — explicit leave
export async function handleLeavePresence(
  listId: string,
  request: Request,
  auth: AuthUser | null,
  env: Env,
  json: JsonFn
): Promise<Response> {
  const anonId = new URL(request.url).searchParams.get('anonId')
  const userId = auth?.userId ?? (anonId ? `anon-${anonId}` : null)
  if (userId) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND list_id = ?')
      .bind(userId, listId).run()
  }
  return json({ ok: true })
}
