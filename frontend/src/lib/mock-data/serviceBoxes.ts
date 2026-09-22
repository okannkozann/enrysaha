import { ServiceBox, ServiceStatus } from '@/types';

// Helper to generate random waiting days
const randomDays = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate 125 mock service boxes
export const mockServiceBoxes: ServiceBox[] = Array.from({ length: 125 }).map((_, i) => {
  const id = `SB-${(i + 1).toString().padStart(4, '0')}`;
  const connectionObject = `7010${1000 + i}`;
  const districts = ['Kepez', 'Muratpaşa', 'Konyaaltı', 'Aksu', 'Döşemealtı'];
  const district = districts[i % districts.length];
  
  const neighborhoods: Record<string, string[]> = {
    'Kepez': ['Yükseliş', 'Fabrikalar', 'Ahatlı', 'Kültür'],
    'Muratpaşa': ['Lara', 'Şirinyalı', 'Kızıltoprak', 'Meydankavağı'],
    'Konyaaltı': ['Liman', 'Hurma', 'Arapsuyu', 'Gürsu'],
    'Aksu': ['Macun', 'Çalkaya'],
    'Döşemealtı': ['Yeniköy', 'Yeşilbayır']
  };
  const nbList = neighborhoods[district];
  const neighborhood = nbList[i % nbList.length];

  // ~30% have empty lastStatus
  const isEmptyStatus = i % 3 === 0;
  const statuses: ServiceStatus[] = ['Planlandı', 'Devam Ediyor', 'Bekliyor', 'Tamamlandı'];
  const lastStatus = isEmptyStatus ? '' : statuses[i % statuses.length];

  return {
    id,
    connectionObject,
    address: `${neighborhood} Mah. ${i + 10}. Sokak No:${(i % 50) + 1}`,
    district,
    neighborhood,
    agreementDate: `2026-09-${(i % 20 + 1).toString().padStart(2, '0')}`,
    waitingDays: randomDays(1, 90),
    lastStatus,
    name: `Müşteri ${i + 1}`,
    phone: `0532${Math.floor(1000000 + Math.random() * 9000000)}`,
    sectorInfo: `07220000${(i % 5) + 1}SK${10 + (i % 5)}`,
    sectorRegionInfo: `7220000${(i % 5) + 1}`
  };
});
