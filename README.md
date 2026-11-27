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

## Kurulum

1. Projeyi klonlayın:

```bash
git clone https://github.com/ali-3450coder/hackdev-academy.git
cd hackdev-academy
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Örnek ortam dosyasını kopyalayın:

```bash
cp .env.example .env
```

4. Güvenli anahtarları üretin:

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Çıkan değerleri `.env` dosyasındaki `JWT_SECRET` ve `COOKIE_SECRET` satırlarına yapıştırın.

`.env` dosyasına en az aşağıdaki değerleri ekleyin veya güncelleyin:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=buraya-uretilen-anahtari-yapistirin
COOKIE_SECRET=buraya-uretilen-anahtari-yapistirin
DB_CLIENT=sqlite3
DB_FILENAME=./dev.sqlite3
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
SEED_ADMIN_PASSWORD=guclu-bir-yeni-sifre
SEED_TEST_PASSWORD=guclu-bir-test-sifresi
```

Üretimde `.env` dosyasını Git'e eklemeyin.

5. Veritabanını oluşturun ve ilk verileri yükleyin:

```bash
npm run db:reset
```

Bu komut tabloları oluşturur ve örnek kullanıcı verilerini ekler.

## Uygulamayı Çalıştırma

Geliştirme için:

```bash
npm run dev
```

Normal başlatma için:

```bash
npm start
```

Tarayıcıda açın:

```text
http://localhost:3000
```

## Hesaplara Giriş

Seed işlemi sonrası varsayılan hesaplar:

| Rol | E-posta | Şifre |
|---|---|---|
| Yönetici | `admin@hackdev.academy` | `.env` dosyasındaki `SEED_ADMIN_PASSWORD` |
| Test kullanıcı | `test@hackdev.academy` | `.env` dosyasındaki `SEED_TEST_PASSWORD` |

`SEED_ADMIN_PASSWORD` ve `SEED_TEST_PASSWORD` değerlerini değiştirdiyseniz girişte yeni değerleri kullanın.

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
