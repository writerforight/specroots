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
   ve atfı taşır. D0 ve D2 verisi elle yazıldı (aşağıda "Aşamalar"); D1'in akıbeti açık soru (`docs/notes.md`).
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
    Ek (2026-10-22, kullanıcı isteği): 51. kök `nunci` (nuntiare, bildirmek: announce, pronounce,
    denounce, renounce, enunciate); 52. kök `cad` (cadere, düşmek: accident, case, occasion; `cid` = caedere
    kesmek ile karıştırılmasın); 53. kök `tempt` (temptare/tentare, denemek: tempt, attempt, tentative,
    tentacle; 2026-10-30); 54. kök `act` (agere, yapmak: act, actually, active, react, exact, agent; 2026-10-30;
    `fac` = facere yapmak ile karıştırılmasın); 55. kök `nect` (nectere, bağlamak: connect, connection, annex,
    nexus; 2026-10-30); 56. kök `trib` (tribuere, vermek: tribute, contribute, distribute, attribute;
    2026-10-31); 57. kök `prehend` (prehendere, kavramak: comprehend, apprehend, surprise, enterprise;
    2026-11-06); 2026-11-06 kullanıcı isteği "daha çok fiil kökü": 58. kök `sequ` (sequi, izlemek:
    sequence, consequence, execute, prosecute), 59. kök `solv` (solvere, çözmek: solve, solution,
    dissolve, resolve, absolute), 60. kök `vinc` (vincere, yenmek: victory, convince, evict, invincible);
    aynı gün "yeni kökler ekle": 61. kök `leg` (legere, toplamak/seçmek/okumak: collect, select, elect,
    lecture, elegant), 62. kök `sum` (sumere, almak: assume, consume, presume, resume), 63. kök `scend`
    (scandere, tırmanmak: ascend, descend, transcend, condescend). 2026-11-06 onaylı kuyruktan (`docs/grow-loop.md`): 64. kök `fin` (finis, son: finish, final, define, infinite,
    confine, refine, finance), 65. kök `manu` (manus, el: manual, manuscript, manufacture, manage, manipulate, manifest),
    66. kök `ped` (pes, ayak: pedal, pedestrian, expedition, impede, centipede), 67. kök `corp` (corpus, beden: corpse,
    corporation, incorporate, corporal, corset), 68. kök `sci` (scire, bilmek: science, conscious, conscience,
    omniscient), 69. kök `nov` (novus, yeni: novel, novice, innovate, renovate),
    70. kök `mort` (mors, ölüm: mortal, immortal, mortgage, mortify), 71. kök `viv` (vivere/vita, yaşamak: vivid,
    survive, revive, vital, vitamin), 72. kök `terr` (terra, toprak: territory, terrain, terrace,
    terrestrial, subterranean), 73. kök `aqu` (aqua, su: aquarium, aquatic, aqueduct, aquifer), 74. kök `ann` (annus, yıl: annual,
    anniversary, perennial), 75. kök `fort` (fortis, güçlü: fort, effort, comfort, force, reinforce), 76. kök `grat` (gratus/gratia: grateful,
    gratitude, congratulate, grace), 77. kök `magn` (magnus, büyük: magnify, magnificent, magnitude, major), 78. kök `ment` (mens, akıl: mental, mention,
    comment), 79. kök `nat` (nasci, doğmak: native, nation, nature, innate).
    Yeni kök sınırsız açılmaz; her biri kullanıcı onayıyla eklenir.
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
src/ui/        görünüm sınıfları: RootListView, AffixListView, BrowseModeSwitch, RootDetailView,
               AffixFamilyView, WordCard, SearchBox, SettingsDialog, ThemeController; türev
               görünümleri DerivationView arayüzünü uygular (strateji)
src/app/App.ts katmanları birbirine bağlar; yönlendirme: #/root/<kök>/<kelime>, #/affix/<ek>
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
- `public/data/objects/<id>.json`: bir gündelik nesne. `id` = İngilizce ad, boşluk yerine tire
  (`paper-clip`); `name` İngilizce ad; `names` beş çeviri dilinde (isimler artikelle: `die Kreide`,
  `la craie`); `definition` 6 dilde kısa tanım; `breakdown` isteğe bağlı `{ "en": [...], "de": [...] }`,
  her parça `{ "text", "gloss" (İngilizce), "root"?, "affix"? }`; parçalar birleşince adı (Almancada
  artikelsiz) heceler; `origin` tek satır köken (`Old English ċealc ← Latin calx (limestone)`); `root` bir kök
  kimliği ya da `null`; `image` `{ "file": Commons dosya adı, "wikidata": "Q…" }` ya da `null`;
  `sentences` en az 3, köklerdeki gibi (hedef kelime `[köşeli parantez]`, 5 dile çeviri).
- `public/data/lists/<id>.json`: `{ "id", "title": 6 dilde, "objects": [nesne kimlikleri] }`.
- `public/data/objects-index.json`, `public/data/lists-index.json`: `npm run data` üretir, elle düzenlenmez.
- `public/data/affix-index.json`: her ek → onu taşıyan kökler ve kelimeler (eklerle gezinme için).
  `npm run data` üretir, elle düzenlenmez; yalnızca ön ek / son ek modunda yüklenir.
- Aynı yazılışlı farklı ekler ayrı kimlik alır ve yazılışlarını `form` ile söyler:
  `"in-"` (içine, inspect) ve `"in-not-": { "form": "in", … }` (değil, incredible). Ek kimliği tireyle
  biter (ön ek) ya da başlar (son ek); `form` yalnızca küçük harftir.
- Birleşik kelimelerde başka bir kökten gelen parça (photo·graph'taki *photo*, manu·script'teki *manu*)
  ön ek olarak kataloğa girer: `"photo-"`, `"manu-"`. Bir isim, sıfat ya da sayı gövdesi olan bu
  parçalar `"combining": true` taşır (`geo-`, `micro-`, `kilo-`, `-logy`, `-graphy`); edat, zarf ya
  da olumsuzluk bildiren gerçek ekler (`re-`, `con-`, `anti-`, `un-`, `-ion`) taşımaz. Ek listesinde
  ikisi ayrı başlık altında görünür.

## Kalite
- `npm run check` (tip denetimi + testler) yeşil olmadan birleştirme yok.
- Veri testleri: her kelimenin 6 dilde anlamı ve en az 2 çevirili cümlesi var, parçalar kelimeyi
  heceliyor, ebeveynler mevcut, `index.json` ve `affix-index.json` güncel.

## Aşamalar (her biri bitince dur ve onay bekle)
- **D0 Demo (bitti, 2026-10-18):** mimari, 5 kök (dict, duc, port, scrib, spec), 33 kelime, elle yazılmış
  veri; liste/ağaç, arama, telaffuz, 6 dilli arayüz, karşılama ekranı, tema.
- **D1 Veri hattı:** Wiktionary ve Tatoeba'dan derleyen script (`scripts/`), lisans ve atıf sayfası;
  "öğretici cümle" seçme ölçütü (kısa, yaygın kelimeler, hedef kelime tek sefer).
- **D2 50 kök (bitti, 2026-10-19):** 50 kök (40 Latince, 10 Yunanca), 949 kelime. Veri hattı (D1)
  olmadan `docs/grow-loop.md` döngüsüyle elle yazıldı ve kontrol edildi. 20 kelimeye ulaşamayan
  kökler uydurma kelimeyle doldurulmadı; listesi `docs/notes.md`'de.
- **D5 Nesne listeleri (kullanıcı isteği, 2026-11-06):** öğrenme planının 2. parçası (1. kökler+ekler,
  2. gündelik nesne adları, 3. dil bilgisi, 4. deyimler). Kökün tahmin ettiremediği adlar: tebeşir, kevgir, oklava.
  - **İki bölüm:** sol listenin en üstünde **Kelime kökleri · Nesne listeleri**. Kökler bölümü eskisi gibi
    (Kökler · Ön ekler · Son ekler). Karşılama ekranındaki "Şununla başla" seçimi bölümü de belirler
    (kökler / ön ekler / son ekler / nesne listeleri); Ayarlar'dan değişir.
  - **Kelime bir kez yaşar, listeler onu gösterir:** bir nesne hiçbir sınıfa ait değildir; `lists/<liste>.json`
    nesne kimliklerini sayar. Aynı nesne birçok listede olabilir (sünger: mutfak ve banyo). Listeler bir
    kavram etrafında (Mutfak 100, Banyo, Sınıf…); yiyecekler de girer (kullanıcı kararı).
  - **Adresler:** `#/lists` (bütün listeler), `#/list/<liste>` (karo ızgarası: fotoğraf + İngilizce + seçili
    diller), `#/list/<liste>/<nesne>`, `#/object/<nesne>` (aramadan). Sol liste: listeler ya da açık listenin
    nesneleri A–Z.
  - **Nesne sayfası:** fotoğraf, İngilizce ad + kısa tanım (arayüz dilinde), seçili dillerde ad (artikelle),
    kalan diller soluk, her ad dinlenebilir; içinde bulunduğu listeler; **adın parçaları** İngilizce ve
    **Almanca** (Wasser·kocher: water + cooker; kullanıcı kararı: Almanca birleşik kelimeler de parçalanır),
    parça bir kök ya da eke denk geliyorsa bağlantılı; **en az 3 örnek cümle**, her biri başka bir durumda
    (ev, dükkân, mecaz/deyim), 5 dile çevrili; kelimenin geçmişi tek satır, ad bir specroots kökünden
    geliyorsa köke bağlantı (scissors → `cid`).
  - **Arama:** nesneleri her dildeki adıyla (artikelsiz: "kreide", "tebeşir"), listeleri her dildeki başlığıyla
    ("mutfak") bulur.
  - **Veri:** `objects/<id>.json`, `lists/<id>.json`; `objects-index.json` (ad, çeviriler, listeleri, fotoğraf)
    ve `lists-index.json`'u `npm run data` üretir: her çalışmada bütün dosyaları okur, alfabetik sıralar, aynı
    adı (herhangi bir dilde) iki nesne kullanıyorsa ya da bir nesne hiçbir listede değilse uyarır, listede
    olup dosyası olmayan nesnede durur. Kaynak: adlar, çeviriler, köken Wiktionary (kaikki.org, anlama göre
    ayrılmış çeviriler); fotoğraf Wikidata P18 → Wikimedia Commons (sayfaya bağlantılı). Wikidata etiketleri
    çeviri sayılmaz. Yardımcı: `node scripts/lookup-object.mjs "<ad>"`. Büyüme: `docs/objects-loop.md`.
  - İlk tur (2026-11-06): 30 nesne, 3 liste (mutfak, banyo, sınıf), nesne başına 3 cümle.
- **D3 Çevrimdışı (PWA):** ana ekrana eklenebilir, internetsiz açılır.
- **D4 Eklerle gezinme (kullanıcı isteği, 2026-10-18; bitti, 2026-10-19):** köklerin yanında ön ek ve son eklerden de
  gezinme: bir eke (ör. `re-`, `-tion`) tıklayınca o eki taşıyan bütün kelimeler, kökleriyle birlikte.
  Veri hazır (her kelimenin parçaları ek kimliklerine bağlı); D2 bitince ayrıntıları konuşulacak.
  Ek (2026-10-19): kök / ön ek / son ek üç gezinme modu olur; karşılama ekranı ilk açılışta hangisiyle
  başlanacağını sorar, sonra Ayarlar'dan değiştirilir.
  Uygulanan: sol listenin üstünde Kökler · Ön ekler · Son ekler düğmesi (seçim kalıcı). Ek listesi
  alfabetik, yazılışı aynı ekler (`in-` içine / `in-` değil) anlamlarıyla ayrı satır; başka
  kelimelerden gelen parçalar (`photo-`, `tele-`, `-logy`) listenin sonunda kendi başlığı altında.
  Arama ekleri de bulur (`re-`, `-ion`). Ek sayfası `#/affix/<ek>`: ekin
  anlamı ve onu taşıyan bütün kelimeler, kök kök gruplu, ek altı çizili; her kelime kökündeki
  kartına gider. Kelime kartındaki ek etiketleri ek sayfasına bağlanır; bir ek sayfası açılınca
  liste de o ekin türüne geçer.
