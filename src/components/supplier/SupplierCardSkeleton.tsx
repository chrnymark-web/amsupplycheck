import React from 'react';

const SupplierCardSkeleton = () => {
  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 animate-pulse">
      <div className="flex gap-3 mb-3">
        {/* Logo skeleton */}
        <div className="w-12 h-12 lg:w-16 lg:h-16 flex-shrink-0 rounded-lg bg-gray-700/60 animate-pulse" />
        
        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name skeleton */}
          <div className="h-4 bg-gray-700/60 rounded w-3/4 animate-pulse" />
          {/* Location skeleton */}
          <div className="h-3 bg-gray-700/60 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      
      {/* Buttons skeleton */}
      <div className="flex gap-2 mt-3">
        <div className="flex-1 h-8 bg-gray-700/60 rounded animate-pulse" />
        <div className="flex-1 h-8 bg-gray-700/60 rounded animate-pulse" />
      </div>
    </div>
  );
};

export default SupplierCardSkeleton;
