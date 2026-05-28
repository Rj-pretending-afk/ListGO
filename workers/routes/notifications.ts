/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

// ── GET /notifications ── combined pokes + list invitations + friend requests
export async function handleGetNotifications(
  auth: AuthUser | null, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  if (!auth) return err('Unauthorized', 401)

  const [pokesResult, invitesResult, friendReqResult, adminResult] = await Promise.all([
    env.DB.prepare(`
      SELECT p.id, p.sender_id, u.username AS sender_username,
             u.display_name AS sender_display_name,
             u.avatar_color AS sender_avatar_color,
             u.avatar_image AS sender_avatar_image,
             p.poke_message_snapshot,
             p.status, p.created_at
      FROM pokes p
      JOIN users u ON u.id = p.sender_id
      WHERE p.recipient_id = ? AND p.status = 'unread'
      ORDER BY p.created_at DESC LIMIT 20
    `).bind(auth.userId).all<{
      id: string; sender_id: string; sender_username: string
      sender_display_name: string | null; sender_avatar_color: string | null
      sender_avatar_image: string | null; poke_message_snapshot: string | null
      status: string; created_at: number
    }>(),
    env.DB.prepare(
      'SELECT * FROM list_invitations WHERE invitee_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(auth.userId, 'unread').all<{
      id: string; list_id: string; list_title: string
      owner_username: string; owner_avatar_color: string | null
      owner_avatar_image: string | null; status: string; created_at: number
    }>(),
    env.DB.prepare(`
      SELECT f.id, f.requester_id,
             u.username AS requester_username,
             u.display_name AS requester_display_name,
             u.avatar_color AS requester_avatar_color,
             u.avatar_image AS requester_avatar_image,
             f.created_at
      FROM friendships f
      JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC LIMIT 20
    `).bind(auth.userId).all<{
      id: string; requester_id: string; requester_username: string
      requester_display_name: string | null; requester_avatar_color: string | null
      requester_avatar_image: string | null; created_at: number
    }>(),
    auth.isAdmin
      ? env.DB.prepare(`SELECT COUNT(*) AS cnt FROM invite_requests WHERE status = 'pending'`)
          .first<{ cnt: number }>()
      : Promise.resolve(null),
  ])

  return json({
    pokes: (pokesResult.results ?? []).map(r => ({
      id:                      r.id,
      senderId:                r.sender_id,
      senderUsername:          r.sender_username,
      senderDisplayName:       r.sender_display_name ?? r.sender_username,
      senderAvatarColor:       r.sender_avatar_color ?? '#10B981',
      senderAvatarImage:       r.sender_avatar_image ?? undefined,
      pokeMessageSnapshot:     r.poke_message_snapshot ?? undefined,
      status:                  r.status,
      createdAt:               r.created_at,
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
    friendRequests: (friendReqResult.results ?? []).map(r => ({
      id:                    r.id,
      requesterId:           r.requester_id,
      requesterUsername:     r.requester_username,
      requesterDisplayName:  r.requester_display_name ?? r.requester_username,
      requesterAvatarColor:  r.requester_avatar_color ?? '#10B981',
      requesterAvatarImage:  r.requester_avatar_image ?? undefined,
      createdAt:             r.created_at,
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
