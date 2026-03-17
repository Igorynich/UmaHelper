/**
 * Normalizes a string for name matching by removing special characters.
 * Removes: - _ . , # and spaces
 * @param str The string to normalize
 * @returns Normalized lowercase string without special chars
 */
export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_.,#\s]/g, '');
}

/**
 * Checks if a name matches the filter string with enhanced matching:
 * - Splits by '&' or '+' to allow multiple search terms (OR logic)
 * - Normalizes special characters (- _ . , # spaces) for flexible matching
 *
 * Examples:
 * - 'kita&sato&rice' matches 'Kitasan Black', 'Satono Diamond', 'Rice Shower'
 * - 'pace-chaser' matches 'Pace Chasers'
 * - 'pacechasers' matches 'Pace Chasers'
 * - 'mr cb' matches 'Mr. C. B.'
 *
 * @param filterString The filter input from user
 * @param targetName The name to check against
 * @returns true if any normalized search term matches the normalized target name
 */
export function matchesNameFilter(filterString: string, targetName: string): boolean {
  if (!filterString?.trim()) {
    return true;
  }

  const normalizedTarget = normalizeName(targetName);

  // Split by & or + to get multiple search terms
  const searchTerms = filterString
    .split(/[&+]/)
    .map(term => normalizeName(term))
    .filter(term => term.length > 0);

  // Match if ANY search term is found in the target name
  return searchTerms.some(term => normalizedTarget.includes(term));
}
