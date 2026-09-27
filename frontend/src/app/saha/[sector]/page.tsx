'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import {
  MapPin, User, Calendar, Clock, ArrowLeft,
  RefreshCw, Layers, ExternalLink, Search, AlertTriangle, ShieldCheck, Filter, X
} from 'lucide-react';
import Link from 'next/link';

export default function MobileFieldScreen() {
  const params  = useParams();
  const router  = useRouter();
  const [boxes, setBoxes]     = useState<ServiceBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'critical' | 'warning'>('all');

  useEffect(() => {
    async function loadData() {
      if (params.sector) {
        const data = await serviceBoxService.getServiceBoxesBySector(params.sector as string);
        data.sort((a, b) => b.waitingDays - a.waitingDays);
        setBoxes(data);
        setLoading(false);
      }
    }
    loadData();
  }, [params.sector]);

  const criticalBoxes = boxes.filter(b => b.waitingDays >= 90);
  const warningBoxes = boxes.filter(b => b.waitingDays >= 60 && b.waitingDays < 90);

  const filteredBoxes = boxes.filter(box => {
    if (filterThreshold === 'critical' && box.waitingDays < 90) return false;
    if (filterThreshold === 'warning' && (box.waitingDays < 60 || box.waitingDays >= 90)) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      box.address.toLowerCase().includes(q) ||
      box.connectionObject.toLowerCase().includes(q) ||
      box.district.toLowerCase().includes(q) ||
      (box.neighborhood && box.neighborhood.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="text-xs font-semibold">Sektör Kayıtları Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-white relative font-sans flex flex-col">

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px]" />
      </div>

      {/* Sticky Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/saha')}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="font-extrabold text-white text-base">Sektör {params.sector}</div>
              <div className="text-[11px] text-slate-400 font-medium">Saha Servis Kutusu Sektör Kayıtları</div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{boxes.length} Servis Kutusu</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-4 relative z-10 flex-1">

        {/* Dynamic Metric Stats Header Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam Kutu</span>
            <span className="text-xl font-black text-white mt-1">{boxes.length} Adet</span>
          </div>

          <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">60-90 Gün Arası</span>
            <span className="text-xl font-black text-amber-300 mt-1">{warningBoxes.length} Adet</span>
          </div>

          <div className="bg-slate-900/70 border border-red-500/30 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">90+ Gün Kritik</span>
            <span className="text-xl font-black text-red-400 mt-1">{criticalBoxes.length} Adet</span>
          </div>
        </div>

        {/* Filter and Search controls */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-3.5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold gap-1">
            <button
              onClick={() => setFilterThreshold('all')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                filterThreshold === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({boxes.length})
            </button>

            <button
              onClick={() => setFilterThreshold('warning')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                filterThreshold === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Uyarı ({warningBoxes.length})
            </button>

            <button
              onClick={() => setFilterThreshold('critical')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                filterThreshold === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kritik ({criticalBoxes.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Sektör içi ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Box List */}
        <div className="space-y-3">
          {filteredBoxes.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Bu sektörde aranan kriterlere uygun servis kutusu bulunamadı.
            </div>
          ) : (
            filteredBoxes.map((box) => (
              <div
                key={box.id}
                className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all space-y-3 ${
                  box.waitingDays >= 90
                    ? 'border-red-500/40 bg-slate-900/80 border-l-4 border-l-red-500'
                    : box.waitingDays >= 60
                    ? 'border-amber-500/40 bg-slate-900/80 border-l-4 border-l-amber-500'
                    : 'border-slate-800 bg-slate-900/70 border-l-4 border-l-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-white">{box.connectionObject}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{box.district} / {box.neighborhood || 'Mahalle Belirtilmedi'}</div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      box.waitingDays >= 90
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : box.waitingDays >= 60
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {box.waitingDays} Gün Bekliyor
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-1.5 text-slate-300 text-xs">
                    <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{box.address}</span>
                  </div>
                  {box.name && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1 border-t border-slate-700/40 mt-1">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{box.name}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Anlaşma Tarihi: <strong className="text-slate-300 font-semibold">{box.agreementDate || '—'}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    {box.lastStatus || 'Durum Belirtilmedi'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
