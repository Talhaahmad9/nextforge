-- ────────────────────────────────────────────────────────────────────────────────
-- Supabase variant: required database tables.
-- Run this SQL in your Supabase project's SQL Editor before starting the app.
-- ────────────────────────────────────────────────────────────────────────────────

-- ── Users table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password        TEXT,                            -- NULL for OAuth-only users
  image           TEXT,
  role            TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified  BOOLEAN DEFAULT FALSE,
  provider        TEXT DEFAULT 'credentials',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── OTPs table ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS otps (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL,
  hashed_otp  TEXT NOT NULL,
  purpose     TEXT NOT NULL CHECK (purpose IN ('email-verification', 'password-reset')),
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);

-- ── Auto-update updated_at on users ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── Periodic OTP cleanup (optional — requires pg_cron extension) ─────────────
-- Uncomment the line below if you have pg_cron enabled in your Supabase project:
-- SELECT cron.schedule('cleanup-expired-otps', '*/15 * * * *', $$DELETE FROM otps WHERE expires_at < NOW()$$);
