# 🎓 HackDev Academy

<div align="center">

**Güvenlik perspektifli, profesyonel Full Stack Developer eğitim platformu.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Open%20Source-blue)](./LICENSE)

[🌐 Canlı Demo](#) • [📚 Dokümantasyon](#api-dokümantasyonu) • [🚀 Hızlı Başla](#-hızlı-başlangıç) • [🔐 Güvenlik](#-güvenlik-özellikleri)

</div>

---

## 📖 Proje Hakkında

**HackDev Academy**, modern web geliştirme becerilerini **güvenlik perspektifiyle** öğreten kapsamlı bir eğitim platformudur. Platform, başlangıç seviyesinden ileri seviyeye kadar HTML, CSS ve JavaScript'i öğreten 66+ konuyu içerir.

Her konu, gerçek dünyada karşılaşılan **XSS, CSRF, injection** gibi güvenlik açıklarını ele alarak, güvenli kod yazma alışkanlıklarını yerleştirir.

---

## ✨ Temel Özellikler

<table>
<tr>
<td width="50%">

### 📚 Eğitim Sistemi
- **3 Kapsamlı Bölüm**: Web Temelleri, HTML Etiketleri, Profesyonel HTML
- **66+ İnteraktif Konu** ile ilerleme takibi
- **Quiz Sistemi**: Her bölüm sonunda değerlendirme
- **Pratik Görevler**: Gerçek projelere dayalı ödevler
- **Güvenlik Perspektifi**: Her konuda güvenlik açıkları

</td>
<td width="50%">

### 🔐 Güvenlik & Yönetim
- **JWT Auth Sistemi** (Access + Refresh token)
- **Admin Paneli**: Kullanıcı ve sertifika yönetimi
- **Sertifika Sistemi**: Kurs bitiminde otomatik
- **Aktivite Logları**: Tüm işlemlerin kaydı
- **Rol Bazlı Erişim**: Admin ve Kullanıcı rolleri

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Tasarım & UX
- **Dark/Light Tema**: CSS custom properties ile
- **Responsive Tasarım**: Mobil-first yaklaşım
- **Modern UI**: Clean ve intuitif arayüz
- **Sade Navigasyon**: Kolay kullanıcı deneyimi

</td>
<td width="50%">

### 📊 İlerleme Takibi
- **Detaylı Dashboard**: Genel ilerleme özeti
- **Konu Bazlı Takip**: Her konunun durumu
- **İstatistikler**: Zaman ve başarı oranları
- **CSV Export**: Verilerinizi indirebilirsiniz

</td>
</tr>
</table>

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
```
✓ Node.js 18+
✓ npm 9+
✓ Git
```

### 1️⃣ Depoyu Klonla
```bash
git clone https://github.com/ali-3450coder/hackdev-academy.git
cd hackdev-academy
```

### 2️⃣ Bağımlılıkları Yükle
```bash
npm install
```

### 3️⃣ Ortam Dosyasını Oluştur

Linux veya macOS:
```bash
cp .env.example .env
```

Windows Komut İstemi:
```bat
copy .env.example .env
```

### 4️⃣ `.env` Dosyasını Düzenle

Güvenlik anahtarlarını ayrı ayrı üretin:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıkan değerleri `.env` dosyasındaki ilgili satırlara yapıştırın:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=birinci-komuttan-alinan-deger
COOKIE_SECRET=ikinci-komuttan-alinan-deger
DB_CLIENT=sqlite3
DB_FILENAME=./dev.sqlite3
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
SEED_ADMIN_PASSWORD=guclu-bir-admin-sifresi
SEED_TEST_PASSWORD=guclu-bir-test-sifresi
```

### 5️⃣ Veritabanını Oluştur
```bash
npm run db:reset
```

**Oluşturulan Hesaplar:**
| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | `admin@hackdev.academy` | `.env` → `SEED_ADMIN_PASSWORD` |
| **Test User** | `test@hackdev.academy` | `.env` → `SEED_TEST_PASSWORD` |

### 6️⃣ Sunucuyu Başlat
```bash
npm start
```

**Tarayıcıyı Aç:** `http://localhost:3000`

Kod üzerinde çalışırken otomatik yeniden başlatma:
```bash
npm run dev
```

**Kullanım:**
1. Ana sayfadan **Ücretsiz Başla** seçeneğiyle hesap oluşturun.
2. Test veya yönetici hesabıyla giriş yapın.
3. Dersleri açın ve quizleri tamamlayın.
4. Yönetici hesabıyla `http://localhost:3000/admin` adresine giderek kullanıcıları ve sertifikaları yönetin.

---

## 📁 Proje Yapısı

```
hackdev-academy/
├── server/
│   ├── index.js                    # Express uygulaması giriş noktası
│   ├── config/
│   │   ├── database.js             # Veritabanı konfigürasyonu (Knex)
│   │   └── jwt.js                  # JWT ayarları
│   ├── middleware/
│   │   ├── auth.js                 # Token doğrulama
│   │   ├── rateLimit.js            # Rate limiting (DDoS koruması)
│   │   └── validation.js           # Input validation
│   ├── routes/                     # API endpoint tanımları
│   ├── controllers/                # İş mantığı ve DB işlemleri
│   └── db/
│       ├── migrations/             # Tablo yapısı tanımlamaları
│       └── seeds/                  # Test verisi (geliştirme)
│
├── public/
│   ├── index.html                  # Landing sayfası
│   ├── auth/
│   │   ├── login.html              # Giriş sayfası
│   │   └── register.html           # Kayıt sayfası
│   ├── dashboard/
│   │   ├── dashboard.html          # Kullanıcı paneli
│   │   └── profile.html            # Profil yönetimi
│   ├── admin/
│   │   ├── admin.html              # Admin paneli
│   │   ├── users.html              # Kullanıcı yönetimi
│   │   ├── certificates.html       # Sertifika yönetimi
│   │   └── analytics.html          # İstatistikler
│   ├── bolum/                      # Eğitim sayfaları
│   │   ├── bolum1.html             # Bölüm 1: Web Temelleri
│   │   ├── bolum2.html             # Bölüm 2: HTML Etiketleri
│   │   └── bolum3.html             # Bölüm 3: Profesyonel HTML
│   ├── css/                        # Stil dosyaları
│   │   ├── style.css               # Ana stil
│   │   ├── theme.css               # Dark/Light tema
│   │   └── responsive.css          # Responsive tasarım
│   └── js/                         # İstemci tarafı JavaScript
│       ├── auth.js                 # Kimlik doğrulama
│       ├── api.js                  # API çağrıları
│       └── utils.js                # Yardımcı fonksiyonlar
│
├── .env.example                    # Ortam değişkeni şablonu
├── .gitignore                      # Git'ten dışlanacak dosyalar
├── knexfile.js                     # Knex veritabanı konfigürasyonu
├── package.json                    # Proje bağımlılıkları
├── Procfile                        # Railway deployment tanımı
├── LICENSE                         # Lisans dosyası
└── README.md                       # Bu dosya
```

---

## 🗄️ Veritabanı Şeması

| Tablo | Amaç |
|-------|------|
| **`users`** | Kullanıcı hesapları (username, email, role, login_count) |
| **`refresh_tokens`** | JWT refresh token'ları ve revokasyon kaydı |
| **`user_progress`** | Konu bazlı ilerleme (status, time_spent_sec) |
| **`task_completions`** | Pratik görev tamamlama kayıtları |
| **`quiz_answers`** | Bireysel quiz cevapları |
| **`bolum_quiz_results`** | Quiz sonuçları (score, passed, attempt_count) |
| **`certificates`** | Verilen sertifikalar (certificate_no, issued_at) |
| **`password_reset_tokens`** | Admin şifre sıfırlama kayıtları |
| **`activity_logs`** | Sistem geneli aktivite logları |

---

## 📡 API Dokümantasyonu

### 🔐 Kimlik Doğrulama (`/api/auth`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/register` | 🆕 Yeni kullanıcı kaydı |
| `POST` | `/login` | 🔓 Giriş yap |
| `POST` | `/logout` | 🚪 Çıkış yap |
| `POST` | `/refresh` | 🔄 Token yenile |
| `GET` | `/me` | 👤 Mevcut kullanıcı bilgisi |
| `GET` | `/check-username` | ✓ Kullanıcı adı kontrol et |

### 📊 İlerleme Takibi (`/api/progress`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/dashboard` | 📈 Genel ilerleme özeti |
| `POST` | `/konu` | ✅ Konu ilerlemesi güncelle |
| `GET` | `/bolum/:id` | 📖 Bölüm detay ilerleme |
| `POST` | `/task` | 🎯 Görev tamamlama kaydı |

### ❓ Quiz Sistemi (`/api/quiz`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/answer` | 💭 Tek cevap gönder |
| `POST` | `/submit` | ✋ Quizi tamamla |
| `GET` | `/results/:id` | 📊 Quiz sonuçları |

### 👤 Kullanıcı (`/api/user`)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/profile` | 👁️ Profil ve istatistikler |
| `PUT` | `/profile` | ✏️ Profil güncelle |
| `PUT` | `/password` | 🔑 Şifre değiştir |
| `GET` | `/activity` | 📋 Aktivite logları |

### ⚙️ Admin (`/api/admin`) — *Admin yetkisi gerekli*
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/stats` | 📊 Sistem istatistikleri |
| `GET` | `/users` | 👥 Tüm kullanıcılar |
| `GET` | `/users/:id` | 👤 Kullanıcı detayı |
| `PUT` | `/users/:id/status` | 🔄 Kullanıcı aktif/pasif yap |
| `PUT` | `/users/:id/role` | 🎖️ Rolü değiştir |
| `POST` | `/users/:id/reset-password` | 🔑 Şifre sıfırla |
| `DELETE` | `/users/:id/progress` | 🔄 İlerleme sıfırla |
| `DELETE` | `/users/:id/quiz` | ❌ Quiz sonuçlarını sıfırla |
| `POST` | `/users/:id/certificates` | 🏆 Sertifika ver |
| `DELETE` | `/users/:id` | 🗑️ Kullanıcıyı sil |
| `GET` | `/certificates` | 🏅 Tüm sertifikalar |
| `GET` | `/logs` | 📝 Sistem logları |
| `GET` | `/export/users.csv` | 📥 Kullanıcıları CSV'ye aktar |

---

## 📦 npm Komutları

```bash
npm start              # Sunucuyu başlat
npm run dev            # Geliştirme sunucusu (nodemon ile otomatik yeniden başlatma)
npm run db:migrate     # 🗄️ Migration'ları uygula (tabloları oluştur)
npm run db:rollback    # ↩️ Son migration'ı geri al
npm run db:seed        # 🌱 Test verilerini yükle
npm run db:reset       # 🔄 Veritabanını sıfırla ve yeniden kur
```

---

## 🔐 Güvenlik Özellikleri

| Özellik | Teknoloji | Açıklama |
|---------|-----------|----------|
| 🛡️ **Headers** | Helmet.js | CSP, HSTS, X-Frame-Options koruması |
| 🔐 **Şifre Hash** | bcryptjs | 12 round bcrypt hashing |
| 🔄 **Token Rotation** | JWT | Her refresh'te yeni token, eski token revoke |
| ⏱️ **Rate Limiting** | express-rate-limit | DDoS koruması (100/15dk genel, 20/15dk login) |
| 🍪 **HttpOnly Cookie** | express | XSS'e karşı refresh token koruması |
| 🛡️ **SQL İnjection** | Knex.js | Parameterized queries |
| ✓ **Input Validation** | express-validator | Tüm input'lar doğrulanır |
| 🌐 **CORS** | cors | İzin verilen origin'ler env ile kontrol |
| 🎖️ **RBAC** | Custom Middleware | Rol bazlı erişim kontrolü |

---

## 📋 Önemli Notlar

> ⚠️ **Güvenlik Uyarıları**

- ✅ `.env` dosyası `.gitignore`'da — GİT'E ASLA EKLENMEYECEK
- ✅ Veritabanı (`*.sqlite3`) GİT'E EKLENMEYECEK
- ✅ Admin şifreleri yalnızca `.env` dosyasında tutulur
- ✅ `npm run db:seed` **SADECE** geliştirme ortamında kullanılır
- ✅ Production'da `COOKIE_SECURE=true` yapın

> 💡 **Geliştirme İpuçları**

- Hot reload: `npm run dev` ile çalışın
- Veritabanı sıfırlama: `npm run db:reset`
- Yeni migration: `npx knex migrate:make migration_name`

---

## 🤝 Katkıda Bulunma

Bu proje eğitim amaçlıdır. İyileştirmeler için:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

---

## 📄 Lisans

Copyright © 2026 Muhammed Ali. Tüm hakları saklıdır.

Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

## 📞 İletişim & Destek

- 🐛 **Bug Raporu**: [Issues](https://github.com/ali-3450coder/hackdev-academy/issues)
- 💡 **Önerim**: [Discussions](https://github.com/ali-3450coder/hackdev-academy/discussions)
- 📧 **E-posta**: [GitHub'da İletişim Kur](#)

---

<div align="center">

**⭐ Projeden hoşlandınız mı? Yıldız vermeyi unutmayın!**

Made with ❤️ by [Muhammed Ali](https://github.com/ali-3450coder)

</div>
