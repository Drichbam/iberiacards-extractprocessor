import { ExpenseData } from "@/types/expense";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";
import * as XLSX from 'xlsx';

export interface ExpenseProcessingResult {
  expenses: ExpenseData[];
  calculatedTotal: number;
  expectedTotal: number;
  totalMatch: boolean;
}

// Fetch shops once and reuse
const fetchShops = async (): Promise<Shop[]> => {
  const { data: shops, error } = await supabase
    .from('shops')
    .select('*');
    
  if (error) {
    console.error('Error fetching shops:', error);
    return [];
  }
  
  return shops || [];
};

export const processMultipleExpenseFiles = async (files: File[]): Promise<ExpenseProcessingResult> => {
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }
  
  // Fetch shops once for all files
  const shops = await fetchShops();
  
  const results: ExpenseProcessingResult[] = [];
  const errorFiles: string[] = [];
  
  // Process each file individually
  for (const file of files) {
    try {
      const result = await processExpenseFile(file, shops);
      results.push(result);
    } catch (error) {
      errorFiles.push(file.name);
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  // Check if any files failed to process
  if (errorFiles.length > 0) {
    throw new Error(`Failed to process the following files: ${errorFiles.join(', ')}. Please ensure all files are valid credit card extracts with the same format.`);
  }
  
  if (results.length === 0) {
    throw new Error('No files were successfully processed');
  }
  
  // Consolidate all expenses
  const allExpenses: ExpenseData[] = [];
  let totalCalculated = 0;
  let totalExpected = 0;
  
  for (const result of results) {
    allExpenses.push(...result.expenses);
    totalCalculated += result.calculatedTotal;
    totalExpected += result.expectedTotal;
  }
  
  // Check if totals match (allowing for small rounding differences)
  const totalMatch = Math.abs(totalCalculated - totalExpected) < 0.01;
  
  return {
    expenses: allExpenses,
    calculatedTotal: totalCalculated,
    expectedTotal: totalExpected,
    totalMatch
  };
};

export const processExpenseFile = async (file: File, shops?: Shop[]): Promise<ExpenseProcessingResult> => {
  // Fetch shops if not provided
  if (!shops) {
    shops = await fetchShops();
  }
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

  // Find all IBERIA ICON cards and their transaction tables
  const cardSections: Array<{cardNumber: string, headerRow: number}> = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 2) {
      const cellValue = String(row[0] || '').toUpperCase();
      if (cellValue.includes('IBERIA') && cellValue.includes('ICON') && row[2]) {
        const cardNumber = String(row[2]).trim();
        
        // Find the corresponding transaction header (should be within next few rows)
        for (let j = i + 1; j < Math.min(i + 10, data.length); j++) {
          const headerRow = data[j];
          if (headerRow && headerRow.length >= 5) {
            const rowStr = headerRow.map((cell: any) => String(cell || '').toLowerCase()).join('|');
            if (rowStr.includes('fecha') && rowStr.includes('operación') && 
                rowStr.includes('comercio') && rowStr.includes('importe') && rowStr.includes('euros')) {
              cardSections.push({ cardNumber, headerRow: j });
              break;
            }
          }
        }
      }
    }
  }
  
  if (cardSections.length === 0) {
    throw new Error('Could not find any IBERIA ICON cards in the file');
  }

  // Find TOTAL A CARGAR for validation
  let expectedTotal = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 2) {
      const cellValue = String(row[2] || '').toUpperCase();
      if (cellValue.includes('TOTAL') && cellValue.includes('CARGAR') && row[4]) {
        const totalStr = String(row[4]).replace(/[^\d,.-]/g, '').replace(',', '.');
        expectedTotal = parseFloat(totalStr) || 0;
        break;
      }
    }
  }

  const allExpenses: ExpenseData[] = [];
  let calculatedTotal = 0;

  // Process each card section
  for (let cardIndex = 0; cardIndex < cardSections.length; cardIndex++) {
    const { cardNumber, headerRow } = cardSections[cardIndex];
    
    // Determine the end of this card's transactions (either next card section or end of data)
    const nextCardRow = cardIndex + 1 < cardSections.length 
      ? cardSections[cardIndex + 1].headerRow 
      : data.length;

    // Process transactions for this card
    for (let i = headerRow + 1; i < nextCardRow; i++) {
      const row = data[i];
      
      if (!row || row.length < 5) continue;
      
      // Check if we've hit another section (empty rows or different structure)
      if (!row[0] || String(row[0]).trim() === '' || 
          String(row[0]).toUpperCase().includes('IBERIA') ||
          String(row[0]).toLowerCase().includes('total') ||
          String(row[0]).toLowerCase().includes('deuda')) {
        continue;
      }
      
      const transactionNumber = String(row[0] || '').trim();
      const rawDate = String(row[1] || '').trim();
      const merchant = String(row[2] || '').trim();
      const rawAmount = String(row[4] || '').trim(); // IMPORTE EUROS column

      // Skip if not a valid transaction row
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
      
      // Add to calculated total for validation
      const numericAmount = parseFloat(cleanAmount.replace(',', '.')) || 0;
      calculatedTotal += numericAmount;
      
      // Categorize the transaction using shops database (exact match, case sensitive)
      const matchedShop = shops.find(shop => shop.shop_name === merchant);
      const category = matchedShop ? matchedShop.category : 'Otros gastos (otros)';

      allExpenses.push({
        card_number: cardNumber,
        fecha: formattedDate,
        comercio: merchant,
        importe: cleanAmount,
        categoria: category,
      });
    }
  }

  if (allExpenses.length === 0) {
    throw new Error('No valid transactions found in the file');
  }

  // Validate total if we found an expected total
  if (expectedTotal > 0) {
    const difference = Math.abs(calculatedTotal - expectedTotal);
    if (difference > 0.10) { // Allow small rounding differences
      console.warn(`Total mismatch: Expected ${expectedTotal}€, calculated ${calculatedTotal}€ (difference: ${difference}€)`);
      // Don't throw error, just warn, as there might be minor formatting differences
    }
  }

  console.log(`Processed ${allExpenses.length} transactions from ${cardSections.length} cards. Total: ${calculatedTotal}€${expectedTotal > 0 ? ` (Expected: ${expectedTotal}€)` : ''}`);

  const totalMatch = expectedTotal > 0 ? Math.abs(calculatedTotal - expectedTotal) <= 0.10 : true;

  return {
    expenses: allExpenses,
    calculatedTotal,
    expectedTotal,
    totalMatch
  };
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