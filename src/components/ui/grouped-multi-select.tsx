import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, ChevronRight, Folder, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCounterAnimation } from '@/hooks/use-counter-animation';
import type { CategoryGroup } from '@/lib/technologyMaterialCompatibility';

interface GroupedMultiSelectProps {
  options: string[];
  categories: CategoryGroup[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  maxDisplayItems?: number;
  filterInfo?: string;
  totalCount?: number;
  priceIndex?: Record<string, number>;
  getPriceTier?: (price: number) => { label: string; symbol: string };
}

const GroupedMultiSelect: React.FC<GroupedMultiSelectProps> = ({
  options,
  categories,
  selectedValues,
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  className = "",
  maxDisplayItems = 2,
  filterInfo,
  totalCount,
  priceIndex,
  getPriceTier
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories.map(c => c.name)));
  const [shouldPulse, setShouldPulse] = useState(false);
  
  const animatedOptionsLength = useCounterAnimation({ end: options.length, duration: 500 });
  const animatedTotalCount = useCounterAnimation({ end: totalCount || 0, duration: 500 });

  // Filter options within categories based on what's available
  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        options.includes(item) && 
        item.toLowerCase().includes(searchValue.toLowerCase())
      )
    })).filter(category => category.items.length > 0);
  }, [categories, options, searchValue]);

  // Items not in any category
  const uncategorizedItems = useMemo(() => {
    const categorizedItems = new Set(categories.flatMap(c => c.items));
    return options.filter(item => 
      !categorizedItems.has(item) && 
      item.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [categories, options, searchValue]);

  const handleSelectValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const handleSelectCategory = (category: CategoryGroup) => {
    const availableItems = category.items.filter(item => options.includes(item));
    const allSelected = availableItems.every(item => selectedValues.includes(item));
    
    if (allSelected) {
      // Deselect all in category
      onValuesChange(selectedValues.filter(v => !availableItems.includes(v)));
    } else {
      // Select all in category
      const newValues = [...new Set([...selectedValues, ...availableItems])];
      onValuesChange(newValues);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const isFiltered = totalCount && totalCount > options.length;

  useEffect(() => {
    if (isFiltered) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [options.length, isFiltered]);

  const getCategorySelectionState = (category: CategoryGroup): 'none' | 'partial' | 'all' => {
    const availableItems = category.items.filter(item => options.includes(item));
    const selectedCount = availableItems.filter(item => selectedValues.includes(item)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === availableItems.length) return 'all';
    return 'partial';
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex items-center w-full h-10 px-3 rounded-md border border-input bg-background text-sm transition-all duration-300 relative hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isFiltered && "border-primary/40 shadow-sm shadow-primary/10 hover:border-primary/60"
            )}
          >
            {/* Left side: Placeholder with count badge */}
            <div className="flex items-center gap-2 flex-1 min-w-0 mr-16">
              <span className={selectedValues.length > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                {placeholder}
              </span>
              {selectedValues.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                  {selectedValues.length}
                </Badge>
              )}
            </div>
            
            {/* Right side: Absolutely positioned badge + chevron */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isFiltered && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium animate-fade-in cursor-help transition-all duration-500 ease-bouncy",
                          shouldPulse 
                            ? "scale-105 bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <span className="whitespace-nowrap">{animatedOptionsLength}/{animatedTotalCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-semibold mb-1">Filtreret visning</p>
                      <p className="text-sm">
                        Viser <strong>{options.length}</strong> ud af <strong>{totalCount}</strong> muligheder
                        {filterInfo && (
                          <>
                            <br />
                            <span className="text-muted-foreground">{filterInfo}</span>
                          </>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '320px' }}>
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-80">
              <CommandEmpty>No options found.</CommandEmpty>
              
              {/* Categorized items */}
              {filteredCategories.map((category) => {
                const selectionState = getCategorySelectionState(category);
                const isExpanded = expandedCategories.has(category.name);
                
                return (
                  <CommandGroup key={category.name} className="p-0">
                    {/* Category header */}
                    <div 
                      className="flex items-center px-2 py-2 cursor-pointer hover:bg-accent/50 border-b border-border/50"
                      onClick={() => toggleCategory(category.name)}
                    >
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 mr-1 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium text-sm flex-1">{category.name}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs ml-2 cursor-pointer hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCategory(category);
                        }}
                      >
                        {selectionState === 'all' ? 'Deselect all' : 'Select all'}
                      </Badge>
                    </div>
                    
                    {/* Category items */}
                    {isExpanded && category.items.map((item) => {
                      const price = priceIndex?.[item];
                      const priceTier = price && getPriceTier ? getPriceTier(price) : null;
                      
                      return (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={() => handleSelectValue(item)}
                          className="cursor-pointer pl-8"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedValues.includes(item) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="flex-1">{item}</span>
                          {priceTier && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {priceTier.symbol}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{priceTier.label} (relative: {price?.toFixed(1)}x)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              })}
              
              {/* Uncategorized items */}
              {uncategorizedItems.length > 0 && (
                <CommandGroup heading="Other">
                  {uncategorizedItems.map((item) => {
                    const price = priceIndex?.[item];
                    const priceTier = price && getPriceTier ? getPriceTier(price) : null;
                    
                    return (
                      <CommandItem
                        key={item}
                        value={item}
                        onSelect={() => handleSelectValue(item)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedValues.includes(item) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">{item}</span>
                        {priceTier && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {priceTier.symbol}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GroupedMultiSelect;
