import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";

interface FilterSectionProps {
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    selectedUrgency: string;
    setSelectedUrgency: (urgency: string) => void;
}

const urgencyLevels = ['All', 'high', 'medium', 'low'];

const FilterCampaign: React.FC<FilterSectionProps> = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency
}) => {
  const categoryOptions = ['All', ...categories];
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter className="mr-2" />
            Category: {selectedCategory}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {categoryOptions.map((category) => (
            <DropdownMenuItem
              key={category}
              onSelect={() => setSelectedCategory(category)}
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Urgency Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter className="mr-2" />
            Urgency: {selectedUrgency}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {urgencyLevels.map((urgency) => (
            <DropdownMenuItem 
              key={urgency} 
              onSelect={() => setSelectedUrgency(urgency)}
            >
              {urgency}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default FilterCampaign;
