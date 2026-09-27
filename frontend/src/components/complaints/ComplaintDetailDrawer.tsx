'use client';
import { Complaint } from '@/types';
import {
  MessageSquare, User, MapPin, Phone, Calendar, Clock,
  AlertTriangle, Edit3, Trash2, X, CheckCircle2, Box
} from 'lucide-react';

import { toTitleCaseTR } from '@/lib/utils';

interface Props {
  complaint: Complaint | null;
  onClose: () => void;
  onEdit: (complaint: Complaint) => void;
  onDelete: (id: string) => void;
}

function formatDateTR(dateStr: string = ''): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export function ComplaintDetailDrawer({
  complaint,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  if (!complaint) return null;

  const handleConfirmDelete = () => {
    if (window.confirm(`"${complaint.id}" no'lu şikayet kaydını silmek istediğinizden emin misiniz?`)) {
      onDelete(complaint.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-700/60 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  {complaint.id}
                </span>
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${
                    complaint.repeatCount >= 3
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : complaint.repeatCount > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Tekrar: {complaint.repeatCount}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">Şikayet Detayı</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {/* Şikayet Türü & Bağlantı Nesnesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Şikayet Türü
                </span>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{complaint.complaintType}</span>
                </div>
              </div>

              {complaint.connectionObject ? (
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Bağlantı Nesnesi
                  </span>
                  <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{complaint.connectionObject}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-slate-700/30 bg-slate-800/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Bağlantı Nesnesi
                  </span>
                  <div className="text-xs font-mono text-slate-500">—</div>
                </div>
              )}
            </div>

            {/* Abone Bilgileri */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                Abone & İletişim Bilgileri
              </span>

              {/* İsim */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Abone Adı Soyadı</div>
                  <div className="text-xs font-bold text-white mt-0.5">{toTitleCaseTR(complaint.name) || '—'}</div>
                </div>
              </div>

              {/* İletişim */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                  <Phone className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">İletişim</div>
                  <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                    {complaint.contact || '—'}
                  </div>
                </div>
              </div>

              {/* Adres */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                  <MapPin className="h-4 w-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Açık Adres</div>
                  <div className="text-xs font-medium text-slate-300 mt-0.5 leading-relaxed">
                    {toTitleCaseTR(complaint.address) || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarihler & İlerleme */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                Tarih ve Durum Bilgileri
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold mb-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    Gelen Tarih
                  </div>
                  <div className="text-xs font-bold text-white">
                    {formatDateTR(complaint.receivedDate)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold mb-1">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    Planlanan Tarih
                  </div>
                  <div className="text-xs font-bold text-white">
                    {formatDateTR(complaint.plannedDate)}
                  </div>
                </div>
              </div>

              {/* Tekrar Uyarısı */}
              {complaint.repeatCount > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200 leading-relaxed">
                    Bu şikayet <strong className="font-bold text-white">{complaint.repeatCount} kez</strong> tekrar etmiştir. Saha ekiplerince öncelikli müdahale önerilir.
                  </div>
                </div>
              )}

              {/* Notlar */}
              {complaint.notes && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Notlar / Açıklama</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{complaint.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(complaint);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Düzenle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
