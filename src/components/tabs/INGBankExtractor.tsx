import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { ExpenseTable } from "@/components/ExpenseTable";
import { processINGFile } from "@/utils/ingProcessor";
import { useShops } from "@/hooks/useShops";
import { ExpenseData } from "@/types/expense";
import { INGProcessingResult } from "@/types/ingTransaction";
import { exportToCSV } from "@/utils/csvExporter";

export default function INGBankExtractor() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<INGProcessingResult | null>(null);
  const { shops } = useShops();

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > 1) {
      toast.error("Please upload only one ING bank file at a time");
      return;
    }

    setIsProcessing(true);
    try {
      const file = files[0];
      const { expenses: processedExpenses, processingResult } = await processINGFile(file, shops);
      
      setExpenses(processedExpenses);
      setProcessingResult(processingResult);
      
      toast.success(`Successfully processed ${processedExpenses.length} transactions from ING bank file`);
    } catch (error) {
      console.error('Error processing ING file:', error);
      toast.error(`Error processing ING file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      exportToCSV(expenses);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ING Bank Extractor</CardTitle>
          <p className="text-muted-foreground">
            Process and categorize ING bank account extracts
          </p>
        </CardHeader>
        <CardContent>
          <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          
          {processingResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Processing Summary:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Account: {processingResult.accountNumber}</div>
                <div>Holder: {processingResult.accountHolder}</div>
                <div>Export Date: {processingResult.exportDate}</div>
                <div>Transactions: {processingResult.totalTransactions}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {expenses.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Processed Transactions</CardTitle>
            <Button onClick={handleExportCSV}>
              Export to CSV
            </Button>
          </CardHeader>
          <CardContent>
            <ExpenseTable 
              expenses={expenses}
              calculatedTotal={expenses.reduce((sum, exp) => sum + parseFloat(exp.cantidad), 0)}
              expectedTotal={expenses.reduce((sum, exp) => sum + parseFloat(exp.cantidad), 0)}
              totalMatch={true}
              categories={[]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}