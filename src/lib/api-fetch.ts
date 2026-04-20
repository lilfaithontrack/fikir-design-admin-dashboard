/**
 * Browser fetch with cookies (JWT session) for same-origin API routes.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { credentials: 'include', ...init })
}
