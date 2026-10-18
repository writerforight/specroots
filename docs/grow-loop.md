# specroots büyütme döngüsü

Bu dosya `/loop` ile çalışan ajanın talimatıdır. Her tur bu dosyanın tamamını oku ve **tek bir tur** yap.
Repo: `~/Desktop/projects/specroots`. Bağlayıcı kurallar: `SPEC.md`, veri biçimi: `CONTRIBUTING.md`.

## Hedef
50 kök, her kökte **gerçekte var olan, öğrenmeye değer kelimelerin hepsi: en az 20, en fazla 40.**
Bir kökün 20 sağlam kelimesi yoksa uydurma; bulabildiğin kadarını koy ve aşağıdaki kuyrukta kökün
yanına `(az: N)` yaz. Toplam hedef ≈ 1000–2000 kelime.

## Bir tur
1. `git pull`. Kuyruktaki ilk **3** işaretsiz kökü al (önce "Genişlet", sonra "Yeni").
2. Her kök için `public/data/roots/<id>.json` yaz ya da genişlet:
   - **Kelime seçimi:** önce en yaygın kelimeler (günlük dil, haber, okul), sonra akademik olanlar.
     Sadece etimolojisi gerçekten bu köke dayananlar. Emin olmadığını koyma. Nadir, eskimiş ya da
     teknik jargon kelimeleri koyma.
   - **Ağaç:** `parent` ile kur. Kökten doğrudan türeyen temel kelimeler `null`, türevler ebeveynine
     bağlı (inspect → inspection, inspector; inspection'dan türeyen varsa ona).
   - **Parçalar:** `parts` kelimeyi tam heceler. Kökün kelimelerde geçen bütün yazımları `forms`'a
     girer. Yeni ön/son ekleri `public/data/affixes.json`'a 6 dilde anlamıyla ekle. Aynı yazılışlı
     farklı ekler ayrı kimlik + `form` alır (`"in-not-": { "form": "in", … }`). Başka kökten gelen
     birleşik parçalar ön ek olarak girer (`"photo-"`, `"tele-"`).
   - **Anlamlar:** `gloss.en` kısa, öğretici bir tanım (gerekirse "literally: …" ile kökün izini göster).
     `tr, de, fr, it, es` o dildeki doğal karşılık; Almancada artikel ile (`die Inspektion`), diğer
     dillerde de isimlerde artikel ile.
   - **Cümleler:** kelime başına 2 (çok anlamlıysa 3). Kısa (≤ 12 kelime), yaygın kelimelerle,
     anlamı gösteren cümle. İngilizcede hedef kelime `[köşeli parantez]` içinde ve kelimenin kendisi
     ya da düzenli çekimi olsun. 5 dile doğal çeviri. Cümleler senin; sözlüklerden kopyalama.
     Fourier örneği kullanma.
3. `npm run data` sonra `npm run check`. Kırmızıysa veriyi düzelt; **testleri gevşetme, silme.**
   Kod hatası bulursan ayrı commit'te düzelt ve nedenini commit mesajına yaz.
4. Kendini denetle: rastgele 5 kelimenin etimolojisi, 5 çeviri ve 3 cümleyi yeniden oku; şüpheli
   olanı düzelt ya da çıkar.
5. Bu dosyadaki kuyrukta yaptığın kökleri `[x]` yap ve yanına kelime sayısını yaz (`[x] spec — 31`).
   "Durum" satırını güncelle.
6. Commit (Co-Authored-By satırı **ekleme**) ve push:
   `data: <kökler> (+N words, total M)`. Testler yeşil değilse push yok.
7. Kısa rapor: hangi kökler, kaç kelime eklendi, toplam, şüpheli bıraktığın bir şey var mı.

## Döngüyü sürdürme / durdurma
- Kuyrukta işaretsiz kök kaldıysa sonraki turu ~60 saniye sonraya planla.
- Hepsi `[x]` ise: son bir kez README'deki "Roots so far" bölümünü (3 dilde) ve SPEC'teki
  "Aşamalar"ı güncelle, push et ve döngüyü durdur.
- Aynı test iki turdur düzelmiyorsa ya da push reddediliyorsa döngüyü durdur ve nedenini yaz.

## Durum
Kök: 5 / 50 · Kelime: 33

## Kuyruk

### Genişlet (mevcut 5 kök, 20–40 kelimeye)
- [ ] spec (expect, suspect, prospect, special, species, specimen, spectacle, spectrum, aspect, retrospect, conspicuous…)
- [ ] port (support, deport, opportunity, passport, porter, portfolio, airport, purport…)
- [ ] dict (dictator, verdict, indicate, addict, edict, diction, contradiction, jurisdiction…)
- [ ] duc (conduct, deduce, induce, reduce, seduce, abduct, aqueduct, educator, producer, productive…)
- [ ] scrib (prescribe, inscribe, transcribe, scribble, scripture, transcript, postscript, describable…)

### Yeni (Latince)
- [ ] aud — duymak
- [ ] vid / vis — görmek
- [ ] ject — atmak
- [ ] mit / miss — göndermek
- [ ] pend / pens — asmak, tartmak
- [ ] tract — çekmek
- [ ] struct — kurmak
- [ ] rupt — kırmak
- [ ] fer — taşımak
- [ ] cap / cept / ceive — almak
- [ ] ced / cess — gitmek
- [ ] cred — inanmak
- [ ] fac / fact / fect — yapmak
- [ ] form — biçim
- [ ] grad / gress — adım atmak
- [ ] junct — birleştirmek
- [ ] loc — yer
- [ ] mov / mot — hareket etmek
- [ ] pon / pos — koymak
- [ ] press — bastırmak
- [ ] sent / sens — hissetmek
- [ ] sist / sta — durmak
- [ ] ten / tain — tutmak
- [ ] tend / tens — germek, uzanmak
- [ ] vert / vers — çevirmek
- [ ] voc / vok — seslenmek
- [ ] cur / curs — koşmak
- [ ] spir — nefes almak
- [ ] flect / flex — bükmek
- [ ] pel / puls — itmek
- [ ] clud / clus — kapamak
- [ ] cid / cis — kesmek
- [ ] mand — emretmek
- [ ] ven / vent — gelmek
- [ ] plic / ply — katlamak

### Yeni (Yunanca, `"origin": "gr"`)
- [ ] graph / gram — yazmak, çizmek
- [ ] phon — ses
- [ ] bio — yaşam
- [ ] log — söz, bilim
- [ ] chron — zaman
- [ ] metr / meter — ölçmek
- [ ] path — duygu, acı
- [ ] morph — biçim
- [ ] photo — ışık
- [ ] scop — bakmak
