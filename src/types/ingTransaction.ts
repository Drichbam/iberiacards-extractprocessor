export interface INGTransaction {
  fecha: string;
  cantidad: string;
  moneda: string;
  descripcion: string;
  titulo: string;
  receptor: string;
  uso: string;
  categoria: string;
  subcategoria: string;
}

export interface INGProcessingResult {
  transactions: INGTransaction[];
  calculatedTotal: number;
  expectedTotal: number;
  totalMatch: boolean;
  rawData: any[][];
}