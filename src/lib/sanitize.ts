/**
 * HTML Sanitization utilities for preventing XSS attacks
 *
 * Since we're running in Cloudflare Workers (not a browser environment),
 * we use a combination approach:
 * 1. HTML escaping for simple text content
 * 2. DOMPurify for more complex scenarios (if available)
 */

/**
 * Escape HTML special characters to prevent XSS
 * This is the primary defense for user-generated content
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize an object by escaping all string values
 * Useful for sanitizing entire data objects before rendering
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize a value for safe display in HTML
 * Returns escaped string or JSON representation
 */
export function sanitizeForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return escapeHtml(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object') {
    // For objects and arrays, convert to JSON and escape the result
    try {
      const jsonString = JSON.stringify(value, null, 2);
      return escapeHtml(jsonString);
    } catch (e) {
      return escapeHtml('[Object]');
    }
  }

  return escapeHtml(String(value));
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '#';
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '#';
    }
  }

  return escapeHtml(url);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove any HTML/script tags
  const cleaned = email.trim().replace(/<[^>]*>/g, '');

  // Basic email format check (for display purposes)
  if (cleaned.includes('@') && cleaned.length < 255) {
    return escapeHtml(cleaned);
  }

  return escapeHtml(email);
}
