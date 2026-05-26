import type { AuthUser } from './auth'

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

const unauth   = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
const forbidden = () => new Response(JSON.stringify({ error: 'Forbidden' }),    { status: 403, headers: CORS })

/** Any admin (is_admin >= 1): invite request management */
export function adminGuard(auth: AuthUser | null): Response | null {
  if (!auth) return unauth()
  if (!auth.isAdmin) return forbidden()
  return null
}

/** Super-admin only (is_admin >= 2): full access */
export function superAdminGuard(auth: AuthUser | null): Response | null {
  if (!auth) return unauth()
  if (!auth.isSuperAdmin) return forbidden()
  return null
}
