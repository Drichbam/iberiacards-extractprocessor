import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CreateShopRequest, UpdateShopRequest, Shop } from '@/types/shop';
import { useSubcategories } from '@/hooks/useSubcategories';

interface ShopFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShopRequest | UpdateShopRequest) => Promise<boolean>;
  initialData?: Shop;
  mode: 'create' | 'edit';
}

export const ShopForm = ({ isOpen, onClose, onSubmit, initialData, mode }: ShopFormProps) => {
  const [shopName, setShopName] = useState(initialData?.shop_name || '');
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategory_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { subcategoriesWithCategories } = useSubcategories();

  // Update form state when initialData changes
  useEffect(() => {
    if (isOpen) {
      setShopName(initialData?.shop_name || '');
      setSubcategoryId(initialData?.subcategory_id || '');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !subcategoryId) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      shop_name: shopName.trim(),
      subcategory_id: subcategoryId,
    });
    
    if (success) {
      handleClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShopName(initialData?.shop_name || '');
    setSubcategoryId(initialData?.subcategory_id || '');
    setIsSubmitting(false);
    onClose();
  };

  const isValid = shopName.trim().length > 0 && subcategoryId.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Shop' : 'Edit Shop'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new shop and assign it to a category and subcategory for expense tracking.' 
              : 'Update the shop name and its category/subcategory assignment.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Shop Name</Label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              className={!shopName.trim() && shopName !== '' ? 'border-destructive' : ''}
            />
            {!shopName.trim() && shopName !== '' && (
              <p className="text-sm text-destructive">Shop name is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Category & Subcategory</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger className={!subcategoryId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select category and subcategory" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50 max-h-60 overflow-y-auto">
                {/* Group subcategories by category */}
                {(() => {
                  // Group subcategories by category
                  const groupedSubcats = subcategoriesWithCategories.reduce((acc, subcat) => {
                    if (!acc[subcat.category]) {
                      acc[subcat.category] = [];
                    }
                    acc[subcat.category].push(subcat);
                    return acc;
                  }, {} as Record<string, typeof subcategoriesWithCategories>);

                  return Object.entries(groupedSubcats).map(([categoryName, subcats]) => (
                    <div key={categoryName}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {categoryName}
                      </div>
                      {subcats.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id} className="pl-6">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full border" 
                              style={{ backgroundColor: subcat.color }}
                            />
                            <span>{subcat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ));
                })()}
              </SelectContent>
            </Select>
            {!subcategoryId && (
              <p className="text-sm text-destructive">Category and subcategory selection is required</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="min-w-[80px]"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};