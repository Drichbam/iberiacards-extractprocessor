import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Subcategory, CreateSubcategoryRequest, UpdateSubcategoryRequest } from '@/types/subcategory';
import { useToast } from '@/hooks/use-toast';

export interface SubcategoryWithCategory extends Subcategory {
  category: string;
}

export const useSubcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesWithCategories, setSubcategoriesWithCategories] = useState<SubcategoryWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories!category_id (
            name,
            color
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      
      const subcategoriesData = data || [];
      setSubcategories(subcategoriesData);
      
      // Transform for dropdown with category info
      const withCategories = subcategoriesData.map(subcat => ({
        ...subcat,
        category: subcat.categories?.name || 'Uncategorized'
      }));
      
      setSubcategoriesWithCategories(withCategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subcategories. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubcategory = async (subcategoryData: CreateSubcategoryRequest) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([subcategoryData])
        .select(`
          *,
          categories!category_id (
            name,
            color
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Duplicate Entry",
            description: `Subcategory name "${subcategoryData.name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      const newSubcat = data;
      setSubcategories(prev => [...prev, newSubcat].sort((a, b) => a.name.localeCompare(b.name)));
      
      const withCategory = {
        ...newSubcat,
        category: newSubcat.categories?.name || 'Uncategorized'
      };
      setSubcategoriesWithCategories(prev => [...prev, withCategory].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: "Success",
        description: "Subcategory added successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast({
        title: "Error",
        description: "Failed to add subcategory. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSubcategory = async (id: string, subcategoryData: UpdateSubcategoryRequest) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(subcategoryData)
        .eq('id', id)
        .select(`
          *,
          categories!category_id (
            name,
            color
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Duplicate Entry",
            description: `Subcategory name "${subcategoryData.name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      const updatedSubcat = data;
      setSubcategories(prev => 
        prev.map(subcat => subcat.id === id ? updatedSubcat : subcat)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      
      const withCategory = {
        ...updatedSubcat,
        category: updatedSubcat.categories?.name || 'Uncategorized'
      };
      setSubcategoriesWithCategories(prev => 
        prev.map(subcat => subcat.id === id ? withCategory : subcat)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      
      toast({
        title: "Success",
        description: "Subcategory updated successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast({
        title: "Error",
        description: "Failed to update subcategory. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSubcategory = async (id: string, subcategoryName: string) => {
    try {
      // First check if any shops are using this subcategory
      const { data: shopsUsingSubcategory, error: checkError } = await supabase
        .from('shops')
        .select('id')
        .eq('subcategory_id', id);

      if (checkError) throw checkError;

      if (shopsUsingSubcategory && shopsUsingSubcategory.length > 0) {
        // Get the "Otros gastos (otros)" subcategory as default
        const { data: defaultSubcategory, error: defaultError } = await supabase
          .from('subcategories')
          .select('id')
          .eq('name', 'Otros gastos (otros)')
          .single();

        if (defaultError) throw defaultError;

        // Update shops to use "Otros gastos (otros)" subcategory
        const { error: updateError } = await supabase
          .from('shops')
          .update({ subcategory_id: defaultSubcategory.id })
          .eq('subcategory_id', id);

        if (updateError) throw updateError;
      }

      // Now delete the subcategory
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubcategories(prev => prev.filter(subcat => subcat.id !== id));
      setSubcategoriesWithCategories(prev => prev.filter(subcat => subcat.id !== id));
      
      toast({
        title: "Success",
        description: `"${subcategoryName}" deleted successfully${shopsUsingSubcategory && shopsUsingSubcategory.length > 0 ? '. Associated shops moved to "Otros gastos (otros)".' : ''}`,
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: "Error",
        description: "Failed to delete subcategory. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  return {
    subcategories,
    subcategoriesWithCategories,
    loading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch: fetchSubcategories,
  };
};