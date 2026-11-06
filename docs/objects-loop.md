# Nesne listeleri: büyütme

SPEC.md D5'in çalışma talimatı. `docs/loop.md` bir liste turu istediğinde ya da kullanıcı nesne verdiğinde
bu dosyanın tamamını oku ve **tek bir tur** yap. Repo: `~/Desktop/projects/specroots`.

## İki yol
- **Kullanıcının nesneleri:** herhangi bir dilde ad verir ("tebeşir, cetvel, kevgir"). İngilizce adı bul,
  aşağıdaki adımlarla ekle, kullanıcının söylediği ya da en uygun liste(ler)e koy.
- **Liste turu:** "Kuyruk"taki ilk dolmamış listeye **10** yeni nesne. Sıra: o yerde herkesin her gün gördüğü
  şeyler, sonra daha nadir ama adı bilinmeye değer olanlar (kevgir, oklava). Yiyecekler de girer.

## Bir nesne
1. `git pull --rebase`. `public/data/objects-index.json`'da zaten var mı bak (İngilizce ad ve her dildeki ad).
   **Varsa yeni dosya açma**, yalnızca listeye kimliğini ekle (sünger: mutfak + banyo). Bir turda ayrıca,
   var olan nesnelerden bu listeye de gerçekten uyanları ekleyebilirsin (10'a sayılmaz).
2. `node scripts/lookup-object.mjs "<english name>"`: Wiktionary anlamları + çevirileri + köken ve Wikidata
   adayları (P18 fotoğrafıyla). **Doğru anlamın** çevirisini seç (chalk: "a piece of chalk used for drawing",
   taş değil). Wikidata'dan yalnız fotoğraf ve Q kimliği; etiketlerini çeviri sayma.
3. `public/data/objects/<id>.json` yaz (biçim: SPEC.md "Veri biçimi"):
   - `names`: o dilde gündelik söylenen ad, artikelle; birkaç seçenek varsa en yaygını.
   - `definition`: kısa, 6 dilde, senin cümlen.
   - `breakdown.en`: ad gerçekten parçalanıyorsa (dish·wash·er, tooth·brush, re·frig·er·ator); parça bir
     specroots kökü ya da ekiyse `root`/`affix` ver. Parçalanmıyorsa (spoon, fork) koyma.
   - `breakdown.de`: Almanca ad birleşik ya da türemişse **mutlaka** (Kühl·schrank: cool + cupboard,
     Schneide·brett, Rasier·er). Bağlama sesi ayrı parça olabilir (`{ "text": "s", "gloss": "linking s" }`).
     Tek parçalı ama Latince/Yunanca kökten gelen adlarda tek parça + `root` (Spiegel ← speculum → `spec`).
   - `sentences`: **3** cümle, her biri başka bir durumda: ev/gündelik, dışarıda/dükkân/iş, ve mümkünse
     mecaz ya da deyim (throw in the towel). Kısa (≤ 12 kelime), yaygın kelimelerle. Hedef kelime
     `[köşeli parantez]`; çoğul olabilir. 5 dile doğal çeviri; deyimin o dildeki karşılığını kullan
     (jeter l'éponge, das Handtuch werfen). Cümleler senin; sözlükten kopyalama. Fourier örneği yok.
   - `origin`: tek satır, `←` ile. Ad bir specroots kökünden geliyorsa `root`.
4. Fotoğrafı denetle: `https://commons.wikimedia.org/wiki/Special:FilePath/<dosya>?width=320` 200 dönmeli;
   fotoğraf nesneyi gerçekten göstermeli (tablo, logo, harita, aynı adlı başka şey olmasın). Uygun yoksa `null`.
5. Nesneyi `lists/<liste>.json`'un `objects` dizisine ekle.
6. `npm run data` (uyarıları düzelt) sonra `npm run check`. Testleri gevşetme, silme.
7. Kendini denetle: rastgele 3 nesnenin çevirisini ve 3 cümleyi yeniden oku; şüpheliyi düzelt ya da çıkar.
8. Commit (Co-Authored-By satırı **ekleme**), push: `objects: <liste> +N (list M/hedef, total K objects)`.

## Kuyruk (listeler, hedef boyut)
Yeni liste açarken `lists/<id>.json`'u 6 dilde başlıkla oluştur.
- [ ] kitchen — Mutfak — 100 (eşyalar, aletler, beyaz eşya, yiyecekler, içecekler) — şimdi 71
- [ ] bathroom — Banyo — 50 — şimdi 10
- [ ] classroom — Sınıf — 50 — şimdi 10
- [ ] bedroom — Yatak odası — 50
- [ ] living-room — Oturma odası — 50
- [ ] workshop — Atölye ve aletler — 50
- [ ] garden — Bahçe — 50
- [ ] street — Sokak ve şehir — 50
- [ ] office — Ofis — 50
- [ ] clothing — Giysiler — 50
- [ ] body — Vücut — 50
- [ ] vehicles — Araba ve bisiklet — 50
- [ ] supermarket — Market — 50

## Durum
90 nesne; mutfak 71/100 (sünger mutfakta da), banyo 10/50, sınıf 10/50 (2026-11-06).
