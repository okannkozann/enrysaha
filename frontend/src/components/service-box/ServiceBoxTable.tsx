import { useState, useMemo, Fragment } from 'react';
import { ServiceBox } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 30;

export function ServiceBoxTable({ boxes }: { boxes: ServiceBox[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to first page whenever boxes list changes (e.g. on filter change)
  const totalPages = Math.ceil(boxes.length / PAGE_SIZE) || 1;

  const currentBoxes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return boxes.slice(start, start + PAGE_SIZE);
  }, [boxes, currentPage]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusDisplay = (status: string) => {
    if (!status || status.trim() === '') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="h-3 w-3" />
          Boş
        </span>
      );
    }

    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        Diğer
      </span>
    );
  };

  return (
    <div className="w-full space-y-3">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead>Bağlantı Nesnesi</TableHead>
            <TableHead>İlçe</TableHead>
            <TableHead>Sektör</TableHead>
            <TableHead>Bekleme</TableHead>
            <TableHead>Son Durum</TableHead>
            <TableHead className="text-right">Tüm Veriler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentBoxes.map((box) => {
            const isExpanded = expandedId === box.id;
            const extraEntries = box.extraFields ? Object.entries(box.extraFields) : [];
            const days = box.waitingDays;

            // Row highlighting & waiting badge styling
            let rowBgClass = 'hover:bg-slate-50';
            let daysBadgeClass = 'bg-slate-100 text-slate-800';

            if (days >= 90) {
              rowBgClass = 'bg-red-50/70 hover:bg-red-100/60 font-medium';
              daysBadgeClass = 'bg-red-600 text-white font-bold px-2 py-0.5 rounded';
            } else if (days >= 80 && days < 90) {
              rowBgClass = 'bg-orange-50/60 hover:bg-orange-100/50';
              daysBadgeClass = 'bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded border border-orange-200';
            } else if (!box.lastStatus) {
              rowBgClass = 'bg-amber-50/30 hover:bg-amber-50/60';
            }

            return (
              <Fragment key={box.id}>
                <TableRow className={`transition-colors ${rowBgClass}`}>
                  <TableCell className="font-medium text-slate-900">{box.connectionObject}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-900">{box.district}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-900">{box.sectorInfo}</div>
                  </TableCell>
                  <TableCell>
                    <span className={daysBadgeClass}>{box.waitingDays} Gün</span>
                  </TableCell>
                  <TableCell>{getStatusDisplay(box.lastStatus)}</TableCell>
                  <TableCell className="text-right">
                    {extraEntries.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(box.id)}
                        className={`gap-1 text-xs border-slate-200 ${
                          isExpanded ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-600'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Tüm Veriler</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded Details Row */}
                {isExpanded && extraEntries.length > 0 && (
                  <TableRow className="bg-slate-50/80 border-t border-b border-slate-200/80">
                    <TableCell colSpan={6} className="p-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 border-b pb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Excel'deki Tüm Satır Bilgileri ({extraEntries.length} Sütun)</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                          {extraEntries.map(([key, val]) => (
                            <div key={key} className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                              <span className="block text-slate-400 font-medium truncate" title={key}>{key}</span>
                              <span className="block text-slate-900 font-semibold mt-0.5 break-words">
                                {val !== '' ? val : <span className="text-slate-300 italic font-normal">Boş</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {boxes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                Filtrelere uygun kayıt bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ── Pagination Bar ── */}
      {boxes.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Toplam <span className="font-semibold text-slate-900">{boxes.length}</span> kayıttan{' '}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, boxes.length)}
            </span>{' '}
            arası gösteriliyor
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Önceki
            </Button>

            <span className="px-2 font-medium text-slate-700">
              Sayfa {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2 text-xs gap-1"
            >
              Sonraki <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



