export const formatDate = (dateString: string): string => {
  // Try to parse various date formats
  const cleanDate = dateString.replace(/[^\d\/\-\.]/g, '');
  
  // Common patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = cleanDate.match(pattern);
    if (match) {
      const [, part1, part2, part3] = match;
      
      // Determine if it's DD/MM/YYYY or YYYY/MM/DD
      if (part3.length === 4) {
        // DD/MM/YYYY format
        const day = part1.padStart(2, '0');
        const month = part2.padStart(2, '0');
        const year = part3;
        return `${year}-${month}-${day}`;
      } else if (part1.length === 4) {
        // YYYY/MM/DD format
        const year = part1;
        const month = part2.padStart(2, '0');
        const day = part3.padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Fallback: return as-is if can't parse
  return dateString;
};