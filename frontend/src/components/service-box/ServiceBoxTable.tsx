'use client';
import { useState, useMemo, Fragment, useEffect } from 'react';
import { ServiceBox } from '@/types';
import {
  AlertCircle, ChevronDown, ChevronUp, FileText,
  ChevronLeft, ChevronRight, AlertTriangle, MapPin,
  Layers, Phone, User
} from 'lucide-react';

const PAGE_SIZE = 30;

const COLS = ['Bağlantı Nesnesi', 'İlçe', 'Sektör', 'Bekleme', 'Son Durum', 'Tüm Veriler'] as const;

/* ── Day badge ────────────────────────────────────────────────── */
function DaysBadge({ days }: { days: number }) {
  if (days >= 90)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm shadow-red-500/20 shrink-0">
        <AlertTriangle className="h-3 w-3 text-red-400" />
        {days} Gün
      </span>
    );
  if (days >= 80)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
        {days} Gün
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/30 shrink-0">
      {days} Gün
    </span>
  );
}

/* ── Status badge ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  if (!status || status.trim() === '')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
        <AlertCircle className="h-3 w-3 text-amber-400" />
        Boş
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25 shrink-0">
      Diğer
    </span>
  );
}

/* ══ Main Component ═══════════════════════════════════════════════ */
export function ServiceBoxTable({ boxes }: { boxes: ServiceBox[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [boxes]);

  const totalPages = Math.ceil(boxes.length / PAGE_SIZE) || 1;
  const currentBoxes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return boxes.slice(start, start + PAGE_SIZE);
  }, [boxes, currentPage]);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="w-full flex flex-col">

      {/* ── 1. MOBİL GÖRÜNÜM: OKUNABİLİR KART LİSTESİ (sm:hidden) ────── */}
      <div className="block sm:hidden divide-y divide-slate-800">
        {currentBoxes.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm px-4">
            Filtrelere uygun kayıt bulunamadı.
          </div>
        )}

        {currentBoxes.map((box) => {
          const isExpanded   = expandedId === box.id;
          const extraEntries = box.extraFields ? Object.entries(box.extraFields) : [];
          const days         = box.waitingDays;

          // Priority indicator
          let borderAccent = 'border-l-4 border-l-slate-700';
          if (days >= 90) borderAccent = 'border-l-4 border-l-red-500 bg-red-950/10';
          else if (days >= 80) borderAccent = 'border-l-4 border-l-orange-500 bg-orange-950/10';
          else if (!box.lastStatus) borderAccent = 'border-l-4 border-l-amber-500/70 bg-amber-950/10';

          return (
            <div
              key={box.id}
              className={`p-4 transition-colors ${borderAccent} hover:bg-slate-800/40`}
            >
              {/* Üst Satır: Bağlantı Nesnesi & Rozetler */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-black text-white tracking-wide">
                    {box.connectionObject}
                  </div>
                  {box.name && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-0.5">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>{box.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <DaysBadge days={days} />
                  <StatusBadge status={box.lastStatus} />
                </div>
              </div>

              {/* Orta Alan: İlçe, Sektör ve Adres */}
              <div className="space-y-1.5 text-xs text-slate-300 mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
                    <MapPin className="h-3 w-3 text-red-400" />
                    {box.district || 'İlçe Belirtilmemiş'}
                  </span>

                  {box.sectorInfo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-400 text-[11px]">
                      <Layers className="h-3 w-3 text-blue-400" />
                      {box.sectorInfo}
                    </span>
                  )}
                </div>

                {box.address && (
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">
                    {box.address}
                  </p>
                )}

                {box.phone && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                    <Phone className="h-3 w-3 text-emerald-400" />
                    <span>{box.phone}</span>
                  </div>
                )}
              </div>

              {/* Alt Buton: Excel Tüm Verileri Aç */}
              {extraEntries.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(box.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                      Excel Satır Verileri ({extraEntries.length} alan)
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Genişletilmiş Mobil Alanlar */}
              {isExpanded && extraEntries.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-700/50 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {extraEntries.map(([key, val]) => (
                      <div
                        key={key}
                        className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-2"
                      >
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
                          {key}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-200 break-words leading-tight">
                          {val !== '' ? val : <span className="text-slate-600 italic">—</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 2. MASAÜSTÜ GÖRÜNÜM: TABLO (hidden sm:block) ─────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700/50">
              {COLS.map((col) => (
                <th
                  key={col}
                  className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap ${
                    col === 'Tüm Veriler' ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentBoxes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500 text-sm">
                  Filtrelere uygun kayıt bulunamadı.
                </td>
              </tr>
            )}

            {currentBoxes.map((box, rowIdx) => {
              const isExpanded   = expandedId === box.id;
              const extraEntries = box.extraFields ? Object.entries(box.extraFields) : [];
              const days         = box.waitingDays;

              let rowAccent = '';
              if (days >= 90)       rowAccent = 'bg-red-500/5 hover:bg-red-500/8 border-l-2 border-l-red-500/50';
              else if (days >= 80)  rowAccent = 'bg-orange-500/5 hover:bg-orange-500/8 border-l-2 border-l-orange-500/40';
              else if (!box.lastStatus) rowAccent = 'bg-amber-500/4 hover:bg-amber-500/7';
              else                  rowAccent = 'hover:bg-slate-700/20';

              return (
                <Fragment key={box.id}>
                  <tr
                    className={`border-b border-slate-700/25 transition-colors duration-100 ${rowAccent} ${
                      rowIdx % 2 === 0 ? '' : 'bg-slate-800/20'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-100 tracking-wide">
                        {box.connectionObject}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-300">{box.district}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-400">{box.sectorInfo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <DaysBadge days={days} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={box.lastStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {extraEntries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(box.id)}
                          className={[
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150',
                            isExpanded
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                              : 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
                          ].join(' ')}
                        >
                          <FileText className="h-3 w-3" />
                          Tüm Veriler
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {isExpanded && extraEntries.length > 0 && (
                    <tr className="border-b border-slate-700/40 bg-slate-900/60">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 backdrop-blur-sm space-y-3">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-700/40">
                            <FileText className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              Excel Satır Verileri
                            </span>
                            <span className="ml-auto px-2 py-0.5 rounded-md bg-slate-700/60 text-[10px] font-bold text-slate-400">
                              {extraEntries.length} sütun
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {extraEntries.map(([key, val]) => (
                              <div
                                key={key}
                                className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-2.5 hover:border-slate-600/50 transition-colors"
                              >
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-1" title={key}>
                                  {key}
                                </span>
                                <span className="block text-xs font-semibold text-slate-200 break-words leading-snug">
                                  {val !== '' ? val : <span className="text-slate-600 italic font-normal">—</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 3. PAGINATION (MOBİL VE MASAÜSTÜ AYRI DÜZEN) ─────────────── */}
      {boxes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-700/40 bg-slate-900/40">
          {/* Info */}
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Toplam <span className="font-bold text-slate-200">{boxes.length}</span> kayıttan{' '}
            <span className="font-bold text-slate-200">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, boxes.length)}
            </span>{' '}
            arası gösteriliyor
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Önceki
            </button>

            {/* Mobile: Compact page indicator */}
            <span className="sm:hidden text-xs font-bold text-slate-300 px-2">
              {currentPage} / {totalPages}
            </span>

            {/* Desktop: Numeric page pills */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 7) {
                  const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
                  page = start + i;
                }
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      'w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-150',
                      currentPage === page
                        ? 'bg-blue-500/30 border border-blue-500/50 text-blue-200 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Sonraki
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
