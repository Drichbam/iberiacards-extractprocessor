import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useShops } from '@/hooks/useShops';
import { useCategories } from '@/hooks/useCategories';
import { ShopForm } from '@/components/ShopForm';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { DeleteAllConfirmationDialog } from '@/components/DeleteAllConfirmationDialog';
import { ImportConfirmationDialog } from '@/components/ImportConfirmationDialog';
import { ShopFiltersComponent, type ShopFilters } from '@/components/ShopFilters';
import { HierarchicalShopFilters } from '@/components/HierarchicalShopFilters';
import { Shop, CreateShopRequest } from '@/types/shop';
import { exportShopsToCSV, parseShopsFromCSV, ShopCSVData } from '@/utils/shopCsvUtils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { DistinctColorGenerator } from '@/utils/colorUtils';

type SortField = 'shop_name' | 'category' | 'created_at' | 'modified_at';
type SortDirection = 'asc' | 'desc';

export default function ShopCategories() {
  const { shops, loading, createShop, updateShop, deleteShop } = useShops();
  const { categories, createCategory, refetch: refetchCategories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingShop, setEditingShop] = useState<Shop | undefined>();
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingShop, setDeletingShop] = useState<Shop | undefined>();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('shop_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter state
  const [filters, setFilters] = useState<ShopFilters>({
    shopNameFilter: '',
    categoryFilters: [],
    createdFromDate: null,
    createdToDate: null,
    modifiedFromDate: null,
    modifiedToDate: null,
  });

  // Filtering and sorting logic
  const filteredAndSortedShops = useMemo(() => {
    let filtered = shops;

    // Apply filters
    if (filters.shopNameFilter) {
      try {
        const regex = new RegExp(filters.shopNameFilter, 'i');
        filtered = filtered.filter(shop => regex.test(shop.shop_name));
      } catch {
        // If regex is invalid, fall back to simple string matching
        filtered = filtered.filter(shop => 
          shop.shop_name.toLowerCase().includes(filters.shopNameFilter.toLowerCase())
        );
      }
    }

    if (filters.categoryFilters.length > 0) {
      filtered = filtered.filter(shop => filters.categoryFilters.includes(shop.category));
    }

    if (filters.createdFromDate) {
      filtered = filtered.filter(shop => 
        new Date(shop.created_at) >= filters.createdFromDate!
      );
    }

    if (filters.createdToDate) {
      filtered = filtered.filter(shop => 
        new Date(shop.created_at) <= filters.createdToDate!
      );
    }

    if (filters.modifiedFromDate) {
      filtered = filtered.filter(shop => 
        new Date(shop.modified_at) >= filters.modifiedFromDate!
      );
    }

    if (filters.modifiedToDate) {
      filtered = filtered.filter(shop => 
        new Date(shop.modified_at) <= filters.modifiedToDate!
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === 'created_at' || sortField === 'modified_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shops, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateShop = () => {
    setFormMode('create');
    setEditingShop(undefined);
    setShowForm(true);
  };

  const handleEditShop = (shop: Shop) => {
    setFormMode('edit');
    setEditingShop(shop);
    setShowForm(true);
  };

  const handleDeleteShop = (shop: Shop) => {
    setDeletingShop(shop);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deletingShop) {
      await deleteShop(deletingShop.id, deletingShop.shop_name);
      setDeletingShop(undefined);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = async () => {
    const deletePromises = shops.map(shop => deleteShop(shop.id, shop.shop_name));
    await Promise.all(deletePromises);
    
    toast({
      title: "All Entries Deleted",
      description: `${shops.length} shop entries have been deleted`,
      variant: "success",
    });
  };

  const handleFormSubmit = async (data: any) => {
    if (formMode === 'create') {
      return await createShop(data);
    } else if (editingShop) {
      return await updateShop(editingShop.id, data);
    }
    return false;
  };

  const handleExportCSV = () => {
    exportShopsToCSV(shops);
    toast({
      title: "Export Complete", 
      description: `${shops.length} shops exported with category hierarchy`,
      variant: "success",
    });
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    // If no existing shops, proceed directly with import
    if (shops.length === 0) {
      await performImport(file);
    } else {
      // Store the file and show confirmation dialog
      setImportFile(file);
      setShowImportDialog(true);
    }
  };

  // Helper function to resolve category names to IDs, creating missing categories
  const resolveCategoryId = async (categoryName: string): Promise<string> => {
    // Find existing category
    let existingCategory = categories.find(cat => cat.name === categoryName);
    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category with distinct color
    const randomColor = DistinctColorGenerator.getNextCategoryColor(categories);

    // Create category directly in database and return the result
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: categoryName,
        color: randomColor,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Category already exists, fetch it
        const { data: existingData, error: fetchError } = await supabase
          .from('categories')
          .select('*')
          .eq('name', categoryName)
          .single();
        
        if (fetchError) {
          throw new Error(`Failed to fetch existing category "${categoryName}": ${fetchError.message}`);
        }
        
        return existingData.id;
      }
      throw new Error(`Failed to create category "${categoryName}": ${error.message}`);
    }

    if (!data) {
      throw new Error(`Failed to create category: ${categoryName}`);
    }

    // Update local categories state
    await refetchCategories();

    return data.id;
  };

  const performImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const csvShops = parseShopsFromCSV(text);

      // Delete all existing shops first (if any)
      if (shops.length > 0) {
        const deletePromises = shops.map(shop => deleteShop(shop.id, shop.shop_name));
        await Promise.all(deletePromises);
      }

      // Get all unique subcategory names from CSV
      const uniqueSubcategoryNames = [...new Set(csvShops
        .filter(shop => shop.subcategory_name)
        .map(shop => shop.subcategory_name!)
      )];
      
      const createdCategories: string[] = [];
      const createdSubcategories: string[] = [];

      // Fetch current subcategories with their categories
      const { data: currentSubcategories, error: subFetchError } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories!category_id (
            id,
            name,
            color
          )
        `)
        .order('name', { ascending: true });

      if (subFetchError) {
        throw new Error(`Failed to fetch subcategories: ${subFetchError.message}`);
      }

      // Check if "Unknown category" exists, create if not
      let unknownCategory = categories.find(cat => cat.name === 'Unknown category');
      if (!unknownCategory) {
        const color = DistinctColorGenerator.getNextCategoryColor(categories);
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert([{
            name: 'Unknown category',
            color: color,
          }])
          .select()
          .single();

        if (categoryError && categoryError.code !== '23505') {
          throw new Error(`Failed to create "Unknown category": ${categoryError.message}`);
        }

        if (newCategory) {
          createdCategories.push('Unknown category');
          unknownCategory = newCategory;
        } else {
          // Category already exists, fetch it
          const { data: existingCategory } = await supabase
            .from('categories')
            .select('*')
            .eq('name', 'Unknown category')
            .single();
          unknownCategory = existingCategory;
        }
      }

      if (!unknownCategory) {
        throw new Error('Failed to get or create "Unknown category"');
      }

      // Process each unique subcategory
      for (const subcategoryName of uniqueSubcategoryNames) {
        // Check if subcategory already exists
        const existingSubcategory = currentSubcategories?.find(sub => sub.name === subcategoryName);
        
        if (!existingSubcategory) {
          // Create new subcategory under "Unknown category"
          try {
            const color = DistinctColorGenerator.getNextCategoryColor(categories);
            const { data: newSubcategory, error: subError } = await supabase
              .from('subcategories')
              .insert([{
                name: subcategoryName,
                category_id: unknownCategory.id,
                color: color,
              }])
              .select()
              .single();

            if (subError && subError.code !== '23505') {
              console.warn(`Failed to create subcategory "${subcategoryName}":`, subError);
            } else {
              createdSubcategories.push(subcategoryName);
            }
          } catch (error) {
            console.warn(`Failed to create subcategory "${subcategoryName}":`, error);
          }
        }
      }

      // Refetch subcategories to get updated list
      const { data: updatedSubcategories, error: updatedSubError } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories!category_id (
            id,
            name,
            color
          )
        `)
        .order('name', { ascending: true });

      if (updatedSubError) {
        throw new Error(`Failed to fetch updated subcategories: ${updatedSubError.message}`);
      }

      // Get default subcategory for fallback
      const defaultSubcategory = updatedSubcategories?.find(sub => sub.name === 'Otros gastos (otros)');
      const defaultSubcategoryId = defaultSubcategory?.id;

      if (!defaultSubcategoryId) {
        throw new Error('Default subcategory "Otros gastos (otros)" not found');
      }

      // Map CSV shops to shop data with subcategory IDs
      const shopDataWithIds: CreateShopRequest[] = [];
      
      for (const csvShop of csvShops) {
        let subcategoryId: string = defaultSubcategoryId;
        
        if (csvShop.subcategory_name) {
          // Look for existing subcategory by name
          const foundSubcategory = updatedSubcategories?.find(sub => 
            sub.name === csvShop.subcategory_name
          );
          
          if (foundSubcategory) {
            subcategoryId = foundSubcategory.id;
          }
        }

        shopDataWithIds.push({
          shop_name: csvShop.shop_name,
          subcategory_id: subcategoryId,
        });
      }

      // Create new shops
      const createPromises = shopDataWithIds.map(shopData => createShop(shopData));
      const results = await Promise.all(createPromises);
      
      const successCount = results.filter(result => result).length;
      
      let description = shops.length === 0 
        ? `${successCount} shops imported successfully.`
        : `${successCount} shops imported successfully. All previous entries were replaced.`;
      
      if (createdCategories.length > 0) {
        description += ` Created ${createdCategories.length} new categories: ${createdCategories.join(', ')}.`;
      }
      
      if (createdSubcategories.length > 0) {
        description += ` Created ${createdSubcategories.length} new subcategories: ${createdSubcategories.join(', ')}.`;
      }
      
      toast({
        title: "Import Complete",
        description,
        variant: "success",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    await performImport(importFile);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" onClick={() => handleSort(field)} className="h-auto p-0 font-medium">
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shop Categories</h1>
          <p className="text-muted-foreground">Manage shop names and their spending categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteAll} disabled={shops.length === 0} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={shops.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => navigate('/categories')}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Import CSV file"
            />
            <Button variant="outline" disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
          </div>
          <Button onClick={handleCreateShop}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <HierarchicalShopFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shops ({filteredAndSortedShops.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortButton field="shop_name">Shop Name</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="category">Category & Subcategory</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="created_at">Created On</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="modified_at">Modified On</SortButton>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedShops.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {shops.length === 0 ? 'No shops found. Add your first shop!' : 'No shops match your filters.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedShops.map((shop) => (
                          <TableRow key={shop.id}>
                            <TableCell className="font-medium">{shop.shop_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border" 
                                  style={{ backgroundColor: '#6366f1' }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {shop.category}
                                  </span>
                                  <span className="text-sm">
                                    {shop.subcategory}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(shop.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(shop.modified_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShop(shop)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteShop(shop)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ShopForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        initialData={editingShop}
        mode={formMode}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        shopName={deletingShop?.shop_name || ''}
      />

      <ImportConfirmationDialog
        isOpen={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setImportFile(null);
        }}
        onConfirm={confirmImport}
        fileName={importFile?.name || ''}
        currentShopCount={shops.length}
      />

      <DeleteAllConfirmationDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
        shopCount={shops.length}
      />
    </div>
  );
}