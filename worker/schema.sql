CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  property_address TEXT,
  apn TEXT,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  sections TEXT NOT NULL,
  referral_code TEXT,
  amount_cents INTEGER NOT NULL,
  disclaimer_accepted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  fulfilled_at TEXT,
  pdf_generated_at TEXT,
  email_sent_at TEXT,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_referral_idx ON orders (referral_code);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (buyer_email);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS referrals_code_idx ON referrals (code);

CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  partner TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
