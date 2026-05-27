/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

// ── GET /notifications ── combined pokes + list invitations
export async function handleGetNotifications(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const [pokesResult, invitesResult, adminResult] = await Promise.all([
    env.DB.prepare(`
      SELECT p.id, p.sender_id, u.username AS sender_username,
             u.display_name AS sender_display_name,
             u.avatar_color AS sender_avatar_color,
             u.avatar_image AS sender_avatar_image,
             u.poke_message AS sender_poke_message,
             p.status, p.created_at
      FROM pokes p
      JOIN users u ON u.id = p.sender_id
      WHERE p.recipient_id = ? AND p.status = 'unread'
      ORDER BY p.created_at DESC LIMIT 20
    `).bind(auth.userId).all<{
      id: string; sender_id: string; sender_username: string
      sender_display_name: string | null; sender_avatar_color: string | null
      sender_avatar_image: string | null; sender_poke_message: string | null
      status: string; created_at: number
    }>(),
    env.DB.prepare(
      'SELECT * FROM list_invitations WHERE invitee_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(auth.userId, 'unread').all<{
      id: string; list_id: string; list_title: string
      owner_username: string; owner_avatar_color: string | null
      owner_avatar_image: string | null; status: string; created_at: number
    }>(),
    auth.isAdmin
      ? env.DB.prepare(`SELECT COUNT(*) AS cnt FROM invite_requests WHERE status = 'pending'`)
          .first<{ cnt: number }>()
      : Promise.resolve(null),
  ])

  return json({
    pokes: (pokesResult.results ?? []).map(r => ({
      id:                r.id,
      senderId:          r.sender_id,
      senderUsername:    r.sender_username,
      senderDisplayName: r.sender_display_name ?? r.sender_username,
      senderAvatarColor: r.sender_avatar_color ?? '#10B981',
      senderAvatarImage:   r.sender_avatar_image ?? undefined,
      senderPokeMessage:   r.sender_poke_message ?? undefined,
      status:              r.status,
      createdAt:           r.created_at,
    })),
    listInvitations: (invitesResult.results ?? []).map(r => ({
      id:               r.id,
      listId:           r.list_id,
      listTitle:        r.list_title,
      ownerUsername:    r.owner_username,
      ownerAvatarColor: r.owner_avatar_color ?? '#10B981',
      ownerAvatarImage: r.owner_avatar_image ?? undefined,
      status:           r.status,
      createdAt:        r.created_at,
    })),
    ...(auth.isAdmin ? { pendingAdminRequests: adminResult?.cnt ?? 0 } : {}),
  })
}

// ── PUT /list-invitations/:id/read ──
export async function handleMarkInvitationRead(
  inviteId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)
  await env.DB.prepare(
    'UPDATE list_invitations SET status = ? WHERE id = ? AND invitee_id = ?'
  ).bind('read', inviteId, auth.userId).run()
  return json({ ok: true })
}

// ── PUT /pokes/:id/read  (also accessible from here for convenience) ──
export async function handleMarkPokeReadN(
  pokeId: string, auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)
  await env.DB.prepare(
    'UPDATE pokes SET status = ? WHERE id = ? AND recipient_id = ?'
  ).bind('read', pokeId, auth.userId).run()
  return json({ ok: true })
}
