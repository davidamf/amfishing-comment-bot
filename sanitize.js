/**
 * sanitize.js
 * Input sanitization utilities for A.M. Fishing comment bot.
 * Protects against prompt injection, oversized strings, and malformed data.
 */

/**
 * Sanitize a comment/text string before processing or sending to AI.
 * - Trims whitespace
 * - Caps length to prevent memory issues and prompt injection via massive strings
 * - Strips null bytes and control characters (except newlines/tabs)
 * - Removes common prompt injection patterns
 */
function sanitizeText(text, maxLength = 2000) {
  if (typeof text !== "string") return "";

  return text
    .trim()
    // Remove null bytes and other control characters except \n and \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip prompt injection attempts (common patterns)
    .replace(/\bignore (all )?(previous|prior|above) instructions?\b/gi, "")
    .replace(/\bsystem prompt\b/gi, "")
    .replace(/\b(act|pretend|roleplay|jailbreak) as\b/gi, "")
    .replace(/\byou are now\b/gi, "")
    // Cap length
    .slice(0, maxLength);
}

/**
 * Sanitize a user name or identifier.
 * - Only allow printable ASCII + common Unicode name characters
 * - Cap at 100 chars
 */
function sanitizeName(name, maxLength = 100) {
  if (typeof name !== "string") return "Unknown";
  return name
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, maxLength);
}

/**
 * Sanitize an email address string.
 * - Basic format check
 * - Strip anything that looks like an injection
 */
function sanitizeEmail(email, maxLength = 254) {
  if (typeof email !== "string") return "";
  const trimmed = email.trim().toLowerCase().slice(0, maxLength);
  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "";
  return trimmed;
}

/**
 * Sanitize an order number - only digits allowed.
 */
function sanitizeOrderNumber(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\D/g, "").slice(0, 10);
}

module.exports = { sanitizeText, sanitizeName, sanitizeEmail, sanitizeOrderNumber };
