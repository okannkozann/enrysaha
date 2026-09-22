'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download, FileText, QrCode, Send, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { qrService } from '@/lib/services/qrService';
import { teamService } from '@/lib/services/teamService';
import { filterServiceBoxesForQR } from '@/lib/utils/serviceBoxFilters';
import { ServiceBox, FieldTeam, QRPackage } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function QRManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [serviceBoxes, setServiceBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);

  // Workflow State
  const [lastStatus, setLastStatus] = useState<"EMPTY" | "OTHER" | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC" | null>(null);
  const [isOver90Days, setIsOver90Days] = useState(false);

  const clearFilters = () => {
    setLastStatus(null);
    setSelectedDistricts([]);
    setSortOrder(null);
    setIsOver90Days(false);
  };

  // Output State
  const [generatedQR, setGeneratedQR] = useState<QRPackage | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Send State
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const [boxes, tms] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams()
      ]);
      setServiceBoxes(boxes);
      setTeams(tms);
      setLoading(false);
    }
    load();
  }, []);

  const allDistricts = useMemo(() => {
    const dists = new Set(serviceBoxes.map(b => b.district).filter(Boolean));
    return Array.from(dists).sort();
  }, [serviceBoxes]);

  // Derive districts count based on other active filters (except districts itself)
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const filteredForCounts = filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: [],
      sort: null,
      over90Days: isOver90Days
    });
    
    filteredForCounts.forEach(box => {
      if (box.district) {
        counts[box.district] = (counts[box.district] || 0) + 1;
      }
    });
    return counts;
  }, [serviceBoxes, lastStatus, isOver90Days]);

  // Derive final filtered list
  const filteredList = useMemo(() => {
    return filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: selectedDistricts,
      sort: sortOrder,
      over90Days: isOver90Days
    });
  }, [serviceBoxes, lastStatus, selectedDistricts, sortOrder, isOver90Days]);

  const toggleDistrict = (dist: string) => {
    setSelectedDistricts(prev => 
      prev.includes(dist) ? prev.filter(d => d !== dist) : [...prev, dist]
    );
  };

  const handleGeneratePDF = () => {
    if (filteredList.length === 0) {
      toast({ title: 'Hata', description: 'Liste boş, PDF oluşturulamaz.', variant: 'destructive' });
      return;
    }

    setGeneratingPDF(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(20);
      doc.text("ENERYA", 14, 20);
      doc.setFontSize(14);
      doc.text("Servis Kutusu Listesi", 14, 30);
      
      doc.setFontSize(10);
      const today = new Date().toLocaleDateString('tr-TR');
      doc.text(`Olusturulma: ${today}`, 14, 40);
      doc.text(`Filtre Durumu: ${lastStatus === 'EMPTY' ? 'Bos' : lastStatus === 'OTHER' ? 'Diger' : 'Tumu'}`, 14, 46);
      doc.text(`Ilceler: ${selectedDistricts.length > 0 ? selectedDistricts.join(', ') : 'Tumu'}`, 14, 52);
      doc.text(`Bekleme: ${isOver90Days ? '> 90 Gun' : 'Tumu'}`, 14, 58);
      doc.text(`Siralama: ${sortOrder === 'DESC' ? 'Buyukten Kucuge' : sortOrder === 'ASC' ? 'Kucukten Buyuge' : 'Yok'}`, 14, 64);

      const tableData = filteredList.map((box) => [
        box.connectionObject,
        box.address,
        box.district,
        box.neighborhood,
        box.agreementDate || '-',
        `${box.waitingDays} Gun`,
        box.lastStatus || 'Bos',
        box.name || '-',
        box.phone || '-',
        box.sectorInfo || '-',
        box.sectorRegionInfo || '-'
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Baglanti Nesnesi', 'Adres', 'Ilce', 'Mahalle', 'Anlasma Tarihi', 'Bekleme', 'Son Durum', 'Isim', 'Telefon', 'Sektor', 'Bolge']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] } // slate-800
      });

      const fileName = `Enerya_Servis_Kutulari_${today.replace(/\./g, '-')}.pdf`;
      doc.save(fileName);
      
      toast({ title: 'Basarili', description: 'PDF basariyla indirildi.' });
    } catch (e) {
      toast({ title: 'Hata', description: 'PDF olusturulurken bir hata olustu.', variant: 'destructive' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGenerateQR = async () => {
    if (filteredList.length === 0) {
      toast({ title: 'Hata', description: 'Liste boş, QR oluşturulamaz.', variant: 'destructive' });
      return;
    }

    setGeneratingQR(true);
    try {
      const pkg = await qrService.createQrPackage(
        { lastStatus, districts: selectedDistricts, sort: sortOrder, over90Days: isOver90Days },
        filteredList.map(b => b.id)
      );
      setGeneratedQR(pkg);
      toast({ title: 'Başarılı', description: 'QR paket oluşturuldu.' });
    } catch (error) {
      toast({ title: 'Hata', description: 'QR oluşturulurken bir hata oluştu.', variant: 'destructive' });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSendToTeam = async () => {
    if (!generatedQR || !selectedTeamId) return;

    setSending(true);
    try {
      await qrService.sendQrPackage(generatedQR.id, selectedTeamId);
      
      const team = teams.find(t => t.id === selectedTeamId);
      toast({ title: 'QR Gönderildi', description: `QR paketi ${team?.code} ekibine başarıyla iletildi.` });
      
      // Reset
      setSendDialogOpen(false);
      setGeneratedQR(null);
      setSelectedTeamId('');
    } catch (error) {
      toast({ title: 'Hata', description: 'Gönderim sırasında hata oluştu.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* DEVELOPMENT DEBUG AREA */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-emerald-400 font-bold mr-2">Debug Info:</span>
            ServiceBox datasource: {serviceBoxes.length > 0 ? 'Loaded' : 'Empty'} | 
            Total DB Count: {serviceBoxes.length}
          </div>
          {serviceBoxes.length === 0 && <span className="text-rose-400 font-bold">Veri kaynağı boş!</span>}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">QR Yönetimi</h1>
        <p className="text-slate-500 mt-2 font-medium">Servis kutuları modülündeki güncel kayıtları filtreleyerek saha ekiplerine QR ve PDF olarak aktarın.</p>
        <div className="mt-3 inline-flex bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
          Kaynak: Servis Kutuları verilerinden oluşturulmuştur.
        </div>
      </div>

      {/* Stepper Header (Visual Only) */}
      <div className="flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">
        <span className="text-blue-600 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">1</span> Filtreler</span>
        <span className="text-slate-300 mx-2">→</span>
        <span className="text-blue-600 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">2</span> Liste</span>
        <span className="text-slate-300 mx-2">→</span>
        <span className={generatedQR ? "text-blue-600 flex items-center gap-2" : "flex items-center gap-2"}><span className={`w-6 h-6 rounded-full flex items-center justify-center ${generatedQR ? 'bg-blue-100' : 'bg-slate-200'}`}>3</span> QR/PDF</span>
        <span className="text-slate-300 mx-2">→</span>
        <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">4</span> Gönder</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Sol Kolon - Filtreler */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Servis Kutularından Liste Oluştur</h2>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-slate-500 font-semibold hover:text-slate-900">
              Filtreleri Temizle
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">1. Son Durum Filtresi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLastStatus("EMPTY")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${lastStatus === "EMPTY" ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">SON DURUMU BOŞ OLANLAR</span>
                    {lastStatus === "EMPTY" && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Son durum bilgisi girilmemiş servis kutuları</p>
                </button>
                <button
                  onClick={() => setLastStatus("OTHER")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${lastStatus === "OTHER" ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">SON DURUMU DİĞER OLANLAR</span>
                    {lastStatus === "OTHER" && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Son durum alanında değer bulunan servis kutuları</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">2. İlçe Seçimi</CardTitle>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDistricts(allDistricts)}>Tümünü Seç</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDistricts([])}>Temizle</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {allDistricts.map(dist => {
                  const count = districtCounts[dist] || 0;
                  const isSelected = selectedDistricts.includes(dist);
                  return (
                    <button
                      key={dist}
                      onClick={() => toggleDistrict(dist)}
                      className={`px-4 py-3 rounded-xl border font-semibold text-sm flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {dist}
                      <span className={`px-2 py-0.5 rounded-md text-xs ${isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">3. Bekleme Süresi</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setIsOver90Days(!isOver90Days)}
                className={`px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-3 transition-all ${
                  isOver90Days 
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {isOver90Days && <CheckCircle2 className="h-5 w-5 text-rose-500" />}
                &gt; 90 Gün
              </button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">4. Sıralama (Bekleme Süresi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md">
                <button
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${sortOrder === 'DESC' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setSortOrder('DESC')}
                >
                  Büyükten Küçüğe (99 → 0)
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${sortOrder === 'ASC' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setSortOrder('ASC')}
                >
                  Küçükten Büyüğe (0 → 99)
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Filtre Sonucu 
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md">{filteredList.length} kayıt</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-xs flex gap-2 flex-wrap">
                    <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">DURUM: {lastStatus === "EMPTY" ? "BOŞ" : lastStatus === "OTHER" ? "DİĞER" : "TÜMÜ"}</span>
                    {selectedDistricts.length > 0 && <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">İLÇE: {selectedDistricts.join(', ')}</span>}
                    {isOver90Days && <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded font-medium">BEKLEME: &gt; 90 GÜN</span>}
                    {sortOrder && <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">SIRALAMA: {sortOrder === "DESC" ? "BÜYÜKTEN KÜÇÜĞE" : "KÜÇÜKTEN BÜYÜĞE"}</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleGeneratePDF} disabled={generatingPDF || filteredList.length === 0} className="font-semibold gap-2 border-slate-200">
                    {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-rose-500" />}
                    PDF Olarak İndir
                  </Button>
                  <Button onClick={handleGenerateQR} disabled={generatingQR || filteredList.length === 0} className="font-semibold gap-2 bg-slate-900 hover:bg-slate-800">
                    {generatingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    QR Kod Oluştur
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-500 font-semibold uppercase text-xs sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-4 py-4 whitespace-nowrap">Bağlantı Nesnesi</th>
                      <th className="px-4 py-4">Adres</th>
                      <th className="px-4 py-4">İlçe / Mahalle</th>
                      <th className="px-4 py-4 whitespace-nowrap">Anlaşma Tarihi</th>
                      <th className="px-4 py-4 text-center">Bekleme</th>
                      <th className="px-4 py-4 whitespace-nowrap">Son Durum</th>
                      <th className="px-4 py-4">İsim</th>
                      <th className="px-4 py-4 whitespace-nowrap">Telefon</th>
                      <th className="px-4 py-4 whitespace-nowrap">Sektör Bilgisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length === 0 ? (
                      <tr><td colSpan={10} className="p-8 text-center text-slate-500">Seçtiğiniz kriterlere uygun servis kutusu bulunamadı.</td></tr>
                    ) : (
                      filteredList.map((box, idx) => (
                        <tr key={box.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{box.connectionObject}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[200px]" title={box.address}>{box.address}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{box.district} <span className="text-xs text-slate-400">/ {box.neighborhood}</span></td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{box.agreementDate || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                              box.waitingDays > 30 ? 'bg-red-50 text-red-700 border-red-200' :
                              box.waitingDays > 15 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {box.waitingDays} Gün
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{box.lastStatus || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">{box.name || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">{box.phone || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                            {box.sectorInfo || '-'} 
                            <span className="block text-slate-400 text-[10px]">{box.sectorRegionInfo}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sağ Kolon - QR Önizleme & Gönder */}
        <div className="xl:col-span-1">
          {generatedQR ? (
            <Card className="border-blue-200 bg-blue-50/50 shadow-sm rounded-2xl sticky top-24">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-blue-900">Oluşturulan QR</CardTitle>
                <CardDescription className="text-blue-700/70">{generatedQR.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-6 relative">
                  <QRCodeSVG 
                    value={`/saha/qr-listesi/${generatedQR.id}`} 
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-xl -translate-x-1 -translate-y-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-xl translate-x-1 -translate-y-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-xl -translate-x-1 translate-y-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-xl translate-x-1 translate-y-1" />
                </div>
                
                <div className="w-full space-y-3 text-sm bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Kayıt:</span>
                    <span className="font-bold text-slate-900">{generatedQR.serviceBoxIds.length} servis kutusu</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">İlçeler:</span>
                    <span className="font-bold text-slate-900 text-right">{generatedQR.filters.districts.length > 0 ? generatedQR.filters.districts.join(', ') : 'Tümü'}</span>
                  </div>
                  {(generatedQR.filters as any).over90Days && (
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Bekleme:</span>
                      <span className="font-bold text-rose-600">&gt; 90 Gün</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Son Durum:</span>
                    <span className="font-bold text-slate-900">{generatedQR.filters.lastStatus === 'EMPTY' ? 'Boş' : generatedQR.filters.lastStatus === 'OTHER' ? 'Diğer' : 'Tümü'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Oluşturulma:</span>
                    <span className="font-bold text-slate-900">{new Date(generatedQR.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setSendDialogOpen(true)}
                  className="w-full mt-6 h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-md gap-2"
                >
                  <Send className="h-5 w-5" />
                  SAHA EKİBİNE GÖNDER
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none rounded-2xl h-[600px] flex flex-col items-center justify-center text-center p-8 sticky top-24">
              <QrCode className="h-20 w-20 text-slate-300 mb-6" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">QR Henüz Oluşturulmadı</h3>
              <p className="text-slate-500 text-sm">Soldaki panelden filtreleme yapıp "QR Kod Oluştur" butonuna bastığınızda QR paketiniz burada belirecektir.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Gönderim Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">QR Paketi Gönder</DialogTitle>
            <DialogDescription>
              Filtrelediğiniz {generatedQR?.serviceBoxIds.length} kayıtlık listeyi hangi ekibe iletmek istiyorsunuz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Saha Ekibi Seçin</h4>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {teams.filter(t => t.status !== 'Tamamlandı').map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTeamId === team.id 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-lg text-slate-900 mb-1">{team.code}</div>
                  <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                    <span><span className="font-semibold text-slate-700">Enerya:</span> {team.eneryaEmployee.name}</span>
                    <span><span className="font-semibold text-slate-700">Kontrol:</span> {team.controlEmployee.name}</span>
                    <span className="mt-1 inline-flex bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit">{team.district}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Vazgeç</Button>
            <Button onClick={handleSendToTeam} disabled={!selectedTeamId || sending} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
