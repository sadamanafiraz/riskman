CREATE TABLE risk_guest_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  class_id TEXT NOT NULL REFERENCES risk_classes(id),
  group_id TEXT NOT NULL REFERENCES risk_groups(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
--> statement-breakpoint
CREATE INDEX risk_guest_sessions_group ON risk_guest_sessions(group_id);
