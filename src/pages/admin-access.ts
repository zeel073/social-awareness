/**
 * Gate for `/admin`. Unlock lasts for this tab session only. The build embeds
 * a SHA-256 of ADMIN_KEY (see vite.config.ts); the raw key is never shipped.
 */

const UNLOCK = 'outreach.admin.unlock'

export function isAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK) === '1'
  } catch {
    return false
  }
}

export function markAdminUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK, '1')
  } catch {
    // Session storage is a convenience; unlock still works for this render.
  }
}

/** Hex SHA-256 of the given UTF-8 string (Web Crypto). */
export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** True when `key` matches the ADMIN_KEY this build was made with. */
export async function adminKeyMatches(key: string): Promise<boolean> {
  if (!key) return false
  return (await sha256Hex(key)) === __ADMIN_KEY_HASH__
}
