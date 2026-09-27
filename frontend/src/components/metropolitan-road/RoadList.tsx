import React, { useState, useEffect } from 'react';
import { MetropolitanRoad } from '@/types';
import { MapPin, Database, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Layers } from 'lucide-react';

interface RoadListProps {
  roads: MetropolitanRoad[];
  onSelectRoad: (road: MetropolitanRoad) => void;
  query?: string;
  hasDataLoaded?: boolean;
}

export function RoadList({
  roads,
  onSelectRoad,
  query = '',
  hasDataLoaded = true,
}: RoadListProps) {
  // State for tracking open/collapsed district accordions
  const [openDistricts, setOpenDistricts] = useState<Record<string, boolean>>({});

  // Group roads by District while preserving PDF appearance order
  const groupedByDistrict: { district: string; items: MetropolitanRoad[] }[] = [];
  const districtMap = new Map<string, MetropolitanRoad[]>();

  roads.forEach((road) => {
    const dist = road.district || 'DİĞER';
    if (!districtMap.has(dist)) {
      districtMap.set(dist, []);
      groupedByDistrict.push({ district: dist, items: districtMap.get(dist)! });
    }
    districtMap.get(dist)!.push(road);
  });

  // Default districts to CLOSED on initial load, but OPEN when searching
  useEffect(() => {
    const isSearching = query.trim().length > 0;
    const initial: Record<string, boolean> = {};
    groupedByDistrict.forEach((g) => {
      initial[g.district] = isSearching;
    });
    setOpenDistricts(initial);
  }, [roads.length, query]);

  const toggleDistrict = (district: string) => {
    setOpenDistricts((prev) => ({
      ...prev,
      [district]: !prev[district],
    }));
  };

  const isAllOpen = groupedByDistrict.length > 0 && groupedByDistrict.every((g) => openDistricts[g.district]);

  const toggleAll = () => {
    const nextState = !isAllOpen;
    const updated: Record<string, boolean> = {};
    groupedByDistrict.forEach((g) => {
      updated[g.district] = nextState;
    });
    setOpenDistricts(updated);
  };

  if (!hasDataLoaded) {
    return (
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-center space-y-1.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <Database className="h-4 w-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-200">Cadde listesi henüz sisteme yüklenmedi.</h4>
      </div>
    );
  }

  if (roads.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-center space-y-1.5">
        <p className="text-xs font-semibold text-slate-300">
          {query ? `“${query}” aramasına uygun cadde/yol bulunamadı.` : 'Kayıtlı cadde bulunamadı.'}
        </p>
      </div>
    );
  }

  const isSearching = query.trim().length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
      {/* List Sub-Header & Accordion Master Controller */}
      <div className="flex items-center justify-between px-0.5 pb-1.5 shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-blue-500/15 text-blue-400">
            <Layers className="h-3 w-3" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">
            Resmi İlçe & Cadde Grupları
          </span>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] font-bold text-blue-300 hover:bg-slate-700/90 hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          {isAllOpen ? (
            <>
              <ChevronsUp className="h-3 w-3 text-blue-400" />
              <span>Hepsini Kapat</span>
            </>
          ) : (
            <>
              <ChevronsDown className="h-3 w-3 text-blue-400" />
              <span>Hepsini Aç</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid View Container (Fits screen without body scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {groupedByDistrict.map((group) => {
            const isOpen = openDistricts[group.district] ?? isSearching;

            return (
              <div
                key={group.district}
                className="bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-hidden backdrop-blur-md shadow-md flex flex-col h-fit transition-all"
              >
                {/* Collapsible İlçe Header Button */}
                <button
                  type="button"
                  onClick={() => toggleDistrict(group.district)}
                  className="w-full px-2.5 py-1.5 bg-slate-800/90 border-b border-slate-700/70 hover:bg-slate-800 flex items-center justify-between shrink-0 transition-colors cursor-pointer select-none text-left"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-bold tracking-wide text-slate-100 uppercase truncate">
                      {group.district}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900/90 text-blue-300 border border-slate-700/60">
                      {group.items.length} Yol
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Body with Smooth Transition & Internal Scroll */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="divide-y divide-slate-800/60 max-h-[160px] sm:max-h-[200px] overflow-y-auto">
                      {group.items.map((road, idx) => (
                        <div
                          key={`${road.id}-${idx}`}
                          onClick={() => onSelectRoad(road)}
                          className="px-2.5 py-1 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-2 group select-none"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1 h-1 rounded-full bg-blue-400/80 group-hover:bg-blue-400 shrink-0" />
                            <span className="text-[10.5px] font-medium text-slate-200 group-hover:text-blue-300 transition-colors leading-tight truncate">
                              {road.roadName}
                            </span>
                          </div>

                          {isSearching && (
                            <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 shrink-0">
                              Büyükşehir
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
