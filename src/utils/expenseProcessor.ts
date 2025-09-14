import { ExpenseData } from "@/types/expense";
import { categorizeTransaction } from "./merchantCategorizer";
import * as XLSX from 'xlsx';

export const processExpenseFile = async (file: File): Promise<ExpenseData[]> => {
  let data: any[][];
  
  if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
    // Handle Excel files
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  } else {
    // Handle CSV/text files
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    data = lines.map(line => line.split(/[,;\t]/).map(cell => cell.trim().replace(/"/g, '')));
  }
  
  if (data.length < 2) {
    throw new Error('File appears to be empty or invalid');
  }

  // Find the card number (look for IBERIA ICON row)
  let cardNumber = '';
  for (let i = 0; i < Math.min(50, data.length); i++) {
    const row = data[i];
    if (row && row.length > 2) {
      const cellValue = String(row[0] || '').toUpperCase();
      if (cellValue.includes('IBERIA') && cellValue.includes('ICON') && row[2]) {
        cardNumber = String(row[2]).trim();
        break;
      }
    }
  }
  
  // Find the transaction header row (look for "FECHA OPERACIÓN", "COMERCIO", "IMPORTE EUROS")
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(50, data.length); i++) {
    const row = data[i];
    if (row && row.length >= 5) {
      const rowStr = row.map((cell: any) => String(cell || '').toLowerCase()).join('|');
      if (rowStr.includes('fecha') && rowStr.includes('operación') && 
          rowStr.includes('comercio') && rowStr.includes('importe') && rowStr.includes('euros')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find the transaction data table in the file');
  }

  const processedExpenses: ExpenseData[] = [];

  // Process transactions starting from the row after header
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length < 5) continue;
    
    // Expected format: [Nº, FECHA OPERACIÓN, COMERCIO, IMPORTE DIVISA, IMPORTE EUROS, ...]
    const transactionNumber = String(row[0] || '').trim();
    const rawDate = String(row[1] || '').trim();
    const merchant = String(row[2] || '').trim();
    const rawAmount = String(row[4] || '').trim(); // IMPORTE EUROS column

    // Skip empty rows or rows without essential data
    if (!merchant || !rawDate || !rawAmount || 
        merchant === 'undefined' || rawAmount === 'undefined' ||
        !transactionNumber.match(/^\d+$/)) {
      continue;
    }

    // Format date to YYYY-MM-DD
    const formattedDate = formatDate(rawDate);
    
    // Clean and format amount (remove currency symbols, keep numbers and decimal separators)
    const cleanAmount = rawAmount.replace(/[^\d,.-]/g, '');
    
    // Skip if no valid amount
    if (!cleanAmount || cleanAmount === '0' || cleanAmount === '0.00') {
      continue;
    }
    
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

  if (processedExpenses.length === 0) {
    throw new Error('No valid transactions found in the file');
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