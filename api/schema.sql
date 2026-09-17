CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  partner_name TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  street TEXT,
  city TEXT,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  apn TEXT,
  referral_code TEXT,
  requested_sections TEXT NOT NULL,
  disclaimer_acknowledged INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  paid_at TEXT,
  fulfilled_at TEXT,
  email_status TEXT,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
