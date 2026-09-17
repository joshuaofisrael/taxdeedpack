const local = ["localhost", "127.0.0.1"].includes(location.hostname);

export const API_BASE = local
  ? ""
  : (document.documentElement.dataset.apiBase || "https://api.taxdeedpack.com");

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.errors?.join(" ") || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
