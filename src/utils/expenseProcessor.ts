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

  // Find the header row (look for "IBERIA ICON" column)
  let headerRowIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i].map((cell: any) => String(cell || '').toLowerCase());
    if (row.some(cell => cell.includes('iberia') && cell.includes('icon'))) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find the header row with IBERIA ICON column');
  }
  
  // Find column indices
  const cardNumberIndex = headers.findIndex(h => 
    h.includes('iberia') && h.includes('icon')
  );
  const dateIndex = headers.findIndex(h => 
    h.includes('fecha') || (h.includes('date') && !h.includes('value'))
  );
  const merchantIndex = headers.findIndex(h => 
    h.includes('comercio') || h.includes('merchant') || h.includes('descripcion')
  );
  const amountIndex = headers.findIndex(h => 
    h.includes('importe') && h.includes('euro')
  );

  if (cardNumberIndex === -1 || dateIndex === -1 || merchantIndex === -1 || amountIndex === -1) {
    throw new Error('Could not find all required columns in the file');
  }

  const processedExpenses: ExpenseData[] = [];

  // Start processing from the row after headers
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) continue;
    
    const cardNumber = String(row[cardNumberIndex] || '').trim();
    const rawDate = String(row[dateIndex] || '').trim();
    const merchant = String(row[merchantIndex] || '').trim();
    const rawAmount = String(row[amountIndex] || '').trim();

    // Skip empty rows or rows without essential data
    if (!merchant || !rawAmount || merchant === 'undefined' || rawAmount === 'undefined') {
      continue;
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