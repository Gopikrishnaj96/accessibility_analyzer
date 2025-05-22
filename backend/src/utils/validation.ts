/**
 * Validates if a string is a properly formatted URL
 * @param str - The string to validate
 * @returns boolean indicating if string is a valid URL
 */
export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};