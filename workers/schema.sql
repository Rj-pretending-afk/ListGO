CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#10B981',
  avatar_image TEXT,
  theme TEXT DEFAULT 'day',
  invite_codes_remaining INTEGER DEFAULT 1,
  poke_message TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  owner_id TEXT,
  used_by_id TEXT,
  used_at INTEGER,
  revoked INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (used_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  owner_id TEXT,
  owner_token TEXT,
  permission TEXT DEFAULT 'public',
  invited_usernames TEXT,
  version INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER,
  last_accessed_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS votes (
  vote_module_id TEXT,
  list_id TEXT,
  user_id TEXT,
  option_ids TEXT,
  voted_at INTEGER,
  PRIMARY KEY (vote_module_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  user_id TEXT,
  list_id TEXT,
  color TEXT,
  display_name TEXT,
  is_anonymous INTEGER DEFAULT 0,
  last_seen INTEGER,
  PRIMARY KEY (user_id, list_id)
);

CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_token ON lists(owner_token);
CREATE INDEX IF NOT EXISTS idx_lists_anon_cleanup ON lists(last_accessed_at) WHERE owner_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_invite_owner ON invite_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_list ON sessions(list_id);

-- Invite code requests: user asks admin for a new invite code (administrative flow)
CREATE TABLE IF NOT EXISTS invite_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_invite_requests_status ON invite_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_invite_requests_requester ON invite_requests(requester_id);

-- Pokes: social notification system (user-to-user, independent of invite flow)
CREATE TABLE IF NOT EXISTS pokes (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_pokes_recipient ON pokes(recipient_id, status);
