/// <reference types="@cloudflare/workers-types" />

import { getAuth } from './middleware/auth'
import { handleRegister, handleLogin, handleMe, handleUpdateProfile, handleChangePassword } from './routes/auth'

export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  JWT_SECRET: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

export function err(message: string, status: number): Response {
  return json({ error: message }, status)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const { pathname } = url
    const method = request.method

    // ── Auth ──
    if (method === 'POST' && pathname === '/auth/register') {
      return handleRegister(request, env, json, err)
    }
    if (method === 'POST' && pathname === '/auth/login') {
      return handleLogin(request, env, json, err)
    }
    if (method === 'GET' && pathname === '/auth/me') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleMe(auth, env, json, err)
    }
    if (method === 'PUT' && pathname === '/auth/profile') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleUpdateProfile(request, auth, env, json, err)
    }
    if (method === 'PUT' && pathname === '/auth/password') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleChangePassword(request, auth, env, json, err)
    }

    // ── Lists (Day 5) ──
    // ── Admin (Day 7) ──
    // ── Claim (Day 6) ──

    return err('Not found', 404)
  },
}
