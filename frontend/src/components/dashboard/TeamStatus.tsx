import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldTeam } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TeamStatus({ teams }: { teams: FieldTeam[] }) {
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Aktif': return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'Tamamlandı': return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      case 'Bekliyor': return "bg-slate-100 text-slate-800 hover:bg-slate-100";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-100";
    }
  };

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Aktif Ekipler</CardTitle>
          <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" asChild>
            <Link href="/teams">Tüm Ekipler</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="flex items-start justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{team.code}</span>
                  <Badge variant="outline" className={getStatusClass(team.status)}>
                    {team.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  {team.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-indigo-600">
                  {team.todayProductionMeters > 0 ? `${team.todayProductionMeters} m imalat` : 'İmalat yok'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Son bil: {team.lastReportTime || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
