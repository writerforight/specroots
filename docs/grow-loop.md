# specroots büyütme döngüsü

Bu dosya kök turlarının talimatıdır; turları `docs/loop.md` sırayla çağırır (kök turu ↔ liste turu).
Her tur bu dosyanın tamamını oku ve **tek bir tur** yap.
Repo: `~/Desktop/projects/specroots`. Bağlayıcı kurallar: `SPEC.md`, veri biçimi: `CONTRIBUTING.md`.

## Hedef
50 kök, her kökte **gerçekte var olan, öğrenmeye değer kelimelerin hepsi: en az 20, en fazla 40.**
Bir kökün 20 sağlam kelimesi yoksa uydurma; bulabildiğin kadarını koy ve aşağıdaki kuyrukta kökün
yanına `(az: N)` yaz. Toplam hedef ≈ 1000–2000 kelime.

## Bir tur
1. `git pull --rebase`. Kuyruktaki ilk **2** işaretsiz kökü al (en alttaki "Yeni (2026-11-06)" kuyruğu).
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
Kök: 75 · Kelime: 1633 kayıt, 1624 ayrı kelime (5 birleşik kelime iki kökte). Kuyruk bitti; D2 kapandı (2026-10-19, 949 kelime). 2026-10-22: mevcut köklere +177 kelime, 51. kök nunci (+15), 52. kök cad (+20). 2026-10-29: mevcut 37 köke +177 kelime. 2026-10-30: 53. kök tempt (+10), 54. kök act (+25), 55. kök nect (+13). 2026-10-31: 56. kök trib (+14); pel'e appeal ailesi (+3). 2026-11-06: 57. kök prehend (+19); 58. kök sequ (+14), 59. kök solv (+11), 60. kök vinc (+12); 61. kök leg (+14), 62. kök sum (+10), 63. kök scend (+9).

## Kuyruk

### Genişlet (mevcut 5 kök, 20–40 kelimeye)
- [x] spec — 29 (expect, suspect, prospect, special, species, specimen, spectacle, spectrum, aspect, retrospect, conspicuous…)
- [x] port — 20 (support, deport, opportunity, passport, porter, portfolio, airport, purport…)
- [x] dict — 25 (dictator, verdict, indicate, addict, edict, diction, contradiction, jurisdiction…)
- [x] duc — 30 (conduct, deduce, induce, reduce, seduce, abduct, aqueduct, educator, producer, productive…)
- [x] scrib — 24 (prescribe, inscribe, transcribe, scribble, scripture, transcript, postscript, describable…)

### Yeni (Latince)
- [x] aud — duymak — 9 (az: 9)
- [x] vid / vis — görmek — 27
- [x] ject — atmak — 20
- [x] mit / miss — göndermek — 26
- [x] pend / pens — asmak, tartmak — 24
- [x] tract — çekmek — 20
- [x] struct — kurmak — 20
- [x] rupt — kırmak — 15 (az: 15)
- [x] fer — taşımak — 20
- [x] cap / cept / ceive — almak — 26
- [x] ced / cess — gitmek — 25
- [x] cred — inanmak — 11 (az: 11)
- [x] fac / fact / fect — yapmak — 28
- [x] form — biçim — 22
- [x] grad / gress — adım atmak — 20
- [x] junct — birleştirmek — 15 (az: 15)
- [x] loc — yer — 12 (az: 12)
- [x] mov / mot — hareket etmek — 23
- [x] pon / pos — koymak — 23
- [x] press — bastırmak — 20
- [x] sent / sens — hissetmek — 20
- [x] sist / sta — durmak — 25
- [x] ten / tain — tutmak — 21
- [x] tend / tens — germek, uzanmak — 20
- [x] vert / vers — çevirmek — 22
- [x] voc / vok — seslenmek — 15 (az: 15)
- [x] cur / curs — koşmak — 20
- [x] spir — nefes almak — 17 (az: 17)
- [x] flect / flex — bükmek — 13 (az: 13)
- [x] pel / puls — itmek — 14 (az: 14)
- [x] clud / clus — kapamak — 20
- [x] cid / cis — kesmek — 15 (az: 15)
- [x] mand — emretmek — 9 (az: 9)
- [x] ven / vent — gelmek — 22
- [x] plic / ply — katlamak — 23
- [x] nunci / nounce — bildirmek — 15 (az: 15; 2026-10-22, kullanıcı isteğiyle 51. kök)
- [x] cad / cid / cas — düşmek — 20 (2026-10-22, kullanıcı isteğiyle 52. kök; `cid` kesmek değil)
- [x] tempt / tent — denemek, sınamak — 10 (az: 10; 2026-10-30, kullanıcı isteğiyle 53. kök)
- [x] act / ag — yapmak, yürütmek — 25 (2026-10-30, kullanıcı isteğiyle 54. kök; `fac` değil)
- [x] nect / nex — bağlamak — 13 (az: 13; 2026-10-30, kullanıcı isteğiyle 55. kök)
- [x] trib / tribut — vermek, paylaştırmak — 14 (az: 14; 2026-10-31, kullanıcı isteğiyle 56. kök)

### Yeni (Yunanca, `"origin": "gr"`)
- [x] graph / gram — yazmak, çizmek — 20
- [x] phon — ses — 15 (az: 15)
- [x] bio — yaşam — 10 (az: 10)
- [x] log — söz, bilim — 20
- [x] chron — zaman — 10 (az: 10)
- [x] metr / meter — ölçmek — 20
- [x] path — duygu, acı — 18 (az: 18)
- [x] morph — biçim — 9 (az: 9)
- [x] photo — ışık — 11 (az: 11)
- [x] scop — bakmak — 11 (az: 11)

### Yeni (2026-11-06, kullanıcı onayı: "kökler uygun")
Latince (`"origin": "la"`):
- [x] fin — 23 — son, sınır (finish, final, define, infinite, confine)
- [x] man / manu — 16 (az: 16) — el (manual, manufacture, manuscript, manage, manipulate)
- [x] ped / pedi — 11 (az: 11) — ayak (pedal, pedestrian, expedition, impede) — Yunanca *paid-* (çocuk) ile karıştırma
- [x] corp / corpor — 10 (az: 10) — beden (corpse, corporation, incorporate, corporal)
- [x] sci — 11 (az: 11) — bilmek (science, conscious, conscience, omniscient)
- [x] nov — 10 (az: 10) — yeni (novel, novice, innovate, renovate)
- [x] mort — 8 (az: 8) — ölüm (mortal, immortal, mortgage, mortify)
- [x] viv / vit — 12 (az: 12) — yaşamak (vivid, survive, revive, vital, vitamin)
- [x] terr — 9 (az: 9) — toprak (territory, terrain, terrace, Mediterranean, extraterrestrial)
- [x] aqu — 6 (az: 6) — su (aquarium, aquatic, aqueduct)
- [x] ann / enn — 6 (az: 6) — yıl (annual, anniversary, annuity, perennial, millennium)
- [x] fort — 14 (az: 14) — güç (fort, fortress, effort, comfort, fortify)
- [ ] grat — hoş, teşekkür (grateful, gratitude, congratulate, gratis)
- [ ] magn — büyük (magnify, magnitude, magnificent, magnate)
- [ ] ment — akıl (mental, mention, comment, demented)
- [ ] nat — doğmak (native, nation, nature, prenatal, innate)
- [ ] nomin / nom — ad (nominate, nominal, denomination, nominee)
- [ ] sign — işaret (signal, signature, design, assign, resign, significant)
- [ ] temp / tempor — zaman (temporary, contemporary, tempo) — `tempt` (denemek) ile karıştırma
Yunanca (`"origin": "gr"`):
- [ ] therm — ısı (thermal, thermometer, thermostat)
- [ ] hydr — su (hydrogen, hydrate, dehydrate, hydraulic)
- [ ] psych — ruh (psychology, psychic, psychiatrist)
- [ ] dem — halk (democracy, epidemic, demographic)
- [ ] crat / crac — güç, yönetim (democrat, bureaucracy, aristocrat)
- [ ] phil — sevmek (philosophy, philanthropy, bibliophile)
- [ ] soph — bilgelik (sophisticated, sophomore, philosophy)
- [ ] techn — sanat, beceri (technical, technique, technology)
Not: `hydro-`, `psycho-`, `therm-` gibi parçalar `affixes.json`'da birleşik parça olarak varsa kök dosyası
yine açılır; kelimelerin `parts`'ında kök yazımı kullanılır.
