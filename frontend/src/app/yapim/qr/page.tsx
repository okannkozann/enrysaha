'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Send, Loader2, AlertCircle, Building2, Clock,
  ArrowUpDown, User, Check, Filter, ShieldAlert, RefreshCw, X,
  ChevronLeft, ChevronRight, Phone
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { qrService } from '@/lib/services/qrService';
import { teamService } from '@/lib/services/teamService';
import { filterServiceBoxesForQR } from '@/lib/utils/serviceBoxFilters';
import { ServiceBox, FieldTeam } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

/* ── Helper: Extract Phone Number from Box or Extra Fields ──────── */
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
  return '';
}

/* ── Helper: Convert Turkish Characters to ASCII for Clean PDF Rendering ── */
function trToAscii(text: string = ''): string {
  if (!text) return '';
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

/* ── Reusable Glass Card ─────────────────────────────────────────── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden ${className}`}>
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
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate block">{title}</span>
          {subtitle && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
}

export default function QRManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [serviceBoxes, setServiceBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);

  // Workflow State
  const [lastStatus, setLastStatus] = useState<"EMPTY" | "OTHER" | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC" | null>("DESC");
  const [isOver90Days, setIsOver90Days] = useState(false);

  const clearFilters = () => {
    setLastStatus(null);
    setSelectedDistricts([]);
    setSortOrder("DESC");
    setIsOver90Days(false);
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Output State
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Send State
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [sending, setSending] = useState(false);

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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [lastStatus, selectedDistricts, sortOrder, isOver90Days]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredList.length / pageSize));
  }, [filteredList.length, pageSize]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

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
      doc.setFontSize(18);
      doc.text("ENERYA - SERVIS KUTUSU IS EMRI LISTESI", 14, 18);

      doc.setFontSize(9);
      const today = new Date().toLocaleDateString('tr-TR');
      doc.text(`Olusturulma Tarihi: ${today}`, 14, 26);
      doc.text(trToAscii(`Son Durum Filtresi: ${lastStatus === 'EMPTY' ? 'Durumu Boş' : lastStatus === 'OTHER' ? 'Durumu Diğer' : 'Tümü'}`), 14, 32);
      doc.text(trToAscii(`Seçili İlçeler: ${selectedDistricts.length > 0 ? selectedDistricts.join(', ') : 'Tümü'}`), 14, 38);
      doc.text(trToAscii(`Yasal Bekleme Sınırı: ${isOver90Days ? '> 90 Gün (Yasal Aşım)' : 'Tümü'}`), 14, 44);
      doc.text(trToAscii(`Sıralama: ${sortOrder === 'DESC' ? 'Büyükten Küçüğe (En Çok Bekleyen)' : sortOrder === 'ASC' ? 'Küçükten Büyüğe' : 'Standart'}`), 14, 50);

      const tableData = filteredList.map((box) => [
        trToAscii(box.connectionObject),
        trToAscii(box.address || '-'),
        trToAscii(box.district || '-'),
        trToAscii(box.neighborhood || '-'),
        trToAscii(box.agreementDate || '-'),
        `${box.waitingDays} Gun`,
        trToAscii(box.lastStatus || 'Bos'),
        trToAscii(box.name || '-'),
        trToAscii(getBoxPhone(box) || '-'),
        trToAscii(box.sectorInfo || box.sectorRegionInfo || '-'),
      ]);

      autoTable(doc, {
        startY: 56,
        head: [['Baglanti Nesnesi', 'Adres', 'Ilce', 'Mahalle', 'Anlasma Tarihi', 'Bekleme', 'Son Durum', 'Abone Adi', 'Telefon', 'Sektor']],
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

  const handleOpenSendDialog = () => {
    if (filteredList.length === 0) {
      toast({ title: 'Uyarı', description: 'Seçili filtrelere uygun servis kutusu bulunamadı.', variant: 'destructive' });
      return;
    }
    setSendDialogOpen(true);
  };

  const handleSendToTeam = async () => {
    if (!selectedTeamId || filteredList.length === 0) return;

    setSending(true);
    try {
      // 1. Automatically generate QR Package for the selected list
      const pkg = await qrService.createQrPackage(
        {
          lastStatus: (lastStatus || "EMPTY") as "EMPTY" | "OTHER",
          districts: selectedDistricts,
          sort: (sortOrder || "DESC") as "ASC" | "DESC",
          ...(isOver90Days ? { over90Days: true } : {})
        } as any,
        filteredList.map((b) => b.id)
      );

      // 2. Dispatch package to team
      await qrService.sendQrPackage(pkg.id, selectedTeamId);

      const team = teams.find((t) => t.id === selectedTeamId);
      toast({
        title: 'İş Emri Saha Ekibine İletildi',
        description: `${filteredList.length} adet servis kutusu iş paketi ${team?.code} (${team?.district}) ekibine başarıyla atandı.`,
      });

      // Reset
      setSendDialogOpen(false);
      setSelectedTeamId('');
    } catch (error) {
      toast({ title: 'Hata', description: 'Gönderim sırasında hata oluştu.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const emptyBoxesCount = useMemo(() => serviceBoxes.filter((b) => !b.lastStatus || b.lastStatus.trim() === '').length, [serviceBoxes]);
  const otherBoxesCount = useMemo(() => serviceBoxes.length - emptyBoxesCount, [serviceBoxes, emptyBoxesCount]);

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-sm font-semibold">Servis Kutuları (Saha) Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="h-full max-h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 gap-2">

      {/* ══ 1. WORKFLOW STEPPER ══════════════════════════════════════ */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { step: '1', title: 'Filtreleri Belirle', desc: 'Durum, ilçe ve SLA seçimi', active: true, done: selectedDistricts.length > 0 || lastStatus !== null || isOver90Days },
          { step: '2', title: 'Listeyi İncele', desc: `${filteredList.length} kayıt seçildi`, active: filteredList.length > 0, done: filteredList.length > 0 },
          { step: '3', title: 'Saha Ekibine Gönder', desc: 'Saha mobiline tek tıkla aktar', active: false, done: false },
        ].map(({ step, title, desc, active, done }) => (
          <div
            key={step}
            className={`p-2 rounded-xl border backdrop-blur-sm transition-all ${done
              ? 'border-blue-500/40 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
              : active
                ? 'border-slate-600/50 bg-slate-800/60'
                : 'border-slate-800 bg-slate-900/40 opacity-70'
              }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${done
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-700 text-slate-300'
                  }`}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : step}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{title}</div>
                <div className="text-[10px] text-slate-400 truncate">{desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ 2. MAIN WORKFLOW: FILTERS (LEFT) & PREVIEW (RIGHT) ════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">

        {/* ── SOL KOLON: FİLTRELER ── */}
        <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto pr-0.5">

          {/* Filtre Başlığı & Temizleme */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-blue-400" />
                İş Emri Filtreleme Kriterleri
              </h2>
              <p className="text-[10px] text-slate-400">
                Sahaya gönderilecek servis kutularını seçin
              </p>
            </div>

            {(lastStatus !== null || selectedDistricts.length > 0 || isOver90Days || sortOrder !== 'DESC') && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 transition-all"
              >
                <X className="h-3 w-3" />
                Temizle
              </button>
            )}
          </div>

          {/* 1. Son Durum Filtresi */}
          <GlassCard className="shrink-0">
            <CardHeader
              icon={AlertCircle}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              title="1. Son Durum Seçimi"
              subtitle="Durum kaydına göre süzme"
            />
            <div className="p-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLastStatus(lastStatus === "EMPTY" ? null : "EMPTY")}
                  className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${lastStatus === "EMPTY"
                      ? 'border-blue-500/60 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)] text-white'
                      : 'border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Durumu Boş
                      </div>
                      <div className="text-lg font-extrabold text-white">{emptyBoxesCount}</div>
                    </div>
                    {lastStatus === "EMPTY" ? (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-slate-500" />
                    )}
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1">
                    Durum girişi bekleyenler
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLastStatus(lastStatus === "OTHER" ? null : "OTHER")}
                  className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${lastStatus === "OTHER"
                      ? 'border-blue-500/60 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)] text-white'
                      : 'border-slate-700/50 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Durumu Diğer
                      </div>
                      <div className="text-lg font-extrabold text-white">{otherBoxesCount}</div>
                    </div>
                    {lastStatus === "OTHER" ? (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-slate-500" />
                    )}
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1">
                    Önceden değer girilmişler
                  </p>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* 2. İlçe Seçimi */}
          <GlassCard className="shrink-0">
            <CardHeader
              icon={Building2}
              iconColor="text-teal-400"
              iconBg="bg-teal-500/10"
              title="2. İlçe Seçimi"
              subtitle="Dahil edilecek ilçeleri seçin"
              action={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDistricts(allDistricts)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 bg-slate-700/50 border border-slate-600/40 hover:bg-slate-700 transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDistricts([])}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              }
            />
            <div className="p-2">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {allDistricts.map((dist) => {
                  const count = districtCounts[dist] || 0;
                  const isSelected = selectedDistricts.includes(dist);
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => toggleDistrict(dist)}
                      className={`px-1.5 py-1 rounded border text-[10.5px] font-semibold flex items-center justify-between gap-1 transition-all ${isSelected
                          ? 'bg-blue-600/25 border-blue-500/50 text-white shadow-sm'
                          : 'bg-slate-900/60 text-slate-300 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                    >
                      <span className="truncate">{dist}</span>
                      <span
                        className={`text-[8.5px] px-1 rounded font-bold shrink-0 ${isSelected
                            ? 'bg-blue-500/30 text-blue-200'
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

          {/* 3 & 4. Bekleme Süresi & Sıralama (Yan Yana) */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {/* Bekleme Süresi */}
            <GlassCard>
              <CardHeader
                icon={Clock}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/10"
                title="3. SLA Sınırı"
                subtitle="Mevzuat aşımı"
              />
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setIsOver90Days(!isOver90Days)}
                  className={`w-full p-2 rounded-lg border text-[10.5px] font-bold flex items-center justify-between gap-1 transition-all ${isOver90Days
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                      : 'bg-slate-900/60 border-slate-700/40 text-slate-300 hover:bg-slate-800/80'
                    }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <ShieldAlert className={`h-3.5 w-3.5 shrink-0 ${isOver90Days ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span className="truncate">&gt; 90 Gün Aşımı</span>
                  </div>
                  {isOver90Days ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                      <Check className="h-2 w-2" />
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                  )}
                </button>
              </div>
            </GlassCard>

            {/* Sıralama */}
            <GlassCard>
              <CardHeader
                icon={ArrowUpDown}
                iconColor="text-indigo-400"
                iconBg="bg-indigo-500/10"
                title="4. Sıralama"
                subtitle="Önceliklendirme"
              />
              <div className="p-2">
                <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/50 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setSortOrder('DESC')}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all ${sortOrder === 'DESC'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Büyükten Küçüğe
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortOrder('ASC')}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-all ${sortOrder === 'ASC'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Küçükten Büyüğe
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>

        {/* ── SAĞ KOLON: İŞ EMRİ ÖNİZLEME LİSTESİ ── */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0 overflow-hidden">
          <GlassCard className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-slate-700/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">İş Emri Önizleme Listesi</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10.5px] font-extrabold">
                  {filteredList.length} Kutu
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF || filteredList.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {generatingPDF ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 text-rose-400" />
                  )}
                  PDF İndir
                </button>

                <button
                  type="button"
                  onClick={handleOpenSendDialog}
                  disabled={filteredList.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3 w-3" />
                  Saha Ekibine Gönder
                </button>
              </div>
            </div>

            {/* Tablo İç Alanı (20 Kayıt İçin Scrollable İç Bölme) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <table className="w-full table-fixed text-[9.5px] text-left border-collapse">
                <thead className="bg-slate-900/95 border-b border-slate-700/50 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="w-[13%] px-1.5 py-1.5 truncate">Bağlantı Nesnesi</th>
                    <th className="w-[17%] px-1.5 py-1.5 truncate">Adres</th>
                    <th className="w-[14%] px-1.5 py-1.5 truncate">İlçe / Mahalle</th>
                    <th className="w-[8%] px-1.5 py-1.5 truncate text-center">Tarih</th>
                    <th className="w-[7%] px-1.5 py-1.5 text-center truncate">Bekleme</th>
                    <th className="w-[8%] px-1.5 py-1.5 text-center truncate">Son Durum</th>
                    <th className="w-[11%] px-1.5 py-1.5 truncate">Abone Adı</th>
                    <th className="w-[12%] px-1.5 py-1.5 truncate">Telefon</th>
                    <th className="w-[10%] px-1.5 py-1.5 truncate">Sektör</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/25">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500 text-xs">
                        Filtrelere uygun servis kutusu bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((box, idx) => {
                      const phoneVal = getBoxPhone(box);
                      return (
                        <tr
                          key={box.id}
                          className={`hover:bg-slate-700/20 transition-colors ${
                            idx % 2 === 0 ? '' : 'bg-slate-800/20'
                          }`}
                        >
                          <td className="px-1.5 py-1 font-bold text-slate-100 truncate" title={box.connectionObject}>
                            {box.connectionObject}
                          </td>
                          <td className="px-1.5 py-1 text-slate-400 truncate" title={box.address}>
                            {box.address || '—'}
                          </td>
                          <td className="px-1.5 py-1 text-slate-300 truncate" title={`${box.district} / ${box.neighborhood}`}>
                            {box.district} <span className="text-slate-500 text-[8.5px]">/ {box.neighborhood}</span>
                          </td>
                          <td className="px-1.5 py-1 text-center text-slate-400 truncate" title={box.agreementDate}>
                            {box.agreementDate || '—'}
                          </td>
                          <td className="px-1.5 py-1 text-center truncate">
                            <span
                              className={`inline-flex px-1 py-0.2 rounded text-[8.5px] font-bold border ${
                                box.waitingDays >= 90
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : box.waitingDays >= 60
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border-slate-600/30'
                              }`}
                            >
                              {box.waitingDays} G
                            </span>
                          </td>
                          <td className="px-1.5 py-1 text-center truncate">
                            <span
                              className={`inline-flex px-1 py-0.2 rounded text-[8.5px] font-semibold border ${
                                !box.lastStatus
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                  : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                              }`}
                            >
                              {box.lastStatus || 'Boş'}
                            </span>
                          </td>
                          <td className="px-1.5 py-1 text-slate-300 truncate" title={box.name}>
                            {box.name || '—'}
                          </td>
                          <td className="px-1.5 py-1 text-slate-300 truncate text-[8.5px]" title={phoneVal || 'Telefon Bilgisi Yok'}>
                            {phoneVal ? (
                              <span className="inline-flex items-center gap-1 text-slate-200">
                                <Phone className="h-2.5 w-2.5 shrink-0 text-blue-400" />
                                <span className="truncate">{phoneVal}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-1.5 py-1 text-slate-400 truncate text-[8.5px]" title={box.sectorInfo || box.sectorRegionInfo}>
                            {box.sectorInfo || box.sectorRegionInfo || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div className="px-3 py-1.5 border-t border-slate-700/40 flex items-center justify-between text-[10.5px] text-slate-400 shrink-0 bg-slate-900/60">
              <div className="flex items-center gap-1">
                <span>
                  Toplam <strong className="text-slate-200">{filteredList.length}</strong> kayıttan{' '}
                  <strong className="text-slate-200">
                    {filteredList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, filteredList.length)}
                  </strong>{' '}
                  arası
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px]">
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
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Sonraki Sayfa"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>



        {/* ══ 5. SAHA EKİBİNE SEVK DİALOG (DARK GLASSMORPHISM) ═════════ */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-xl bg-slate-900/95 border border-slate-700/60 backdrop-blur-xl text-slate-100 p-6 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-400" />
                İş Emrini Saha Ekibine Sevk Et
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Filtrelediğiniz <span className="text-blue-300 font-bold">{filteredList.length} servis kutusu</span> hangi saha ekibine yönlendirilsin?
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
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${isSelected
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
    );
  }
