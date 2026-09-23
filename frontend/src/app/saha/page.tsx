'use client';
import { useState, useEffect } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { WorkType, WorkSession, User } from '@/types';
import {
  LogOut, ClipboardList, PackageSearch, Play, CheckCircle2,
  Clock, MapPin, HardHat, Activity, Sparkles, Layers,
  ChevronRight, Calendar, ArrowRight, ShieldCheck, Flame, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function MobileFieldReportPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser]             = useState<User | null>(null);
  const [reportType, setReportType]               = useState<'START' | 'COMPLETED'>('START');
  const [loading, setLoading]                     = useState(false);
  const [activeSessions, setActiveSessions]       = useState<WorkSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<WorkSession[]>([]);

  // Form State - İşe Başlama
  const [sector, setSector]     = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');

  // Form State - İşi Tamamlama
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [meters, setMeters]                       = useState('');

  // Otomatik Bilgiler (Zaman)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => setCurrentUser(user));
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser?.teamId) {
      loadSessions();
    }
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser?.teamId) return;
    const active = await workSessionService.getActiveWorkSessions(currentUser.teamId);
    setActiveSessions(active);

    const all = await workSessionService.getWorkSessions();
    const completed = all.filter((ws) => ws.teamId === currentUser.teamId && ws.status === "COMPLETED");
    setCompletedSessions(completed);

    if (active.length > 0 && !selectedSessionId) {
      setSelectedSessionId(active[0].id);
    }
  };

  const handleStartWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector || !workType) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen sektör ve imalat türünü seçin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.createWorkSession({
        teamId: currentUser!.teamId!,
        teamName: currentUser!.teamName!,
        sector,
        workType: workType as WorkType,
        startDate: now.toISOString().split('T')[0],
        startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      });

      toast({ title: 'İş Başlatıldı', description: `${sector} sektöründe imalat başlatıldı.` });
      setSector('');
      setWorkType('');
      loadSessions();
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir hata oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const meterVal = Number(meters);
    if (!selectedSessionId || !meterVal || meterVal <= 0) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen aktif bir iş seçin ve geçerli metraj girin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.completeWorkSession(
        selectedSessionId,
        meterVal,
        now.toISOString().split('T')[0],
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );

      toast({ title: 'İmalat Tamamlandı', description: `${meterVal} metre imalat başarıyla kaydedildi.` });
      setMeters('');
      setSelectedSessionId('');
      loadSessions();
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir sorun oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const selectedActiveSession = activeSessions.find((s) => s.id === selectedSessionId);

  // Toplam bugün yapılan metraj
  const todayTotalMeters = completedSessions.reduce((s, ws) => s + (ws.quantityMeters || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 relative selection:bg-emerald-500/30 selection:text-white">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* ── Top Bar: Sticky Header ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 sm:p-5 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">ENERYA SAHA</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                  {currentUser?.teamName || 'Ekip 01'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Saha Operasyon & İmalat Bildirimi</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>{formatTime(currentTime)}</span>
            </div>

            <Link
              href="/"
              title="Çıkış Yap"
              className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 mt-2 relative z-10">

        {/* ── Sol Menü (Side Navigation) ── */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-4">

          {/* Menü Kartı */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-3 shadow-xl space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">
              Saha Menüsü
            </div>

            <Link
              href="/saha"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-xl transition-all bg-emerald-500/20 border border-emerald-500/35 text-white shadow-md shadow-emerald-500/10"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-emerald-400" />
                <span>Bildirim İşlemleri</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </Link>

            <Link
              href="/saha/qr-listesi"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-semibold rounded-xl transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <PackageSearch className="h-4 w-4 text-slate-400" />
                <span>Servis Kutuları</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            </Link>
          </div>

          {/* Günlük Özet Mini Kartı */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3 hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bugünkü Performans
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Tamamlanan Metraj:</span>
              <span className="text-sm font-black text-emerald-400">{todayTotalMeters} m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Aktif Vardiya:</span>
              <span className="text-sm font-black text-amber-400">{activeSessions.length} İş</span>
            </div>
          </div>
        </aside>

        {/* ── Form & Akış İçeriği ── */}
        <main className="flex-1 space-y-6 min-w-0">

          {/* Toggle / Segmented Control */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 shadow-lg">
            <button
              type="button"
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                reportType === 'START'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setReportType('START')}
            >
              <Play className="h-4 w-4" />
              <span>İşe Başlama Bildirimi</span>
            </button>

            <button
              type="button"
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                reportType === 'COMPLETED'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setReportType('COMPLETED')}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>İmalat Tamamlama</span>
              {activeSessions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {activeSessions.length}
                </span>
              )}
            </button>
          </div>

          {/* ── İŞE BAŞLAMA FORMU ── */}
          {reportType === 'START' ? (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Play className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Yeni Saha İmalatına Başla
                </h2>
              </div>

              <form onSubmit={handleStartWork} className="space-y-5">
                <div className="space-y-4">
                  {/* Sektör Seçimi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      Sektör / Bölge
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full h-13 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">Sektör Seçin...</option>
                      <option value="072200003SK16" className="bg-slate-900 text-white">072200003SK16 — Kepez Bölgesi</option>
                      <option value="072200011SK13" className="bg-slate-900 text-white">072200011SK13 — Muratpaşa Bölgesi</option>
                      <option value="072200018SK10" className="bg-slate-900 text-white">072200018SK10 — Konyaaltı Bölgesi</option>
                    </select>
                  </div>

                  {/* İmalat Türü Seçimi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-400" />
                      İmalat Türü
                    </label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value as WorkType)}
                      className="w-full h-13 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">İmalat Türü Seçin...</option>
                      <option value="PE Ana Hat" className="bg-slate-900 text-white">PE Ana Hat İmalatı</option>
                      <option value="ST Çelik Hat" className="bg-slate-900 text-white">ST Çelik Hat İmalatı</option>
                      <option value="Servis Hattı" className="bg-slate-900 text-white">Servis Hattı Çekimi</option>
                      <option value="Servis Kutusu" className="bg-slate-900 text-white">Servis Kutusu Montajı</option>
                    </select>
                  </div>
                </div>

                {/* Otomatik Bilgi Kartı */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      İş Başlangıç Tarihi:
                    </span>
                    <span className="font-bold text-white">{formatDate(currentTime)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Başlangıç Saati:
                    </span>
                    <span className="font-bold text-white">{formatTime(currentTime)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <HardHat className="h-3.5 w-3.5 text-slate-500" />
                      Sorumlu Ekip:
                    </span>
                    <span className="font-bold text-slate-200">{currentUser?.teamName || 'Ekip 01'}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-700/50">
                    <span>Saha Durumu:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Devam Ediyor
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-sm font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>İŞE BAŞLA</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ── İMALAT TAMAMLAMA FORMU ── */
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Aktif İşi Sonlandır & Metraj Bildir
                </h2>
              </div>

              <form onSubmit={handleCompleteWork} className="space-y-5">
                {activeSessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2">
                    <Clock className="h-8 w-8 text-slate-600 mx-auto mb-1" />
                    <div className="font-semibold text-sm text-slate-300">Şu anda devam eden aktif bir işiniz bulunmuyor.</div>
                    <div className="text-xs text-slate-500">"İşe Başlama" sekmesinden yeni bir çalışma başlatabilirsiniz.</div>
                  </div>
                ) : (
                  <>
                    {/* Aktif İş Seçimi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Aktif Görev Seçimi</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full h-13 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        {activeSessions.map((s) => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                            {s.sector} — {s.workType} (Başlama: {s.startTime})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seçili İş Özeti */}
                    {selectedActiveSession && (
                      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Sektör:</span>
                          <span className="font-bold text-white">{selectedActiveSession.sector}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>İmalat Türü:</span>
                          <span className="font-bold text-white">{selectedActiveSession.workType}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Başlangıç Saati:</span>
                          <span className="font-bold text-white">{selectedActiveSession.startTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Bitiş Saati (Otomatik):</span>
                          <span className="font-bold text-emerald-400">{formatTime(currentTime)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-700/50">
                          <span>Yeni Durum:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            Tamamlandı
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Metraj Girişi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Gerçekleşen İmalat Metrajı</span>
                        <span className="text-[10px] text-slate-500 font-normal">Tam sayı olarak giriniz</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Örn: 140"
                          value={meters}
                          onChange={(e) => setMeters(e.target.value)}
                          min="1"
                          className="w-full h-14 pl-4 pr-16 rounded-xl bg-slate-800/80 border border-slate-700 text-lg font-black text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-slate-400 uppercase">
                          metre
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 text-sm font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Kaydediliyor...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          <span>İMALATI TAMAMLA</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            </div>
          )}

          {/* ── BUGÜNKÜ ÇALIŞMALARIM LİSTESİ ── */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Bugünkü Saha Çalışmaları
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {activeSessions.length} Aktif / {completedSessions.length} Biten
              </span>
            </div>

            {activeSessions.length === 0 && completedSessions.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-xl border border-slate-800">
                Bugüne ait kayıtlı saha çalışması bulunamadı.
              </div>
            )}

            {/* Aktif Seanslar */}
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 backdrop-blur-sm border-l-4 border-l-amber-500 transition-all hover:bg-amber-500/10 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      {session.teamName}
                    </span>
                    <div className="text-base font-black text-white mt-0.5">
                      {session.sector}
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Devam Ediyor
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 pt-1 border-t border-amber-500/20">
                  <span className="font-semibold text-slate-200">{session.workType}</span>
                  <span className="text-slate-400">Başlangıç: <strong className="text-white">{session.startTime}</strong></span>
                </div>

                {reportType !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setReportType('COMPLETED');
                      setSelectedSessionId(session.id);
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-amber-200 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>İmalatı Tamamla</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Tamamlanan Seanslar */}
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 backdrop-blur-sm border-l-4 border-l-emerald-500 transition-all hover:bg-emerald-500/10 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {session.teamName}
                    </span>
                    <div className="text-base font-black text-white mt-0.5">
                      {session.sector}
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Tamamlandı
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200">
                  {session.workType}
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-2 border-t border-emerald-500/20">
                  <span>Saat: <strong className="text-white">{session.startTime} – {session.endTime}</strong></span>
                  <span className="text-emerald-300 font-black text-sm">{session.quantityMeters} m</span>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

    </div>
  );
}
