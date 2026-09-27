import React from 'react';
import { MetropolitanRoad } from '@/types';
import { MapPin, ChevronRight, Landmark } from 'lucide-react';
import { RoadStatusBadge } from './RoadStatusBadge';

interface RoadListItemProps {
  road: MetropolitanRoad;
  onSelectRoad: (road: MetropolitanRoad) => void;
  showDistrict?: boolean;
}

export function RoadListItem({
  road,
  onSelectRoad,
  showDistrict = true,
}: RoadListItemProps) {
  return (
    <tr
      onClick={() => onSelectRoad(road)}
      className="group border-b border-slate-800/60 hover:bg-slate-800/40 transition-all cursor-pointer select-none"
    >
      {/* Cadde / Yol Adı */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:border-blue-500/40 transition-colors">
            <Landmark className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-xs sm:text-sm block group-hover:text-blue-300 transition-colors">
              {road.roadName}
            </span>
            {road.notes && (
              <span className="text-[11px] text-slate-400 block truncate max-w-[260px] sm:max-w-none">
                {road.notes}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* İlçe (Opsiyonel) */}
      {showDistrict && (
        <td className="px-4 py-3.5 text-xs text-slate-300 font-semibold">
          {road.district ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-200">
              <MapPin className="h-3 w-3 text-slate-400" />
              {road.district}
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </td>
      )}

      {/* Yetkili Kurum */}
      <td className="px-4 py-3.5 text-xs font-semibold text-slate-300 hidden md:table-cell">
        Büyükşehir Belediyesi
      </td>

      {/* Durum */}
      <td className="px-4 py-3.5">
        <RoadStatusBadge isMetropolitan={true} compact={true} />
      </td>

      {/* Ok İkonu */}
      <td className="px-4 py-3.5 text-right">
        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-all ml-auto">
          <ChevronRight className="h-4 w-4" />
        </div>
      </td>
    </tr>
  );
}
