'use client';
import { FieldTeam } from "@/types";
import Link from "next/link";
import { Users, ChevronRight, MapPin } from "lucide-react";

function statusStyle(status: string) {
  switch (status) {
    case 'Aktif':      return { dot: 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' };
    case 'Tamamlandı': return { dot: 'bg-blue-400',   badge: 'bg-blue-500/15 text-blue-300 border-blue-500/25' };
    default:           return { dot: 'bg-slate-500',  badge: 'bg-slate-700/50 text-slate-400 border-slate-600/30' };
  }
}

export function TeamStatus({ teams }: { teams: FieldTeam[] }) {
  const activeCount = teams.filter((t) => t.status === 'Aktif').length;

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">Aktif Ekipler</span>
            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">{activeCount}</span>
          </div>
        </div>
        <Link
          href="/teams"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-slate-200 transition-colors"
        >
          Tümü <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-700/25">
        {teams.length === 0 && (
          <div className="flex items-center justify-center py-10 text-slate-600 text-sm">Ekip bulunamadı</div>
        )}
        {teams.map((team) => {
          const s = statusStyle(team.status);
          return (
            <div key={team.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-100">{team.code}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${s.badge}`}>
                      {team.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{team.workType || '—'}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="flex items-center gap-1 justify-end text-[11px] font-medium text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {team.district}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[90px]">
                  {team.neighborhood}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
