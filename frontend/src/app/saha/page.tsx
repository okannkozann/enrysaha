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
  const [reportType, setReportType]               = useState<'START' | 'COMPLETED' | 'BOX_INSTALLATION'>('START');
  const [loading, setLoading]                     = useState(false);
  const [activeSessions, setActiveSessions]       = useState<WorkSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<WorkSession[]>([]);

  // Form State - İşe Başlama
  const [district, setDistrict] = useState('');
  const [workType, setWorkType] = useState<string>('');

  // Form State - İşi Tamamlama
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [meters, setMeters]                       = useState('');

  // Form State - Servis Kutusu Montajı
  const [boxDistrict, setBoxDistrict] = useState('');
  const [boxType, setBoxType]         = useState('');
  const [boxCount, setBoxCount]       = useState(1);

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
    if (!district || !workType) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen ilçe ve imalat türünü seçin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.createWorkSession({
        teamId: currentUser!.teamId!,
        teamName: currentUser!.teamName!,
        sector: district,
        workType: workType as WorkType,
        startDate: now.toISOString().split('T')[0],
        startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      });

      toast({ title: 'İş Başlatıldı', description: `${district} ilçesinde ${workType} imalatı başlatıldı.` });
      setDistrict('');
      setWorkType('');
      loadSessions();
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir hata oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBoxInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxDistrict || !boxType) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen ilçe ve kutu türü seçimi yapın.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      await workSessionService.createWorkSession({
        teamId: currentUser!.teamId!,
        teamName: currentUser!.teamName!,
        sector: boxDistrict,
        workType: `Servis Kutusu ${boxType} (${boxCount} Adet)` as WorkType,
        startDate: dateStr,
        startTime: timeStr,
        endDate: dateStr,
        endTime: timeStr,
        quantityMeters: boxCount,
        status: "COMPLETED",
        notificationType: "COMPLETED",
      });

      toast({ title: 'Kutu Montajı Doğrudan Kaydedildi', description: `${boxDistrict} ilçesinde ${boxCount} adet ${boxType} kutu montajı tamamlandı olarak kaydedildi.` });
      setBoxDistrict('');
      setBoxType('');
      setBoxCount(1);
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
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-emerald-500/30 selection:text-white">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* ── Top Bar: Compact Sticky Header ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 px-4 py-2 sm:py-2.5 shrink-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm tracking-tight">ENERYA SAHA</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                  {currentUser?.teamName || 'Ekip 01'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Saha Operasyon & İmalat Bildirimi</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>{formatTime(currentTime)}</span>
            </div>

            <Link
              href="/"
              title="Çıkış Yap"
              className="flex items-center justify-center w-7 h-7 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container: 3 Columns Layout (Sidebar | Form | Today's Activity Panel) ── */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 max-w-[1500px] w-full mx-auto flex flex-col lg:flex-row gap-4 overflow-hidden relative z-10">

        {/* ══ 1. SOL MENÜ (SIDEBAR) ═════════════════════════════════════ */}
        <aside className="lg:w-60 shrink-0 flex flex-col gap-3">

          {/* Menü Kartı */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-xl p-3 shadow-xl space-y-1.5">
            <div className="flex items-center gap-2 px-2.5 pt-1 pb-1.5 border-b border-slate-800/80 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Saha Menüsü
              </span>
            </div>

            <Link
              href="/saha"
              className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all bg-emerald-500/20 border border-emerald-500/40 text-white shadow-md shadow-emerald-500/10 group"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Bildirim İşlemleri</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            </Link>

            <Link
              href="/saha/qr-listesi"
              className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent hover:border-slate-700/60 group"
            >
              <div className="flex items-center gap-2.5">
                <PackageSearch className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span>Servis Kutuları</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
            </Link>
          </div>

          {/* Bugünkü Performans Mini Kartı */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-xl p-3.5 space-y-2.5 hidden sm:block shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bugünkü Performans</span>
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2">
                <span className="text-[9px] text-slate-400 block font-medium">Metraj</span>
                <span className="text-sm font-black text-emerald-400">{todayTotalMeters} m</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2">
                <span className="text-[9px] text-slate-400 block font-medium">Vardiya</span>
                <span className="text-sm font-black text-amber-400">{activeSessions.length} İş</span>
              </div>
            </div>
          </div>

          {/* Sorumlu Ekip Bilgi Kartı */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-3 hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <HardHat className="h-4 w-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Aktif Saha Ekibi</p>
              <p className="text-xs font-bold text-white truncate">{currentUser?.teamName || 'Ekip 01'}</p>
            </div>
          </div>

        </aside>

        {/* ══ 2. ORTA ALAN: FORM & TOGGLE CONTROL (BAĞIMSIZ SABİT GENİŞLİK) ═══ */}
        <main className="lg:w-[440px] w-full shrink-0 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">

          {/* Toggle / Segmented Control (3 Tabs) */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 shadow-lg shrink-0 gap-1">
            <button
              type="button"
              className={`flex-1 py-2 px-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                reportType === 'START'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setReportType('START')}
            >
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">İşe Başlama</span>
            </button>

            <button
              type="button"
              className={`flex-1 py-2 px-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                reportType === 'COMPLETED'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setReportType('COMPLETED')}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">İmalat Tamamlama</span>
              {activeSessions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white shrink-0">
                  {activeSessions.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`flex-1 py-2 px-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                reportType === 'BOX_INSTALLATION'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setReportType('BOX_INSTALLATION')}
            >
              <PackageSearch className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Kutu Montajı</span>
            </button>
          </div>

          {/* ── İŞE BAŞLAMA FORMU ── */}
          {reportType === 'START' && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Play className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Yeni Saha İmalatına Başla
                </h2>
              </div>

              <form onSubmit={handleStartWork} className="space-y-3.5">
                <div className="space-y-3">
                  {/* İlçe Seçimi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      İlçe Seçimi
                    </label>
                    <div className="relative">
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer appearance-none"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-500">İlçe Seçin...</option>
                        <option value="Kepez" className="bg-slate-900 text-white">Kepez</option>
                        <option value="Muratpaşa" className="bg-slate-900 text-white">Muratpaşa</option>
                        <option value="Konyaaltı" className="bg-slate-900 text-white">Konyaaltı</option>
                        <option value="Serik" className="bg-slate-900 text-white">Serik</option>
                        <option value="Manavgat" className="bg-slate-900 text-white">Manavgat</option>
                        <option value="Alanya" className="bg-slate-900 text-white">Alanya</option>
                        <option value="Kemer" className="bg-slate-900 text-white">Kemer</option>
                        <option value="Döşemealtı" className="bg-slate-900 text-white">Döşemealtı</option>
                        <option value="Korkuteli" className="bg-slate-900 text-white">Korkuteli</option>
                      </select>
                      <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* İmalat Türü Seçimi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-400" />
                      İmalat Türü Seçimi
                    </label>
                    <div className="relative">
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-500">İmalat Türü Seçin...</option>
                        <optgroup label="Ana Hat" className="bg-slate-900 text-emerald-400 font-bold">
                          <option value="PE63" className="bg-slate-900 text-white font-normal">PE63</option>
                          <option value="PE125" className="bg-slate-900 text-white font-normal">PE125</option>
                          <option value='ST4"' className="bg-slate-900 text-white font-normal">ST4"</option>
                          <option value='ST6"' className="bg-slate-900 text-white font-normal">ST6"</option>
                          <option value='ST8"' className="bg-slate-900 text-white font-normal">ST8"</option>
                          <option value='ST16"' className="bg-slate-900 text-white font-normal">ST16"</option>
                        </optgroup>
                        <optgroup label="Servis Hattı" className="bg-slate-900 text-blue-400 font-bold">
                          <option value="PE32" className="bg-slate-900 text-white font-normal">PE32</option>
                          <option value="PE20" className="bg-slate-900 text-white font-normal">PE20</option>
                        </optgroup>
                      </select>
                      <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Otomatik Bilgi Kartı */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 space-y-1.5 text-xs">
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

                  <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-700/50">
                    <span>Saha Durumu:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Devam Ediyor
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-48 h-10 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>İŞE BAŞLA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── İMALAT TAMAMLAMA FORMU ── */}
          {reportType === 'COMPLETED' && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Aktif İşi Sonlandır & Metraj Bildir
                </h2>
              </div>

              <form onSubmit={handleCompleteWork} className="space-y-3.5">
                {activeSessions.length === 0 ? (
                  <div className="p-5 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1.5">
                    <Clock className="h-6 w-6 text-slate-600 mx-auto mb-1" />
                    <div className="font-semibold text-xs text-slate-300">Şu anda devam eden aktif bir işiniz bulunmuyor.</div>
                    <div className="text-[10px] text-slate-500">"İşe Başlama" sekmesinden yeni bir çalışma başlatabilirsiniz.</div>
                  </div>
                ) : (
                  <>
                    {/* Aktif İş Seçimi */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Aktif Görev Seçimi</label>
                      <div className="relative">
                        <select
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                        >
                          {activeSessions.map((s) => (
                            <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                              {s.sector} — {s.workType} (Başlama: {s.startTime})
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Seçili İş Özeti */}
                    {selectedActiveSession && (
                      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>İlçe:</span>
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
                        <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-700/50">
                          <span>Yeni Durum:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            Tamamlandı
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Metraj Girişi */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Gerçekleşen İmalat Metrajı</span>
                        <span className="text-[10px] text-slate-500 font-normal">Tam sayı giriniz</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Örn: 140"
                          value={meters}
                          onChange={(e) => setMeters(e.target.value)}
                          min="1"
                          className="w-full h-10 pl-3 pr-14 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400 uppercase">
                          metre
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-52 h-10 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>İMALATI TAMAMLA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* ── SERVİS KUTUSU MONTAJ FORMU ── */}
          {reportType === 'BOX_INSTALLATION' && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <PackageSearch className="h-4 w-4 text-violet-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Servis Kutusu Montaj Bildirimi
                </h2>
              </div>

              <form onSubmit={handleBoxInstallation} className="space-y-4">
                {/* İlçe Seçimi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    İlçe Seçimi
                  </label>
                  <div className="relative">
                    <select
                      value={boxDistrict}
                      onChange={(e) => setBoxDistrict(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">İlçe Seçin...</option>
                      <option value="Kepez" className="bg-slate-900 text-white">Kepez</option>
                      <option value="Muratpaşa" className="bg-slate-900 text-white">Muratpaşa</option>
                      <option value="Konyaaltı" className="bg-slate-900 text-white">Konyaaltı</option>
                      <option value="Serik" className="bg-slate-900 text-white">Serik</option>
                      <option value="Manavgat" className="bg-slate-900 text-white">Manavgat</option>
                      <option value="Alanya" className="bg-slate-900 text-white">Alanya</option>
                      <option value="Kemer" className="bg-slate-900 text-white">Kemer</option>
                      <option value="Döşemealtı" className="bg-slate-900 text-white">Döşemealtı</option>
                      <option value="Korkuteli" className="bg-slate-900 text-white">Korkuteli</option>
                    </select>
                    <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Kutu Türü Seçimi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                    Kutu Türü Seçimi
                  </label>
                  <div className="relative">
                    <select
                      value={boxType}
                      onChange={(e) => setBoxType(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">Kutu Türü Seçin...</option>
                      <option value="S700" className="bg-slate-900 text-white">S700</option>
                      <option value="CES200" className="bg-slate-900 text-white">CES200</option>
                    </select>
                    <ChevronRight className="h-4 w-4 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Montaj Yapılan Kutu Sayısı (1 - 20 Adet Seçimi) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-violet-400" />
                      Montaj Yapılan Kutu Sayısı
                    </label>
                    <span className="text-xs font-black text-violet-300 bg-violet-500/20 border border-violet-500/40 px-2.5 py-0.5 rounded-full">
                      {boxCount} Adet
                    </span>
                  </div>

                  {/* 1'den 20'ye Buton Grid Seçimi */}
                  <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBoxCount(num)}
                        className={`h-8 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
                          boxCount === num
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400 shadow-md shadow-violet-600/40 scale-105'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ek Bilgi Özet Kartı */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>İlçe:</span>
                    <span className="font-bold text-white">{boxDistrict || 'Seçilmedi'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Kutu Türü:</span>
                    <span className="font-bold text-violet-300">{boxType || 'Seçilmedi'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Toplam Montaj:</span>
                    <span className="font-black text-emerald-400">{boxCount} Kutu</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-56 h-10 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>KUTU MONTAJINI BİLDİR</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>

        {/* ══ 3. SAĞ ALAN: BUGÜNKÜ SAHA ÇALIŞMALARI (RIGHT PANEL - ULTRA COMPACT) ══════ */}
        <aside className="w-full lg:w-[280px] shrink-0 flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2.5 shadow-xl overflow-hidden max-h-[calc(100vh-100px)]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Bugünkü Saha Çalışmaları
            </h2>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {activeSessions.length + completedSessions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pt-2 pr-0.5">
            {activeSessions.length === 0 && completedSessions.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-[11px] italic bg-slate-800/30 rounded-xl border border-slate-800/60">
                Kayıtlı çalışma bulunamadı.
              </div>
            )}

            {/* Aktif Seanslar */}
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 backdrop-blur-sm border-l-2 border-l-amber-400 space-y-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] font-bold text-white truncate">{session.sector}</span>
                    <span className="text-[10px] text-amber-300 font-semibold truncate">• {session.workType}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    Aktif
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-amber-500/15">
                  <span className="text-slate-300 font-medium">Başlangıç: {session.startTime}</span>
                  {reportType !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportType('COMPLETED');
                        setSelectedSessionId(session.id);
                      }}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-200 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/30 flex items-center gap-0.5 transition-all cursor-pointer"
                    >
                      <span>Tamamla</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Tamamlanan Seanslar */}
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 backdrop-blur-sm border-l-2 border-l-emerald-500 space-y-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] font-bold text-white truncate">{session.sector}</span>
                    <span className="text-[10px] text-slate-300 truncate">• {session.workType}</span>
                  </div>
                  <span className="text-emerald-300 font-extrabold text-[10px] bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded shrink-0">
                    {session.quantityMeters ? `${session.quantityMeters}m` : session.notes || 'Bitti'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-emerald-500/10">
                  <span className="text-slate-400">{session.startTime} - {session.endTime || '—'}</span>
                  <span className="text-[8px] text-emerald-400 font-semibold">Tamamlandı</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>

    </div>
  );
}
