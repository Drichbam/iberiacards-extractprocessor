export interface INGTransaction {
  date: string;
  category: string;
  subcategory: string;
  description: string;
  comment: string;
  hasImage: boolean;
  amount: number;
  balance: number;
}

export interface INGProcessingResult {
  transactions: INGTransaction[];
  accountNumber: string;
  accountHolder: string;
  exportDate: string;
  totalTransactions: number;
}