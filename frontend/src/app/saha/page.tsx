'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workSessionService } from '@/lib/services/workSessionService';
import { authService } from '@/lib/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { WorkType, WorkSession, User } from '@/types';
import { LogOut, ClipboardList, PackageSearch } from 'lucide-react';
import Link from 'next/link';

export default function MobileFieldReportPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reportType, setReportType] = useState<'START' | 'COMPLETED'>('START');
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<WorkSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<WorkSession[]>([]);

  // Form State - İşe Başlama
  const [sector, setSector] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');

  // Form State - İşi Tamamlama
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [meters, setMeters] = useState('');

  // Otomatik Bilgiler (Zaman)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Demo user'ı getir
    authService.getCurrentFieldUser().then(user => setCurrentUser(user));

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser?.teamId) {
      loadSessions();
    }
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser?.teamId) return;
    const active = await workSessionService.getActiveWorkSessions(currentUser.teamId);
    setActiveSessions(active);
    
    // Sadece bugünkü tamamlanmış işleri mock data'dan çekmek için tümünü alıp filtreleyebiliriz:
    const all = await workSessionService.getWorkSessions();
    const completed = all.filter(ws => ws.teamId === currentUser.teamId && ws.status === "COMPLETED");
    setCompletedSessions(completed);

    if (active.length > 0 && !selectedSessionId) {
      setSelectedSessionId(active[0].id);
    }
  };

  const handleStartWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector || !workType) {
      toast({ title: 'Hata', description: 'Lütfen sektör ve imalat türünü seçin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.createWorkSession({
        teamId: currentUser!.teamId!,
        teamName: currentUser!.teamName!,
        sector,
        workType: workType as WorkType,
        startDate: now.toISOString().split('T')[0],
        startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      });

      toast({ title: 'Başarılı', description: 'İşe başlama bildirimi kaydedildi.' });
      setSector('');
      setWorkType('');
      loadSessions();
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir sorun oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const meterVal = Number(meters);
    if (!selectedSessionId || !meterVal || meterVal <= 0) {
      toast({ title: 'Hata', description: 'Lütfen aktif bir iş seçin ve geçerli metraj girin.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      await workSessionService.completeWorkSession(
        selectedSessionId,
        meterVal,
        now.toISOString().split('T')[0],
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );

      toast({ title: 'Başarılı', description: 'İmalat başarıyla tamamlandı.' });
      setMeters('');
      setSelectedSessionId('');
      loadSessions();
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir sorun oluştu.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const selectedActiveSession = activeSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-5 sticky top-0 z-10 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saha Bildirimi</h1>
          <div className="text-slate-400 text-sm mt-1">Günlük saha bildirimi</div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" asChild>
          <Link href="/">
            <LogOut className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="p-4 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sol Menü (Side Navigation) */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-6 h-fit sticky top-24">
          
          {/* Ana Modüller */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">Saha Menüsü</div>
            <Link href="/saha" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all bg-slate-900 text-white shadow-md">
              <ClipboardList className="h-5 w-5" /> 
              Bildirim İşlemleri
            </Link>
            <Link href="/saha/qr-listesi" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <PackageSearch className="h-5 w-5" /> 
              Servis Kutuları
            </Link>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-6">

          {/* Toggle / Segmented Control */}
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${reportType === 'START' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setReportType('START')}
            >
              İşe Başlama
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${reportType === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setReportType('COMPLETED')}
            >
              Tamamlandı
            </button>
          </div>

        {reportType === 'START' ? (
          <form onSubmit={handleStartWork} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-600 font-semibold">Sektör</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="h-14 bg-white border-slate-200 text-base shadow-sm">
                    <SelectValue placeholder="Sektör Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="072200003SK16">072200003SK16</SelectItem>
                    <SelectItem value="072200011SK13">072200011SK13</SelectItem>
                    <SelectItem value="072200018SK10">072200018SK10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 font-semibold">İmalat Türü</Label>
                <Select value={workType} onValueChange={(v) => setWorkType(v as WorkType)}>
                  <SelectTrigger className="h-14 bg-white border-slate-200 text-base shadow-sm">
                    <SelectValue placeholder="İmalat Türü Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE Ana Hat">PE Ana Hat</SelectItem>
                    <SelectItem value="ST Çelik Hat">ST Çelik Hat</SelectItem>
                    <SelectItem value="Servis Hattı">Servis Hattı</SelectItem>
                    <SelectItem value="Servis Kutusu">Servis Kutusu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl space-y-2 border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tarih:</span>
                <span className="font-semibold text-slate-800">{formatDate(currentTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Saat:</span>
                <span className="font-semibold text-slate-800">{formatTime(currentTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ekip:</span>
                <span className="font-semibold text-slate-800">{currentUser?.teamName || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Durum:</span>
                <span className="font-semibold text-blue-600">Devam Ediyor</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center border-t border-slate-200 pt-2">Bu bilgiler sistem tarafından otomatik atanır.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800">
              {loading ? 'İşleniyor...' : 'İŞE BAŞLA'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCompleteWork} className="space-y-6">
            {activeSessions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                Aktif işiniz bulunmuyor.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">Aktif İş Seçimi</Label>
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger className="h-auto py-3 bg-white border-slate-200 shadow-sm">
                      <SelectValue placeholder="İş Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col text-left py-1 gap-1">
                            <span className="font-semibold text-slate-900">{s.sector}</span>
                            <span className="text-xs text-slate-500">{s.workType} (Başlangıç: {s.startTime})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedActiveSession && (
                  <div className="bg-slate-100 p-4 rounded-xl space-y-2 border border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sektör:</span>
                      <span className="font-semibold text-slate-800">{selectedActiveSession.sector}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">İmalat Türü:</span>
                      <span className="font-semibold text-slate-800">{selectedActiveSession.workType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Başlangıç:</span>
                      <span className="font-semibold text-slate-800">{selectedActiveSession.startTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bitiş Saati (Otomatik):</span>
                      <span className="font-semibold text-slate-800">{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Durum:</span>
                      <span className="font-semibold text-emerald-600">Tamamlandı</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold">İmalat Metrajı</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="Örn: 125" 
                      value={meters}
                      onChange={(e) => setMeters(e.target.value)}
                      className="h-16 text-lg font-semibold pl-4 pr-16 bg-white border-slate-200 shadow-sm"
                      min="1"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-6 text-slate-500 font-medium border-l border-slate-200 ml-2">
                      metre
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800">
                  {loading ? 'İşleniyor...' : 'İMALATI TAMAMLA'}
                </Button>
              </>
            )}
          </form>
        )}

        {/* Bugünkü Çalışmalarım */}
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Bugünkü Çalışma</h2>
          
          {activeSessions.length === 0 && completedSessions.length === 0 && (
             <div className="text-sm text-slate-500 italic">Kayıt bulunamadı.</div>
          )}

          {activeSessions.map(session => (
            <Card key={session.id} className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{session.teamName}</div>
                    <div className="font-bold text-slate-900">{session.sector}</div>
                  </div>
                  <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    Devam Ediyor
                  </div>
                </div>
                <div className="text-sm text-slate-700 font-medium mb-3">{session.workType}</div>
                <div className="flex text-xs text-slate-500 gap-4">
                  <div>Başlangıç: <span className="font-medium text-slate-700">{session.startTime}</span></div>
                </div>
                
                {reportType !== 'COMPLETED' && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-xs font-semibold border-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      setReportType('COMPLETED');
                      setSelectedSessionId(session.id);
                    }}
                  >
                    İMALATI TAMAMLA
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {completedSessions.map(session => (
            <Card key={session.id} className="border-l-4 border-l-emerald-500 shadow-sm opacity-80">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{session.teamName}</div>
                    <div className="font-bold text-slate-900">{session.sector}</div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Tamamlandı
                  </div>
                </div>
                <div className="text-sm text-slate-700 font-medium mb-3">{session.workType}</div>
                <div className="flex flex-wrap text-xs text-slate-500 gap-x-4 gap-y-2">
                  <div>Süre: <span className="font-medium text-slate-700">{session.startTime} – {session.endTime}</span></div>
                  <div>Metraj: <span className="font-bold text-slate-900">{session.quantityMeters} m</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
