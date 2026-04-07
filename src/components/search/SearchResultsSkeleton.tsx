import React from 'react';
import { Card } from '@/components/ui/card';

interface SearchResultsSkeletonProps {
  count?: number;
}

const ShimmerSkeleton = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div 
    className={`bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  />
);

const SearchResultsSkeleton: React.FC<SearchResultsSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {[...Array(count)].map((_, index) => (
        <Card 
          key={index} 
          className="p-4 space-y-4 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Header with logo and name */}
          <div className="flex items-start gap-4">
            <ShimmerSkeleton className="w-16 h-16 rounded-lg flex-shrink-0" delay={index * 50} />
            <div className="flex-1 space-y-2">
              <ShimmerSkeleton className="h-5 w-3/4" delay={index * 50 + 50} />
              <ShimmerSkeleton className="h-4 w-1/2" delay={index * 50 + 100} />
              <div className="flex gap-2">
                <ShimmerSkeleton className="h-5 w-16 rounded-full" delay={index * 50 + 150} />
                <ShimmerSkeleton className="h-5 w-20 rounded-full" delay={index * 50 + 200} />
              </div>
            </div>
          </div>
          
          {/* Technologies/Materials badges */}
          <div className="flex flex-wrap gap-2">
            <ShimmerSkeleton className="h-6 w-20 rounded-full" delay={index * 50 + 250} />
            <ShimmerSkeleton className="h-6 w-24 rounded-full" delay={index * 50 + 300} />
            <ShimmerSkeleton className="h-6 w-16 rounded-full" delay={index * 50 + 350} />
            <ShimmerSkeleton className="h-6 w-28 rounded-full" delay={index * 50 + 400} />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <ShimmerSkeleton className="h-4 w-full" delay={index * 50 + 450} />
            <ShimmerSkeleton className="h-4 w-5/6" delay={index * 50 + 500} />
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <ShimmerSkeleton className="h-9 flex-1 rounded-md" delay={index * 50 + 550} />
            <ShimmerSkeleton className="h-9 w-24 rounded-md" delay={index * 50 + 600} />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SearchResultsSkeleton;