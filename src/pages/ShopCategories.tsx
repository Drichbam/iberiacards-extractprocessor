import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useShops } from '@/hooks/useShops';
import { ShopForm } from '@/components/ShopForm';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { ImportConfirmationDialog } from '@/components/ImportConfirmationDialog';
import { ShopFiltersComponent, type ShopFilters } from '@/components/ShopFilters';
import { Shop } from '@/types/shop';
import { exportShopsToCSV, parseShopsFromCSV } from '@/utils/shopCsvUtils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

type SortField = 'shop_name' | 'category' | 'created_at' | 'modified_at';
type SortDirection = 'asc' | 'desc';

export default function ShopCategories() {
  const { shops, loading, createShop, updateShop, deleteShop } = useShops();
  const { toast } = useToast();
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingShop, setEditingShop] = useState<Shop | undefined>();
  
  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingShop, setDeletingShop] = useState<Shop | undefined>();
  
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
      description: `${shops.length} shops exported to CSV`,
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

    // Store the file and show confirmation dialog
    setImportFile(file);
    setShowImportDialog(true);
  };

  const confirmImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const newShops = parseShopsFromCSV(text);

      // Delete all existing shops first
      const deletePromises = shops.map(shop => deleteShop(shop.id, shop.shop_name));
      await Promise.all(deletePromises);

      // Create new shops
      const createPromises = newShops.map(shopData => createShop(shopData));
      const results = await Promise.all(createPromises);
      
      const successCount = results.filter(result => result).length;
      
      toast({
        title: "Import Complete",
        description: `${successCount} shops imported successfully. All previous entries were replaced.`,
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
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ShopFiltersComponent filters={filters} onFiltersChange={setFilters} />
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
                          <SortButton field="category">Category</SortButton>
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
                              <Badge variant="secondary">{shop.category}</Badge>
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
    </div>
  );
}