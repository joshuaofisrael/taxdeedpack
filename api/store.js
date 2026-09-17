import { SEEDED_REFERRAL_CODES } from "../shared/referrals.js";
import { createId, nowIso } from "../shared/ids.js";

export function sqliteDriver(db) {
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params = []) {
      db.prepare(sql).run(...params);
    },
    async all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    async get(sql, params = []) {
      return db.prepare(sql).get(...params) ?? null;
    },
  };
}

export function d1Driver(d1) {
  return {
    async exec(sql) {
      await d1.exec(sql);
    },
    async run(sql, params = []) {
      await d1.prepare(sql).bind(...params).run();
    },
    async all(sql, params = []) {
      const result = await d1.prepare(sql).bind(...params).all();
      return result.results || [];
    },
    async get(sql, params = []) {
      return (await d1.prepare(sql).bind(...params).first()) ?? null;
    },
  };
}

export function createStore(driver) {
  return {
    async migrate(schemaSql) {
      await driver.exec(schemaSql);
      for (const row of SEEDED_REFERRAL_CODES) {
        await driver.run(
          "INSERT OR IGNORE INTO referral_codes (code, partner_name, notes) VALUES (?, ?, ?)",
          [row.code, row.partnerName, row.notes],
        );
      }
    },

    async createOrder(data) {
      const id = data.id || createId("ord");
      const createdAt = data.createdAt || nowIso();
      await driver.run(
        `INSERT INTO orders (
          id, created_at, status, buyer_name, buyer_email, street, city, county, state, apn,
          referral_code, requested_sections, disclaimer_acknowledged, amount_cents, currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          createdAt,
          "pending_payment",
          data.buyerName,
          data.buyerEmail,
          data.street || "",
          data.city || "",
          data.county,
          data.state,
          data.apn || "",
          data.referralCode || "",
          JSON.stringify(data.requestedSections || []),
          data.disclaimerAcknowledged ? 1 : 0,
          data.amountCents,
          data.currency || "usd",
        ],
      );
      return this.getOrder(id);
    },

    async getOrder(id) {
      return mapOrder(await driver.get("SELECT * FROM orders WHERE id = ?", [id]));
    },

    async getOrderByStripeSession(sessionId) {
      return mapOrder(await driver.get("SELECT * FROM orders WHERE stripe_session_id = ?", [sessionId]));
    },

    async listOrders() {
      const rows = await driver.all("SELECT * FROM orders ORDER BY created_at DESC");
      return rows.map(mapOrder);
    },

    async attachStripeSession(orderId, sessionId) {
      await driver.run("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [sessionId, orderId]);
    },

    async markPaid(orderId, { paymentIntent, paidAt } = {}) {
      await driver.run(
        `UPDATE orders
         SET status = CASE WHEN status = 'fulfilled' THEN status ELSE 'paid' END,
             stripe_payment_intent = COALESCE(?, stripe_payment_intent),
             paid_at = COALESCE(paid_at, ?)
         WHERE id = ?`,
        [paymentIntent || null, paidAt || nowIso(), orderId],
      );
      return this.getOrder(orderId);
    },

    async markFulfilled(orderId, { emailStatus } = {}) {
      await driver.run(
        `UPDATE orders
         SET status = 'fulfilled', fulfilled_at = COALESCE(fulfilled_at, ?), email_status = ?, last_error = NULL
         WHERE id = ?`,
        [nowIso(), emailStatus || "sent", orderId],
      );
      return this.getOrder(orderId);
    },

    async markFulfillmentError(orderId, message) {
      await driver.run(
        "UPDATE orders SET status = 'fulfillment_error', last_error = ?, email_status = ? WHERE id = ?",
        [message, "error", orderId],
      );
      return this.getOrder(orderId);
    },

    async recordReferral({ code, orderId, amountCents, createdAt }) {
      if (!code) return null;
      const existing = await driver.get("SELECT * FROM referrals WHERE order_id = ?", [orderId]);
      if (existing) return existing;
      const id = createId("ref");
      await driver.run(
        "INSERT INTO referrals (id, code, order_id, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)",
        [id, code, orderId, amountCents, createdAt || nowIso()],
      );
      return driver.get("SELECT * FROM referrals WHERE id = ?", [id]);
    },

    async listReferrals() {
      return driver.all("SELECT * FROM referrals ORDER BY created_at DESC");
    },

    async listReferralCodes() {
      return driver.all("SELECT * FROM referral_codes ORDER BY code");
    },

    async referralStats() {
      const rows = await driver.all(
        `SELECT r.code, c.partner_name, COUNT(*) AS order_count, SUM(r.amount_cents) AS amount_cents
         FROM referrals r
         LEFT JOIN referral_codes c ON c.code = r.code
         GROUP BY r.code
         ORDER BY r.code`,
      );
      return rows.map((row) => ({
        code: row.code,
        partnerName: row.partner_name || "",
        orderCount: Number(row.order_count || 0),
        amountCents: Number(row.amount_cents || 0),
      }));
    },
  };
}

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    street: row.street,
    city: row.city,
    county: row.county,
    state: row.state,
    apn: row.apn,
    referralCode: row.referral_code,
    requestedSections: safeJson(row.requested_sections),
    disclaimerAcknowledged: Boolean(row.disclaimer_acknowledged),
    amountCents: row.amount_cents,
    currency: row.currency,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntent: row.stripe_payment_intent,
    paidAt: row.paid_at,
    fulfilledAt: row.fulfilled_at,
    emailStatus: row.email_status,
    lastError: row.last_error,
  };
}

function safeJson(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
