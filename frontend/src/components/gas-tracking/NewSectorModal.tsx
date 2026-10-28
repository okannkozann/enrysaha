'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Building2, Flame, MapPin } from 'lucide-react';
import { GasSector, PaftaStatus, GasStatus, GasStreetDetail, StreetWorkStatus } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sector: Omit<GasSector, 'id' | 'createdAt' | 'updatedAt'>) => void;
  availableDistricts: string[];
}

export function NewSectorModal({ isOpen, onClose, onAdd, availableDistricts }: Props) {
  const [sectorCode, setSectorCode] = useState('');
  const [sectorName, setSectorName] = useState('');
  const [district, setDistrict] = useState(availableDistricts[0] || 'Kepez');
  const [neighborhood, setNeighborhood] = useState('');
  const [buildingCount, setBuildingCount] = useState<number>(1);
  const [paftaStatus, setPaftaStatus] = useState<PaftaStatus>('Hazır');
  const [gasStatus, setGasStatus] = useState<GasStatus>('Gazlama Öncesi / Hazırlık');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Street List inside Modal
  const [streets, setStreets] = useState<Omit<GasStreetDetail, 'id'>[]>([]);
  const [streetNameInput, setStreetNameInput] = useState('');
  const [streetBnoInput, setStreetBnoInput] = useState('');
  const [streetWorkStatus, setStreetWorkStatus] = useState<StreetWorkStatus>('Tamam');

  if (!isOpen) return null;

  const handleAddStreet = () => {
    if (!streetNameInput.trim()) return;
    const bnos = streetBnoInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setStreets((prev) => [
      ...prev,
      {
        streetName: streetNameInput.trim(),
        connectionObjects: bnos,
        boxCount: bnos.length || 1,
        workStatus: streetWorkStatus,
      },
    ]);

    setStreetNameInput('');
    setStreetBnoInput('');
    setStreetWorkStatus('Tamam');
  };

  const handleRemoveStreet = (idx: number) => {
    setStreets((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorCode.trim() || !neighborhood.trim()) return;

    const totalConnectionObjects = streets.reduce(
      (sum, s) => sum + (s.boxCount || s.connectionObjects.length),
      0
    );

    const generatedStreets: GasStreetDetail[] = streets.length
      ? streets.map((s, i) => ({ ...s, id: `STR-NEW-${i + 1}` }))
      : [
          {
            id: 'STR-NEW-1',
            streetName: `${neighborhood} Ana Hat`,
            connectionObjects: [],
            boxCount: buildingCount * 2,
            workStatus: 'Tamam',
          },
        ];

    onAdd({
      sectorCode: sectorCode.trim().toUpperCase(),
      sectorName: sectorName.trim() || undefined,
      district,
      neighborhood: neighborhood.trim(),
      buildingCount: Number(buildingCount) || 1,
      totalConnectionObjects: totalConnectionObjects || Number(buildingCount) * 2,
      paftaStatus,
      gasStatus,
      targetDate,
      actualGasDate: gasStatus === 'Gazlandı' ? targetDate : undefined,
      streets: generatedStreets,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Yeni Gazlama Bölgesi / Sektör Ekle</h2>
              <p className="text-[10.5px] text-slate-400 leading-none mt-0.5">Sektör, pafta ve sokak imalat parametrelerini girin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Sektör Kodu & Adı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Sektör Kodu <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={sectorCode}
                onChange={(e) => setSectorCode(e.target.value)}
                placeholder="Örn: 072200008SK60"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11.5px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Sektör / Bölge Adı
              </label>
              <input
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                placeholder="Örn: Yükseliş 2. Etap"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-[11.5px]"
              />
            </div>
          </div>

          {/* İlçe, Mahalle, Bina Sayısı */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                İlçe <span className="text-red-400">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-[11.5px]"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Mahalle <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Örn: Yükseliş"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-[11.5px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Kapsadığı Bina
              </label>
              <input
                type="number"
                min={1}
                value={buildingCount}
                onChange={(e) => setBuildingCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-[11.5px]"
              />
            </div>
          </div>

          {/* Pafta Durumu, Gazlama Durumu, Tarih */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Pafta Durumu
              </label>
              <select
                value={paftaStatus}
                onChange={(e) => setPaftaStatus(e.target.value as PaftaStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-[11.5px]"
              >
                <option value="Hazır">Hazır</option>
                <option value="Bekliyor">Bekliyor</option>
                <option value="Revizyon">Revizyon</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Gazlama Durumu
              </label>
              <select
                value={gasStatus}
                onChange={(e) => setGasStatus(e.target.value as GasStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-[11.5px]"
              >
                <option value="Gazlama Öncesi / Hazırlık">Gazlama Öncesi / Hazırlık</option>
                <option value="Gazlandı">Gazlandı</option>
                <option value="Beklemede">Beklemede</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {gasStatus === 'Gazlandı' ? 'Gazlanma Tarihi' : 'Hedef Tarih'}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-[11.5px]"
              />
            </div>
          </div>

          {/* Cadde & Sokak Ekleme Alanı */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200">Cadde / Sokak Kırılımı (Opsiyonel)</span>
              <span className="text-[10px] text-slate-400">{streets.length} Sokak eklendi</span>
            </div>

            <div className="grid grid-cols-12 gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="col-span-5">
                <input
                  placeholder="Cadde / Sokak adı"
                  value={streetNameInput}
                  onChange={(e) => setStreetNameInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-[11px]"
                />
              </div>
              <div className="col-span-4">
                <input
                  placeholder="BNO'lar (örn: 70101, 70102)"
                  value={streetBnoInput}
                  onChange={(e) => setStreetBnoInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-[11px]"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={streetWorkStatus}
                  onChange={(e) => setStreetWorkStatus(e.target.value as StreetWorkStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-[11px]"
                >
                  <option value="Tamam">Tamam</option>
                  <option value="Eksik">Eksik</option>
                </select>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleAddStreet}
                  className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                  title="Sokak Ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {streets.length > 0 && (
              <div className="max-h-28 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-lg">
                {streets.map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 text-[11px] bg-slate-950/30">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-200 truncate">{st.streetName}</span>
                      <span
                        className={`text-[9.5px] px-1 rounded font-bold ${
                          st.workStatus === 'Tamam' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {st.workStatus}
                      </span>
                      <span className="text-[10px] text-slate-400">({st.connectionObjects.length} BNO)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStreet(i)}
                      className="text-slate-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Operasyon Notu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Basınç testi, vana durumu, revizyon detayları..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-[11.5px] resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 active:scale-95 transition-all"
            >
              Kaydet ve Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

