import { customAlphabet } from 'nanoid'

const KEY = 'listgo_owner_token'
const gen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', 16)

export function getOwnerToken(): string {
  let token = localStorage.getItem(KEY)
  if (!token) { token = gen(); localStorage.setItem(KEY, token) }
  return token
}

export function clearOwnerToken() {
  localStorage.removeItem(KEY)
}
