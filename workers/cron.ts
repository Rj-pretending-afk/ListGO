/// <reference types="@cloudflare/workers-types" />

import type { Env } from './api'

export async function handleScheduled(_event: ScheduledEvent, env: Env): Promise<void> {
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000

  // Delete sessions for any lists that are about to be cleaned
  await env.DB.prepare(
    `DELETE FROM sessions WHERE list_id IN (
       SELECT id FROM lists WHERE owner_id IS NULL AND last_accessed_at < ?
     )`
  ).bind(cutoff).run()

  // Delete votes for anonymous lists being cleaned
  await env.DB.prepare(
    `DELETE FROM votes WHERE list_id IN (
       SELECT id FROM lists WHERE owner_id IS NULL AND last_accessed_at < ?
     )`
  ).bind(cutoff).run()

  const result = await env.DB.prepare(
    `DELETE FROM lists WHERE owner_id IS NULL AND last_accessed_at < ?`
  ).bind(cutoff).run()

  console.log(`Cron: cleaned ${result.meta.changes} anonymous lists older than 30 days`)
}
