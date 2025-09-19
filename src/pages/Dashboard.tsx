import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Building2, Store, Settings } from "lucide-react";

// Tab content components
import CreditCardExpenseCategorizer from "@/components/tabs/CreditCardExpenseCategorizer";
import INGBankExtractor from "@/components/tabs/INGBankExtractor";
import ShopCategoriesTab from "@/components/tabs/ShopCategoriesTab";
import CategoryManagementTab from "@/components/tabs/CategoryManagementTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("credit-card");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Expense Management Dashboard</h1>
          <p className="text-muted-foreground">
            Categorize and manage your bank extracts and expenses
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="credit-card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credit Card Expenses
            </TabsTrigger>
            <TabsTrigger value="ing-bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              ING Bank Extractor
            </TabsTrigger>
            <TabsTrigger value="shop-categories" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Shop Categories
            </TabsTrigger>
            <TabsTrigger value="category-management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Category Management
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="credit-card" className="space-y-6">
              <CreditCardExpenseCategorizer />
            </TabsContent>

            <TabsContent value="ing-bank" className="space-y-6">
              <INGBankExtractor />
            </TabsContent>

            <TabsContent value="shop-categories" className="space-y-6">
              <ShopCategoriesTab />
            </TabsContent>

            <TabsContent value="category-management" className="space-y-6">
              <CategoryManagementTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}