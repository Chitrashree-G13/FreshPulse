import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let badgeText = 'Nominal';
  let barColor = 'bg-emerald-500';

  if (clamped >= 75) {
    colorClass = 'text-red-700 bg-red-50 border-red-200';
    badgeText = 'Critical';
    barColor = 'bg-red-600';
  } else if (clamped >= 50) {
    colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    badgeText = 'High Priority';
    barColor = 'bg-amber-500';
  } else if (clamped >= 25) {
    colorClass = 'text-yellow-700 bg-yellow-50 border-yellow-200';
    badgeText = 'Moderate';
    barColor = 'bg-yellow-500';
  }

  const dimensions = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-base font-bold',
    lg: 'w-20 h-20 text-2xl font-black'
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-xl border font-mono shadow-xs ${dimensions} ${colorClass}`}
        title={`Priority Score: ${clamped}/100 (${badgeText})`}
      >
        {clamped}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Priority Index
          </span>
          <span className="text-xs font-medium text-slate-700">{badgeText}</span>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
