import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shop, CreateShopRequest, UpdateShopRequest } from '@/types/shop';
import { useToast } from '@/hooks/use-toast';

export const useShops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          categories!category_id (
            name,
            color
          )
        `)
        .order('shop_name', { ascending: true });

      if (error) throw error;
      
      // Transform the data to include category name for backwards compatibility
      const transformedData = data?.map(shop => ({
        ...shop,
        category: shop.categories?.name || 'Uncategorized'
      })) || [];
      
      setShops(transformedData);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shops. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createShop = async (shopData: CreateShopRequest) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert([shopData])
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
            description: `Shop name "${shopData.shop_name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      const transformedData = {
        ...data,
        category: data.categories?.name || 'Uncategorized'
      };

      setShops(prev => [...prev, transformedData].sort((a, b) => a.shop_name.localeCompare(b.shop_name)));
      toast({
        title: "Success",
        description: "Shop added successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error creating shop:', error);
      toast({
        title: "Error",
        description: "Failed to add shop. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateShop = async (id: string, shopData: UpdateShopRequest) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .update(shopData)
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
            description: `Shop name "${shopData.shop_name}" already exists. Please choose a different name.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      const transformedData = {
        ...data,
        category: data.categories?.name || 'Uncategorized'
      };

      setShops(prev => 
        prev.map(shop => shop.id === id ? transformedData : shop)
          .sort((a, b) => a.shop_name.localeCompare(b.shop_name))
      );
      toast({
        title: "Success",
        description: "Shop updated successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error updating shop:', error);
      toast({
        title: "Error",
        description: "Failed to update shop. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteShop = async (id: string, shopName: string) => {
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShops(prev => prev.filter(shop => shop.id !== id));
      toast({
        title: "Success",
        description: `"${shopName}" deleted successfully`,
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: "Error",
        description: "Failed to delete shop. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return {
    shops,
    loading,
    createShop,
    updateShop,
    deleteShop,
    refetch: fetchShops,
  };
};