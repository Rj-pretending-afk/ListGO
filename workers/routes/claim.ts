/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

// ── GET /claim/preview?ownerToken=xxx ──
export async function handleClaimPreview(
  request: Request, auth: AuthUser, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  const ownerToken = new URL(request.url).searchParams.get('ownerToken')
  if (!ownerToken) return err('ownerToken required', 400)

  const rows = await env.DB.prepare(
    'SELECT id, title, updated_at FROM lists WHERE owner_token = ? AND owner_id IS NULL'
  ).bind(ownerToken).all<{ id: string; title: string; updated_at: number }>()

  return json(rows.results ?? [])
}

// ── POST /claim ──
export async function handleClaim(
  request: Request, auth: AuthUser, env: Env, json: JsonFn, err: ErrFn
): Promise<Response> {
  let body: { ownerToken?: string; listIds?: string[] }
  try { body = await request.json() } catch { return err('Invalid JSON', 400) }

  const { ownerToken, listIds } = body
  if (!ownerToken) return err('ownerToken required', 400)

  if (listIds && listIds.length > 0) {
    const placeholders = listIds.map(() => '?').join(', ')
    await env.DB.prepare(
      `UPDATE lists SET owner_id = ?, owner_token = NULL
       WHERE owner_token = ? AND owner_id IS NULL AND id IN (${placeholders})`
    ).bind(auth.userId, ownerToken, ...listIds).run()
  } else {
    await env.DB.prepare(
      'UPDATE lists SET owner_id = ?, owner_token = NULL WHERE owner_token = ? AND owner_id IS NULL'
    ).bind(auth.userId, ownerToken).run()
  }

  return json({ ok: true })
}
