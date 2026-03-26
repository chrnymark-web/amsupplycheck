import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Info, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCounterAnimation } from '@/hooks/use-counter-animation';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  maxDisplayItems?: number;
  filterInfo?: string;
  totalCount?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectionComplete?: () => void;
  stepNumber?: number;
  isActiveStep?: boolean;
  onTabToNext?: () => void;
  onTabToPrev?: () => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  className = "",
  maxDisplayItems = 2,
  filterInfo,
  totalCount,
  isOpen,
  onOpenChange,
  onSelectionComplete,
  stepNumber,
  isActiveStep,
  onTabToNext,
  onTabToPrev
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [badgePopoverOpen, setBadgePopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [shouldPulse, setShouldPulse] = useState(false);
  
  // Use controlled or uncontrolled state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  const animatedOptionsLength = useCounterAnimation({ end: options.length, duration: 500 });
  const animatedTotalCount = useCounterAnimation({ end: totalCount || 0, duration: 500 });

  const handleSelectValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter(v => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string) => {
    onValuesChange(selectedValues.filter(v => v !== value));
  };

  const clearAll = () => {
    onValuesChange([]);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  const isFiltered = totalCount && totalCount > options.length;

  useEffect(() => {
    if (isFiltered) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [options.length, isFiltered]);

  return (
    <div className={cn("w-full relative", className)}>
      {/* Step number indicator */}
      {stepNumber && (
        <div className={cn(
          "absolute -left-2 -top-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-300",
          isActiveStep 
            ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" 
            : selectedValues.length > 0 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
        )}>
          {selectedValues.length > 0 ? <Check className="h-3 w-3" /> : stepNumber}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            onKeyDown={(e) => {
              // Tab to next filter
              if (e.key === 'Tab' && !e.shiftKey && onTabToNext) {
                e.preventDefault();
                setOpen(false);
                onTabToNext();
              }
              // Shift+Tab to previous filter
              if (e.key === 'Tab' && e.shiftKey && onTabToPrev) {
                e.preventDefault();
                setOpen(false);
                onTabToPrev();
              }
              // Enter to open/confirm
              if (e.key === 'Enter' && !open) {
                e.preventDefault();
                setOpen(true);
              }
              // Escape to close and move to next
              if (e.key === 'Escape' && open) {
                e.preventDefault();
                setOpen(false);
              }
            }}
            className={cn(
              "flex items-center w-full h-10 px-3 rounded-md border border-input bg-background text-sm transition-all duration-300 relative hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isFiltered && "border-primary/40 shadow-sm shadow-primary/10 hover:border-primary/60",
              isActiveStep && "ring-2 ring-primary ring-offset-2 border-primary"
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
          <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelectValue(option)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedValues.includes(option) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
    </div>
  );
};

export default MultiSelect;
