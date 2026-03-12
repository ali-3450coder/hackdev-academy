# HackDev Academy

> Güvenlik perspektifli, profesyonel Full Stack Developer eğitim platformu.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)
![License](https://img.shields.io/badge/Lisans-Kapalı%20Kaynak-red)

---

## Proje Hakkında

HackDev Academy, HTML, CSS ve JavaScript'i güvenlik perspektifiyle öğreten web tabanlı bir eğitim platformudur. Kullanıcı kayıt/giriş sistemi, bölüm bazlı ilerleme takibi, interaktif quizler, sertifika sistemi ve yönetici paneli ile eksiksiz bir öğrenme deneyimi sunar.

## Özellikler

- **3 Kapsamlı Bölüm** — Web Temelleri, HTML Etiketleri, Profesyonel HTML (66+ konu)
- **Güvenlik Perspektifi** — Her konuda XSS, CSRF, injection gibi güvenlik açıkları ele alınır
- **JWT Auth Sistemi** — Access token (15dk) + Refresh token rotation (7gün / 30gün)
- **İlerleme Takibi** — Konu, quiz ve görev bazlı detaylı takip
- **Sertifika Sistemi** — Kurs bitiminde kişiselleştirilmiş sertifika
- **Admin Paneli** — Kullanıcı yönetimi, profil düzenleme, ilerleme/quiz sıfırlama, sertifika yönetimi, sistem logları, veritabanı istatistikleri, CSV dışa aktarma
- **Dark / Light Tema** — CSS custom properties ile tam tema desteği
- **Responsive Tasarım** — Mobil öncelikli, tüm cihazlarda çalışır

---

## Kurulum (Sıfırdan Başlangıç)

### Gereksinimler
- Node.js 18+
- npm 9+

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/KULLANICI_ADIN/hackdev-academy.git
cd hackdev-academy

# 2. Bağımlılıkları kur
npm install

# 3. Ortam değişkenlerini oluştur
cp .env.example .env
```

### .env Dosyasını Düzenle

`.env` dosyasını aç ve şu alanları doldur:

```env
JWT_SECRET=      # En az 64 karakterlik rastgele string (aşağıdaki komutla üret)
COOKIE_SECRET=   # En az 32 karakterlik rastgele string
SEED_ADMIN_PASSWORD=   # Admin hesabı için seçeceğin şifre
SEED_TEST_PASSWORD=    # Test kullanıcısı için şifre (isteğe bağlı)
```

**Güçlü secret üretmek için:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Veritabanı ve İlk Kullanıcılar

```bash
# Veritabanı tablolarını oluştur ve admin hesabını ekle
npm run db:reset
```

Bu komut:
1. Tüm tabloları oluşturur
2. `.env` dosyasındaki `SEED_ADMIN_PASSWORD` ile admin hesabı oluşturur
3. Test kullanıcısı ekler (isteğe bağlı geliştirme için)

**Oluşturulan hesaplar:**
| Hesap | E-posta | Şifre |
|-------|---------|-------|
| Admin | `admin@hackdev.academy` | `.env` → `SEED_ADMIN_PASSWORD` |
| Test  | `test@hackdev.academy`  | `.env` → `SEED_TEST_PASSWORD` |

> ⚠️ `npm run db:seed` production ortamında **kesinlikle çalıştırılmamalıdır**.

### Sunucuyu Başlat

```bash
npm run dev    # Geliştirme (hot reload)
npm start      # Production
```

Tarayıcıda: `http://localhost:3000`

---

## Proje Yapısı

```
hackdev-academy/
├── server/
│   ├── index.js              ← Express uygulama giriş noktası
│   ├── config/               ← Veritabanı ve JWT konfigürasyonu
│   ├── middleware/           ← Auth, rate limit, logger, validation
│   ├── routes/               ← API route tanımları
│   ├── controllers/          ← İş mantığı ve DB işlemleri
│   └── db/
│       ├── migrations/       ← Knex migration dosyaları (7 tablo)
│       └── seeds/            ← Geliştirme test verileri
├── public/
│   ├── index.html            ← Landing sayfası
│   ├── auth/                 ← Login / Register sayfaları
│   ├── dashboard/            ← Kullanıcı paneli
│   ├── admin/                ← Yönetici paneli
│   ├── bolum/                ← Eğitim sayfaları (3 bölüm)
│   ├── css/                  ← Stil dosyaları
│   └── js/                   ← İstemci JavaScript
├── .env.example              ← Ortam değişkeni şablonu
├── knexfile.js               ← Veritabanı konfigürasyonu
├── package.json
└── README.md
```

---

## Veritabanı Şeması

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı hesapları (username, email, role, login_count…) |
| `refresh_tokens` | JWT refresh token'ları ve revokasyon kaydı |
| `user_progress` | Konu bazlı ilerleme (status, time_spent_sec…) |
| `task_completions` | Pratik görev tamamlama kayıtları |
| `quiz_answers` | Bireysel quiz cevapları |
| `bolum_quiz_results` | Quiz genel sonuçları (score, passed, attempt_count…) |
| `certificates` | Verilen sertifikalar (certificate_no, issued_at) |
| `password_reset_tokens` | Admin şifre sıfırlama kayıtları |
| `activity_logs` | Sistem geneli aktivite logları |

---

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
| GET | `/stats` | Genel sistem istatistikleri |
| GET | `/db-stats` | Veritabanı tablo istatistikleri |
| GET | `/users` | Tüm kullanıcılar (arama/filtre destekli) |
| GET | `/users/:id` | Kullanıcı detayı ve aktivite geçmişi |
| PUT | `/users/:id/status` | Kullanıcı aktif/pasif yap |
| PUT | `/users/:id/role` | Kullanıcı rolü değiştir |
| PUT | `/users/:id/profile` | Kullanıcı profilini düzenle |
| POST | `/users/:id/reset-password` | Şifre sıfırla (geçici şifre üretir) |
| DELETE | `/users/:id/progress` | İlerleme sıfırla (opsiyonel: ?bolum_id=) |
| DELETE | `/users/:id/quiz` | Quiz sonuçlarını sıfırla (opsiyonel: ?bolum_id=) |
| POST | `/users/:id/certificates` | Sertifika ver |
| DELETE | `/users/:id` | Kullanıcıyı sil |
| GET | `/certificates` | Tüm sertifikalar (filtre: user_id, bolum_id) |
| DELETE | `/certificates/:id` | Sertifika iptal et |
| GET | `/logs` | Sistem aktivite logları |
| DELETE | `/logs` | Eski logları temizle (?days=30) |
| GET | `/export/users.csv` | Kullanıcı listesini CSV olarak indir |

---

## npm Scripts

```bash
npm start              # Production sunucusu
npm run dev            # Geliştirme sunucusu (nodemon ile hot reload)
npm run db:migrate     # Migration'ları uygula (tabloları oluştur)
npm run db:rollback    # Son migration'ı geri al
npm run db:seed        # Test verilerini yükle (sadece geliştirme)
npm run db:reset       # Tüm tabloları sıfırla, yeniden kur ve seed ekle
```

---

## Deployment (Canlıya Alma)

### Railway (Önerilen — Ücretsiz Başlangıç)

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Repoyu seç, Railway otomatik algılar (`Procfile` ile)
3. **Variables** sekmesinden env değişkenlerini gir:

```env
NODE_ENV=production
JWT_SECRET=<64char-hex>
COOKIE_SECRET=<32char-hex>
COOKIE_SECURE=true
DB_CLIENT=sqlite3
DB_FILENAME=/data/prod.sqlite3
ALLOWED_ORIGINS=https://your-project.up.railway.app
```

4. **Volumes** → Mount path `/data` ekle (SQLite kalıcı disk)
5. Deploy → migration otomatik çalışır, site canlıya girer

### Render

1. [render.com](https://render.com) → **New Web Service → GitHub Repo**
2. Start command: `node server/index.js`
3. Disk ekle: Mount path `/data`, `DB_FILENAME=/data/prod.sqlite3`
4. Environment variables'ları gir (Railway ile aynı)

### VPS (DigitalOcean / Hetzner)

```bash
git clone https://github.com/KULLANICI_ADIN/hackdev-academy.git
cd hackdev-academy
npm install --omit=dev
cp .env.example .env   # Doldur
NODE_ENV=production npm run db:migrate
npm start
```

> **Not:** Production'da `npm run db:seed` **çalıştırma** — admin hesabını admin panelinden veya DB üzerinden oluştur.

---

## Güvenlik

- **Helmet.js** — CSP, HSTS, X-Frame-Options ve diğer güvenlik başlıkları
- **bcrypt** — Şifre hash (12 round)
- **JWT Rotation** — Her refresh'te yeni token üretilir, eski token revoke edilir
- **Rate Limiting** — Genel (100/15dk), login (20/15dk), register (3/saat)
- **httpOnly Cookie** — XSS'e karşı refresh token koruması
- **Parameterized Queries** — Knex ile SQL injection koruması
- **Input Validation** — express-validator ile tüm inputlar doğrulanır
- **CORS** — İzin verilen originler env değişkeniyle kontrol edilir
- **Admin Middleware** — Rol bazlı erişim kontrolü

---

## Önemli Notlar

- `.env` dosyası hiçbir zaman commit edilmez
- Veritabanı (`*.sqlite3`) hiçbir zaman commit edilmez
- Admin kimlik bilgileri yalnızca `.env` dosyasında tutulur
- `npm run db:seed` yalnızca geliştirme ortamında kullanılır

---

## Lisans

Copyright © 2026 Muhammed Ali. Tüm hakları saklıdır.
Detaylar için [LICENSE](./LICENSE) dosyasına bakın.
