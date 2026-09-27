import React from 'react';
import { MetropolitanRoad } from '@/types';
import { X, Landmark, MapPin, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { RoadStatusBadge } from './RoadStatusBadge';

interface RoadDetailDrawerProps {
  road: MetropolitanRoad | null;
  onClose: () => void;
}

export function RoadDetailDrawer({
  road,
  onClose,
}: RoadDetailDrawerProps) {
  if (!road) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Detail Modal Container */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 leading-tight">Yol Bilgisi</h2>
              <p className="text-xs text-slate-400">Kazı İzni Yetki Sorgulama Detayı</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Highlight Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Cadde / Yol Adı</span>
          <h3 className="text-lg font-black text-slate-100">{road.roadName}</h3>
          <div className="pt-1 flex items-center gap-2">
            <RoadStatusBadge isMetropolitan={true} />
          </div>
        </div>

        {/* Detail Fields */}
        <div className="space-y-2 text-xs">
          {road.district && (
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                İlçe
              </span>
              <span className="font-bold text-slate-100">{road.district}</span>
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Belediye Yetkisi
            </span>
            <span className="font-bold text-emerald-300">Büyükşehir Belediyesi</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Kaynak
            </span>
            <span className="font-semibold text-slate-200 truncate max-w-[200px]">
              Büyükşehir Belediyesi Resmi Yol Listesi
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Durum
            </span>
            <span className="font-bold text-emerald-400">✓ Listede Mevcut</span>
          </div>

          {road.notes && (
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 font-medium text-[11px] block">Açıklama / Not:</span>
              <p className="text-slate-200 font-semibold text-xs">{road.notes}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
