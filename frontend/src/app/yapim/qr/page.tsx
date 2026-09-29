'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Send, Loader2, AlertCircle, Building2, Clock,
  ArrowUpDown, User, Check, Filter, ShieldAlert, RefreshCw, X,
  ChevronLeft, ChevronRight, Phone, MapPin, Layers, Maximize2, Search,
  ArrowDownAZ, ArrowDown10, CheckSquare, Square
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

/* ── Helper: Format Sector by Stripping Standard '072200' Prefix ── */
function formatSector(sec?: string | null): string {
  if (!sec || sec.trim() === '' || sec === '—' || sec === '-') return '—';
  const cleaned = sec.replace(/^072200[-_/\s]?|072200/g, '').trim();
  return cleaned !== '' ? cleaned : sec;
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
  onExpand,
  expandTooltip = "Genişlet",
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onExpand?: () => void;
  expandTooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate block">{title}</span>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                title={expandTooltip}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-500 transition-all shrink-0"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            )}
          </div>
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
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC" | null>("DESC");
  const [isOver90Days, setIsOver90Days] = useState(false);

  const clearFilters = () => {
    setLastStatus(null);
    setSelectedDistricts([]);
    setSelectedNeighborhoods([]);
    setSelectedSectors([]);
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

  // Pop-up Modal States
  const [neighborhoodModalOpen, setNeighborhoodModalOpen] = useState(false);
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [neighborhoodTab, setNeighborhoodTab] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL');
  const [sectorTab, setSectorTab] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL');
  const [modalDistrictFilter, setModalDistrictFilter] = useState<string>('ALL');
  const [neighborhoodSort, setNeighborhoodSort] = useState<'COUNT_DESC' | 'ALPHA'>('COUNT_DESC');
  const [sectorSort, setSectorSort] = useState<'COUNT_DESC' | 'ALPHA'>('COUNT_DESC');
  const [mainNeighborhoodView, setMainNeighborhoodView] = useState<'SELECTED' | 'ALL'>('ALL');
  const [mainSectorView, setMainSectorView] = useState<'SELECTED' | 'ALL'>('ALL');

  useEffect(() => {
    if (selectedNeighborhoods.length > 0) {
      setMainNeighborhoodView('SELECTED');
    } else {
      setMainNeighborhoodView('ALL');
    }
  }, [selectedNeighborhoods.length]);

  useEffect(() => {
    if (selectedSectors.length > 0) {
      setMainSectorView('SELECTED');
    } else {
      setMainSectorView('ALL');
    }
  }, [selectedSectors.length]);

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
      neighborhoods: [],
      sectors: selectedSectors,
      sort: null,
      over90Days: isOver90Days,
    });

    filteredForCounts.forEach((box) => {
      if (box.district) {
        counts[box.district] = (counts[box.district] || 0) + 1;
      }
    });
    return counts;
  }, [serviceBoxes, lastStatus, selectedSectors, isOver90Days]);

  // Available neighborhoods based on selected districts (or all if none selected)
  const availableNeighborhoods = useMemo(() => {
    const list = selectedDistricts.length > 0
      ? serviceBoxes.filter((b) => b.district && selectedDistricts.includes(b.district))
      : serviceBoxes;
    const nbs = new Set(list.map((b) => b.neighborhood).filter((n): n is string => Boolean(n && n.trim() !== '')));
    return Array.from(nbs).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [serviceBoxes, selectedDistricts]);

  // Prune selected neighborhoods if they are no longer in availableNeighborhoods
  useEffect(() => {
    setSelectedNeighborhoods((prev) => {
      const valid = prev.filter((nb) => availableNeighborhoods.includes(nb));
      return valid.length === prev.length ? prev : valid;
    });
  }, [availableNeighborhoods]);

  // Derive neighborhood counts based on active filters
  const neighborhoodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const filteredForCounts = filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: selectedDistricts,
      neighborhoods: [],
      sectors: selectedSectors,
      sort: null,
      over90Days: isOver90Days,
    });

    filteredForCounts.forEach((box) => {
      if (box.neighborhood) {
        counts[box.neighborhood] = (counts[box.neighborhood] || 0) + 1;
      }
    });
    return counts;
  }, [serviceBoxes, lastStatus, selectedDistricts, selectedSectors, isOver90Days]);

  // Available sectors based on selected districts and neighborhoods
  const availableSectors = useMemo(() => {
    let list = serviceBoxes;
    if (selectedDistricts.length > 0) {
      list = list.filter((b) => b.district && selectedDistricts.includes(b.district));
    }
    if (selectedNeighborhoods.length > 0) {
      list = list.filter((b) => b.neighborhood && selectedNeighborhoods.includes(b.neighborhood));
    }
    const secs = new Set(
      list
        .map((b) => b.sectorInfo || b.sectorRegionInfo)
        .filter((s): s is string => Boolean(s && s.trim() !== ''))
    );
    return Array.from(secs).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [serviceBoxes, selectedDistricts, selectedNeighborhoods]);

  // Prune selected sectors if they are no longer in availableSectors
  useEffect(() => {
    setSelectedSectors((prev) => {
      const valid = prev.filter((sec) => availableSectors.includes(sec));
      return valid.length === prev.length ? prev : valid;
    });
  }, [availableSectors]);

  // Derive sector counts based on active filters
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const filteredForCounts = filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: selectedDistricts,
      neighborhoods: selectedNeighborhoods,
      sectors: [],
      sort: null,
      over90Days: isOver90Days,
    });

    filteredForCounts.forEach((box) => {
      const sec = box.sectorInfo || box.sectorRegionInfo;
      if (sec) {
        counts[sec] = (counts[sec] || 0) + 1;
      }
    });
    return counts;
  }, [serviceBoxes, lastStatus, selectedDistricts, selectedNeighborhoods, isOver90Days]);

  // Mapping neighborhood to its district for clear contextual display
  const neighborhoodToDistrict = useMemo(() => {
    const map: Record<string, string> = {};
    serviceBoxes.forEach((b) => {
      if (b.neighborhood && b.district && !map[b.neighborhood]) {
        map[b.neighborhood] = b.district;
      }
    });
    return map;
  }, [serviceBoxes]);

  // Available districts specifically present in the available neighborhoods for modal filter chips
  const modalAvailableDistricts = useMemo(() => {
    const dists = new Set(
      availableNeighborhoods.map((nb) => neighborhoodToDistrict[nb]).filter(Boolean)
    );
    return Array.from(dists).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [availableNeighborhoods, neighborhoodToDistrict]);

  // Filtered lists for pop-up modals (supports instant text search, tabs, district filtering and sorting)
  const modalFilteredNeighborhoods = useMemo(() => {
    let list = availableNeighborhoods;
    if (neighborhoodTab === 'SELECTED') {
      list = list.filter((nb) => selectedNeighborhoods.includes(nb));
    } else if (neighborhoodTab === 'UNSELECTED') {
      list = list.filter((nb) => !selectedNeighborhoods.includes(nb));
    }
    if (modalDistrictFilter !== 'ALL') {
      list = list.filter((nb) => neighborhoodToDistrict[nb] === modalDistrictFilter);
    }
    if (neighborhoodSearch.trim()) {
      const q = neighborhoodSearch.trim().toLowerCase();
      list = list.filter((nb) => {
        const dist = neighborhoodToDistrict[nb]?.toLowerCase() || '';
        return nb.toLowerCase().includes(q) || dist.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      if (neighborhoodSort === 'COUNT_DESC') {
        const countDiff = (neighborhoodCounts[b] || 0) - (neighborhoodCounts[a] || 0);
        if (countDiff !== 0) return countDiff;
      }
      return a.localeCompare(b, 'tr');
    });
  }, [availableNeighborhoods, selectedNeighborhoods, neighborhoodTab, modalDistrictFilter, neighborhoodSearch, neighborhoodToDistrict, neighborhoodSort, neighborhoodCounts]);

  const modalFilteredSectors = useMemo(() => {
    let list = availableSectors;
    if (sectorTab === 'SELECTED') {
      list = list.filter((sec) => selectedSectors.includes(sec));
    } else if (sectorTab === 'UNSELECTED') {
      list = list.filter((sec) => !selectedSectors.includes(sec));
    }
    if (sectorSearch.trim()) {
      const q = sectorSearch.trim().toLowerCase();
      list = list.filter((sec) => sec.toLowerCase().includes(q) || formatSector(sec).toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sectorSort === 'COUNT_DESC') {
        const countDiff = (sectorCounts[b] || 0) - (sectorCounts[a] || 0);
        if (countDiff !== 0) return countDiff;
      }
      return a.localeCompare(b, 'tr');
    });
  }, [availableSectors, selectedSectors, sectorTab, sectorSearch, sectorSort, sectorCounts]);

  // Total boxes in currently selected neighborhoods and sectors
  const selectedNeighborhoodsBoxesCount = useMemo(() => {
    return selectedNeighborhoods.reduce((acc, nb) => acc + (neighborhoodCounts[nb] || 0), 0);
  }, [selectedNeighborhoods, neighborhoodCounts]);

  const selectedSectorsBoxesCount = useMemo(() => {
    return selectedSectors.reduce((acc, sec) => acc + (sectorCounts[sec] || 0), 0);
  }, [selectedSectors, sectorCounts]);

  // Items to display on the main screen (shows selected items first or exclusively when in 'SELECTED' view)
  const displayNeighborhoods = useMemo(() => {
    if (selectedNeighborhoods.length === 0) return availableNeighborhoods;
    if (mainNeighborhoodView === 'SELECTED') {
      return availableNeighborhoods.filter((nb) => selectedNeighborhoods.includes(nb));
    }
    const sel = availableNeighborhoods.filter((nb) => selectedNeighborhoods.includes(nb));
    const unsel = availableNeighborhoods.filter((nb) => !selectedNeighborhoods.includes(nb));
    return [...sel, ...unsel];
  }, [availableNeighborhoods, selectedNeighborhoods, mainNeighborhoodView]);

  const displaySectors = useMemo(() => {
    if (selectedSectors.length === 0) return availableSectors;
    if (mainSectorView === 'SELECTED') {
      return availableSectors.filter((sec) => selectedSectors.includes(sec));
    }
    const sel = availableSectors.filter((sec) => selectedSectors.includes(sec));
    const unsel = availableSectors.filter((sec) => !selectedSectors.includes(sec));
    return [...sel, ...unsel];
  }, [availableSectors, selectedSectors, mainSectorView]);

  // Bulk actions for visible items in modals
  const handleSelectVisibleNeighborhoods = () => {
    const toAdd = modalFilteredNeighborhoods.filter((nb) => !selectedNeighborhoods.includes(nb));
    if (toAdd.length > 0) {
      setSelectedNeighborhoods((prev) => [...prev, ...toAdd]);
    }
  };

  const handleDeselectVisibleNeighborhoods = () => {
    setSelectedNeighborhoods((prev) => prev.filter((nb) => !modalFilteredNeighborhoods.includes(nb)));
  };

  const handleSelectVisibleSectors = () => {
    const toAdd = modalFilteredSectors.filter((sec) => !selectedSectors.includes(sec));
    if (toAdd.length > 0) {
      setSelectedSectors((prev) => [...prev, ...toAdd]);
    }
  };

  const handleDeselectVisibleSectors = () => {
    setSelectedSectors((prev) => prev.filter((sec) => !modalFilteredSectors.includes(sec)));
  };

  // Derive final filtered list
  const filteredList = useMemo(() => {
    return filterServiceBoxesForQR(serviceBoxes, {
      lastStatus,
      districts: selectedDistricts,
      neighborhoods: selectedNeighborhoods,
      sectors: selectedSectors,
      sort: sortOrder,
      over90Days: isOver90Days,
    });
  }, [serviceBoxes, lastStatus, selectedDistricts, selectedNeighborhoods, selectedSectors, sortOrder, isOver90Days]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [lastStatus, selectedDistricts, selectedNeighborhoods, selectedSectors, sortOrder, isOver90Days]);

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

  const toggleNeighborhood = (nb: string) => {
    setSelectedNeighborhoods((prev) =>
      prev.includes(nb) ? prev.filter((n) => n !== nb) : [...prev, nb]
    );
  };

  const toggleSector = (sec: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
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
      doc.text(trToAscii(`Son Durum Filtresi: ${lastStatus === 'EMPTY' ? 'Durumu Boş' : lastStatus === 'OTHER' ? 'Durumu Diğer' : 'Tümü'}`), 14, 31);
      doc.text(trToAscii(`Seçili İlçeler: ${selectedDistricts.length > 0 ? selectedDistricts.join(', ') : 'Tümü'}`), 14, 36);
      doc.text(trToAscii(`Seçili Mahalleler: ${selectedNeighborhoods.length > 0 ? selectedNeighborhoods.join(', ') : 'Tümü'}`), 14, 41);
      doc.text(trToAscii(`Seçili Sektörler: ${selectedSectors.length > 0 ? selectedSectors.map((s) => formatSector(s)).join(', ') : 'Tümü'}`), 14, 46);
      doc.text(trToAscii(`Yasal Bekleme Sınırı: ${isOver90Days ? '> 90 Gün (Yasal Aşım)' : 'Tümü'}`), 160, 31);
      doc.text(trToAscii(`Sıralama: ${sortOrder === 'DESC' ? 'Büyükten Küçüğe (En Çok Bekleyen)' : sortOrder === 'ASC' ? 'Küçükten Büyüğe' : 'Standart'}`), 160, 36);

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
        trToAscii(formatSector(box.sectorInfo || box.sectorRegionInfo) || '-'),
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
          neighborhoods: selectedNeighborhoods,
          sectors: selectedSectors,
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


      {/* ══ 2. MAIN WORKFLOW: FILTERS (LEFT) & PREVIEW (RIGHT) ════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">

        {/* ── SOL KOLON: FİLTRELER ── */}
        <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto pr-0.5">

          {/* Filtre Temizleme */}
          {(lastStatus !== null || selectedDistricts.length > 0 || selectedNeighborhoods.length > 0 || selectedSectors.length > 0 || isOver90Days || sortOrder !== 'DESC') && (
            <div className="flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 transition-all"
              >
                <X className="h-3 w-3" />
                Filtreleri Temizle
              </button>
            </div>
          )}

          {/* 1. Son Durum Filtresi */}
          <GlassCard className="shrink-0">
            <CardHeader
              icon={AlertCircle}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              title="1. Son Durum Seçimi"
              action={
                lastStatus !== null ? (
                  <button
                    type="button"
                    onClick={() => setLastStatus(null)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Temizle
                  </button>
                ) : undefined
              }
            />
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLastStatus(lastStatus === "EMPTY" ? null : "EMPTY")}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-between gap-1.5 transition-all ${lastStatus === "EMPTY"
                      ? 'bg-blue-600/25 border-blue-500/60 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-slate-900/60 text-slate-300 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${lastStatus === "EMPTY" ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-amber-400/80'}`} />
                    <span className="truncate">Durumu Boş</span>
                    {lastStatus === "EMPTY" && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
                  </div>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold shrink-0 ${lastStatus === "EMPTY"
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {emptyBoxesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLastStatus(lastStatus === "OTHER" ? null : "OTHER")}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-between gap-1.5 transition-all ${lastStatus === "OTHER"
                      ? 'bg-blue-600/25 border-blue-500/60 text-white shadow-sm ring-1 ring-blue-500/40'
                      : 'bg-slate-900/60 text-slate-300 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${lastStatus === "OTHER" ? 'bg-blue-400 ring-2 ring-blue-400/30' : 'bg-blue-400/80'}`} />
                    <span className="truncate">Durumu Diğer</span>
                    {lastStatus === "OTHER" && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
                  </div>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold shrink-0 ${lastStatus === "OTHER"
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {otherBoxesCount}
                  </span>
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

          {/* 3. Mahalle Seçimi */}
          <GlassCard className="shrink-0">
            <CardHeader
              icon={MapPin}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
              title="3. Mahalle Seçimi"
              onExpand={() => {
                setNeighborhoodSearch('');
                setNeighborhoodTab('ALL');
                setModalDistrictFilter('ALL');
                setNeighborhoodModalOpen(true);
              }}
              expandTooltip="Pop-up ile Genişletilmiş Mahalle Seçimi"
              subtitle={
                selectedNeighborhoods.length > 0
                  ? `${selectedNeighborhoods.length} mahalle seçili (${availableNeighborhoods.length} arasından)`
                  : selectedDistricts.length > 0
                    ? `${selectedDistricts.join(', ')} mahalleleri (${availableNeighborhoods.length})`
                    : `Tüm mahalleler (${availableNeighborhoods.length})`
              }
              action={
                <div className="flex items-center gap-1">
                  {selectedNeighborhoods.length > 0 && (
                    <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setMainNeighborhoodView('SELECTED')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition-all ${mainNeighborhoodView === 'SELECTED'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Seçilenler ({selectedNeighborhoods.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainNeighborhoodView('ALL')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition-all ${mainNeighborhoodView === 'ALL'
                            ? 'bg-slate-700 text-slate-100'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Tümü ({availableNeighborhoods.length})
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedNeighborhoods(availableNeighborhoods)}
                    disabled={availableNeighborhoods.length === 0}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 bg-slate-700/50 border border-slate-600/40 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNeighborhoods([])}
                    disabled={selectedNeighborhoods.length === 0}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              }
            />
            <div className="p-2">
              {availableNeighborhoods.length === 0 ? (
                <div className="py-2.5 text-center text-xs text-slate-500">
                  {selectedDistricts.length > 0
                    ? 'Seçili ilçelere ait mahalle bulunamadı.'
                    : 'Kayıtlı mahalle bulunamadı.'}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {displayNeighborhoods.map((nb) => {
                    const count = neighborhoodCounts[nb] || 0;
                    const isSelected = selectedNeighborhoods.includes(nb);
                    return (
                      <button
                        key={nb}
                        type="button"
                        onClick={() => toggleNeighborhood(nb)}
                        className={`px-1.5 py-1 rounded border text-[10.5px] font-semibold flex items-center justify-between gap-1 transition-all ${isSelected
                            ? 'bg-emerald-600/25 border-emerald-500/50 text-white shadow-sm'
                            : 'bg-slate-900/60 text-slate-300 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                      >
                        <span className="truncate">{nb}</span>
                        <span
                          className={`text-[8.5px] px-1 rounded font-bold shrink-0 ${isSelected
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>

          {/* 4. Sektör Seçimi */}
          <GlassCard className="shrink-0">
            <CardHeader
              icon={Layers}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10"
              title="4. Sektör Seçimi"
              onExpand={() => {
                setSectorSearch('');
                setSectorTab('ALL');
                setSectorModalOpen(true);
              }}
              expandTooltip="Pop-up ile Genişletilmiş Sektör Seçimi"
              subtitle={
                selectedSectors.length > 0
                  ? `${selectedSectors.length} sektör seçili (${availableSectors.length} arasından)`
                  : `Dahil edilecek sektörler (${availableSectors.length})`
              }
              action={
                <div className="flex items-center gap-1">
                  {selectedSectors.length > 0 && (
                    <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setMainSectorView('SELECTED')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition-all ${mainSectorView === 'SELECTED'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Seçilenler ({selectedSectors.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainSectorView('ALL')}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition-all ${mainSectorView === 'ALL'
                            ? 'bg-slate-700 text-slate-100'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Tümü ({availableSectors.length})
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSectors(availableSectors)}
                    disabled={availableSectors.length === 0}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 bg-slate-700/50 border border-slate-600/40 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSectors([])}
                    disabled={selectedSectors.length === 0}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              }
            />
            <div className="p-2">
              {availableSectors.length === 0 ? (
                <div className="py-2.5 text-center text-xs text-slate-500">
                  Seçili kriterlere ait sektör bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {displaySectors.map((sec) => {
                    const count = sectorCounts[sec] || 0;
                    const isSelected = selectedSectors.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSector(sec)}
                        className={`px-1.5 py-1 rounded border text-[10.5px] font-semibold flex items-center justify-between gap-1 transition-all ${isSelected
                            ? 'bg-purple-600/25 border-purple-500/50 text-white shadow-sm'
                            : 'bg-slate-900/60 text-slate-300 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                      >
                        <span className="truncate font-mono text-[10px]">{formatSector(sec)}</span>
                        <span
                          className={`text-[8.5px] px-1 rounded font-bold shrink-0 ${isSelected
                              ? 'bg-purple-500/30 text-purple-200'
                              : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>

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

              {/* Action & Filter Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* SLA Sınırı İkon Butonu */}
                <button
                  type="button"
                  id="sla-filter-btn"
                  onClick={() => setIsOver90Days(!isOver90Days)}
                  title={
                    isOver90Days
                      ? "SLA Aşımı Filtresi Aktif (> 90 Gün) - Kaldırmak için tıklayın"
                      : "SLA Sınırı Filtresi: > 90 Gün Aşanları Filtrele"
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${isOver90Days
                    ? 'bg-rose-500/25 border-rose-500/60 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700/70'
                    }`}
                >
                  <ShieldAlert
                    className={`h-3.5 w-3.5 transition-transform ${isOver90Days ? 'text-rose-400 scale-110' : 'text-slate-400'
                      }`}
                  />
                  <span>&gt; 90 Gün</span>
                  {isOver90Days && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  )}
                </button>

                {/* Sıralama İkon Butonu */}
                <button
                  type="button"
                  id="sort-filter-btn"
                  onClick={() => setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
                  title={`Sıralama: Bekleme Süresi ${sortOrder === 'DESC' ? 'Büyükten Küçüğe (En Çok Bekleyen)' : 'Küçükten Büyüğe (En Az Bekleyen)'
                    } - Değiştirmek için tıklayın`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700/70 transition-all"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-[10px] text-slate-300 font-mono">
                    {sortOrder === 'DESC' ? 'Sıra: Gün ↓' : 'Sıra: Gün ↑'}
                  </span>
                </button>

                {/* Dikey Ayırıcı Çizgi */}
                <div className="h-4 w-px bg-slate-700/60 mx-0.5" />

                {/* PDF İndir */}
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

                {/* Saha Ekibine Gönder */}
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
                          className={`hover:bg-slate-700/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-800/20'
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
                              className={`inline-flex px-1 py-0.2 rounded text-[8.5px] font-bold border ${box.waitingDays >= 90
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
                              className={`inline-flex px-1 py-0.2 rounded text-[8.5px] font-semibold border ${!box.lastStatus
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
                            {formatSector(box.sectorInfo || box.sectorRegionInfo)}
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

      {/* ══ POP-UP: MAHALLE SEÇİMİ ══════════════════════════════════ */}
      <Dialog open={neighborhoodModalOpen} onOpenChange={setNeighborhoodModalOpen}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-700/80 text-slate-100 p-4 sm:p-4.5 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 pb-2 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>Mahalle Seçimi</span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {selectedNeighborhoods.length} / {availableNeighborhoods.length} Seçili
                </span>
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Quick Filter, Search & Sort Toolbar */}
          <div className="shrink-0 pt-2 flex flex-col gap-2">
            {/* Row 1: Search Bar, Sort Toggle & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={neighborhoodSearch}
                  onChange={(e) => setNeighborhoodSearch(e.target.value)}
                  placeholder="Mahalle veya ilçe ara..."
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70 transition-colors"
                />
                {neighborhoodSearch && (
                  <button
                    type="button"
                    onClick={() => setNeighborhoodSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Toggle */}
              <button
                type="button"
                onClick={() => setNeighborhoodSort(neighborhoodSort === 'COUNT_DESC' ? 'ALPHA' : 'COUNT_DESC')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 transition-colors shrink-0"
              >
                {neighborhoodSort === 'COUNT_DESC' ? (
                  <>
                    <ArrowDown10 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Kutu Sayısı</span>
                  </>
                ) : (
                  <>
                    <ArrowDownAZ className="h-3.5 w-3.5 text-emerald-400" />
                    <span>A-Z</span>
                  </>
                )}
              </button>

              {/* Bulk Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectVisibleNeighborhoods}
                  disabled={modalFilteredNeighborhoods.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>Görünenleri Seç</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectVisibleNeighborhoods}
                  disabled={modalFilteredNeighborhoods.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="h-3 w-3" />
                  <span>Bırak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNeighborhoods([])}
                  disabled={selectedNeighborhoods.length === 0}
                  className="px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Row 2: Status Tabs & District Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
              {/* Status Tabs */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNeighborhoodTab('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${neighborhoodTab === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                  Tümü ({availableNeighborhoods.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNeighborhoodTab('SELECTED')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${neighborhoodTab === 'SELECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                  Seçilenler ({selectedNeighborhoods.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNeighborhoodTab('UNSELECTED')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${neighborhoodTab === 'UNSELECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                  Seçili Olmayanlar ({Math.max(0, availableNeighborhoods.length - selectedNeighborhoods.length)})
                </button>
              </div>

              {/* District Filter Chips (if more than 1 district exists) */}
              {modalAvailableDistricts.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setModalDistrictFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-colors ${modalDistrictFilter === 'ALL'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                  >
                    Tüm İlçeler
                  </button>
                  {modalAvailableDistricts.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setModalDistrictFilter(dist)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-colors ${modalDistrictFilter === dist
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mahalle Grid Listesi */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2.5 pr-1 scrollbar-thin">
            {modalFilteredNeighborhoods.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <MapPin className="h-6 w-6 text-slate-600" />
                <span>
                  {neighborhoodSearch
                    ? `"${neighborhoodSearch}" aramasına uygun mahalle bulunamadı.`
                    : 'Kayıt bulunamadı.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                {modalFilteredNeighborhoods.map((nb) => {
                  const count = neighborhoodCounts[nb] || 0;
                  const isSelected = selectedNeighborhoods.includes(nb);
                  const districtName = neighborhoodToDistrict[nb];
                  return (
                    <button
                      key={nb}
                      type="button"
                      onClick={() => toggleNeighborhood(nb)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none group ${isSelected
                          ? 'bg-emerald-950/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50 text-white'
                          : 'bg-slate-800/90 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Checkbox Icon */}
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                              : 'border-slate-500 bg-slate-900 group-hover:border-slate-400'
                            }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>

                        {/* Title and District */}
                        <div className="min-w-0 flex flex-col flex-1">
                          <div className="text-[10.5px] font-bold text-white leading-tight break-words">
                            {nb}
                          </div>
                          {districtName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-slate-300 bg-slate-950/80 px-1 py-0.2 rounded border border-slate-700/60">
                                <Building2 className="w-2 h-2 text-teal-400 shrink-0" />
                                <span>{districtName}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Box Count Badge */}
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold shrink-0 border whitespace-nowrap transition-colors ${isSelected
                            ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50'
                            : 'bg-slate-950 text-slate-300 border-slate-700/80'
                          }`}
                      >
                        {count} Kutu
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span>
                Seçili: <strong className="text-emerald-400 font-bold">{selectedNeighborhoods.length} Mahalle</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>
                Toplam: <strong className="text-emerald-300 font-bold">{selectedNeighborhoodsBoxesCount} Kutu</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNeighborhoodModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setNeighborhoodModalOpen(false)}
                className="px-5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-all"
              >
                Tamamla ({selectedNeighborhoods.length})
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ POP-UP: SEKTÖR SEÇİMİ ══════════════════════════════════ */}
      <Dialog open={sectorModalOpen} onOpenChange={setSectorModalOpen}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-700/80 text-slate-100 p-4 sm:p-4.5 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 pb-2 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <Layers className="h-4 w-4" />
                </div>
                <span>Sektör Seçimi</span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  {selectedSectors.length} / {availableSectors.length} Seçili
                </span>
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Quick Filter, Search & Sort Toolbar */}
          <div className="shrink-0 pt-2 flex flex-col gap-2">
            {/* Row 1: Search Bar, Sort Toggle & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={sectorSearch}
                  onChange={(e) => setSectorSearch(e.target.value)}
                  placeholder="Sektör kodu ara..."
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition-colors font-mono"
                />
                {sectorSearch && (
                  <button
                    type="button"
                    onClick={() => setSectorSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Toggle */}
              <button
                type="button"
                onClick={() => setSectorSort(sectorSort === 'COUNT_DESC' ? 'ALPHA' : 'COUNT_DESC')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 transition-colors shrink-0"
              >
                {sectorSort === 'COUNT_DESC' ? (
                  <>
                    <ArrowDown10 className="h-3.5 w-3.5 text-purple-400" />
                    <span>Kutu Sayısı</span>
                  </>
                ) : (
                  <>
                    <ArrowDownAZ className="h-3.5 w-3.5 text-purple-400" />
                    <span>A-Z</span>
                  </>
                )}
              </button>

              {/* Bulk Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectVisibleSectors}
                  disabled={modalFilteredSectors.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>Görünenleri Seç</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectVisibleSectors}
                  disabled={modalFilteredSectors.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="h-3 w-3" />
                  <span>Bırak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSectors([])}
                  disabled={selectedSectors.length === 0}
                  className="px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Row 2: Status Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setSectorTab('ALL')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${sectorTab === 'ALL'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                Tümü ({availableSectors.length})
              </button>
              <button
                type="button"
                onClick={() => setSectorTab('SELECTED')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${sectorTab === 'SELECTED'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                Seçilenler ({selectedSectors.length})
              </button>
              <button
                type="button"
                onClick={() => setSectorTab('UNSELECTED')}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all ${sectorTab === 'UNSELECTED'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                Seçili Olmayanlar ({Math.max(0, availableSectors.length - selectedSectors.length)})
              </button>
            </div>
          </div>

          {/* Sektör Grid Listesi */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2.5 pr-1 scrollbar-thin">
            {modalFilteredSectors.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Layers className="h-6 w-6 text-slate-600" />
                <span>
                  {sectorSearch
                    ? `"${sectorSearch}" aramasına uygun sektör bulunamadı.`
                    : 'Kayıt bulunamadı.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                {modalFilteredSectors.map((sec) => {
                  const count = sectorCounts[sec] || 0;
                  const isSelected = selectedSectors.includes(sec);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => toggleSector(sec)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer select-none group ${isSelected
                          ? 'bg-purple-950/70 border-purple-500 shadow-sm ring-1 ring-purple-500/50 text-white'
                          : 'bg-slate-800/90 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Checkbox Icon */}
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected
                              ? 'bg-purple-500 border-purple-400 text-white shadow-sm'
                              : 'border-slate-500 bg-slate-900 group-hover:border-slate-400'
                            }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>

                        {/* Title (Only Sector Code, stripped of 072200) */}
                        <span className="text-[10.5px] font-mono font-bold text-white tracking-tight break-all">
                          {formatSector(sec)}
                        </span>
                      </div>

                      {/* Count Badge */}
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold shrink-0 border whitespace-nowrap transition-colors ${isSelected
                            ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                            : 'bg-slate-950 text-slate-300 border-slate-700/80'
                          }`}
                      >
                        {count} Kutu
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span>
                Seçili: <strong className="text-purple-400 font-bold">{selectedSectors.length} Sektör</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>
                Toplam: <strong className="text-purple-300 font-bold">{selectedSectorsBoxesCount} Kutu</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectorModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setSectorModalOpen(false)}
                className="px-5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all"
              >
                Tamamla ({selectedSectors.length})
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
