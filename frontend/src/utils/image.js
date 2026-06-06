export function resolveImageUrl(url) {
  if (!url) return url;
  // Data URLs or absolute URLs -> return as-is
  if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url;

  // Relative path -> prefix with VITE_API_URL if provided, otherwise use current origin
  const apiRoot = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : window.location.origin;

  // Ensure leading slash
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${apiRoot}${path}`;
}
