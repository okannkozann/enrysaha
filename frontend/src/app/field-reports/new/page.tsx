'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { useToast } from '@/components/ui/use-toast';
import { WorkType } from '@/types';

export default function NewFieldReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [loading, setLoading] = useState(false);

  // Form State
  const [team, setTeam] = useState('team-01');
  const [sector, setSector] = useState('72200003');
  const [district, setDistrict] = useState('Kepez');
  const [neighborhood, setNeighborhood] = useState('Yükseliş');
  const [address, setAddress] = useState('');
  const [workType, setWorkType] = useState<WorkType>('PE Ana Hat');
  const [meters, setMeters] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast({
        title: 'Hata',
        description: 'Lütfen çalışma adresi giriniz.',
        variant: 'destructive',
      });
      return;
    }

    if (reportType === 'EVENING' && !meters) {
      toast({
        title: 'Hata',
        description: 'Lütfen yapılan imalat mesafesini giriniz.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      await fieldReportService.createFieldReport({
        teamId: team,
        reportType,
        date: now.toISOString().split('T')[0],
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        sectorRegionInfo: sector,
        district,
        neighborhood,
        address,
        workType,
        productionMeters: reportType === 'EVENING' ? Number(meters) : undefined,
        description,
        status: reportType === 'MORNING' ? 'Devam Ediyor' : 'Tamamlandı'
      });

      toast({
        title: 'Başarılı',
        description: 'Çalışma bildirimi başarıyla oluşturuldu.',
      });

      // Reset form
      setAddress('');
      setMeters('');
      setDescription('');
      
      // Optionally redirect
      // router.push('/saha/' + sector);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bildirim kaydedilirken bir sorun oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-blue-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold tracking-tight">Saha Bildirimi</h1>
        <div className="text-blue-200 text-sm mt-1">Günlük operasyon bilgisi girin</div>
      </div>

      <div className="p-4 max-w-lg mx-auto mt-4">
        <div className="flex bg-slate-200 p-1 rounded-lg mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'MORNING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setReportType('MORNING')}
          >
            Sabah (İşe Başlama)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'EVENING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setReportType('EVENING')}
          >
            Akşam (İşi Tamamlama)
          </button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="team">Ekip</Label>
                <Select value={team} onValueChange={setTeam}>
                  <SelectTrigger id="team" className="h-12">
                    <SelectValue placeholder="Ekip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team-01">Ekip 01</SelectItem>
                    <SelectItem value="team-02">Ekip 02</SelectItem>
                    <SelectItem value="team-03">Ekip 03</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="district">İlçe</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger id="district" className="h-12">
                      <SelectValue placeholder="İlçe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kepez">Kepez</SelectItem>
                      <SelectItem value="Muratpaşa">Muratpaşa</SelectItem>
                      <SelectItem value="Konyaaltı">Konyaaltı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood">Mahalle</Label>
                  <Select value={neighborhood} onValueChange={setNeighborhood}>
                    <SelectTrigger id="neighborhood" className="h-12">
                      <SelectValue placeholder="Mahalle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yükseliş">Yükseliş</SelectItem>
                      <SelectItem value="Kültür">Kültür</SelectItem>
                      <SelectItem value="Meydankavağı">Meydankavağı</SelectItem>
                      <SelectItem value="Uncalı">Uncalı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Çalışma Adresi</Label>
                <Input 
                  id="address" 
                  placeholder="Cadde, sokak veya bağlantı nesnesi" 
                  className="h-12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workType">İmalat Türü</Label>
                <Select value={workType} onValueChange={(val) => setWorkType(val as WorkType)}>
                  <SelectTrigger id="workType" className="h-12">
                    <SelectValue placeholder="İmalat türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE Ana Hat">PE Ana Hat</SelectItem>
                    <SelectItem value="ST Çelik Hat">ST Çelik Hat</SelectItem>
                    <SelectItem value="Servis Hattı">Servis Hattı</SelectItem>
                    <SelectItem value="Servis Kutusu">Servis Kutusu</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'EVENING' && (
                <div className="space-y-1.5">
                  <Label htmlFor="meters">Yapılan İmalat Mesafesi (m)</Label>
                  <div className="relative">
                    <Input 
                      id="meters" 
                      type="number" 
                      placeholder="Örn: 125" 
                      className="h-12 pr-12"
                      value={meters}
                      onChange={(e) => setMeters(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 font-medium">
                      m
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                <Textarea 
                  id="description" 
                  placeholder="Eklemek istediğiniz notlar..." 
                  className="resize-none h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Kaydediliyor...' : (reportType === 'MORNING' ? 'İşe Başlama Bildirimini Gönder' : 'İmalatı Kaydet')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
