'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { WorkSession, User } from '@/types';
import {
  Play, CheckCircle2, ArrowRight, Flame
} from 'lucide-react';

export default function BildirimIslemleriPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSessions, setActiveSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => {
      setCurrentUser(user);
      if (user?.teamId) {
        workSessionService.getActiveWorkSessions(user.teamId).then(setActiveSessions);
      }
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 w-full space-y-4 max-w-6xl mx-auto">

      {/* Page Header Bar (Only active session indicator if active) */}
      {activeSessions.length > 0 && (
        <div className="w-full flex justify-end shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
            <span>{activeSessions.length} Aktif İş</span>
          </div>
        </div>
      )}

      {/* 2 Selectable Cards - Positioned Top & Centered */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-2 pb-6 w-full">

        {/* ── CARD 1: İŞE BAŞLAMA ── */}
        <Link
          href="/saha/ise-baslama"
          className="group relative w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-2xl p-4 sm:p-7 flex flex-col items-center justify-between text-center transition-all duration-300 hover:scale-105 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer overflow-hidden shrink-0 active:scale-95"
        >
          {/* Accent glow effect */}
          <div className="absolute -right-10 -top-10 sm:-right-14 sm:-top-14 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-emerald-500/10 blur-xl sm:blur-2xl group-hover:bg-emerald-500/25 transition-all duration-500 pointer-events-none" />

          {/* Top Icon Badge */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20 mt-1 shrink-0">
            <Play className="h-5 w-5 sm:h-8 sm:w-8 text-white stroke-[2.5] ml-0.5" />
          </div>

          {/* Card Titles */}
          <div className="space-y-1 sm:space-y-2 my-auto">
            <h2 className="text-sm sm:text-xl font-black text-white group-hover:text-emerald-300 transition-colors tracking-tight">
              İşe Başlama
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 leading-tight sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-3">
              Yeni boru hattı veya altyapı imalatı başlatın. İlçe ve boru türünü belirleyin.
            </p>
          </div>

          {/* Bottom Action Arrow */}
          <div className="w-full pt-2 sm:pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0">
            <span>Forma Git</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* ── CARD 2: İMALAT TAMAMLA ── */}
        <Link
          href="/saha/imalat-tamamla"
          className="group relative w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-2xl p-4 sm:p-7 flex flex-col items-center justify-between text-center transition-all duration-300 hover:scale-105 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer overflow-hidden shrink-0 active:scale-95"
        >
          {/* Accent glow effect */}
          <div className="absolute -right-10 -top-10 sm:-right-14 sm:-top-14 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-blue-500/10 blur-xl sm:blur-2xl group-hover:bg-blue-500/25 transition-all duration-500 pointer-events-none" />

          {/* Top Icon Badge */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20 mt-1 shrink-0">
            <CheckCircle2 className="h-5 w-5 sm:h-8 sm:w-8 text-white stroke-[2.5]" />
          </div>

          {/* Card Titles */}
          <div className="space-y-1 sm:space-y-2 my-auto">
            <h2 className="text-sm sm:text-xl font-black text-white group-hover:text-blue-300 transition-colors tracking-tight">
              İmalat Tamamla
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 leading-tight sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-3">
              Devam eden görevi sonlandırın ve gerçekleşen metre/adet imalat bilgisini girin.
            </p>
          </div>

          {/* Bottom Action Arrow */}
          <div className="w-full pt-2 sm:pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
            <span>Forma Git</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>

    </div>
  );
}
