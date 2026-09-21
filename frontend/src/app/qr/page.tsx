'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, Download, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function QRManagementPage() {
  const [sector, setSector] = useState<string>('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!sector) {
      toast({
        title: 'Hata',
        description: 'Lütfen QR oluşturmak için bir sektör seçin.',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, this would be an absolute URL pointing to the deployed site
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setGeneratedQR(`${baseUrl}/saha/${sector}`);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">QR Yönetimi</h1>
        <p className="text-sm text-slate-500 mt-1">Saha ekipleri için sektör bazlı güncel servis kutusu listesi QR'ı oluşturun</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>QR Oluştur</CardTitle>
            <CardDescription>Saha ekibinin tarayacağı bağlantıyı hazırlayın.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sektör Bölgesi</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Sektör seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72200003">72200003 - Kepez Bölgesi</SelectItem>
                  <SelectItem value="72200011">72200011 - Muratpaşa Bölgesi</SelectItem>
                  <SelectItem value="72200025">72200025 - Konyaaltı Bölgesi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button onClick={handleGenerate} className="w-full gap-2" size="lg">
                <QrCode className="h-5 w-5" />
                QR Kodu Üret
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedQR && (
          <Card className="shadow-sm border-blue-100 bg-blue-50/30">
            <CardHeader>
              <CardTitle>QR Önizleme</CardTitle>
              <CardDescription>Bu QR kodu saha ekibiyle paylaşabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <QRCodeSVG 
                  value={generatedQR} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm font-medium text-slate-600 mt-6 break-all text-center">
                Bağlantı: {generatedQR}
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4 border-t border-blue-100 pt-4">
              <Button variant="outline" size="sm" className="gap-2 bg-white">
                <Printer className="h-4 w-4" /> Yazdır
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-white">
                <Download className="h-4 w-4" /> İndir
              </Button>
              <Button size="sm" className="gap-2">
                <Share2 className="h-4 w-4" /> Paylaş
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
