'use client';
import { Construction } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Construction className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Sayfa Yapım Aşamasında
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Operasyon haritası modülü güncelleniyor.
        </p>
      </div>
    </div>
  );
}

