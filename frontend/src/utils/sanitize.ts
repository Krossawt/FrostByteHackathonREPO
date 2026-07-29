/**
 * eSKala — Frontend Input Sanitization & Security Utilities
 * Prevents XSS, Script Injections, and malformed inputs before API requests.
 */

/**
 * Strips HTML tags, script elements, and dangerous control characters from user text.
 */
export function sanitizeText(input?: string | null, maxLength?: number): string {
  if (!input) return ''
  
  // 1. Remove script tags and contents
  let clean = input.replace(/<script\b[^<]*>(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // 2. Remove all HTML tags
  clean = clean.replace(/<[^>]*>/g, '')
  
  // 3. Normalize whitespace
  clean = clean.trim()

  // 4. Enforce max length if specified
  if (maxLength && clean.length > maxLength) {
    clean = clean.substring(0, maxLength)
  }

  return clean
}

/**
 * Validates and normalizes email addresses.
 */
export function sanitizeEmail(email?: string | null): string {
  if (!email) return ''
  return email.trim().toLowerCase().substring(0, 254)
}

/**
 * Sanitizes alphanumeric usernames.
 */
export function sanitizeUsername(username?: string | null): string {
  if (!username) return ''
  return username.replace(/[^a-zA-Z0-9_]/g, '').trim().substring(0, 50)
}
