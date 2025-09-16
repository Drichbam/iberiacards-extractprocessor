import { ExpenseData } from "@/types/expense";
import { Shop } from "@/types/shop";
import { ExpenseProcessingResult } from "@/types/expenseProcessing";
import { fetchShops } from "./dataFetchers";
import { parseFileToData, findCardSections, findExpectedTotal } from "./fileParserUtils";
import { processCardTransactions, validateTotal } from "./transactionProcessor";

// Re-export for backwards compatibility
export type { ExpenseProcessingResult } from "@/types/expenseProcessing";

export const processMultipleExpenseFiles = async (files: File[]): Promise<ExpenseProcessingResult> => {
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }
  
  // Fetch shops once for all files
  const shops = await fetchShops();
  
  const results: ExpenseProcessingResult[] = [];
  const errorFiles: string[] = [];
  
  // Process each file individually
  for (const file of files) {
    try {
      const result = await processExpenseFile(file, shops);
      results.push(result);
    } catch (error) {
      errorFiles.push(file.name);
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  // Check if any files failed to process
  if (errorFiles.length > 0) {
    throw new Error(`Failed to process the following files: ${errorFiles.join(', ')}. Please ensure all files are valid credit card extracts with the same format.`);
  }
  
  if (results.length === 0) {
    throw new Error('No files were successfully processed');
  }
  
  // Consolidate all expenses
  const allExpenses: ExpenseData[] = [];
  let totalCalculated = 0;
  let totalExpected = 0;
  
  for (const result of results) {
    allExpenses.push(...result.expenses);
    totalCalculated += result.calculatedTotal;
    totalExpected += result.expectedTotal;
  }
  
  // Check if totals match (allowing for small rounding differences)
  const totalMatch = Math.abs(totalCalculated - totalExpected) < 0.01;
  
  return {
    expenses: allExpenses,
    calculatedTotal: totalCalculated,
    expectedTotal: totalExpected,
    totalMatch
  };
};

export const processExpenseFile = async (file: File, shops?: Shop[]): Promise<ExpenseProcessingResult> => {
  // Fetch shops if not provided
  if (!shops) {
    shops = await fetchShops();
  }

  // Parse file data
  const data = await parseFileToData(file);
  
  // Find card sections and expected total
  const cardSections = findCardSections(data);
  const expectedTotal = findExpectedTotal(data);

  // Process transactions
  const { expenses, calculatedTotal } = processCardTransactions(data, cardSections, shops);

  if (expenses.length === 0) {
    throw new Error('No valid transactions found in the file');
  }

  // Validate total
  const totalMatch = validateTotal(calculatedTotal, expectedTotal);

  console.log(`Processed ${expenses.length} transactions from ${cardSections.length} cards. Total: ${calculatedTotal}€${expectedTotal > 0 ? ` (Expected: ${expectedTotal}€)` : ''}`);

  return {
    expenses,
    calculatedTotal,
    expectedTotal,
    totalMatch
  };
};