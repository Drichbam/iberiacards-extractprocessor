import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ExpenseTable } from "@/components/ExpenseTable";
import { processExpenseFile, processMultipleExpenseFiles, ExpenseProcessingResult } from "@/utils/expenseProcessor";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [processingResult, setProcessingResult] = useState<ExpenseProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
            />
          </section>
        )}
      </div>
    </main>
  );
};

export default Index;