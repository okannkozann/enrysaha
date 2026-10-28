import { ServiceBox, ServiceStatus } from '@/types';

// Helper to generate random waiting days
const randomDays = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Realistic sector codes including the user-specified 072200002SK35
const SECTOR_LIST = [
  '072200002SK35', // Gazlandı olarak işaretlenecek
  '072200001SK10',
  '072200001SK11',
  '072200003SK15',
  '072200004SK20',
  '072200005SK30',
  '072200006SK40',
];

// Generate 125 mock service boxes
export const mockServiceBoxes: ServiceBox[] = Array.from({ length: 125 }).map((_, i) => {
  const id = `SB-${(i + 1).toString().padStart(4, '0')}`;
  const connectionObject = `7010${1000 + i}`;
  const sectorInfo = SECTOR_LIST[i % SECTOR_LIST.length];
  const sectorRegionInfo = sectorInfo.slice(0, 8);

  let district: string;
  let neighborhood: string;
  let streetName: string;

  if (sectorInfo === '072200002SK35') {
    district = 'Kepez';
    neighborhood = 'Fabrikalar';
    const streets = ['Fikri Erten Caddesi', '3024. Sokak', '3028. Sokak'];
    streetName = streets[i % streets.length];
  } else {
    const districts = ['Kepez', 'Muratpaşa', 'Konyaaltı', 'Aksu', 'Döşemealtı'];
    district = districts[i % districts.length];
    
    const neighborhoods: Record<string, string[]> = {
      'Kepez': ['Yükseliş', 'Fabrikalar', 'Ahatlı', 'Kültür'],
      'Muratpaşa': ['Lara', 'Şirinyalı', 'Kızıltoprak', 'Meydankavağı'],
      'Konyaaltı': ['Liman', 'Hurma', 'Arapsuyu', 'Gürsu'],
      'Aksu': ['Macun', 'Çalkaya'],
      'Döşemealtı': ['Yeniköy', 'Yeşilbayır']
    };
    const nbList = neighborhoods[district] || ['Merkez'];
    neighborhood = nbList[i % nbList.length];
    streetName = `${i + 10}. Sokak`;
  }

  // Gerçekçi durum dağılımı:
  // Önemli kısım: Son durumu "boş" ('' / 'Boş') olanlar ve inşaat halinde vb. nedenleri olanlar
  const otherReasons: ServiceStatus[] = [
    'Bağlantı Anlaşması İnşaat Halinde Yapıldı',
    'İnşaat Halinde',
    'Tamamlandı',
    'Ruhsat Bekliyor',
  ];
  // Yaklaşık %50 boş (engel yok, yapılabilir), %50 diğer durumlar
  const isEmptyStatus = i % 2 === 0;
  const lastStatus = isEmptyStatus ? '' : otherReasons[(i / 2) % otherReasons.length];

  const waitingDays = i % 3 === 0 ? randomDays(76, 96) : randomDays(10, 74);

  return {
    id,
    connectionObject,
    address: `${neighborhood} Mah. ${streetName} No:${(i % 50) + 1}`,
    district,
    neighborhood,
    agreementDate: `2026-09-${(i % 20 + 1).toString().padStart(2, '0')}`,
    waitingDays,
    lastStatus,
    name: `Müşteri ${i + 1}`,
    phone: `0532${Math.floor(1000000 + Math.random() * 9000000)}`,
    sectorInfo,
    sectorRegionInfo,
  };
});
