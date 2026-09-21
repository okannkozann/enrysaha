'use client';
import { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceBox } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (boxes: ServiceBox[]) => void;
}

export function ExcelImportModal({ open, onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setDragging(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  /* ── Helper to clean & parse Excel rows into ServiceBox ── */
  const parseFile = useCallback((file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Convert sheet to json with raw values handled
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          raw: false,
          defval: '',
        });

        if (!json || json.length === 0) {
          setError('Dosyada geçerli satır bulunamadı veya dosya boş.');
          return;
        }

        // Helper to normalize Turkish characters and lower-case text for flexible column matching
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '');

        // Parse rows
        const parsedBoxes: ServiceBox[] = json.map((row, idx) => {
          // Find value in row by searching candidate key aliases
          const getValue = (...aliases: string[]) => {
            const normalizedAliases = aliases.map(normalize);
            const foundKey = Object.keys(row).find((k) =>
              normalizedAliases.includes(normalize(k))
            );
            if (foundKey !== undefined && row[foundKey] !== null && row[foundKey] !== undefined) {
              return String(row[foundKey]).trim();
            }
            return '';
          };

          const connObj = getValue('baglantinesnesi', 'bno', 'baglantinesnesiid', 'baglanti', 'nesne', 'nesneid');
          // Match 'Adres Bilgisi', 'Açık Adres', 'Adres', 'Adres Metni', 'Sokak', 'Cadde', 'Adresi' or any column containing 'adres'
          const addressKey = Object.keys(row).find((k) => normalize(k).includes('adres')) || '';
          const address = addressKey ? String(row[addressKey] ?? '').trim() : getValue('sokak', 'cadde', 'lokasyon', 'adresbilgisi');

          const district = getValue('ilce', 'ilceadi', 'bolgeilce');
          const neighborhood = getValue('mahalle', 'mahalleadi');
          const agreementDate = getValue('anlasmatarihi', 'anlasmatar', 'tarih', 'sozlesmetarihi');

          // Match any column containing 'bekleme', 'gun', 'sure'
          const waitingDaysKey = Object.keys(row).find((k) =>
            normalize(k).includes('beklem') || normalize(k).includes('gun') || normalize(k).includes('sure')
          ) || '';
          const waitingDaysRaw = waitingDaysKey ? String(row[waitingDaysKey] ?? '').trim() : getValue('bekleme', 'gun', 'süre');
          const parsedDays = parseInt(waitingDaysRaw.replace(/[^0-9]/g, ''), 10);
          const waitingDays = !isNaN(parsedDays) ? parsedDays : 0;

          const lastStatusRaw = getValue('sondurum', 'durum', 'imalatdurumu', 'statu');
          const name = getValue('adsoyad', 'musteriadi', 'isim', 'ad', 'aboneadi');
          const phone = getValue('telefon', 'gsm', 'tel', 'iletisim');
          const sectorInfo = getValue('sektorbilgisi', 'sektor', 'sektoradi');
          const sectorRegionInfo = getValue('sektorbolgebilgisi', 'sektordil', 'bolge', 'sektorbolge') || sectorInfo;

          // Store all columns from Excel in extraFields so dropdown can display everything
          const extraFields: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            if (row[key] !== undefined && row[key] !== null) {
              extraFields[key.trim()] = String(row[key]).trim();
            }
          });

          return {
            id: getValue('id') || `excel-${idx + 1}-${Date.now()}`,
            connectionObject: connObj || `BNO-${idx + 1}`,
            address: address || '-',
            district: district || 'Merkez',
            neighborhood: neighborhood || '',
            agreementDate: agreementDate || new Date().toISOString().split('T')[0],
            waitingDays: waitingDays,
            lastStatus: (lastStatusRaw as any) || '',
            name: name || '',
            phone: phone || '',
            sectorInfo: sectorInfo || 'Sektör 1',
            sectorRegionInfo: sectorRegionInfo || sectorInfo || 'Sektör 1 - Bölge A',
            extraFields,
          };
        });

        onImport(parsedBoxes);
        handleClose();
      } catch (err) {
        console.error(err);
        setError('Dosya okunurken hata oluştu. Lütfen geçerli bir .xlsx / .xls dosyası seçin.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onImport]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Servis Kutusu Excel Yükle</h2>
              <p className="text-xs text-slate-500 mt-0.5">Otomatik aktarım için Excel dosyanızı seçin</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={[
              'flex flex-col items-center justify-center gap-4 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
              dragging ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <div className={['p-4 rounded-full transition-colors', dragging ? 'bg-blue-100' : 'bg-slate-100'].join(' ')}>
              <Upload className={`h-8 w-8 ${dragging ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Dosyayı buraya sürükleyin veya tıklayın</p>
              <p className="text-xs text-slate-400 mt-1">Excel formatı (.xlsx, .xls)</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" size="sm" onClick={handleClose}>
            İptal
          </Button>
        </div>
      </div>
    </div>
  );
}

