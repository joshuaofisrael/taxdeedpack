(function () {
  const apiBase = (window.TAXDEEDPACK && window.TAXDEEDPACK.apiBase) || "";
  const tokenInput = document.getElementById("ops-token");
  const loadBtn = document.getElementById("ops-load");
  const ordersEl = document.getElementById("ops-orders");
  const refsEl = document.getElementById("ops-referrals");
  const errorEl = document.getElementById("ops-error");

  if (!tokenInput) return;
  tokenInput.value = sessionStorage.getItem("jiv_ops_token") || "";

  async function api(path, options) {
    const token = tokenInput.value.trim();
    sessionStorage.setItem("jiv_ops_token", token);
    const response = await fetch(apiBase + path, Object.assign({
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    }, options || {}));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Ops request failed.");
    return data;
  }

  function money(cents) {
    return "$" + (Number(cents || 0) / 100).toFixed(2);
  }

  async function resend(orderId) {
    errorEl.textContent = "";
    try {
      const data = await api("/api/ops/resend", {
        method: "POST",
        body: JSON.stringify({ orderId: orderId }),
      });
      errorEl.textContent = data.emailed
        ? "Email resent for " + orderId + "."
        : "Regenerated " + orderId + " but email was not sent. " + (data.order.lastError || "");
      await load();
    } catch (error) {
      errorEl.textContent = error.message;
    }
  }

  async function load() {
    errorEl.textContent = "";
    try {
      const [orders, referrals] = await Promise.all([
        api("/api/ops/orders"),
        api("/api/ops/referrals"),
      ]);

      const brenda = (referrals.totals || []).find(function (row) { return row.code === "BRENDA"; });
      refsEl.innerHTML =
        "<p><strong>Brenda / US Tax Deed Solutions</strong><br>" +
        "Orders: " + (brenda ? brenda.order_count : 0) +
        " · Volume: " + money(brenda ? brenda.total_cents : 0) +
        " · Last: " + (brenda && brenda.last_at ? brenda.last_at : "none") +
        "</p>" +
        "<div class='table-wrap'><table><thead><tr><th>Code</th><th>Order</th><th>Amount</th><th>Time</th></tr></thead><tbody>" +
        (referrals.events || []).map(function (row) {
          return "<tr><td>" + row.code + "</td><td>" + row.order_id + "</td><td>" + money(row.amount_cents) + "</td><td>" + row.created_at + "</td></tr>";
        }).join("") +
        "</tbody></table></div>";

      ordersEl.innerHTML =
        "<div class='table-wrap'><table><thead><tr><th>Order</th><th>Status</th><th>Buyer</th><th>Property</th><th>State</th><th>Referral</th><th>Paid</th><th></th></tr></thead><tbody>" +
        (orders.orders || []).map(function (order) {
          return "<tr>" +
            "<td>" + order.id + "</td>" +
            "<td><span class='badge " + order.status + "'>" + order.status + "</span></td>" +
            "<td>" + order.buyerEmail + "</td>" +
            "<td>" + order.property + "</td>" +
            "<td>" + order.state + "</td>" +
            "<td>" + (order.referralCode || "") + "</td>" +
            "<td>" + money(order.amountCents) + "</td>" +
            "<td><button class='btn btn-navy' data-resend='" + order.id + "'>Resend email</button></td>" +
            "</tr>";
        }).join("") +
        "</tbody></table></div>";

      Array.from(ordersEl.querySelectorAll("[data-resend]")).forEach(function (btn) {
        btn.addEventListener("click", function () {
          resend(btn.getAttribute("data-resend"));
        });
      });
    } catch (error) {
      errorEl.textContent = error.message;
    }
  }

  loadBtn.addEventListener("click", load);
})();
