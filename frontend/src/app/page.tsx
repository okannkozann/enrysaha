'use client';
import Link from 'next/link';
import {
  Building2, HardHat, ArrowRight, ShieldCheck,
  Activity, MapPin, QrCode, Sparkles, Layers,
  Compass, Radio
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-5 sm:p-8 md:p-12 relative overflow-hidden selection:bg-blue-500/30 selection:text-white">

      {/* ── Ambient Background Lighting ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-blue-600/12 blur-[130px]" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-emerald-600/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-indigo-500/5 blur-[150px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
      </div>

      {/* ── Top Bar: Minimal Logo & System Status ── */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-black text-white text-sm tracking-tighter">E</span>
          </div>
          <div>
            <span className="font-black text-lg tracking-wider text-white">ENERYA</span>
            <span className="text-[10px] text-slate-500 font-semibold ml-2 uppercase tracking-widest hidden sm:inline">
              Doğalgaz Altyapı
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-medium text-slate-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Sistem Çevrimiçi • Antalya</span>
        </div>
      </header>

      {/* ── Center Content: Hero & Minimal Module Cards ── */}
      <main className="relative z-10 max-w-5xl w-full mx-auto my-auto py-10 sm:py-16 space-y-10 sm:space-y-12">

        {/* Hero Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>Saha Yapım & Operasyon Platformu</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Çalışma Modülünü Seçin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Yetkinize ve görevinize uygun operasyon merkezine bağlanın.
          </p>
        </div>

        {/* 2 Symmetrical Premium Glassmorphism Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* 1. Yapım Ofisi Kartı */}
          <Link
            href="/yapim/dashboard"
            className="group relative rounded-3xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-[0_0_40px_rgba(59,130,246,0.18)] hover:-translate-y-1 overflow-hidden"
          >
            {/* Ambient hover glow */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />

            <div>
              {/* Icon & Category Pill */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300 shadow-sm shadow-blue-500/10">
                  <Building2 className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  Mühendislik & Ofis
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-200 transition-colors">
                Yapım Ofisi
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                Servis kutusu yasal SLA süreleri, ilçe yapım analitiği, canlı operasyon haritası ve dijital QR iş emri yönetimi.
              </p>

              {/* Minimalist Feature Pills */}
              <div className="flex flex-wrap gap-1.5 mt-5">
                {['SLA & Yasal Takip', 'Operasyon Haritası', 'QR İş Emri', 'Ekip Yönetimi'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px] font-medium text-slate-400 group-hover:border-slate-600 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                Ofis Modülüne Giriş
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shadow-sm">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* 2. Yapım Saha Kartı */}
          <Link
            href="/saha"
            className="group relative rounded-3xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-900/80 hover:shadow-[0_0_40px_rgba(16,185,129,0.18)] hover:-translate-y-1 overflow-hidden"
          >
            {/* Ambient hover glow */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />

            <div>
              {/* Icon & Category Pill */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300 shadow-sm shadow-emerald-500/10">
                  <HardHat className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Saha Ekipleri
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-200 transition-colors">
                Yapım Saha
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                Günlük PE ve servis hattı metraj girişleri, vardiya başlama / bitiş bildirimleri ve mobil QR paket tarama arayüzü.
              </p>

              {/* Minimalist Feature Pills */}
              <div className="flex flex-wrap gap-1.5 mt-5">
                {['Canlı Metraj Girişi', 'Vardiya Bildirimi', 'Mobil QR Tarama', 'Saha Durumu'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px] font-medium text-slate-400 group-hover:border-slate-600 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                Saha Modülüne Giriş
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:border-emerald-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shadow-sm">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

        </div>
      </main>

      {/* ── Footer: Minimal System Credentials ── */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 max-w-5xl w-full mx-auto pt-6 border-t border-slate-800/60">
        <div>
          ENERYA Doğalgaz Dağıtım A.Ş. • Saha Yapım Takip Platformu
        </div>
        <div className="flex items-center gap-3">
          <span>v2.4</span>
          <span>•</span>
          <span>Antalya Bölge Müdürlüğü</span>
        </div>
      </footer>

    </div>
  );
}
