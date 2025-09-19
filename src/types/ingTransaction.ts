export interface INGTransactionData {
  fecha: string;
  cantidad: string;
  titulo: string;
  receptor: string;
  uso: string;
  categoria: string;
  subcategoria: string;
}

export interface INGProcessingResult {
  transactions: INGTransactionData[];
  calculatedTotal: number;
  totalMatch: boolean;
}