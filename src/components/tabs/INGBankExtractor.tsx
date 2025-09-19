import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

export default function INGBankExtractor() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ING Bank Extractor 
            <Badge variant="secondary" className="flex items-center gap-1">
              <Construction className="h-3 w-3" />
              Coming Soon
            </Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Process and categorize ING bank account extracts
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Construction className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feature Under Development</h3>
            <p className="text-muted-foreground max-w-md">
              The ING Bank Extractor functionality is being integrated from your existing app. 
              This will allow you to process ING bank statements using the same category system.
            </p>
            
            <div className="mt-6 p-4 bg-muted rounded-lg max-w-lg">
              <h4 className="font-medium mb-2">Planned Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Upload ING bank CSV extracts</li>
                <li>• Automatic transaction categorization</li>
                <li>• Shared category/subcategory system</li>
                <li>• Combined expense reporting</li>
                <li>• Export functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}