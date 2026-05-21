import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Category } from '@/types';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryDialogProps) {
  const handleCategoryClick = (categoryName: string) => {
    onSelectCategory(categoryName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">All Categories</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 md:space-y-4">
            {/* All Products Option */}
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2.5 md:py-3 text-sm md:text-base font-medium transition-all duration-200 hover:scale-105 hover:shadow-md w-full justify-center"
              onClick={() => handleCategoryClick('all')}
            >
              All Products
            </Badge>

            {/* Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2.5 md:py-3 text-sm md:text-base font-medium transition-all duration-200 hover:scale-105 hover:shadow-md justify-center"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
