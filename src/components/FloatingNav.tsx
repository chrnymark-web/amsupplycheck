import React, { useState } from 'react';
import { Menu, X, Home, Map, Shield, Award, Mail, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloatingNavProps {
  onNavigate: (sectionId: string) => void;
  showScrollTop?: boolean;
  onScrollTop?: () => void;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ 
  onNavigate, 
  showScrollTop = false, 
  onScrollTop 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'why-choose', label: 'Why Us', icon: Shield },
    { id: 'benefits', label: 'Benefits', icon: Award },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId);
    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
        {/* Navigation Menu Items */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {navItems.map((item, index) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    "group flex items-center gap-3 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
                    "transition-all duration-300",
                    isOpen ? "delay-[" + (index * 50) + "ms]" : ""
                  )}
                  style={{
                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                  }}
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Go to {item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Scroll to Top Button - Shows when scrolled down */}
        {showScrollTop && onScrollTop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={onScrollTop}
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg bg-gradient-primary hover:shadow-xl transition-all duration-300 hover:scale-110 hover:opacity-100",
                  !isOpen ? "opacity-60" : "opacity-0 pointer-events-none"
                )}
                aria-label="Scroll to top"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Back to top</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Main FAB Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "h-14 w-14 rounded-full shadow-lg bg-gradient-primary hover:shadow-2xl transition-all duration-300 hover:scale-125 hover:rotate-90 hover:opacity-100 opacity-60",
                isOpen && "rotate-90 scale-110"
              )}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <X className="h-6 w-6 transition-transform duration-300" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-300" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? 'Close menu' : 'Quick Navigation'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default FloatingNav;
