'use client';
import { useState, useEffect } from 'react';
import { Complaint } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Edit3, Loader2, AlertCircle } from 'lucide-react';

import { toTitleCaseTR } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Complaint, 'id'>) => Promise<void>;
  editingComplaint?: Complaint | null;
  complaintTypes: string[];
}

export function ComplaintFormModal({
  open,
  onClose,
  onSave,
  editingComplaint,
  complaintTypes,
}: Props) {
  const isEditing = Boolean(editingComplaint);

  const [connectionObject, setConnectionObject] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [repeatCount, setRepeatCount] = useState(1);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate fields when modal opens or editingComplaint changes
  useEffect(() => {
    if (open) {
      setErrors({});
      if (editingComplaint) {
        setConnectionObject(editingComplaint.connectionObject || '');
        if (complaintTypes.includes(editingComplaint.complaintType)) {
          setComplaintType(editingComplaint.complaintType);
          setCustomTypeInput('');
        } else {
          setComplaintType('DIĞER');
          setCustomTypeInput(editingComplaint.complaintType);
        }
        setAddress(editingComplaint.address || '');
        setName(editingComplaint.name || '');
        setContact(editingComplaint.contact || '');
        setReceivedDate(editingComplaint.receivedDate || '');
        setPlannedDate(editingComplaint.plannedDate || '');
        setRepeatCount(editingComplaint.repeatCount ?? 1);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        setConnectionObject('');
        setComplaintType(complaintTypes[0] || 'Gaz Kokusu');
        setCustomTypeInput('');
        setAddress('');
        setName('');
        setContact('');
        setReceivedDate(today);
        setPlannedDate(tomorrow);
        setRepeatCount(1);
      }
    }
  }, [open, editingComplaint, complaintTypes]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const finalType = complaintType === 'DIĞER' ? customTypeInput.trim() : complaintType;
    if (!finalType) {
      newErrors.complaintType = 'Bu alan zorunludur.';
    }

    if (!address.trim()) {
      newErrors.address = 'Bu alan zorunludur.';
    }

    if (!name.trim()) {
      newErrors.name = 'Bu alan zorunludur.';
    }

    if (!contact.trim()) {
      newErrors.contact = 'Bu alan zorunludur.';
    }

    if (!receivedDate) {
      newErrors.receivedDate = 'Bu alan zorunludur.';
    }

    if (!plannedDate) {
      newErrors.plannedDate = 'Bu alan zorunludur.';
    }

    if (repeatCount === undefined || repeatCount === null || isNaN(repeatCount) || repeatCount < 1) {
      newErrors.repeatCount = '1 veya daha büyük olmalı.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const finalType = complaintType === 'DIĞER' ? customTypeInput.trim() : complaintType;
      await onSave({
        connectionObject: connectionObject.trim() || undefined,
        complaintType: finalType,
        address: toTitleCaseTR(address.trim()),
        name: toTitleCaseTR(name.trim()),
        contact: contact.trim(),
        receivedDate,
        plannedDate,
        repeatCount: Number(repeatCount),
        status: editingComplaint?.status || 'Planlandı',
      });
      onClose();
    } catch (err) {
      console.error('Save complaint error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900/95 border border-slate-700/60 backdrop-blur-xl text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-3">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="h-5 w-5 text-blue-400" />
                Şikayet Bilgilerini Düzenle
              </>
            ) : (
              <>
                <PlusCircle className="h-5 w-5 text-blue-400" />
                Yeni Şikayet Kaydı
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* 2-Kolonlu Form Layout (Desktop), 1-Kolon (Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Şikayet Türü */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Şikayet Türü <span className="text-rose-400">*</span>
              </label>
              <select
                value={complaintType}
                onChange={(e) => {
                  setComplaintType(e.target.value);
                  if (errors.complaintType) setErrors((prev) => ({ ...prev, complaintType: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white focus:outline-none transition-all ${
                  errors.complaintType
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              >
                {complaintTypes.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    {t}
                  </option>
                ))}
                <option value="DIĞER" className="bg-slate-900 text-amber-300 font-semibold">
                  + Diğer (Manuel Tür Gir)
                </option>
              </select>

              {complaintType === 'DIĞER' && (
                <input
                  type="text"
                  value={customTypeInput}
                  onChange={(e) => {
                    setCustomTypeInput(e.target.value);
                    if (errors.complaintType) setErrors((prev) => ({ ...prev, complaintType: '' }));
                  }}
                  placeholder="Şikayet türünü yazınız..."
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-amber-500/40 text-xs text-amber-200 placeholder-slate-500 focus:outline-none"
                />
              )}

              {errors.complaintType && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.complaintType}
                </p>
              )}
            </div>

            {/* 2. Bağlantı Nesnesi (Opsiyonel) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Bağlantı Nesnesi</span>
                <span className="text-[10px] text-slate-400 font-normal">(Opsiyonel)</span>
              </label>
              <input
                type="text"
                value={connectionObject}
                onChange={(e) => setConnectionObject(e.target.value)}
                placeholder="Örn: 70101002"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {/* 3. Gelen Tarih */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Gelen Tarih <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => {
                  setReceivedDate(e.target.value);
                  if (errors.receivedDate) setErrors((prev) => ({ ...prev, receivedDate: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white focus:outline-none transition-all ${
                  errors.receivedDate
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.receivedDate && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.receivedDate}
                </p>
              )}
            </div>

            {/* 4. Planlanan Tarih */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Planlanan Tarih <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => {
                  setPlannedDate(e.target.value);
                  if (errors.plannedDate) setErrors((prev) => ({ ...prev, plannedDate: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white focus:outline-none transition-all ${
                  errors.plannedDate
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.plannedDate && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.plannedDate}
                </p>
              )}
            </div>

            {/* 5. İsim (Abone Adı) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                İsim (Abone Adı) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Abone Adı Soyadı"
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                  errors.name
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.name && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 6. İletişim (Telefon / GSM) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                İletişim (Telefon / GSM) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                }}
                placeholder="0532 000 00 00 veya iletişim bilgisi"
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                  errors.contact
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.contact && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.contact}
                </p>
              )}
            </div>

            {/* 7. Tekrar Sayısı */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Tekrar Sayısı <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={repeatCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setRepeatCount(isNaN(val) ? 1 : val);
                  if (errors.repeatCount) setErrors((prev) => ({ ...prev, repeatCount: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-xs text-white focus:outline-none transition-all ${
                  errors.repeatCount
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.repeatCount && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.repeatCount}
                </p>
              )}
            </div>

            {/* 8. Adres (Genişletilmiş Textarea - Full Width) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Adres <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="Açık adres bilgilerini (ilçe, mahalle, sokak, bina no vb.) giriniz..."
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-y min-h-[80px] leading-relaxed ${
                  errors.address
                    ? 'border-rose-500/80 ring-1 ring-rose-500/50'
                    : 'border-slate-700/60 focus:border-blue-500'
                }`}
              />
              {errors.address && (
                <p className="text-[10.5px] text-rose-400 flex items-center gap-1 font-medium mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.address}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Şikayeti Güncelle' : 'Kaydet'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
