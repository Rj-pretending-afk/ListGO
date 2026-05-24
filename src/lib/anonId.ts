import { nanoid } from 'nanoid'

const KEY = 'listgo_anon_voter_id'

// Returns a stable anonymous voter ID for this browser.
// Created once and stored in localStorage; survives page reloads.
export function getAnonVoterId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = nanoid(16)
    localStorage.setItem(KEY, id)
  }
  return id
}
