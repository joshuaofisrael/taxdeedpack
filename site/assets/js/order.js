(function () {
  const apiBase = (window.TAXDEEDPACK && window.TAXDEEDPACK.apiBase) || "";
  const form = document.getElementById("order-form");
  if (!form) return;

  const stateSelect = document.getElementById("state");
  const offeredBox = document.getElementById("offered-sections");
  const disabledBox = document.getElementById("disabled-sections");
  const notice = document.getElementById("jurisdiction-notice");
  const disclaimer = document.getElementById("disclaimer-text");
  const errorEl = document.getElementById("form-error");
  const submitBtn = document.getElementById("pay-button");

  disclaimer.textContent = window.JIV_DISCLAIMER;

  window.JIV_STATES.forEach(function (pair) {
    const opt = document.createElement("option");
    opt.value = pair[0];
    opt.textContent = pair[1];
    stateSelect.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("ref")) {
    form.referralCode.value = params.get("ref").toUpperCase();
  }
  if (params.get("canceled") === "1") {
    errorEl.textContent = "Payment was canceled. You can review the form and try again.";
  }

  function renderFallback(stateName) {
    offeredBox.innerHTML = "";
    disabledBox.innerHTML = "";
    window.JIV_RESEARCH.forEach(function (item) {
      offeredBox.appendChild(checkRow(item.id, item.label, true, "Public-record research offered in this state."));
    });
    window.JIV_DISABLED.forEach(function (item) {
      disabledBox.appendChild(checkRow(item.id, item.label, false, "Requires a licensed professional. Not offered."));
    });
    notice.textContent = stateName
      ? "Safer research-only default is shown until the API matrix loads. Licensed-service items stay disabled."
      : "Select a US state to load the jurisdiction safety gate.";
  }

  function checkRow(id, label, offered, reason) {
    const wrap = document.createElement("label");
    wrap.className = "check" + (offered ? "" : " disabled");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "sections";
    input.value = id;
    input.checked = offered;
    input.disabled = !offered;
    const text = document.createElement("span");
    text.innerHTML = "<strong>" + label + "</strong><br><small>" + reason + "</small>";
    wrap.appendChild(input);
    wrap.appendChild(text);
    return wrap;
  }

  async function loadMatrix(code) {
    if (!code) {
      renderFallback("");
      return;
    }
    try {
      const response = await fetch(apiBase + "/api/jurisdiction/" + code);
      if (!response.ok) throw new Error("matrix");
      const data = await response.json();
      offeredBox.innerHTML = "";
      disabledBox.innerHTML = "";
      data.offered.forEach(function (item) {
        offeredBox.appendChild(checkRow(item.id, item.title, true, item.reason));
      });
      data.disabled.forEach(function (item) {
        disabledBox.appendChild(checkRow(item.id, item.title, false, item.reason));
      });
      notice.textContent = data.extraNotice;
    } catch (err) {
      renderFallback(code);
    }
  }

  stateSelect.addEventListener("change", function () {
    loadMatrix(stateSelect.value);
  });
  renderFallback("");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorEl.textContent = "";
    submitBtn.disabled = true;
    const code = form.referralCode.value.trim().toUpperCase();
    submitBtn.textContent = code === "ADMINJ" ? "Submitting free test..." : "Opening Stripe Checkout...";

    const sections = Array.from(form.querySelectorAll('input[name="sections"]:checked:not(:disabled)')).map(
      function (input) { return input.value; },
    );

    const payload = {
      buyerName: form.buyerName.value.trim(),
      buyerEmail: form.buyerEmail.value.trim(),
      propertyAddress: form.propertyAddress.value.trim(),
      apn: form.apn.value.trim(),
      county: form.county.value.trim(),
      state: form.state.value,
      sections: sections,
      referralCode: form.referralCode.value.trim(),
      disclaimerAccepted: form.disclaimerAccepted.checked,
      disclaimerText: window.JIV_DISCLAIMER,
    };

    try {
      const referral = (payload.referralCode || "").trim().toUpperCase();
      if (referral === "ADMINJ") {
        const orderId = "JIV" + new Date().toISOString().slice(0,10).replace(/-/g, "") + Math.random().toString(36).slice(2,8).toUpperCase();
        const githubPayload = Object.assign({}, payload, {
          orderId: orderId,
          referralCode: "ADMINJ",
          disclaimerAcceptedAt: new Date().toISOString(),
        });
        const issueBody = [
          "ADMINJ free internal test order for Joshua Israel Ventures LLC.",
          "",
          "Delivery: PDF emailed only to joshuaofisrael@gmail.com after this issue is created.",
          "",
          "```json",
          JSON.stringify(githubPayload, null, 2),
          "```",
        ].join("\n");
        const title = "ADMINJ-ORDER " + orderId;
        const url =
          "https://github.com/joshuaofisrael/taxdeedpack/issues/new" +
          "?title=" + encodeURIComponent(title) +
          "&labels=" + encodeURIComponent("adminj-order") +
          "&body=" + encodeURIComponent(issueBody);
        window.location.href = "success.html?free=1&order_id=" + encodeURIComponent(orderId) + "&github=1&issue=" + encodeURIComponent(url);
        return;
      }

      const response = await fetch(apiBase + "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout could not start.");
      }
      window.location.href = data.url;
    } catch (error) {
      errorEl.textContent = error.message + " If this continues, write to joshuaofisrael@gmail.com.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay $149 with Stripe";
    }
  });
})();
