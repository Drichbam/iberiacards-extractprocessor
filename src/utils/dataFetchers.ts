import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";

export const fetchShops = async (): Promise<Shop[]> => {
  const { data: shops, error } = await supabase
    .from('shops')
    .select(`
      *,
      categories!category_id (
        name,
        color
      )
    `);
    
  if (error) {
    console.error('Error fetching shops:', error);
    return [];
  }
  
  // Transform the data to include category name for backwards compatibility
  const transformedShops = shops?.map(shop => ({
    ...shop,
    category: (shop as any).categories?.name || 'Uncategorized'
  })) || [];
  
  console.log('Fetched shops for expense processing:', transformedShops.length, transformedShops.slice(0, 3));
  
  return transformedShops;
};