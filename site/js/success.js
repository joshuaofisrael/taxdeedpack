import { api } from "./config.js";

const params = new URLSearchParams(location.search);
const sessionId = params.get("session_id");
const testOrder = params.get("test_order");
const statusEl = document.getElementById("status");

async function boot() {
  if (!sessionId && !testOrder) {
    statusEl.textContent = "No checkout session was found. If you paid, email joshuaofisrael@gmail.com with your receipt.";
    return;
  }
  try {
    if (testOrder && !sessionId) {
      await api(`/api/test/pay/${testOrder}`, { method: "POST" });
    }
    const id = sessionId || `cs_test_local_${testOrder}`;
    const result = await api(`/api/checkout/session/${encodeURIComponent(id)}`);
    statusEl.innerHTML = `Order <strong>${result.orderId}</strong> is <strong>${result.status}</strong>. The research pack PDF is emailed to the buyer address on the order. This is an information and research product only.`;
  } catch (error) {
    statusEl.textContent = error.message || "We could not confirm this checkout yet. If you were charged, email joshuaofisrael@gmail.com.";
  }
}

boot();
