import { Category, CreateCategoryRequest } from '@/types/category';
import { CreateSubcategoryRequest } from '@/types/subcategory';

export interface HierarchicalCSVData {
  category_name: string;
  category_color?: string;
  subcategory_name?: string;
  subcategory_color?: string;
}

export const exportHierarchicalCSV = (categories: Category[], subcategoriesWithCategories: any[]) => {
  const headers = ['Category Name', 'Category Color', 'Subcategory Name', 'Subcategory Color'];
  
  const csvContent = [
    headers.join(','),
    ...categories.flatMap(category => {
      const categorySubcategories = subcategoriesWithCategories.filter(sub => sub.category_id === category.id);
      
      if (categorySubcategories.length > 0) {
        return categorySubcategories.map(sub => [
          `"${category.name.replace(/"/g, '""')}"`,
          `"${category.color.replace(/"/g, '""')}"`,
          `"${sub.name.replace(/"/g, '""')}"`,
          `"${sub.color.replace(/"/g, '""')}"`,
        ].join(','));
      } else {
        return [[
          `"${category.name.replace(/"/g, '""')}"`,
          `"${category.color.replace(/"/g, '""')}"`,
          `""`,
          `""`,
        ].join(',')];
      }
    })
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  link.setAttribute('download', `Categories_Hierarchy_${formattedDate}.csv`);
  
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseHierarchicalCSV = (csvContent: string): {
  categories: CreateCategoryRequest[];
  subcategories: (CreateSubcategoryRequest & { category_name: string })[];
} => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const categoriesMap = new Map<string, CreateCategoryRequest>();
  const subcategories: (CreateSubcategoryRequest & { category_name: string })[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2;
    
    if (!line.trim()) return;
    
    try {
      const values = parseCSVLine(line);
      
      if (values.length < 2) {
        errors.push(`Line ${lineNumber}: Missing required columns (expected: Category Name, Category Color, Subcategory Name, Subcategory Color)`);
        return;
      }

      const categoryName = values[0]?.trim();
      const categoryColor = values[1]?.trim() || '#6366f1';
      const subcategoryName = values[2]?.trim();
      const subcategoryColor = values[3]?.trim() || '#6366f1';

      if (!categoryName) {
        errors.push(`Line ${lineNumber}: Category name is required`);
        return;
      }

      // Validate colors are in hex format
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      if (!hexColorRegex.test(categoryColor)) {
        errors.push(`Line ${lineNumber}: Category color must be a valid hex color (e.g., #6366f1)`);
        return;
      }

      if (subcategoryName && !hexColorRegex.test(subcategoryColor)) {
        errors.push(`Line ${lineNumber}: Subcategory color must be a valid hex color (e.g., #6366f1)`);
        return;
      }

      // Add category to map (will handle duplicates by keeping the first occurrence)
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          name: categoryName,
          color: categoryColor,
        });
      }

      // Add subcategory if it exists
      if (subcategoryName) {
        subcategories.push({
          name: subcategoryName,
          color: subcategoryColor,
          category_id: '', // Will be resolved later
          category_name: categoryName,
        });
      }
    } catch (error) {
      errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
  }

  if (categoriesMap.size === 0) {
    throw new Error('No valid category data found in CSV file');
  }

  return {
    categories: Array.from(categoriesMap.values()),
    subcategories,
  };
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
