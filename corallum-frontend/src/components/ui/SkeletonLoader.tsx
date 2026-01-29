import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '40px')
      }}
    />
  );
};

// 🎯 Специализированные скелеты для разных компонентов
export const NodeSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
    </div>
  </div>
);

export const WorkflowSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton width={200} height={24} />
        <Skeleton width={300} height={16} />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={80} height={36} />
      </div>
    </div>
    
    {/* Canvas skeleton */}
    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-96 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton variant="circular" width={64} height={64} className="mx-auto" />
        <Skeleton width={200} height={20} className="mx-auto" />
        <Skeleton width={300} height={16} className="mx-auto" />
      </div>
    </div>
    
    {/* Sidebar skeleton */}
    <div className="flex space-x-4">
      <div className="w-64 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <NodeSkeleton key={i} />
        ))}
      </div>
      <div className="flex-1">
        <Skeleton variant="rounded" height={400} />
      </div>
    </div>
  </div>
);

export const SidebarSkeleton: React.FC = () => (
  <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
    <Skeleton width={120} height={20} />
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width="80%" height={16} />
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
    {/* Header */}
    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={16} />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} height={14} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 🎯 Hook для условительного рендеринга скелетов
export const useSkeleton = (loading: boolean, skeletonComponent: React.ComponentType) => {
  if (loading) {
    return skeletonComponent;
  }
  return null;
};

export default Skeleton;
