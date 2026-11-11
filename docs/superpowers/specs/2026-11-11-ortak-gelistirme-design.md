# Ortak geliştirme: katkı kuralları, ajan belgesi, katkıda bulunanlar

Tarih: 2026-11-11 · Durum: onay bekliyor

## Neden

Sözlüğü tek kişi Claude ile büyütüyor ve token yetmiyor. Başkaları da (kendi AI ajanlarıyla)
kelime ekleyebilmeli. Bir ajan repoyu açıp tek belgeyi okuyunca kimseye soru sormadan doğru
katkıyı yapabilmeli; maliyeti katkı yapan üstlenir, repo sahibi yalnızca onaylar.

## Hedefler

1. Bir AI ajanı `AGENTS.md`'yi okuyup İngilizce kök, Almanca kök, ek (affix), nesne veya liste
   ekleyebilir; yanlış yaparsa `npm run check` neyi düzelteceğini söyler.
2. Ne ekleneceği issue'larla belirlenir; herkes kuyruktan iş alabilir ya da yenisini önerebilir.
3. Uygulamada kimin katkı yaptığı görünür: varsayılan görünümde hiyerarşi yok, detayda istatistik.
4. Almanca ekler İngilizcedeki gibi gezilebilir olur.

## Hedef olmayanlar

- Kelime listesini gizlemek (açık repo + fork ile bağdaşmaz; ayrı konu).
- Otomatik içerik doğrulama (çeviri doğru mu); biçim testleri + sahibin gözü yeterli.
- Çoklu onaycı, otomatik issue bırakma botu, veri sürümleme: ihtiyaç doğunca.

## Olursa başarısız sayılır

- Ajan işi yapmak için 100 kök dosyasını taramak zorunda kalırsa.
- Varsayılan katkıcı görünümü bir sıralama/liderlik tablosu gibi görünürse.
- İki ayrı kök ekleyen iki PR birbiriyle çakışırsa.

## Akış

fork → issue al/aç → veriyi ekle → `npm run check` → PR (`Closes #n`) → Actions kontrolü →
sahip birleştirir → site ve katkıcı sayfası kendiliğinden güncellenir. `main`'e yalnızca sahip
birleştirir; dal koruması: kontrol geçmeden birleşmez.

## Parçalar

### 1. Ön koşul: üretilen dosyalar repodan çıkar

`public/data/index.json`, `affix-index.json`, `de/index.json`, `lists-index.json`,
`objects-index.json` `.gitignore`'a girer; `npm run data` `predev`, `pretest` ve `prebuild`
olarak kendiliğinden çalışır. PR yalnızca kendi veri dosyalarını içerir. Ayrıca
`pages.yml`'de PR koşuları `pages` eşzamanlılık grubundan ayrılır (PR, canlı yayını iptal etmesin).

### 2. Katkı sahipliği verisi

- `public/data/contributors.json`: `{ "<github-adı>": { "name": "<görünen ad>" } }`. Görünen ad
  takma ad olabilir.
- Her kök/Almanca kök kelimesinde, her nesnede ve her ekte `"addedBy": "<github-adı>"`.
- Mevcut içeriğin tamamı `writerforight` olarak işaretlenir (tek seferlik betik). *(benim kararım)*
- Düzeltme `addedBy`'ı değiştirmez.
- Test: `addedBy` eksikse ya da `contributors.json`'da yoksa hata.
- `npm run data` ayrıca `contributors-index.json` üretir: kişi başına kelime/nesne/ek sayısı,
  bölümlere göre dağılım.

### 3. Belgeler

- `AGENTS.md` (İngilizce, tek doğruluk kaynağı): sistem haritası → her iş türü için tam örnekli
  veri biçimi ve adım adım tarif (EN kök, DE kök, ek, nesne, liste; bugünkü üretim biçimiyle:
  kelimede 6 dilli gloss + en az 2 `[işaretli]` cümle; nesnede 6 dilli ad, 3 cümle, EN+DE ad
  çözümlemesi, Wikidata/Commons fotoğrafı, `scripts/lookup-object.mjs`) → kalite kuralları →
  sahiplik kuralı → yasaklar (koda, başkasının kelimesine, workflow'a dokunma) → bitiş çizgisi →
  token tasarrufu (yalnızca ilgili dosyayı oku). Bölümler aynı kalıpla yazılır
  ("veri klasörü + tarif + kontrol") ki yeni bölüm/dil eklemek bir tarif eklemek olsun.
- `CLAUDE.md`: tek satır, `AGENTS.md`'ye yönlendirir.
- `CONTRIBUTING.md`: insanlar için kısa akış + `AGENTS.md` bağlantısı; ayrıntılar oraya taşınır.
- `README*`: "Katkı" bölümü + AI ajanı notu.
- `docs/grow-loop.md`, `objects-loop.md`: tarifler `AGENTS.md`'ye taşınır, kuyruklar issue olur.
- İskelet komutu: `npm run new -- <root|de-root|object|list> <id>` boş ama geçerli dosya yaratır.

### 4. Issue ve PR

- Etiketler ve formlar: `en-root`, `de-root`, `affix`, `list` (+ mevcut `mistake`).
- Kuyruktan almak = issue'ya yazmak/kendini atamak; yeni fikir = önce issue. 7 gün
  dokunulmayan alınmış iş serbest sayılır (kural, otomasyon yok). *(benim kararım)*
- PR sınırı: en çok 6 kök ya da 1 liste (≤40 nesne).
- PR şablonu: ne eklendi, kaç kelime, kapattığı issue'lar, kök başına kaynak bağlantısı
  (Wiktionary), onay kutuları (6 dil tam, cümleler özgün, `npm run check` geçti, ilk katkıda
  `contributors.json`, içerik repo lisansıyla yayımlanır, AI kullandıysam çevirileri denetledim).

### 5. Katkıda bulunanlar sayfası (`#/contributors`)

- Varsayılan: üzerinde ad yazan, yavaşça süzülen baloncuklar; hepsi aynı boy, rastgele yerleşim,
  sıra yok. `prefers-reduced-motion`'da durağan.
- "Detay" düğmesi: kişi başına kelime/nesne/ek sayısı ve bölüm dağılımı tablosu.
- Başlangıç ekranından ve alt bilgiden bağlantı; 6 dilde arayüz metni; mevcut tema tokenları.
- Mevcut katmanlara uyar: domain `Contributor`, repository'de okuma, tek görünüm sınıfı.

### 6. Almanca ek sayfaları

İngilizcedeki ek sayfası ve Önekler/Sonekler sekmeleri Almanca bölüme de gelir
(`#/de/affix/ver-`); `de/affix-index.json` üretilir; aynı `Affix` sınıfı ve görünümler yeniden
kullanılır. *(İngilizceyle aynı davranış: benim kararım.)* Uzun ek açıklamaları için `Affix`'e
isteğe bağlı `note` (6 dil) alanı eklenir; boşsa gösterilmez, böylece açıklamalar zamanla
katkıyla dolar.

## Sıra

1 → 2 → 3 → 4 → 5 → 6. Her parça ayrı commit; 1–4 bitince katkıya açılabilir, 5–6 sonra gelebilir.

## Uygulayana bırakılanlar

Baloncuk animasyonunun tekniği, iskelet komutunun iç yapısı, test dosyalarının düzeni,
`AGENTS.md`'nin tam metni.
