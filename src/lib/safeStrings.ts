/**
 * Defensive String Utilities for Fahads Tutorial SSP System
 * Guarantees zero crashes from null or undefined values.
 */

export function safeLower(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase();
}

export function safeUpper(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).toUpperCase();
}

export function safeTrim(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function safeIncludes(haystack: unknown, needle: unknown): boolean {
  return safeLower(haystack).includes(safeLower(needle));
}

export function safeInitial(val: unknown, fallback: string = 'A'): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : fallback;
}
