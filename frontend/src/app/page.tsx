'use client';
import Link from 'next/link';
import { Building2, HardHat, LogIn, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'engineer' | 'field'>('engineer');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Demo Header */}
      <div className="absolute top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-50">
        <div className="font-bold tracking-tight text-xl">ENERYA</div>
      </div>

      <div className="max-w-4xl w-full mt-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Yapım Operasyon Sistemi
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Saha imalatlarının merkezi olarak izlenmesi ve günlük operasyon bildirimlerinin kolayca yapılması için geliştirilmiş entegre platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Yapım Modülü Kartı */}
          <Link href="/yapim/dashboard" className="block relative group rounded-3xl border-2 transition-all duration-300 bg-white p-8 overflow-hidden shadow-sm hover:shadow-xl border-slate-200 hover:border-blue-600 hover:ring-4 hover:ring-blue-600/10 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <Building2 size={32} />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-4">YAPIM OFİSİ</h2>
            <p className="text-slate-600 mb-10 h-12">
              Operasyon takibi, servis kutuları, saha bildirimleri, harita ve detaylı raporlar.
            </p>
            
            <div className="flex items-center justify-between w-full p-4 rounded-xl font-bold text-lg transition-all bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
              Yapım Modülüne Gir
              <ArrowRight />
            </div>
          </Link>

          {/* Saha Modülü Kartı */}
          <Link href="/saha" className="block relative group rounded-3xl border-2 transition-all duration-300 bg-white p-8 overflow-hidden shadow-sm hover:shadow-xl border-slate-200 hover:border-emerald-600 hover:ring-4 hover:ring-emerald-600/10 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
              <HardHat size={32} />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-4">YAPIM SAHA</h2>
            <p className="text-slate-600 mb-10 h-12">
              Günlük saha çalışmaları ve imalat detaylarının kolayca bildirildiği mobil arayüz.
            </p>
            
            <div className="flex items-center justify-between w-full p-4 rounded-xl font-bold text-lg transition-all bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white">
              Saha Modülüne Gir
              <ArrowRight />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
