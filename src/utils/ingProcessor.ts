import * as XLSX from 'xlsx';
import { INGTransaction, INGProcessingResult } from '@/types/ingTransaction';
import { formatDate } from '@/utils/dateUtils';

export const parseINGFile = async (file: File): Promise<any[][]> => {
  let data: any[][];

  if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  } else {
    // Handle CSV files
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    data = lines.map(line => line.split(/[,;\t]/).map(cell => cell.trim().replace(/"/g, '')));
  }

  if (data.length < 2) {
    throw new Error('File appears to be empty or invalid');
  }

  return data;
};

export const parseSpanishNumber = (value: string): number => {
  if (!value) return 0;
  
  // Handle Spanish number format: "1.234,56" -> 1234.56
  const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export const parseSpanishDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Try to parse DD/MM/YYYY format typical in Spanish banks
  const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanDate.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return formatDate(dateStr);
};

export const splitDescription = (description: string): { titulo: string; receptor: string; uso: string } => {
  if (!description) {
    return { titulo: '', receptor: '', uso: '' };
  }

  // Common ING description patterns
  const cleanDesc = description.trim();
  
  // Pattern 1: "PAGO EN {MERCHANT} - {LOCATION}" 
  const pagoEnMatch = cleanDesc.match(/PAGO EN (.+?)(?: - (.+))?$/i);
  if (pagoEnMatch) {
    return {
      titulo: 'Pago con tarjeta',
      receptor: pagoEnMatch[1].trim(),
      uso: pagoEnMatch[2]?.trim() || ''
    };
  }

  // Pattern 2: "TRANSFERENCIA A {RECIPIENT}"
  const transferenciaMatch = cleanDesc.match(/TRANSFERENCIA A (.+)$/i);
  if (transferenciaMatch) {
    return {
      titulo: 'Transferencia',
      receptor: transferenciaMatch[1].trim(),
      uso: ''
    };
  }

  // Pattern 3: "BIZUM A {RECIPIENT}"
  const bizumMatch = cleanDesc.match(/BIZUM A (.+)$/i);
  if (bizumMatch) {
    return {
      titulo: 'Bizum',
      receptor: bizumMatch[1].trim(),
      uso: ''
    };
  }

  // Pattern 4: "RECIBO {SERVICE} - {DETAILS}"
  const reciboMatch = cleanDesc.match(/RECIBO (.+?)(?: - (.+))?$/i);
  if (reciboMatch) {
    return {
      titulo: 'Recibo',
      receptor: reciboMatch[1].trim(),
      uso: reciboMatch[2]?.trim() || ''
    };
  }

  // Pattern 5: "{MERCHANT} {LOCATION}"
  const parts = cleanDesc.split(/\s+/);
  if (parts.length >= 2) {
    return {
      titulo: parts[0],
      receptor: parts.slice(1).join(' '),
      uso: ''
    };
  }

  // Default: entire description as receptor
  return {
    titulo: 'Transacción',
    receptor: cleanDesc,
    uso: ''
  };
};

export const processINGTransactions = (data: any[][]): INGProcessingResult => {
  const transactions: INGTransaction[] = [];
  let calculatedTotal = 0;
  let expectedTotal = 0;

  // Find header row (typically contains "Fecha", "Cantidad", "Descripción", etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.length >= 3) {
      const rowStr = row.map((cell: any) => String(cell || '').toLowerCase()).join('|');
      if (rowStr.includes('fecha') && (rowStr.includes('cantidad') || rowStr.includes('importe'))) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('No se pudo encontrar la fila de cabeceras en el archivo');
  }

  const headers = data[headerRowIndex].map((h: any) => String(h || '').toLowerCase().trim());
  const fechaCol = headers.findIndex((h: string) => h.includes('fecha'));
  const cantidadCol = headers.findIndex((h: string) => h.includes('cantidad') || h.includes('importe'));
  const descripcionCol = headers.findIndex((h: string) => h.includes('descripci') || h.includes('concepto'));
  const monedaCol = headers.findIndex((h: string) => h.includes('moneda'));

  if (fechaCol === -1 || cantidadCol === -1 || descripcionCol === -1) {
    throw new Error('No se pudieron encontrar las columnas requeridas (fecha, cantidad, descripción)');
  }

  // Process transaction rows
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < Math.max(fechaCol, cantidadCol, descripcionCol) + 1) continue;

    const fechaRaw = String(row[fechaCol] || '').trim();
    const cantidadRaw = String(row[cantidadCol] || '').trim();
    const descripcionRaw = String(row[descripcionCol] || '').trim();
    const monedaRaw = monedaCol >= 0 ? String(row[monedaCol] || '').trim() : 'EUR';

    if (!fechaRaw || !cantidadRaw || !descripcionRaw) continue;

    const fecha = parseSpanishDate(fechaRaw);
    const cantidad = parseSpanishNumber(cantidadRaw);
    const { titulo, receptor, uso } = splitDescription(descripcionRaw);

    if (fecha && !isNaN(cantidad)) {
      const transaction: INGTransaction = {
        fecha,
        cantidad: cantidadRaw,
        moneda: monedaRaw || 'EUR',
        descripcion: descripcionRaw,
        titulo,
        receptor,
        uso,
        categoria: 'Sin categorizar',
        subcategoria: 'Sin categorizar'
      };

      transactions.push(transaction);
      calculatedTotal += Math.abs(cantidad); // Use absolute value for total calculation
    }
  }

  // For now, set expectedTotal same as calculated (no validation available without specific total row)
  expectedTotal = calculatedTotal;

  return {
    transactions,
    calculatedTotal,
    expectedTotal,
    totalMatch: Math.abs(calculatedTotal - expectedTotal) < 0.01,
    rawData: data
  };
};