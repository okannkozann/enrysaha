'use client';
import { FieldTeam } from "@/types";
import Link from "next/link";
import { Users, ChevronRight, MapPin, HardHat, ShieldCheck } from "lucide-react";

function statusStyle(status: string) {
  switch (status) {
    case 'Aktif':
      return {
        dot: 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)] animate-pulse',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
        label: 'Sahada Aktif'
      };
    case 'Tamamlandı':
      return {
        dot: 'bg-blue-400',
        badge: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
        label: 'Görevi Bitti'
      };
    default:
      return {
        dot: 'bg-slate-500',
        badge: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
        label: 'Beklemede'
      };
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
            <span className="text-sm font-semibold text-slate-100">Saha Ekipleri & Vardiya</span>
            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              {activeCount} Aktif / {teams.length} Toplam
            </span>
          </div>
        </div>
        <Link
          href="/yapim/teams"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-blue-300 transition-colors"
        >
          Ekip Yönetimi <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-700/25 max-h-[480px]">
        {teams.length === 0 && (
          <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
            Kayıtlı saha ekibi bulunamadı
          </div>
        )}
        {teams.map((team) => {
          const s = statusStyle(team.status);
          return (
            <div
              key={team.id}
              className="p-4 hover:bg-slate-700/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Code, badge & workType */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {team.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-slate-300 mt-1">
                      {team.workType || 'Genel İmalat'}
                    </div>

                    {/* Supervisors & Controllers info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400">
                      {team.eneryaEmployee?.name && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <HardHat className="h-3 w-3 text-amber-400/80" />
                          <span>{team.eneryaEmployee.name}</span>
                        </div>
                      )}
                      {team.controlCompany?.name && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <ShieldCheck className="h-3 w-3 text-blue-400/80" />
                          <span>{team.controlCompany.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Location */}
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/40 border border-slate-600/30 text-[11px] font-semibold text-slate-300">
                    <MapPin className="h-3 w-3 text-red-400" />
                    {team.district}
                  </div>
                  {team.neighborhood && (
                    <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[100px]">
                      {team.neighborhood}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
