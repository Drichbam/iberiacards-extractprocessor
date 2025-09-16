import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Category } from "@/types/category";
import { DistinctColorGenerator } from "@/utils/colorUtils";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name must not exceed 100 characters"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color code"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  category?: Category;
  title: string;
  description: string;
  existingCategories?: Category[];
}

export const CategoryForm = ({ open, onOpenChange, onSubmit, category, title, description, existingCategories = [] }: CategoryFormProps) => {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      color: "#6366f1",
    },
  });

  // Reset form values when category changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaultColor = category?.color || DistinctColorGenerator.getNextCategoryColor(existingCategories);
      form.reset({
        name: category?.name || "",
        color: defaultColor,
      });
    }
  }, [open, category, form, existingCategories]);

  const handleSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name..." {...field} />
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
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        {...field} 
                        className="w-12 h-10 p-1 rounded cursor-pointer"
                      />
                      <Input 
                        placeholder="#6366f1" 
                        {...field}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {category ? "Update" : "Create"} Category
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};