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

  // Parse header line and detect column positions
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  // Detect column positions for different formats
  const shopNameIndex = headers.findIndex(h => 
    h.includes('shop name') || h.includes('shop label') || h === 'shop_name'
  );
  const categoryIndex = headers.findIndex(h => 
    h.includes('category') && !h.includes('subcategory')
  );
  const subcategoryIndex = headers.findIndex(h => 
    h.includes('subcategory')
  );

  console.log('CSV Headers detected:', headers);
  console.log('Column mapping - Shop:', shopNameIndex, 'Category:', categoryIndex, 'Subcategory:', subcategoryIndex);

  // Validate that we found the required columns
  if (shopNameIndex === -1) {
    throw new Error('Could not find shop name column. Expected: "Shop Name" or "Shop Label"');
  }
  if (categoryIndex === -1) {
    throw new Error('Could not find category column. Expected: "Category"');
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
      
      // Check minimum number of columns
      if (values.length <= Math.max(shopNameIndex, categoryIndex)) {
        errors.push(`Line ${lineNumber}: Missing required columns`);
        return;
      }

      const shopName = values[shopNameIndex]?.trim();
      const category = values[categoryIndex]?.trim();
      const subcategory = subcategoryIndex !== -1 ? values[subcategoryIndex]?.trim() : undefined;

      if (!shopName) {
        errors.push(`Line ${lineNumber}: Shop name is required`);
        return;
      }

      if (!category) {
        errors.push(`Line ${lineNumber}: Category is required`);
        return;
      }

      // If no subcategory column exists, treat category as subcategory 
      // and use "Imported Categories" as the default parent category
      let finalCategory: string;
      let finalSubcategory: string | undefined;
      
      if (subcategoryIndex === -1) {
        // No subcategory column - treat category as subcategory
        finalCategory = 'Imported Categories';
        finalSubcategory = category;
      } else {
        // Has subcategory column - use category as category and subcategory as subcategory
        finalCategory = category;
        finalSubcategory = subcategory;
      }

      console.log(`Processing line ${lineNumber}: Shop="${shopName}", Category="${finalCategory}", Subcategory="${finalSubcategory}"`);

      shops.push({
        shop_name: shopName,
        category_name: finalCategory,
        subcategory_name: finalSubcategory,
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