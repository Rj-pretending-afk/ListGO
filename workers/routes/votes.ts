/// <reference types="@cloudflare/workers-types" />

import type { Env } from '../api'
import type { AuthUser } from '../middleware/auth'

type JsonFn = (data: unknown, status?: number) => Response
type ErrFn  = (message: string, status: number) => Response

interface VoteModuleData {
  id: string
  type: string
  votes?: Record<string, string[]>
  multiSelect?: boolean
}

interface ListData {
  modules?: VoteModuleData[]
}

// ── POST /votes/:moduleId ──
// Body: { listId, optionIds, anonymousId? }
// Auth: JWT optional — anonymous users supply anonymousId
export async function handleCastVote(
  moduleId: string,
  request: Request,
  auth: AuthUser | null,
  env: Env,
  json: JsonFn,
  err: ErrFn
): Promise<Response> {
  let body: { listId?: string; optionIds?: unknown; anonymousId?: string }
  try { body = await request.json() as typeof body } catch { return err('Invalid JSON', 400) }

  const { listId, optionIds, anonymousId } = body
  if (!listId || !Array.isArray(optionIds)) return err('listId and optionIds required', 400)

  const voterId = auth?.userId ?? anonymousId
  if (!voterId) return err('anonymousId required for unauthenticated requests', 400)

  // Fetch list
  const row = await env.DB.prepare(
    'SELECT data, permission, version FROM lists WHERE id = ?'
  ).bind(listId).first<{ data: string; permission: string; version: number }>()
  if (!row) return err('List not found', 404)

  // Permission check
  if (row.permission === 'private') return err('Forbidden', 403)
  if (row.permission === 'verified' && !auth) return err('Login required', 401)
  if (row.permission === 'invite_only' && !auth) return err('Login required', 401)

  // Find the vote module
  const listData = JSON.parse(row.data) as ListData
  const module = listData.modules?.find(m => m.id === moduleId && m.type === 'vote')
  if (!module) return err('Vote module not found', 404)

  // Update votes atomically
  const votes: Record<string, string[]> = { ...(module.votes ?? {}) }
  const ids = optionIds as string[]
  if (ids.length === 0) {
    delete votes[voterId]
  } else {
    votes[voterId] = module.multiSelect ? ids : [ids[0]]
  }
  module.votes = votes

  const now = Date.now()
  await env.DB.prepare(
    'UPDATE lists SET data = ?, version = version + 1, updated_at = ? WHERE id = ?'
  ).bind(JSON.stringify(listData), now, listId).run()

  const updated = await env.DB.prepare('SELECT version FROM lists WHERE id = ?').bind(listId).first<{ version: number }>()
  return json({ ok: true, votes, version: updated?.version ?? row.version + 1 })
}
