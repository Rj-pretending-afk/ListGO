/// <reference types="@cloudflare/workers-types" />

import { adminGuard } from '../middleware/adminOnly'
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

interface RequestRow {
  id: string
  requester_id: string
  requester_username: string
  requester_display_name: string | null
  requester_avatar_color: string | null
  requester_avatar_image: string | null
  status: string
  created_at: number
  resolved_at: number | null
  resolved_by: string | null
}

// ── POST /invite-request ──
export async function handleCreateInviteRequest(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  // Must have no unused codes
  const unusedCode = await env.DB.prepare(
    'SELECT code FROM invite_codes WHERE owner_id = ? AND used_by_id IS NULL AND revoked = 0 LIMIT 1'
  ).bind(auth.userId).first()
  if (unusedCode) return err('你已有可用的邀请码', 400)

  // No duplicate pending request
  const existing = await env.DB.prepare(
    'SELECT id FROM invite_requests WHERE requester_id = ? AND status = ? LIMIT 1'
  ).bind(auth.userId, 'pending').first()
  if (existing) return err('已有待审请求', 409)

  await env.DB.prepare(
    'INSERT INTO invite_requests (id, requester_id, status, created_at) VALUES (?,?,?,?)'
  ).bind(nanoid(16), auth.userId, 'pending', Date.now()).run()

  return json({ ok: true })
}

// ── GET /admin/invite-requests ──
export async function handleAdminGetInviteRequests(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const rows = await env.DB.prepare(`
    SELECT ir.id, ir.requester_id, u.username AS requester_username,
           u.display_name AS requester_display_name,
           u.avatar_color AS requester_avatar_color,
           u.avatar_image AS requester_avatar_image,
           ir.status, ir.created_at, ir.resolved_at, ir.resolved_by
    FROM invite_requests ir
    JOIN users u ON u.id = ir.requester_id
    WHERE ir.status = 'pending'
    ORDER BY ir.created_at ASC
  `).all<RequestRow>()

  return json((rows.results ?? []).map(r => ({
    id:                   r.id,
    requesterId:          r.requester_id,
    requesterUsername:    r.requester_username,
    requesterDisplayName: r.requester_display_name ?? r.requester_username,
    requesterAvatarColor: r.requester_avatar_color ?? '#10B981',
    requesterAvatarImage: r.requester_avatar_image ?? undefined,
    status:               r.status,
    createdAt:            r.created_at,
  })))
}

// ── PUT /admin/invite-requests/:id/accept ──
export async function handleAdminAcceptRequest(
  requestId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const req = await env.DB.prepare(
    'SELECT id, requester_id FROM invite_requests WHERE id = ? AND status = ?'
  ).bind(requestId, 'pending').first<{ id: string; requester_id: string }>()
  if (!req) return err('申请不存在或已处理', 404)

  const newCode = nanoid(12).toUpperCase()
  const now = Date.now()

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE invite_requests SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?'
    ).bind('accepted', now, auth!.userId, requestId),
    env.DB.prepare(
      'INSERT INTO invite_codes (code, owner_id, created_at) VALUES (?,?,?)'
    ).bind(newCode, req.requester_id, now),
  ])

  return json({ ok: true, newCode })
}

// ── PUT /admin/invite-requests/:id/reject ──
export async function handleAdminRejectRequest(
  requestId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const req = await env.DB.prepare(
    'SELECT id FROM invite_requests WHERE id = ? AND status = ?'
  ).bind(requestId, 'pending').first()
  if (!req) return err('申请不存在或已处理', 404)

  await env.DB.prepare(
    'UPDATE invite_requests SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?'
  ).bind('rejected', Date.now(), auth!.userId, requestId).run()

  return json({ ok: true })
}

// ── POST /admin/users/:userId/invite-code  (直接为用户生成码) ──
export async function handleAdminGenerateUserInviteCode(
  userId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first()
  if (!user) return err('用户不存在', 404)

  const code = nanoid(12).toUpperCase()
  await env.DB.prepare(
    'INSERT INTO invite_codes (code, owner_id, created_at) VALUES (?,?,?)'
  ).bind(code, userId, Date.now()).run()

  return json({ ok: true, code })
}
