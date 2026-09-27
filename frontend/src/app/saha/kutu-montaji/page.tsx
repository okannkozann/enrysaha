'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { WorkType, User } from '@/types';
import {
  ArrowLeft, PackageSearch, MapPin, ShieldCheck, Check,
  Loader2, ChevronRight, CheckCircle2, Layers
} from 'lucide-react';

export default function KutuMontajiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [boxDistrict, setBoxDistrict] = useState('');
  const [boxType, setBoxType]         = useState('');
  const [boxCount, setBoxCount]       = useState(1);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => setCurrentUser(user));
  }, []);

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

      toast({
        title: 'Kutu Montajı Kaydedildi ✅',
        description: `${boxDistrict} ilçesinde ${boxCount} adet ${boxType} kutu montajı tamamlandı olarak kaydedildi.`,
      });

      router.push('/saha');
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir hata oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const popularDistricts = ['Kepez', 'Muratpaşa', 'Konyaaltı', 'Serik', 'Manavgat', 'Alanya'];

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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30">
              BİLDİRİM FORMU
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-semibold">{currentUser?.teamName || 'Ekip 01'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            Kutu Montaj Bildirimi
          </h1>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <form onSubmit={handleBoxInstallation} className="space-y-6 relative z-10">

          {/* 1. İlçe Seçimi */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-violet-400" />
              <span>İlçe Seçimi</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {popularDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setBoxDistrict(d)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    boxDistrict === d
                      ? 'bg-violet-500/25 border-violet-500/70 text-violet-300 shadow-md shadow-violet-500/10 scale-102'
                      : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="relative pt-1">
              <select
                value={boxDistrict}
                onChange={(e) => setBoxDistrict(e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">Tüm İlçelerden Seçin...</option>
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
              <ChevronRight className="h-5 w-5 text-slate-400 rotate-90 absolute right-3.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Kutu Türü Seçimi */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-violet-400" />
              <span>Kutu Türü Seçimi</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              {['S700', 'CES200'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBoxType(type)}
                  className={`p-4 rounded-2xl border text-sm font-black transition-all flex items-center justify-between cursor-pointer ${
                    boxType === type
                      ? 'bg-violet-500/25 border-violet-500/70 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{type} Kutu</span>
                  {boxType === type && <Check className="h-5 w-5 text-violet-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Montaj Adedi Matrisi (1-20) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">Montaj Yapılan Kutu Sayısı</label>
              <span className="text-xs font-black text-violet-300 bg-violet-500/20 border border-violet-500/40 px-3 py-1 rounded-full">
                {boxCount} Adet
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBoxCount(num)}
                  className={`h-10 rounded-xl text-xs sm:text-sm font-extrabold transition-all border cursor-pointer ${
                    boxCount === num
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400 shadow-md shadow-violet-600/40 scale-105'
                      : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Özet Kartı */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 sm:p-5 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span>Seçilen İlçe:</span>
              <span className="font-bold text-white">{boxDistrict || 'Henüz Seçilmedi'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Kutu Türü:</span>
              <span className="font-bold text-violet-300">{boxType || 'Henüz Seçilmedi'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-700/40">
              <span>Toplam Montaj:</span>
              <span className="font-black text-emerald-400 text-base">{boxCount} Adet Kutu</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !boxDistrict || !boxType}
              className="w-full h-14 text-sm font-black uppercase tracking-wider rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <PackageSearch className="h-5 w-5" />
                  <span>KUTU MONTAJINI BİLDİR</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
