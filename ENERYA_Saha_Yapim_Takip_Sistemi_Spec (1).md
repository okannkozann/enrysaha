# ENERYA Saha Yapım Takip ve Operasyon Platformu

## 1. Dokümanın Amacı

Bu doküman, ENERYA Yapım operasyonlarında kullanılan mevcut SAP → günlük Excel → ofis/saha takibi → WhatsApp akışını, tek bir modern web uygulaması üzerinde dijitalleştirmek için hazırlanmıştır.

Projenin temel amacı mevcut işleyişi gereksiz yere değiştirmek değil; **servis kutusu sürelerini saha ekibine hızlı biçimde sunmak, sabah/akşam saha bildirimlerini standartlaştırmak, yapılan imalatları merkezi olarak kaydetmek ve saha ilerleyişini harita üzerinde görselleştirmek**tir.

İlk sürümün ana odağı dört modüldür:

1. **Saha QR / Servis Kutusu Bilgi Modülü**
2. **Saha Günlük İmalat Bildirim Modülü**
3. **Merkezi Operasyon Dashboard'u**
4. **Saha Haritası ve İlerleyiş Görselleştirme Modülü**

Sistem ilk aşamada SAP'den her gün alınan Excel dosyasını veri kaynağı olarak kullanacaktır. İlerleyen aşamada doğrudan SAP entegrasyonuna geçilebilecek şekilde tasarlanacaktır.

---

# 2. Mevcut Operasyon

## 2.1. Mevcut akış

```text
Üst Yönetim
    ↓
Yapılacak bölge / öncelik kararı
    ↓
Harita Birimi
    ↓
Tatbikat / bölge bilgisi
    ↓
Yapım Mühendisliği
    ├── Planlama
    ├── Saha ekiplerine iş yönlendirme
    └── Saha imalatlarının ofisten takibi
    ↓
Saha Ekibi
    ├── PE ana hat
    ├── ST çelik hat
    ├── Servis hattı
    └── Servis kutusu ile ilgili işler
    ↓
WhatsApp
    ├── Sabah: ekip + bölge + yapılan/planlanan imalat
    └── Akşam: ekip + bölge + yapılan imalat
    ↓
Ofis takibi
```

## 2.2. Servis kutusu süre kuralı

Bağlantı başvurusu ve bağlantı anlaşması tamamlandıktan sonra servis kutusunun **90 gün içerisinde takılması gerekmektedir**.

Operasyonel bağımlılık:

```text
Bağlantı anlaşması
        ↓
90 günlük yasal süre
        ↓
Ana hat imalatı
        ↓
Servis hattı imalatı
        ↓
Servis kutusu montajı
```

Bu nedenle servis kutusu bekleme süresi saha planlamasında kritik bir parametredir.

---

# 3. Proje Vizyonu

## 3.1. Nihai hedef

> SAP'den gelen güncel servis kutusu verilerini QR tabanlı mobil saha ekranına aktaran, saha ekiplerinin WhatsApp yerine uygulama üzerinden günlük imalat bildirimi yaptığı ve bu gerçekleşmelerin tek bir dashboard ile harita üzerinde izlenebildiği merkezi bir saha yapım platformu oluşturmak.

## 3.2. Temel veri prensibi

**SAP = ana/kaynak veri**  
**Saha uygulaması = gerçekleşen operasyon verisi**  
**Dashboard = kaynak veri + saha gerçekleşmesi + görselleştirme**

---

# 4. SAP'den Gelen Excel Veri Seti

Mevcut SAP çıktısında çok sayıda kolon bulunmasına rağmen, ilk uygulama sürümünde yalnızca kullanıcının belirlediği alanlar sisteme alınacaktır.

## 4.1. Kullanılacak SAP alanları

| Uygulama alanı | Excel karşılığı | Kullanım |
|---|---|---|
| **Adres Bilgisi** | İlçe + Mahalle + Cadde + Bina No | Saha ekranı, arama, harita |
| **Bağlantı Nesnesi** | Bağlantı Nesnesi | Ana iş/abone referansı |
| **Bağlantı Anlaşma Tarihi** | Bağlantı Anlaş. Tar. | 90 günlük sürenin başlangıcı |
| **Bekleme Süresi** | Bklm.Süresi(Gün) | Önceliklendirme |
| **Son Durum** | Son Durum | Mevcut iş durumu |
| **İsim** | İSİM | Abone bilgisi |
| **Tel No** | Telefon No | Gerektiğinde iletişim |
| **Sektör Bilgisi** | Sektör Bilgisi | Operasyonel sektör/bölge |

### Önemli tanım

**Sektör Bilgisi, abonenin kullanım türü değildir.** Bu alan operasyonel olarak işin bağlı olduğu sektör/bölge bilgisini temsil eder.

## 4.2. Adres oluşturma

Excel'deki:

- İlçe
- Mahalle
- Cadde
- Bina No

alanları birleştirilerek uygulamanın standart **Adres Bilgisi** alanı oluşturulacaktır.

Örnek:

`KEPEZ / YÜKSELİŞ MAH. / KOCATEPE CD. / 58`

## 4.3. SAP verilerinin sisteme alınması

İlk sürümde:

```text
SAP
 ↓
Günlük Excel
 ↓
Excel Import
 ↓
Validasyon
 ↓
Veritabanı
```

İlerleyen sürümde:

```text
SAP
 ↓
Otomatik API / entegrasyon
 ↓
Veritabanı
```

---

# 5. Ana Sistem Mimarisi

```text
                          SAP
                           │
                    Günlük Excel / API
                           │
                           ▼
                  ┌─────────────────┐
                  │   DATA IMPORT   │
                  │ Validation/ETL  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    DATABASE     │
                  │ SQL Server /    │
                  │ PostgreSQL      │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌───────────┐
        │Dashboard │ │ QR /      │ │   Map     │
        │  Office  │ │ Mobile UI │ │  Module   │
        └────┬─────┘ └─────┬─────┘ └─────┬─────┘
             │              │             │
             │              ▼             │
             │       Saha Bildirimleri    │
             │              │             │
             └──────────────┴─────────────┘
                            │
                            ▼
                    Operasyonel kayıt
```

---

# 6. Modül 1 — Dashboard Üzerinden QR Yönetimi

Bu modül **ofis/yapım mühendisi tarafındadır**.

Amaç, saha ekibine servis kutularıyla ilgili güncel bilgiyi Excel veya WhatsApp yerine **QR kod aracılığıyla** sunmaktır.

## 6.1. QR oluşturma akışı

```text
Dashboard
   ↓
Saha ekibi / sektör seç
   ↓
QR oluştur
   ↓
QR'ı saha ekibine gönder
   ↓
Saha telefonu ile taratır
   ↓
Mobil servis kutusu ekranı açılır
```

QR kodun içinde servis kutusu bilgilerinin kendisi tutulmayacaktır.

QR, uygulamadaki güvenli bir URL'ye yönlendirecektir.

Örnek:

`https://saha-app/qr/team/04`

veya gerekli tasarıma göre:

`https://saha-app/qr/sector/72200011`

Böylece Excel her gün değişse bile QR'ın yeniden basılması/gönderilmesi gerekmez; QR açıldığında **en güncel veri** gösterilir.

## 6.2. Saha QR ekranı

Saha ekibinin telefonu için mobil öncelikli tasarlanacaktır.

Ekran yapısı:

```text
┌──────────────────────────────┐
│ ENERYA SAHA                  │
│ Sektör / Ekip                │
├──────────────────────────────┤
│ Servis Kutuları               │
│                              │
│ Filtre                       │
│ [Kalan Gün] [Mahalle]        │
│                              │
│ 🔴 7 gün                     │
│ Bağlantı Nesnesi: 70101794  │
│ Adres: ...                   │
│ Son Durum: ...               │
│                              │
│ 🟠 18 gün                    │
│ Bağlantı Nesnesi: ...       │
│ Adres: ...                   │
└──────────────────────────────┘
```

## 6.3. Zorunlu filtreler

Saha ekibi listeyi en az şu kriterlere göre filtreleyebilmelidir:

- **Kalan gün sayısı**
- **Mahalle**

## 6.4. Ek arama

Saha ekibi şu bilgilerle arama yapabilmelidir:

- Bağlantı Nesnesi
- Adres
- İsim

## 6.5. Kayıt detay ekranı

Bir kayıt seçildiğinde:

- Bağlantı Nesnesi
- Adres Bilgisi
- Bağlantı Anlaşma Tarihi
- Bekleme Süresi
- Son Durum
- İsim
- Tel No
- Sektör Bilgisi

görülebilir.

Yetkilendirme modeline bağlı olarak telefon numarası gizlenebilir veya yalnızca yetkili kullanıcıya gösterilebilir.

---

# 7. Modül 2 — Saha Günlük İmalat Bildirim Sistemi

Bu modül, WhatsApp üzerinden yapılan günlük saha bildirimlerinin uygulamaya taşınmasını sağlar.

## 7.1. Temel amaç

Mevcut:

```text
WhatsApp
Sabah bildirimi
+
Akşam bildirimi
```

yerine:

```text
Mobil uygulama
Sabah bildirimi
+
Akşam bildirimi
```

kullanılması.

## 7.2. Sabah bildirimi

Saha ekibi güne başlarken uygulamada bildirim oluşturur.

### Sabah ekranı

Alanlar:

- Saha ekibi
- Tarih
- Sektör/Bölge
- Mahalle
- Adres / çalışma konumu
- İmalat türü
- Başlangıç saati
- Açıklama (opsiyonel)

### İmalat türleri

Başlangıçta örnek seçenekler:

- PE Ana Hat
- ST Çelik Hat
- Servis Hattı
- Servis Kutusu
- Diğer

Bu liste ileride şirketin gerçek imalat türlerine göre yönetilebilir hale getirilecektir.

## 7.3. Akşam bildirimi

Gün sonunda saha ekibi yaptığı işi uygulama üzerinden tamamlar.

Alanlar:

- Saha ekibi
- Tarih
- Sektör/Bölge
- Mahalle
- Adres / çalışma konumu
- İmalat türü
- Yapılan imalat mesafesi (m)
- Bitiş saati
- Açıklama (opsiyonel)

Örneğin:

```text
Tarih: 21.09.2026
Ekip: Ekip 03
Sektör: 72200011
Mahalle: Meydankavağı
İmalat: PE Ana Hat
Mesafe: 185 m
```

## 7.4. Yer belirleme

Saha personelinin serbest metinle adres yazması minimumda tutulmalıdır.

Tercih edilen akış:

```text
Sektör seç
 ↓
Mahalle seç
 ↓
Sistem ilgili adresleri göster
 ↓
Adres seç
```

Gelişmiş sürümde:

```text
Haritadan konum seç
```

opsiyonu da eklenebilir.

Bu yaklaşım, WhatsApp mesajlarındaki serbest metin kaynaklı adres farklılıklarının önüne geçer.

---

# 8. Modül 3 — Merkezi Operasyon Dashboard'u

Dashboard, yapım mühendisinin günlük operasyonu izleyeceği ana ekrandır.

## 8.1. Ana ekran

Önerilen yapı:

```text
┌─────────────────────────────────────────────────────┐
│ ENERYA SAHA YAPIM TAKİP                             │
├──────────┬──────────┬──────────┬──────────┬────────┤
│ Toplam   │ ≤7 Gün   │ ≤15 Gün  │ ≤30 Gün  │ Aktif  │
│ Kayıt    │          │          │          │ Ekip   │
├─────────────────────────────────────────────────────┤
│                                                     │
│                  SAHA HARİTASI                      │
│                                                     │
│                                                     │
├─────────────────────────────┬───────────────────────┤
│ KRİTİK SERVİS KUTULARI      │ SAHA EKİPLERİ         │
│                             │                       │
│ Bağlantı No / Gün / Adres   │ Ekip 01 / Aktif      │
│ Bağlantı No / Gün / Adres   │ Ekip 02 / Aktif      │
│ ...                         │ Ekip 03 / Tamamlandı │
├─────────────────────────────┴───────────────────────┤
│ GÜNLÜK İMALAT GERÇEKLEŞMELERİ                       │
└─────────────────────────────────────────────────────┘
```

## 8.2. KPI'lar

İlk sürümde önerilen KPI'lar:

- Toplam kayıt
- 7 gün ve altı
- 15 gün ve altı
- 30 gün ve altı
- 90 güne yaklaşan işler
- 90 günü aşan işler
- Aktif saha ekipleri
- Günlük toplam imalat mesafesi
- Günlük tamamlanan iş sayısı
- İmalat türüne göre toplam mesafe

## 8.3. Filtreler

- Sektör Bilgisi
- İlçe
- Mahalle
- Kalan gün / bekleme süresi
- Son Durum
- Tarih
- Ekip
- İmalat türü

---

# 9. Modül 4 — Harita ve Saha İlerleyişi

Harita, sistemin en önemli görsel bileşenlerinden biridir.

## 9.1. Haritada gösterilecek bilgiler

### Servis kutusu tarafı

- Adres konumu
- Bekleme süresi
- Sektör
- Son durum

### Saha tarafı

- Ekibin bildirdiği çalışma konumu
- İmalat türü
- İmalat tarihi
- Yapılan mesafe
- Ekip
- İş başlangıç/bitiş bilgisi

## 9.2. Günlük saha görüntüsü

Dashboard'dan tarih seçilerek:

```text
18.09.2026
19.09.2026
20.09.2026
21.09.2026
```

gibi günler seçilebilmelidir.

Seçilen günde saha ekiplerinin bildirdiği işler harita üzerinde görüntülenmelidir.

## 9.3. İlerleyiş görselleştirmesi

Sistem zamanla şu yapıya dönüşebilir:

```text
Sabah
  ↓
Başlangıç konumu / iş
  ↓
Gün içindeki imalat kayıtları
  ↓
Akşam
  ↓
Tamamlanan iş + mesafe
```

Harita üzerinde noktalar, iş kayıtları veya ileride gerçek geometriler gösterilebilir.

### Önemli teknik not

Sadece "185 m imalat yapıldı" bilgisi, tek başına gerçek bir hat geometrisi üretmek için yeterli değildir.

Bu nedenle ilk sürümde:

- çalışma konumu nokta olarak gösterilebilir,
- imalat mesafesi noktanın bilgi kartında gösterilebilir.

Daha ileri sürümde saha ekibinden:

- başlangıç noktası,
- bitiş noktası

veya GPS/rota verisi alınarak gerçek imalat hattı harita üzerinde çizilebilir.

---

# 10. Saha Bildirimi → Dashboard Akışı

```text
Saha Ekibi
    │
    ├── Sabah
    │     └── İmalat / konum bildir
    │
    └── Akşam
          └── İmalat / konum / metre bildir
                 │
                 ▼
              API
                 │
                 ▼
            Database
                 │
        ┌────────┴─────────┐
        ▼                  ▼
   Dashboard             Harita
```

Ofis kullanıcısı saha bildirimini manuel olarak WhatsApp'tan okumak zorunda kalmadan uygulama üzerinden görebilecektir.

---

# 11. İş Akışı

## 11.1. Günlük saha operasyonu

```text
Sabah
 ↓
Ekip uygulamayı açar
 ↓
Sektör / mahalle / adres seçer
 ↓
İmalat türünü seçer
 ↓
"İşe Başladım"
 ↓
Gün içerisinde imalat yapılır
 ↓
Akşam
 ↓
Yapılan imalatı kapatır
 ↓
Mesafe bilgisini girer
 ↓
"Günü Tamamla"
 ↓
Dashboard ve harita güncellenir
```

## 11.2. QR kullanım akışı

```text
Yapım Mühendisi
 ↓
Dashboard
 ↓
Ekip / sektör seç
 ↓
QR oluştur
 ↓
Saha ekibine gönder
 ↓
Saha QR'ı tarar
 ↓
Güncel servis kutusu listesi
 ↓
Kalan gün + mahalle filtresi
 ↓
Kayıt detayı
```

---

# 12. Veritabanı Tasarımı — İlk Taslak

## 12.1. ServiceConnection

SAP'den gelen ana iş kayıtları.

```text
ServiceConnection
-----------------
id
connection_object
address
agreement_date
waiting_days
last_status
name
phone
sector_info
latitude
longitude
sap_import_date
created_at
updated_at
```

## 12.2. FieldTeam

```text
FieldTeam
---------
id
name
code
sector_info
is_active
created_at
updated_at
```

## 12.3. WorkReport

Saha ekibinin günlük bildirimidir.

```text
WorkReport
----------
id
team_id
report_date
report_type          // MORNING / EVENING
sector_info
neighborhood
address
work_type
connection_object    // ilgili servis kutusu işi varsa
start_time
end_time
work_length_meters
notes
latitude
longitude
created_at
updated_at
```

## 12.4. QRAccess

```text
QRAccess
--------
id
team_id
sector_info
token
is_active
created_at
expires_at
```

Nihai güvenlik tasarımına göre ekip/sector kapsamı ve token süresi belirlenir.

---

# 13. API Taslağı

## SAP / Import

```http
POST /api/import/sap-excel
GET  /api/import/history
```

## Servis kutuları

```http
GET /api/service-connections
GET /api/service-connections/{connectionObject}
```

## Sektörler

```http
GET /api/sectors
GET /api/sectors/{sector}
```

## QR

```http
POST /api/qr/create
GET  /api/qr/{token}
```

## Saha bildirimleri

```http
POST /api/work-reports/morning
POST /api/work-reports/evening
GET  /api/work-reports
GET  /api/work-reports/{id}
```

## Harita

```http
GET /api/map/service-connections
GET /api/map/work-reports?date=YYYY-MM-DD
```

---

# 14. Frontend Sayfaları

Önerilen Next.js route yapısı:

```text
/app
 ├── dashboard
 │    └── page.tsx
 │
 ├── service-connections
 │    ├── page.tsx
 │    └── [connectionObject]
 │         └── page.tsx
 │
 ├── field
 │    ├── page.tsx
 │    ├── morning
 │    │    └── page.tsx
 │    └── evening
 │         └── page.tsx
 │
 ├── qr
 │    └── [token]
 │         └── page.tsx
 │
 └── map
      └── page.tsx
```

---

# 15. Frontend Teknoloji Standardı

## Önerilen stack

### Web

- Next.js
- React
- TypeScript

### UI

- Tailwind CSS
- shadcn/ui

### Harita

- MapLibre GL JS

### Grafikler

- Recharts veya Apache ECharts

### QR

- QRCode.js veya uygun React QR kütüphanesi

### Form yönetimi

- React Hook Form
- Zod validation

---

# 16. Backend Teknoloji Standardı

Önerilen backend:

- ASP.NET Core Web API
- C#
- REST API
- Entity Framework Core
- Background jobs / scheduled import

İlk prototipte backend gerekmeksizin mock data ile frontend geliştirilebilir.

---

# 17. Geliştirme Fazları

## Faz 0 — UI Prototipi

Backend yoktur.

Amaç:

- Dashboard görünümü
- QR saha ekranı
- Sabah bildirim ekranı
- Akşam bildirim ekranı
- Harita görünümü
- Servis kutusu detay ekranı

Bu fazda örnek veriler kullanılır.

### Çıktı

Kullanıcı deneyimi ve ekran tasarımı onaylanmış olur.

---

## Faz 1 — Gerçek Excel Import

- Excel yükleme
- Kolon eşleştirme
- Veri validasyonu
- PostgreSQL/SQL Server'a kayıt
- Dashboard'un gerçek veri ile çalışması

---

## Faz 2 — QR Saha Modülü

- Dashboard'dan QR oluşturma
- Güvenli QR URL
- Mobil saha ekranı
- Kalan gün filtresi
- Mahalle filtresi
- Adres / bağlantı nesnesi araması
- Kayıt detayı

---

## Faz 3 — Dijital Saha Bildirimi

WhatsApp yerine uygulama üzerinden:

- Sabah bildirimi
- Akşam bildirimi
- İmalat türü
- Konum
- Yapılan metre
- Açıklama

---

## Faz 4 — Dashboard + Harita Entegrasyonu

- Günlük saha kayıtları
- Ekip bazlı görüntüleme
- Tarih filtresi
- İmalat türü filtresi
- Harita markerları
- Günlük ilerleyiş
- İmalat metrelerinin görselleştirilmesi

---

## Faz 5 — Otomasyon

- SAP'den otomatik veri alma
- Manuel Excel yükleme ihtiyacının azaltılması/kaldırılması
- Günlük otomatik veri yenileme
- Bildirimler
- SLA yaklaşma uyarıları

---

# 18. Güvenlik ve Yetkilendirme

QR üzerinden abone adı ve telefon numarası gibi kişisel bilgiler gösterileceği için erişim kontrolü tasarımın parçası olmalıdır.

Önerilen yapı:

### Ofis kullanıcıları

- Dashboard erişimi
- Saha raporlarını görme
- QR oluşturma
- Filtreleme
- Harita
- Raporlama

### Saha kullanıcıları

- Kendisine/ekibine ait QR kapsamındaki servis kutularını görme
- Sabah bildirimi
- Akşam bildirimi
- Kendi saha kayıtlarını görüntüleme

### Yönetici

- Tüm sektörler
- Tüm ekipler
- Tüm raporlar
- KPI'lar

Kurumsal sürümde Microsoft Entra ID / Azure AD ile kimlik doğrulama tercih edilmelidir.

---

# 19. UI / UX İlkeleri

- Desktop dashboard + mobile-first saha ekranı
- Basit ve hızlı saha kullanımı
- Saha personelinin minimum veri girmesi
- Serbest metin yerine seçimli alanlar
- Kritik sürelerin görsel olarak belirgin gösterilmesi
- Haritanın dashboard'un ana görsel bileşenlerinden biri olması
- Her ekranın birkaç dokunuşta kullanılabilmesi
- Büyük butonlar
- Hızlı yükleme
- İnternet bağlantısının zayıf olduğu durumlar için ileride offline/PWA desteğine açık mimari

---

# 20. Kritik Tasarım Kararları

## 20.1. QR içine veri koyulmayacak

QR sadece güvenli URL/token taşıyacaktır. Böylece veriler güncellendiğinde QR'ın kendisi değişmez.

## 20.2. Saha adresi mümkün olduğunca seçilecek

Saha ekibinin adresi WhatsApp'taki gibi serbest metin yazması yerine sistemdeki mevcut adreslerden seçim yapması tercih edilir.

## 20.3. Saha bildirimi ayrı veri olarak tutulacak

SAP'den gelen kayıt ile saha ekibinin söylediği gerçekleşme birbirine karıştırılmayacaktır.

## 20.4. Harita gerçek veriye dayanacak

Adresin harita üzerinde gösterilebilmesi için gerçek koordinat eşlemesi yapılmalıdır.

## 20.5. Gerçek imalat hattı sonradan geliştirilebilir

İlk sürümde çalışma noktaları + mesafe gösterilebilir. İlerleyen sürümde GPS/başlangıç-bitiş koordinatları ile gerçek imalat geometrisi oluşturulabilir.

---

# 21. İlk UI Prototipinde Olması Gereken Ekranlar

İlk kodlama aşamasında aşağıdaki ekranlar tamamlanmalıdır:

### Ekran 1 — Dashboard

- KPI kartları
- Filtreler
- Kritik servis kutuları
- Ekip durumu
- Harita özeti
- Günlük imalat özeti

### Ekran 2 — Servis Kutusu Listesi

- Kalan gün
- Mahalle
- Bağlantı Nesnesi
- Adres
- İsim
- Son Durum
- Sektör

### Ekran 3 — Servis Kutusu Detayı

Tek kaydın tüm bilgileri.

### Ekran 4 — QR Yönetimi

- Ekip/sektör seç
- QR oluştur
- QR önizle
- QR paylaş/gönder

### Ekran 5 — Saha Mobil Ana Ekranı

- QR'dan gelen servis kutusu listesi
- Kalan gün filtresi
- Mahalle filtresi
- Arama

### Ekran 6 — Sabah İmalat Bildirimi

- İş türü
- Yer
- Başlangıç
- Açıklama

### Ekran 7 — Akşam İmalat Bildirimi

- İş türü
- Yer
- Yapılan metre
- Bitiş
- Açıklama

### Ekran 8 — Saha Haritası

- Ekipler
- Günlük işler
- İmalat türü
- Konum
- Mesafe
- Tarih filtresi

---

# 22. Başarı Kriterleri

İlk kullanılabilir sürüm aşağıdaki sorulara tek platformdan cevap verebilmelidir:

1. Hangi servis kutularının süresi yaklaşıyor?
2. Hangi mahallede hangi kutular var?
3. Belirli bir bağlantı nesnesinin bilgileri nedir?
4. Hangi ekip bugün nerede çalışıyor?
5. Ekip bugün hangi imalatı yapıyor?
6. Gün sonunda kaç metre imalat yapıldı?
7. Hangi bölgelerde hangi imalatlar yapıldı?
8. Belirli bir tarihte saha nerelerde çalıştı?
9. Saha ekibinin WhatsApp mesajlarına ihtiyaç olmadan günlük gerçekleşme bilgisi görülebiliyor mu?
10. Yönetici tek ekranda genel operasyon durumunu görebiliyor mu?

---

# 23. MVP Tanımı

MVP, aşağıdaki üç temel akışın çalıştığı sürümdür:

### Akış A — QR

```text
Dashboard
 ↓
QR oluştur
 ↓
Saha taratır
 ↓
Güncel servis kutusu listesi
 ↓
Kalan gün + mahalle filtreleri
 ↓
Detay
```

### Akış B — Saha Bildirimi

```text
Saha
 ↓
Sabah bildirimi
 ↓
İmalat
 ↓
Akşam bildirimi
 ↓
Mesafe
 ↓
Kayıt
```

### Akış C — Görselleştirme

```text
Saha kaydı
 ↓
Database
 ↓
Dashboard
 ↓
Harita
 ↓
Günlük saha ilerleyişi
```

---

# 24. Sonraki Geliştirme Potansiyeli

İlk sistem başarılı olduktan sonra aşağıdaki özellikler eklenebilir:

- SAP ile otomatik entegrasyon
- Microsoft Entra ID giriş sistemi
- Push/e-posta bildirimleri
- 90 günlük sürenin kritik eşik uyarıları
- Otomatik ekip planlama önerileri
- Saha fotoğrafı ekleme
- İş emri yönetimi
- Gerçek GPS/rota takibi
- İmalat güzergâhının gerçek çizimi
- Geçmiş performans analizi
- Ekip bazlı KPI
- Sektör bazlı KPI
- Günlük/haftalık/aylık raporlar
- Excel/PDF çıktı
- Mobil PWA

---

# 25. Sonuç

Bu proje, mevcut SAP ve saha operasyonlarının yerine geçen yeni bir sistem olarak değil, mevcut operasyonu **dijital olarak görünür ve ölçülebilir hale getiren bir saha yönetim platformu** olarak ele alınacaktır.

İlk odak:

**QR ile saha bilgi erişimi + uygulama üzerinden sabah/akşam saha bildirimi + merkezi dashboard + harita görselleştirme**.

Teknik yaklaşım:

**Next.js + React + TypeScript + ASP.NET Core + SQL Server/PostgreSQL + MapLibre**.

İlk geliştirme adımı backend değildir. Önce gerçek kullanıcı akışlarını temsil eden **UI prototipi** tamamlanacak, ekranlar ve kullanıcı deneyimi doğrulandıktan sonra backend ve veri katmanı devreye alınacaktır.
