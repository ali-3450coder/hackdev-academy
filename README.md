# HackDev Academy

> Güvenlik perspektifli, profesyonel Full Stack Developer eğitim platformu.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![License](https://img.shields.io/badge/Lisans-Kapalı%20Kaynak-red)

## Proje Hakkında

HackDev Academy, HTML, CSS ve JavaScript'i güvenlik perspektifiyle öğreten web tabanlı bir eğitim platformudur. Kullanıcı kayıt/giriş sistemi, bölüm bazlı ilerleme takibi, interaktif quizler ve detaylı aktivite loglarıyla eksiksiz bir öğrenme deneyimi sunar.

## Özellikler

- **3 Kapsamlı Bölüm** — Web Temelleri, HTML Etiketleri, Profesyonel HTML (66+ konu)
- **Güvenlik Perspektifi** — Her konuda XSS, CSRF, injection gibi güvenlik açıkları ele alınır
- **JWT Auth Sistemi** — Access token (15dk) + Refresh token rotation (7gün / 30gün)
- **İlerleme Takibi** — Konu, quiz ve görev bazlı detaylı takip
- **Sertifika Sistemi** — Kurs bitiminde kişiselleştirilmiş sertifika
- **Dark / Light Tema** — CSS custom properties ile tam tema desteği
- **Responsive Tasarım** — Mobil öncelikli, tüm cihazlarda çalışır
- **Admin Paneli** — Kullanıcı yönetimi ve aktivite logları

## Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/muhammedali/hackdev-academy.git
cd hackdev-academy

# 2. Bağımlılıkları kur
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle — JWT_SECRET en az 64 karakter olmalı
```

`.env` dosyasında mutlaka düzenlemen gereken alanlar:

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | En az 64 karakterlik rastgele string |
| `COOKIE_SECRET` | En az 32 karakterlik rastgele string |
| `ALLOWED_ORIGINS` | İzin verilen origin(ler), virgülle ayrılır |

```bash
# 4. Veritabanını oluştur
npm run db:migrate

# 5. (İsteğe bağlı) Test verilerini yükle — sadece geliştirme için
npm run db:seed

# 6. Geliştirme sunucusunu başlat
npm run dev
```

Sunucu `http://localhost:3000` adresinde çalışır.

## Proje Yapısı

```
hackdev-academy/
├── server/
│   ├── index.js              ← Express uygulama giriş noktası
│   ├── config/               ← DB ve JWT konfigürasyonu
│   ├── middleware/           ← Auth, rate limit, logger, validation
│   ├── routes/               ← API rotaları
│   ├── controllers/          ← İş mantığı
│   └── db/
│       ├── migrations/       ← Knex migrasyonları
│       └── seeds/            ← Geliştirme test verileri
├── public/
│   ├── index.html            ← Landing sayfası
│   ├── auth/                 ← Login / Register
│   ├── dashboard/            ← Kullanıcı paneli
│   ├── bolum/                ← Eğitim sayfaları (3 bölüm)
│   ├── css/                  ← Stil dosyaları
│   └── js/                   ← İstemci JavaScript
├── .env.example              ← Ortam değişkeni şablonu
├── knexfile.js               ← Veritabanı konfigürasyonu
├── Procfile                  ← Railway / Render deploy
└── package.json
```

## API Dokümantasyonu

### Auth (`/api/auth`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/register` | Yeni kullanıcı kaydı |
| POST | `/login` | Giriş yap |
| POST | `/logout` | Çıkış yap |
| POST | `/refresh` | Token yenile |
| GET | `/me` | Mevcut kullanıcı bilgisi |
| GET | `/check-username` | Kullanıcı adı uygunluk kontrolü |

### İlerleme (`/api/progress`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/dashboard` | Genel ilerleme özeti |
| POST | `/konu` | Konu ilerlemesi güncelle |
| GET | `/bolum/:id` | Bölüm detay ilerleme |
| POST | `/task` | Görev tamamlama kaydı |

### Quiz (`/api/quiz`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/answer` | Tek cevap gönder |
| POST | `/submit` | Quizi tamamla |
| GET | `/results/:id` | Quiz sonuçları |

### Kullanıcı (`/api/user`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/profile` | Profil ve istatistikler |
| PUT | `/profile` | Profil güncelle |
| PUT | `/password` | Şifre değiştir |
| GET | `/activity` | Aktivite logları |

### Admin (`/api/admin`) — Admin yetkisi gerekli
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/users` | Tüm kullanıcılar |
| GET | `/logs` | Aktivite logları |
| PUT | `/users/:id/status` | Kullanıcı durumunu değiştir |

## Güvenlik

- **Helmet.js** — CSP, HSTS, X-Frame-Options ve diğer güvenlik başlıkları
- **bcrypt** — Şifre hash (12 round)
- **JWT Rotation** — Her refresh'te yeni token üretilir, eski token revoke edilir
- **Rate Limiting** — Genel (100/15dk), login (5/15dk), register (3/saat)
- **httpOnly Cookie** — XSS'e karşı refresh token koruması
- **Parameterized Queries** — Knex ile SQL injection koruması
- **Input Validation** — express-validator ile tüm inputlar doğrulanır
- **CORS** — İzin verilen originler env değişkeniyle kontrol edilir

## npm Scripts

```bash
npm start           # Production sunucusu
npm run dev         # Geliştirme sunucusu (nodemon ile hot reload)
npm run db:migrate  # Migration'ları uygula
npm run db:rollback # Son migration'ı geri al
npm run db:seed     # Test verilerini yükle (sadece geliştirme)
npm run db:reset    # Tüm tabloları sıfırla ve yeniden kur
```

## Katkı Politikası

Bu proje kapalı kaynaklıdır. Dış katkı kabul edilmemektedir.

## Lisans

Copyright © 2026 Muhammed Ali. Tüm hakları saklıdır.
Detaylar için [LICENSE](./LICENSE) dosyasına bakın.
