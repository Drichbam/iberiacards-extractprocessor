import { ExpenseData } from "@/types/expense";

export const exportToCSV = (expenses: ExpenseData[]) => {
  // CSV headers
  const headers = ['Fecha', 'Cantidad', 'Título', 'Receptor', 'Uso', 'Categoría', 'Subcategoría'];
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      `"${expense.fecha}"`,
      `"${expense.cantidad}"`,
      `"${expense.titulo || ''}"`,
      `"${expense.receptor || ''}"`,
      `"${expense.uso || ''}"`,
      `"${expense.categoria}"`,
      `"${expense.subcategoria}"`
    ].join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};