import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Copy, Filter } from "lucide-react";
import { INGTransactionData } from "@/types/ingTransaction";
import { Category } from "@/types/category";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface INGTransactionTableProps {
  transactions: INGTransactionData[];
  calculatedTotal: number;
  totalMatch: boolean;
  categories: Category[];
}

type SortField = keyof INGTransactionData;
type SortDirection = 'asc' | 'desc';

const exportToCSV = (transactions: INGTransactionData[], filename: string = 'ing_transactions') => {
  const headers = ['Fecha', 'Cantidad', 'Título', 'Receptor', 'Uso', 'Categoría', 'Subcategoría'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(transaction => [
      transaction.fecha,
      transaction.cantidad,
      `"${transaction.titulo}"`,
      `"${transaction.receptor}"`,
      `"${transaction.uso}"`,
      `"${transaction.categoria}"`,
      `"${transaction.subcategoria}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const INGTransactionTable = ({ transactions, calculatedTotal, totalMatch, categories }: INGTransactionTableProps) => {
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Get unique categories and subcategories for filters
  const uniqueCategories = [...new Set(transactions.map(t => t.categoria))].sort();
  const uniqueSubcategories = [...new Set(transactions.map(t => t.subcategoria))].sort();

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (categoryFilter !== 'all' && transaction.categoria !== categoryFilter) return false;
    if (subcategoryFilter !== 'all' && transaction.subcategoria !== subcategoryFilter) return false;
    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal: string | number = a[sortField];
    let bVal: string | number = b[sortField];

    // Handle date sorting
    if (sortField === 'fecha') {
      aVal = new Date(aVal as string).getTime();
      bVal = new Date(bVal as string).getTime();
    }

    // Handle numeric sorting for cantidad
    if (sortField === 'cantidad') {
      aVal = parseFloat((aVal as string).replace(',', '.'));
      bVal = parseFloat((bVal as string).replace(',', '.'));
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate filtered total
  const filteredTotal = filteredTransactions.reduce((sum, transaction) => {
    return sum + parseFloat(transaction.cantidad.replace(',', '.'));
  }, 0);

  // Prepare data for pie chart
  const categoryTotals = uniqueCategories.map(categoria => {
    const categoryTransactions = filteredTransactions.filter(t => t.categoria === categoria);
    const total = categoryTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.cantidad.replace(',', '.'))), 0);
    const categoryData = categories.find(c => c.name === categoria);
    
    return {
      name: categoria,
      value: total,
      color: categoryData?.color || 'hsl(var(--primary))',
      count: categoryTransactions.length
    };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(sortedTransactions, `ing_transactions_${timestamp}`);
    toast({
      title: "Exportación completada",
      description: `${sortedTransactions.length} transacciones exportadas a CSV`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado al portapapeles",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transacciones</p>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calculado</p>
              <p className="text-2xl font-bold">{filteredTotal.toFixed(2).replace('.', ',')}€</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant={totalMatch ? "default" : "destructive"} className="mt-1">
                {totalMatch ? "Procesado" : "Error"}
              </Badge>
            </div>
            {totalMatch ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            )}
          </div>
        </Card>
      </div>

      {/* Charts */}
      {categoryTotals.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución por Categorías</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)}€`, 'Total']}
                  labelFormatter={(name) => `Categoría: ${name}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Filters and Export */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las subcategorías</SelectItem>
                {uniqueSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Transactions Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                  <div className="flex items-center gap-1">
                    Fecha {getSortIcon('fecha')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('cantidad')}>
                  <div className="flex items-center gap-1">
                    Cantidad {getSortIcon('cantidad')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('titulo')}>
                  <div className="flex items-center gap-1">
                    Título {getSortIcon('titulo')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('receptor')}>
                  <div className="flex items-center gap-1">
                    Receptor {getSortIcon('receptor')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('uso')}>
                  <div className="flex items-center gap-1">
                    Uso {getSortIcon('uso')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('categoria')}>
                  <div className="flex items-center gap-1">
                    Categoría {getSortIcon('categoria')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('subcategoria')}>
                  <div className="flex items-center gap-1">
                    Subcategoría {getSortIcon('subcategoria')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction, index) => {
                const categoryData = categories.find(c => c.name === transaction.categoria);
                const amount = parseFloat(transaction.cantidad.replace(',', '.'));
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono">
                      <button
                        onClick={() => copyToClipboard(transaction.fecha)}
                        className="hover:bg-muted p-1 rounded flex items-center gap-1"
                      >
                        {transaction.fecha}
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    </TableCell>
                    <TableCell className={cn(
                      "font-mono font-semibold",
                      amount >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.cantidad}€
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(transaction.titulo)}
                        className="hover:bg-muted p-1 rounded text-left"
                      >
                        {transaction.titulo}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(transaction.receptor)}
                        className="hover:bg-muted p-1 rounded text-left"
                      >
                        {transaction.receptor}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(transaction.uso)}
                        className="hover:bg-muted p-1 rounded text-left"
                      >
                        {transaction.uso}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: categoryData?.color || 'hsl(var(--primary))' }}
                        className="text-white"
                      >
                        {transaction.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.subcategoria}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {sortedTransactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron transacciones con los filtros aplicados.
          </div>
        )}
      </Card>
    </div>
  );
};