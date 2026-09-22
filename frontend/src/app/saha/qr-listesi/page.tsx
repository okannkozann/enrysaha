'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { qrService } from '@/lib/services/qrService';
import { authService } from '@/lib/services/authService';
import { QRPackage, User } from '@/types';
import { LogOut, ClipboardList, PackageSearch, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MobileQRListPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrPackages, setQrPackages] = useState<QRPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentFieldUser().then(user => {
      setCurrentUser(user);
      loadQRs(user.teamId!);
    });
  }, []);

  const loadQRs = async (teamId: string) => {
    const all = await qrService.getQrPackages();
    const assigned = all.filter(qr => qr.assignedTeamId === teamId && (qr.status === 'SENT' || qr.status === 'VIEWED'));
    
    if (assigned.length > 0) {
      // Sort by sentAt or createdAt descending
      assigned.sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime());
      
      // Auto-redirect to the most recent one
      router.replace(`/saha/qr-listesi/${assigned[0].id}`);
      return;
    }

    setQrPackages(assigned);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-5 sticky top-0 z-10 flex justify-between items-start shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servis Kutuları</h1>
          <div className="text-slate-400 text-sm mt-1">Size atanan listeler</div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" asChild>
          <Link href="/">
            <LogOut className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sol Menü (Side Navigation) */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-6 h-fit sticky top-24">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">Saha Menüsü</div>
            <Link href="/saha" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <ClipboardList className="h-5 w-5" /> 
              Bildirim İşlemleri
            </Link>
            <Link href="/saha/qr-listesi" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all bg-slate-900 text-white shadow-md">
              <PackageSearch className="h-5 w-5" /> 
              Servis Kutuları
            </Link>
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mt-2">Güncel Listeler</h2>
        
        {loading ? (
          <div className="text-center py-8 text-slate-500">Yükleniyor...</div>
        ) : qrPackages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
            <PackageSearch className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">Henüz size gönderilmiş bir servis kutusu listesi bulunmuyor.</p>
          </div>
        ) : (
          qrPackages.map(qr => (
            <Card key={qr.id} className={`border-l-4 shadow-sm ${qr.status === 'VIEWED' ? 'border-l-blue-500 bg-white' : 'border-l-emerald-500 bg-emerald-50/30'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-slate-400" />
                    {qr.id}
                  </div>
                  {qr.status === 'SENT' && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">Yeni</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 my-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Kayıt Sayısı</div>
                    <div className="font-bold text-slate-900">{qr.serviceBoxIds.length} Servis Kutusu</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Oluşturulma</div>
                    <div className="font-semibold text-slate-700">{formatDate(qr.createdAt)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">İlçeler</div>
                    <div className="font-semibold text-slate-700">{qr.filters.districts.length > 0 ? qr.filters.districts.join(', ') : 'Tümü'}</div>
                  </div>
                </div>

                <Button className="w-full font-bold bg-slate-900 hover:bg-slate-800" asChild>
                  <Link href={`/saha/qr-listesi/${qr.id}`}>
                    LİSTEYİ AÇ
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      </div>
    </div>
  );
}
