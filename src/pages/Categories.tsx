import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Download, Upload, Trash2, Edit, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryFilters } from "@/components/CategoryFilters";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DeleteAllConfirmationDialog } from "@/components/DeleteAllConfirmationDialog";
import { ImportConfirmationDialog } from "@/components/ImportConfirmationDialog";
import { Category } from "@/types/category";
import { useToast } from "@/hooks/use-toast";

type SortField = 'name' | 'color' | 'created_at';
type SortDirection = 'asc' | 'desc';

const Categories = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { toast } = useToast();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  
  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];
      
      if (sortField === 'created_at') {
        const aTime = new Date(aValue as string).getTime();
        const bTime = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return filtered;
  }, [categories, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (values: { name: string; color: string }) => {
    let success;
    if (editingCategory) {
      success = await updateCategory(editingCategory.id, values);
    } else {
      success = await createCategory(values);
    }
    
    if (success) {
      setIsFormOpen(false);
      setEditingCategory(undefined);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Color'],
      ...categories.map(category => [
        category.name,
        category.color
      ])
    ];

    const csvString = csvContent.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Generate random colors without repetition
  const generateRandomColors = (count: number): string[] => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#c026d3', '#d946ef', '#ec4899', '#f43f5e',
      '#64748b', '#6b7280', '#9ca3af', '#374151', '#111827', '#0f172a'
    ];
    
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, colors.length));
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    values.push(current.trim());
    return values;
  };

  const handleImportCSV = (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Take the first file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          toast({
            title: "Error",
            description: "CSV file is empty",
            variant: "destructive",
          });
          return;
        }

        // Skip header row and parse data
        const dataLines = lines.slice(1);
        const parsedData: Array<{ name: string; color: string }> = [];
        const errors: string[] = [];

        // Check if we have color column by examining header
        const headerLine = parseCSVLine(lines[0]);
        const hasColorColumn = headerLine.length > 1 && headerLine[1]?.toLowerCase().includes('color');
        
        // Generate random colors if needed
        const randomColors = hasColorColumn ? [] : generateRandomColors(dataLines.length);
        let colorIndex = 0;

        dataLines.forEach((line, index) => {
          const lineNumber = index + 2;
          if (!line.trim()) return;

          try {
            const values = parseCSVLine(line);
            const name = values[0]?.trim();

            if (!name) {
              errors.push(`Line ${lineNumber}: Category name is required`);
              return;
            }

            let color = '#6366f1'; // default color
            
            if (hasColorColumn && values[1]) {
              const colorValue = values[1].trim();
              // Validate hex color
              if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                color = colorValue;
              } else {
                errors.push(`Line ${lineNumber}: Invalid color format "${colorValue}". Using default color.`);
              }
            } else if (!hasColorColumn && randomColors.length > 0) {
              color = randomColors[colorIndex % randomColors.length];
              colorIndex++;
            }

            parsedData.push({ name, color });
          } catch (error) {
            errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        if (errors.length > 0) {
          toast({
            title: "Import Warnings",
            description: `${errors.length} issues found. Check console for details.`,
            variant: "destructive",
          });
          console.warn('CSV Import Warnings:', errors);
        }

        if (parsedData.length === 0) {
          toast({
            title: "Error",
            description: "No valid category data found in CSV file",
            variant: "destructive",
          });
          return;
        }

        setImportData(parsedData);
        setIsImportDialogOpen(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const performImport = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const categoryData of importData) {
        const success = await createCategory(categoryData);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `${successCount} categories imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: successCount > 0 ? "success" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import categories",
        variant: "destructive",
      });
    } finally {
      setIsImportDialogOpen(false);
      setImportData([]);
    }
  };

  const confirmImport = () => {
    performImport();
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" onClick={() => handleSort(field)} className="h-auto p-0 font-semibold hover:bg-transparent">
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </Button>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">Manage your expense categories</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${filteredAndSortedCategories.length} categor${filteredAndSortedCategories.length === 1 ? 'y' : 'ies'} found`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteAllDialogOpen(true)} disabled={categories.filter(cat => cat.name !== 'Uncategorized').length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={categories.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleImportCSV([files[0]]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Import CSV file"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </div>
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CategoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-8 w-[70px]" />
                  <Skeleton className="h-8 w-[70px]" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories found.</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton field="name">Name</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="color">Color</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="created_at">Created</SortButton>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <Badge variant="outline" style={{ color: category.color }}>
                            {category.color}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            disabled={category.name === 'Uncategorized'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        title={editingCategory ? "Edit Category" : "Create New Category"}
        description={editingCategory ? "Update the category details below." : "Add a new category to organize your expenses."}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (categoryToDelete) {
            const success = await deleteCategory(categoryToDelete.id, categoryToDelete.name);
            if (success) {
              setIsDeleteDialogOpen(false);
              setCategoryToDelete(null);
            }
          }
        }}
        shopName={categoryToDelete?.name || ""}
      />

      <ImportConfirmationDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onConfirm={confirmImport}
        fileName="categories"
        currentShopCount={importData.length}
      />

      <DeleteAllConfirmationDialog
        isOpen={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={async () => {
          try {
            // Delete all categories except "Uncategorized"
            const categoriesToDelete = categories.filter(cat => cat.name !== 'Uncategorized');
            let successCount = 0;
            let errorCount = 0;

            for (const category of categoriesToDelete) {
              const success = await deleteCategory(category.id, category.name);
              if (success) {
                successCount++;
              } else {
                errorCount++;
              }
            }

            toast({
              title: "Delete All Complete",
              description: `${successCount} categories deleted successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
              variant: successCount > 0 ? "success" : "destructive",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete categories",
              variant: "destructive",
            });
          } finally {
            setIsDeleteAllDialogOpen(false);
          }
        }}
        shopCount={categories.filter(cat => cat.name !== 'Uncategorized').length}
      />
    </div>
  );
};

export default Categories;