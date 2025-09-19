import { INGTransactionData, INGProcessingResult } from "@/types/ingTransaction";
import { Shop } from "@/types/shop";
import * as XLSX from 'xlsx';

const parseINGDescription = (description: string): { titulo: string; receptor: string; uso: string } => {
  if (!description || description.trim() === '') {
    return { titulo: '', receptor: '', uso: '' };
  }

  // Clean the description
  const cleanDesc = description.trim();
  
  // Common patterns for ING transaction descriptions
  // Pattern 1: "COMPRA EN <MERCHANT> <LOCATION> <DATE>"
  if (cleanDesc.includes('COMPRA EN ')) {
    const parts = cleanDesc.replace('COMPRA EN ', '').split(' ');
    const titulo = 'COMPRA EN';
    const receptor = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
    const uso = parts.slice(Math.ceil(parts.length / 2)).join(' ');
    return { titulo, receptor, uso };
  }
  
  // Pattern 2: "PAGO EN <MERCHANT> <DETAILS>"
  if (cleanDesc.includes('PAGO EN ')) {
    const parts = cleanDesc.replace('PAGO EN ', '').split(' ');
    const titulo = 'PAGO EN';
    const receptor = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
    const uso = parts.slice(Math.ceil(parts.length / 2)).join(' ');
    return { titulo, receptor, uso };
  }
  
  // Pattern 3: "TRANSFERENCIA <DETAILS>"
  if (cleanDesc.includes('TRANSFERENCIA')) {
    const titulo = 'TRANSFERENCIA';
    const remaining = cleanDesc.replace('TRANSFERENCIA', '').trim();
    const parts = remaining.split(' ');
    const receptor = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
    const uso = parts.slice(Math.ceil(parts.length / 2)).join(' ');
    return { titulo, receptor, uso };
  }
  
  // Pattern 4: "REINTEGRO" or cash withdrawals
  if (cleanDesc.includes('REINTEGRO') || cleanDesc.includes('CAJERO')) {
    const titulo = cleanDesc.includes('REINTEGRO') ? 'REINTEGRO' : 'CAJERO';
    const remaining = cleanDesc.replace(titulo, '').trim();
    const parts = remaining.split(' ');
    const receptor = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
    const uso = parts.slice(Math.ceil(parts.length / 2)).join(' ');
    return { titulo, receptor, uso };
  }
  
  // Default: split description into roughly equal parts
  const words = cleanDesc.split(' ');
  if (words.length <= 2) {
    return { titulo: words[0] || '', receptor: words[1] || '', uso: '' };
  }
  
  const third = Math.ceil(words.length / 3);
  const titulo = words.slice(0, third).join(' ');
  const receptor = words.slice(third, third * 2).join(' ');
  const uso = words.slice(third * 2).join(' ');
  
  return { titulo, receptor, uso };
};

const parseSpanishNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Convert Spanish number format to English format
  // Spanish: 1.234,56 -> English: 1234.56
  const cleanValue = value.toString()
    .replace(/\./g, '') // Remove thousands separators
    .replace(',', '.'); // Replace decimal comma with decimal point
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  // Handle Excel date numbers
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    if (date && date.y && date.m && date.d) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Handle string dates
  if (typeof dateValue === 'string') {
    const dateStr = dateValue.trim();
    
    // Try DD/MM/YYYY format
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try DD-MM-YYYY format
    const ddmmyyyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try YYYY-MM-DD format (already correct)
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return dateValue.toString();
};

export const processINGFile = (file: File, shops: Shop[]): Promise<INGProcessingResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('El archivo está vacío o no contiene datos válidos');
        }
        
        // Find the header row (look for "FECHA" or "IMPORTE" columns)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i] as any[];
          if (row && row.some((cell: any) => 
            cell && typeof cell === 'string' && 
            (cell.toUpperCase().includes('FECHA') || 
             cell.toUpperCase().includes('IMPORTE') || 
             cell.toUpperCase().includes('DESCRIPCIÓN'))
          )) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('No se encontró la fila de encabezados en el archivo ING');
        }
        
        const headerRow = jsonData[headerRowIndex] as any[];
        
        // Find column indices
        const fechaIndex = headerRow.findIndex((cell: any) => 
          cell && typeof cell === 'string' && cell.toUpperCase().includes('FECHA')
        );
        const importeIndex = headerRow.findIndex((cell: any) => 
          cell && typeof cell === 'string' && cell.toUpperCase().includes('IMPORTE')
        );
        const descripcionIndex = headerRow.findIndex((cell: any) => 
          cell && typeof cell === 'string' && cell.toUpperCase().includes('DESCRIPCIÓN')
        );
        
        if (fechaIndex === -1 || importeIndex === -1 || descripcionIndex === -1) {
          throw new Error('No se encontraron las columnas requeridas: FECHA, IMPORTE, DESCRIPCIÓN');
        }
        
        const transactions: INGTransactionData[] = [];
        let calculatedTotal = 0;
        
        // Process data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          if (!row || row.length === 0) continue;
          
          const fecha = row[fechaIndex];
          const importe = row[importeIndex];
          const descripcion = row[descripcionIndex];
          
          // Skip empty rows
          if (!fecha && !importe && !descripcion) continue;
          
          const formattedDate = formatDate(fecha);
          const amount = parseSpanishNumber(importe);
          const formattedAmount = amount.toFixed(2).replace('.', ',');
          
          // Skip zero amounts
          if (amount === 0) continue;
          
          calculatedTotal += amount;
          
          // Parse description into titulo, receptor, uso
          const { titulo, receptor, uso } = parseINGDescription(descripcion || '');
          
          // Categorize using shops database (match by titulo, receptor, or full description)
          const searchTerms = [titulo, receptor, descripcion || ''].filter(Boolean);
          let matchedShop: Shop | undefined;
          
          for (const term of searchTerms) {
            matchedShop = shops.find(shop => 
              shop.shop_name.toLowerCase().includes(term.toLowerCase()) ||
              term.toLowerCase().includes(shop.shop_name.toLowerCase())
            );
            if (matchedShop) break;
          }
          
          const category = matchedShop?.category || 'Otros gastos (otros)';
          const subcategory = matchedShop?.subcategory || 'Otros gastos (otros)';
          
          transactions.push({
            fecha: formattedDate,
            cantidad: formattedAmount,
            titulo,
            receptor,
            uso,
            categoria: category,
            subcategoria: subcategory,
          });
        }
        
        if (transactions.length === 0) {
          throw new Error('No se encontraron transacciones válidas en el archivo');
        }
        
        resolve({
          transactions,
          calculatedTotal,
          totalMatch: true, // ING files don't have expected totals to compare
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Error procesando el archivo ING'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};