'use client';

import { useState, Fragment } from 'react';
import {
  GasSector,
  PaftaStatus,
  GasStatus,
  GasStreetDetail,
  StreetWorkStatus,
  GasConnectionObjectDetail,
} from '@/types';
import { BnoDetailModal } from './BnoDetailModal';
import {
  ChevronRight,
  ChevronDown,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  Layers,
  Calendar,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  sectors: GasSector[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUpdatePafta: (id: string, status: PaftaStatus) => void;
  onUpdateGasStatus: (id: string, status: GasStatus) => void;
  onUpdateTargetDate?: (id: string, targetDate: string, notes?: string, gasStatus?: GasStatus) => void;
  onToggleStreetWork: (sectorId: string, streetId: string) => void;
  onToggleStreetGas?: (sectorId: string, streetId: string) => void;
  onAddStreet: (sectorId: string, street: Omit<GasStreetDetail, 'id'>) => void;
  onDeleteSector: (id: string) => void;
}

export function GasTrackingTable({
  sectors,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onUpdatePafta,
  onUpdateGasStatus,
  onUpdateTargetDate,
  onToggleStreetWork,
  onToggleStreetGas,
  onAddStreet,
  onDeleteSector,
}: Props) {
  const { toast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedBnoDetail, setSelectedBnoDetail] = useState<GasConnectionObjectDetail | null>(null);

  // Inline dropdown state for Pafta
  const [openPaftaDropdownId, setOpenPaftaDropdownId] = useState<string | null>(null);

  // Planning Modal State
  const [planningSector, setPlanningSector] = useState<GasSector | null>(null);
  const [planDateInput, setPlanDateInput] = useState('');
  const [planStatusInput, setPlanStatusInput] = useState<GasStatus>('Gazlama Öncesi / Hazırlık');
  const [planNotesInput, setPlanNotesInput] = useState('');

  // Quick street add form inside expanded row
  const [addingStreetForSectorId, setAddingStreetForSectorId] = useState<string | null>(null);
  const [newStreetName, setNewStreetName] = useState('');
  const [newStreetBnos, setNewStreetBnos] = useState('');
  const [newStreetStatus, setNewStreetStatus] = useState<StreetWorkStatus>('Tamam');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBno(text);
    toast({
      title: 'Kopyalandı',
      description: `Bağlantı nesnesi: ${text}`,
    });
    setTimeout(() => setCopiedBno(null), 1500);
  };

  const openPlanModal = (sector: GasSector) => {
    setPlanningSector(sector);
    setPlanDateInput(sector.targetDate || new Date().toISOString().slice(0, 10));
    setPlanStatusInput(sector.gasStatus === 'Gazlandı' ? 'Gazlama Öncesi / Hazırlık' : sector.gasStatus);
    setPlanNotesInput(sector.notes || '');
  };

  const handleSavePlan = () => {
    if (!planningSector) return;
    if (!planDateInput.trim()) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen hedeflenen gazlama tarihini girin.',
      });
      return;
    }

    if (onUpdateTargetDate) {
      onUpdateTargetDate(planningSector.id, planDateInput, planNotesInput, planStatusInput);
    } else {
      onUpdateGasStatus(planningSector.id, planStatusInput);
    }

    toast({
      title: 'Planlama Kaydedildi',
      description: `${planningSector.sectorCode} için hedef tarih: ${planDateInput}`,
    });
    setPlanningSector(null);
  };

  const handleInlineAddStreet = (sectorId: string) => {
    if (!newStreetName.trim()) return;
    const bnos = newStreetBnos
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    onAddStreet(sectorId, {
      streetName: newStreetName.trim(),
      connectionObjects: bnos,
      boxCount: bnos.length || 1,
      workStatus: newStreetStatus,
    });

    setNewStreetName('');
    setNewStreetBnos('');
    setAddingStreetForSectorId(null);
  };

  const isAllSelected = sectors.length > 0 && selectedIds.length === sectors.length;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Scrollable Container with NO horizontal scrollbar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          {/* Column definitions to guarantee 100% fit without horizontal overflow */}
          <colgroup>
            <col className="w-9" />
            <col className="w-8" />
            <col className="w-36" />
            <col className="w-44" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-28" />
          </colgroup>

          {/* Header Row */}
          <thead className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 select-none">
            <tr>
              <th className="py-2.5 px-2 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3.5 h-3.5 cursor-pointer align-middle"
                />
              </th>
              <th className="py-2.5 px-1 text-center"></th>
              <th className="py-2.5 px-3">Sektör Kodu</th>
              <th className="py-2.5 px-3">İlçe / Mahalle</th>
              <th className="py-2.5 px-2 text-center">Kapsam (Bina / BNO)</th>
              <th className="py-2.5 px-2 text-center">Pafta Durumu</th>
              <th className="py-2.5 px-2 text-center">Gazlama Durumu</th>
              <th className="py-2.5 px-3">Tarih</th>
              <th className="py-2.5 px-3 text-right">Hızlı İşlem</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {sectors.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Flame className="w-6 h-6 text-slate-600" />
                    <span>Filtrelere uygun gazlama bölgesi bulunamadı.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sectors.map((sector) => {
                const isExpanded = !!expandedIds[sector.id];
                const isSelected = selectedIds.includes(sector.id);
                const isGazlandi = sector.gasStatus === 'Gazlandı';

                // Calculate street stats
                const totalStreets = sector.streets.length;
                const completedStreets = sector.streets.filter((s) => s.workStatus === 'Tamam').length;

                return (
                  <Fragment key={sector.id}>
                    {/* Main Row */}
                    <tr
                      className={`transition-colors duration-150 ${isSelected
                          ? 'bg-blue-600/10'
                          : isExpanded
                            ? 'bg-slate-800/60'
                            : 'hover:bg-slate-800/40 bg-slate-900/40'
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(sector.id)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3.5 h-3.5 cursor-pointer align-middle"
                        />
                      </td>

                      {/* Expand Chevron */}
                      <td className="py-2.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExpand(sector.id)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                          title={isExpanded ? 'Detayları Kapat' : 'Sokak Kırılımını Aç'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Sektör Kodu (Sadece Sektör Kodu - Mahalle bilgisi kaldırıldı) */}
                      <td className="py-2.5 px-3 truncate">
                        <span className="font-mono font-bold text-slate-100 tracking-tight text-[12px] truncate block" title={sector.sectorCode}>
                          {sector.sectorCode}
                        </span>
                      </td>

                      {/* İlçe / Mahalle */}
                      <td className="py-2.5 px-3 truncate">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate" title={`${sector.district} / ${sector.neighborhood} Mah.`}>
                          <span className="font-semibold text-white truncate">{sector.district}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-300 truncate">{sector.neighborhood} Mah.</span>
                        </div>
                      </td>

                      {/* Kapsam (Bina / BNO) & 90 Gün Yasal Süre Uyarısı */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10.5px] font-semibold text-slate-200">
                            <span className="text-blue-400 font-bold">{sector.totalConnectionObjects} BNO</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{sector.buildingCount} Bina</span>
                          </div>

                          {/* 90 Gün Yasal Mevzuat SLA Uyarısı */}
                          {sector.gasStatus !== 'Gazlandı' && sector.overdueSlaCount && sector.overdueSlaCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-red-600/25 text-red-300 border border-red-500/50 animate-pulse"
                              title="Yasal 90 günlük süresi dolan bağlantı nesnesi bulunmaktadır!"
                            >
                              🚨 {sector.overdueSlaCount} BNO (90+g Aşıldı!)
                            </span>
                          ) : sector.gasStatus !== 'Gazlandı' && sector.criticalSlaCount && sector.criticalSlaCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              title={`90 güne yaklaşan bağlantı nesnesi var (Maks: ${sector.maxWaitingDays} gün)`}
                            >
                              ⚠️ {sector.criticalSlaCount} BNO ({sector.maxWaitingDays}g)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Pafta Durumu (Inline Dropdown) */}
                      <td className="py-2.5 px-2 text-center relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenPaftaDropdownId(
                                openPaftaDropdownId === sector.id ? null : sector.id
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${sector.paftaStatus === 'Hazır'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 hover:bg-cyan-500/25'
                                : sector.paftaStatus === 'Bekliyor'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                                  : 'bg-purple-500/15 text-purple-300 border-purple-500/35 hover:bg-purple-500/25'
                              }`}
                            title="Pafta Durumunu Değiştir"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${sector.paftaStatus === 'Hazır'
                                  ? 'bg-cyan-400'
                                  : sector.paftaStatus === 'Bekliyor'
                                    ? 'bg-amber-400'
                                    : 'bg-purple-400'
                                }`}
                            />
                            {sector.paftaStatus}
                            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                          </button>

                          {openPaftaDropdownId === sector.id && (
                            <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-28 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-30">
                              {(['Hazır', 'Bekliyor', 'Revizyon'] as PaftaStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    onUpdatePafta(sector.id, st);
                                    setOpenPaftaDropdownId(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1 text-[10px] font-semibold flex items-center justify-between hover:bg-slate-800 ${sector.paftaStatus === st ? 'text-blue-400' : 'text-slate-300'
                                    }`}
                                >
                                  {st}
                                  {sector.paftaStatus === st && <Check className="w-3 h-3 text-blue-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Gazlama Durumu: Gazlandı ise Badge, Gazlandı Değilse "Planla" Pop-up Butonu */}
                      <td className="py-2.5 px-2 text-center">
                        {isGazlandi ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                            title="Gazlandı"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Gazlandı</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPlanModal(sector)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all cursor-pointer shadow-sm group hover:border-amber-400 active:scale-95"
                            title="Hedef Gazlama Tarihi Belirle ve Planla"
                          >
                            <Calendar className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span>Planla</span>
                          </button>
                        )}
                      </td>

                      {/* Tarih */}
                      <td className="py-2.5 px-3 truncate">
                        {isGazlandi && sector.actualGasDate ? (
                          <div className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-400 truncate" title={`Gazlandı: ${sector.actualGasDate}`}>
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">Gazlandı: {sector.actualGasDate}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium truncate" title={`Hedef: ${sector.targetDate || 'Belirtilmedi'}`}>
                            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">Hedef: {sector.targetDate || '-'}</span>
                          </div>
                        )}
                      </td>

                      {/* Hızlı İşlem Butonları */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isGazlandi ? (
                            <button
                              type="button"
                              onClick={() => onUpdateGasStatus(sector.id, 'Gazlama Öncesi / Hazırlık')}
                              title="Gazlama Durumunu Geri Al (Hazırlığa Çek)"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              Geri Al
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpdateGasStatus(sector.id, 'Gazlandı')}
                              title="Tek Tıkla Gazlandı Olarak İşaretle"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                            >
                              <Flame className="w-3 h-3" />
                              Gazlandı Yap
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteSector(sector.id)}
                            title="Sektörü Sil"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Drawer / Nested Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-t border-b border-slate-800/80">
                        <td colSpan={9} className="p-3">
                          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2.5 shadow-inner">
                            {/* Drawer Sub-Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-400" />
                                <span className="text-[11.5px] font-bold text-slate-200">
                                  Cadde & Sokak İmalat Kırılımı
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({totalStreets} Sokak • {completedStreets}/{totalStreets} İmalatı Tamamlandı)
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddingStreetForSectorId(
                                      addingStreetForSectorId === sector.id ? null : sector.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Sokak Ekle
                                </button>
                              </div>
                            </div>

                            {/* Inline Add Street Row */}
                            {addingStreetForSectorId === sector.id && (
                              <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-950/90 border border-blue-500/30 rounded-lg animate-in fade-in duration-150">
                                <div className="col-span-5">
                                  <input
                                    placeholder="Cadde / Sokak adı (örn: 3204. Sokak)"
                                    value={newStreetName}
                                    onChange={(e) => setNewStreetName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-[11px]"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    placeholder="BNO listesi (örn: 701045, 701046)"
                                    value={newStreetBnos}
                                    onChange={(e) => setNewStreetBnos(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-[11px]"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <select
                                    value={newStreetStatus}
                                    onChange={(e) => setNewStreetStatus(e.target.value as StreetWorkStatus)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-[11px]"
                                  >
                                    <option value="Tamam">Tamam</option>
                                    <option value="Eksik">Eksik</option>
                                  </select>
                                </div>
                                <div className="col-span-1 flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInlineAddStreet(sector.id)}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                                  >
                                    Ekle
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 90 Gün Yasal Mevzuat Uyarısı Banner */}
                            {sector.gasStatus !== 'Gazlandı' && sector.criticalBnos && sector.criticalBnos.length > 0 && (
                              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="text-[11px] text-amber-200">
                                    <strong className="font-bold text-amber-300">Yasal 90 Gün Uyarısı:</strong> Bu sektörde yasal 90 günlük süreye yaklaşan veya aşan{' '}
                                    <strong className="underline">{sector.criticalBnos.length} adet bağlantı nesnesi</strong> bulunmaktadır (Maks. bekleme: {sector.maxWaitingDays} gün). Yasal yaptırım ve abone mağduriyetini önlemek amacıyla gazlama önceliklendirilmelidir.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openPlanModal(sector)}
                                  className="shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10.5px] transition-colors cursor-pointer"
                                >
                                  Tarih Planla
                                </button>
                              </div>
                            )}

                            {/* Streets Table - No horizontal scrollbar */}
                            {sector.streets.length === 0 ? (
                              <div className="text-center py-3 text-slate-500 text-[11px]">
                                Bu sektöre ait sokak kaydı bulunmuyor.
                              </div>
                            ) : (
                              <div className="rounded border border-slate-800 overflow-hidden">
                                <table className="w-full table-fixed text-[11px] text-left">
                                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                    <tr>
                                      <th className="py-1.5 px-2 text-center w-8">#</th>
                                      <th className="py-1.5 px-3 w-40">Cadde / Sokak Adı</th>
                                      <th className="py-1.5 px-2.5 text-center w-28">İmalat Durumu</th>
                                      <th className="py-1.5 px-2.5 text-center w-28">Cadde Gaz Durumu</th>
                                      <th className="py-1.5 px-2 text-center w-20">BNO Sayısı</th>
                                      <th className="py-1.5 px-3">Bağlantı Nesneleri (Tıkla & Detay Gör)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                                    {sector.streets.map((street, idx) => (
                                      <tr key={street.id} className="hover:bg-slate-900/60">
                                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[10px]">
                                          {idx + 1}
                                        </td>
                                        <td className="py-1.5 px-3 font-semibold text-slate-200 truncate" title={street.streetName}>
                                          {street.streetName}
                                        </td>
                                        <td className="py-1.5 px-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => onToggleStreetWork(sector.id, street.id)}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                              street.workStatus === 'Tamam'
                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                                : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
                                            }`}
                                            title="İmalat Durumunu Değiştirmek İçin Tıklayın"
                                          >
                                            {street.workStatus === 'Tamam' ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <AlertTriangle className="w-3 h-3 text-red-400" />
                                            )}
                                            {street.workStatus}
                                          </button>
                                        </td>

                                        {/* Cadde Gaz Durumu (Sektörden bağımsız cadde/sokak gazlama) */}
                                        <td className="py-1.5 px-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => onToggleStreetGas?.(sector.id, street.id)}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                              street.gasStatus === 'Gazlandı'
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                                : 'bg-orange-500/15 text-orange-300 border-orange-500/35 hover:bg-orange-500/25'
                                            }`}
                                            title="Cadde/Sokak Gaz Durumunu Değiştirmek İçin Tıklayın"
                                          >
                                            {street.gasStatus === 'Gazlandı' ? (
                                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Flame className="w-3 h-3 text-orange-400" />
                                            )}
                                            <span>{street.gasStatus === 'Gazlandı' ? 'Gazlandı' : 'Gaz Bekliyor'}</span>
                                          </button>
                                        </td>

                                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-300">
                                          {street.boxCount || street.connectionObjects.length}
                                        </td>
                                        <td className="py-1.5 px-3">
                                          <div className="flex flex-wrap items-center gap-1 max-w-full">
                                            {street.connectionObjects.length === 0 ? (
                                              <span className="text-slate-500 text-[10px]">
                                                BNO listesi girilmemiş
                                              </span>
                                            ) : (
                                              street.connectionObjects.map((bno) => {
                                                const detail = street.connectionDetails?.find((d) => d.connectionObject === bno);
                                                const isOverdue = detail?.isOverdue;
                                                const isCritical = detail?.isCritical;

                                                return (
                                                  <button
                                                    key={bno}
                                                    type="button"
                                                    onClick={() => {
                                                      if (detail) {
                                                        setSelectedBnoDetail(detail);
                                                      } else {
                                                        setSelectedBnoDetail({
                                                          connectionObject: bno,
                                                          agreementDate: '2026-09-01',
                                                          waitingDays: 15,
                                                          remainingDays: 75,
                                                          boxStatus: 'Boş',
                                                          isStatusEmpty: true,
                                                          isBoxInstalled: false,
                                                          isGasGiven: street.gasStatus === 'Gazlandı',
                                                          isCritical: false,
                                                          isOverdue: false,
                                                          streetGasStatus: street.gasStatus,
                                                          sectorGasStatus: sector.gasStatus,
                                                          address: `${sector.neighborhood} Mah. ${street.streetName}`,
                                                          streetName: street.streetName,
                                                          sectorCode: sector.sectorCode,
                                                          district: sector.district,
                                                          neighborhood: sector.neighborhood,
                                                        });
                                                      }
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10.5px] border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                                      isOverdue
                                                        ? 'bg-red-950/80 text-red-200 border-red-500/70 hover:bg-red-900 font-extrabold animate-pulse'
                                                        : isCritical
                                                        ? 'bg-amber-950/70 text-amber-200 border-amber-500/60 hover:bg-amber-900 font-bold'
                                                        : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:border-blue-400 hover:text-white'
                                                    }`}
                                                    title="Detaylı bilgileri görüntülemek için tıklayın"
                                                  >
                                                    {isOverdue && <span className="text-[9px]">🚨</span>}
                                                    {!isOverdue && isCritical && <span className="text-[9px]">⚠️</span>}
                                                    <span>{bno}</span>
                                                    {detail && (
                                                      <span
                                                        className={`text-[8.5px] px-1 rounded font-bold ${
                                                          isOverdue
                                                            ? 'bg-red-500/30 text-red-100'
                                                            : isCritical
                                                            ? 'bg-amber-500/30 text-amber-100'
                                                            : 'text-slate-500'
                                                        }`}
                                                      >
                                                        {detail.waitingDays}g
                                                      </span>
                                                    )}
                                                  </button>
                                                );
                                              })
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Sector Operational Notes */}
                            {sector.notes && (
                              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10.5px] text-slate-300 flex items-start gap-1.5">
                                <span className="font-bold text-slate-400 shrink-0">Not:</span>
                                <span>{sector.notes}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PLANLA POP-UP MODAL ── */}
      {planningSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gazlama Tarihi Planla</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {planningSector.sectorCode} • {planningSector.district} / {planningSector.neighborhood}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlanningSector(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Hedeflenen Gazlama Tarihi <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={planDateInput}
                  onChange={(e) => setPlanDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Gazlama Hazırlık Durumu
                </label>
                <select
                  value={planStatusInput}
                  onChange={(e) => setPlanStatusInput(e.target.value as GasStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Gazlama Öncesi / Hazırlık">Gazlama Öncesi / Hazırlık</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Gazlandı">Gazlandı</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Planlama / Operasyon Notu
                </label>
                <textarea
                  rows={2}
                  value={planNotesInput}
                  onChange={(e) => setPlanNotesInput(e.target.value)}
                  placeholder="İlgili hat, imalat veya izinle ilgili ek operasyon notu..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-[11px]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setPlanningSector(null)}
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold transition-colors cursor-pointer text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-500 font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Planı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BAĞLANTI NESNESİ DETAY MODALI ── */}
      <BnoDetailModal
        bno={selectedBnoDetail}
        isOpen={!!selectedBnoDetail}
        onClose={() => setSelectedBnoDetail(null)}
      />
    </div>
  );
}
