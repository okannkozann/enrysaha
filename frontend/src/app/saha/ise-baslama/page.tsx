'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { WorkType, User } from '@/types';
import {
  ArrowLeft, Play, MapPin, Layers, ArrowRight, ArrowDown,
  Loader2, Check, Sparkles
} from 'lucide-react';

export default function IseBaslamaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Selection states
  const [showDistrictOptions, setShowDistrictOptions] = useState(false);
  const [district, setDistrict]                         = useState('');
  
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [mainCategory, setMainCategory]                 = useState<'Ana Hat' | 'Servis Hattı' | 'Servis Kutusu' | ''>('');
  const [subOption, setSubOption]                       = useState('');
  
  const [loading, setLoading]                           = useState(false);

  // Refs for smooth mobile auto-scrolling
  const districtGridRef     = useRef<HTMLDivElement>(null);
  const categoryCardRef     = useRef<HTMLButtonElement>(null);
  const categoryGridRef     = useRef<HTMLDivElement>(null);
  const subOptionsGridRef   = useRef<HTMLDivElement>(null);
  const submitButtonRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => setCurrentUser(user));
  }, []);

  const scrollToElement = (ref: React.RefObject<HTMLElement | null>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  };

  const handleStartWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWorkType = subOption ? `${mainCategory} ${subOption}` : mainCategory;

    if (!district || !mainCategory || !subOption) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen tüm adımları sırasıyla tamamlayın.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.createWorkSession({
        teamId: currentUser!.teamId!,
        teamName: currentUser!.teamName!,
        sector: district,
        workType: finalWorkType as WorkType,
        startDate: now.toISOString().split('T')[0],
        startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      });

      toast({
        title: 'İş Başlatıldı ✅',
        description: `${district} ilçesinde ${finalWorkType} imalatı başlatıldı.`,
      });

      router.push('/saha');
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem sırasında bir hata oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const districtList = [
    ['aksu', 'alanya'],
    ['elmalı', 'kepez'],
    ['muratpaşa', 'konyaaltı'],
    ['manavgat', 'serik'],
    ['döşemealtı', 'korkuteli'],
  ];

  const categorySubOptions: Record<string, string[]> = {
    'Ana Hat': ['PE63', 'PE125', 'ST4"', 'ST6"', 'ST8"', 'ST16"'],
    'Servis Hattı': ['PE32', 'PE20'],
    'Servis Kutusu': ['S700', 'CES200'],
  };

  return (
    <div className="space-y-4 sm:space-y-6 py-2 pb-28 sm:pb-32 w-full max-w-full overflow-x-hidden">

      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <Link
          href="/saha"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            İşe Başlama
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Adım adım seçim yaparak imalatınızı başlatın.</p>
        </div>
      </div>

      <form onSubmit={handleStartWork} className="space-y-6 w-full">

        {/* ── MOBİL UYUMLU DİKEY & YATAY ADIM ADIM PIPELINE FLOW ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-start gap-3 lg:gap-5 w-full">

          {/* ── ADIM 1 KARTI: İlçe Seçimi ── */}
          <button
            type="button"
            onClick={() => {
              setShowDistrictOptions(true);
              scrollToElement(districtGridRef);
            }}
            className={`w-full lg:w-44 h-14 sm:h-36 lg:h-40 rounded-2xl border backdrop-blur-xl p-3 sm:p-4 flex flex-row lg:flex-col items-center justify-between lg:justify-center text-left lg:text-center shrink-0 shadow-lg transition-all cursor-pointer ${
              showDistrictOptions || district
                ? 'border-emerald-500/80 bg-emerald-500/10 shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-3 lg:flex-col lg:gap-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                showDistrictOptions || district
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                İlçe Seçimi
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">
              {district ? (
                <span className="text-emerald-400 capitalize flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  <Check className="h-3 w-3" />
                  {district}
                </span>
              ) : (
                <span className="text-slate-400 text-xs font-bold">Tıklayın →</span>
              )}
            </p>
          </button>

          {/* ── ADIM 1 İÇERİĞİ: İlçeler Buton Grubu ── */}
          {showDistrictOptions && (
            <>
              {/* Ok İkonu */}
              <div className="flex items-center justify-center shrink-0 text-emerald-400 py-1 lg:py-0">
                <ArrowRight className="hidden lg:block h-6 w-6 stroke-[3]" />
                <ArrowDown className="lg:hidden h-5 w-5 stroke-[3]" />
              </div>

              {/* İlçeler Grid */}
              <div
                ref={districtGridRef}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 w-full lg:w-auto shrink-0 scroll-mt-20"
              >
                {districtList.flat().map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDistrict(d);
                      setShowCategoryOptions(false);
                      setMainCategory('');
                      setSubOption('');
                      scrollToElement(categoryCardRef);
                    }}
                    className={`h-10 px-3 sm:px-4 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer flex items-center justify-between w-full ${
                      district.toLowerCase() === d.toLowerCase()
                        ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{d}</span>
                    {district.toLowerCase() === d.toLowerCase() && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ADIM 2 KARTI: İmalat Türü Kartı ── */}
          {district && (
            <>
              {/* Ok İkonu */}
              <div className="flex items-center justify-center shrink-0 text-blue-400 py-1 lg:py-0">
                <ArrowRight className="hidden lg:block h-6 w-6 stroke-[3]" />
                <ArrowDown className="lg:hidden h-5 w-5 stroke-[3]" />
              </div>

              <button
                ref={categoryCardRef}
                type="button"
                onClick={() => {
                  setShowCategoryOptions(true);
                  scrollToElement(categoryGridRef);
                }}
                className={`w-full lg:w-44 h-14 sm:h-36 lg:h-40 rounded-2xl border backdrop-blur-xl p-3 sm:p-4 flex flex-row lg:flex-col items-center justify-between lg:justify-center text-left lg:text-center shrink-0 shadow-lg transition-all cursor-pointer scroll-mt-20 ${
                  showCategoryOptions || mainCategory
                    ? 'border-blue-500/80 bg-blue-500/10 shadow-blue-500/10 ring-2 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 lg:flex-col lg:gap-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                    showCategoryOptions || mainCategory
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    İmalat Türü
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {mainCategory ? (
                    <span className="text-blue-400 flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-lg">
                      <Check className="h-3 w-3" />
                      {mainCategory}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-bold">Tıklayın →</span>
                  )}
                </p>
              </button>
            </>
          )}

          {/* ── ADIM 2 İÇERİĞİ: Ana Kategoriler ── */}
          {district && showCategoryOptions && (
            <>
              {/* Ok İkonu */}
              <div className="flex items-center justify-center shrink-0 text-blue-400 py-1 lg:py-0">
                <ArrowRight className="hidden lg:block h-6 w-6 stroke-[3]" />
                <ArrowDown className="lg:hidden h-5 w-5 stroke-[3]" />
              </div>

              {/* Kategoriler Buton Grubu */}
              <div
                ref={categoryGridRef}
                className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 w-full lg:w-auto shrink-0 scroll-mt-20"
              >
                {['Ana Hat', 'Servis Hattı', 'Servis Kutusu'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setMainCategory(cat as any);
                      setSubOption('');
                      scrollToElement(subOptionsGridRef);
                    }}
                    className={`h-11 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-between w-full ${
                      mainCategory === cat
                        ? 'bg-blue-500 text-slate-950 font-black border-blue-400 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    {mainCategory === cat && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ADIM 3 İÇERİĞİ: Alt Seçenekler ── */}
          {district && mainCategory && (
            <>
              {/* Ok İkonu */}
              <div className="flex items-center justify-center shrink-0 text-emerald-400 py-1 lg:py-0">
                <ArrowRight className="hidden lg:block h-6 w-6 stroke-[3]" />
                <ArrowDown className="lg:hidden h-5 w-5 stroke-[3]" />
              </div>

              {/* Alt Seçenekler */}
              <div
                ref={subOptionsGridRef}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 w-full lg:w-auto shrink-0 scroll-mt-20"
              >
                {categorySubOptions[mainCategory]?.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSubOption(sub);
                      scrollToElement(submitButtonRef);
                    }}
                    className={`h-10 px-4 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center justify-between w-full ${
                      subOption === sub
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 font-black shadow-md scale-[1.02]'
                        : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{sub}</span>
                    {subOption === sub && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </>
          )}

        </div>

        {/* ── BÜYÜK ALT İŞE BAŞLA BUTONU ── */}
        {district && mainCategory && subOption && (
          <div
            ref={submitButtonRef}
            className="flex items-center justify-center pt-4 w-full max-w-lg mx-auto pb-12 scroll-mt-20"
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 sm:h-16 text-base sm:text-lg font-black tracking-wider uppercase rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-2xl shadow-emerald-600/30 ring-2 ring-emerald-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>İş Başlatılıyor...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 text-white fill-white" />
                  <span>İŞE BAŞLA ({district.toUpperCase()} - {subOption})</span>
                </>
              )}
            </button>
          </div>
        )}

      </form>

    </div>
  );
}
