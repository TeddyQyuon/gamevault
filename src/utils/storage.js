// Safe localStorage helpers — recover gracefully from missing/malformed data.

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full / private mode — demo still works in memory.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

export const KEYS = {
  CART: 'gv_cart_v1',
  WISHLIST: 'gv_wishlist_v1',
  RECENT: 'gv_recent_v1',
}

/** Clears browser-local shop state (cart, wishlist, recently viewed).
 * Orders, codes and subscriptions live in MySQL — use the API, not this. */
export function resetDemoData() {
  Object.values(KEYS).forEach(removeKey)
  // One-time cleanup of keys from the old mock milestone, if present.
  ;['gv_orders_v1', 'gv_subs_v1', 'gv_session_v1', 'gv_profile_v1'].forEach(removeKey)
}
