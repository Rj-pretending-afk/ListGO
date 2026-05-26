import type { AuthUser } from './auth'

const unauth  = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
const forbidden = () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

/** Any admin (is_admin >= 1): invite request management */
export function adminGuard(auth: AuthUser | null): Response | null {
  if (!auth) return unauth()
  if (!auth.isAdmin) return forbidden()
  return null
}

/** Super-admin only (is_admin == 2): full access */
export function superAdminGuard(auth: AuthUser | null): Response | null {
  if (!auth) return unauth()
  if (!auth.isSuperAdmin) return forbidden()
  return null
}
