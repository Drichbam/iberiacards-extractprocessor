import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { ExpenseData } from "@/types/expense";
import { exportToCSV } from "@/utils/csvExporter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExpenseTableProps {
  expenses: ExpenseData[];
  calculatedTotal: number;
  expectedTotal: number;
  totalMatch: boolean;
}

type SortField = keyof ExpenseData;
type SortDirection = 'asc' | 'desc';

export const ExpenseTable = ({ expenses, calculatedTotal, expectedTotal, totalMatch }: ExpenseTableProps) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'importe') {
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
    exportToCSV(expenses);
  };

  const handleCopyOtherShops = () => {
    const otherShops = [...new Set(
      expenses
        .filter(expense => expense.categoria === "Otros gastos (otros)")
        .map(expense => expense.comercio)
    )];
    
    const shopsList = otherShops.join('\n');
    navigator.clipboard.writeText(shopsList);
    toast({
      title: "Copied to clipboard",
      description: `${otherShops.length} unique shops copied`,
    });
  };

  const getCategoryColor = (categoria: string) => {
    const categoryColors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Health & Medical': 'bg-green-100 text-green-800',
      'Travel': 'bg-cyan-100 text-cyan-800',
      'Bills & Utilities': 'bg-red-100 text-red-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return categoryColors[categoria] || categoryColors['Other'];
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Processed Expenses
          </h2>
          <p className="text-muted-foreground">
            {expenses.length} transactions
          </p>
        </div>
        <Button onClick={handleDownload} variant="default">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Total Verification Section */}
      <div className="mb-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          {totalMatch ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}
          Total Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Calculated Total:</span>
            <p className="font-semibold text-lg">€{calculatedTotal.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expected Total (TOTAL A CARGAR):</span>
            <p className="font-semibold text-lg">€{expectedTotal.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <p className={cn("font-semibold", totalMatch ? "text-green-600" : "text-orange-600")}>
              {totalMatch ? "✓ Match" : "⚠ Difference"}
            </p>
            {!totalMatch && (
              <p className="text-xs text-muted-foreground">
                Difference: €{Math.abs(calculatedTotal - expectedTotal).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory Breakdown */}
      <div className="mb-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold text-foreground mb-3">Spending by Subcategory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(() => {
            const categoryTotals = expenses.reduce((acc, expense) => {
              const amount = parseFloat(expense.importe.replace(',', '.')) || 0;
              acc[expense.categoria] = (acc[expense.categoria] || 0) + amount;
              return acc;
            }, {} as Record<string, number>);
            
            const grandTotal = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
            
            return Object.entries(categoryTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([category, total]) => {
                const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                return (
                  <div key={category} className="flex justify-between items-center p-2 rounded bg-background/50">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getCategoryColor(category))}
                      >
                        {category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{percentage.toFixed(1)}%</div>
                      <div className="font-bold text-base text-foreground">€{total.toFixed(2)}</div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      </div>

      {/* Otros gastos (otros) Shops */}
      {expenses.some(expense => expense.categoria === "Otros gastos (otros)") && (
        <div className="mb-6 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Shops Categorized as "Otros gastos (otros)"</h3>
            <Button
              onClick={handleCopyOtherShops}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy List
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {[...new Set(
              expenses
                .filter(expense => expense.categoria === "Otros gastos (otros)")
                .map(expense => expense.comercio)
            )].length} unique shops
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {[...new Set(
              expenses
                .filter(expense => expense.categoria === "Otros gastos (otros)")
                .map(expense => expense.comercio)
            )]
              .sort()
              .map((shop, index) => (
                <div key={index} className="text-sm p-2 rounded bg-background/50 border">
                  {shop}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">
                <SortButton field="card_number">Card Number</SortButton>
              </TableHead>
              <TableHead className="font-semibold">
                <SortButton field="fecha">Date</SortButton>
              </TableHead>
              <TableHead className="font-semibold">
                <SortButton field="comercio">Merchant</SortButton>
              </TableHead>
              <TableHead className="font-semibold text-right">
                <SortButton field="importe">Amount</SortButton>
              </TableHead>
              <TableHead className="font-semibold">
                <SortButton field="categoria">Subcategory</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense, index) => (
              <TableRow key={index} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">
                  {expense.card_number}
                </TableCell>
                <TableCell className="text-sm">
                  {expense.fecha}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {expense.comercio}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  €{expense.importe}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getCategoryColor(expense.categoria))}
                  >
                    {expense.categoria}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};