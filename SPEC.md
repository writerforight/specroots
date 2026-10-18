# SPEC — specroots

İngilizce kelimeleri Latince/Yunanca kökleri üzerinden öğreten, tarayıcıda çalışan bir sözlük.
Bu dosya bağlayıcıdır: burada yazmayan bir özellik eklenmez, değişiklik gerekçesiyle buraya yazılır.

## Amaç
Bir kök (ör. *spec/spect* = bakmak) öğrenildiğinde onunla kurulan onlarca kelime (inspect, inspection,
spectator, perspective…) birlikte akılda kalsın. Her kelimenin parçaları (ön ek · kök · son ek), anlamı,
seçilen dillerdeki karşılığı ve öğretici örnek cümleleri bir arada görünür.

## Verilen kararlar (2026-10-18)
1. **Platform:** statik web sitesi, GitHub Pages'te (public repo `writerforight/specroots`). Sunucu yok.
2. **Kök yapısı:** üç katman. Latince/Yunanca kök → doğrudan ondan türeyen İngilizce temel kelimeler →
   onların türevleri (spec → inspect → inspection, inspector). Her kelimenin `parent` alanı bu ağacı kurar.
3. **Veri kaynağı:** açık veri, derlenip repoya JSON olarak konur. Kelime, köken ve çeviriler için
   Wiktionary (CC BY-SA 4.0), örnek cümleler için Tatoeba (CC BY 2.0 FR). Derlenmiş veri bu lisansları
   ve atfı taşır. Şu anki 5 köklü demo verisi elle yazıldı (aşağıda "Aşamalar").
4. **Diller:** İngilizce kaynak dil. Çeviri dilleri Türkçe, Almanca, Fransızca, İtalyanca, İspanyolca.
   Kullanıcı ilk açılışta istediği kadarını seçer (en az bir tane), sonra Ayarlar'dan değiştirir.
5. **Arayüz dili:** 6 dilin hepsi (EN, TR, DE, FR, IT, ES), seçilebilir. Varsayılan tarayıcı dilinden tahmin edilir.
6. **Tema:** açık / koyu / sistem; tek vurgu rengi. Ön ek, kök ve son ek kendi renkleriyle gösterilir.
7. **Cihazlar:** tek site, uyumlu düzen. Bilgisayarda solda alfabetik kök listesi, sağda detay;
   telefonda liste ve detay ayrı ekranlar ("Geri" ile dönülür). 390 px genişlikte yatay kaydırma olmaz.
8. **Türev görünümü:** iki görünüm, düğmeyle geçilir. **Liste:** oluşuma göre gruplar (yalnız kök /
   ön ekli / son ekli / ikisi birden). **Ağaç:** kök → temel kelimeler → türevler, açılır kapanır.
9. **Örnek cümleler:** kelime başına 2–3 kısa, öğretici cümle; seçili dillerdeki çevirisiyle. Hedef
   kelime cümlede vurgulanır.
10. **İşlevler (ilk sürüm):** arama (kök ya da kelime yaz → ilgili köke/kelimeye git) ve telaffuz
    (tarayıcının kendi sesiyle, internetsiz; kelime ve İngilizce cümle).
11. **Kapsam:** ilk tam sürümde ~50 kök, özenle seçilmiş ve kontrol edilmiş.
12. **Mimari:** nesne yönelimli, katmanlı (aşağıda). Görünüm ve tema veri ve mantıktan bağımsız
    değiştirilebilir olmalı.
13. **Bulunabilirlik (2026-10-18):** yalnızca ana sayfa için: açıklama, Open Graph görseli (`public/og.png`),
    JSON-LD (WebApplication, yazar Eren Can Almaz), canonical; kök listesi build sırasında `index.html`'e düz
    HTML olarak yazılır (JS'siz okuyucular ve arama motorları için). Kök başına ayrı sayfa yok.
    Kişisel sayfada (writerforight.github.io) "Smaller tools" altında, JSON-LD'de, sitemap'te ve llms.txt'de yer alır;
    profil README'sindeki 3 ana projeye eklenmez.
14. **Katkı (2026-10-18):** dışarıdan kök önerme ve düzeltme: issue formları (`new-root`, `mistake`),
    CONTRIBUTING.md (kök ekleme adımları, iyi örnek cümle ölçütü), her PR'da `npm run check`.
    README İngilizce (varsayılan) + Almanca + Türkçe.

## Mimari
```
src/domain/    saf sınıflar, DOM yok: Root, Word, Morpheme, Affix, Sentence, Language
src/data/      LexiconRepository (arayüz) ← JsonLexiconRepository; LexiconParser veriyi doğrular
src/services/  SettingsStore (gözlemlenebilir, kalıcı), SearchIndex, SpeechService, KeyValueStore
src/i18n/      I18n + 6 dilin arayüz metinleri (eksik anahtar derleyicide hata verir)
src/ui/        görünüm sınıfları: RootListView, RootDetailView, WordCard, SearchBox, SettingsDialog,
               ThemeController; türev görünümleri DerivationView arayüzünü uygular (strateji)
src/app/App.ts katmanları birbirine bağlar; yönlendirme: #/root/<kök>/<kelime>
src/styles/    tokens.css (renkler, yazı tipleri, ölçüler) + app.css (yalnızca token kullanır)
```
- Görünümler bağımlılıklarını `ViewContext` ile alır, hiçbir görünüm veri dosyası okumaz.
- Yeni türev görünümü: `DerivationView`'ı uygulayan bir sınıf yaz, `DERIVATION_VIEWS`'a kaydet.
- Yeni tema/görünüm: `tokens.css`'teki değişkenleri değiştir; düzen için `app.css`.
- Başka veri kaynağı: `LexiconRepository`'yi uygulayan yeni bir sınıf; arayüz değişmez.

## Veri biçimi
- `public/data/affixes.json`: ek kataloğu. Kimlik tireyi taşır (`"re-"`, `"-ion"`), anlamı 6 dilde.
- `public/data/roots/<kök>.json`: bir kök ve tüm kelimeleri. Kelimenin `parts` dizisi ek kimliklerinden
  ve kökün yazımlarından (`forms`) oluşur; birleşince kelimeyi tam olarak hecelemelidir.
  Örnek cümlede hedef kelime `[köşeli parantez]` içinde yazılır (tam bir tane).
- `public/data/index.json`: alfabetik liste ve arama için özet; `npm run data` üretir, elle düzenlenmez.
- Aynı yazılışlı farklı ekler (ör. "içine" anlamındaki in- ile "değil" anlamındaki in-) ayrı kimlik alır:
  `"in-"` ve `"in-not-"` gibi; kimlik biçimi gerektiğinde bu bölüme eklenir.

## Kalite
- `npm run check` (tip denetimi + testler) yeşil olmadan birleştirme yok.
- Veri testleri: her kelimenin 6 dilde anlamı ve en az 2 çevirili cümlesi var, parçalar kelimeyi
  heceliyor, ebeveynler mevcut, `index.json` güncel.

## Aşamalar (her biri bitince dur ve onay bekle)
- **D0 Demo (bitti, 2026-10-18):** mimari, 5 kök (dict, duc, port, scrib, spec), 33 kelime, elle yazılmış
  veri; liste/ağaç, arama, telaffuz, 6 dilli arayüz, karşılama ekranı, tema.
- **D1 Veri hattı:** Wiktionary ve Tatoeba'dan derleyen script (`scripts/`), lisans ve atıf sayfası;
  "öğretici cümle" seçme ölçütü (kısa, yaygın kelimeler, hedef kelime tek sefer).
- **D2 50 kök:** veri hattıyla üretilip elle kontrol edilmiş ~50 kök.
- **D3 Çevrimdışı (PWA):** ana ekrana eklenebilir, internetsiz açılır.
