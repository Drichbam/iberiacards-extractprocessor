import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CategoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const CategoryFilters = ({ searchTerm, onSearchChange }: CategoryFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-3">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
    </div>
  );
};