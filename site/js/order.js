import { api } from "./config.js";

const form = document.getElementById("order-form");
const stateSelect = document.getElementById("state");
const checks = document.getElementById("section-checks");
const errors = document.getElementById("errors");
const gateNote = document.getElementById("gate-note");
const submit = document.getElementById("submit");

const params = new URLSearchParams(location.search);
if (params.get("canceled") === "1") {
  document.getElementById("canceled")?.removeAttribute("hidden");
}
if (params.get("ref")) {
  document.getElementById("referralCode").value = params.get("ref");
}

let catalog = null;

async function boot() {
  catalog = await api("/api/catalog");
  for (const jurisdiction of catalog.jurisdictions) {
    const option = document.createElement("option");
    option.value = jurisdiction.code;
    option.textContent = `${jurisdiction.name} (${jurisdiction.code})`;
    stateSelect.append(option);
  }
  renderSections(null);
  document.getElementById("disclaimer-text").textContent = catalog.disclaimer;
}

function renderSections(gate) {
  checks.innerHTML = "";
  for (const section of catalog.sections) {
    const rule = gate?.sections?.[section.id];
    const enabled = !rule || rule.enabled;
    const wrap = document.createElement("label");
    wrap.className = `check${enabled ? "" : " disabled"}`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "sections";
    input.value = section.id;
    input.checked = enabled && section.defaultSelected;
    input.disabled = !enabled;
    const copy = document.createElement("span");
    copy.innerHTML = `<strong>${section.shortLabel}</strong><small>${section.buyerFacingDescription}</small>`;
    if (rule?.note) {
      copy.innerHTML += `<small>${rule.note}</small>`;
    }
    wrap.append(input, copy);
    checks.append(wrap);
  }
}

stateSelect.addEventListener("change", async () => {
  if (!stateSelect.value) {
    gateNote.textContent = "";
    renderSections(null);
    return;
  }
  const gate = await api(`/api/jurisdiction/${stateSelect.value}`);
  gateNote.textContent = gate.policy;
  renderSections(gate);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errors.textContent = "";
  submit.disabled = true;
  const selected = [...form.querySelectorAll('input[name="sections"]:checked')].map((el) => el.value);
  try {
    const result = await api("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        buyerName: form.buyerName.value,
        buyerEmail: form.buyerEmail.value,
        street: form.street.value,
        city: form.city.value,
        county: form.county.value,
        state: form.state.value,
        apn: form.apn.value,
        referralCode: form.referralCode.value,
        requestedSections: selected,
        disclaimerAcknowledged: form.disclaimerAcknowledged.checked,
      }),
    });
    if (result.checkoutUrl) {
      location.href = result.checkoutUrl;
      return;
    }
    throw new Error("Checkout did not return a payment URL.");
  } catch (error) {
    errors.textContent = error.data?.errors?.join(" ") || error.message;
    submit.disabled = false;
  }
});

boot().catch((error) => {
  errors.textContent = error.message || "Could not load the order catalog.";
});
