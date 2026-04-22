import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'fullscreen';
  text?: string;
  className?: string;
  showSpinner?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'default',
  text = 'Loading...',
  className = '',
  showSpinner = true
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variants = {
    default: 'flex flex-col items-center justify-center p-8 space-y-4',
    minimal: 'flex items-center justify-center space-x-2',
    fullscreen: 'min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20'
  };

  const spinner = showSpinner ? (
    <div className="relative">
      <div className={cn(
        sizeClasses[size],
        'border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin'
      )} />
      {variant === 'fullscreen' && (
        <div className={cn(
          sizeClasses[size],
          'absolute inset-0 border border-blue-400/20 rounded-full animate-pulse'
        )} />
      )}
    </div>
  ) : null;

  const textElement = text && (
    <div className="relative">
      <p className={cn(
        'font-medium transition-all duration-300',
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
        variant === 'minimal' ? 'text-slate-600' : variant === 'fullscreen' ? 'text-lg text-slate-700' : 'text-slate-600',
        'animate-pulse'
      )}>
        {text}
      </p>
    </div>
  );

  return (
    <div className={cn(variants[variant], 'transition-all duration-500 ease-out', className)}>
      {variant === 'fullscreen' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {spinner}
        {textElement}
      </div>
    </div>
  );
};

export default Loading;
