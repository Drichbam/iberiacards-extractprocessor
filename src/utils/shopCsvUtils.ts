import { Shop, CreateShopRequest, SHOP_CATEGORIES } from '@/types/shop';

export const exportShopsToCSV = (shops: Shop[]) => {
  // CSV headers
  const headers = ['Shop Name', 'Category'];
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...shops.map(shop => [
      `"${shop.shop_name.replace(/"/g, '""')}"`,
      `"${shop.category.replace(/"/g, '""')}"`,
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

export const parseShopsFromCSV = (csvContent: string): CreateShopRequest[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const shops: CreateShopRequest[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2; // +2 because we start from line 1 and skipped header
    
    if (!line.trim()) return; // Skip empty lines
    
    try {
      // Parse CSV line handling quoted values
      const values = parseCSVLine(line);
      
      if (values.length < 2) {
        errors.push(`Line ${lineNumber}: Missing required columns (expected: Shop Name, Category)`);
        return;
      }

      const shopName = values[0]?.trim();
      const category = values[1]?.trim();

      if (!shopName) {
        errors.push(`Line ${lineNumber}: Shop name is required`);
        return;
      }

      if (!category) {
        errors.push(`Line ${lineNumber}: Category is required`);
        return;
      }

      // Validate category against allowed values
      if (!SHOP_CATEGORIES.includes(category as any)) {
        errors.push(`Line ${lineNumber}: Invalid category "${category}". Allowed categories: ${SHOP_CATEGORIES.join(', ')}`);
        return;
      }

      shops.push({
        shop_name: shopName,
        category: category,
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