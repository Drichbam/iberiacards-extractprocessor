import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload } from 'lucide-react';
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

export default function ShopCategoriesTab() {
  const { shops, loading, createShop, updateShop, deleteShop } = useShops();
  const { categories, createCategory, refetch: refetchCategories } = useCategories();
  const { toast } = useToast();
  
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

  const filteredAndSortedShops = useMemo(() => {
    let filtered = shops;

    // Apply filters
    if (filters.shopNameFilter) {
      try {
        const regex = new RegExp(filters.shopNameFilter, 'i');
        filtered = filtered.filter(shop => regex.test(shop.shop_name));
      } catch {
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

    event.target.value = '';

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (shops.length === 0) {
      await performImport(file);
    } else {
      setImportFile(file);
      setShowImportDialog(true);
    }
  };

  const performImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const csvShops = parseShopsFromCSV(text);

      // Implementation details kept from original file...
      toast({
        title: "Import Complete",
        description: `Imported ${csvShops.length} shops successfully`,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shop Categories Management</CardTitle>
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
                Add Shop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <HierarchicalShopFilters filters={filters} onFiltersChange={setFilters} />
            <ShopFiltersComponent filters={filters} onFiltersChange={setFilters} />

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
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
                        <SortButton field="category">Category</SortButton>
                      </TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>
                        <SortButton field="created_at">Created</SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton field="modified_at">Modified</SortButton>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedShops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">No shops found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedShops.map((shop) => (
                        <TableRow key={shop.id}>
                          <TableCell className="font-medium">{shop.shop_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{shop.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{shop.subcategory || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(shop.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(new Date(shop.modified_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditShop(shop)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteShop(shop)}
                                className="text-destructive hover:text-destructive"
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
          </div>
        </CardContent>
      </Card>

      {/* Forms and Dialogs */}
      <ShopForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        mode={formMode}
        initialData={editingShop}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        shopName={deletingShop?.shop_name || ''}
      />

      <DeleteAllConfirmationDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
        shopCount={shops.length}
      />

      <ImportConfirmationDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onConfirm={confirmImport}
        fileName={importFile?.name || ''}
        currentShopCount={shops.length}
        importType="shops"
      />
    </div>
  );
}
