# Gündelik nesneler: büyütme

SPEC.md D5'in çalışma talimatı. Kullanıcı nesne verdiğinde ya da `/loop` ile bir yer turu istendiğinde
bu dosyanın tamamını oku ve **tek bir tur** yap. Repo: `~/Desktop/projects/specroots`.

## İki yol
- **Kullanıcının nesneleri:** herhangi bir dilde ad verir ("tebeşir, cetvel, kevgir"). İngilizce adı bul,
  aşağıdaki adımlarla ekle. Yeri yoksa uygun yeri seç ya da `places.json`'a yeni yer ekle (6 dilde).
- **Yer turu:** "Kuyruk"taki ilk işaretsiz yeri al, o yerde gerçekten bulunan **10** nesne seç: önce herkesin
  her gün gördükleri, sonra daha nadir ama adı bilinmeye değer olanlar (kevgir, oklava gibi).

## Bir nesne
1. `git pull`. `public/data/objects-index.json`'da zaten var mı bak (İngilizce ad ve her dildeki ad).
2. `node scripts/lookup-object.mjs "<english name>"`: Wiktionary anlamları + çevirileri + köken ve
   Wikidata adayları (P18 fotoğrafıyla). **Doğru anlamın** çevirisini seç (chalk: "a piece of chalk used
   for drawing", taş değil). Wikidata'dan yalnız fotoğraf ve Q kimliği; etiketlerini çeviri sayma.
3. `public/data/objects/<id>.json` yaz (biçim: SPEC.md "Veri biçimi"). Çeviri: o dilde gündelik söylenen
   ad, artikelle; Wiktionary'de birkaç seçenek varsa en yaygını. Tanım kısa, 6 dilde, senin cümlen.
   Köken tek satır, `←` ile; ad bir specroots kökünden geliyorsa `root` alanına kökü yaz.
4. Fotoğrafın açıldığını denetle: `https://commons.wikimedia.org/wiki/Special:FilePath/<dosya>?width=320`
   200 dönmeli; fotoğraf nesneyi gerçekten göstermeli (tablo, logo, harita olmasın).
5. `npm run data` (uyarı varsa: aynı ad iki nesnede, düzelt) sonra `npm run check`. Testleri gevşetme.
6. Commit (Co-Authored-By satırı **ekleme**), push: `objects: <yer ya da nesneler> (+N, total M)`.

## Kuyruk (yerler)
- [x] classroom — 10
- [x] kitchen — 10
- [x] bathroom — 10
- [ ] bedroom
- [ ] living room
- [ ] workshop (tools)
- [ ] garden
- [ ] street
- [ ] office
- [ ] clothing
- [ ] body (vücut)
- [ ] car and bicycle

## Durum
30 nesne, 3 yer (2026-11-06).
