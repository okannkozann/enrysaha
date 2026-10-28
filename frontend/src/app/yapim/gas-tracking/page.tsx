'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  GasSector,
  PaftaStatus,
  GasStatus,
  GasStreetDetail,
  GasConnectionObjectDetail,
} from '@/types';
import { gasTrackingService } from '@/lib/services/gasTrackingService';
import { GasTrackingTable } from '@/components/gas-tracking/GasTrackingTable';
import { CriticalBnoTable } from '@/components/gas-tracking/CriticalBnoTable';
import { NewSectorModal } from '@/components/gas-tracking/NewSectorModal';
import {
  Flame,
  Search,
  CheckCircle2,
  Plus,
  RefreshCw,
  X,
  ShieldAlert,
  Layers,
  ListFilter,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type StatusFilterChip = 'ALL' | 'PAFTA_BEKLEYENLER' | 'GAZLAMAYA_HAZIR' | 'GAZLANDI' | 'CRITICAL_90_DAYS';
type ViewMode = 'SECTORS' | 'CRITICAL_BNOS';

export default function GasTrackingPage() {
  const { toast } = useToast();
  const [sectors, setSectors] = useState<GasSector[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: Sector Operation Table vs 90-Day Legal Compliance BNO View
  const [viewMode, setViewMode] = useState<ViewMode>('SECTORS');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('ALL');
  const [activeChip, setActiveChip] = useState<StatusFilterChip>('ALL');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isNewSectorModalOpen, setIsNewSectorModalOpen] = useState(false);

  // Load sectors
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await gasTrackingService.getSectors();
      setSectors(data);
    } catch (err) {
      console.error('Error loading gas sectors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct Districts & Neighborhoods
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    sectors.forEach((s) => {
      if (s.district) set.add(s.district);
    });
    return Array.from(set).sort();
  }, [sectors]);

  const availableNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    sectors.forEach((s) => {
      if (selectedDistrict === 'ALL' || s.district === selectedDistrict) {
        if (s.neighborhood) set.add(s.neighborhood);
      }
    });
    return Array.from(set).sort();
  }, [sectors, selectedDistrict]);

  // Aggregate all 90-day critical connection objects across sectors
  const allCriticalBnos = useMemo(() => {
    const list: GasConnectionObjectDetail[] = [];
    sectors.forEach((sec) => {
      if (sec.criticalBnos && sec.criticalBnos.length > 0) {
        list.push(...sec.criticalBnos);
      }
    });
    return list.filter((b) => {
      if (selectedDistrict !== 'ALL' && b.district !== selectedDistrict) return false;
      if (selectedNeighborhood !== 'ALL' && b.neighborhood !== selectedNeighborhood) return false;
      return true;
    }).sort((a, b) => b.waitingDays - a.waitingDays);
  }, [sectors, selectedDistrict, selectedNeighborhood]);

  const totalCriticalBnosCount = allCriticalBnos.length;
  const totalOverdueBnosCount = allCriticalBnos.filter((b) => b.waitingDays >= 90).length;

  // Status Filter Counts for Top Bar Chips
  const counts = useMemo(() => {
    let paftaBekleyenler = 0;
    let gazlamayaHazir = 0;
    let gazlandi = 0;
    let critical90DaysSectors = 0;

    sectors.forEach((s) => {
      if (s.paftaStatus === 'Bekliyor') paftaBekleyenler++;
      if (s.paftaStatus === 'Hazır' && s.gasStatus === 'Gazlama Öncesi / Hazırlık') gazlamayaHazir++;
      if (s.gasStatus === 'Gazlandı') gazlandi++;
      if ((s.criticalSlaCount && s.criticalSlaCount > 0) || (s.overdueSlaCount && s.overdueSlaCount > 0)) {
        critical90DaysSectors++;
      }
    });

    return {
      all: sectors.length,
      paftaBekleyenler,
      gazlamayaHazir,
      gazlandi,
      critical90DaysSectors,
    };
  }, [sectors]);

  // Filtered dataset for sectors
  const filteredSectors = useMemo(() => {
    return sectors.filter((sector) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = sector.sectorCode.toLowerCase().includes(q);
        const matchesName = sector.sectorName?.toLowerCase().includes(q);
        const matchesDistrict = sector.district.toLowerCase().includes(q);
        const matchesNeighborhood = sector.neighborhood.toLowerCase().includes(q);
        const matchesStreet = sector.streets.some(
          (st) =>
            st.streetName.toLowerCase().includes(q) ||
            st.connectionObjects.some((bno) => bno.toLowerCase().includes(q))
        );

        if (!matchesCode && !matchesName && !matchesDistrict && !matchesNeighborhood && !matchesStreet) {
          return false;
        }
      }

      // 2. District Filter
      if (selectedDistrict !== 'ALL' && sector.district !== selectedDistrict) {
        return false;
      }

      // 3. Neighborhood Filter
      if (selectedNeighborhood !== 'ALL' && sector.neighborhood !== selectedNeighborhood) {
        return false;
      }

      // 4. Status Filter Chips
      if (activeChip === 'PAFTA_BEKLEYENLER' && sector.paftaStatus !== 'Bekliyor') {
        return false;
      }
      if (
        activeChip === 'GAZLAMAYA_HAZIR' &&
        !(sector.paftaStatus === 'Hazır' && sector.gasStatus === 'Gazlama Öncesi / Hazırlık')
      ) {
        return false;
      }
      if (activeChip === 'GAZLANDI' && sector.gasStatus !== 'Gazlandı') {
        return false;
      }
      if (activeChip === 'CRITICAL_90_DAYS') {
        const hasCritical = (sector.criticalSlaCount && sector.criticalSlaCount > 0) || (sector.overdueSlaCount && sector.overdueSlaCount > 0);
        if (!hasCritical) return false;
      }

      return true;
    });
  }, [sectors, searchQuery, selectedDistrict, selectedNeighborhood, activeChip]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSectors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSectors.map((s) => s.id));
    }
  };

  // Status Updaters
  const handleUpdatePafta = async (id: string, paftaStatus: PaftaStatus) => {
    await gasTrackingService.updateSectorPaftaStatus(id, paftaStatus);
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, paftaStatus } : s))
    );
    toast({
      title: 'Pafta Durumu Güncellendi',
      description: `Durum: ${paftaStatus}`,
    });
  };

  const handleUpdateGasStatus = async (id: string, gasStatus: GasStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    await gasTrackingService.updateSectorGasStatus(id, gasStatus);
    setSectors((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
            ...s,
            gasStatus,
            actualGasDate: gasStatus === 'Gazlandı' ? today : undefined,
          }
          : s
      )
    );
    toast({
      title: 'Gazlama Durumu Güncellendi',
      description: `Durum: ${gasStatus}`,
    });
  };

  const handleUpdateTargetDate = async (
    id: string,
    targetDate: string,
    notes?: string,
    gasStatus?: GasStatus
  ) => {
    await gasTrackingService.updateSectorTargetDate(id, targetDate, notes);
    if (gasStatus) {
      await gasTrackingService.updateSectorGasStatus(id, gasStatus);
    }
    setSectors((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
            ...s,
            targetDate,
            ...(notes !== undefined ? { notes } : {}),
            ...(gasStatus ? { gasStatus } : {}),
            ...(gasStatus === 'Gazlandı'
              ? { actualGasDate: new Date().toISOString().slice(0, 10) }
              : {}),
          }
          : s
      )
    );
  };

  // Bulk Gas-in Action
  const handleBulkGaslandi = async () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    const today = new Date().toISOString().slice(0, 10);

    await gasTrackingService.bulkUpdateGasStatus(selectedIds, 'Gazlandı', today);
    setSectors((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.id)
          ? { ...s, gasStatus: 'Gazlandı', actualGasDate: today }
          : s
      )
    );
    setSelectedIds([]);

    toast({
      title: 'Toplu Gazlama Tamamlandı',
      description: `${count} sektör başarıyla "Gazlandı" olarak işaretlendi.`,
    });
  };

  const handleToggleStreetWork = async (sectorId: string, streetId: string) => {
    const updated = await gasTrackingService.toggleStreetWorkStatus(sectorId, streetId);
    if (updated) {
      setSectors((prev) => prev.map((s) => (s.id === sectorId ? updated : s)));
    }
  };

  const handleToggleStreetGas = async (sectorId: string, streetId: string) => {
    const updated = await gasTrackingService.toggleStreetGasStatus(sectorId, streetId);
    if (updated) {
      setSectors((prev) => prev.map((s) => (s.id === sectorId ? updated : s)));
      const street = updated.streets.find((st) => st.id === streetId);
      toast({
        title: 'Cadde/Sokak Gaz Durumu Güncellendi',
        description: `${street?.streetName || 'Cadde'}: ${street?.gasStatus || 'Güncellendi'}`,
      });
    }
  };

  const handleAddStreet = async (sectorId: string, street: Omit<GasStreetDetail, 'id'>) => {
    const updated = await gasTrackingService.addStreetToSector(sectorId, street);
    if (updated) {
      setSectors((prev) => prev.map((s) => (s.id === sectorId ? updated : s)));
      toast({
        title: 'Sokak Eklendi',
        description: street.streetName,
      });
    }
  };

  const handleAddSector = async (
    newSectorData: Omit<GasSector, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const created = await gasTrackingService.addSector(newSectorData);
    setSectors((prev) => [created, ...prev]);
    toast({
      title: 'Gazlama Bölgesi Eklendi',
      description: `${created.sectorCode} - ${created.neighborhood}`,
    });
  };

  const handleDeleteSector = async (id: string) => {
    if (confirm('Bu gazlama bölgesini silmek istediğinize emin misiniz?')) {
      await gasTrackingService.deleteSector(id);
      setSectors((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      toast({
        title: 'Bölge Silindi',
      });
    }
  };

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 p-2 sm:p-3 gap-2">
      {/* ── TEK VE ENTEGRE ÜST KONTROL BARI (FILTERS + CHIPS + ACTIONS) ── */}
      <div className="shrink-0 bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">

        {/* Sol Alan: Başlık & Hızlı Arama & İlçe/Mahalle Dropdown */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 shrink-0 pr-1 border-r border-slate-800">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight leading-none flex items-center gap-1.5">
                Gazlama Takip Modülü
                <span className="text-[9.5px] font-bold text-orange-400 px-1.5 py-0.2 rounded-full bg-orange-500/15 border border-orange-500/30">
                  Operasyon
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[150px] sm:min-w-[190px] flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sektör, mahalle, BNO ara..."
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* İlçe Filtresi */}
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedNeighborhood('ALL');
            }}
            className="bg-slate-950/80 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="ALL">Tüm İlçeler ({availableDistricts.length})</option>
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Mahalle Filtresi */}
          <select
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium max-w-[130px] truncate"
          >
            <option value="ALL">Tüm Mahalleler</option>
            {availableNeighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Orta Alan: Kompakt Durum Toggle Chip'leri */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 xl:pb-0 scrollbar-none select-none">
          {/* Tümü Chip */}
          <button
            type="button"
            onClick={() => setActiveChip('ALL')}
            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${activeChip === 'ALL'
              ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm ring-1 ring-blue-500/40'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <span>Tümü</span>
            <span className="text-[9.5px] px-1 rounded font-extrabold bg-slate-800 text-slate-300">
              {counts.all}
            </span>
          </button>



          {/* Gazlamaya Hazır */}
          <button
            type="button"
            onClick={() => setActiveChip(activeChip === 'GAZLAMAYA_HAZIR' ? 'ALL' : 'GAZLAMAYA_HAZIR')}
            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${activeChip === 'GAZLAMAYA_HAZIR'
              ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm ring-1 ring-cyan-500/40'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-cyan-300 hover:bg-slate-800/60'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Gazlamaya Hazır</span>
            <span className="text-[9.5px] px-1 rounded font-extrabold bg-slate-800 text-slate-300">
              {counts.gazlamayaHazir}
            </span>
          </button>

          {/* Gazlandı */}
          <button
            type="button"
            onClick={() => setActiveChip(activeChip === 'GAZLANDI' ? 'ALL' : 'GAZLANDI')}
            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${activeChip === 'GAZLANDI'
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-sm ring-1 ring-emerald-500/40'
              : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-emerald-300 hover:bg-slate-800/60'
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Gazlandı</span>
            <span className="text-[9.5px] px-1 rounded font-extrabold bg-slate-800 text-slate-300">
              {counts.gazlandi}
            </span>
          </button>

          {/* 90 GÜNE YAKLAŞANLAR (YASAL MEVZUAT SLA CHIP) */}
          <button
            type="button"
            onClick={() => setActiveChip(activeChip === 'CRITICAL_90_DAYS' ? 'ALL' : 'CRITICAL_90_DAYS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeChip === 'CRITICAL_90_DAYS'
              ? 'bg-red-600/35 border-red-500 text-red-200 shadow-sm ring-1 ring-red-500/50'
              : 'bg-red-950/40 text-red-300 border-red-800/60 hover:bg-red-900/30'
              }`}
            title="Bağlantı anlaşması tarihinden itibaren 90 güne yaklaşan veya süresi dolan bağlantı nesneleri"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>90 Güne Yaklaşan</span>
            <span
              className={`text-[9.5px] px-1.5 py-0.2 rounded font-black ${totalOverdueBnosCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500/30 text-red-200'
                }`}
            >
              {totalCriticalBnosCount} BNO
            </span>
          </button>
        </div>

        {/* Sağ Alan: Görünüm Değiştirici & Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Görünüm Değiştirici (Sektör Tablosu vs 90 Gün BNO Listesi) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('SECTORS')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'SECTORS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sektörler</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CRITICAL_BNOS')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'CRITICAL_BNOS'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                }`}
              title="90 Gün Yasal Süre Takip Listesi (BNO Bazlı Detay)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>90 Gün BNO Takibi</span>
              {totalCriticalBnosCount > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-white/25 text-white font-black">
                  {totalCriticalBnosCount}
                </span>
              )}
            </button>
          </div>



        </div>
      </div>

      {/* ── ANA İÇERİK ALANI (SEKTÖRLER VEYA 90 GÜN BNO LİSTESİ) ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewMode === 'SECTORS' ? (
          <GasTrackingTable
            sectors={filteredSectors}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onUpdatePafta={handleUpdatePafta}
            onUpdateGasStatus={handleUpdateGasStatus}
            onUpdateTargetDate={handleUpdateTargetDate}
            onToggleStreetWork={handleToggleStreetWork}
            onToggleStreetGas={handleToggleStreetGas}
            onAddStreet={handleAddStreet}
            onDeleteSector={handleDeleteSector}
          />
        ) : (
          <CriticalBnoTable
            bnos={allCriticalBnos}
            onPlanSector={(sectorCode) => {
              // Switch to sectors view with filter or handle
              setViewMode('SECTORS');
              setSearchQuery(sectorCode);
            }}
            onGasSector={async (sectorCode) => {
              await handleUpdateGasStatus(sectorCode, 'Gazlandı');
              toast({
                title: 'Sektör Gazlandı',
                description: `${sectorCode} başarıyla devreye alındı.`,
              });
            }}
          />
        )}
      </div>


    </div>
  );
}
