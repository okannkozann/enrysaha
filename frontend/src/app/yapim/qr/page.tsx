'use client';
import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download, FileText, QrCode, Send, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle, Building2, Clock, ArrowUpDown,
  Layers, MapPin, Phone, User, Check, Sparkles, Filter,
  ShieldAlert, RefreshCw, X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { qrService } from '@/lib/services/qrService';
import { teamService } from '@/lib/services/teamService';
import { filterServiceBoxesForQR } from '@/lib/utils/serviceBoxFilters';
import { ServiceBox, FieldTeam, QRPackage } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

/* ── Reusable Glass Card ─────────────────────────────────────────── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  action,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-slate-100 truncate block">{title}</span>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  );
}

export default function QRManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading]           = useState(true);
  const [serviceBoxes, setServiceBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams]               = useState<FieldTeam[]>([]);

  // Workflow State
  const [lastStatus, setLastStatus]               = useState<"EMPTY" | "OTHER" | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [sortOrder, setSortOrder]                 = useState<"DESC" | "ASC" | null>("DESC");
  const [isOver90Days, setIsOver90Days]           = useState(false);

  const clearFilters = () => {
    setLastStatus(null);
    setSelectedDistricts([]);
    setSortOrder("DESC");
    setIsOver90Days(false);
  };

  // Output State
  const [generatedQR, setGeneratedQR]     = useState<QRPackage | null>(null);
  const [generatingQR, setGeneratingQR]   = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Send State
  const [sendDialogOpen, setSendDialogOpen]   = useState(false);
  const [selectedTeamId, setSelectedTeamId]   = useState<string>('');
  const [sending, setSending]                 = useState(false);

  useEffect(() => {
    async function load() {
      const [boxes, tms] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams(),
      ]);
      setServiceBoxes(boxes);
      setTeams(tms);
      setLoading(false);
    }
    load();
  }, []);

  const allDistricts = useMemo(() => {
    const dists = new Set(serviceBoxes.map((b) => b.district).filter(Boolean));
    return Array.from(dists).sort();
  }, [serviceBoxes]);

  // Derive districts count based on other active filters (except districts itself)
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const filteredForCounts = filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: [],
      sort: null,
      over90Days: isOver90Days,
    });

    filteredForCounts.forEach((box) => {
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
      over90Days: isOver90Days,
    });
  }, [serviceBoxes, lastStatus, selectedDistricts, sortOrder, isOver90Days]);

  const toggleDistrict = (dist: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
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
      doc.text("Servis Kutusu Is Emri Listesi", 14, 30);

      doc.setFontSize(10);
      const today = new Date().toLocaleDateString('tr-TR');
      doc.text(`Olusturulma Tarihi: ${today}`, 14, 40);
      doc.text(`Son Durum Filtresi: ${lastStatus === 'EMPTY' ? 'Durumu Bos' : lastStatus === 'OTHER' ? 'Durumu Diger' : 'Tumu'}`, 14, 46);
      doc.text(`Secili Ilceler: ${selectedDistricts.length > 0 ? selectedDistricts.join(', ') : 'Tumu'}`, 14, 52);
      doc.text(`Yasal Bekleme Siniri: ${isOver90Days ? '> 90 Gun (Yasal Asim)' : 'Tumu'}`, 14, 58);
      doc.text(`Siralama: ${sortOrder === 'DESC' ? 'Buyukten Kucuge (En Cok Bekleyen)' : sortOrder === 'ASC' ? 'Kucukten Buyuge' : 'Standart'}`, 14, 64);

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
        box.sectorRegionInfo || '-',
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Baglanti Nesnesi', 'Adres', 'Ilce', 'Mahalle', 'Anlasma Tarihi', 'Bekleme', 'Son Durum', 'Abone Adi', 'Telefon', 'Sektor', 'Bolge']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
      });

      const fileName = `Enerya_Is_Emri_${today.replace(/\./g, '-')}.pdf`;
      doc.save(fileName);

      toast({ title: 'Başarılı', description: 'İş emri PDF belgesi başarıyla indirildi.' });
    } catch (e) {
      toast({ title: 'Hata', description: 'PDF oluşturulurken bir hata oluştu.', variant: 'destructive' });
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
        {
          lastStatus: (lastStatus || "EMPTY") as "EMPTY" | "OTHER",
          districts: selectedDistricts,
          sort: (sortOrder || "DESC") as "ASC" | "DESC",
          ...(isOver90Days ? { over90Days: true } : {})
        } as any,
        filteredList.map((b) => b.id)
      );
      setGeneratedQR(pkg);
      toast({ title: 'QR Paket Oluşturuldu', description: `${filteredList.length} kutu için mobil iş emri hazır.` });
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

      const team = teams.find((t) => t.id === selectedTeamId);
      toast({
        title: 'QR İş Emri İletildi',
        description: `QR paketi ${team?.code} (${team?.district}) ekibine başarıyla atandı.`,
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-sm font-semibold">QR Yönetim Modülü Yükleniyor...</span>
      </div>
    );
  }

  const emptyBoxesCount  = serviceBoxes.filter((b) => !b.lastStatus || b.lastStatus.trim() === '').length;
  const otherBoxesCount  = serviceBoxes.length - emptyBoxesCount;
  const overdueCount     = serviceBoxes.filter((b) => b.waitingDays > 90).length;
  const activeTeamsCount = teams.filter((t) => t.status === 'Aktif').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7">

        {/* ══ 1. HERO OPERATIONAL BANNER ════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-md shadow-2xl p-6 sm:p-8">
          {/* Ambient lighting */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute top-1/2 right-12 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                Saha İş Emri & Sevk Modülü
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                QR KOD & DİJİTAL İŞ EMRİ YÖNETİMİ
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Servis kutuları portföyünü kriterlere göre süzün, sahada mobil uygulama ile okutulabilen QR iş paketleri oluşturun veya PDF iş listesi çıktısı alın.
              </p>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 min-w-[110px]">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Toplam Kutu</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">{serviceBoxes.length}</div>
                <div className="text-[10px] text-blue-400/80">kayıtlı abone</div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 min-w-[110px]">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Filtrelenen</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{filteredList.length}</div>
                <div className="text-[10px] text-emerald-400/80">pakete hazır</div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 min-w-[110px]">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">90+ Gün Aşım</div>
                <div className="text-xl sm:text-2xl font-black text-red-300 mt-1">{overdueCount}</div>
                <div className="text-[10px] text-red-400/80">yasal risk</div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 min-w-[110px]">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Saha Ekipleri</div>
                <div className="text-xl sm:text-2xl font-black text-purple-300 mt-1">{activeTeamsCount} Aktif</div>
                <div className="text-[10px] text-purple-400/80">{teams.length} ekip hazır</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 2. WORKFLOW STEPPER ══════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Filtreleri Belirle', desc: 'Durum, ilçe ve SLA seçimi', active: true, done: selectedDistricts.length > 0 || lastStatus !== null || isOver90Days },
            { step: '2', title: 'Listeyi İncele', desc: `${filteredList.length} kayıt seçildi`, active: filteredList.length > 0, done: filteredList.length > 0 },
            { step: '3', title: 'QR / PDF Üret', desc: generatedQR ? 'QR Paketi Hazır' : 'Tek tıkla dijitalleştir', active: !!generatedQR, done: !!generatedQR },
            { step: '4', title: 'Ekibe Sevk Et', desc: 'Saha mobiline aktar', active: false, done: false },
          ].map(({ step, title, desc, active, done }) => (
            <div
              key={step}
              className={`p-3.5 rounded-xl border backdrop-blur-sm transition-all ${
                done
                  ? 'border-blue-500/40 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : active
                  ? 'border-slate-600/50 bg-slate-800/60'
                  : 'border-slate-800 bg-slate-900/40 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    done
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ 3. MAIN WORKFLOW: FILTERS (2 COLS) + QR PREVIEW (1 COL) ═ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Sol Kolon - Filtreler ve Önizleme (2 Kolon) */}
          <div className="xl:col-span-2 space-y-6">

            {/* Filtre Başlığı & Temizleme */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-400" />
                  İş Emri Filtreleme Kriterleri
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sahaya gönderilecek servis kutularını seçin
                </p>
              </div>

              {(lastStatus !== null || selectedDistricts.length > 0 || isOver90Days || sortOrder !== 'DESC') && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Filtreleri Sıfırla
                </button>
              )}
            </div>

            {/* ── 1. Son Durum Filtresi ── */}
            <GlassCard>
              <CardHeader
                icon={AlertCircle}
                iconColor="text-blue-400"
                iconBg="bg-blue-500/10"
                title="1. Son Durum Seçimi"
                subtitle="Servis kutusunun sistemdeki son durum kaydına göre süzme"
              />
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setLastStatus(lastStatus === "EMPTY" ? null : "EMPTY")}
                    className={`p-4 sm:p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      lastStatus === "EMPTY"
                        ? 'border-blue-500/60 bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white'
                        : 'border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Durumu Boş Olanlar
                        </div>
                        <div className="text-2xl font-black text-white">{emptyBoxesCount}</div>
                      </div>
                      {lastStatus === "EMPTY" ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-slate-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Son durum alanı boş olan, sahada montaj / durum girişi bekleyen kutular.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLastStatus(lastStatus === "OTHER" ? null : "OTHER")}
                    className={`p-4 sm:p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      lastStatus === "OTHER"
                        ? 'border-blue-500/60 bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white'
                        : 'border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Durumu Diğer Olanlar
                        </div>
                        <div className="text-2xl font-black text-white">{otherBoxesCount}</div>
                      </div>
                      {lastStatus === "OTHER" ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-slate-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Son durum alanında önceden değer girilmiş, takipteki servis kutuları.
                    </p>
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* ── 2. İlçe Seçimi ── */}
            <GlassCard>
              <CardHeader
                icon={Building2}
                iconColor="text-teal-400"
                iconBg="bg-teal-500/10"
                title="2. İlçe Seçimi"
                subtitle="İş emri paketine dahil edilecek ilçeleri belirleyin"
                action={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDistricts(allDistricts)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-slate-700/50 border border-slate-600/40 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDistricts([])}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                }
              />
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {allDistricts.map((dist) => {
                    const count      = districtCounts[dist] || 0;
                    const isSelected = selectedDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => toggleDistrict(dist)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600/25 border-blue-500/50 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-slate-900/60 text-slate-300 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSelected ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-slate-500'
                            }`}
                          />
                          <span className="truncate">{dist}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                            isSelected
                              ? 'bg-blue-500/30 text-blue-200 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* ── 3 & 4. Bekleme Süresi & Sıralama (Yan Yana) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Bekleme Süresi */}
              <GlassCard>
                <CardHeader
                  icon={Clock}
                  iconColor="text-amber-400"
                  iconBg="bg-amber-500/10"
                  title="3. Yasal SLA Sınırı"
                  subtitle="Mevzuat bekleme süresi aşımı"
                />
                <div className="p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setIsOver90Days(!isOver90Days)}
                    className={`w-full p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                      isOver90Days
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 shadow-md shadow-rose-500/10'
                        : 'bg-slate-900/60 border-slate-700/40 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`h-4 w-4 ${isOver90Days ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span>&gt; 90 Gün (Yasal Limit Aşımı)</span>
                    </div>
                    {isOver90Days ? (
                      <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-700" />
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Sadece 90 günü aşmış ve acil müdahale gerektiren aboneleri filtreler.
                  </p>
                </div>
              </GlassCard>

              {/* Sıralama */}
              <GlassCard>
                <CardHeader
                  icon={ArrowUpDown}
                  iconColor="text-indigo-400"
                  iconBg="bg-indigo-500/10"
                  title="4. Liste Sıralaması"
                  subtitle="Bekleme gününe göre önceliklendirme"
                />
                <div className="p-4 sm:p-5">
                  <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 gap-1">
                    <button
                      type="button"
                      onClick={() => setSortOrder('DESC')}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                        sortOrder === 'DESC'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Büyükten Küçüğe (99 → 0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder('ASC')}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${
                        sortOrder === 'ASC'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Küçükten Büyüğe (0 → 99)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    En çok bekleyen kritik kutular listenin en üstünde yer alır.
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* ── 5. Filtre Sonucu & Önizleme Listesi ── */}
            <GlassCard>
              <div className="px-5 py-4 border-b border-slate-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">İş Emri Önizleme</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black">
                      {filteredList.length} Kutu
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600/40 text-[10px] text-slate-300 font-medium">
                      Durum: {lastStatus === "EMPTY" ? "Boş" : lastStatus === "OTHER" ? "Diğer" : "Tümü"}
                    </span>
                    {selectedDistricts.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600/40 text-[10px] text-slate-300 font-medium">
                        İlçe: {selectedDistricts.join(', ')}
                      </span>
                    )}
                    {isOver90Days && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-[10px] text-red-300 font-bold">
                        &gt; 90 Gün
                      </span>
                    )}
                  </div>
                </div>

                {/* PDF & QR Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF || filteredList.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 text-rose-400" />
                    )}
                    PDF İndir
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateQR}
                    disabled={generatingQR || filteredList.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingQR ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                    QR Kod Oluştur
                  </button>
                </div>
              </div>

              {/* Masaüstü Tablo (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-4 py-3">Bağlantı Nesnesi</th>
                      <th className="px-4 py-3">Adres</th>
                      <th className="px-4 py-3">İlçe / Mahalle</th>
                      <th className="px-4 py-3 text-center">Bekleme</th>
                      <th className="px-4 py-3 text-center">Son Durum</th>
                      <th className="px-4 py-3">Abone Adı</th>
                      <th className="px-4 py-3">Sektör</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/25">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-500 text-sm">
                          Filtrelere uygun servis kutusu bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((box, idx) => (
                        <tr
                          key={box.id}
                          className={`hover:bg-slate-700/20 transition-colors ${
                            idx % 2 === 0 ? '' : 'bg-slate-800/20'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-slate-100 whitespace-nowrap">
                            {box.connectionObject}
                          </td>
                          <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]" title={box.address}>
                            {box.address || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                            {box.district} <span className="text-slate-500 text-[11px]">/ {box.neighborhood}</span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
                                box.waitingDays >= 90
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : box.waitingDays >= 60
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-700/50 text-slate-300 border-slate-600/30'
                              }`}
                            >
                              {box.waitingDays} Gün
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                !box.lastStatus
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                  : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                              }`}
                            >
                              {box.lastStatus || 'Boş'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 truncate max-w-[140px]">
                            {box.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {box.sectorInfo || box.sectorRegionInfo || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobilde Kart Görünümü (block sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-800 max-h-[460px] overflow-y-auto">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Filtrelere uygun servis kutusu bulunamadı.
                  </div>
                ) : (
                  filteredList.map((box) => (
                    <div key={box.id} className="p-3.5 space-y-2 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{box.connectionObject}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              box.waitingDays >= 90
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-slate-700/60 text-slate-300 border-slate-600/30'
                            }`}
                          >
                            {box.waitingDays} Gün
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            {box.lastStatus || 'Boş'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 leading-snug">
                        {box.district} / {box.neighborhood} — {box.address}
                      </div>

                      {box.name && (
                        <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-500" />
                          <span>{box.name}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

          </div>

          {/* Sağ Kolon - QR Önizleme & Saha Ekibine Sevk (1 Kolon) */}
          <div className="xl:col-span-1">
            {generatedQR ? (
              <GlassCard className="sticky top-20 border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-blue-950/20 shadow-2xl">
                <CardHeader
                  icon={QrCode}
                  iconColor="text-blue-400"
                  iconBg="bg-blue-500/15"
                  title="Oluşturulan QR İş Emri"
                  subtitle={generatedQR.id}
                />

                <div className="p-6 flex flex-col items-center">
                  {/* QR Box with Glowing Cyber Frame */}
                  <div className="relative p-4 rounded-2xl bg-white shadow-2xl shadow-blue-500/15 mb-6">
                    <QRCodeSVG
                      value={`/saha/qr-listesi/${generatedQR.id}`}
                      size={210}
                      level="H"
                      includeMargin={false}
                    />
                    {/* Cyber corner accents */}
                    <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-blue-600 rounded-tl -translate-x-1 -translate-y-1" />
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-blue-600 rounded-tr translate-x-1 -translate-y-1" />
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-blue-600 rounded-bl -translate-x-1 translate-y-1" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-blue-600 rounded-br translate-x-1 translate-y-1" />
                  </div>

                  {/* Summary Details */}
                  <div className="w-full rounded-xl bg-slate-900/80 border border-slate-700/50 p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Atanan Kutu:</span>
                      <span className="font-bold text-white">{generatedQR.serviceBoxIds.length} Servis Kutusu</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400">İlçeler:</span>
                      <span className="font-bold text-slate-200 text-right truncate max-w-[160px]">
                        {generatedQR.filters.districts.length > 0 ? generatedQR.filters.districts.join(', ') : 'Tümü'}
                      </span>
                    </div>

                    {(generatedQR.filters as any).over90Days && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-slate-400">Bekleme Sınırı:</span>
                        <span className="font-bold text-red-400">&gt; 90 Gün (Acil)</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Son Durum:</span>
                      <span className="font-bold text-slate-200">
                        {generatedQR.filters.lastStatus === 'EMPTY' ? 'Boş' : generatedQR.filters.lastStatus === 'OTHER' ? 'Diğer' : 'Tümü'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Oluşturuldu:</span>
                      <span className="font-medium text-slate-300">
                        {new Date(generatedQR.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => setSendDialogOpen(true)}
                    className="w-full mt-5 py-3.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Send className="h-4 w-4" />
                    SAHA EKİBİNE GÖNDER
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="sticky top-20 border-dashed border-2 border-slate-700/60 bg-slate-900/30 p-8 flex flex-col items-center justify-center text-center h-[520px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
                  <QrCode className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">QR Henüz Oluşturulmadı</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Soldaki panelden filtre kriterlerini belirleyip <strong className="text-slate-300">"QR Kod Oluştur"</strong> butonuna bastığınızda, saha ekiplerinin anında okutabileceği dijital iş paketi burada belirecektir.
                </p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* ══ 4. SAHA EKİBİNE SEVK DİALOG (DARK GLASSMORPHISM) ═════════ */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-xl bg-slate-900/95 border border-slate-700/60 backdrop-blur-xl text-slate-100 p-6 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-400" />
                QR İş Emrini Saha Ekibine Sevk Et
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Filtrelediğiniz <span className="text-blue-300 font-bold">{generatedQR?.serviceBoxIds.length} servis kutusu</span> hangi saha ekibine yönlendirilsin?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Görevli Saha Ekibini Seçin
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {teams.filter((t) => t.status !== 'Tamamlandı').map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20 shadow-md shadow-blue-500/20'
                          : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">{team.code}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">
                          {team.district}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div><span className="text-slate-500">Enerya:</span> {team.eneryaEmployee?.name || '—'}</div>
                        <div><span className="text-slate-500">Kontrol:</span> {team.controlEmployee?.name || '—'}</div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSendDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSendToTeam}
                disabled={!selectedTeamId || sending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Sevk Et ve Gönder
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
