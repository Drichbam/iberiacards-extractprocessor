import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { SHOP_CATEGORIES } from '@/types/shop';
import { cn } from '@/lib/utils';

export interface ShopFilters {
  shopNameFilter: string;
  categoryFilters: string[];
  createdFromDate: Date | null;
  createdToDate: Date | null;
  modifiedFromDate: Date | null;
  modifiedToDate: Date | null;
}

interface ShopFiltersProps {
  filters: ShopFilters;
  onFiltersChange: (filters: ShopFilters) => void;
}

export const ShopFiltersComponent = ({ filters, onFiltersChange }: ShopFiltersProps) => {
  const updateFilter = (key: keyof ShopFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const currentCategories = filters.categoryFilters;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    updateFilter('categoryFilters', newCategories);
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

  const hasActiveFilters = 
    filters.shopNameFilter ||
    filters.categoryFilters.length > 0 ||
    filters.createdFromDate ||
    filters.createdToDate ||
    filters.modifiedFromDate ||
    filters.modifiedToDate;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Shop Name Filter */}
      <div className="space-y-2">
        <Label>Shop Name</Label>
        <Input
          placeholder="Search shop names (supports regex)"
          value={filters.shopNameFilter}
          onChange={(e) => updateFilter('shopNameFilter', e.target.value)}
        />
      </div>


      {/* Date Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Created From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.createdFromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.createdFromDate ? format(filters.createdFromDate, "PPP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50">
              <Calendar
                mode="single"
                selected={filters.createdFromDate || undefined}
                onSelect={(date) => updateFilter('createdFromDate', date || null)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Created To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.createdToDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.createdToDate ? format(filters.createdToDate, "PPP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50">
              <Calendar
                mode="single"
                selected={filters.createdToDate || undefined}
                onSelect={(date) => updateFilter('createdToDate', date || null)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Modified From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.modifiedFromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.modifiedFromDate ? format(filters.modifiedFromDate, "PPP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50">
              <Calendar
                mode="single"
                selected={filters.modifiedFromDate || undefined}
                onSelect={(date) => updateFilter('modifiedFromDate', date || null)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Modified To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.modifiedToDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.modifiedToDate ? format(filters.modifiedToDate, "PPP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50">
              <Calendar
                mode="single"
                selected={filters.modifiedToDate || undefined}
                onSelect={(date) => updateFilter('modifiedToDate', date || null)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};