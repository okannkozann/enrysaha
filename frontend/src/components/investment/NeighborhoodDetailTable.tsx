import React from 'react';
import { InvestmentRecord } from '@/lib/mock-data/investmentData';
import { formatNumber } from './ExecutiveKpiStrip';
import { MapPin, Table2, Info } from 'lucide-react';

interface NeighborhoodDetailTableProps {
  records: InvestmentRecord[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

export function NeighborhoodDetailTable({
  records,
  selectedDistrict,
  onSelectDistrict,
}: NeighborhoodDetailTableProps) {
  const totalPe63 = records.reduce((sum, r) => sum + r.pe63, 0);
  const totalPe125 = records.reduce((sum, r) => sum + r.pe125, 0);
  const totalPe = records.reduce((sum, r) => sum + r.totalPe, 0);
  const totalCompleted = records.reduce((sum, r) => sum + r.completed, 0);
  const totalRemaining = records.reduce((sum, r) => sum + r.remaining, 0);
  const totalPct = totalPe > 0 ? (totalCompleted / totalPe) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-900/95 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Table2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              Mahalle Bazlı Yatırım Detay Tablosu
              {selectedDistrict !== 'ALL' && (
                <span className="text-xs font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/30">
                  {selectedDistrict}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Excel kaynak matrisinden alınan mahalle seviyesinde PE63, PE125, imalat ve kalan metraj dökümü
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
          {records.length} Mahalle Kaydı
        </span>
      </div>

      {/* Table Container with Internal Scroll */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 z-10">
            <tr>
              <th className="px-3.5 py-2.5">İlçe / Bölge</th>
              <th className="px-3.5 py-2.5">Mahalle</th>
              <th className="px-3.5 py-2.5 text-right">PE63 (m)</th>
              <th className="px-3.5 py-2.5 text-right">PE125 (m)</th>
              <th className="px-3.5 py-2.5 text-right">Toplam PE (m)</th>
              <th className="px-3.5 py-2.5 text-right">Yapılan (m)</th>
              <th className="px-3.5 py-2.5 text-right">Kalan (m)</th>
              <th className="px-3.5 py-2.5 text-right">Gerçekleşme %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                  Seçilen filtrelere uygun mahalle kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const pct = r.totalPe > 0 ? (r.completed / r.totalPe) * 100 : 0;
                const isOver = r.remaining < 0;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/50 transition-colors group select-none"
                  >
                    {/* İlçe */}
                    <td className="px-3.5 py-2 font-bold text-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectDistrict(r.district)}
                        className="hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                        {r.district}
                      </button>
                    </td>

                    {/* Mahalle */}
                    <td className="px-3.5 py-2 font-semibold text-slate-100 max-w-[280px] truncate" title={r.neighborhood}>
                      {r.neighborhood}
                    </td>

                    {/* PE63 */}
                    <td className="px-3.5 py-2 text-right text-slate-300">
                      {r.pe63 > 0 ? formatNumber(r.pe63) : '—'}
                    </td>

                    {/* PE125 */}
                    <td className="px-3.5 py-2 text-right text-slate-300">
                      {r.pe125 > 0 ? formatNumber(r.pe125) : '—'}
                    </td>

                    {/* Toplam PE */}
                    <td className="px-3.5 py-2 text-right font-bold text-slate-100">
                      {formatNumber(r.totalPe)}
                    </td>

                    {/* Yapılan */}
                    <td className="px-3.5 py-2 text-right font-bold text-emerald-400">
                      {r.completed > 0 ? formatNumber(r.completed) : '—'}
                    </td>

                    {/* Kalan */}
                    <td className={`px-3.5 py-2 text-right font-extrabold ${isOver ? 'text-purple-300' : 'text-amber-400'}`}>
                      {formatNumber(r.remaining)}
                      {isOver && (
                        <span className="ml-1 text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1 py-0.2 rounded border border-purple-500/20">
                          Plan Üzeri
                        </span>
                      )}
                    </td>

                    {/* % Gerçekleşme */}
                    <td className="px-3.5 py-2 text-right">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        %{pct.toFixed(1).replace('.', ',')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Total Row at Bottom */}
          <tfoot className="sticky bottom-0 bg-slate-900 border-t-2 border-slate-700 font-bold text-xs text-slate-100">
            <tr>
              <td colSpan={2} className="px-3.5 py-2.5 font-black text-slate-100 uppercase tracking-wider">
                TOPLAM METRAJ:
              </td>
              <td className="px-3.5 py-2.5 text-right font-bold text-blue-300">
                {formatNumber(totalPe63)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-bold text-cyan-300">
                {formatNumber(totalPe125)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-black text-slate-100">
                {formatNumber(totalPe)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-black text-emerald-400">
                {formatNumber(totalCompleted)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-black text-amber-400">
                {formatNumber(totalRemaining)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-black text-indigo-300">
                %{totalPct.toFixed(1).replace('.', ',')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
