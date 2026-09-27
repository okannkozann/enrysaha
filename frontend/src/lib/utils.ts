export { cn } from "cn";

/**
 * Converts a Turkish text into Title Case (Capitalizes the first letter of each word).
 * Properly handles Turkish characters (i -> İ, ı -> I, ş -> Ş, ç -> Ç, ğ -> Ğ, ü -> Ü, ö -> Ö).
 */
export function toTitleCaseTR(text: string = ''): string {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const firstChar = word.charAt(0).toLocaleUpperCase('tr-TR');
      const rest = word.slice(1).toLocaleLowerCase('tr-TR');
      return firstChar + rest;
    })
    .join(' ');
}
