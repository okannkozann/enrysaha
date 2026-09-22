'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { teamService } from '@/lib/services/teamService';
import { workSessionService } from '@/lib/services/workSessionService';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { FieldTeam, WorkSession, ServiceBox } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Map, HardHat, Building2, UserCircle2, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<FieldTeam | null>(null);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [serviceBoxes, setServiceBoxes] = useState<ServiceBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await teamService.getTeamById(teamId);
      if (data) {
        setTeam(data);
        
        // Load sessions mapping to this team (mock linking by teamCode/name)
        const allSessions = await workSessionService.getWorkSessions();
        const teamSessions = allSessions.filter(s => s.teamName === data.code);
        setSessions(teamSessions);

        // Load service boxes
        const allBoxes = await serviceBoxService.getServiceBoxes();
        const assignedBoxes = allBoxes.filter(b => data.serviceBoxIds.includes(b.id));
        setServiceBoxes(assignedBoxes);
      }
      setLoading(false);
    }
    load();
  }, [teamId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Ekip bilgileri yükleniyor...</div>;
  if (!team) return <div className="p-8 text-center text-red-500">Ekip bulunamadı.</div>;

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Aktif': return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'Tamamlandı': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'Bekliyor': return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getWaitingClass = (days: number) => {
    if (days <= 7) return 'bg-red-50 text-red-700 border-red-200';
    if (days <= 15) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (days <= 30) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  // Metrics
  const criticalBoxes = serviceBoxes.filter(b => b.waitingDays <= 7).length;
  const todayMeters = sessions.filter(s => s.status === 'COMPLETED' && s.quantityMeters).reduce((sum, s) => sum + (s.quantityMeters || 0), 0);
  const lastSession = sessions.sort((a, b) => new Date(`${b.startDate}T${b.startTime}`).getTime() - new Date(`${a.startDate}T${a.startTime}`).getTime())[0];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/yapim/teams')} className="rounded-full shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              {team.code}
              <Badge variant="outline" className={`${getStatusClass(team.status)} font-semibold shadow-sm ml-2`}>
                {team.status}
              </Badge>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Atama Tarihi: {team.assignmentDate}</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => alert('Harita modalında mock lokasyon gösterilecek: ' + team.lat + ', ' + team.lng)}>
            <Map className="h-4 w-4 text-blue-600" />
            Haritada Göster
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personel Yapısı */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm rounded-2xl h-full">
            <CardHeader className="bg-slate-900 text-white rounded-t-2xl pb-4 pt-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Personel Yapısı
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />
                
                {/* Enerya */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-sm mb-4">
                    <Building2 className="h-5 w-5" />
                    ENERYA
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <UserCircle2 className="h-10 w-10 text-slate-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{team.eneryaEmployee.name}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">Enerya Personeli</p>
                    </div>
                  </div>
                </div>

                {/* Kontrol */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-emerald-600 font-bold uppercase tracking-wider text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-5 w-5" />
                      KONTROL FİRMASI
                    </div>
                    <span className="text-xs bg-emerald-100 px-2 py-1 rounded text-emerald-800">{team.controlCompany.name}</span>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <UserCircle2 className="h-10 w-10 text-slate-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{team.controlEmployee.name}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">Kontrol Personeli</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operasyon Özeti */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm rounded-2xl h-full bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Operasyon Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Sorumlu Bölge</span>
                <span className="font-bold text-slate-900 text-right">{team.district} <br/><span className="text-xs font-normal text-slate-500">{team.neighborhood}</span></span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">İmalat Türü</span>
                <span className="font-bold text-slate-900">{team.workType}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Servis Kutusu</span>
                <span className="font-bold text-slate-900">{team.serviceBoxIds.length} <span className="text-xs text-red-500 font-normal ml-1">({criticalBoxes} Kritik)</span></span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Bugünkü Metraj</span>
                <span className="font-bold text-indigo-600">{todayMeters > 0 ? `${todayMeters} m` : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Son Bildirim</span>
                <span className="font-bold text-slate-900">{lastSession ? lastSession.startTime : '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servis Kutuları */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold">Atanan Servis Kutuları ({serviceBoxes.length})</CardTitle>
              <Button variant="outline" size="sm">Yönet</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Bağlantı Nesnesi</th>
                    <th className="px-6 py-3">Adres</th>
                    <th className="px-6 py-3 text-center">Bekleme</th>
                    <th className="px-6 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceBoxes.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-500">Servis kutusu atanmamış.</td></tr>
                  ) : (
                    serviceBoxes.map(box => (
                      <tr key={box.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-bold text-blue-600">{box.connectionObject}</td>
                        <td className="px-6 py-3 text-slate-700">{box.address}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${getWaitingClass(box.waitingDays)}`}>
                            {box.waitingDays} Gün
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium">{box.lastStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Saha Bildirimleri Geçmişi */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm rounded-2xl h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Bugünkü Bildirimler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm">Henüz bildirim yapılmadı.</p>
                ) : (
                  sessions.map(session => (
                    <div key={session.id} className={`p-4 rounded-xl border ${session.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} relative`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-900">{session.workType}</div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {session.startTime}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        {session.status === 'COMPLETED' ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            Tamamlandı ({session.quantityMeters}m)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Devam Ediyor
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
