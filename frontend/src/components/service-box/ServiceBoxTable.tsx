'use client';
import { useState, useMemo, Fragment, useEffect } from 'react';
import { ServiceBox } from '@/types';
import { AlertCircle, ChevronDown, ChevronUp, FileText, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 30;

const COLS = ['Bağlantı Nesnesi', 'İlçe', 'Sektör', 'Bekleme', 'Son Durum', 'Tüm Veriler'] as const;

/* ── Day badge ────────────────────────────────────────────────── */
function DaysBadge({ days }: { days: number }) {
  if (days >= 90)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 ring-1 ring-red-500/10">
        <AlertTriangle className="h-2.5 w-2.5" />
        {days} Gün
      </span>
    );
  if (days >= 80)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/25">
        {days} Gün
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/30">
      {days} Gün
    </span>
  );
}

/* ── Status badge ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  if (!status || status.trim() === '')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">
        <AlertCircle className="h-2.5 w-2.5" />
        Boş
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25">
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

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          {/* Head */}
          <thead>
            <tr className="border-b border-slate-700/50">
              {COLS.map((col) => (
                <th
                  key={col}
                  className={`px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] whitespace-nowrap ${
                    col === 'Tüm Veriler' ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
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

              /* Row accent */
              let rowAccent = '';
              if (days >= 90)       rowAccent = 'bg-red-500/5 hover:bg-red-500/8 border-l-2 border-l-red-500/50';
              else if (days >= 80)  rowAccent = 'bg-orange-500/5 hover:bg-orange-500/8 border-l-2 border-l-orange-500/40';
              else if (!box.lastStatus) rowAccent = 'bg-amber-500/4 hover:bg-amber-500/7';
              else                  rowAccent = 'hover:bg-slate-700/20';

              return (
                <Fragment key={box.id}>
                  {/* Main Row */}
                  <tr
                    className={`border-b border-slate-700/25 transition-colors duration-100 ${rowAccent} ${
                      rowIdx % 2 === 0 ? '' : 'bg-slate-800/20'
                    }`}
                  >
                    {/* Bağlantı Nesnesi */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-100 tracking-wide">
                        {box.connectionObject}
                      </span>
                    </td>

                    {/* İlçe */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-300">{box.district}</span>
                    </td>

                    {/* Sektör */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-400">{box.sectorInfo}</span>
                    </td>

                    {/* Bekleme */}
                    <td className="px-4 py-3">
                      <DaysBadge days={days} />
                    </td>

                    {/* Son Durum */}
                    <td className="px-4 py-3">
                      <StatusBadge status={box.lastStatus} />
                    </td>

                    {/* Tüm Veriler */}
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
                          {isExpanded
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && extraEntries.length > 0 && (
                    <tr className="border-b border-slate-700/40 bg-slate-900/60">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 backdrop-blur-sm space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-700/40">
                            <FileText className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              Excel Satır Verileri
                            </span>
                            <span className="ml-auto px-2 py-0.5 rounded-md bg-slate-700/60 text-[10px] font-bold text-slate-500">
                              {extraEntries.length} sütun
                            </span>
                          </div>

                          {/* Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {extraEntries.map(([key, val]) => (
                              <div
                                key={key}
                                className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-2.5 hover:border-slate-600/50 transition-colors"
                              >
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate mb-1" title={key}>
                                  {key}
                                </span>
                                <span className="block text-xs font-semibold text-slate-200 break-words leading-snug">
                                  {val !== ''
                                    ? val
                                    : <span className="text-slate-600 italic font-normal">—</span>}
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

      {/* ── Pagination Bar ── */}
      {boxes.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/40 bg-slate-900/30">
          {/* Info */}
          <p className="text-[11px] text-slate-500">
            Toplam{' '}
            <span className="font-bold text-slate-300">{boxes.length}</span>{' '}
            kayıttan{' '}
            <span className="font-bold text-slate-300">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, boxes.length)}
            </span>{' '}
            gösteriliyor
          </p>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-700/40 border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            >
              <ChevronLeft className="h-3 w-3" />
              Önceki
            </button>

            {/* Page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page = i + 1;
                // sliding window when many pages
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
                        ? 'bg-blue-500/30 border border-blue-500/50 text-blue-200'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50',
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-700/40 border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            >
              Sonraki
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
