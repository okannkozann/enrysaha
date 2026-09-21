import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceBox } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CriticalServiceBoxes({ boxes }: { boxes: ServiceBox[] }) {
  
  const getBadgeVariant = (days: number) => {
    if (days <= 7) return "destructive";
    if (days <= 15) return "warning";
    return "secondary";
  };

  const getBadgeClass = (days: number) => {
    if (days <= 7) return "bg-red-100 text-red-800 hover:bg-red-100";
    if (days <= 15) return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    return "bg-slate-100 text-slate-800 hover:bg-slate-100";
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Kritik Servis Kutuları</CardTitle>
          <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" asChild>
            <Link href="/service-boxes">Tümünü Gör</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {boxes.map((box) => (
            <div key={box.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{box.connectionObject}</span>
                  <Badge variant="outline" className={getBadgeClass(box.waitingDays)}>
                    {box.waitingDays} Gün Kaldı
                  </Badge>
                </div>
                <div className="text-sm text-slate-500 truncate max-w-[300px]">
                  {box.address}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                  {box.sectorRegionInfo}
                </span>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" asChild>
                  <Link href={`/service-boxes/${box.id}`}>Detay</Link>
                </Button>
              </div>
            </div>
          ))}
          {boxes.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4">Kritik iş bulunmuyor.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
