# HackDev Academy

HackDev Academy, HTML, CSS ve JavaScript konularını güvenlik perspektifiyle öğretmeyi amaçlayan bir Node.js ve Express uygulamasıdır. SQLite kullanır ve kullanıcı, ilerleme, quiz, sertifika ve yönetici işlemlerini içerir.

## Gereksinimler

- Node.js 18 veya üzeri
- npm 9 veya üzeri
- Git

Sürümleri kontrol etmek için:

```bash
node --version
npm --version
git --version
```

## Kurulum Adımları

1. Depoyu indirip proje klasörüne girin:

```bash
git clone https://github.com/ali-3450coder/hackdev-academy.git
cd hackdev-academy
```

2. Proje paketlerini yükleyin:

```bash
npm install
```

3. `.env.example` dosyasını `.env` adıyla kopyalayın.

Linux veya macOS:

```bash
cp .env.example .env
```

Windows Komut İstemi:

```bat
copy .env.example .env
```

4. Aşağıdaki komutları çalıştırarak iki güvenlik anahtarı oluşturun:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. `.env` dosyasını açın ve şu alanları kendi bilgilerinizle doldurun:

```env
JWT_SECRET=birinci-komuttan-alinan-128-karakterlik-deger
COOKIE_SECRET=ikinci-komuttan-alinan-64-karakterlik-deger
SEED_ADMIN_PASSWORD=admin-icin-guclu-sifre
SEED_TEST_PASSWORD=test-kullanicisi-icin-sifre
```

Diğer varsayılan değerler proje tarafından kullanılabilir:

```env
PORT=3000
NODE_ENV=development
DB_CLIENT=sqlite3
DB_FILENAME=./dev.sqlite3
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
```

6. Veritabanını ve örnek hesapları oluşturun:

```bash
npm run db:reset
```

Bu komut sadece yerel geliştirme veritabanını oluşturur veya sıfırlar.

## Kullanım Adımları

1. Uygulamayı başlatın:

```bash
npm start
```

Kod üzerinde çalışırken otomatik yeniden başlatma için:

```bash
npm run dev
```

2. Tarayıcıda aşağıdaki adresi açın:

```text
http://localhost:3000
```

3. Giriş sayfasından hesap bilgilerini girin:

| Rol | E-posta | Şifre |
|---|---|---|
| Yönetici | `admin@hackdev.academy` | `.env` dosyasındaki `SEED_ADMIN_PASSWORD` |
| Test kullanıcı | `test@hackdev.academy` | `.env` dosyasındaki `SEED_TEST_PASSWORD` |

4. Kullanıcı olarak konuları okuyabilir, ilerlemeyi takip edebilir ve quizleri tamamlayabilirsiniz.

5. Yönetici olarak `http://localhost:3000/admin` adresinden kullanıcıları ve sertifikaları yönetebilirsiniz.

## Kullanılabilir Komutlar

```bash
npm start             # Uygulamayı başlatır
npm run dev           # Nodemon ile otomatik yeniden başlatmayı açar
npm run db:migrate    # Veritabanı tablolarını oluşturur veya günceller
npm run db:seed       # Seed verilerini yükler
npm run db:reset      # Veritabanını sıfırlar, tabloları kurar ve seed verilerini yükler
npm run db:rollback   # Son migration adımını geri alır
```

## Sık Karşılaşılan Sorunlar

**`3000` portu başka bir uygulama tarafından kullanılıyor**

`.env` dosyasındaki `PORT` değerini değiştirin, örneğin `PORT=3001`.

**Bağımlılıklar yüklenemiyor**

```bash
rm -rf node_modules
npm install
```

**Veritabanı hatası alınıyor**

```bash
npm run db:reset
```

Bu komut geliştirme veritabanını sıfırlar; yerel kayıtlar silinir.

**Güvenlik anahtarı hatası alınıyor**

`.env` içindeki `JWT_SECRET` ve `COOKIE_SECRET` değerlerinin gerçek değerlerle doldurulduğundan ve dosyanın proje kökünde bulunduğundan emin olun.

## Proje Yapısı

```text
hackdev-academy/
├── public/             # HTML, CSS ve istemci JavaScript dosyaları
├── server/
│   ├── controllers/    # İş kuralları
│   ├── db/             # Migration ve seed dosyaları
│   ├── middleware/     # Kimlik doğrulama ve doğrulama katmanı
│   ├── routes/         # API rotaları
│   └── index.js        # Uygulama giriş noktası
├── .env.example        # Ortam değişkenleri örneği
├── knexfile.js         # Veritabanı ayarları
└── package.json        # Bağımlılıklar ve npm komutları
```
