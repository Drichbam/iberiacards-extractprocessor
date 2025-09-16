import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import { useToast } from '@/hooks/use-toast';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateCategoryRequest) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Duplicate Entry",
            description: `Category name "${categoryData.name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Success",
        description: "Category added successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateCategory = async (id: string, categoryData: UpdateCategoryRequest) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Duplicate Entry",
            description: `Category name "${categoryData.name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      setCategories(prev => 
        prev.map(category => category.id === id ? data : category)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: "Success",
        description: "Category updated successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCategory = async (id: string, categoryName: string) => {
    try {
      // First check if any shops are using this category
      const { data: shopsUsingCategory, error: checkError } = await supabase
        .from('shops')
        .select('id')
        .eq('category_id', id);

      if (checkError) throw checkError;

      if (shopsUsingCategory && shopsUsingCategory.length > 0) {
        // Get the "Uncategorized" category
        const { data: uncategorizedCategory, error: uncategorizedError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Uncategorized')
          .single();

        if (uncategorizedError) throw uncategorizedError;

        // Update shops to use "Uncategorized" category
        const { error: updateError } = await supabase
          .from('shops')
          .update({ category_id: uncategorizedCategory.id })
          .eq('category_id', id);

        if (updateError) throw updateError;
      }

      // Now delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(category => category.id !== id));
      toast({
        title: "Success",
        description: `"${categoryName}" deleted successfully${shopsUsingCategory && shopsUsingCategory.length > 0 ? '. Associated shops moved to "Uncategorized".' : ''}`,
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};