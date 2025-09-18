import { Category, CreateCategoryRequest } from '@/types/category';
import { CreateSubcategoryRequest } from '@/types/subcategory';
import { DistinctColorGenerator } from './colorUtils';

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

export const parseHierarchicalCSV = (csvContent: string, existingCategories: Category[] = [], ignoreColors = false): {
  categories: CreateCategoryRequest[];
  subcategories: (CreateSubcategoryRequest & { category_name: string })[];
} => {
  console.log('🔧 Starting CSV parsing...');
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log(`📄 Found ${lines.length} lines in CSV`);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header to determine column positions
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  console.log('📋 Headers found:', headers);
  
  const categoryNameIndex = headers.findIndex(h => h.includes('category') && h.includes('name'));
  const subcategoryNameIndex = headers.findIndex(h => h.includes('subcategory') && h.includes('name'));
  console.log(`🎯 Column indices - Category: ${categoryNameIndex}, Subcategory: ${subcategoryNameIndex}`);
  
  if (categoryNameIndex === -1) {
    throw new Error('CSV must contain a "Category Name" column');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const categoriesMap = new Map<string, CreateCategoryRequest>();
  const subcategories: (CreateSubcategoryRequest & { category_name: string })[] = [];
  const errors: string[] = [];

  // Collect existing colors for generating distinct colors
  const existingCategoryColors = existingCategories.map(cat => cat.color);
  const generatedCategoryColors = new Map<string, string>();
  const generatedSubcategoryColors: string[] = [];

  dataLines.forEach((line, index) => {
    const lineNumber = index + 2;
    
    if (!line.trim()) return;
    
    try {
      const values = parseCSVLine(line);
      
      if (values.length <= categoryNameIndex) {
        errors.push(`Line ${lineNumber}: Missing category name column`);
        return;
      }

      const categoryName = values[categoryNameIndex]?.trim();
      if (!categoryName) {
        errors.push(`Line ${lineNumber}: Category name is required`);
        return;
      }

      // Always generate new colors when ignoreColors is true, or if not provided
      let categoryColor: string;
      if (ignoreColors || !generatedCategoryColors.has(categoryName)) {
        const allExistingColors = [...existingCategoryColors, ...Array.from(generatedCategoryColors.values())];
        const newColor = DistinctColorGenerator.generateDistinctColor(allExistingColors);
        generatedCategoryColors.set(categoryName, newColor);
        categoryColor = newColor;
      } else {
        categoryColor = generatedCategoryColors.get(categoryName)!;
      }

      // Add category to map (will handle duplicates by keeping the first occurrence with generated color)
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          name: categoryName,
          color: categoryColor,
        });
      }

      // Handle subcategory if column exists and has data
      const subcategoryName = subcategoryNameIndex !== -1 ? values[subcategoryNameIndex]?.trim() : '';
      if (subcategoryName) {
        // Always generate distinct color for subcategory
        const allSubcategoryColors = [...generatedSubcategoryColors];
        const newColor = DistinctColorGenerator.generateDistinctColor(allSubcategoryColors);
        generatedSubcategoryColors.push(newColor);

        subcategories.push({
          name: subcategoryName,
          color: newColor,
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

  const result = {
    categories: Array.from(categoriesMap.values()),
    subcategories,
  };
  
  console.log(`✅ Parsing complete: ${result.categories.length} categories, ${result.subcategories.length} subcategories`);
  console.log('Categories:', result.categories.map(c => c.name));
  console.log('Subcategories:', result.subcategories.map(s => `${s.name} (${s.category_name})`));
  
  return result;
};

// Helper function to validate hex colors
function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-F]{6}$/i;
  return hexColorRegex.test(color);
}

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
