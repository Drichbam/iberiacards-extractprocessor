import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { SHOP_CATEGORIES, CreateShopRequest, UpdateShopRequest, Shop } from '@/types/shop';

interface ShopFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShopRequest | UpdateShopRequest) => Promise<boolean>;
  initialData?: Shop;
  mode: 'create' | 'edit';
}

export const ShopForm = ({ isOpen, onClose, onSubmit, initialData, mode }: ShopFormProps) => {
  const [shopName, setShopName] = useState(initialData?.shop_name || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !category) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      shop_name: shopName.trim(),
      category,
    });
    
    if (success) {
      handleClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShopName(initialData?.shop_name || '');
    setCategory(initialData?.category || '');
    setIsSubmitting(false);
    onClose();
  };

  const isValid = shopName.trim().length > 0 && category.length > 0;

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
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={!category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {SHOP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!category && (
              <p className="text-sm text-destructive">Category is required</p>
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