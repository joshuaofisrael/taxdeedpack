export function renderOpsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Operations | Joshua Israel Ventures LLC</title>
  <style>
    :root { font-family: Georgia, "Times New Roman", serif; color: #12202c; background: #f6f1e6; }
    body { margin: 0; }
    header { background: #0c1c2b; color: #f6f1e6; padding: 1.25rem 1.5rem; }
    header p { margin: 0.35rem 0 0; color: #d5c4a1; font-size: 0.95rem; }
    main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    h1, h2 { font-weight: 600; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin: 1rem 0 1.5rem; }
    .card { background: #fff; border: 1px solid #d8d0c0; padding: 1rem; }
    .card strong { display: block; font-size: 1.4rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; font-size: 0.92rem; }
    th, td { border-bottom: 1px solid #e4dccb; text-align: left; padding: 0.55rem 0.45rem; vertical-align: top; }
    th { background: #efe7d6; }
    button { font: inherit; background: #0c1c2b; color: #f6f1e6; border: 0; padding: 0.35rem 0.7rem; cursor: pointer; }
    .muted { color: #5c6570; }
    .err { color: #7a2430; }
  </style>
</head>
<body>
  <header>
    <h1>Operations</h1>
    <p>Joshua Israel Ventures LLC · Tax Deed Due Diligence Research Pack · authenticated view</p>
  </header>
  <main>
    <h2>Referral stats</h2>
    <div id="stats" class="cards"></div>
    <h2>Orders</h2>
    <div id="error" class="err"></div>
    <div style="overflow:auto">
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Status</th>
            <th>Buyer</th>
            <th>Property</th>
            <th>Referral</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="orders"></tbody>
      </table>
    </div>
  </main>
  <script>
    async function load() {
      const response = await fetch("/api/ops/summary", { credentials: "include" });
      if (response.status === 401) {
        document.getElementById("error").textContent = "Sign in required.";
        return;
      }
      const data = await response.json();
      const stats = document.getElementById("stats");
      const brenda = (data.referralStats || []).find((row) => row.code === "BRENDA" || row.code === "USTDS") || { orderCount: 0, amountCents: 0 };
      const total = (data.orders || []).length;
      const fulfilled = (data.orders || []).filter((o) => o.status === "fulfilled").length;
      stats.innerHTML = [
        card("Orders", total),
        card("Fulfilled", fulfilled),
        card("Brenda referrals", brenda.orderCount || 0),
        card("Brenda volume", money(brenda.amountCents || 0)),
      ].join("");
      document.getElementById("orders").innerHTML = (data.orders || []).map((order) => \`
        <tr>
          <td>\${esc(order.createdAt || "")}</td>
          <td>\${esc(order.status)}</td>
          <td>\${esc(order.buyerName)}<br><span class="muted">\${esc(order.buyerEmail)}</span></td>
          <td>\${esc([order.street, order.county, order.state, order.apn].filter(Boolean).join(", "))}</td>
          <td>\${esc(order.referralCode || "")}</td>
          <td>$\${(order.amountCents / 100).toFixed(0)}</td>
          <td><button data-id="\${esc(order.id)}" \${order.status === "pending_payment" ? "disabled" : ""}>Resend email</button></td>
        </tr>
      \`).join("");
    }
    function card(label, value) {
      return \`<div class="card"><strong>\${value}</strong><span class="muted">\${label}</span></div>\`;
    }
    function money(cents) { return "$" + (Number(cents) / 100).toFixed(0); }
    function esc(value) {
      return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }
    document.getElementById("orders").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-id]");
      if (!button) return;
      button.disabled = true;
      const response = await fetch("/api/ops/resend/" + button.dataset.id, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        document.getElementById("error").textContent = body.error || "Resend failed.";
      } else {
        document.getElementById("error").textContent = "Resent " + button.dataset.id;
        load();
      }
      button.disabled = false;
    });
    load();
  </script>
</body>
</html>`;
}
