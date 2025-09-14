import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ExpenseTable } from "@/components/ExpenseTable";
import { processExpenseFile } from "@/utils/expenseProcessor";
import { ExpenseData } from "@/types/expense";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const processedExpenses = await processExpenseFile(file);
      setExpenses(processedExpenses);
      toast({
        title: "Success",
        description: `Processed ${processedExpenses.length} transactions`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process the file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Credit Card Expense Categorizer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your monthly credit card extract and get organized, categorized expenses ready for export
          </p>
        </header>

        {/* Upload Section */}
        <section className="mb-8">
          <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
        </section>

        {/* Results Section */}
        {expenses.length > 0 && (
          <section>
            <ExpenseTable expenses={expenses} />
          </section>
        )}
      </div>
    </main>
  );
};

export default Index;