import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Copy, Filter } from "lucide-react";
import { ExpenseData } from "@/types/expense";
import { Category } from "@/types/category";
import { Subcategory } from "@/types/subcategory";
import { exportToCSV } from "@/utils/csvExporter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenseTableProps {
  expenses: ExpenseData[];
  calculatedTotal?: number;
  expectedTotal?: number;
  totalMatch?: boolean;
  categories: Category[];
  subcategories?: Subcategory[];
}

type SortField = 'fecha' | 'cantidad' | 'titulo' | 'receptor' | 'uso' | 'categoria' | 'subcategoria';
type SortDirection = 'asc' | 'desc';

export const ExpenseTable = ({ expenses, calculatedTotal, expectedTotal, totalMatch, categories, subcategories = [] }: ExpenseTableProps) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [selectedCategoryForSubcategories, setSelectedCategoryForSubcategories] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter expenses by category and subcategory
  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = categoryFilter === 'all' || expense.categoria === categoryFilter;
    const subcategoryMatch = subcategoryFilter === 'all' || expense.subcategoria === subcategoryFilter;
    return categoryMatch && subcategoryMatch;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
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
    exportToCSV(expenses);
  };

  const handleCopyOtherShops = () => {
    const otherShops = [...new Set(
      expenses
        .filter(expense => expense.categoria === "Otros gastos (otros)")
        .map(expense => expense.receptor || expense.titulo)
        .filter(Boolean)
    )].sort();
    
    const shopsList = otherShops.join('\n');
    navigator.clipboard.writeText(shopsList);
    toast({
      title: "Copied to clipboard",
      description: `${otherShops.length} unique shops copied`,
      variant: "success",
    });
  };

  const handleCopyAllMerchants = () => {
    const uniqueMerchants = [...new Set(
      expenses.map(expense => expense.receptor || expense.titulo).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    
    const merchantsList = uniqueMerchants.join('\n');
    navigator.clipboard.writeText(merchantsList);
    toast({
      title: "Merchants copied to clipboard",
      description: `${uniqueMerchants.length} unique merchants copied`,
      variant: "success",
    });
  };

  const getCategoryColor = (categoria: string) => {
    const category = categories.find(cat => cat.name === categoria);
    if (category) {
      // Generate light background and darker text based on category color
      return `bg-[${category.color}20] text-[${category.color}] border-[${category.color}40]`;
    }
    return 'bg-muted text-muted-foreground border-border';
  };

  const getCategoryHexColor = (categoria: string) => {
    const category = categories.find(cat => cat.name === categoria);
    return category?.color || 'hsl(var(--muted-foreground))'; // Default using design system
  };

  const getPieChartCategoryColor = (categoria: string) => {
    return getCategoryHexColor(categoria);
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Processed Expenses
          </h2>
          <p className="text-muted-foreground">
            {filteredExpenses.length} of {expenses.length} transactions
            {(categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
              <span className="ml-2 text-xs">
                (filtered by{' '}
                {categoryFilter !== 'all' && `category: ${categoryFilter}`}
                {categoryFilter !== 'all' && subcategoryFilter !== 'all' && ', '}
                {subcategoryFilter !== 'all' && `subcategory: ${subcategoryFilter}`})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopyAllMerchants} variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy Merchants
          </Button>
          <Button onClick={handleDownload} variant="default">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Total Verification Section */}
      {(calculatedTotal !== undefined && expectedTotal !== undefined) && (
        <div className="mb-6 p-4 rounded-lg border bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            {totalMatch ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
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
              <p className={cn("font-semibold", totalMatch ? "text-success" : "text-warning")}>
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
      )}

      {/* Category Breakdown */}
      <div className="mb-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold text-foreground mb-4">Spending by Category</h3>
        
        {(() => {
          const categoryTotals = expenses.reduce((acc, expense) => {
            const amount = Math.abs(parseFloat(expense.cantidad.replace(',', '.'))) || 0;
            acc[expense.categoria] = (acc[expense.categoria] || 0) + amount;
            return acc;
          }, {} as Record<string, number>);
          
          const grandTotal = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
          
          const categoryData = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, total]) => {
              const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return {
                name: category,
                value: total,
                percentage: percentage
              };
            });

          // Use actual category colors for pie chart
          const getCategoryColorForPie = (categoryName: string) => {
            return getCategoryHexColor(categoryName);
          };
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Summary Table</h4>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted border-b-2 border-border">
                        <TableHead className="font-bold text-foreground w-12">Color</TableHead>
                        <TableHead className="font-bold text-foreground">Category</TableHead>
                        <TableHead className="font-bold text-foreground text-right">Percentage</TableHead>
                        <TableHead className="font-bold text-foreground text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.map((item, index) => (
                        <TableRow 
                          key={item.name} 
                          className={cn(
                            "hover:bg-muted/30 cursor-pointer transition-colors",
                            selectedCategoryForSubcategories === item.name && "bg-primary/10 border-l-4 border-l-primary"
                          )}
                          onClick={() => {
                            if (selectedCategoryForSubcategories === item.name) {
                              setSelectedCategoryForSubcategories(null);
                            } else {
                              setSelectedCategoryForSubcategories(item.name);
                            }
                          }}
                        >
                          <TableCell className="w-12">
                            <div 
                              className="w-4 h-4 rounded-sm border border-border" 
                              style={{ backgroundColor: getCategoryColorForPie(item.name) }}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getCategoryColor(item.name))}
                            >
                              {item.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            €{item.value.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Visual Distribution</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ percentage, index }) => {
                          if (percentage < 5) return '';
                          return `${percentage.toFixed(1)}%`;
                        }}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColorForPie(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            const data = payload[0];
                            const category = data.payload?.name || 'Unknown';
                            const value = Number(data.value) || 0;
                            const percentage = data.payload?.percentage || 0;
                            return (
                              <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-xs">
                                <p className="font-bold text-foreground text-base mb-2">
                                  {category}
                                </p>
                                <p className="text-primary font-semibold text-sm">
                                  €{value.toFixed(2)}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {percentage.toFixed(1)}% of total spending
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted border-b-2 border-border">
              <TableHead className="font-bold text-foreground">
                <SortButton field="fecha">Fecha</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground text-right">
                <SortButton field="cantidad">Cantidad</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground">
                <SortButton field="titulo">Título</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground">
                <SortButton field="receptor">Receptor</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground">
                <SortButton field="uso">Uso</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground">
                <SortButton field="categoria">Categoría</SortButton>
              </TableHead>
              <TableHead className="font-bold text-foreground">
                <SortButton field="subcategoria">Subcategoría</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense, index) => (
              <TableRow key={index} className="hover:bg-muted/30">
                <TableCell>{expense.fecha}</TableCell>
                <TableCell className="text-right font-mono">
                  {parseFloat(expense.cantidad) >= 0 ? '+' : ''}{expense.cantidad}€
                </TableCell>
                <TableCell className="max-w-xs truncate" title={expense.titulo}>
                  {expense.titulo}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={expense.receptor}>
                  {expense.receptor}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={expense.uso}>
                  {expense.uso}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getCategoryColor(expense.categoria)}
                  >
                    {expense.categoria}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getCategoryColor(expense.subcategoria)}
                  >
                    {expense.subcategoria}
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