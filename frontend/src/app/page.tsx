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

          </div>
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


              {/* Title & Description */}
              <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-200 transition-colors">
                Yapım Ofis
              </h2>



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


              {/* Title & Description */}
              <h2 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-200 transition-colors">
                Yapım Saha
              </h2>



            </div>


          </Link>

        </div>
      </main>



    </div>
  );
}
