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

  // Automatically expand all districts on load or when searching
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    groupedByDistrict.forEach((g) => {
      initial[g.district] = true;
    });
    setOpenDistricts(initial);
  }, [roads.length, query]);

  const toggleDistrict = (district: string) => {
    setOpenDistricts((prev) => ({
      ...prev,
      [district]: !prev[district],
    }));
  };

  const isAllOpen = Object.values(openDistricts).every(Boolean);

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
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <Database className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-200">Cadde listesi henüz sisteme yüklenmedi.</h4>
      </div>
    );
  }

  if (roads.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 text-center space-y-2">
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
      <div className="flex items-center justify-between px-1 pb-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/15 text-blue-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            Resmi İlçe & Cadde Grupları
          </span>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-blue-300 hover:bg-slate-700/90 hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          {isAllOpen ? (
            <>
              <ChevronsUp className="h-3.5 w-3.5 text-blue-400" />
              <span>Hepsini Kapat</span>
            </>
          ) : (
            <>
              <ChevronsDown className="h-3.5 w-3.5 text-blue-400" />
              <span>Hepsini Aç</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid View Container (Fits screen without body scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {groupedByDistrict.map((group) => {
            const isOpen = openDistricts[group.district] ?? true;

            return (
              <div
                key={group.district}
                className="bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-hidden backdrop-blur-md shadow-md flex flex-col h-fit transition-all"
              >
                {/* Collapsible İlçe Header Button */}
                <button
                  type="button"
                  onClick={() => toggleDistrict(group.district)}
                  className="w-full px-3 py-2 bg-slate-800/90 border-b border-slate-700/70 hover:bg-slate-800 flex items-center justify-between shrink-0 transition-colors cursor-pointer select-none text-left"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs font-black tracking-wider text-slate-100 uppercase truncate">
                      {group.district}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-900/90 text-blue-300 border border-slate-700/60">
                      {group.items.length} Yol
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
                    <div className="divide-y divide-slate-800/60 max-h-[220px] sm:max-h-[260px] overflow-y-auto">
                      {group.items.map((road, idx) => (
                        <div
                          key={`${road.id}-${idx}`}
                          onClick={() => onSelectRoad(road)}
                          className="px-3 py-1.5 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-2 group select-none"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80 group-hover:bg-blue-400 shrink-0" />
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors leading-tight truncate">
                              {road.roadName}
                            </span>
                          </div>

                          {isSearching && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
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
