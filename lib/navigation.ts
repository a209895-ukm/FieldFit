export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

export function pageUrl(path: string) {
  return STATIC_DEMO ? `${import.meta.env.BASE_URL}#${path}` : path;
}

export function currentRoute() {
  return STATIC_DEMO
    ? window.location.hash.slice(1) || "/"
    : window.location.pathname;
}

export function assessmentUrl(path: string) {
  return new URL(pageUrl(path), window.location.origin).href;
}
