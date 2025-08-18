/**
 * Format date to a human-readable string
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
