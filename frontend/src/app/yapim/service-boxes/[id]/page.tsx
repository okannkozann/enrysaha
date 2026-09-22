'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, User, Phone, Calendar, Clock, Activity, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ServiceBoxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [box, setBox] = useState<ServiceBox | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (params.id) {
        const data = await serviceBoxService.getServiceBoxById(params.id as string);
        if (data) setBox(data);
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
  }

  if (!box) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Kayıt Bulunamadı</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Servis Kutusu: {box.connectionObject}</h1>
          <p className="text-sm text-slate-500 mt-1">İlgili bağlantı nesnesine ait detaylar ve saha geçmişi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> Abone ve Adres Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Abone Adı</span>
                <p className="font-semibold text-slate-900">{box.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Telefon
                </span>
                <p className="font-semibold text-slate-900">{box.phone}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Adres
              </span>
              <p className="font-medium text-slate-900 text-lg leading-relaxed">
                {box.address}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {box.district} / {box.neighborhood}
              </p>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <Button asChild>
                <Link href="/map">Haritada Göster</Link>
              </Button>
              <Button variant="outline">
                Saha Ekibine İlet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" /> Operasyon Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1 flex-1">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Bekleme Süresi
                </span>
                <p className="text-2xl font-bold text-slate-900">{box.waitingDays} <span className="text-sm font-normal text-slate-500">Gün</span></p>
              </div>
              <div className="space-y-1 flex-1 text-right">
                <span className="text-sm font-medium text-slate-500">Durum</span>
                <p className="font-semibold text-slate-900">{box.lastStatus}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Anlaşma Tarihi
                </span>
                <p className="font-semibold text-slate-900">{box.agreementDate}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Sektör Bilgisi</span>
                <p className="font-semibold text-slate-900">{box.sectorInfo}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Bölge Bilgisi</span>
                <p className="font-semibold text-slate-900">{box.sectorRegionInfo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">İmalat İlerleme Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-900">Ana Hat</h4>
                <p className="text-sm text-emerald-700 mt-1">Hazır</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900">Servis Hattı</h4>
                <p className="text-sm text-slate-500 mt-1">Bekliyor</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900">Servis Kutusu</h4>
                <p className="text-sm text-slate-500 mt-1">Bekliyor</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
