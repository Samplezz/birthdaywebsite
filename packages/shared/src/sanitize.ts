/**
 * Strips HTML tags and dangerous characters to prevent XSS.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/[&<>"'/]/g, (match) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
      };
      return map[match] || match;
    })
    .trim();
}
