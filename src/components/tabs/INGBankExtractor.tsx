import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { INGTransactionTable } from "@/components/INGTransactionTable";
import { processINGFile } from "@/utils/ingProcessor";
import { INGProcessingResult } from "@/types/ingTransaction";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";
import { Category } from "@/types/category";

export default function INGBankExtractor() {
  const [processingResult, setProcessingResult] = useState<INGProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch initial shops data with categories
  const fetchShops = async () => {
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        *,
        subcategories!subcategory_id (
          name,
          color,
          categories!category_id (
            name,
            color
          )
        )
      `);

    if (error) {
      console.error('Error fetching shops:', error);
      return;
    }

    // Transform the data to include category name and color for backwards compatibility
    const transformedShops = shops?.map(shop => ({
      ...shop,
      category: shop.subcategories?.categories?.name || 'Otros gastos (otros)',
      subcategory: shop.subcategories?.name || 'Otros gastos (otros)',
      categoryColor: shop.subcategories?.categories?.color || 'hsl(var(--primary))'
    })) || [];

    setShops(transformedShops);
  };

  // Fetch categories for display
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    setCategories(data || []);
  };

  useEffect(() => {
    fetchShops();
    fetchCategories();
  }, []);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingResult(null);

    try {
      // Process only the first file for ING (typically single file uploads)
      const file = files[0];
      
      if (!file.name.toLowerCase().includes('.xlsx') && !file.name.toLowerCase().includes('.xls') && !file.name.toLowerCase().includes('.csv')) {
        throw new Error('Por favor, sube un archivo Excel (.xlsx, .xls) o CSV válido de ING');
      }

      const result = await processINGFile(file, shops);
      
      setProcessingResult(result);
      
      toast({
        title: "Archivo procesado exitosamente",
        description: `Se procesaron ${result.transactions.length} transacciones. Total: ${result.calculatedTotal.toFixed(2)}€`,
      });

    } catch (error) {
      console.error('Error processing ING file:', error);
      toast({
        variant: "destructive",
        title: "Error procesando archivo",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
      />
      
      {processingResult && (
        <INGTransactionTable
          transactions={processingResult.transactions}
          calculatedTotal={processingResult.calculatedTotal}
          totalMatch={processingResult.totalMatch}
          categories={categories}
        />
      )}
    </div>
  );
}