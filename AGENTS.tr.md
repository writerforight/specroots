# AGENTS.tr.md: specroots'a kelime nasıl eklenir

Bu dosya AI kodlama ajanları (Claude Code, Codex, Cursor, Copilot…) ve kuralların tamamını görmek
isteyen insanlar içindir. Bir kez oku; kimseye soru sormadan içerik ekleyebilirsin.
English: [AGENTS.md](AGENTS.md). İki dosya aynı kuralları anlatır; çelişirse İngilizcesi geçerlidir.

**Buradaki işin veri, kod değil.** `public/data/` altına JSON dosyaları eklersin. İçerik PR'ında
`src/`, `scripts/`, `tests/`, `.github/` ve `SPEC.md`'ye dokunma.

## 1. Bu proje ne

specroots, kelimeleri yapılarından öğreten statik bir web sitesidir. Üç bölümü var:

| Bölüm | İçinde ne var | Klasör | Kaynak dil |
|---|---|---|---|
| İngilizce kökler | Latince ve Yunanca kökler ve onlardan kurulan İngilizce kelimeler (*spec* → inspect, spectator) | `public/data/roots/` + `public/data/affixes.json` | İngilizce |
| Almanca kökler | Almanca gövdeler ve kelime aileleri (*steh* → verstehen, Verstand) | `public/data/de/roots/` + `public/data/de/affixes.json` | Almanca |
| Nesne listeleri | Fotoğraflı gündelik nesneler, listeler halinde (Mutfak, Banyo…) | `public/data/objects/` + `public/data/lists/` | İngilizce |

Her şey altı dilde çeviriyle gösterilir: `en`, `tr`, `de`, `fr`, `it`, `es`. **Altısı da her yerde
zorunludur.** Her kök, her nesne ve her liste ayrı bir dosyadır.

Üretilen dosyalar (`index.json`, `affix-index.json`, `objects-index.json`, `lists-index.json`,
`contributors-index.json`, `de/index.json`) **repoda yoktur**. Onları `npm run data` üretir;
`npm run dev`, `npm run test` ve `npm run build` bunu kendiliğinden çalıştırır. Elle oluşturma, elle
düzenleme.

## 2. Akış

1. Repoyu forkla, forkunu klonla. `npm ci` (Node ≥ 22.12).
2. Ne ekleyeceğine karar ver (bölüm 3).
3. Yalnızca ilk katkıda: kendini `public/data/contributors.json`'a ekle (bölüm 4).
4. Veri dosyalarını yaz (bölüm 5–8).
5. `npm run check` çalıştır. Yeşil olana kadar **veriyi** düzelt. Kırmızı test dosyayı, kelimeyi ve
   sorunu söyler. Testi gevşetme, atlama, silme.
6. Kendini denetle (bölüm 9).
7. Commit et, forkuna push et, `main`'e pull request aç ve şablonu doldur.
8. GitHub Actions `npm run check` ve build'i çalıştırır. Repo sahibi inceler ve birleştirir; site ve
   katkıda bulunanlar sayfası kendiliğinden güncellenir.

`main`'e yalnızca repo sahibi birleştirir.

## 3. Ne eklenecek, ne kadar

- **Kuyruktan al:** `en-root`, `de-root`, `list` ya da `affix` etiketli açık issue'lar. Aynı işi iki
  kişi yapmasın diye "bunu ben alıyorum" yaz.
- **Ya da kendin getir:** issue isteğe bağlıdır. Doğrudan pull request açabilir ya da ne ekleyeceğini
  not etmek için önce issue açabilirsin.
- **Zaten var mı diye bak**, ucuz yoldan, veriyi okumadan:
  - kök: `ls public/data/roots` (ya da `public/data/de/roots`)
  - kelime: `grep -rl '"id": "inspect"' public/data/roots`
  - nesne: `ls public/data/objects`
- **Yeni içerik getiren bir pull request'in boyutu: en az 5 kök ve 100 kelime civarı** (kök başına
  yaklaşık 20 kelime), nesnelerde en az 30 nesne. Küçük paketler, eklediklerinden çok inceleme zamanı
  alır. Düzeltmelerde (yanlış çeviri, yazım hatası, kötü cümle) alt sınır yoktur.
- Kök başına kelime: gerçekten var olan, öğrenmeye değer kelimelerin hepsi, **20 ile 40 arası**. Bir
  kökün dürüstçe daha az iyi kelimesi varsa olanı ekle; uydurma, şişirme.

Ucuz kalmak için: bu dosyayı ve eklediğin türden tek bir örnek dosyayı oku (`roots/spec.json`,
`de/roots/steh.json`, `objects/refrigerator.json`). Veri klasörünün tamamını okuma.

## 4. Emek kimin: `addedBy` ve `contributors.json`

- `public/data/contributors.json`, **GitHub kullanıcı adını** sitede görünen ada bağlar:

  ```json
  {
    "octocat": { "name": "Mona" }
  }
  ```

  `name` senin seçimin (gerçek ad ya da takma ad, en çok 30 karakter). Anahtarları A–Z sırasında tut.
- **Oluşturduğun** her kök, nesne ve liste dosyası, `"id"`'den hemen sonra
  `"addedBy": "<GitHub kullanıcı adın>"` taşır.
- **Başkasının oluşturduğu** bir köke kelime eklerken kökün `addedBy`'ına dokunma; eklediğin her
  kelimeye (kelimenin `"id"`'sinden hemen sonra) `"addedBy": "<sen>"` yaz. Kendi `addedBy`'ı olmayan
  kelime, kökü oluşturana sayılır.
- **Bir şeyi düzeltmek `addedBy`'ı asla değiştirmez.**
- Sitedeki Katkıda bulunanlar sayfası adları eşit boyda, rastgele sıralı baloncuklar olarak gösterir;
  sayılar (kişi başına kelime, bölümlere göre dağılım, eklenen kökler) yalnızca "Detay"da görünür ve
  `addedBy`'dan hesaplanır.

## 5. Tarif: İngilizce kök

Dosya: `public/data/roots/<id>.json`. Dosya adı kökün `id`'sidir (ana yazımı).

```json
{
  "id": "spec",
  "addedBy": "octocat",
  "forms": ["spec", "spect", "pect", "pic", "spic"],
  "origin": "la",
  "etymon": "specere",
  "meaning": { "en": "to look, to see", "tr": "bakmak, görmek", "de": "schauen, sehen", "fr": "regarder, voir", "it": "guardare, vedere", "es": "mirar, ver" },
  "words": [
    {
      "id": "inspect",
      "pos": "verb",
      "parent": null,
      "parts": ["in-", "spect"],
      "gloss": { "en": "to look at something closely", "tr": "incelemek, denetlemek", "de": "untersuchen, prüfen", "fr": "inspecter, examiner", "it": "ispezionare, esaminare", "es": "inspeccionar, examinar" },
      "sentences": [
        { "en": "The mechanic [inspected] the brakes before the trip.", "tr": "Tamirci yolculuktan önce frenleri inceledi.", "de": "Der Mechaniker prüfte vor der Reise die Bremsen.", "fr": "Le mécanicien a inspecté les freins avant le voyage.", "it": "Il meccanico ha ispezionato i freni prima del viaggio.", "es": "El mecánico inspeccionó los frenos antes del viaje." },
        { "en": "Please [inspect] the box before you sign for it.", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" }
      ]
    },
    {
      "id": "inspection",
      "pos": "noun",
      "parent": "inspect",
      "parts": ["in-", "spect", "-ion"],
      "gloss": { "en": "…", "tr": "…", "de": "die Inspektion", "fr": "…", "it": "…", "es": "…" },
      "sentences": [ … ]
    }
  ]
}
```

Kurallar:

- `forms`: kökün kelimelerinde geçen bütün yazımları. `origin`: `"la"` (Latince) ya da `"gr"`
  (Yunanca). `etymon`: kaynak kelime.
- **Kelime seçimi:** önce en yaygın kelimeler (günlük dil, haber, okul), sonra akademik olanlar.
  Yalnızca etimolojisi gerçekten bu köke dayananlar. Emin değilsen koyma. Nadir, eskimiş ya da jargon
  kelime yok.
- **Ağaç:** kökten doğrudan gelen kelimede `parent` `null`, türevde türediği kelimenin `id`'si
  (inspect → inspection, inspector). Ebeveyn aynı dosyada olmalı.
- **`parts`** birleşince kelimeyi tam olarak hecelemeli: ön ek kimlikleri (`-` ile biter), kökün
  `forms`'undan biri, son ek kimlikleri (`-` ile başlar). `["de-", "script", "-ion"]` → *description*.
- **`pos`:** `verb`, `noun`, `adjective`, `adverb` ya da `preposition`.
- **`gloss.en`:** kısa, öğretici bir tanım; kökün izini gösteriyorsa "literally: …" ekle.
  `tr, de, fr, it, es`: o dildeki doğal karşılık; isimler artikelle (`die Inspektion`, `la inspección`).
- **`sentences`:** en az 2 (kelime çok anlamlıysa 3). İyi cümlenin ne olduğu bölüm 9'da. Hedef kelime
  İngilizce cümlede `[köşeli parantez]` içinde, tam bir kez, kendisi ya da düzenli çekimi olarak
  durur. Beş çevirinin hepsi zorunlu.

### Yeni ön ekler ve son ekler

`parts`'ta kullanılan her ek `public/data/affixes.json`'da bulunmalı. Eksik olanı oraya ekle:

```json
"re-": { "kind": "prefix", "meaning": { "en": "again, back", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" } },
"in-not-": { "kind": "prefix", "form": "in", "meaning": { "en": "not", … } },
"photo-": { "kind": "prefix", "combining": true, "meaning": { "en": "light (Greek phos)", … } }
```

- Ön ek kimliği `-` ile biter, son ek kimliği `-` ile başlar.
- Aynı yazılan iki farklı ek ayrı kimlik alır ve yazımını `form` ile söyler (`"in-"` içine,
  `"in-not-"` değil).
- Aslında başka bir ismin, sıfatın ya da sayının gövdesi olan parça (`photo-`, `geo-`, `-logy`)
  `"combining": true` alır; gerçek ön ve son ekler (`re-`, `un-`, `-ion`) almaz.
- Ek eklemeden önce zaten var mı bak: `grep -n '"re-"' public/data/affixes.json`.

## 6. Tarif: Almanca kök

Dosya: `public/data/de/roots/<id>.json`, ekler `public/data/de/affixes.json`'da. İngilizce kökle aynı
düzen, şu farklarla:

```json
{
  "id": "steh",
  "addedBy": "octocat",
  "forms": ["steh", "stand", "ständ"],
  "origin": "de",
  "etymon": "stehen",
  "meaning": { "en": "to stand", "tr": "ayakta durmak, durmak", "de": "stehen, aufrecht sein (stand, gestanden)", "fr": "…", "it": "…", "es": "…" },
  "words": [
    {
      "id": "Verstand",
      "pos": "noun",
      "parent": "verstehen",
      "parts": ["ver-", "stand"],
      "gloss": { "en": "mind, reason, intellect", "tr": "…", "de": "die Fähigkeit zu denken und zu verstehen", "fr": "…", "it": "…", "es": "…" },
      "sentences": [
        { "de": "Er hat einen scharfen [Verstand].", "tr": "…", "en": "…", "fr": "…", "it": "…", "es": "…" }
      ]
    }
  ]
}
```

- Kökler **Almanca gövdelerdir**, Latince değil. `origin` `"de"`, `etymon` mastar.
- `gloss.de` kısa Almanca tanım; öbür beşi çeviri.
- Cümle **Almancadır** (`[işaretli]` kelime `de`'dedir); çeviriler `tr, en, fr, it, es`.
- `parts` küçük harfle yazılır; ismin büyük harfi `id`'den gelir (`Verstand` = `ver-` + `stand`).
- Ayrılabilen fiiller cümlede bölünmemiş geçer (mastar ya da ortaç: `aufstehen`, `abgefahren`).
  İşaretli kelime kökün `forms`'undan birini içermeli.
- Ünlü değişimleri ayrı `forms`'tur (`steh`, `stand`, `ständ`).
- Ek kimliklerinde ä, ö, ü, ß olabilir. Birleşik kelimedeki ikinci gövde `"combining": true` taşıyan
  bir ektir (`-zeug`, `-karte`, `teil-`).

## 7. Tarif: gündelik nesne

Dosya: `public/data/objects/<id>.json`. `id` İngilizce addır, boşluk yerine tire (`paper-clip`).

```json
{
  "id": "refrigerator",
  "addedBy": "octocat",
  "name": "refrigerator",
  "names": { "tr": "buzdolabı", "de": "der Kühlschrank", "fr": "le réfrigérateur", "it": "il frigorifero", "es": "el frigorífico" },
  "definition": { "en": "a machine that keeps food cold", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" },
  "breakdown": {
    "en": [
      { "text": "re", "gloss": "again", "affix": "re-" },
      { "text": "frig", "gloss": "cold (Latin frīgus)" },
      { "text": "er", "gloss": "verb stem (refrigerāre)" },
      { "text": "ator", "gloss": "thing that does", "affix": "-ator" }
    ],
    "de": [
      { "text": "Kühl", "gloss": "cool (kühlen = to cool)" },
      { "text": "schrank", "gloss": "cupboard" }
    ]
  },
  "origin": "Latin refrigerāre (to make cool again: re- + frīgus, cold)",
  "root": null,
  "image": { "file": "LG refrigerator interior.jpg", "wikidata": "Q37828" },
  "sentences": [
    { "en": "Put the milk back in the [refrigerator].", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" },
    { "en": "…", … },
    { "en": "…", … }
  ]
}
```

Adımlar:

1. `node scripts/lookup-object.mjs "<ingilizce ad>"` çalıştır. Wiktionary anlamlarını, çevirilerini,
   kökenini ve fotoğraflı Wikidata adaylarını yazar. **Doğru anlamın** çevirisini seç (chalk: yazı
   yazılan çubuk, taş değil). Wikidata'dan yalnızca fotoğraf dosyasını ve Q kimliğini al; etiketleri
   güvenilir çeviri değildir.
2. `names`: insanların gerçekten kullandığı ad, artikelle (`die Kreide`, `la craie`).
3. `definition`: kısa, kendi sözlerinle, altı dilde.
4. `breakdown.en`: yalnızca ad gerçekten parçalanıyorsa (dish·wash·er, tooth·brush). Parça bir
   specroots kökü ya da ekiyse `"root": "<kök id>"` ya da `"affix": "<ek id>"` ekle. İki dilde de
   parçalanmıyorsa `{}` yaz.
5. `breakdown.de`: **Almanca ad birleşik ya da türemişse zorunlu** (Kühl·schrank, Schneide·brett).
   Bağlama sesi ayrı parça olabilir (`{ "text": "s", "gloss": "linking s" }`). Parçalar birleşince adı
   artikelsiz olarak hecelemeli.
6. `origin`: tek satır. `root`: ad bir specroots kökünden geliyorsa o kökün kimliği, yoksa `null`.
7. `image`: `https://commons.wikimedia.org/wiki/Special:FilePath/<dosya>?width=320` açılmalı ve
   fotoğraf nesneyi gerçekten göstermeli (tablo, logo ya da adaş bir şey olmasın). Uygun fotoğraf
   yoksa `null`.
8. `sentences`: **3** tane, her biri başka bir durumda: evde, dışarıda (dükkân, iş) ve mümkünse bir
   deyim ya da mecaz (*throw in the towel*). Her çeviride o dilin deyimini kullan (*jeter l'éponge*,
   *das Handtuch werfen*). Hedef kelime `[köşeli parantez]` içinde; çoğul olabilir.
9. Nesnenin kimliğini ait olduğu her listenin `objects` dizisine ekle. Zaten var olan bir nesne
   yeniden oluşturulmaz; yalnızca kimliği listeye girer.

## 8. Tarif: liste

Dosya: `public/data/lists/<id>.json`:

```json
{
  "id": "garden",
  "addedBy": "octocat",
  "title": { "en": "Garden", "tr": "Bahçe", "de": "Garten", "fr": "Jardin", "it": "Giardino", "es": "Jardín" },
  "objects": ["rake", "watering-can", "wheelbarrow"]
}
```

`objects`'teki her kimliğin `public/data/objects/` altında dosyası olmalı. Önce o yerde herkesin her
gün gördüğü şeyler, sonra daha nadir ama adı bilinmeye değer olanlar. Yiyecekler de girer.

## 9. Kalite kuralları (bütün bölümler)

**İyi bir örnek cümle**

- Kısa (en çok 12 kelime) ve yaygın kelimelerle kurulu; tek yeni kelime hedef kelime olsun.
- Anlamı gösterir: *"The [inspector] asked to see the kitchen."* iyidir, *"He is an [inspector]."* değil.
- Her çeviride doğal; kelime kelime değil, serbest çevir.
- **Kendi cümlen.** Sözlükten, ders kitabından ya da başka siteden kopyalama.

**Pull request açmadan önce** rastgele şunları yeniden oku: 5 kelimenin etimolojisi, 5 çeviri ve
3 cümle. Şüpheli olanı düzelt ya da çıkar. İçeriği AI ile yazdıysan sorumlusu yine sensin;
okuyabildiğin dilleri kendin denetle.

**Yapma**

- başkasının kelimelerini düzenleme ya da silme; gerçek bir hatayı düzeltmek dışında (hangisi olduğunu
  pull request'te yaz);
- var olan hiçbir şeyin `addedBy`'ını değiştirme;
- üretilen indeks dosyalarını commit'e ekleme;
- koda, testlere, workflow'lara ya da repo ayarlarına dokunma;
- geçsin diye testi gevşetme.

## 10. Pull request

Başlık: `data: <kökler ya da liste> (+N words)`, örneğin `data: vert, voc, cur, spir, flect (+97 words)`.
Şablon ne eklediğini ve kaç kelime olduğunu sorar ve tek bir zorunlu kutusu vardır: **eklediğin içerik
bu reponun lisansıyla yayımlanır.** Pull request issue kapatıyorsa `Closes #12` yaz.

## 11. İleride yeni bir içerik türü eklemek

Her bölüm aynı kalıbı izler: **bir veri klasörü + bu dosyada bir tarif + tarifi zorlayan testler.**
Yeni bir bölüm ya da yeni bir dil, repo sahibi tarafından bir klasör, buraya bir tarif ve testleri
olarak eklenir; bu dosyanın geri kalanı değişmez.
