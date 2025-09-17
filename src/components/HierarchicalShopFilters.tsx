import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShopFilters } from '@/components/ShopFilters';
import { useSubcategories } from '@/hooks/useSubcategories';

interface HierarchicalShopFiltersProps {
  filters: ShopFilters;
  onFiltersChange: (filters: ShopFilters) => void;
}

export const HierarchicalShopFilters = ({ filters, onFiltersChange }: HierarchicalShopFiltersProps) => {
  const { subcategoriesWithCategories } = useSubcategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group subcategories by category
  const groupedSubcategories = subcategoriesWithCategories.reduce((acc, subcat) => {
    if (!acc[subcat.category]) {
      acc[subcat.category] = [];
    }
    acc[subcat.category].push(subcat);
    return acc;
  }, {} as Record<string, typeof subcategoriesWithCategories>);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSubcategoryToggle = (subcategoryName: string, checked: boolean) => {
    const currentFilters = filters.categoryFilters || [];
    const newFilters = checked
      ? [...currentFilters, subcategoryName]
      : currentFilters.filter(filter => filter !== subcategoryName);
    
    onFiltersChange({
      ...filters,
      categoryFilters: newFilters,
    });
  };

  const handleCategoryToggle = (categoryName: string, checked: boolean) => {
    const categorySubcategories = groupedSubcategories[categoryName]?.map(sub => sub.name) || [];
    const currentFilters = filters.categoryFilters || [];
    
    let newFilters: string[];
    if (checked) {
      // Add all subcategories from this category
      newFilters = [...new Set([...currentFilters, ...categorySubcategories])];
    } else {
      // Remove all subcategories from this category
      newFilters = currentFilters.filter(filter => !categorySubcategories.includes(filter));
    }
    
    onFiltersChange({
      ...filters,
      categoryFilters: newFilters,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      shopNameFilter: '',
      categoryFilters: [],
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
    });
  };

  const getCategoryCheckedState = (categoryName: string) => {
    const categorySubcategories = groupedSubcategories[categoryName]?.map(sub => sub.name) || [];
    const currentFilters = filters.categoryFilters || [];
    const checkedCount = categorySubcategories.filter(sub => currentFilters.includes(sub)).length;
    
    if (checkedCount === 0) return false;
    if (checkedCount === categorySubcategories.length) return true;
    return 'indeterminate';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shop Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="shop-search">Shop Name</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="shop-search"
              placeholder="Search shops..."
              value={filters.shopNameFilter}
              onChange={(e) => onFiltersChange({ ...filters, shopNameFilter: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Hierarchical Category Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Categories & Subcategories</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {Object.entries(groupedSubcategories).map(([categoryName, subcategories]) => {
              const isExpanded = expandedCategories.has(categoryName);
              const checkedState = getCategoryCheckedState(categoryName);
              
              return (
                <Collapsible key={categoryName} open={isExpanded} onOpenChange={() => toggleCategory(categoryName)}>
                  <div className="space-y-2">
                    {/* Category Header */}
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        checked={checkedState}
                        onCheckedChange={(checked) => handleCategoryToggle(categoryName, !!checked)}
                        className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto font-medium">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                          )}
                          {categoryName}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({subcategories.length})
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    {/* Subcategories */}
                    <CollapsibleContent className="ml-6 space-y-1">
                      {subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center space-x-2 p-1">
                          <Checkbox
                            checked={filters.categoryFilters?.includes(subcategory.name) || false}
                            onCheckedChange={(checked) => handleSubcategoryToggle(subcategory.name, !!checked)}
                          />
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full border" 
                              style={{ backgroundColor: subcategory.color }}
                            />
                            <Label className="text-sm font-normal cursor-pointer">
                              {subcategory.name}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary */}
        {filters.categoryFilters && filters.categoryFilters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Active Filters ({filters.categoryFilters.length})
            </Label>
            <div className="flex flex-wrap gap-1">
              {filters.categoryFilters.map((filter) => (
                <Button
                  key={filter}
                  variant="secondary"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handleSubcategoryToggle(filter, false)}
                >
                  {filter} ×
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};