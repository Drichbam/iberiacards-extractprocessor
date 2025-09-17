import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Subcategory, CreateSubcategoryRequest, UpdateSubcategoryRequest } from '@/types/subcategory';
import { useToast } from '@/hooks/use-toast';

export const useSubcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(id, name, color)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubcategories(data || []);
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
          category:categories(id, name, color)
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

      setSubcategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
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
          category:categories(id, name, color)
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

      setSubcategories(prev => 
        prev.map(subcategory => subcategory.id === id ? data : subcategory)
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
        // Get the "Uncategorized" subcategory or create one
        let { data: uncategorizedSubcategory, error: uncategorizedError } = await supabase
          .from('subcategories')
          .select('id')
          .eq('name', 'Uncategorized')
          .maybeSingle();

        if (uncategorizedError) throw uncategorizedError;

        if (!uncategorizedSubcategory) {
          // Create "Uncategorized" subcategory under "Otros gastos"
          const { data: otrosGastosCategory } = await supabase
            .from('categories')
            .select('id')
            .eq('name', 'Otros gastos')
            .single();

          if (otrosGastosCategory) {
            const { data: newUncategorized, error: createError } = await supabase
              .from('subcategories')
              .insert({ name: 'Uncategorized', category_id: otrosGastosCategory.id })
              .select('id')
              .single();

            if (createError) throw createError;
            uncategorizedSubcategory = newUncategorized;
          }
        }

        if (uncategorizedSubcategory) {
          // Update shops to use "Uncategorized" subcategory
          const { error: updateError } = await supabase
            .from('shops')
            .update({ subcategory_id: uncategorizedSubcategory.id })
            .eq('subcategory_id', id);

          if (updateError) throw updateError;
        }
      }

      // Now delete the subcategory
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubcategories(prev => prev.filter(subcategory => subcategory.id !== id));
      toast({
        title: "Success",
        description: `"${subcategoryName}" deleted successfully${shopsUsingSubcategory && shopsUsingSubcategory.length > 0 ? '. Associated shops moved to "Uncategorized".' : ''}`,
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
    loading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch: fetchSubcategories,
  };
};