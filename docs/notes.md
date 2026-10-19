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
- D4 (eklerle gezinme) için bir eki taşıyan bütün kelimeleri bulmak tüm kök dosyalarını (≈1.3 MB)
  yüklemeyi gerektirir. Öneri: `npm run data` bir `affix-index.json` da üretsin (ek → [kök, kelime]).

### SPEC / README tutarsızlıkları
- README.md / README.de.md / README.tr.md "Roots so far" hâlâ D0 durumunu (5 kök, 33 kelime) yazıyor.
  grow-loop.md'ye göre bu, kuyruk bitince güncellenecek (bir tur kaldı).
- SPEC "Aşamalar": D1 (Wiktionary/Tatoeba veri hattı, lisans ve atıf sayfası) yapılmadı; D2 verisi
  elle yazılıyor (grow-loop.md). SPEC'teki D2 tanımı ("veri hattıyla üretilip") ve karar 3 (veri
  kaynağı) buna göre güncellenmeli. Karar bekliyor: D1 atlanıyor mu, sonra mı yapılacak?
- SPEC karar 3 "Şu anki 5 köklü demo verisi elle yazıldı" diyor; artık 48 kök.
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
- Karar bekleyen: D1 (veri hattı) kaldırılsın mı, sonraya mı kalsın? Sonraki aşama D3 (PWA) mı
  D4 (eklerle gezinme) mi?

### D4: eklerle gezinme (kullanıcı isteği, 2026-10-19)
- İstek: kök / ön ek / son ek üç gezinme modu; karşılama ekranı ilk açılışta hangisiyle başlanacağını
  sorar, Ayarlar'dan değişir. SPEC'e eklendi; D2 bitince yapılacak.
- Açık sorular: sol listede ekler nasıl sıralanır (alfabetik mi, kelime sayısına göre mi)? Homograf
  ekler (`in-` / `in-not-`) ayrı satır mı, tek satırda iki anlam mı? Birleşik parçalar (`photo-`,
  `tele-`) ön ek listesinde mi görünür, ayrı bir grup mu? URL biçimi (`#/prefix/re-`?).
