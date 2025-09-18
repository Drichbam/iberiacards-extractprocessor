import { Shop } from '@/types/shop';

export interface ShopCSVData {
  shop_name: string;
  category_name: string;
  subcategory_name?: string;
}

export const exportShopsToCSV = (shops: Shop[]) => {
  // Enhanced CSV headers to include both category and subcategory
  const headers = ['Shop Name', 'Category', 'Subcategory'];
  
  // Create CSV content with hierarchical data
  const csvContent = [
    headers.join(','),
    ...shops.map(shop => [
      `"${shop.shop_name.replace(/"/g, '""')}"`,
      `"${(shop.category || 'Uncategorized').replace(/"/g, '""')}"`,
      `"${(shop.subcategory || 'Uncategorized').replace(/"/g, '""')}"`,
    ].join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  
  // Format date as YYYY-MM-DD
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  link.setAttribute('download', `ShopNames_${formattedDate}.csv`);
  
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseShopsFromCSV = (csvContent: string): ShopCSVData[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header line to detect column positions
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  // Find column indices for shop name and subcategory name
  const shopNameIndex = headers.findIndex(h => 
    h.includes('shop') && h.includes('name')
  );
  const subcategoryIndex = headers.findIndex(h => 
    h.includes('subcategory') && h.includes('name')
  );

  if (shopNameIndex === -1) {
    throw new Error('Required column "Shop Name" not found in CSV headers');
  }
  
  if (subcategoryIndex === -1) {
    throw new Error('Required column "Subcategory Name" not found in CSV headers');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const shops: ShopCSVData[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2; // +2 because we start from line 1 and skipped header
    
    if (!line.trim()) return; // Skip empty lines
    
    try {
      // Parse CSV line handling quoted values
      const values = parseCSVLine(line);
      
      if (values.length <= Math.max(shopNameIndex, subcategoryIndex)) {
        errors.push(`Line ${lineNumber}: Missing required columns (expected: Shop Name, Subcategory Name)`);
        return;
      }

      const shopName = values[shopNameIndex]?.trim();
      const subcategoryName = values[subcategoryIndex]?.trim();

      if (!shopName) {
        errors.push(`Line ${lineNumber}: Shop name is required`);
        return;
      }

      if (!subcategoryName) {
        errors.push(`Line ${lineNumber}: Subcategory name is required`);
        return;
      }

      shops.push({
        shop_name: shopName,
        category_name: '', // Not used in this format
        subcategory_name: subcategoryName,
      });
    } catch (error) {
      errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
  }

  if (shops.length === 0) {
    throw new Error('No valid shop data found in CSV file');
  }

  return shops;
};

// Helper function to parse CSV line with proper quoted value handling
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last value
  values.push(current);
  
  return values;
}