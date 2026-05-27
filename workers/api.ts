/// <reference types="@cloudflare/workers-types" />

import { getAuth } from './middleware/auth'
import { handleRegister, handleLogin, handleMe, handleUpdateProfile, handleChangePassword, handleSearchUsers, handleGetUserProfile } from './routes/auth'
import { handleCreateList, handleGetUserLists, handleGetList, handleUpdateList, handleDeleteList, handleCollabUpdateModule } from './routes/lists'
import { handleCastVote } from './routes/votes'
import { handleClaimPreview, handleClaim } from './routes/claim'
import { handleAdminStats, handleAdminGetCodes, handleAdminGenerateCodes, handleAdminRevokeCode, handleAdminGetUsers, handleAdminGetUserLists, handleAdminSetDisplayName, handleAdminSetAdmin, handleAdminResetPassword, handleAdminDeleteUser, handleAdminDeleteList, handleAdminGetList } from './routes/admin'
import { handleCreateInviteRequest, handleAdminGetInviteRequests, handleAdminAcceptRequest, handleAdminRejectRequest, handleAdminGenerateUserInviteCode } from './routes/inviteRequests'
import { handleSendPoke, handleGetPokeInbox, handleMarkPokeRead } from './routes/pokes'
import { handleGetNotifications, handleMarkInvitationRead } from './routes/notifications'
import { handleJoinPresence, handleGetPresence, handleLeavePresence } from './routes/presence'
import { handleUploadImage, handleGetImage } from './routes/upload'
import { handleScheduled } from './cron'

export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  JWT_SECRET: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
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
    if (method === 'GET' && pathname === '/users/search') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleSearchUsers(request, auth, env, json)
    }
    const userProfileMatch = pathname.match(/^\/users\/([^/]+)\/profile$/)
    if (userProfileMatch && method === 'GET') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleGetUserProfile(userProfileMatch[1], auth, env, json, err)
    }

    // ── Lists ──
    if (method === 'POST' && pathname === '/lists') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleCreateList(request, auth, env, json, err)
    }
    if (method === 'GET' && pathname === '/lists') {
      const auth = await getAuth(request, env.JWT_SECRET)
      if (!auth) return err('Unauthorized', 401)
      return handleGetUserLists(auth, env, json)
    }
    const listIdMatch = pathname.match(/^\/lists\/([^/]+)$/)
    if (listIdMatch) {
      const id = listIdMatch[1]
      const auth = await getAuth(request, env.JWT_SECRET)
      if (method === 'GET')    return handleGetList(id, request, auth, env, json, err)
      if (method === 'PUT')    return handleUpdateList(id, request, auth, env, json, err)
      if (method === 'DELETE') return handleDeleteList(id, request, auth, env, json, err)
    }
    const collabModuleMatch = pathname.match(/^\/lists\/([^/]+)\/modules\/([^/]+)$/)
    if (collabModuleMatch && method === 'PATCH') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleCollabUpdateModule(collabModuleMatch[1], collabModuleMatch[2], request, auth, env, json, err)
    }

    // ── Votes ──
    const voteMatch = pathname.match(/^\/votes\/([^/]+)$/)
    if (voteMatch && method === 'POST') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleCastVote(voteMatch[1], request, auth, env, json, err)
    }

    // ── Claim ──
    if (pathname === '/claim/preview') {
      const auth = await getAuth(request, env.JWT_SECRET)
      if (!auth) return err('Unauthorized', 401)
      return handleClaimPreview(request, auth, env, json, err)
    }
    if (method === 'POST' && pathname === '/claim') {
      const auth = await getAuth(request, env.JWT_SECRET)
      if (!auth) return err('Unauthorized', 401)
      return handleClaim(request, auth, env, json, err)
    }

    // ── Admin ──
    if (method === 'GET' && pathname === '/admin/stats') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminStats(auth, env, json, err)
    }
    if (method === 'GET' && pathname === '/admin/invite-codes') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGetCodes(auth, env, json)
    }
    if (method === 'POST' && pathname === '/admin/invite-codes') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGenerateCodes(request, auth, env, json, err)
    }
    const revokeMatch = pathname.match(/^\/admin\/invite-codes\/([^/]+)$/)
    if (revokeMatch && method === 'DELETE') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminRevokeCode(revokeMatch[1], auth, env, json)
    }
    if (method === 'GET' && pathname === '/admin/users') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGetUsers(auth, env, json, err)
    }
    const userListsMatch = pathname.match(/^\/admin\/users\/([^/]+)\/lists$/)
    if (userListsMatch && method === 'GET') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGetUserLists(userListsMatch[1], auth, env, json, err)
    }
    const adminUserMatch = pathname.match(/^\/admin\/users\/([^/]+)$/)
    if (adminUserMatch && method === 'DELETE') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminDeleteUser(adminUserMatch[1], auth, env, json, err)
    }
    const adminDisplayNameMatch = pathname.match(/^\/admin\/users\/([^/]+)\/displayname$/)
    if (adminDisplayNameMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminSetDisplayName(adminDisplayNameMatch[1], request, auth, env, json, err)
    }
    const adminAdminMatch = pathname.match(/^\/admin\/users\/([^/]+)\/admin$/)
    if (adminAdminMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminSetAdmin(adminAdminMatch[1], request, auth, env, json, err)
    }
    const adminPasswordMatch = pathname.match(/^\/admin\/users\/([^/]+)\/password$/)
    if (adminPasswordMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminResetPassword(adminPasswordMatch[1], request, auth, env, json, err)
    }
const adminListMatch = pathname.match(/^\/admin\/lists\/([^/]+)$/)
    if (adminListMatch) {
      const auth = await getAuth(request, env.JWT_SECRET)
      if (method === 'GET')    return handleAdminGetList(adminListMatch[1], auth, env, json, err)
      if (method === 'DELETE') return handleAdminDeleteList(adminListMatch[1], auth, env, json, err)
    }

    // ── Invite Requests ──
    if (method === 'POST' && pathname === '/invite-request') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleCreateInviteRequest(auth, env, json, err)
    }
    if (method === 'GET' && pathname === '/admin/invite-requests') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGetInviteRequests(auth, env, json, err)
    }
    const inviteReqMatch = pathname.match(/^\/admin\/invite-requests\/([^/]+)\/(accept|reject)$/)
    if (inviteReqMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      if (inviteReqMatch[2] === 'accept') return handleAdminAcceptRequest(inviteReqMatch[1], auth, env, json, err)
      return handleAdminRejectRequest(inviteReqMatch[1], auth, env, json, err)
    }
    const adminUserInviteCodeMatch = pathname.match(/^\/admin\/users\/([^/]+)\/invite-code$/)
    if (adminUserInviteCodeMatch && method === 'POST') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleAdminGenerateUserInviteCode(adminUserInviteCodeMatch[1], auth, env, json, err)
    }

    // ── Notifications (pokes + list invitations) ──
    if (method === 'GET' && pathname === '/notifications') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleGetNotifications(auth, env, json, err)
    }
    const invitationReadMatch = pathname.match(/^\/list-invitations\/([^/]+)\/read$/)
    if (invitationReadMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleMarkInvitationRead(invitationReadMatch[1], auth, env, json, err)
    }

    // ── Pokes ──
    if (method === 'POST' && pathname === '/pokes') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleSendPoke(request, auth, env, json, err)
    }
    if (method === 'GET' && pathname === '/pokes/inbox') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleGetPokeInbox(auth, env, json, err)
    }
    const pokeReadMatch = pathname.match(/^\/pokes\/([^/]+)\/read$/)
    if (pokeReadMatch && method === 'PUT') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleMarkPokeRead(pokeReadMatch[1], auth, env, json, err)
    }

    // ── Upload ──
    if (method === 'POST' && pathname === '/upload/image') {
      const auth = await getAuth(request, env.JWT_SECRET)
      return handleUploadImage(request, auth, env, json, err)
    }
    const imageKeyMatch = pathname.match(/^\/images\/(.+)$/)
    if (imageKeyMatch && method === 'GET') {
      return handleGetImage(imageKeyMatch[1], env)
    }

    // ── Presence ──
    const presenceMatch = pathname.match(/^\/presence\/([^/]+)$/)
    if (presenceMatch) {
      const listId = presenceMatch[1]
      const auth = await getAuth(request, env.JWT_SECRET)
      if (method === 'POST')   return handleJoinPresence(listId, request, auth, env, json)
      if (method === 'GET')    return handleGetPresence(listId, env, json)
      if (method === 'DELETE') return handleLeavePresence(listId, request, auth, env, json)
    }

    return err('Not found', 404)
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(event, env)
  },
}
