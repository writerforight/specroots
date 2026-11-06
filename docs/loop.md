# specroots döngüsü: kök turu ↔ liste turu

`/loop` bu dosyayla çalışır. Her uyanışta bu dosyanın tamamını oku ve **tek bir tur** yap.
Repo: `~/Desktop/projects/specroots`. Bağlayıcı kurallar: `SPEC.md`.

## Bir tur
1. `git pull --rebase`. Başka bir oturum (ör. bulutta çalışan Claude) da bu repoya yazıyor olabilir:
   **onun commit'lerini asla geri alma (revert etme)**; çakışma olursa iki tarafın işini birleştir.
2. Aşağıdaki "Sıradaki tur" satırına bak:
   - **kök** ise: `docs/grow-loop.md`'deki talimatla bir tur (yeni kuyruktan 2 kök).
   - **liste** ise: `docs/objects-loop.md`'deki talimatla bir tur (ilk dolmamış listeye 10 nesne).
3. Tur bitince "Sıradaki tur"u öbürüne çevir, "Günlük"e bir satır yaz, bu dosyayı da aynı commit'e kat.
   Push reddedilirse `git pull --rebase` ve bir kez daha dene.
4. Kısa rapor (kullanıcı Türkçe okur): ne eklendi, toplamlar, şüpheli bıraktığın bir şey.

## Sürdürme / durdurma
- İki kuyruk da bitmediyse sonraki turu ~60 saniye sonraya planla. Biri bittiyse yalnız öbürünü çalıştır.
- İkisi de bittiyse README'leri (3 dil) ve SPEC'i güncelle, push et, döngüyü durdur.
- Aynı test iki turdur düzelmiyorsa ya da push iki kez reddedilirse döngüyü durdur ve nedenini yaz.

## Sıradaki tur
liste

## Günlük
- 2026-11-06: döngü kuruldu (D5 listeler iskeleti bitti: 30 nesne, 3 liste; 63 kök).
- 2026-11-06: kök turu — fin (+23), manu (+16); toplam 65 kök, 1529 kelime. Yeni ekler: -ish, -age, -ery, -o; birleşik parçalar -cure, -pul, -fest, -script, -fact.
- 2026-11-06: liste turu — mutfak +10 (spoon, fork, knife, plate, bowl, refrigerator, oven, dishwasher, onion, bread) + sünger mutfağa da; 40 nesne, mutfak 21/100.
- 2026-11-06: kök turu — ped (+11), corp (+10); toplam 67 kök, 1550 kelime. Yeni ekler: -ian, -ulent, bi-, quadru-.
- 2026-11-06: liste turu — mutfak +10 (cup, teapot, saucepan, microwave, toaster, salt, egg, cheese, rice, butter); 50 nesne, mutfak 31/100.
- 2026-11-06: kök turu — sci (+11), nov (+10); toplam 69 kök, 1571 kelime. Yeni ekler: -ness, -ice, omni-. README kök listeleri artık index.json'dan üretiliyor.
- 2026-11-06: liste turu — mutfak +10 (sink, freezer, napkin, tray, bottle, milk, sugar, flour, tomato, potato); 60 nesne, mutfak 41/100.
- 2026-11-06: kök turu — mort (+8), viv (+12); toplam 71 kök, 1591 kelime. Yeni ekler: -id, -amin, -gage.
