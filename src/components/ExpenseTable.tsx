import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronUp, ChevronDown } from "lucide-react";
import { ExpenseData } from "@/types/expense";
import { exportToCSV } from "@/utils/csvExporter";
import { cn } from "@/lib/utils";

interface ExpenseTableProps {
  expenses: ExpenseData[];
}

type SortField = keyof ExpenseData;
type SortDirection = 'asc' | 'desc';

export const ExpenseTable = ({ expenses }: ExpenseTableProps) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const totalAmount = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.importe.toString().replace(',', '.'));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Processed Expenses
          </h2>
          <p className="text-muted-foreground">
            {expenses.length} transactions • Total: €{totalAmount.toFixed(2)}
          </p>
        </div>
        <Button onClick={handleDownload} variant="default">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

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