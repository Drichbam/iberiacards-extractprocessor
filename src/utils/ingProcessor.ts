import * as XLSX from 'xlsx';
import { INGTransaction, INGProcessingResult } from '@/types/ingTransaction';
import { ExpenseData } from '@/types/expense';
import { Shop } from '@/types/shop';

export async function processINGFile(file: File, shops: Shop[]): Promise<{ expenses: ExpenseData[], processingResult: INGProcessingResult }> {
  const fileData = await parseINGFile(file);
  const expenses = convertINGToExpenseData(fileData.transactions, shops);
  
  return {
    expenses,
    processingResult: fileData
  };
}

async function parseINGFile(file: File): Promise<INGProcessingResult> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  // Find account info from header
  let accountNumber = '';
  let accountHolder = '';
  let exportDate = '';

  // Parse header information
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length > 0) {
      const rowStr = row.join(' ');
      
      if (rowStr.includes('Número de cuenta:')) {
        accountNumber = row[3] || '';
      }
      if (rowStr.includes('Titular:')) {
        accountHolder = row[3] || '';
      }
      if (rowStr.includes('Fecha exportación:')) {
        exportDate = row[3] || '';
      }
    }
  }

  // Find the data rows (after headers)
  let dataStartIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row[0] === 'F. VALOR') {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
    throw new Error('No se encontró el encabezado de datos en el archivo ING');
  }

  const transactions: INGTransaction[] = [];
  
  // Process transaction rows
  for (let i = dataStartIndex; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 7) continue;

    const [dateStr, category, subcategory, description, comment, hasImageStr, amountStr, balanceStr] = row;
    
    if (!dateStr || !amountStr) continue;

    // Parse amount (handle Spanish number format)
    const amount = parseSpanishNumber(amountStr);
    const balance = parseSpanishNumber(balanceStr);

    transactions.push({
      date: formatDate(dateStr),
      category: category || '',
      subcategory: subcategory || '',
      description: description || '',
      comment: comment || '',
      hasImage: hasImageStr === 'Sí',
      amount,
      balance
    });
  }

  return {
    transactions,
    accountNumber,
    accountHolder,
    exportDate,
    totalTransactions: transactions.length
  };
}

function convertINGToExpenseData(transactions: INGTransaction[], shops: Shop[]): ExpenseData[] {
  return transactions.map((transaction, index) => {
    // Try to match with existing shops
    const matchedShop = findMatchingShop(transaction.description, shops);
    
    return {
      card_number: 'ING Bank',
      fecha: transaction.date,
      comercio: transaction.description,
      importe: Math.abs(transaction.amount).toFixed(2),
      categoria: matchedShop?.category || transaction.category,
      subcategoria: matchedShop?.subcategory || transaction.subcategory
    };
  });
}

function findMatchingShop(description: string, shops: Shop[]): Shop | undefined {
  const normalizedDescription = description.toLowerCase().trim();
  
  return shops.find(shop => {
    const normalizedShopName = shop.shop_name.toLowerCase().trim();
    return normalizedDescription.includes(normalizedShopName) || 
           normalizedShopName.includes(normalizedDescription);
  });
}

function parseSpanishNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  // Handle Spanish number format (comma as decimal separator, dot as thousands separator)
  const cleanStr = str.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}