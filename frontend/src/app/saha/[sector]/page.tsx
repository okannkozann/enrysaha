'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import {
  MapPin, User, Calendar, Clock, ArrowLeft,
  RefreshCw, Layers, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function MobileFieldScreen() {
  const params  = useParams();
  const router  = useRouter();
  const [boxes, setBoxes]     = useState<ServiceBox[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-emerald-500" />
        <span className="text-xs font-semibold">Sektör Kayıtları Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 relative">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      {/* Sticky Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/saha')}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="font-bold text-white text-base">Sektör {params.sector}</div>
              <div className="text-[11px] text-slate-400">Saha Servis Kutusu Listesi</div>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            {boxes.length} Kutu
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 relative z-10">
        {boxes.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Bu sektörde kayıtlı servis kutusu bulunamadı.
          </div>
        ) : (
          boxes.map((box) => (
            <div
              key={box.id}
              className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all space-y-3 ${
                box.waitingDays >= 90
                  ? 'border-red-500/40 bg-red-950/10 border-l-4 border-l-red-500'
                  : box.waitingDays >= 60
                  ? 'border-amber-500/40 bg-amber-950/10 border-l-4 border-l-amber-500'
                  : 'border-slate-700/50 bg-slate-900/60 border-l-4 border-l-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-white">{box.connectionObject}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{box.district} / {box.neighborhood}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    box.waitingDays >= 90
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600/30'
                  }`}
                >
                  {box.waitingDays} Gün
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{box.address}</span>
                </div>
                {box.name && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{box.name}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Anlaşma: <strong className="text-slate-300 font-semibold">{box.agreementDate || '—'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  {box.lastStatus || 'Durum Boş'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
