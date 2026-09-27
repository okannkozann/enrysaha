'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { WorkSession, User } from '@/types';
import {
  ArrowLeft, CheckCircle2, Clock, Plus, Loader2,
  ChevronRight, Calendar, HardHat, Flame, PackageSearch
} from 'lucide-react';

export default function ImalatTamamlaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser]             = useState<User | null>(null);
  const [activeSessions, setActiveSessions]       = useState<WorkSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [meters, setMeters]                       = useState('');
  const [loading, setLoading]                     = useState(false);
  const [currentTime, setCurrentTime]             = useState(new Date());

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => {
      setCurrentUser(user);
      if (user?.teamId) {
        loadSessions(user.teamId);
      }
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadSessions = async (teamId: string) => {
    const active = await workSessionService.getActiveWorkSessions(teamId);
    setActiveSessions(active);
    if (active.length > 0 && !selectedSessionId) {
      setSelectedSessionId(active[0].id);
    }
  };

  const selectedActiveSession = activeSessions.find((s) => s.id === selectedSessionId);
  const isBoxWork = selectedActiveSession?.workType?.toLowerCase().includes('kutu') || 
                    selectedActiveSession?.workType?.toLowerCase().includes('servis kutusu');

  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(meters);
    if (!selectedSessionId || !val || val <= 0) {
      toast({
        title: 'Eksik Bilgi',
        description: isBoxWork ? 'Lütfen aktif bir iş seçin ve geçerli adet girin.' : 'Lütfen aktif bir iş seçin ve geçerli metraj girin.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.completeWorkSession(
        selectedSessionId,
        val,
        now.toISOString().split('T')[0],
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );

      toast({
        title: 'İşlem Tamamlandı ✅',
        description: isBoxWork
          ? `${val} adet kutu montajı başarıyla sisteme kaydedildi.`
          : `${val} metre imalat başarıyla sisteme kaydedildi.`,
      });

      router.push('/saha');
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir sorun oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addValuePreset = (val: number) => {
    const current = Number(meters) || 0;
    setMeters((current + val).toString());
  };

  const formatTime = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const meterPresets = [10, 25, 50, 100];
  const boxPresets   = [1, 2, 5, 10];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">

      {/* Top Back Navigation & Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Link
          href="/saha"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
              BİLDİRİM FORMU
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-semibold">{currentUser?.teamName || 'Ekip 01'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            İmalat Tamamlama Bildirimi
          </h1>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {activeSessions.length === 0 ? (
          <div className="p-10 text-center bg-slate-800/30 rounded-2xl border border-slate-800 space-y-4">
            <Clock className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="text-base font-bold text-slate-200">Devam Eden Aktif İş Bulunmuyor</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Şu anda ekibinize tanımlı açık bir imalat görevi yok. Yeni bir boru hattı imalatına başlamak için "İşe Başlama" bildirim formunu kullanabilirsiniz.
            </p>
            <Link
              href="/saha/ise-baslama"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <span>Yeni İşe Başla</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCompleteWork} className="space-y-6 relative z-10">

            {/* Aktif Görev Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-200">Aktif Görevinizi Seçin</label>
              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setMeters('');
                  }}
                  className="w-full h-12 pl-4 pr-10 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                >
                  {activeSessions.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.sector} — {s.workType} (Başlangıç: {s.startTime})
                    </option>
                  ))}
                </select>
                <ChevronRight className="h-5 w-5 text-slate-400 rotate-90 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Seçili İş Özeti */}
            {selectedActiveSession && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 sm:p-5 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>İlçe / Sektör:</span>
                  <span className="font-bold text-white">{selectedActiveSession.sector}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>İmalat / İş Türü:</span>
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    {isBoxWork && <PackageSearch className="h-4 w-4 text-violet-400" />}
                    {selectedActiveSession.workType}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Başlangıç Saati:</span>
                  <span className="font-bold text-white">{selectedActiveSession.startTime}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-blue-500/20">
                  <span>Tamamlama Saati (Otomatik):</span>
                  <span className="font-bold text-emerald-400">{formatTime(currentTime)}</span>
                </div>
              </div>
            )}

            {/* Adet veya Metraj Girişi & Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200">
                  {isBoxWork ? 'Gerçekleşen Montaj Adedi' : 'Gerçekleşen İmalat Metrajı'}
                </label>
                <span className="text-xs text-slate-400 font-semibold">Hızlı Ekleme</span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {(isBoxWork ? boxPresets : meterPresets).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => addValuePreset(val)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-black text-blue-300 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-400" />
                    <span>+{val} {isBoxWork ? 'adet' : 'm'}</span>
                  </button>
                ))}
              </div>

              <div className="relative pt-1">
                <input
                  type="number"
                  placeholder={isBoxWork ? "Örn: 2" : "Örn: 140"}
                  value={meters}
                  onChange={(e) => setMeters(e.target.value)}
                  min="1"
                  className="w-full h-12 pl-4 pr-20 rounded-2xl bg-slate-800/90 border border-slate-700 text-base font-black text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-black text-slate-400 uppercase pointer-events-none">
                  {isBoxWork ? 'ADET' : 'METRE'}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !meters}
                className="w-full h-14 text-sm font-black uppercase tracking-wider rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{isBoxWork ? 'KUTU MONTAJINI COMPLETED OLARAK KAYDET' : 'İMALATI TAMAMLA & KAYDET'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
