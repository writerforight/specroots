# specroots notları

Her turda güncellenir: optimizasyon, SPEC ile tutarsızlıklar, issue durumu, şüpheli veri, açık sorular.
Bağlayıcı kararlar burada değil `SPEC.md`'dedir; buradaki bir not karar olunca SPEC'e taşınır.

## 2026-10-19

### Issue / PR durumu
- GitHub'da hiç issue yok (açık ya da kapalı), açık PR yok. İlk dış katkı geldiğinde burada izlenir.

### Optimizasyon (karar: şimdilik yalnızca not, D3 PWA'da birlikte ele alınacak)
- Kök dosyaları açılınca tek tek yükleniyor (`JsonLexiconRepository.getRoot`); iyi, değişmesin.
- `affixes.json` (≈70 KB, 238 ek) açılışta `index.json` ile birlikte bekleniyor (`App.start`);
  ilk ekran yalnızca kök listesine ihtiyaç duyuyor. Ek kataloğu ilk kök açılınca yüklenebilir.
- `index.json` girintili yazılıyor (≈33 KB, 932 kelime). Sıkıştırılmış yazmak ≈%40 küçültür;
  Pages gzip'liyor, kazanç küçük. Diff okunurluğu için şimdilik girintili kalabilir.
- Arama her tuşta bütün kayıtları tarıyor (≈1000 kayıt); 2000 kelimede de sorun değil.
- Bundle: JS 29 KB (gzip 11 KB), CSS 10 KB. Sorun yok.
- D4: `affix-index.json` (≈29 KB, 251 ek) yalnızca ön ek / son ek modunda yükleniyor. Bir ek
  sayfası onu taşıyan köklerin dosyalarını yüklüyor: `-ion` 29 kök (≈790 KB ham), `re-` 29 kök
  (≈740 KB ham); Pages gzip'le gönderir. Önbellekte kaldıkları için ikinci açılış anında. Yavaş bağlantıda ilk açılış birkaç
  saniye sürebilir; sorun olursa ek sayfası için kelime başına parça + kısa anlam içeren hafif bir
  özet dosyası üretilebilir. D3 (PWA) önbelleği bunu da çözer.

### SPEC / README tutarsızlıkları
- README'lerdeki kök listesi D2 sonunda güncellendi (DE ve TR'de bölüm yoktu, eklendi).
- SPEC "Aşamalar": D1 (Wiktionary/Tatoeba veri hattı, lisans ve atıf sayfası) yapılmadı; D2 verisi
  elle yazıldı. SPEC karar 3 ve D2 satırı bunu söyleyecek şekilde güncellendi. Karar bekliyor:
  D1 kaldırılıyor mu, sonra mı yapılacak? README'lerin lisans bölümü hâlâ "ileride Wiktionary/Tatoeba"
  diyor; D1 kaldırılırsa o cümle de çıkar.
- grow-loop.md repo yolunu `~/Desktop/projects/specroots` olarak veriyor; bulut oturumunda yol farklı.

### Veri
- İki köke birden ait birleşik kelimeler iki kez sayılıyor: `biography`, `autobiography` (graph ve
  bio), `photograph`, `photography`, `photographer` (graph ve photo). `npm run data` 954 kayıt sayıyor,
  ayrı kelime sayısı 949; README 949 yazıyor. Arama bu kelimeler için iki sonuç gösterir (iki köke de
  gidebilmek için doğru davranış). Cümleleri iki kökte farklı tutuldu.
- Bu tur (metr, path, morph) bilerek dışarıda bırakılanlar: *metropolis* (meter = anne),
  *dimension*, *immense* (Latince metiri), *path* = yol (Germen), *patient*, *passion* (Latince pati),
  *morphine* (Morpheus'tan; köke bağı dolaylı), teknik terimler (*polymorphism*, *isometric*).
- Yeni homograf ek: `em-gr-` (Yunanca en-, empathy) ≠ `em-` (Fransızca in-, embrace).
- `-ometer` son eki (chronometer) ile metr kökündeki `meter` biçimi aynı parçayı iki farklı yoldan
  gösteriyor. chron kökünde `chron · -ometer`, metr kökünde `thermo- · meter`. İkisi de doğru
  hecelenir; ileride tek yola indirilebilir.
- Az kelimeli kökler (20'nin altında): aud 9, mand 9, morph 9, bio 10, chron 10, cred 11, photo 11,
  scop 11, loc 12, flect 13, pel 14, rupt 15, junct 15, voc 15, cid 15, phon 15, spir 17, path 18.
- photo/scop turu bilerek dışarıda bırakılanlar: *photocopier* (parçalanışı zorlama), *photovoltaic*,
  *photobomb* (yeni argo), *bishop/episcopal* (episkopos'tan ama yazımda kök görünmüyor), *skeptic*
  (yakın ama ayrı kök skep-), *oscilloscope* (teknik).

### Aşama durumu
- D2 bitti (2026-10-19): 50 kök, 949 kelime. README (3 dil) ve SPEC güncellendi.
- D4 bitti (2026-10-19). Karar bekleyen: D1 (veri hattı) kaldırılsın mı, sonraya mı kalsın?
  Sıradaki aşama D3 (PWA).

### D4: eklerle gezinme (bitti, 2026-10-19)
- Yapıldı: Kökler · Ön ekler · Son ekler düğmesi, karşılama ekranında ve Ayarlar'da mod seçimi,
  `#/affix/<ek>` sayfası, kelime kartındaki ek etiketlerinden ek sayfasına bağlantı.
- Kullanıcı yanıt vermediği için önerilen varsayılanlar uygulandı: liste alfabetik; homograf ekler
  ayrı satır (anlamları ayırıyor). Değiştirilmek istenirse kolay.
- Bekleyen: birleşik parçalar (`photo-`, `tele-`, `geo-`, `psycho-`…) ön ek listesinde gerçek ön
  eklerle karışık. Ayırmak için `affixes.json`'a bir işaret (ör. `"combining": true`) gerekir;
  hangi eklerin işaretleneceği veri kararı.
- Bekleyen: arama ekleri bulmuyor (`-ion` yazınca ek sayfası gelmiyor). SearchIndex'e ek kayıtları
  eklenebilir.
- Ek listesinde aynı eki taşıyan kelime sayıları büyük farklı: `-ion` 121, `re-` 71; tek kelimelik
  ekler (`-abulary`, `-acity`…) çoğunlukta. Liste uzun (251 ek); harf başlıkları yardımcı oluyor.
