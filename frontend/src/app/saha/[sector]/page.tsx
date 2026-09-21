'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MobileFieldScreen() {
  const params = useParams();
  const [boxes, setBoxes] = useState<ServiceBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (params.sector) {
        const data = await serviceBoxService.getServiceBoxesBySector(params.sector as string);
        // Sort by waiting days descending (most critical first)
        data.sort((a, b) => b.waitingDays - a.waitingDays);
        setBoxes(data);
        setLoading(false);
      }
    }
    loadData();
  }, [params.sector]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Kayıtlar yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-blue-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold tracking-tight">ENERYA SAHA</h1>
        <div className="text-blue-200 text-sm mt-1 flex justify-between items-center">
          <span>Sektör {params.sector}</span>
          <span className="bg-blue-800 px-2 py-0.5 rounded text-xs">{new Date().toLocaleDateString('tr-TR')}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-600 font-medium">Toplam <span className="text-slate-900 font-bold">{boxes.length}</span> kayıt</div>
          <select className="text-sm border-slate-200 rounded-md bg-slate-50 py-1 px-2 text-slate-700">
            <option>Tüm Mahalleler</option>
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          <Button variant="secondary" size="sm" className="rounded-full shrink-0 bg-blue-100 text-blue-800 hover:bg-blue-200 snap-start">Tümü</Button>
          <Button variant="outline" size="sm" className="rounded-full shrink-0 border-red-200 text-red-700 bg-red-50 snap-start">0-7 Gün</Button>
          <Button variant="outline" size="sm" className="rounded-full shrink-0 border-orange-200 text-orange-700 bg-orange-50 snap-start">8-15 Gün</Button>
          <Button variant="outline" size="sm" className="rounded-full shrink-0 snap-start">16-30 Gün</Button>
        </div>

        <div className="space-y-4">
          {boxes.map((box) => (
            <Card key={box.id} className="shadow-sm border-slate-200 overflow-hidden">
              <div className={`h-1.5 w-full ${box.waitingDays <= 7 ? 'bg-red-500' : box.waitingDays <= 15 ? 'bg-orange-500' : 'bg-slate-300'}`} />
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {box.waitingDays <= 7 && <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
                    {box.waitingDays > 7 && box.waitingDays <= 15 && <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
                    <span className="font-bold text-lg text-slate-900">{box.waitingDays} Gün Kaldı</span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100">{box.lastStatus}</Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Bağlantı Nesnesi</span>
                    <p className="font-medium text-slate-900">{box.connectionObject}</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">{box.address}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{box.neighborhood}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-700">{box.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-700">Anlaşma: {box.agreementDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50" asChild>
                    <Link href={`/service-boxes/${box.id}`}>Detay</Link>
                  </Button>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/map">Harita</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {boxes.length === 0 && (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-500 font-medium">Bu bölgede aktif iş bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
