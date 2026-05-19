import type { AuthUser } from './auth'

export function adminGuard(auth: AuthUser | null): Response | null {
  if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  if (!auth.isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  return null
}
