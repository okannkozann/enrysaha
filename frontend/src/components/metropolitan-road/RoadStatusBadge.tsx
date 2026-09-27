import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RoadStatusBadgeProps {
  isMetropolitan?: boolean;
  compact?: boolean;
  className?: string;
}

export function RoadStatusBadge({
  isMetropolitan = true,
  compact = false,
  className = '',
}: RoadStatusBadgeProps) {
  if (isMetropolitan) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>{compact ? 'Büyükşehir' : 'Büyükşehir Belediyesi'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm ${className}`}
    >
      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span>{compact ? 'Listede Yok' : 'Listede Bulunamadı'}</span>
    </span>
  );
}
