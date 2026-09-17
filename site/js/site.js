export function currentPath() {
  const path = location.pathname.replace(/index\.html$/, "") || "/";
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

export function markCurrent(nav) {
  const path = currentPath();
  for (const a of nav.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    if (href === path || (href === "/" && (path === "/" || path === "/index.html")) || href === location.pathname) {
      a.setAttribute("aria-current", "page");
    }
  }
}

if (typeof document !== "undefined") {
  const nav = document.querySelector("[data-nav]");
  if (nav) markCurrent(nav);
}
