import { ExpenseData } from "@/types/expense";

export interface ExpenseProcessingResult {
  expenses: ExpenseData[];
  calculatedTotal: number;
  expectedTotal: number;
  totalMatch: boolean;
}

export interface CardSection {
  cardNumber: string;
  headerRow: number;
}

export interface ProcessedTransaction {
  cardNumber: string;
  date: string;
  merchant: string;
  amount: string;
  category: string;
}