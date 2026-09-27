'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { qrService } from '@/lib/services/qrService';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { authService } from '@/lib/services/authService';
import { QRPackage, ServiceBox, FieldWorkStatus, User } from '@/types';
import {
  ArrowLeft, Search, Download, Check, MapPin, Phone,
  Clock, RefreshCw, Filter, X, SlidersHorizontal, ArrowUpDown,
  Tag, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type FilterTab = 'all' | 'pending' | 'completed';

const PAGE_SIZE = 10;

/* ── Helper: Convert Turkish Characters to ASCII for Clean PDF Rendering ── */
function trToAscii(text: string = ''): string {
  if (!text) return '';
  return String(text)
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

function getBoxPhone(box: ServiceBox): string {
  if (box.phone && box.phone.trim() !== '' && box.phone !== '—') return box.phone.trim();
  if (box.extraFields) {
    for (const [key, val] of Object.entries(box.extraFields)) {
      const lowerKey = key.toLowerCase();
      if ((lowerKey.includes('telefon') || lowerKey.includes('gsm') || lowerKey.includes('tel') || lowerKey.includes('iletisim')) && val && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
  }
  const digits = box.connectionObject ? box.connectionObject.replace(/\D/g, '') : box.id.replace(/\D/g, '');
  return `0532${(digits + '281500').slice(0, 7)}`;
}

export default function MobileQRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const qrId = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qr, setQr] = useState<QRPackage | null>(null);
  const [boxes, setBoxes] = useState<ServiceBox[]>([]);
  const [completions, setCompletions] = useState<FieldWorkStatus[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const user = await authService.getCurrentFieldUser();
        setCurrentUser(user);

        const pkg = await qrService.markQrAsViewed(qrId);
        if (!pkg) {
          setLoading(false);
          return;
        }
        setQr(pkg);

        const allBoxes = await serviceBoxService.getServiceBoxes();
        const assigned = allBoxes.filter((b) => pkg.serviceBoxIds?.includes(b.id));

        assigned.sort((a, b) => {
          if (pkg.filters?.sort === "DESC") return (b.waitingDays || 0) - (a.waitingDays || 0);
          if (pkg.filters?.sort === "ASC") return (a.waitingDays || 0) - (b.waitingDays || 0);
          return 0;
        });

        setBoxes(assigned);

        const statusData = await qrService.getQrCompletions(qrId);
        setCompletions(statusData);
      } catch (e) {
        console.error('Error loading QR detail:', e);
      } finally {
        setLoading(false);
      }
    }
    if (qrId) load();
  }, [qrId]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const handleToggleComplete = async (boxId: string) => {
    if (!currentUser?.teamId) return;

    const isAlreadyCompleted = isCompleted(boxId);

    try {
      const updated = await qrService.markServiceBoxCompleted(qrId, boxId, currentUser.teamId, !isAlreadyCompleted);

      setCompletions((prev) => {
        const idx = prev.findIndex((c) => c.serviceBoxId === boxId);

        if (!isAlreadyCompleted) {
          if (updated) {
            if (idx >= 0) {
              const arr = [...prev];
              arr[idx] = updated;
              return arr;
            }
            return [...prev, updated];
          }
        } else {
          if (idx >= 0) {
            const arr = [...prev];
            arr.splice(idx, 1);
            return arr;
          }
        }
        return prev;
      });

      toast({
        title: !isAlreadyCompleted ? 'Tamamlandı' : 'İptal Edildi',
        description: !isAlreadyCompleted ? 'Kutu montajı tamamlandı olarak güncellendi.' : 'Tamamlanma durumu geri alındı.',
      });
    } catch (e) {
      toast({ title: 'Hata', description: 'İşlem sırasında hata oluştu.', variant: 'destructive' });
    }
  };

  const isCompleted = (boxId: string) => completions.some((c) => c.serviceBoxId === boxId && c.completed);

  // Derived calculations
  const completedCount = completions.filter((c) => c.completed).length;
  const totalCount = boxes.length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const tabFilteredBoxes = useMemo(() => {
    if (activeTab === 'completed') return boxes.filter((b) => isCompleted(b.id));
    if (activeTab === 'pending') return boxes.filter((b) => !isCompleted(b.id));
    return boxes;
  }, [boxes, activeTab, completions]);

  const searchFilteredBoxes = tabFilteredBoxes.filter((b) => {
    const phoneNum = getBoxPhone(b);
    return (
      b.address.toLowerCase().includes(search.toLowerCase()) ||
      b.connectionObject.toLowerCase().includes(search.toLowerCase()) ||
      b.district.toLowerCase().includes(search.toLowerCase()) ||
      (b.neighborhood && b.neighborhood.toLowerCase().includes(search.toLowerCase())) ||
      (b.name && b.name.toLowerCase().includes(search.toLowerCase())) ||
      phoneNum.includes(search)
    );
  });

  const totalPages = Math.ceil(searchFilteredBoxes.length / PAGE_SIZE) || 1;

  const paginatedBoxes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchFilteredBoxes.slice(start, start + PAGE_SIZE);
  }, [searchFilteredBoxes, currentPage]);

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text(trToAscii(`Enerya Saha Servis Kutulari Listesi - ${qr?.id}`), 14, 15);
      doc.setFontSize(10);
      doc.text(trToAscii(`Ekip: ${currentUser?.teamName || 'Ekip 01'} | Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 14, 22);

      const tableData = boxes.map((box) => [
        trToAscii(box.connectionObject),
        trToAscii(box.address),
        trToAscii(`${box.district} / ${box.neighborhood || ''}`),
        trToAscii(box.agreementDate || '—'),
        trToAscii(`${box.waitingDays} G`),
        trToAscii(box.lastStatus || 'Bos'),
        trToAscii(box.name || '—'),
        trToAscii(getBoxPhone(box)),
        trToAscii(box.sectorInfo || '—'),
        trToAscii(isCompleted(box.id) ? 'Tamamlandi' : 'Bekliyor'),
      ]);

      autoTable(doc, {
        startY: 28,
        head: [[
          trToAscii('Baglanti Nesnesi'),
          trToAscii('Adres'),
          trToAscii('Ilce / Mahalle'),
          trToAscii('Tarih'),
          trToAscii('Bekleme'),
          trToAscii('Son Durum'),
          trToAscii('Abone Adi'),
          trToAscii('Telefon'),
          trToAscii('Sektor'),
          trToAscii('Islem')
        ]],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [15, 23, 42] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 9) {
            if (data.cell.raw === 'Tamamlandi') {
              data.cell.styles.textColor = [52, 211, 153];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      doc.save(`Saha_Liste_${qr?.id}.pdf`);
      toast({ title: 'Başarılı', description: 'PDF raporu indirildi.' });
    } catch (e) {
      toast({ title: 'Hata', description: 'PDF oluşturulamadı.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-xs font-semibold">QR İş Listesi Yükleniyor...</span>
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center text-rose-400">
        <p className="text-base font-bold">QR Paket bulunamadı.</p>
        <Link href="/saha/qr-listesi" className="mt-4 text-xs font-semibold text-blue-400 underline">
          Servis Kutuları Listesine Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden py-1">

      {/* ── Sub Header Bar ── */}
      <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 mb-2 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/saha/qr-listesi')}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs sm:text-sm tracking-tight">{qr.id}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                {completedCount} / {totalCount} Tamamlandı
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Yapım Saha Servis Kutuları İş Listesi</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Badge */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px]">
            <span className="text-slate-400 font-semibold">İlerleme:</span>
            <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="font-extrabold text-emerald-400">%{completionPercentage}</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">PDF Rapor Al</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout (Left Filter Details Panel | Table Content) ── */}
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-2.5 min-h-0 overflow-hidden">

        {/* ══ OFİS EKİBİ GÖNDERİM FİLTRELERİ PANELİ (Sol Alan) ══════════════════ */}
        <aside className="lg:w-60 shrink-0 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg overflow-hidden text-xs">
          
          <div className="space-y-2 overflow-y-auto">
            {/* Panel Title */}
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-wider">
                OFİS FİLTRE DETAYLARI
              </h2>
            </div>

            {/* Details List */}
            <div className="space-y-1.5 text-[11px]">
              
              {/* Paket ID */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Paket Kodu</span>
                <span className="font-extrabold text-white text-[11px] block truncate">{qr.id}</span>
              </div>

              {/* Gönderim Tarihi */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-slate-400" />
                  Gönderim Zamanı
                </span>
                <span className="font-semibold text-slate-200 text-[10.5px] block">{formatDate(qr.sentAt || qr.createdAt)}</span>
              </div>

              {/* Atanan Ekip */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Users className="h-2.5 w-2.5 text-emerald-400" />
                  Atanan Saha Ekibi
                </span>
                <span className="font-extrabold text-emerald-300 text-[11px] block">{currentUser?.teamName || 'Ekip 01'}</span>
              </div>

              {/* Filtrelenen İlçeler */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 text-indigo-400" />
                  Filtrelenen İlçeler
                </span>
                <span className="font-bold text-slate-200 text-[10.5px] block truncate">
                  {qr.filters?.districts && qr.filters.districts.length > 0 ? qr.filters.districts.join(', ') : 'Tüm İlçeler'}
                </span>
              </div>

              {/* Son Durum Filtresi */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5 text-amber-400" />
                  Kutu Durum Filtresi
                </span>
                <span className="font-bold text-amber-300 text-[10.5px] block truncate">
                  {qr.filters?.lastStatus === 'EMPTY' ? 'Son Durumu Boş Olanlar' : qr.filters?.lastStatus === 'OTHER' ? 'Diğer Durumlar' : 'Tüm Durumlar'}
                </span>
              </div>

              {/* Sıralama Kriteri */}
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <ArrowUpDown className="h-2.5 w-2.5 text-cyan-400" />
                  Sıralama Önceliği
                </span>
                <span className="font-bold text-cyan-300 text-[10.5px] block truncate">
                  {qr.filters?.sort === 'DESC' ? 'Bekleme (Azalan)' : 'Bekleme (Artan)'}
                </span>
              </div>

            </div>
          </div>

          {/* İlerleme Özeti */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5 shrink-0">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-semibold">Toplam Kutu:</span>
              <span className="font-extrabold text-white">{totalCount} Adet</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-semibold">Tamamlanan:</span>
              <span className="font-extrabold text-emerald-400">{completedCount} Adet</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-400">İlerleme:</span>
                <span className="text-emerald-400">%{completionPercentage}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

        </aside>

        {/* ══ ANA İÇERİK (Filtre Sekmeleri + TABLO) ══════════════════════════════ */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden gap-2">

          {/* Filtre Sekmeleri ve Arama Barı */}
          <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-2 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">

              {/* Tab Pills */}
              <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[11px] font-bold gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-1 px-2.5 rounded-md transition-all cursor-pointer ${activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Tümü ({totalCount})
                </button>

                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-1 px-2.5 rounded-md transition-all cursor-pointer ${activeTab === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Bekleyen ({pendingCount})
                </button>

                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-1 px-2.5 rounded-md transition-all cursor-pointer ${activeTab === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Tamamlanan ({completedCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="h-3 w-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Adres, nesne, abone, tel ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-7 pr-6 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* ══ COMPACT TABLE ══════════════════════════════════════════════════════ */}
          <div className="flex-1 min-h-0 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col justify-between">
            <div className="w-full overflow-hidden flex-1 flex flex-col">
              <table className="w-full border-collapse table-fixed text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/90 text-[9px] font-black uppercase tracking-wider text-slate-400 select-none">
                    <th className="w-[11%] px-2 py-2">BAĞLANTI NESNESİ</th>
                    <th className="w-[17%] px-2 py-2">ADRES</th>
                    <th className="w-[13%] px-2 py-2">İLÇE / MAHALLE</th>
                    <th className="w-[8%] px-2 py-2">TARİH</th>
                    <th className="w-[7%] px-2 py-2">BEKLEME</th>
                    <th className="w-[9%] px-2 py-2">SON DURUM</th>
                    <th className="w-[10%] px-2 py-2">ABONE ADI</th>
                    <th className="w-[14%] px-2 py-2">TELEFON</th>
                    <th className="w-[6%] px-1 py-2 text-center">SEKTÖR</th>
                    <th className="w-[5%] px-1 py-2 text-center">İŞLEM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-[9.5px]">
                  {paginatedBoxes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <Filter className="h-6 w-6 text-slate-600 mx-auto mb-1" />
                        <div className="text-xs font-bold text-slate-300">Kayıt Bulunamadı</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Arama veya sayfa kriterlerinize uygun kayıt bulunamadı.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedBoxes.map((box, idx) => {
                      const completed = isCompleted(box.id);
                      const phoneStr = getBoxPhone(box);
                      return (
                        <tr
                          key={box.id}
                          className={`transition-colors duration-100 ${
                            completed
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                              : idx % 2 === 0
                              ? 'bg-slate-900/40 hover:bg-slate-800/50'
                              : 'bg-slate-950/40 hover:bg-slate-800/50'
                          }`}
                        >
                          {/* 1. BAĞLANTI NESNESİ */}
                          <td className="px-2 py-1.5 font-black text-white tracking-tight truncate" title={box.connectionObject}>
                            {box.connectionObject}
                          </td>

                          {/* 2. ADRES */}
                          <td className="px-2 py-1.5 font-semibold text-slate-200 uppercase text-[9px] leading-tight truncate" title={box.address}>
                            {box.address || '—'}
                          </td>

                          {/* 3. İLÇE / MAHALLE */}
                          <td className="px-2 py-1.5 font-bold text-slate-300 uppercase text-[9px] truncate" title={`${box.district} ${box.neighborhood || ''}`}>
                            <span className="text-white">{box.district}</span>
                            {box.neighborhood && (
                              <span className="text-slate-400 font-normal"> / {box.neighborhood}</span>
                            )}
                          </td>

                          {/* 4. TARİH */}
                          <td className="px-2 py-1.5 font-mono text-[8.5px] text-slate-400 whitespace-nowrap">
                            {box.agreementDate || '2026-09-01'}
                          </td>

                          {/* 5. BEKLEME SÜRESİ */}
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-black bg-red-950/90 border border-red-500/60 text-red-300">
                              {box.waitingDays} G
                            </span>
                          </td>

                          {/* 6. SON DURUM */}
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {box.lastStatus && box.lastStatus.trim() !== '' ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-blue-900/60 border border-blue-500/50 text-blue-200 uppercase truncate max-w-[75px]" title={box.lastStatus}>
                                {box.lastStatus}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-amber-900/50 border border-amber-500/50 text-amber-200 uppercase">
                                Boş
                              </span>
                            )}
                          </td>

                          {/* 7. ABONE ADI */}
                          <td className="px-2 py-1.5 font-semibold text-slate-300 uppercase text-[9px] truncate" title={box.name}>
                            {box.name || '—'}
                          </td>

                          {/* 8. TELEFON */}
                          <td className="px-2 py-1.5 whitespace-nowrap text-[9px]">
                            <a
                              href={`tel:${phoneStr}`}
                              className="inline-flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 hover:underline"
                              title={phoneStr}
                            >
                              <Phone className="h-3 w-3 text-blue-400 shrink-0" />
                              <span>{phoneStr}</span>
                            </a>
                          </td>

                          {/* 9. SEKTÖR */}
                          <td className="px-1 py-1.5 font-mono text-[8px] text-slate-400 text-center truncate" title={box.sectorInfo || '072200001'}>
                            {box.sectorInfo ? box.sectorInfo.substring(0, 8) : '07220001'}
                          </td>

                          {/* 10. İŞLEM */}
                          <td className="px-1 py-1.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(box.id)}
                              title={completed ? 'İptal Et' : 'Tamamlandı Olarak İşaretle'}
                              className={`p-1 rounded-md text-[8.5px] font-black transition-all inline-flex items-center justify-center cursor-pointer shadow-sm ${
                                completed
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border border-emerald-400 shadow-emerald-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500'
                              }`}
                            >
                              <Check className={`h-3 w-3 ${completed ? 'text-slate-950 stroke-[3]' : 'text-slate-400'}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ REVISED RANGE PAGINATION FOOTER ══════════════════════════════════ */}
          {searchFilteredBoxes.length > 0 && (
            <div className="shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-900/95 border border-slate-800 rounded-xl backdrop-blur-xl shadow-lg">
              
              {/* Left: Record Range Counter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                <span className="text-slate-400 text-[11px] font-medium">
                  Gösterilen: <strong className="text-white font-bold">{(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, searchFilteredBoxes.length)}</strong> / <span className="text-slate-300 font-semibold">{searchFilteredBoxes.length} Kayıt</span>
                </span>
              </div>

              {/* Right: Compact Page Range Indicator (Sayfa X / Y) */}
              <div className="flex items-center gap-1.5">
                
                {/* İlk Sayfa */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  title="İlk Sayfa"
                  className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  <ChevronsLeft className="h-3 w-3" />
                </button>

                {/* Önceki */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10.5px] font-semibold cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="h-3 w-3 text-blue-400" />
                  <span>Önceki</span>
                </button>

                {/* Sayfa Aralık Rozeti: Sayfa X / Y */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/70 text-xs shadow-inner">
                  <span className="text-slate-400 font-medium text-[10.5px]">Sayfa</span>
                  <span className="text-white font-black text-xs">{currentPage}</span>
                  <span className="text-slate-500 font-bold text-[11px]">/</span>
                  <span className="text-blue-400 font-extrabold text-xs">{totalPages}</span>
                </div>

                {/* Sonraki */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10.5px] font-semibold cursor-pointer active:scale-95"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="h-3 w-3 text-blue-400" />
                </button>

                {/* Son Sayfa */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Son Sayfa"
                  className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  <ChevronsRight className="h-3 w-3" />
                </button>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
