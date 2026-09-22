'use client';
import { useEffect, useState } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import { WorkSession } from '@/types';
import { FilterBar } from '@/components/dashboard/FilterBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';

export default function FieldReportsPage() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await workSessionService.getWorkSessions();
      setSessions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const openDrawer = (session: WorkSession) => {
    setSelectedSession(session);
    setIsDrawerOpen(true);
  };

  // KPIs Mock Data calculations based on sessions
  const activeCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalMeters = sessions.reduce((acc, curr) => acc + (curr.quantityMeters || 0), 0);
  const activeTeams = new Set(sessions.map(s => s.teamId)).size;
  const totalReports = sessions.length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Saha Bildirimleri</h1>
          <p className="text-sm text-slate-500 mt-1">Saha ekiplerinin günlük çalışma ve imalat bildirimleri</p>
        </div>
        <div className="text-xs text-slate-400">Son güncelleme: {new Date().toLocaleString('tr-TR')}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bugünkü Aktif İşler</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tamamlanan İşler</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top. İmalat</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalMeters} m</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aktif Ekip</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{activeTeams}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bildirim</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalReports}</div>
          </CardContent>
        </Card>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Bildirimler yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="font-semibold text-slate-600">Tarih</TableHead>
                  <TableHead className="font-semibold text-slate-600">Ekip</TableHead>
                  <TableHead className="font-semibold text-slate-600">Sektör</TableHead>
                  <TableHead className="font-semibold text-slate-600">İmalat Türü</TableHead>
                  <TableHead className="font-semibold text-slate-600">Başlangıç</TableHead>
                  <TableHead className="font-semibold text-slate-600">Bitiş</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Metraj</TableHead>
                  <TableHead className="font-semibold text-slate-600">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow 
                    key={session.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => openDrawer(session)}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {new Date(session.startDate).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{session.teamName}</TableCell>
                    <TableCell className="font-medium text-slate-900">{session.sector}</TableCell>
                    <TableCell className="text-slate-600">{session.workType}</TableCell>
                    <TableCell className="text-slate-600">{session.startTime}</TableCell>
                    <TableCell className="text-slate-600">{session.endTime || '—'}</TableCell>
                    <TableCell className="text-right">
                      {session.quantityMeters ? (
                        <span className="font-semibold text-slate-900">{session.quantityMeters} <span className="text-xs font-normal text-slate-500">m</span></span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        session.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {session.status === 'COMPLETED' ? '🟢 Tamamlandı' : '🟠 Devam Ediyor'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      Bildirim bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Günlük İlerleme Timeline */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Bugünkü Saha İlerlemesi</h2>
              <div className="space-y-4">
                {sessions.sort((a,b) => b.startTime.localeCompare(a.startTime)).map((s, idx) => (
                  <div key={`${s.id}-${idx}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {idx !== sessions.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-xs font-bold text-slate-500">{s.status === 'COMPLETED' ? s.endTime : s.startTime}</div>
                      <div className="text-sm font-medium text-slate-900">{s.teamName} {s.status === 'COMPLETED' ? 'tamamlandı' : 'başladı'}</div>
                      {s.quantityMeters && <div className="text-xs text-slate-500 mt-0.5">{s.quantityMeters} m imalat</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drawer for details */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-w-md mx-auto h-[85vh]">
          <DrawerHeader className="border-b border-slate-100 pb-4">
            <DrawerTitle className="text-xl">Saha Çalışması Detayı</DrawerTitle>
            <DrawerDescription>
              {selectedSession?.teamName} tarafından yapılan bildirim.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 overflow-y-auto space-y-6">
            {selectedSession && (
              <>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Ekip</div>
                    <div className="font-semibold text-slate-900">{selectedSession.teamName}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Sektör</div>
                    <div className="font-semibold text-slate-900">{selectedSession.sector}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">İmalat Türü</div>
                    <div className="font-semibold text-slate-900">{selectedSession.workType}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Durum</div>
                    <div className={`font-bold ${selectedSession.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedSession.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor'}
                    </div>
                  </div>
                  
                  <div className="col-span-2 border-t border-slate-100 pt-4 mt-2"></div>
                  
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Başlangıç</div>
                    <div className="font-semibold text-slate-900">
                      {new Date(selectedSession.startDate).toLocaleDateString('tr-TR')} {selectedSession.startTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Bitiş</div>
                    <div className="font-semibold text-slate-900">
                      {selectedSession.endDate ? `${new Date(selectedSession.endDate).toLocaleDateString('tr-TR')} ${selectedSession.endTime}` : 'Devam ediyor'}
                    </div>
                  </div>
                  
                  {selectedSession.quantityMeters && (
                    <div className="col-span-2 bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                      <div className="text-sm font-medium text-slate-600">Toplam Metraj</div>
                      <div className="text-xl font-bold text-slate-900">{selectedSession.quantityMeters} <span className="text-sm text-slate-500">m</span></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DrawerFooter className="border-t border-slate-100">
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Haritada Göster
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-12">Kapat</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
