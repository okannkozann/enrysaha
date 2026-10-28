'use client';

import { GasConnectionObjectDetail } from '@/types';
import {
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  Building,
  Calendar,
  Package,
  AlertTriangle,
  X,
  Layers,
} from 'lucide-react';

interface Props {
  bno: GasConnectionObjectDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStreetGas?: (sectorCode: string, streetName: string) => void;
}

export function BnoDetailModal({ bno, isOpen, onClose, onToggleStreetGas }: Props) {
  if (!isOpen || !bno) return null;

  const isOverdue = bno.waitingDays >= 90;
  const isCritical = bno.waitingDays >= 75 && !isOverdue;
  const remaining = 90 - bno.waitingDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Bağlantı Nesnesi: <span className="font-mono text-blue-400">{bno.connectionObject}</span>
                </h3>
                {isOverdue ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/25 text-red-300 border border-red-500/50 animate-pulse">
                    🚨 90+ Gün Aşıldı
                  </span>
                ) : isCritical ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/50">
                    ⚠️ 75-90 Gün Arası
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ Güvenli Süre
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {bno.district} / {bno.neighborhood} Mah. • {bno.streetName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Card 1: Abone & Adres Bilgileri */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Abone & Adres Bilgileri
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10.5px] block">Müşteri / Abone</span>
                  <span className="font-semibold text-slate-200">{bno.customerName || 'Müşteri'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10.5px] block">Telefon</span>
                  <span className="font-mono text-slate-200">{bno.phone || '0532 000 00 00'}</span>
                </div>
              </div>

              <div className="col-span-2 flex items-start gap-2 pt-1 border-t border-slate-800/80">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-500 text-[10.5px] block">Tam Adres & Sektör</span>
                  <span className="text-slate-200 font-medium break-words block">{bno.address}</span>
                  <span className="font-mono text-[10.5px] text-blue-400 mt-0.5 block">
                    Sektör Kodu: {bno.sectorCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 90 Gün Yasal Süre & Anlaşma Detayı */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Yasal 90 Gün Mevzuat Durumu
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                <span className="text-slate-500 text-[10px] block">Anlaşma Tarihi</span>
                <span className="font-mono font-bold text-slate-200 text-[11px]">{bno.agreementDate}</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span className="text-slate-500 text-[10px] block">Geçen Süre</span>
                <span className="font-mono font-black text-amber-400 text-[11.5px]">{bno.waitingDays} Gün</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                {isOverdue ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                )}
                <span className="text-slate-500 text-[10px] block">Yasal Kalan</span>
                <span
                  className={`font-mono font-extrabold text-[11px] ${
                    isOverdue ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {isOverdue ? `+${bno.waitingDays - 90}g Aşıldı` : `${remaining} Gün`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 mt-2">
              <span className="text-slate-400 text-[11px]">Son Durumu:</span>
              <span className="font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {bno.boxStatus || 'Boş (Engel Yok)'}
              </span>
            </div>
          </div>

          {/* Card 3: İmalat & Sokak / Sektör Gazlama Durumu */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              İmalat & Gazlama Durumları
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Servis Kutusu */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  Servis Kutusu:
                </span>
                <span className={`font-bold ${bno.isBoxInstalled ? 'text-emerald-400' : 'text-purple-300'}`}>
                  {bno.isBoxInstalled ? '✓ Kutu Takıldı' : '⏳ Takılmadı'}
                </span>
              </div>

              {/* Cadde/Sokak Gaz Durumu */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Cadde/Sokak Gazı:
                </span>
                <span
                  className={`font-bold ${
                    bno.streetGasStatus === 'Gazlandı' ? 'text-emerald-400' : 'text-orange-400'
                  }`}
                >
                  {bno.streetGasStatus === 'Gazlandı' ? '✓ Gazlandı' : '🔥 Gazlanmadı'}
                </span>
              </div>

              {/* Sektör Gaz Durumu */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  Sektör Gazı:
                </span>
                <span className="font-bold text-slate-200">
                  {bno.sectorGasStatus || 'Beklemede'}
                </span>
              </div>

              {/* Nihai Abone Gaz Durumu */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Abone Gaz Durumu:
                </span>
                <span className={`font-bold ${bno.isGasGiven ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {bno.isGasGiven ? '✓ Gaz Verildi' : '🔥 Gaz Bekliyor'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold transition-colors cursor-pointer text-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

