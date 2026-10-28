'use client';

import { useState, useMemo } from 'react';
import { GasConnectionObjectDetail } from '@/types';
import { BnoDetailModal } from './BnoDetailModal';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Check,
  ShieldAlert,
  Search,
  X,
  Package,
} from 'lucide-react';

interface Props {
  bnos: GasConnectionObjectDetail[];
  onPlanSector: (sectorCode: string) => void;
  onGasSector: (sectorCode: string) => void;
}

type SubFilter = 'ALL' | 'OVERDUE' | 'APPROACHING' | 'NO_BOX' | 'NO_GAS';

export function CriticalBnoTable({ bnos, onPlanSector, onGasSector }: Props) {
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState<SubFilter>('ALL');
  const [selectedBnoDetail, setSelectedBnoDetail] = useState<GasConnectionObjectDetail | null>(null);

  const filteredList = useMemo(() => {
    return bnos.filter((item) => {
      // SADECE son durumu "boş" olanlar (kullanıcı şartı: inşaat halinde vb. elenir)
      if (!item.isStatusEmpty) {
        return false;
      }

      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesBno = item.connectionObject.toLowerCase().includes(q);
        const matchesAddress = item.address?.toLowerCase().includes(q);
        const matchesDistrict = item.district?.toLowerCase().includes(q);
        const matchesNeighborhood = item.neighborhood?.toLowerCase().includes(q);
        const matchesSector = item.sectorCode?.toLowerCase().includes(q);
        const matchesCustomer = item.customerName?.toLowerCase().includes(q);

        if (!matchesBno && !matchesAddress && !matchesDistrict && !matchesNeighborhood && !matchesSector && !matchesCustomer) {
          return false;
        }
      }

      // 2. Sub-filter
      if (subFilter === 'OVERDUE') {
        return item.waitingDays >= 90;
      }
      if (subFilter === 'APPROACHING') {
        return item.waitingDays >= 75 && item.waitingDays < 90;
      }
      if (subFilter === 'NO_BOX') {
        return !item.isBoxInstalled;
      }
      if (subFilter === 'NO_GAS') {
        return !item.isGasGiven;
      }

      return true;
    });
  }, [bnos, search, subFilter]);

  const counts = useMemo(() => {
    const emptyBnos = bnos.filter((b) => b.isStatusEmpty);
    return {
      all: emptyBnos.length,
      overdue: emptyBnos.filter((b) => b.waitingDays >= 90).length,
      approaching: emptyBnos.filter((b) => b.waitingDays >= 75 && b.waitingDays < 90).length,
      noBox: emptyBnos.filter((b) => !b.isBoxInstalled).length,
      noGas: emptyBnos.filter((b) => !b.isGasGiven).length,
    };
  }, [bnos]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Table Sub-Header & Controls */}
      <div className="shrink-0 bg-slate-950/90 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Info & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">90 Gün Yasal Süre Takibi (Mevzuat Uyumu)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Filtre: Yalnızca Son Durumu "Boş" Olanlar
              </span>
              {counts.overdue > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                  🚨 {counts.overdue} Süresi Dolan
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Bağlantı anlaşması imzalanmış, son durumu <strong>"Boş"</strong> olup (inşaat halinde vb. engeli bulunmayan) henüz kutusu takılmamış veya gaz verilmemiş olanlar.
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subfilter Chips */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setSubFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                subFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('OVERDUE')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                subFilter === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <span>🚨 90+ Gün Aşıldı</span>
              <span className="font-black text-[9.5px]">({counts.overdue})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('APPROACHING')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                subFilter === 'APPROACHING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span>⚠️ 75-90 Gün</span>
              <span className="font-black text-[9.5px]">({counts.approaching})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('NO_BOX')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                subFilter === 'NO_BOX'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kutu Bekleyen ({counts.noBox})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('NO_GAS')}
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                subFilter === 'NO_GAS'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gaz Bekleyen ({counts.noGas})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BNO, sokak, abone ara..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-6 py-0.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table - No Horizontal Scrollbar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <colgroup>
            <col className="w-8" />
            <col className="w-28" />
            <col className="w-44" />
            <col className="w-32" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-28" />
          </colgroup>

          <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 select-none">
            <tr>
              <th className="py-2 px-2 text-center">#</th>
              <th className="py-2 px-2.5">Bağlantı Nesnesi</th>
              <th className="py-2 px-3">Abone & Adres</th>
              <th className="py-2 px-2.5">Sektör Kodu</th>
              <th className="py-2 px-2 text-center">Anlaşma Tarihi</th>
              <th className="py-2 px-2 text-center">Geçen Süre</th>
              <th className="py-2 px-2 text-center">Yasal Kalan Gün</th>
              <th className="py-2 px-2 text-center">Son Durum</th>
              <th className="py-2 px-2 text-center">Kutu & Gaz Durumu</th>
              <th className="py-2 px-3 text-right">Hızlı Aksiyon</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/70">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="font-semibold text-slate-300">
                      Son durumu "Boş" olup 90 güne yaklaşan kritik bağlantı nesnesi bulunamadı.
                    </span>
                    <span className="text-[11px] text-slate-500">
                      İnşaat halinde vb. engeli olanlar listelenmez; yapılabilir abonelerin süreleri güvenli aralıktadır.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => {
                const isOverdue = item.waitingDays >= 90;
                const remaining = 90 - item.waitingDays;

                return (
                  <tr
                    key={item.connectionObject}
                    className={`transition-colors ${
                      isOverdue
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'bg-slate-900/40 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-2 text-center text-slate-500 font-mono text-[10px]">
                      {idx + 1}
                    </td>

                    {/* BNO (Click opens Detail Modal) */}
                    <td className="py-2 px-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBnoDetail(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                          isOverdue
                            ? 'bg-red-950/80 text-red-300 border-red-700/60 hover:border-red-400'
                            : 'bg-slate-950 text-amber-300 border-amber-600/40 hover:border-amber-400'
                        }`}
                        title="Detayları görüntülemek için tıklayın"
                      >
                        <span>{item.connectionObject}</span>
                      </button>
                    </td>

                    {/* Abone & Adres */}
                    <td className="py-2 px-3 truncate">
                      <div className="flex flex-col truncate" title={item.address || `${item.district} / ${item.neighborhood}`}>
                        <span className="font-bold text-slate-200 truncate text-[11px]">
                          {item.customerName || 'Abone'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.district} / {item.neighborhood} - {item.streetName}
                        </span>
                      </div>
                    </td>

                    {/* Sektör Kodu */}
                    <td className="py-2 px-2.5 truncate">
                      <span className="font-mono font-bold text-slate-200 text-[11px] truncate block" title={item.sectorCode}>
                        {item.sectorCode}
                      </span>
                    </td>

                    {/* Anlaşma Tarihi */}
                    <td className="py-2 px-2 text-center font-mono text-slate-400 text-[10.5px]">
                      {item.agreementDate}
                    </td>

                    {/* Geçen Süre */}
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`font-mono font-black text-[11.5px] ${
                          isOverdue ? 'text-red-400 font-extrabold' : 'text-amber-400'
                        }`}
                      >
                        {item.waitingDays} Gün
                      </span>
                    </td>

                    {/* Yasal Süre / Kalan Gün Badge */}
                    <td className="py-2 px-2 text-center">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/25 text-red-300 border border-red-500/50 animate-pulse">
                          🚨 +{item.waitingDays - 90} Gün (Aşıldı!)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ⚠️ Son {remaining} Gün Kaldı
                        </span>
                      )}
                    </td>

                    {/* Son Durum (Boş olduğunu açıkça gösteren badge) */}
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        Boş
                      </span>
                    </td>

                    {/* Kutu & Gaz Durumu */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5 text-[9.5px] font-semibold">
                        {item.isBoxInstalled ? (
                          <span className="text-emerald-400">✓ Kutu Takıldı</span>
                        ) : (
                          <span className="text-purple-300">⏳ Kutu Takılmadı</span>
                        )}
                        {item.isGasGiven ? (
                          <span className="text-emerald-400">✓ Gazlandı</span>
                        ) : (
                          <span className="text-orange-400">🔥 Gazlanmadı</span>
                        )}
                      </div>
                    </td>

                    {/* Hızlı Aksiyon */}
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => item.sectorCode && onPlanSector(item.sectorCode)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-colors cursor-pointer"
                          title="Sektörü Planla"
                        >
                          Planla
                        </button>
                        <button
                          type="button"
                          onClick={() => item.sectorCode && onGasSector(item.sectorCode)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors cursor-pointer"
                          title="Sektörü Gazlandı Yap"
                        >
                          Gazla
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── BAĞLANTI NESNESİ DETAY MODALI ── */}
      <BnoDetailModal
        bno={selectedBnoDetail}
        isOpen={!!selectedBnoDetail}
        onClose={() => setSelectedBnoDetail(null)}
      />
    </div>
  );
}
