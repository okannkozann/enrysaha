'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { qrService } from '@/lib/services/qrService';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { authService } from '@/lib/services/authService';
import { QRPackage, ServiceBox, FieldWorkStatus, User } from '@/types';
import {
  ArrowLeft, Search, Download, Check, CheckCircle2,
  ClipboardList, PackageSearch, MapPin, Layers,
  Phone, User as UserIcon, Clock, AlertTriangle,
  QrCode, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type FilterTab = 'all' | 'pending' | 'completed';

export default function MobileQRDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { toast } = useToast();
  const qrId    = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qr, setQr]                   = useState<QRPackage | null>(null);
  const [boxes, setBoxes]             = useState<ServiceBox[]>([]);
  const [completions, setCompletions] = useState<FieldWorkStatus[]>([]);

  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState<FilterTab>('all');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await authService.getCurrentFieldUser();
      setCurrentUser(user);

      const pkg = await qrService.markQrAsViewed(qrId);
      setQr(pkg);

      const allBoxes = await serviceBoxService.getServiceBoxes();
      const assigned = allBoxes.filter((b) => pkg.serviceBoxIds.includes(b.id));

      assigned.sort((a, b) => {
        if (pkg.filters.sort === "DESC") return (b.waitingDays || 0) - (a.waitingDays || 0);
        if (pkg.filters.sort === "ASC") return (a.waitingDays || 0) - (b.waitingDays || 0);
        return 0;
      });

      setBoxes(assigned);

      const statusData = await qrService.getQrCompletions(qrId);
      setCompletions(statusData);

      setLoading(false);
    }
    if (qrId) load();
  }, [qrId]);

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
    } catch (e) {
      toast({ title: 'Hata', description: 'İşlem sırasında hata oluştu.', variant: 'destructive' });
    }
  };

  const isCompleted = (boxId: string) => completions.some((c) => c.serviceBoxId === boxId && c.completed);

  // Derived state
  const completedCount = completions.filter((c) => c.completed).length;
  const totalCount     = boxes.length;

  const tabFilteredBoxes = useMemo(() => {
    if (activeTab === 'completed') return boxes.filter((b) => isCompleted(b.id));
    if (activeTab === 'pending') return boxes.filter((b) => !isCompleted(b.id));
    return boxes;
  }, [boxes, activeTab, completions]);

  const searchFilteredBoxes = tabFilteredBoxes.filter((b) =>
    b.address.toLowerCase().includes(search.toLowerCase()) ||
    b.connectionObject.toLowerCase().includes(search.toLowerCase()) ||
    b.district.toLowerCase().includes(search.toLowerCase()) ||
    (b.neighborhood && b.neighborhood.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF('landscape');

      doc.setFontSize(20);
      doc.text("ENERYA", 14, 20);
      doc.setFontSize(14);
      doc.text("Saha Servis Kutuları", 14, 30);

      doc.setFontSize(10);
      doc.text(`Ekip: ${currentUser?.teamName || 'Bilinmiyor'}`, 14, 40);
      doc.text(`QR Listesi: ${qr?.id}`, 14, 46);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 52);

      doc.text(`Toplam: ${totalCount}`, 140, 40);
      doc.text(`Tamamlanan: ${completedCount}`, 140, 46);
      doc.text(`Bekleyen: ${totalCount - completedCount}`, 140, 52);

      const tableData = boxes.map((box, i) => [
        i + 1,
        box.connectionObject,
        box.address,
        box.district,
        `${box.waitingDays} Gun`,
        isCompleted(box.id) ? 'Tamamlandi' : 'Bekliyor',
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['No', 'Baglanti Nesnesi', 'Adres', 'Ilce', 'Bekleme', 'Durum']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Tamamlandi') {
              data.cell.styles.textColor = [52, 211, 153];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      doc.save(`Saha_Liste_${qr?.id}.pdf`);
      toast({ title: 'Başarılı', description: 'PDF başarıyla indirildi.' });
    } catch (e) {
      toast({ title: 'Hata', description: 'PDF oluşturulamadı.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-sm font-semibold">QR Listesi Yükleniyor...</span>
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-rose-400">
        <p className="text-base font-bold">QR Paketi bulunamadı.</p>
        <Link href="/saha" className="mt-4 text-xs font-semibold text-blue-400 underline">
          Saha Ana Sayfasına Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 relative selection:bg-emerald-500/30 selection:text-white">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* ── Top Bar: Sticky Header ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/saha')}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base">{qr.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/25 text-blue-300">
                  {completedCount} / {totalCount} Tamamlandı
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Atanan Saha Servis Kutusu Listesi</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">PDF İndir</span>
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 mt-2 relative z-10">

        {/* ── Sol Menü ── */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-3 shadow-xl space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">
              Saha Menüsü
            </div>

            <Link
              href="/saha"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-semibold rounded-xl transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <span>Bildirim İşlemleri</span>
              </div>
              <ArrowLeft className="h-3.5 w-3.5 text-slate-600 rotate-180" />
            </Link>

            <Link
              href="/saha/qr-listesi"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-xl transition-all bg-blue-500/20 border border-blue-500/35 text-white shadow-md shadow-blue-500/10"
            >
              <div className="flex items-center gap-2.5">
                <PackageSearch className="h-4 w-4 text-blue-400" />
                <span>Servis Kutuları</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
            </Link>
          </div>

          {/* İlerleme Çubuğu Kartı */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Tamamlanma:</span>
              <span className="font-black text-emerald-400">
                %{totalCount ? Math.round((completedCount / totalCount) * 100) : 0}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ── Ana İçerik ── */}
        <main className="flex-1 space-y-6 min-w-0">

          {/* QR Paket & Kriter Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paket Özeti */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">İş Paketi</span>
              </div>
              <div className="text-lg font-black text-white">{qr.id}</div>
              <div className="text-xs font-semibold text-emerald-400">
                {currentUser?.teamName || 'Saha Ekibi'}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-500">Toplam</span>
                  <span className="font-bold text-white">{totalCount} Kutu</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <span className="block text-[10px] text-slate-500">Tarih</span>
                  <span className="font-medium text-slate-200">
                    {qr.sentAt ? new Date(qr.sentAt).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Kriterler */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-5 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Paket Kriterleri</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Son Durum</span>
                  <span className="font-semibold text-slate-200">
                    {qr.filters.lastStatus === 'EMPTY' ? 'Boş' : qr.filters.lastStatus === 'OTHER' ? 'Diğer' : 'Tümü'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">İlçe</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {qr.filters.districts.length > 0 ? qr.filters.districts.join(', ') : 'Tümü'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Bekleme</span>
                  <span className="font-semibold text-slate-200">
                    {(qr.filters as any).over90Days ? '> 90 Gün (Acil)' : 'Tümü'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Sıralama</span>
                  <span className="font-semibold text-slate-200">
                    {qr.filters.sort === 'DESC' ? 'Büyükten Küçüğe' : 'Küçükten Büyüğe'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab & Arama Çubuğu */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bekleyen ({totalCount - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tamamlanan ({completedCount})
              </button>
            </div>

            {/* Arama Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Adres, BN veya İlçe ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* ── MOBİL KART GÖRÜNÜMÜ (block sm:hidden) ── */}
          <div className="block sm:hidden space-y-3">
            {searchFilteredBoxes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
                Aramaya uygun servis kutusu bulunamadı.
              </div>
            ) : (
              searchFilteredBoxes.map((box) => {
                const completed = isCompleted(box.id);
                return (
                  <div
                    key={box.id}
                    className={`rounded-2xl border p-4 backdrop-blur-xl transition-all space-y-3 ${
                      completed
                        ? 'border-emerald-500/50 bg-emerald-950/15 shadow-md shadow-emerald-500/5 border-l-4 border-l-emerald-500'
                        : 'border-slate-700/50 bg-slate-900/60 border-l-4 border-l-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-white">{box.connectionObject}</div>
                        {box.name && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{box.name}</div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          box.waitingDays >= 90
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-slate-700/60 text-slate-300 border-slate-600/30'
                        }`}
                      >
                        {box.waitingDays} Gün
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span>{box.district} / {box.neighborhood}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5 line-clamp-2">
                        {box.address}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleComplete(box.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        completed
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Check className={`h-4 w-4 ${completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{completed ? 'Kutu Tamamlandı' : 'Tamamlandı Olarak İşaretle'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ── MASAÜSTÜ TABLO GÖRÜNÜMÜ (hidden sm:block) ── */}
          <div className="hidden sm:block rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl overflow-hidden overflow-x-auto shadow-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-900/90 border-b border-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Bağlantı Nesnesi</th>
                  <th className="px-4 py-3">Adres</th>
                  <th className="px-4 py-3">İlçe / Mahalle</th>
                  <th className="px-4 py-3 text-right">Bekleme</th>
                  <th className="px-4 py-3">Abone Adı</th>
                  <th className="px-4 py-3 text-center sticky right-0 bg-slate-900 border-l border-slate-800">
                    Saha Durumu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/25">
                {searchFilteredBoxes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                      Filtrelere uygun servis kutusu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  searchFilteredBoxes.map((box, i) => {
                    const completed = isCompleted(box.id);
                    return (
                      <tr
                        key={box.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          completed ? 'bg-emerald-950/15' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                          {box.connectionObject}
                        </td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[220px]" title={box.address}>
                          {box.address}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {box.district} <span className="text-slate-500 text-[11px]">/ {box.neighborhood}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
                              box.waitingDays >= 90
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-slate-700/50 text-slate-300 border-slate-600/30'
                            }`}
                          >
                            {box.waitingDays} Gün
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 truncate max-w-[140px]">
                          {box.name || '—'}
                        </td>
                        <td className="px-4 py-2 text-center sticky right-0 bg-slate-900/90 border-l border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(box.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                              completed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            <Check className={`h-3.5 w-3.5 ${completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span>{completed ? 'Tamamlandı' : 'Tamamla'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>

    </div>
  );
}
