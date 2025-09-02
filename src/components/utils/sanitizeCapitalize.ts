export function sanitizeAndCapitalize(input: string): string {
  if (!input) return "";

  let sanitized = input.trim().replace(/\s+/g, " ");

  sanitized = sanitized.replace(/[^a-zA-Z0-9 ]/g, "");

  return sanitized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
