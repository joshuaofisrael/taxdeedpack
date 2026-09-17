import { createApp } from "./app.js";
import { createMailer } from "./mailer.js";
import { createStore, d1Driver } from "./store.js";
import { SCHEMA_SQL } from "./schema.js";

const stores = new WeakMap();

export default {
  async fetch(request, env, ctx) {
    const store = await getStore(env);
    const mailer = createMailer(env);
    const app = createApp({ store, mailer, env });
    return app.fetch(request, env, ctx);
  },
};

async function getStore(env) {
  if (stores.has(env)) return stores.get(env);
  const store = createStore(d1Driver(env.DB));
  await store.migrate(SCHEMA_SQL);
  stores.set(env, store);
  return store;
}
