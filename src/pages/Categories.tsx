import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Download, Upload, Trash2, Edit, ChevronRight, FolderOpen, Folder, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { CategoryForm } from "@/components/CategoryForm";
import { SubcategoryForm } from "@/components/SubcategoryForm";
import { CategoryFilters } from "@/components/CategoryFilters";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DeleteAllConfirmationDialog } from "@/components/DeleteAllConfirmationDialog";
import { ImportConfirmationDialog } from "@/components/ImportConfirmationDialog";
import { Category } from "@/types/category";
import { Subcategory } from "@/types/subcategory";
import { useToast } from "@/hooks/use-toast";
import { DistinctColorGenerator } from "@/utils/colorUtils";
import { parseHierarchicalCSV, exportHierarchicalCSV } from "@/utils/hierarchicalCsvUtils";

const Categories = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { subcategoriesWithCategories, createSubcategory, updateSubcategory, deleteSubcategory } = useSubcategories();
  const { toast } = useToast();
  
  // Form state for categories
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  
  // Form state for subcategories
  const [isSubcategoryFormOpen, setIsSubcategoryFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | undefined>();
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  
  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'category' | 'subcategory' } | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportData, setParsedImportData] = useState<{
    categories: any[];
    subcategories: any[];
  } | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  
  // Filter and UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group subcategories by category with counts
  const groupedData = useMemo(() => {
    const grouped = categories.reduce((acc, category) => {
      const categorySubcategories = subcategoriesWithCategories.filter(sub => sub.category_id === category.id);
      const totalShops = categorySubcategories.reduce((sum, sub) => sum + (sub.shopCount || 0), 0);
      
      acc[category.id] = {
        category,
        subcategories: categorySubcategories,
        subcategoryCount: categorySubcategories.length,
        shopCount: totalShops,
      };
      return acc;
    }, {} as Record<string, { 
      category: Category; 
      subcategories: typeof subcategoriesWithCategories; 
      subcategoryCount: number;
      shopCount: number;
    }>);
    
    return grouped;
  }, [categories, subcategoriesWithCategories]);

  // Filter categories and subcategories based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return groupedData;
    
    const filtered: typeof groupedData = {};
    Object.entries(groupedData).forEach(([categoryId, data]) => {
      const categoryMatches = data.category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchingSubcategories = data.subcategories.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (categoryMatches || matchingSubcategories.length > 0) {
        filtered[categoryId] = {
          ...data,
          subcategories: categoryMatches ? data.subcategories : matchingSubcategories,
        };
        
        // Auto-expand categories with matching subcategories
        if (matchingSubcategories.length > 0) {
          setExpandedCategories(prev => new Set([...prev, categoryId]));
        }
      }
    });
    
    return filtered;
  }, [groupedData, searchTerm]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Category management handlers
  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setItemToDelete({ id, name, type: 'category' });
    setIsDeleteDialogOpen(true);
  };

  const handleCategoryFormSubmit = async (values: { name: string; color: string }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, values);
    } else {
      await createCategory(values);
    }
    setIsCategoryFormOpen(false);
    setEditingCategory(undefined);
  };

  // Subcategory management handlers
  const handleCreateSubcategory = (categoryId: string) => {
    setEditingSubcategory(undefined);
    setDefaultCategoryId(categoryId);
    setIsSubcategoryFormOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setDefaultCategoryId(subcategory.category_id);
    setIsSubcategoryFormOpen(true);
  };

  const handleDeleteSubcategory = (id: string, name: string) => {
    setItemToDelete({ id, name, type: 'subcategory' });
    setIsDeleteDialogOpen(true);
  };

  const handleSubcategoryFormSubmit = async (values: { name: string; color: string; category_id: string }) => {
    if (editingSubcategory) {
      await updateSubcategory(editingSubcategory.id, values);
    } else {
      await createSubcategory(values);
    }
    setIsSubcategoryFormOpen(false);
    setEditingSubcategory(undefined);
    setDefaultCategoryId('');
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'category') {
      await deleteCategory(itemToDelete.id, itemToDelete.name);
    } else {
      await deleteSubcategory(itemToDelete.id, itemToDelete.name);
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    exportHierarchicalCSV(categories, subcategoriesWithCategories);
  };

  // Import handlers
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessingImport(true);
      const content = await file.text();
      const parsed = parseHierarchicalCSV(content);
      
      setImportFile(file);
      setParsedImportData(parsed);
      setIsImportDialogOpen(true);
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!parsedImportData) return;

    try {
      setIsProcessingImport(true);

      // Create categories first
      const categoryIdMap = new Map<string, string>();
      
      for (const categoryData of parsedImportData.categories) {
        try {
          const existingCategory = categories.find(c => c.name === categoryData.name);
          if (existingCategory) {
            categoryIdMap.set(categoryData.name, existingCategory.id);
          } else {
            const newCategory = await createCategory(categoryData);
            // Assuming createCategory returns the created category or we need to fetch it
            const createdCategory = categories.find(c => c.name === categoryData.name);
            if (createdCategory) {
              categoryIdMap.set(categoryData.name, createdCategory.id);
            }
          }
        } catch (error) {
          console.error(`Failed to create category ${categoryData.name}:`, error);
        }
      }

      // Small delay to ensure categories are created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create subcategories
      for (const subcategoryData of parsedImportData.subcategories) {
        try {
          const categoryId = categoryIdMap.get(subcategoryData.category_name);
          if (categoryId) {
            await createSubcategory({
              name: subcategoryData.name,
              color: subcategoryData.color,
              category_id: categoryId,
            });
          }
        } catch (error) {
          console.error(`Failed to create subcategory ${subcategoryData.name}:`, error);
        }
      }

      toast({
        title: "Import Successful",
        description: `Imported ${parsedImportData.categories.length} categories and ${parsedImportData.subcategories.length} subcategories.`,
        variant: "default",
      });
      
      setIsImportDialogOpen(false);
      setParsedImportData(null);
      setImportFile(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const totalSubcategories = Object.values(filteredData).reduce((sum, data) => sum + data.subcategoryCount, 0);

  return (
    <div className="container mx-auto p-3 max-w-7xl">
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Category & Subcategory Management</h1>
          <p className="text-sm text-muted-foreground">Manage your hierarchical expense categories</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Categories & Subcategories</CardTitle>
              <CardDescription className="text-sm">
                {loading ? "Loading..." : (
                  <>
                    {Object.keys(filteredData).length} categor{Object.keys(filteredData).length === 1 ? 'y' : 'ies'} • {totalSubcategories} subcategor{totalSubcategories === 1 ? 'y' : 'ies'}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteAllDialogOpen(true)} disabled={categories.length === 0}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete All
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={Object.keys(filteredData).length === 0}>
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFileUpload(files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Import CSV file"
                  disabled={isProcessingImport}
                />
                <Button variant="outline" size="sm" disabled={isProcessingImport}>
                  <Upload className="h-3 w-3 mr-1" />
                  {isProcessingImport ? "Processing..." : "Import CSV"}
                </Button>
              </div>
              <Button size="sm" onClick={handleCreateCategory}>
                <Plus className="h-3 w-3 mr-1" />
                New Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <CategoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <div className="ml-6 space-y-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(filteredData).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No categories found.</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")} className="mt-1 text-sm">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(filteredData).map(([categoryId, { category, subcategories, subcategoryCount, shopCount }]) => {
                const isExpanded = expandedCategories.has(categoryId);
                
                return (
                  <div key={categoryId} className="border rounded-lg">
                    {/* Category Row */}
                    <div className="flex items-center justify-between p-2 hover:bg-muted/50">
                      <div className="flex items-center gap-2 flex-1">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryId)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-5 w-5">
                              {subcategoryCount > 0 ? (
                                isExpanded ? (
                                  <FolderOpen className="h-3 w-3" />
                                ) : (
                                  <Folder className="h-3 w-3" />
                                )
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: category.color }}
                        />
                        
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {subcategoryCount} subcategor{subcategoryCount === 1 ? 'y' : 'ies'} • {shopCount} shop{shopCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateSubcategory(categoryId)}
                          className="text-xs px-2 py-1 h-6"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Sub
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="p-1 h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          disabled={category.name === 'Otros gastos'}
                          className="p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subcategories */}
                    {subcategoryCount > 0 && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryId)}>
                        <CollapsibleContent className="border-t bg-muted/20">
                          <div className="p-1 space-y-1">
                            {subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="flex items-center justify-between p-2 ml-4 rounded bg-background hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full border" 
                                    style={{ backgroundColor: subcategory.color }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs">{subcategory.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {subcategory.shopCount || 0} shop{(subcategory.shopCount || 0) === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSubcategory(subcategory)}
                                    className="p-1 h-5 w-5"
                                  >
                                    <Edit className="h-2 w-2" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                                    disabled={subcategory.name === 'Otros gastos (otros)'}
                                    className="text-destructive hover:text-destructive p-1 h-5 w-5"
                                  >
                                    <Trash2 className="h-2 w-2" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form */}
      <CategoryForm
        open={isCategoryFormOpen}
        onOpenChange={setIsCategoryFormOpen}
        onSubmit={handleCategoryFormSubmit}
        category={editingCategory}
        title={editingCategory ? "Edit Category" : "Create New Category"}
        description={editingCategory ? "Update the category details below." : "Add a new main category to organize your expenses."}
        existingCategories={categories}
      />

      {/* Subcategory Form */}
      <SubcategoryForm
        open={isSubcategoryFormOpen}
        onOpenChange={setIsSubcategoryFormOpen}
        onSubmit={handleSubcategoryFormSubmit}
        subcategory={editingSubcategory}
        categories={categories}
        existingSubcategories={subcategoriesWithCategories}
        title={editingSubcategory ? "Edit Subcategory" : "Create New Subcategory"}
        description={editingSubcategory ? "Update the subcategory details below." : "Add a new subcategory under the selected category."}
        defaultCategoryId={defaultCategoryId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        shopName={itemToDelete?.name || ''}
      />

      {/* Delete All Dialog */}
      <DeleteAllConfirmationDialog
        isOpen={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={() => {
          // TODO: Implement delete all functionality
          toast({
            title: "Coming Soon",
            description: "Bulk delete will be available in the next update.",
            variant: "default",
          });
          setIsDeleteAllDialogOpen(false);
        }}
        shopCount={Object.keys(filteredData).length}
      />

      {/* Import Confirmation Dialog */}
      <ImportConfirmationDialog
        isOpen={isImportDialogOpen}
        onClose={() => {
          setIsImportDialogOpen(false);
          setParsedImportData(null);
          setImportFile(null);
        }}
        onConfirm={handleImportConfirm}
        fileName={importFile?.name || ""}
        currentShopCount={parsedImportData ? parsedImportData.categories.length + parsedImportData.subcategories.length : 0}
        importType="categories"
      />
    </div>
  );
};

export default Categories;