'use client';
import { useState, useEffect, useMemo } from 'react';
import { Complaint } from '@/types';
import {
  ChevronLeft, ChevronRight, MessageSquare, MapPin, User,
  Phone, Calendar, AlertTriangle, Edit3, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight as ChevronIcon
} from 'lucide-react';
import { SortOption } from '@/app/yapim/complaints/page';

import { toTitleCaseTR } from '@/lib/utils';

interface Props {
  complaints: Complaint[];
  sortKey: SortOption;
  onSortKeyChange: (val: SortOption) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onEditComplaint: (complaint: Complaint) => void;
}

function formatDateTR(dateStr: string = ''): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

const PAGE_SIZE = 20;

export function ComplaintTable({
  complaints,
  sortKey,
  onSortKeyChange,
  onSelectComplaint,
  onEditComplaint,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filtered complaints change
  useEffect(() => {
    setCurrentPage(1);
  }, [complaints]);

  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE));

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return complaints.slice(start, start + PAGE_SIZE);
  }, [complaints, currentPage]);

  const handleToggleReceivedSort = () => {
    onSortKeyChange(sortKey === 'RECEIVED_DESC' ? 'RECEIVED_ASC' : 'RECEIVED_DESC');
  };

  const handleTogglePlannedSort = () => {
    onSortKeyChange(sortKey === 'PLANNED_DESC' ? 'PLANNED_ASC' : 'PLANNED_DESC');
  };

  const handleToggleRepeatSort = () => {
    onSortKeyChange(sortKey === 'REPEAT_DESC' ? 'REPEAT_ASC' : 'REPEAT_DESC');
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden min-h-0">
      {/* Table Scrollable Container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ── Desktop Data Table ── */}
        <table className="w-full text-left border-collapse text-[11px] hidden md:table">
          <thead className="bg-slate-900/95 border-b border-slate-700/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="w-[18%] px-3 py-2.5">Şikayet Türü</th>
              <th className="w-[27%] px-3 py-2.5">Adres</th>
              <th className="w-[14%] px-3 py-2.5">İsim</th>
              <th className="w-[12%] px-3 py-2.5">İletişim</th>

              {/* Gelen Tarih Header */}
              <th
                onClick={handleToggleReceivedSort}
                className="w-[10%] px-3 py-2.5 text-center cursor-pointer hover:text-white transition-colors group"
                title="Gelen Tarihe göre sıralamak için tıklayın"
              >
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Gelen Tarih</span>
                  {sortKey === 'RECEIVED_DESC' ? (
                    <ArrowDown className="h-3 w-3 text-blue-400" />
                  ) : sortKey === 'RECEIVED_ASC' ? (
                    <ArrowUp className="h-3 w-3 text-blue-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* Planlanan Tarih Header */}
              <th
                onClick={handleTogglePlannedSort}
                className="w-[10%] px-3 py-2.5 text-center cursor-pointer hover:text-white transition-colors group"
                title="Planlanan Tarihe göre sıralamak için tıklayın"
              >
                <div className="inline-flex items-center justify-center gap-1">
                  <span>Planlanan Tarih</span>
                  {sortKey === 'PLANNED_DESC' ? (
                    <ArrowDown className="h-3 w-3 text-blue-400" />
                  ) : sortKey === 'PLANNED_ASC' ? (
                    <ArrowUp className="h-3 w-3 text-blue-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>

              {/* Tekrar Sayısı Header */}
              <th
                onClick={handleToggleRepeatSort}
                className="w-[9%] px-3 py-2.5 text-right cursor-pointer hover:text-white transition-colors group"
                title="Tekrar Sayısına göre sıralamak için tıklayın"
              >
                <div className="inline-flex items-center justify-end gap-1 w-full">
                  <span>Tekrar Sayısı</span>
                  {sortKey === 'REPEAT_DESC' ? (
                    <ArrowDown className="h-3 w-3 text-rose-400" />
                  ) : sortKey === 'REPEAT_ASC' ? (
                    <ArrowUp className="h-3 w-3 text-rose-400" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500 text-xs">
                  Aramanızla veya filtrelerle eşleşen kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              paginatedComplaints.map((c, idx) => {
                const isHighRepeat = c.repeatCount >= 3;
                const isRepeat = c.repeatCount > 0;

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c)}
                    className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-slate-800/20'
                    }`}
                  >
                    {/* Şikayet Türü */}
                    <td className="px-3 py-2 font-semibold text-slate-100 truncate">
                      <div className="flex items-center gap-1.5 min-w-0" title={c.complaintType}>
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{c.complaintType}</span>
                      </div>
                    </td>

                    {/* Adres */}
                    <td className="px-3 py-2 text-slate-300 truncate" title={toTitleCaseTR(c.address)}>
                      {toTitleCaseTR(c.address) || '—'}
                    </td>

                    {/* İsim */}
                    <td className="px-3 py-2 font-medium text-slate-200 truncate" title={toTitleCaseTR(c.name)}>
                      {toTitleCaseTR(c.name) || '—'}
                    </td>

                    {/* İletişim */}
                    <td className="px-3 py-2 text-slate-300 font-mono text-[10.5px] truncate" title={c.contact}>
                      {c.contact || '—'}
                    </td>

                    {/* Gelen Tarih */}
                    <td className="px-3 py-2 text-center text-slate-400 truncate">
                      {formatDateTR(c.receivedDate)}
                    </td>

                    {/* Planlanan Tarih */}
                    <td className="px-3 py-2 text-center text-slate-300 font-medium truncate">
                      {formatDateTR(c.plannedDate)}
                    </td>

                    {/* Tekrar Sayısı */}
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          isHighRepeat
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                            : isRepeat
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-400 font-normal'
                        }`}
                      >
                        {isHighRepeat && <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />}
                        {c.repeatCount}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Mobile Responsive Card View (md:hidden) ── */}
        <div className="block md:hidden divide-y divide-slate-700/40">
          {complaints.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs px-4">
              Aramanızla eşleşen şikayet bulunamadı.
            </div>
          ) : (
            paginatedComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="p-3.5 space-y-2 hover:bg-slate-700/20 cursor-pointer transition-colors active:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-bold text-white truncate">{c.complaintType}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      c.repeatCount >= 3
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30'
                        : c.repeatCount > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Tekrar: {c.repeatCount}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 line-clamp-2">{toTitleCaseTR(c.address)}</div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>{toTitleCaseTR(c.name)} • {c.contact}</span>
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <span>{formatDateTR(c.plannedDate)}</span>
                    <ChevronIcon className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Table Pagination Bar */}
      <div className="px-3 py-2 border-t border-slate-700/40 bg-slate-900/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div>
          Toplam <strong className="text-slate-200">{complaints.length}</strong> kayıttan{' '}
          <strong className="text-slate-200">
            {complaints.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, complaints.length)}
          </strong>{' '}
          arası
        </div>

        <div className="flex items-center gap-2.5">
          <span>
            Sayfa <strong className="text-slate-200">{currentPage}</strong> / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Önceki Sayfa"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Sonraki Sayfa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
