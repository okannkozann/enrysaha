'use client';
import { useState, useMemo } from 'react';
import { RawExcelData } from './ExcelImportModal';
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Props {
  data: RawExcelData;
}

type SortDir = 'asc' | 'desc' | null;

export function RawExcelTable({ data }: Props) {
  const { columns, rows } = data;

  const [search, setSearch]     = useState('');
  const [sortCol, setSortCol]   = useState<string | null>(null);
  const [sortDir, setSortDir]   = useState<SortDir>(null);
  // Column-level filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const handleSort = (col: string) => {
    if (sortCol !== col) { setSortCol(col); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortCol(null); setSortDir(null); }
  };

  const setColFilter = (col: string, val: string) => {
    setColFilters((prev) => ({ ...prev, [col]: val }));
  };

  const filtered = useMemo(() => {
    let r = rows;

    // Global search
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(row[c] ?? '').toLowerCase().includes(q)));
    }

    // Column filters
    columns.forEach((col) => {
      const f = colFilters[col]?.trim().toLowerCase();
      if (f) r = r.filter((row) => String(row[col] ?? '').toLowerCase().includes(f));
    });

    // Sort
    if (sortCol && sortDir) {
      r = [...r].sort((a, b) => {
        const av = String(a[sortCol] ?? '');
        const bv = String(b[sortCol] ?? '');
        const numA = Number(av), numB = Number(bv);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }
        return sortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr');
      });
    }

    return r;
  }, [rows, columns, search, colFilters, sortCol, sortDir]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tüm sütunlarda ara..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {filtered.length} / {rows.length} satır
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            {/* Column headers + sort */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 w-10">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700 min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
                  >
                    <span className="truncate max-w-[140px]" title={col}>{col}</span>
                    {sortCol === col && sortDir === 'asc'  && <ChevronUp   className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    {sortCol === col && sortDir === 'desc' && <ChevronDown  className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    {sortCol !== col && <ChevronsUpDown className="h-3 w-3 text-slate-300 shrink-0 group-hover:text-slate-400" />}
                  </button>
                </th>
              ))}
            </tr>
            {/* Column-level filter inputs */}
            <tr className="bg-white border-b border-slate-100">
              <td className="px-3 py-1.5" />
              {columns.map((col) => (
                <td key={col} className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      value={colFilters[col] || ''}
                      onChange={(e) => setColFilter(col, e.target.value)}
                      placeholder="Filtrele..."
                      className="w-full pl-2 pr-6 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-300 bg-slate-50 min-w-[100px]"
                    />
                    {colFilters[col] && (
                      <button type="button" onClick={() => setColFilter(col, '')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.slice(0, 500).map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-2 text-xs text-slate-400">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-slate-700 max-w-[220px]">
                    <span className="block truncate" title={String(row[col] ?? '')}>
                      {row[col] !== '' && row[col] !== undefined ? String(row[col]) : <span className="text-slate-300 italic text-xs">—</span>}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-sm text-slate-400">
                  Filtrelere uygun kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 text-center">
            İlk 500 satır gösteriliyor. Filtreleri kullanarak daraltın.
          </div>
        )}
      </div>
    </div>
  );
}
