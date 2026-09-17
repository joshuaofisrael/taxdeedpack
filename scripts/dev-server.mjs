import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import Database from "better-sqlite3";
import { createApp } from "../api/app.js";
import { createMailer } from "../api/mailer.js";
import { createStore, sqliteDriver } from "../api/store.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const siteDir = join(root, "site");
const schemaSql = readFileSync(join(root, "api/schema.sql"), "utf8");

const env = {
  SITE_URL: process.env.SITE_URL || "http://127.0.0.1:8787",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "http://127.0.0.1:8787",
  ALLOW_TEST_CHECKOUT: process.env.ALLOW_TEST_CHECKOUT || "1",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  OPS_PASSWORD: process.env.OPS_PASSWORD || "local-ops",
  COOKIE_SECURE: "",
  MAIL_FROM: process.env.MAIL_FROM || "Joshua Israel Ventures LLC <reports@taxdeedpack.com>",
  OPS_EMAIL: "joshuaofisrael@gmail.com",
};

const db = new Database(process.env.SQLITE_PATH || join(root, "tmp-dev.sqlite"));
const store = createStore(sqliteDriver(db));
await store.migrate(schemaSql);
const mailer = createMailer(env);
const api = createApp({ store, mailer, env });

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const app = new Hono();
app.route("/", api);

app.get("/*", (c) => {
  const url = new URL(c.req.url);
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = normalize(join(siteDir, rel));
  if (!filePath.startsWith(siteDir) || !existsSync(filePath)) {
    return c.text("Not found", 404);
  }
  const body = readFileSync(filePath);
  return new Response(body, {
    headers: { "Content-Type": types[extname(filePath)] || "application/octet-stream" },
  });
});

const port = Number(process.env.PORT || 8787);
console.log(`Tax Deed Pack local server on http://127.0.0.1:${port}`);
console.log(`Ops: http://127.0.0.1:${port}/ops  (password ${env.OPS_PASSWORD})`);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" });
