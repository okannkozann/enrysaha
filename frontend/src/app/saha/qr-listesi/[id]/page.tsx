'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { qrService } from '@/lib/services/qrService';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { authService } from '@/lib/services/authService';
import { QRPackage, ServiceBox, FieldWorkStatus, User } from '@/types';
import { ArrowLeft, Search, Download, Check, CheckCircle2, ClipboardList, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type FilterTab = 'all' | 'pending' | 'completed';

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

  useEffect(() => {
    async function load() {
      const user = await authService.getCurrentFieldUser();
      setCurrentUser(user);

      const pkg = await qrService.markQrAsViewed(qrId);
      setQr(pkg);

      const allBoxes = await serviceBoxService.getServiceBoxes();
      const assigned = allBoxes.filter(b => pkg.serviceBoxIds.includes(b.id));

      assigned.sort((a, b) => {
        if (pkg.filters.sort === "DESC") return (b.waitingDays || 0) - (a.waitingDays || 0);
        if (pkg.filters.sort === "ASC") return (a.waitingDays || 0) - (b.waitingDays || 0);
        return 0; // maintain default
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

      setCompletions(prev => {
        const idx = prev.findIndex(c => c.serviceBoxId === boxId);

        if (!isAlreadyCompleted) {
          // adding
          if (updated) {
            if (idx >= 0) {
              const arr = [...prev];
              arr[idx] = updated;
              return arr;
            }
            return [...prev, updated];
          }
        } else {
          // removing
          if (idx >= 0) {
            const arr = [...prev];
            arr.splice(idx, 1);
            return arr;
          }
        }
        return prev;
      });

      if (!isAlreadyCompleted) {
        // No toast
      } else {
        // No toast
      }
    } catch (e) {
      toast({ title: 'Hata', description: 'İşlem sırasında hata oluştu.', variant: 'destructive' });
    }
  };

  const isCompleted = (boxId: string) => completions.some(c => c.serviceBoxId === boxId && c.completed);

  // Derived state
  const completedCount = completions.filter(c => c.completed).length;
  const totalCount = boxes.length;

  const tabFilteredBoxes = useMemo(() => {
    if (activeTab === 'completed') return boxes.filter(b => isCompleted(b.id));
    if (activeTab === 'pending') return boxes.filter(b => !isCompleted(b.id));
    return boxes;
  }, [boxes, activeTab, completions]);

  const searchFilteredBoxes = tabFilteredBoxes.filter(b =>
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
        isCompleted(box.id) ? 'Tamamlandi' : 'Bekliyor'
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['No', 'Baglanti Nesnesi', 'Adres', 'Ilce', 'Bekleme', 'Durum']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Tamamlandi') {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      doc.save(`Saha_Liste_${qr?.id}.pdf`);
      toast({ title: 'Başarılı', description: 'PDF başarıyla indirildi.' });
    } catch (e) {
      toast({ title: 'Hata', description: 'PDF oluşturulamadı.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Yükleniyor...</div>;
  if (!qr) return <div className="p-10 text-center text-red-500">QR bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/saha')} className="text-white hover:bg-slate-800 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Servis Kutuları</h1>
            <div className="text-slate-400 text-xs mt-0.5">Son gönderilen servis kutusu listesi</div>
          </div>
        </div>
        <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800" onClick={handleDownloadPDF} disabled={downloading}>
          <Download className="h-4 w-4 mr-1" /> PDF İNDİR
        </Button>
      </div>

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">

        {/* Sol Menü (Side Navigation) */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-6 h-fit sticky top-24">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">Saha Menüsü</div>
            <Link href="/saha" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <ClipboardList className="h-5 w-5" />
              Bildirim İşlemleri
            </Link>
            <Link href="/saha/qr-listesi" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all bg-slate-900 text-white shadow-md">
              <PackageSearch className="h-5 w-5" />
              Servis Kutuları
            </Link>
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 space-y-6">

          {/* QR & Filters Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Paket Özeti */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="text-2xl font-black text-slate-900 mb-1">{qr.id}</div>
                <div className="text-base font-bold text-blue-700 mb-3">{currentUser?.teamName || 'Saha Ekibi'}</div>
                <div className="flex items-center gap-4 text-sm text-slate-600 font-medium border-t border-slate-100 pt-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Toplam Kayıt</span>
                    <span className="text-slate-900">{totalCount} Servis Kutusu</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Gönderilme Tarihi</span>
                    <span className="text-slate-900">{qr.sentAt ? new Date(qr.sentAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gönderilen Liste Kriterleri */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Gönderilen Liste Kriterleri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 mb-1">Son Durum</div>
                    <div className="font-bold text-slate-900">{qr.filters.lastStatus === 'EMPTY' ? 'Boş' : qr.filters.lastStatus === 'OTHER' ? 'Diğer' : 'Tümü'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">İlçe</div>
                    <div className="font-bold text-slate-900">{qr.filters.districts.length > 0 ? qr.filters.districts.join(' · ') : 'Tümü'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Bekleme Süresi</div>
                    <div className="font-bold text-slate-900">{(qr.filters as any).over90Days ? '> 90 Gün' : 'Tümü'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Sıralama</div>
                    <div className="font-bold text-slate-900">{qr.filters.sort === 'DESC' ? 'Büyükten Küçüğe' : qr.filters.sort === 'ASC' ? 'Küçükten Büyüğe' : 'Varsayılan'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* View Tabs & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Tümü ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Bekleyen ({totalCount - completedCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex-1 sm:flex-none ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Tamamlanan ({completedCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Mahalle, Adres veya BN..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-4">No</th>
                  <th className="px-4 py-4">Bağlantı Nesnesi</th>
                  <th className="px-4 py-4 min-w-[200px]">Adres</th>
                  <th className="px-4 py-4">İlçe</th>
                  <th className="px-4 py-4">Mahalle</th>
                  <th className="px-4 py-4">Anlaşma Tarihi</th>
                  <th className="px-4 py-4 text-right">Bekleme Süresi</th>
                  <th className="px-4 py-4">Son Durum</th>
                  <th className="px-4 py-4">İsim</th>
                  <th className="px-4 py-4">Telefon</th>
                  <th className="px-4 py-4">Sektör</th>
                  <th className="px-4 py-4 text-center sticky right-0 z-10 bg-slate-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)] border-l border-slate-200">
                    Tamamlandı
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchFilteredBoxes.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                      <span className="block text-base font-bold text-slate-700 mb-1">Kayıt bulunamadı.</span>
                      Filtrelerinize uygun servis kutusu yok.
                    </td>
                  </tr>
                ) : (
                  searchFilteredBoxes.map((box, i) => {
                    const completed = isCompleted(box.id);
                    const compData = completions.find(c => c.serviceBoxId === box.id);

                    return (
                      <tr
                        key={box.id}
                        className={`transition-all hover:bg-slate-50/50 bg-white ${completed ? 'outline outline-2 outline-emerald-500 relative z-10 shadow-sm' : 'border-b border-transparent'
                          }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{box.connectionObject}</td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[250px]" title={box.address}>{box.address}</td>
                        <td className="px-4 py-3 text-slate-700">{box.district}</td>
                        <td className="px-4 py-3 text-slate-700">{box.neighborhood}</td>
                        <td className="px-4 py-3 text-slate-500">{box.agreementDate}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-2 py-1 rounded font-bold text-xs ${box.waitingDays > 30 ? 'bg-red-50 text-red-700' :
                              box.waitingDays > 15 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                            {box.waitingDays} Gün
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{box.lastStatus || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{box.name || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{box.phone || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{box.sectorInfo || '-'}</td>

                        {/* Sticky Action Column */}
                        <td className="px-4 py-2 text-center sticky right-0 z-10 bg-white border-l border-slate-100 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.02)]">
                          <Button
                            size="sm"
                            onClick={() => handleToggleComplete(box.id)}
                            className={`font-bold min-w-[140px] h-9 border-2 transition-colors ${completed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100/70 hover:text-emerald-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            <Check className={`h-4 w-4 mr-2 ${completed ? 'text-emerald-600' : 'text-slate-300'}`} />
                            Tamamlandı
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
