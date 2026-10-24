(function () {
  const cfg = window.TAXDEEDPACK || {};
  const paymentLink = cfg.paymentLink || "";
  const intakeEndpoint = cfg.intakeEndpoint || "";
  const INTERNAL_CODE_SHA256 = "d623bcdd29ef476a9bb079f617a4ac1a580e0ace2009e324f982ae9d43969f84";

  async function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return "";
    const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function makeOrderId() {
    return "TDP" + new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function sendIntake(payload, orderId) {
    if (!intakeEndpoint) return;
    const body = {
      _subject: "Tax Deed Pack order intake " + orderId + " (awaiting Stripe payment)",
      _template: "table",
      _captcha: "false",
      _honey: "",
      order_id: orderId,
      buyer_name: payload.buyerName,
      buyer_email: payload.buyerEmail,
      property_address: payload.propertyAddress,
      apn: payload.apn,
      county: payload.county,
      state: payload.state,
      sections: payload.sections.join(", "),
      referral_code: payload.referralCode,
      limitations_acknowledged: payload.disclaimerAccepted ? "yes" : "no",
      agreement_accepted: payload.agreementAccepted ? "yes (Property Research Services Agreement, Florida law)" : "no",
      accepted_at: new Date().toISOString(),
      page: window.location.href,
    };
    const ctrl = window.AbortController ? new AbortController() : null;
    const timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);
    try {
      await fetch(intakeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined,
      });
    } catch (err) {
      // Intake copy is best effort; Stripe custom fields also capture the property and county.
    } finally {
      clearTimeout(timer);
    }
  }
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
  function clean(v, max) {
    return String(v || "").replace(/[<>]/g, "").trim().slice(0, max);
  }
  if (params.get("county") && !form.county.value) {
    form.county.value = clean(params.get("county"), 60);
  }
  if (params.get("state")) {
    const code = clean(params.get("state"), 2).toUpperCase();
    if (window.JIV_STATES.some(function (pair) { return pair[0] === code; })) {
      stateSelect.value = code;
    }
  }
  if (params.get("apn") && !form.apn.value) {
    form.apn.value = clean(params.get("apn"), 60);
  }
  if (params.get("address") && !form.propertyAddress.value) {
    form.propertyAddress.value = clean(params.get("address"), 160);
  }
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
      ? "Research-only sections are shown. Licensed-service items stay disabled in every state."
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

  function loadMatrix(code) {
    renderFallback(code);
  }

  stateSelect.addEventListener("change", function () {
    loadMatrix(stateSelect.value);
  });
  renderFallback(stateSelect.value || "");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorEl.textContent = "";
    if (form.website && form.website.value) return; // honeypot

    if (!form.propertyAddress.value.trim() && !form.apn.value.trim()) {
      errorEl.textContent = "Enter the property address or the APN / parcel ID.";
      return;
    }
    if (!form.disclaimerAccepted.checked || !form.agreementAccepted.checked) {
      errorEl.textContent = "Please accept both the Important Limitations and the Property Research Services Agreement.";
      return;
    }

    submitBtn.disabled = true;
    const code = form.referralCode.value.trim().toUpperCase();
    const isInternal = code && (await sha256Hex(code)) === INTERNAL_CODE_SHA256;
    submitBtn.textContent = isInternal ? "Submitting free test..." : "Opening Stripe Checkout...";

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
      referralCode: code,
      disclaimerAccepted: form.disclaimerAccepted.checked,
      agreementAccepted: form.agreementAccepted.checked,
      disclaimerText: window.JIV_DISCLAIMER,
    };

    try {
      if (isInternal) {
        const orderId = "JIV" + new Date().toISOString().slice(0,10).replace(/-/g, "") + Math.random().toString(36).slice(2,8).toUpperCase();
        const githubPayload = Object.assign({}, payload, {
          orderId: orderId,
          referralCode: code,
          disclaimerAcceptedAt: new Date().toISOString(),
        });
        const issueBody = [
          code + " free internal test order for Joshua Israel Ventures LLC.",
          "",
          "Delivery: PDF emailed only to joshuaofisrael@gmail.com after this issue is created.",
          "",
          "```json",
          JSON.stringify(githubPayload, null, 2),
          "```",
        ].join("\n");
        const title = code + "-ORDER " + orderId;
        const url =
          "https://github.com/joshuaofisrael/taxdeedpack/issues/new" +
          "?title=" + encodeURIComponent(title) +
          "&labels=" + encodeURIComponent(code.toLowerCase() + "-order") +
          "&body=" + encodeURIComponent(issueBody);
        window.location.href = "success.html?free=1&order_id=" + encodeURIComponent(orderId) + "&github=1&issue=" + encodeURIComponent(url);
        return;
      }

      if (!paymentLink) throw new Error("Checkout is not available right now.");
      const orderId = makeOrderId();
      await sendIntake(payload, orderId);
      const ref = (orderId + (code ? "_" + code : "")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 200);
      const target = paymentLink +
        "?prefilled_email=" + encodeURIComponent(payload.buyerEmail) +
        "&client_reference_id=" + encodeURIComponent(ref);
      window.location.href = target;
    } catch (error) {
      errorEl.textContent = error.message + " If this continues, please use our contact form at taxdeedpack.com/contact/.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay $149 with Stripe";
    }
  });
})();
