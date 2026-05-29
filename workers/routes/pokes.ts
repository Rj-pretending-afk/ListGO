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

// ── POST /pokes  { recipientId } ──
export async function handleSendPoke(
  request: Request, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  let body: { recipientId?: string }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { recipientId } = body
  if (!recipientId) return err('recipientId required', 400)
  if (recipientId === auth.userId) return err('不能戳自己', 400)

  if (!await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(recipientId).first()) {
    return err('用户不存在', 404)
  }

  await env.DB.prepare(
    'INSERT INTO pokes (id, sender_id, recipient_id, status, poke_message_snapshot, created_at) VALUES (?,?,?,?,?,?)'
  ).bind(nanoid(16), auth.userId, recipientId, 'unread', null, Date.now()).run()

  return json({ ok: true })
}

// ── GET /pokes/inbox ──
export async function handleGetPokeInbox(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const rows = await env.DB.prepare(`
    SELECT p.id, p.sender_id, u.username AS sender_username,
           u.display_name AS sender_display_name,
           u.avatar_color AS sender_avatar_color,
           u.avatar_image AS sender_avatar_image,
           p.status, p.created_at
    FROM pokes p
    JOIN users u ON u.id = p.sender_id
    WHERE p.recipient_id = ? AND p.status = 'unread'
    ORDER BY p.created_at DESC
  `).bind(auth.userId).all<{
    id: string; sender_id: string; sender_username: string
    sender_display_name: string | null; sender_avatar_color: string | null
    sender_avatar_image: string | null; status: string; created_at: number
  }>()

  return json((rows.results ?? []).map(r => ({
    id:                r.id,
    senderId:          r.sender_id,
    senderUsername:    r.sender_username,
    senderDisplayName: r.sender_display_name ?? r.sender_username,
    senderAvatarColor: r.sender_avatar_color ?? '#10B981',
    senderAvatarImage: r.sender_avatar_image ?? undefined,
    status:            r.status,
    createdAt:         r.created_at,
  })))
}

// ── PUT /pokes/:id/read ──
export async function handleMarkPokeRead(
  pokeId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const poke = await env.DB.prepare(
    'SELECT sender_id, poke_message_snapshot FROM pokes WHERE id = ? AND recipient_id = ?'
  ).bind(pokeId, auth.userId).first<{ sender_id: string; poke_message_snapshot: string | null }>()

  if (poke) {
    await env.DB.prepare(
      'UPDATE pokes SET status = ? WHERE id = ? AND recipient_id = ?'
    ).bind('read', pokeId, auth.userId).run()

    // Auto-reply only for original pokes (null snapshot = original, non-null = auto-reply)
    if (poke.poke_message_snapshot === null) {
      const reader = await env.DB.prepare('SELECT poke_message FROM users WHERE id = ?')
        .bind(auth.userId).first<{ poke_message: string | null }>()
      if (reader?.poke_message) {
        await env.DB.prepare(
          'INSERT INTO pokes (id, sender_id, recipient_id, status, poke_message_snapshot, created_at) VALUES (?,?,?,?,?,?)'
        ).bind(nanoid(16), auth.userId, poke.sender_id, 'unread', reader.poke_message, Date.now()).run()
      }
    }
  }

  return json({ ok: true })
}
