import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Copy, Filter } from "lucide-react";
import { INGTransaction } from "@/types/ingTransaction";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface INGTransactionTableProps {
  transactions: INGTransaction[];
  calculatedTotal: number;
  expectedTotal: number;
  totalMatch: boolean;
}

type SortField = keyof INGTransaction;
type SortDirection = 'asc' | 'desc';

export const INGTransactionTable = ({ 
  transactions, 
  calculatedTotal, 
  expectedTotal, 
  totalMatch 
}: INGTransactionTableProps) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const categoryMatch = categoryFilter === 'all' || transaction.categoria === categoryFilter;
    const subcategoryMatch = subcategoryFilter === 'all' || transaction.subcategoria === subcategoryFilter;
    return categoryMatch && subcategoryMatch;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === 'cantidad') {
      const aNum = parseFloat(aValue.toString().replace(',', '.'));
      const bNum = parseFloat(bValue.toString().replace(',', '.'));
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }

    if (sortField === 'fecha') {
      return sortDirection === 'asc'
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }

    return sortDirection === 'asc'
      ? aValue.toString().localeCompare(bValue.toString())
      : bValue.toString().localeCompare(aValue.toString());
  });

  const handleDownload = () => {
    const headers = ['Fecha', 'Cantidad', 'Moneda', 'Descripción', 'Título', 'Receptor', 'Uso', 'Categoría', 'Subcategoría'];
    
    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => [
        `"${transaction.fecha}"`,
        `"${transaction.cantidad}"`,
        `"${transaction.moneda}"`,
        `"${transaction.descripcion}"`,
        `"${transaction.titulo}"`,
        `"${transaction.receptor}"`,
        `"${transaction.uso}"`,
        `"${transaction.categoria}"`,
        `"${transaction.subcategoria}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ing_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAllMerchants = () => {
    const uniqueMerchants = [...new Set(
      transactions.map(transaction => transaction.receptor)
    )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const merchantsList = uniqueMerchants.join('\n');
    navigator.clipboard.writeText(merchantsList);
    toast({
      title: "Comercios copiados al portapapeles",
      description: `${uniqueMerchants.length} comercios únicos copiados`,
    });
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-bold text-foreground hover:bg-transparent hover:text-primary"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </Button>
  );

  // Get unique categories and subcategories for filters
  const uniqueCategories = [...new Set(transactions.map(t => t.categoria))];
  const uniqueSubcategories = [...new Set(transactions.map(t => t.subcategoria))];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Transacciones ING Procesadas
          </h2>
          <p className="text-muted-foreground">
            {filteredTransactions.length} de {transactions.length} transacciones
            {(categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
              <span className="ml-2 text-xs">
                (filtradas por{' '}
                {categoryFilter !== 'all' && `categoría: ${categoryFilter}`}
                {categoryFilter !== 'all' && subcategoryFilter !== 'all' && ', '}
                {subcategoryFilter !== 'all' && `subcategoría: ${subcategoryFilter}`})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopyAllMerchants} variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copiar Comercios
          </Button>
          <Button onClick={handleDownload} variant="default">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Total Verification Section */}
      <div className="mb-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          {totalMatch ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          Verificación de Total
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Calculado:</span>
            <p className="font-semibold text-lg">€{calculatedTotal.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Esperado:</span>
            <p className="font-semibold text-lg">€{expectedTotal.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>
            <p className={cn("font-semibold", totalMatch ? "text-green-600" : "text-yellow-600")}>
              {totalMatch ? "✓ Coincide" : "⚠ Diferencia"}
            </p>
            {!totalMatch && (
              <p className="text-xs text-muted-foreground">
                Diferencia: €{Math.abs(calculatedTotal - expectedTotal).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las subcategorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las subcategorías</SelectItem>
            {uniqueSubcategories.map(subcategory => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton field="fecha">Fecha</SortButton></TableHead>
              <TableHead><SortButton field="cantidad">Cantidad</SortButton></TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead><SortButton field="titulo">Título</SortButton></TableHead>
              <TableHead><SortButton field="receptor">Receptor</SortButton></TableHead>
              <TableHead><SortButton field="uso">Uso</SortButton></TableHead>
              <TableHead><SortButton field="categoria">Categoría</SortButton></TableHead>
              <TableHead><SortButton field="subcategoria">Subcategoría</SortButton></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {new Date(transaction.fecha).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className={cn(
                  "font-mono font-medium",
                  parseFloat(transaction.cantidad.replace(',', '.')) < 0 
                    ? "text-red-600" 
                    : "text-green-600"
                )}>
                  {transaction.cantidad}
                </TableCell>
                <TableCell>{transaction.moneda}</TableCell>
                <TableCell className="max-w-32 truncate" title={transaction.titulo}>
                  {transaction.titulo}
                </TableCell>
                <TableCell className="max-w-48 truncate" title={transaction.receptor}>
                  {transaction.receptor}
                </TableCell>
                <TableCell className="max-w-32 truncate" title={transaction.uso}>
                  {transaction.uso}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-muted/30">
                    {transaction.categoria}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-muted/30">
                    {transaction.subcategoria}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedTransactions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay transacciones que mostrar con los filtros actuales.
        </div>
      )}
    </Card>
  );
};