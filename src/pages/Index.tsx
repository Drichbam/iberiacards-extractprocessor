import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ExpenseTable } from "@/components/ExpenseTable";
import { processExpenseFile, processMultipleExpenseFiles, ExpenseProcessingResult } from "@/utils/expenseProcessor";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";
import { Category } from "@/types/category";

const Index = () => {
  const [processingResult, setProcessingResult] = useState<ExpenseProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch initial shops data with categories
  const fetchShops = async () => {
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
      return;
    }
    
    // Transform the data to include category name and color for backwards compatibility
    const transformedShops = shops?.map(shop => ({
      ...shop,
      category: (shop as any).categories?.name || 'Uncategorized',
      categoryColor: (shop as any).categories?.color || 'hsl(var(--primary))'
    })) || [];
    
    setShops(transformedShops);
  };

  // Re-categorize expenses when shops change
  const recategorizeExpenses = (expenses: any[], updatedShops: Shop[]) => {
    return expenses.map(expense => {
      const matchedShop = updatedShops.find(shop => shop.shop_name === expense.comercio);
      return {
        ...expense,
        categoria: matchedShop ? matchedShop.category : 'Otros gastos (otros)'
      };
    });
  };

  // Fetch categories
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
    // Fetch initial data
    fetchShops();
    fetchCategories();

    // Set up real-time subscription for shops changes
    const channel = supabase
      .channel('shops-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'shops'
        },
        async (payload) => {
          console.log('Shop change detected:', payload);
          
          // Refetch shops data with categories
          const { data: updatedShops, error } = await supabase
            .from('shops')
            .select(`
              *,
              categories!category_id (
                name,
                color
              )
            `);
          
          if (error) {
            console.error('Error fetching updated shops:', error);
            return;
          }
          
          // Transform the data to include category name and color
          const transformedShops = updatedShops?.map(shop => ({
            ...shop,
            category: (shop as any).categories?.name || 'Uncategorized',
            categoryColor: (shop as any).categories?.color || 'hsl(var(--primary))'
          })) || [];
          
          setShops(transformedShops);
          
          // Re-categorize existing expenses if we have processing results
          if (processingResult) {
            const updatedExpenses = recategorizeExpenses(processingResult.expenses, transformedShops);
            setProcessingResult({
              ...processingResult,
              expenses: updatedExpenses
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [processingResult]); // Remove shops from dependencies to avoid infinite loop

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const result = await processMultipleExpenseFiles(files);
      setProcessingResult(result);
      
      const statusMessage = result.totalMatch 
        ? "Totals match perfectly!" 
        : `Warning: Calculated total (€${result.calculatedTotal.toFixed(2)}) differs from expected (€${result.expectedTotal.toFixed(2)})`;
      
      toast({
        title: "Processing Complete",
        description: `${result.expenses.length} transactions processed from ${files.length} file(s). ${statusMessage}`,
        variant: result.totalMatch ? "success" : "default"
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process the files. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Credit Card Expense Categorizer
            </h1>
            <a 
              href="/shop-categories"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Manage Shop Categories
            </a>
          </div>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto font-medium">
            Upload your monthly credit card extract and get organized, categorized expenses ready for export
          </p>
        </header>

        {/* Upload Section */}
        <section className="mb-6">
          <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
        </section>

        {/* Results Section */}
        {processingResult && (
          <section>
            <ExpenseTable 
              expenses={processingResult.expenses}
              calculatedTotal={processingResult.calculatedTotal}
              expectedTotal={processingResult.expectedTotal}
              totalMatch={processingResult.totalMatch}
              categories={categories}
            />
          </section>
        )}
      </div>
    </main>
  );
};

export default Index;