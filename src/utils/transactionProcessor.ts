import { ExpenseData } from "@/types/expense";
import { Shop } from "@/types/shop";
import { CardSection } from "@/types/expenseProcessing";
import { formatDate } from "./dateUtils";

export const processCardTransactions = (
  data: any[][],
  cardSections: CardSection[],
  shops: Shop[]
): { expenses: ExpenseData[], calculatedTotal: number } => {
  const allExpenses: ExpenseData[] = [];
  let calculatedTotal = 0;

  // Process each card section
  for (let cardIndex = 0; cardIndex < cardSections.length; cardIndex++) {
    const { cardNumber, headerRow } = cardSections[cardIndex];
    
    // Determine the end of this card's transactions (either next card section or end of data)
    const nextCardRow = cardIndex + 1 < cardSections.length 
      ? cardSections[cardIndex + 1].headerRow 
      : data.length;

    // Process transactions for this card
    for (let i = headerRow + 1; i < nextCardRow; i++) {
      const row = data[i];
      
      if (!row || row.length < 5) continue;
      
      // Check if we've hit another section (empty rows or different structure)
      if (!row[0] || String(row[0]).trim() === '' || 
          String(row[0]).toUpperCase().includes('IBERIA') ||
          String(row[0]).toLowerCase().includes('total') ||
          String(row[0]).toLowerCase().includes('deuda')) {
        continue;
      }
      
      const transactionNumber = String(row[0] || '').trim();
      const rawDate = String(row[1] || '').trim();
      const merchant = String(row[2] || '').trim();
      const rawAmount = String(row[4] || '').trim(); // IMPORTE EUROS column

      // Skip if not a valid transaction row
      if (!merchant || !rawDate || !rawAmount || 
          merchant === 'undefined' || rawAmount === 'undefined' ||
          !transactionNumber.match(/^\d+$/)) {
        continue;
      }

      // Format date to YYYY-MM-DD
      const formattedDate = formatDate(rawDate);
      
      // Clean and format amount (remove currency symbols, keep numbers and decimal separators)
      const cleanAmount = rawAmount.replace(/[^\d,.-]/g, '');
      
      // Skip if no valid amount
      if (!cleanAmount || cleanAmount === '0' || cleanAmount === '0.00') {
        continue;
      }
      
      // Add to calculated total for validation
      const numericAmount = parseFloat(cleanAmount.replace(',', '.')) || 0;
      calculatedTotal += numericAmount;
      
      // Categorize the transaction using shops database (exact match, case sensitive)
      const matchedShop = shops.find(shop => shop.shop_name === merchant);
      const category = matchedShop?.category || 'Otros gastos (otros)';
      
      // Debug logging for categorization issues
      if (!matchedShop && merchant && merchant !== 'undefined') {
        console.log(`No shop match found for merchant: \"${merchant}\"`);
      } else if (matchedShop && !matchedShop.category) {
        console.log(`Shop found but no category: \"${merchant}\" -> shop:`, matchedShop);
      }

      allExpenses.push({
        card_number: cardNumber,
        fecha: formattedDate,
        comercio: merchant,
        importe: cleanAmount,
        categoria: category,
      });
    }
  }

  return { expenses: allExpenses, calculatedTotal };
};

export const validateTotal = (calculatedTotal: number, expectedTotal: number): boolean => {
  if (expectedTotal > 0) {
    const difference = Math.abs(calculatedTotal - expectedTotal);
    if (difference > 0.10) { // Allow small rounding differences
      console.warn(`Total mismatch: Expected ${expectedTotal}€, calculated ${calculatedTotal}€ (difference: ${difference}€)`);
      // Don't throw error, just warn, as there might be minor formatting differences
    }
  }
  
  return expectedTotal > 0 ? Math.abs(calculatedTotal - expectedTotal) <= 0.10 : true;
};
