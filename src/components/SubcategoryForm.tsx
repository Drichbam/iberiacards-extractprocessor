import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Subcategory } from '@/types/subcategory';
import { Category } from '@/types/category';
import { DistinctColorGenerator } from '@/utils/colorUtils';

const subcategoryFormSchema = z.object({
  name: z.string().min(1, 'Subcategory name is required').max(100, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  category_id: z.string().min(1, 'Category is required'),
});

type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;

interface SubcategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubcategoryFormValues) => Promise<void>;
  subcategory?: Subcategory;
  categories: Category[];
  existingSubcategories: Subcategory[];
  title: string;
  description: string;
  defaultCategoryId?: string;
}

export const SubcategoryForm = ({
  open,
  onOpenChange,
  onSubmit,
  subcategory,
  categories,
  existingSubcategories,
  title,
  description,
  defaultCategoryId,
}: SubcategoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: {
      name: '',
      color: '#6366f1',
      category_id: defaultCategoryId || '',
    },
  });

  // Reset form when dialog opens or subcategory changes
  useEffect(() => {
    if (open) {
      if (subcategory) {
        form.reset({
          name: subcategory.name,
          color: subcategory.color,
          category_id: subcategory.category_id,
        });
      } else {
        // Generate a distinct color for new subcategory
        const existingColors = existingSubcategories.map(sub => sub.color);
        const newColor = DistinctColorGenerator.generateDistinctColor(existingColors);
        
        form.reset({
          name: '',
          color: newColor,
          category_id: defaultCategoryId || '',
        });
      }
    }
  }, [open, subcategory, existingSubcategories, form, defaultCategoryId]);

  const handleSubmit = async (values: SubcategoryFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full border" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subcategory name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Input 
                        type="color" 
                        className="w-16 h-10 rounded border cursor-pointer"
                        {...field}
                      />
                    </FormControl>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="#6366f1"
                        className="flex-1"
                        {...field}
                      />
                    </FormControl>
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: field.value }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : subcategory ? 'Update Subcategory' : 'Create Subcategory'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};