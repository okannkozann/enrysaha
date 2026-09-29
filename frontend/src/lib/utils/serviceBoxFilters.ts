import { ServiceBox } from '@/types';

export interface QRFilters {
  lastStatus: "EMPTY" | "OTHER" | null;
  districts: string[];
  neighborhoods?: string[];
  sectors?: string[];
  sort: "ASC" | "DESC" | null;
  over90Days?: boolean;
}

export function filterServiceBoxesForQR(boxes: ServiceBox[], filters: QRFilters): ServiceBox[] {
  let list = boxes.filter(box => {
    // Son Durum mantığı (boş ise emptyStatus = true)
    const emptyStatus = !box.lastStatus || box.lastStatus.trim() === '';
    
    if (filters.lastStatus) {
      if (filters.lastStatus === "EMPTY" && !emptyStatus) return false;
      if (filters.lastStatus === "OTHER" && emptyStatus) return false;
    }

    // İlçe mantığı (districts boş ise tümü geçerli)
    if (filters.districts && filters.districts.length > 0 && (!box.district || !filters.districts.includes(box.district))) {
      return false;
    }

    // Mahalle mantığı (neighborhoods boş ise tümü geçerli)
    if (filters.neighborhoods && filters.neighborhoods.length > 0 && (!box.neighborhood || !filters.neighborhoods.includes(box.neighborhood))) {
      return false;
    }

    // Sektör mantığı (sectors boş ise tümü geçerli)
    if (filters.sectors && filters.sectors.length > 0) {
      const sectorVal = box.sectorInfo || box.sectorRegionInfo;
      if (!sectorVal || !filters.sectors.includes(sectorVal)) {
        return false;
      }
    }
    
    // > 90 Gün Filtresi
    if (filters.over90Days && (box.waitingDays === undefined || box.waitingDays <= 90)) {
      return false;
    }
    
    return true;
  });

  // Sıralama mantığı (Bekleme Süresi)
  if (filters.sort) {
    list = list.sort((a, b) => {
      if (filters.sort === "DESC") return (b.waitingDays || 0) - (a.waitingDays || 0);
      return (a.waitingDays || 0) - (b.waitingDays || 0);
    });
  }

  return list;
}
