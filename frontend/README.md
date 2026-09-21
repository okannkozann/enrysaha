# ENERYA Saha Yapım Takip ve Operasyon Platformu - Frontend Prototipi

Bu proje, ENERYA'nın saha yapım operasyonlarını dijitalleştirmek, servis kutusu bekleme sürelerini yönetmek ve saha ekiplerinin günlük bildirimlerini merkezileştirmek amacıyla hazırlanmış bir **frontend prototipidir**.

## Projenin Amacı

Mevcut Excel ve WhatsApp tabanlı süreçlerin yerini alacak olan bu sistemin prototipi;
- Merkez ofis (Yapım Mühendisi)
- Saha Ekibi

rolleri için modern, sade, veri odaklı ve ölçeklenebilir bir arayüz (UI) sunar. Şimdilik herhangi bir backend, veritabanı veya SAP entegrasyonu içermez, ancak mimari olarak bunlara kolayca entegre edilebilecek şekilde (Service Pattern kullanılarak) tasarlanmıştır.

## Teknoloji Stack

- **Framework:** Next.js (App Router)
- **Dil:** TypeScript (Strict Mode)
- **Stil & UI:** Tailwind CSS, shadcn/ui
- **İkonlar:** Lucide React
- **Harita:** React-Leaflet
- **Grafikler:** Recharts
- **Durum Yönetimi:** Zustand

## Kurulum ve Çalıştırma

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Temel Özellikler ve Modüller

1. **Dashboard:** KPI kartları, aktif ekip durumları ve günlük özetler.
2. **Servis Kutuları:** SAP'den gelecek olan açık iş listesi ve bekleme süresine (SLA) göre önceliklendirme.
3. **QR Yönetimi:** Saha ekibinin taratması için sektörel dinamik QR kod oluşturma.
4. **Saha Mobil Ekranı:** QR üzerinden açılan ve saha personelinin sahada yapacağı bildirimler ile kritik listeyi görebileceği "Mobile-First" ekranlar (`/saha/[sector]`).
5. **Saha Bildirimleri:** Sabah işe başlama ve akşam iş bitirme (imalat metrajı dahil) formları.
6. **Harita (Map):** React-Leaflet kullanılarak tasarlanmış operasyon haritası.

## Gelecekte Backend ve SAP Entegrasyonu

Frontend kodu, bileşenler (`components/`) ve veriye erişim (`lib/services/`) olarak katmanlara ayrılmıştır. Şu anki servisler (`serviceBoxService.ts` vb.) `lib/mock-data/` altındaki mock JSON verilerini dönmektedir. 

Gerçek backend (Örn: ASP.NET Core API) ve SAP entegrasyonu yapıldığında, `lib/services/` altındaki sınıfların içindeki asenkron fonksiyonlar gerçek HTTP isteklerine (`fetch` veya `axios`) dönüştürülerek UI hiç bozulmadan production'a alınabilir.
