import { useState, useEffect } from 'react';
import { FileUpload } from "@/components/FileUpload";
import { ExpenseTable } from "@/components/ExpenseTable";
import { ExpenseProcessingResult } from "@/types/expenseProcessing";
import { processMultipleExpenseFiles } from "@/utils/expenseProcessor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchShops } from "@/utils/dataFetchers";
import { Shop } from "@/types/shop";
import { Category } from "@/types/category";
import { ExpenseData } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreditCardExpenseCategorizer() {
  const [processingResult, setProcessingResult] = useState<ExpenseProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  // Fetch initial data and set up realtime subscriptions
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [shopsData, categoriesResponse] = await Promise.all([
          fetchShops(),
          supabase.from('categories').select('*')
        ]);
        
        setShops(shopsData);
        setCategories(categoriesResponse.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        });
      }
    };

    initializeData();

    // Set up realtime subscription for shops table
    const shopsSubscription = supabase
      .channel('shops-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'shops' }, 
          async (payload) => {
            console.log('Shops table changed:', payload);
            
            // Refetch shops data
            const updatedShops = await fetchShops();
            setShops(updatedShops);
            
            // If we have processing results, re-categorize the expenses
            if (processingResult) {
              const recategorizedExpenses = recategorizeExpenses(processingResult.expenses, updatedShops);
              setProcessingResult({
                ...processingResult,
                expenses: recategorizedExpenses
              });
            }
          })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(shopsSubscription);
    };
  }, [processingResult, toast]);

  // Helper function to re-categorize expenses when shop data changes
  const recategorizeExpenses = (expenses: ExpenseData[], updatedShops: Shop[]): ExpenseData[] => {
    return expenses.map(expense => {
      const matchingShop = updatedShops.find(shop => 
        shop.shop_name.toLowerCase() === expense.comercio.toLowerCase()
      );
      
      if (matchingShop) {
        return {
          ...expense,
          categoria: matchingShop.category || 'Uncategorized',
          subcategoria: matchingShop.subcategory || 'Uncategorized'
        };
      }
      
      return expense;
    });
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processMultipleExpenseFiles(files);
      setProcessingResult(result);
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${result.expenses.length} transactions from ${files.length} file(s)`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process the expense files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Expense Categorizer</CardTitle>
          <p className="text-muted-foreground">
            Upload your Iberia credit card statements to automatically categorize expenses
          </p>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      {processingResult && (
        <ExpenseTable 
          expenses={processingResult.expenses}
          calculatedTotal={processingResult.calculatedTotal}
          expectedTotal={processingResult.expectedTotal}
          totalMatch={processingResult.totalMatch}
          categories={categories}
        />
      )}
    </div>
  );
}