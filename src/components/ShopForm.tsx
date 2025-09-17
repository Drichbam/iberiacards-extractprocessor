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
  const { subcategories } = useSubcategories();

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
              ? 'Add a new shop with its category for expense tracking.' 
              : 'Update the shop name and category information.'}
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
            <Label htmlFor="category">Subcategory</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger className={!subcategoryId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {subcategories
                  .sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''))
                  .map((subcat) => (
                  <SelectItem key={subcat.id} value={subcat.id}>
                    <span className="text-xs text-muted-foreground mr-2">
                      {subcat.category?.name}
                    </span>
                    {subcat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!subcategoryId && (
              <p className="text-sm text-destructive">Subcategory is required</p>
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