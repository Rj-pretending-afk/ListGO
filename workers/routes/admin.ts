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

// ── GET /admin/stats ──
export async function handleAdminStats(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const [users, lists, codesTotal, codesUsed, codesAvail] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) as n FROM lists').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) as n FROM invite_codes').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) as n FROM invite_codes WHERE used_by_id IS NOT NULL').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) as n FROM invite_codes WHERE used_by_id IS NULL AND revoked = 0').first<{ n: number }>(),
  ])

  return json({
    users:       users?.n ?? 0,
    lists:       lists?.n ?? 0,
    codesTotal:  codesTotal?.n ?? 0,
    codesUsed:   codesUsed?.n ?? 0,
    codesAvail:  codesAvail?.n ?? 0,
  })
}

// ── GET /admin/invite-codes ──
export async function handleAdminGetCodes(
  auth: AuthUser | null, env: Env, json: JsonFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const rows = await env.DB.prepare(`
    SELECT ic.code, ic.owner_id, u1.username AS owner_username,
           ic.used_by_id, u2.username AS used_by_username,
           ic.used_at, ic.revoked, ic.created_at
    FROM invite_codes ic
    LEFT JOIN users u1 ON u1.id = ic.owner_id
    LEFT JOIN users u2 ON u2.id = ic.used_by_id
    ORDER BY ic.created_at DESC
  `).all<{
    code: string; owner_id: string | null; owner_username: string | null
    used_by_id: string | null; used_by_username: string | null
    used_at: number | null; revoked: number; created_at: number
  }>()

  return json((rows.results ?? []).map(r => ({
    code:           r.code,
    ownerId:        r.owner_id,
    ownerUsername:  r.owner_username,
    usedById:       r.used_by_id,
    usedByUsername: r.used_by_username,
    usedAt:         r.used_at,
    revoked:        Boolean(r.revoked),
    createdAt:      r.created_at,
  })))
}

// ── POST /admin/invite-codes ──
export async function handleAdminGenerateCodes(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  let body: { count?: number }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const count = Math.min(Math.max(1, Number(body.count) || 1), 50)
  const now = Date.now()
  const codes: string[] = Array.from({ length: count }, () => nanoid(12).toUpperCase())

  await env.DB.batch(
    codes.map(code =>
      env.DB.prepare('INSERT INTO invite_codes (code, owner_id, created_at) VALUES (?,?,?)')
        .bind(code, null, now)
    )
  )

  return json({ ok: true, codes })
}

// ── GET /admin/users ──
export async function handleAdminGetUsers(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const rows = await env.DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.is_admin, u.created_at,
           (SELECT COUNT(*) FROM lists WHERE owner_id = u.id) as list_count
    FROM users u ORDER BY u.created_at DESC
  `).all<{ id: string; username: string; display_name: string | null; is_admin: number; created_at: number; list_count: number }>()

  return json((rows.results ?? []).map(r => ({
    id:          r.id,
    username:    r.username,
    displayName: r.display_name,
    isAdmin:     Boolean(r.is_admin),
    createdAt:   r.created_at,
    listCount:   r.list_count,
  })))
}

// ── GET /admin/users/:userId/lists ──
export async function handleAdminGetUserLists(
  userId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  const rows = await env.DB.prepare(
    'SELECT id, title, permission, version, updated_at FROM lists WHERE owner_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all<{ id: string; title: string; permission: string; version: number; updated_at: number }>()

  return json(rows.results ?? [])
}

// ── DELETE /admin/invite-codes/:code ──
export async function handleAdminRevokeCode(
  code: string, auth: AuthUser | null, env: Env, json: JsonFn
): Promise<Response> {
  const guard = adminGuard(auth)
  if (guard) return guard

  await env.DB.prepare(
    'UPDATE invite_codes SET revoked = 1 WHERE code = ? AND used_by_id IS NULL'
  ).bind(code).run()

  return json({ ok: true })
}
