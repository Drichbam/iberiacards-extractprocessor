import { ExpenseData } from "@/types/expense";
import { categorizeTransaction } from "./merchantCategorizer";

export const processExpenseFile = async (file: File): Promise<ExpenseData[]> => {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('File appears to be empty or invalid');
  }

  // Parse header to find column indices
  const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
  
  const cardNumberIndex = headers.findIndex(h => 
    h.includes('iberia') || h.includes('card') || h.includes('numero')
  );
  const dateIndex = headers.findIndex(h => 
    h.includes('fecha') || h.includes('date')
  );
  const merchantIndex = headers.findIndex(h => 
    h.includes('comercio') || h.includes('merchant') || h.includes('descripcion')
  );
  const amountIndex = headers.findIndex(h => 
    h.includes('importe') && h.includes('euro') || 
    h.includes('amount') || 
    h.includes('euros')
  );

  const processedExpenses: ExpenseData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''));
    
    if (cells.length < Math.max(cardNumberIndex, dateIndex, merchantIndex, amountIndex) + 1) {
      continue; // Skip malformed rows
    }

    const cardNumber = cells[cardNumberIndex] || '';
    const rawDate = cells[dateIndex] || '';
    const merchant = cells[merchantIndex] || '';
    const rawAmount = cells[amountIndex] || '';

    if (!merchant || !rawAmount) {
      continue; // Skip rows without essential data
    }

    // Format date to YYYY-MM-DD
    const formattedDate = formatDate(rawDate);
    
    // Clean and format amount
    const cleanAmount = rawAmount.replace(/[^\d,.-]/g, '');
    
    // Categorize the transaction
    const category = categorizeTransaction(merchant);

    processedExpenses.push({
      card_number: cardNumber,
      fecha: formattedDate,
      comercio: merchant,
      importe: cleanAmount,
      categoria: category,
    });
  }

  return processedExpenses;
};

const formatDate = (dateString: string): string => {
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