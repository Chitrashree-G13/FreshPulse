import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'neutral' | 'success' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    critical: 'bg-red-50 text-red-700 border border-red-200 font-semibold',
    high: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
    medium: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    low: 'bg-slate-100 text-slate-700 border border-slate-200',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-sans tracking-tight transition-colors ${sizeClasses} ${variantClasses}`}
    >
      {children}
    </span>
  );
};
