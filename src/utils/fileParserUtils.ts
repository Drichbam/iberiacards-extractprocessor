import * as XLSX from 'xlsx';
import { CardSection } from '@/types/expenseProcessing';

export const parseFileToData = async (file: File): Promise<any[][]> => {
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
  
  return data;
};

export const findCardSections = (data: any[][]): CardSection[] => {
  const cardSections: CardSection[] = [];
  
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
  
  return cardSections;
};

export const findExpectedTotal = (data: any[][]): number => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 2) {
      const cellValue = String(row[2] || '').toUpperCase();
      if (cellValue.includes('TOTAL') && cellValue.includes('CARGAR') && row[4]) {
        const totalStr = String(row[4]).replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(totalStr) || 0;
      }
    }
  }
  return 0;
};