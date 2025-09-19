import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { INGTransactionTable } from "@/components/INGTransactionTable";
import { processINGTransactions } from "@/utils/ingProcessor";
import { parseINGFile } from "@/utils/ingProcessor";
import { INGProcessingResult } from "@/types/ingTransaction";
import { toast } from "@/hooks/use-toast";
import { Banknote, Upload, FileText } from "lucide-react";

export default function INGBankExtractor() {
  const [processingResult, setProcessingResult] = useState<INGProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0]; // Process first file only for now
      
      console.log('Processing ING file:', file.name);
      
      // Parse the Excel/CSV file
      const rawData = await parseINGFile(file);
      console.log('Raw data parsed:', rawData.length, 'rows');
      
      // Process transactions
      const result = processINGTransactions(rawData);
      console.log('Transactions processed:', result.transactions.length);
      
      setProcessingResult(result);
      
      toast({
        title: "Archivo procesado exitosamente",
        description: `Se procesaron ${result.transactions.length} transacciones de ING`,
      });
      
    } catch (error) {
      console.error('Error processing ING file:', error);
      toast({
        title: "Error al procesar el archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessor = () => {
    setProcessingResult(null);
  };

  if (processingResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Banknote className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">ING Bank Extractor</h1>
              <p className="text-muted-foreground">
                Procesamiento completado - {processingResult.transactions.length} transacciones
              </p>
            </div>
          </div>
          <button
            onClick={resetProcessor}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            Procesar otro archivo
          </button>
        </div>
        
        <INGTransactionTable
          transactions={processingResult.transactions}
          calculatedTotal={processingResult.calculatedTotal}
          expectedTotal={processingResult.expectedTotal}
          totalMatch={processingResult.totalMatch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">ING Bank Extractor</h1>
          <p className="text-muted-foreground">
            Procesa y categoriza extractos de cuenta bancaria de ING
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Extracto de ING
          </CardTitle>
          <p className="text-muted-foreground">
            Sube un archivo Excel (.xlsx) o CSV con tu extracto bancario de ING para procesarlo automáticamente.
          </p>
        </CardHeader>
        <CardContent>
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileText className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Formato de archivo soportado</h3>
              <p className="text-sm text-muted-foreground mb-3">
                El procesador acepta archivos Excel (.xlsx) y CSV con las siguientes columnas:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Fecha:</strong> Fecha de la transacción</li>
                <li>• <strong>Cantidad/Importe:</strong> Monto de la transacción</li>
                <li>• <strong>Descripción/Concepto:</strong> Descripción de la transacción</li>
                <li>• <strong>Moneda:</strong> Tipo de moneda (opcional, por defecto EUR)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                El sistema automáticamente dividirá la descripción en Título, Receptor y Uso para mejor categorización.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}