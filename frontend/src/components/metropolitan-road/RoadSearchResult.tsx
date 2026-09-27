import React from 'react';
import { MetropolitanRoad } from '@/types';
import { AlertCircle, Info, Landmark, MapPin } from 'lucide-react';
import { RoadStatusBadge } from './RoadStatusBadge';

interface RoadSearchResultProps {
  query: string;
  results: MetropolitanRoad[];
  onSelectRoad?: (road: MetropolitanRoad) => void;
}

export function RoadSearchResult({
  query,
  results,
  onSelectRoad,
}: RoadSearchResultProps) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const hasResults = results.length > 0;
  const topMatch = results[0];

  return (
    <div className="w-full">
      {hasResults ? (
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-emerald-950/30 p-3.5 sm:p-4 shadow-lg transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <RoadStatusBadge isMetropolitan={true} compact={true} />
                {topMatch.district && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    {topMatch.district}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">{topMatch.roadName}</span>
              </h3>

              <p className="text-xs text-emerald-300 font-semibold">
                Bu cadde Büyükşehir Belediyesi'ne bağlı yollar listesinde yer almaktadır.
              </p>
            </div>

            {onSelectRoad && (
              <button
                type="button"
                onClick={() => onSelectRoad(topMatch)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                Detay Gör →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                Aradığınız cadde Büyükşehir Belediyesi'ne bağlı yollar listesinde bulunamadı.
              </h4>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1 font-bold text-slate-300">
                  <Info className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>Not:</span>
                </div>
                <p className="leading-relaxed">
                  Bu sonuç yalnızca sisteme yüklenen resmi/operasyonel listeye göre oluşturulmuştur. Listede bulunmaması tek başına izin makamının belirlenmesi anlamına gelmez.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
