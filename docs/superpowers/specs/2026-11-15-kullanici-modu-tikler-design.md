# Kullanıcı modu ve okundu tikleri — tasarım

Tarih: 2026-11-15. Durum: kullanıcı onayladı (2026-11-15). SPEC.md'ye **karar 20** olarak işlenecek.

## Amaç ve neden

Site sahibi specroots'u kendi çalışma aracı olarak da kullanıyor. Baktığı kelimeleri her girişte
yeniden "yeni" gibi görmek istemiyor. İstenen: yalnızca onun açabildiği bir **kullanıcı modu**; bu
modda kelimeleri ve kökleri "okundu" diye tikleyebilsin, tikliler soluk görünsün, her kökte kaç
kelimenin tikli olduğu yazsın ve tikler bilgisayarla telefonda aynı olsun.

## Hedefler (kullanıcının söyledikleri)

1. Kelime başına tik. Tikli kelime **kaybolmaz, soluk görünür**. Tike tekrar basmak geri alır.
2. Kök başına ayrı bir tik ("bu kökü okudum") **ve** bir sayaç: `12/30` = içindeki kelimelerden kaçı tikli.
3. Yalnızca **İngilizce ve Almanca kökler**. Nesne listeleri ve gündelik ifadeler kapsam dışı.
4. Mod, ayarlardan **4 haneli şifreyle** açılır. Mod kapalıyken sitede bu özelliğe dair hiçbir şey görünmez.
5. Tikler **bilgisayar ve telefonda aynı**. Telefonda bir kez kurulum yapmak kabul.
6. Görünüm **sessiz**: kutu, ilerleme çizgisi, rozet yok. Küçük açık gri bir ✓ (tikliyken metin
   rengi) ve küçük gri bir sayı. Onaylanan taslak:
   `.superpowers/brainstorm/15561-1794755429/content/tik-taslak-v2.html` (git dışında, yerel).
7. Şimdilik tek kullanıcı: site sahibi.

## Hedef olmayanlar

- Ziyaret sayacı ve yönetim paneli (ayrı proje, sonra konuşulacak).
- Başka ziyaretçilerin kendi tiklerini tutması, hesap sistemi.
- Aralıklı tekrar, istatistik grafikleri, "tiklileri gizle" süzgeci.
- Sunucu ya da üçüncü taraf servis (Cloudflare, Firebase…). Site statik kalır.

## Karşı hedefler (teknik olarak çalışsa da başarısızlık sayılır)

- Normal ziyaretçinin arayüzde tik, sayaç, soluk kelime ya da "kullanıcı modu" girişi görmesi.
- Normal ziyaretçinin tarayıcısından GitHub API'ye tek bir istek bile gitmesi.
- Erişim anahtarının (token) repoya, derlenmiş pakete, konsola ya da hata mesajına sızması.
- Tiklerin public `specroots` reposuna yazılması.
- İnternetsizken atılan bir tikin kaybolması.

## Kısıtlar

- Statik site, GitHub Pages, sunucu yok (SPEC karar 1). Yeni çalışma zamanı bağımlılığı eklenmez;
  WebCrypto ve `fetch` yeter.
- SPEC karar 12: nesne yönelimli, katmanlı; görünümler bağlamı parametre olarak alır (`ViewContext`).
- Arayüz metinleri altı dilde (`src/i18n/messages.ts`).
- `npm run check` yeşil kalır; mevcut testler gevşetilmez.
- Kullanıcının evinde internet yok; telefon çoğu zaman çevrimdışı ya da zayıf bağlantıda.

## Dürüst güvenlik notu (kullanıcıya söylendi, kabul etti)

Site herkese açık ve sunucusuz olduğundan 4 haneli şifre gerçek bir kilit değildir; **perdedir**.
Asıl güvenlik, yalnızca tik deposuna yazabilen dar yetkili bir GitHub anahtarıdır ve bu anahtar
yalnızca kullanıcının kendi cihazlarında durur. En kötü durumda sızan şey tik listesidir.

## Nasıl çalışır

### Depolama (karar: kullanıcı "yol 1"i seçti; ayrıntılar benim kararım)

- Yeni **gizli** repo: `writerforight/specroots-progress`, içinde tek dosya `progress.json`.
- Erişim: bu tek repoya `Contents: read/write` yetkili fine-grained kişisel erişim anahtarı.
  Anahtarı GitHub arayüzünde **kullanıcı kendisi** oluşturur (son kullanma süresi: en uzun seçenek).
  Repoyu oluşturmak kurulumun parçasıdır, site kodunun değil.
- Okuma/yazma: GitHub REST `GET/PUT /repos/{owner}/{repo}/contents/progress.json` (CORS açık).
  `PUT` eski `sha` yüzünden reddedilirse: yeniden oku → birleştir → tekrar dene.

### Veri biçimi

```json
{
  "version": 1,
  "words": { "en/spec/inspect": { "d": 1, "t": 1794755429 }, "de/steh/Verstand": { "d": 0, "t": 1794755500 } },
  "roots": { "en/spec": { "d": 1, "t": 1794755429 } }
}
```

- Anahtar: `<bölüm>/<kök id>/<kelime id>`; bölüm `en` ya da `de`. `d`: 1 tikli, 0 geri alınmış.
  `t`: saniye cinsinden zaman. Geri alınan kayıt silinmez (`d: 0`), yoksa birleştirmede geri gelir.
- **Birleştirme:** anahtar başına, `t` değeri büyük olan kazanır. Bu yüzden ayrı bir "bekleyenler
  kuyruğu" gerekmez: yerel durum + "gönderilmedi" bayrağı yeter.
- Veriden silinmiş bir köke/kelimeye ait kayıt zararsızdır; sayaçlarda yok sayılır.

### Kök tiki ve sayaç

- Kök tiki ile kelime tikleri **bağımsızdır**: kökü tiklemek kelimeleri tiklemez; bütün kelimeleri
  tiklemek kökü tiklemez. (Benim kararım; taslakta gösterildi, kullanıcı itiraz etmedi.)
- Sayaç her zaman gerçek kelime tiklerini sayar: `tikli kelime / kökteki kelime`.
- Bölüm sayfasının başında küçük gri toplam: `okunan kök / toplam kök` (o bölüm için).

### Kurulum, şifre ve mod

- **Kurulum sayfası** `#/setup`: menüde bağlantısı yoktur, adres elle ya da kurulum linkiyle açılır.
  Alanlar: depo (`owner/repo`), anahtar, 4 haneli şifre. "Kaydet" → site anahtarla `progress.json`
  dosyasını okumayı dener (yoksa oluşturur); başarılıysa cihaz kurulmuş olur.
- **Kurulum linki:** kurulmuş cihazda ayarlarda "başka cihaza kur" → `#/setup/<paket>` biçiminde
  link üretir ve kopyalar (paket = depo + anahtar, base64url). Telefonda link açılınca alanlar dolu
  gelir, yalnızca 4 hane sorulur; ardından adres çubuğundaki paket `history.replaceState` ile
  silinir. Paket `#` sonrasında olduğu için sunucuya gitmez. QR kodu bu sürümde yok (benim kararım:
  bağımlılık eklememek için; link yeterli).
- **Cihazda saklama:** anahtar, 4 haneli şifreden türetilen anahtarla (PBKDF2 → AES-GCM, WebCrypto)
  şifrelenip `localStorage`'a yazılır. Şifreyi girmek = bu paketi çözmek; yanlış şifrede çözme
  başarısız olur. Şifrenin özeti hiçbir yerde tutulmaz.
- **Mod açık kalır** (benim kararım, kullanıcı onayladı): şifre bir kez girilince çözülmüş anahtar
  o cihazda kalır ve sonraki ziyaretlerde mod kendiliğinden açıktır. Ayarlarda **"moddan çık"**
  düğmesi çözülmüş anahtarı siler; şifreli paket kalır, tekrar girmek için 4 hane yeter.
  **"Bu cihazı unut"** her şeyi (paket + yerel tikler) siler.
- **Giriş noktası:** ayarlar penceresinde şifre alanı **yalnızca kurulmuş cihazda** görünür.
  Kurulmamış cihazda (yani her ziyaretçide) ayarlarda hiçbir şey yoktur.

### Eşitleme

- Mod açılınca ve her sayfa yüklemesinde: uzaktan oku, yerelle birleştir, ekranı güncelle.
- Tik atılınca: yerel durum hemen değişir ve ekrana yansır; gönderim kısa bir gecikmeyle toplu
  yapılır (birkaç saniye; ayrıca sekme gizlenirken ve bağlantı geri gelince).
- Çevrimdışı ya da hata: tik yerelde kalır, "gönderilmedi" bayrağı durur, sonraki fırsatta yeniden
  denenir. Kullanıcıya engelleyici uyarı gösterilmez.
- **"Çevrimdışı"nın kapsamı (kullanıcı kararı, 2026-11-15):** sitenin bugün servis çalışanı yok;
  internetsizken yalnızca önceden açılmış sayfalar çalışır. Bu proje yalnızca "açık
  sayfada atılan tik kaybolmaz, sonra gönderilir" kısmını kapsar; siteyi internetsiz açıp gezmek
  (SPEC'teki D3 PWA aşaması; iPhone'da ana ekrana eklenerek) kullanıcının istediği bir sonraki projedir, bunun hemen ardından ayrı tasarımla yapılır. Tik deposu buna engel olmayacak biçimde kurulur.
- Anahtar geçersiz/süresi dolmuş (401/403/404): tikleme yerelde çalışmaya devam eder; ayarlarda
  tek satır sessiz bir not çıkar ("eşitleme durdu: anahtarı yenile") ve `#/setup`'a bağlantı verir.

### Arayüz (mod açıkken)

| Yer | Ne görünür |
|---|---|
| Kök dizini, kutu düzeni (`#/roots`, `#/de`) | Kutunun sağ üstünde küçük ✓ (kök tiki), sağ altında `12/30`; tikli kökün adı ve anlamı soluk |
| Kök dizini, sözlük düzeni | Aynı bilgiler satır içinde, aynı sessizlikte |
| Kök sayfası başlığı | Kök adının yanında küçük ✓ ve `12/30` |
| Kök sayfası, liste ve ağaç görünümü | Her kelimede küçük ✓ (liste: satırın sağında); tikli kelime soluk |
| Ön ek / son ek sayfaları, arama sonuçları | EN/DE kök kelimeleri tikliyse soluk; tik düğmesi bulunması builder'a bırakıldı |

- Soluklaştırma yaklaşık %40 opaklık; tik rengi kapalıyken açık gri, açıkken metin rengi. Değerler
  `tokens.css`'te belirteç olarak tanımlanır; dört temada (açık, koyu, mono, mono-koyu) okunur olmalı.
- Tik düğmeleri klavyeyle erişilebilir ve `aria-pressed` taşır; telefonda dokunma alanı görünen
  işaretten büyüktür.
- Mod kapalıyken bu öğelerin hiçbiri DOM'da yoktur (gizlenmiş değil, hiç üretilmemiş).

## Mimari (builder için yön, ayrıntı serbest)

- `services/ProgressStore`: bellekteki durum, anahtar üretimi, tikle/geri al, sayaçlar, birleştirme,
  değişiklik aboneliği. Kalıcılık `KeyValueStore` üzerinden (testte `MemoryStore`).
- `services/ProgressRemote` (arayüz) + `GitHubProgressRemote`: oku/yaz, `sha` çakışması, hata türleri.
  Testte sahte uygulama.
- `services/UserMode`: kurulum, şifreyle aç, moddan çık, cihazı unut; WebCrypto sarmalayıcısı.
- `ProgressSync`: store ile remote arasında zamanlama (gecikmeli gönderim, yeniden deneme).
- `ViewContext`'e isteğe bağlı `progress` alanı eklenir: mod kapalıyken `null`. Görünümler yalnızca
  buna bakar; `null` ise hiçbir şey çizmez. Böylece karşı hedef 1 tek noktadan sağlanır.
- GitHub'a istek atan kod yalnızca mod açıkken çağrılır (karşı hedef 2); testle doğrulanır.

## Test

- Birleştirme: iki cihaz senaryoları, geri alma, eşit zaman, bilinmeyen anahtar.
- Şifreleme: doğru şifre çözer, yanlış şifre çözmez, paket düz metin anahtar içermez.
- Remote: `sha` çakışmasında oku-birleştir-yeniden yaz; 401'de yerel durum korunur.
- Görünümler: `progress = null` iken çıktı bugünküyle aynı (tik/sayaç yok, `fetch` çağrısı yok);
  mod açıkken tik, sayaç ve soluk sınıfı var.
- Kurulum linki: paket okunur, sonra adresten silinir.
- Görünüm testleri için **yalnızca geliştirme bağımlılığı** olarak bir DOM ortamı (happy-dom ya da
  jsdom) eklenebilir (benim kararım). Çalışma zamanı bağımlılığı yasağı sürer.

## Kullanıcının elle yapacakları (bir kez)

1. Gizli repo `specroots-progress` oluşturulur (bunu `gh` ile ben yapabilirim, onayla).
2. GitHub'da o repoya özel fine-grained anahtar oluşturur.
3. Bilgisayarda `#/setup` sayfasına anahtarı ve 4 haneyi girer.
4. "Başka cihaza kur" linkini telefona gönderip bir kez açar, 4 haneyi girer.

## Builder'a bırakılanlar

- Dosya/sınıf adlarının son hali, gönderim gecikmesinin süresi, PBKDF2 tur sayısı.
- Sözlük düzeninde ve ağaç görünümünde tik ile sayacın tam yeri (taslaktaki sessizlik ölçü alınır).
- Ön ek/son ek sayfalarında ve aramada tik düğmesi olup olmayacağı (soluklaştırma zorunlu).
- Altı dildeki kısa arayüz metinleri.
