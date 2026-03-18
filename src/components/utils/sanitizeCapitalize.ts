export function sanitizeAndCapitalize(input: string): string {
  if (!input) return "";

  let sanitized = input.trim().replace(/\s+/g, " ");

  sanitized = sanitized.replace(/[^a-zA-Z0-9 ]/g, "");

  return sanitized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}



export const sanitize = (text: string): string => {
  if (!text) return "";

  // 1. Replace '-' with space
  const withSpaces = text.replace(/-/g, " ");

  // 2. Capitalize each word
  const capitalized = withSpaces
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return capitalized;
};