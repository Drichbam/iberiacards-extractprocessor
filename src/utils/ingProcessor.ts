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
      balance,
      // Parse the description into components
      ...parseConcepto(description || '')
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

function parseConcepto(description: string): { titulo: string; receptor: string; uso: string } {
  if (!description) {
    return { titulo: '', receptor: '', uso: '' };
  }

  const desc = description.trim();
  
  // Bizum patterns
  if (desc.startsWith('Bizum enviado a ')) {
    const rest = desc.substring('Bizum enviado a '.length);
    const parts = rest.split(' ');
    if (parts.length >= 3) {
      // Assume first two parts are name (could be more), rest is usage
      const nameEndIndex = rest.lastIndexOf(' ');
      if (nameEndIndex > 0) {
        return {
          titulo: 'Bizum enviado a',
          receptor: rest.substring(0, nameEndIndex),
          uso: rest.substring(nameEndIndex + 1)
        };
      }
    }
    return {
      titulo: 'Bizum enviado a',
      receptor: rest,
      uso: ''
    };
  }
  
  if (desc.startsWith('Bizum recibido de ')) {
    const rest = desc.substring('Bizum recibido de '.length);
    const parts = rest.split(' ');
    if (parts.length >= 4) {
      // Find where the name ends (usually before description)
      // Look for common patterns or assume last part is usage
      const nameEndIndex = rest.lastIndexOf(' ');
      if (nameEndIndex > 0) {
        return {
          titulo: 'Bizum recibido de',
          receptor: rest.substring(0, nameEndIndex),
          uso: rest.substring(nameEndIndex + 1)
        };
      }
    }
    return {
      titulo: 'Bizum recibido de',
      receptor: rest,
      uso: ''
    };
  }
  
  // Transfer patterns
  if (desc.startsWith('Transferencia recibida de ')) {
    const rest = desc.substring('Transferencia recibida de '.length);
    const parts = rest.split(' ');
    if (parts.length >= 4) {
      // Assume last part is usage description
      const nameEndIndex = rest.lastIndexOf(' ');
      if (nameEndIndex > 0) {
        return {
          titulo: 'Transferencia recibida de',
          receptor: rest.substring(0, nameEndIndex),
          uso: rest.substring(nameEndIndex + 1)
        };
      }
    }
    return {
      titulo: 'Transferencia recibida de',
      receptor: rest,
      uso: ''
    };
  }
  
  // Payment patterns
  if (desc.startsWith('Pago en ')) {
    const rest = desc.substring('Pago en '.length);
    return {
      titulo: 'Pago en',
      receptor: rest,
      uso: ''
    };
  }
  
  // Receipt patterns
  if (desc.startsWith('Recibo ')) {
    const rest = desc.substring('Recibo '.length);
    return {
      titulo: 'Recibo',
      receptor: rest,
      uso: ''
    };
  }
  
  // Traspaso patterns
  if (desc.includes('Traspaso')) {
    return {
      titulo: desc,
      receptor: '',
      uso: ''
    };
  }
  
  // Cargo/Abono patterns
  if (desc.startsWith('Cargo ') || desc.startsWith('Abono ')) {
    const spaceIndex = desc.indexOf(' ');
    return {
      titulo: desc.substring(0, spaceIndex),
      receptor: desc.substring(spaceIndex + 1),
      uso: ''
    };
  }
  
  // Nomina pattern
  if (desc.startsWith('Nomina recibida ')) {
    const rest = desc.substring('Nomina recibida '.length);
    return {
      titulo: 'Nomina recibida',
      receptor: rest,
      uso: ''
    };
  }
  
  // Default: try to split on common patterns
  const commonPrefixes = [
    'Comisión', 'Reintegro', 'Ingreso', 'Gasto', 'Abono', 'Cargo'
  ];
  
  for (const prefix of commonPrefixes) {
    if (desc.startsWith(prefix + ' ')) {
      const rest = desc.substring(prefix.length + 1);
      return {
        titulo: prefix,
        receptor: rest,
        uso: ''
      };
    }
  }
  
  // If no pattern matches, return the whole description as titulo
  return {
    titulo: desc,
    receptor: '',
    uso: ''
  };
}

function convertINGToExpenseData(transactions: INGTransaction[], shops: Shop[]): ExpenseData[] {
  return transactions.map((transaction, index) => {
    // Parse the concepto into three parts
    const parsed = parseConcepto(transaction.description);
    
    // For ING transactions, we keep the original ING categories as the primary categorization
    // The shop matching is used to potentially override categories if there's an exact match
    const matchedShop = findMatchingShop(transaction.description, shops);
    
    return {
      fecha: transaction.date,
      cantidad: transaction.amount.toFixed(2), // Keep original sign (positive/negative)
      titulo: parsed.titulo,
      receptor: parsed.receptor,
      uso: parsed.uso,
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
  let cleanStr = str.toString().trim();
  
  // Remove thousands separators (dots) but preserve the decimal comma
  // First, check if there's a comma (decimal separator)
  const hasDecimalComma = cleanStr.includes(',');
  
  if (hasDecimalComma) {
    // Split by comma to separate integer and decimal parts
    const parts = cleanStr.split(',');
    const integerPart = parts[0].replace(/\./g, ''); // Remove dots from integer part
    const decimalPart = parts[1] || '0';
    cleanStr = `${integerPart}.${decimalPart}`;
  } else {
    // No decimal comma, just remove dots (they might be thousands separators)
    // But be careful: if there are only 3 digits after the last dot, it might be decimal
    const dotIndex = cleanStr.lastIndexOf('.');
    if (dotIndex > 0 && cleanStr.length - dotIndex <= 3) {
      // Might be decimal separator, keep it
      const beforeDot = cleanStr.substring(0, dotIndex).replace(/\./g, '');
      const afterDot = cleanStr.substring(dotIndex + 1);
      cleanStr = `${beforeDot}.${afterDot}`;
    } else {
      // Remove all dots (thousands separators)
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }
  
  return parseFloat(cleanStr) || 0;
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // Convert to string if it's not already
  const dateStr = String(dateValue);
  
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Handle Excel date number format
  if (!isNaN(Number(dateValue)) && Number(dateValue) > 40000) {
    const excelDate = new Date((Number(dateValue) - 25569) * 86400 * 1000);
    return excelDate.toISOString().split('T')[0];
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