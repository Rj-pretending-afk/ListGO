/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

function nanoid(len: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

type FriendRow = {
  id: string; friend_id: string; friend_username: string
  friend_display_name: string | null; friend_avatar_color: string | null
  friend_avatar_image: string | null; created_at: number
}

type RequestRow = {
  id: string; requester_id: string; requester_username: string
  requester_display_name: string | null; requester_avatar_color: string | null
  requester_avatar_image: string | null; created_at: number
}

// ── POST /friends/request { addresseeId } ──
export async function handleSendFriendRequest(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  let body: { addresseeId?: string }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { addresseeId } = body
  if (!addresseeId) return err('addresseeId required', 400)
  if (addresseeId === auth.userId) return err('不能加自己为好友', 400)

  if (!await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(addresseeId).first()) {
    return err('用户不存在', 404)
  }

  // Check for existing relationship in either direction
  const existing = await env.DB.prepare(
    `SELECT id, status FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
  ).bind(auth.userId, addresseeId, addresseeId, auth.userId)
    .first<{ id: string; status: string }>()

  if (existing) {
    if (existing.status === 'accepted') return err('已经是好友了', 409)
    if (existing.status === 'pending') return err('好友申请已发送', 409)
    if (existing.status === 'blocked') return err('无法添加', 403)
  }

  const now = Date.now()
  await env.DB.prepare(
    'INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?)'
  ).bind(nanoid(16), auth.userId, addresseeId, 'pending', now, now).run()

  return json({ ok: true })
}

// ── PUT /friends/:id/accept ──
export async function handleAcceptFriendRequest(
  id: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const row = await env.DB.prepare(
    'SELECT id, status FROM friendships WHERE id = ? AND addressee_id = ?'
  ).bind(id, auth.userId).first<{ id: string; status: string }>()

  if (!row) return err('申请不存在', 404)
  if (row.status !== 'pending') return err('申请状态不正确', 409)

  await env.DB.prepare(
    'UPDATE friendships SET status = ?, updated_at = ? WHERE id = ?'
  ).bind('accepted', Date.now(), id).run()

  return json({ ok: true })
}

// ── DELETE /friends/:id — reject request, remove friend, or cancel sent request ──
export async function handleRemoveFriend(
  id: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  await env.DB.prepare(
    'DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)'
  ).bind(id, auth.userId, auth.userId).run()

  return json({ ok: true })
}

// ── PUT /friends/:id/block ──
export async function handleBlockUser(
  id: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const row = await env.DB.prepare(
    'SELECT id FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)'
  ).bind(id, auth.userId, auth.userId).first()
  if (!row) return err('记录不存在', 404)

  await env.DB.prepare(
    'UPDATE friendships SET status = ?, updated_at = ? WHERE id = ?'
  ).bind('blocked', Date.now(), id).run()

  return json({ ok: true })
}

// ── GET /friends — list accepted friends ──
export async function handleGetFriends(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const rows = await env.DB.prepare(`
    SELECT f.id,
      CASE WHEN f.requester_id = ?1 THEN f.addressee_id ELSE f.requester_id END AS friend_id,
      u.username AS friend_username,
      u.display_name AS friend_display_name,
      u.avatar_color AS friend_avatar_color,
      u.avatar_image AS friend_avatar_image,
      f.created_at
    FROM friendships f
    JOIN users u ON u.id = CASE WHEN f.requester_id = ?1 THEN f.addressee_id ELSE f.requester_id END
    WHERE (f.requester_id = ?1 OR f.addressee_id = ?1) AND f.status = 'accepted'
    ORDER BY u.display_name ASC
  `).bind(auth.userId).all<FriendRow>()

  return json((rows.results ?? []).map(r => ({
    id:            r.id,
    userId:        r.friend_id,
    username:      r.friend_username,
    displayName:   r.friend_display_name ?? r.friend_username,
    avatarColor:   r.friend_avatar_color ?? '#10B981',
    avatarImage:   r.friend_avatar_image ?? undefined,
    createdAt:     r.created_at,
  })))
}

// ── GET /friends/requests — incoming pending requests ──
export async function handleGetFriendRequests(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const rows = await env.DB.prepare(`
    SELECT f.id, f.requester_id,
      u.username AS requester_username,
      u.display_name AS requester_display_name,
      u.avatar_color AS requester_avatar_color,
      u.avatar_image AS requester_avatar_image,
      f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.requester_id
    WHERE f.addressee_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).bind(auth.userId).all<RequestRow>()

  return json((rows.results ?? []).map(r => ({
    id:                    r.id,
    requesterId:           r.requester_id,
    requesterUsername:     r.requester_username,
    requesterDisplayName:  r.requester_display_name ?? r.requester_username,
    requesterAvatarColor:  r.requester_avatar_color ?? '#10B981',
    requesterAvatarImage:  r.requester_avatar_image ?? undefined,
    createdAt:             r.created_at,
  })))
}

// ── GET /friends/status/:userId — friendship status between auth user and another ──
// (Embedded into PublicProfile response for efficiency; also available standalone)
export async function getFriendshipStatus(
  targetUserId: string, auth: AuthUser, env: Env
): Promise<{ status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'; friendshipId?: string }> {
  const row = await env.DB.prepare(
    `SELECT id, status, requester_id FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
  ).bind(auth.userId, targetUserId, targetUserId, auth.userId)
    .first<{ id: string; status: string; requester_id: string }>()

  if (!row) return { status: 'none' }
  if (row.status === 'accepted') return { status: 'accepted', friendshipId: row.id }
  if (row.status === 'blocked') return { status: 'blocked', friendshipId: row.id }
  // pending
  return {
    status: row.requester_id === auth.userId ? 'pending_sent' : 'pending_received',
    friendshipId: row.id,
  }
}
