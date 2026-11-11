# specroots'a katkı

Yardımın için teşekkürler! specroots, kelime ekleyen insanlarla büyür. English: [CONTRIBUTING.md](CONTRIBUTING.md).

## Kod yazmadan

- **Öner:** bir [İngilizce kök](https://github.com/writerforight/specroots/issues/new?template=new-root.yml),
  [Almanca kök](https://github.com/writerforight/specroots/issues/new?template=de-root.yml),
  [nesne listesi](https://github.com/writerforight/specroots/issues/new?template=list.yml) ya da
  [ek](https://github.com/writerforight/specroots/issues/new?template=affix.yml) için issue aç.
- **Hata bildir:** yanlış çeviri, doğal olmayan cümle ya da yanlış kelime bölünmesi:
  ["Mistake" issue'su aç](https://github.com/writerforight/specroots/issues/new?template=mistake.yml).

## Kendin kelime eklemek

İçerik düz JSON'dur: her kök, her nesne ve her liste ayrı bir dosya. Kuralların tamamı, her içerik
türü için tam örnekle, **[AGENTS.tr.md](AGENTS.tr.md)** içinde (İngilizcesi [AGENTS.md](AGENTS.md)).

**Bir AI ajanıyla mı çalışıyorsun (Claude Code, Codex, Cursor…)?** Ona şunu söyle: *"AGENTS.md'yi oku
ve specroots'a … köklerini ekle."* O dosya, ajan bütün işi soru sormadan yapabilsin diye yazıldı.

Kısaca:

1. Forkla, klonla, `npm ci`.
2. Açık issue'lardan seç (`en-root`, `de-root`, `list`, `affix`) ya da kendi fikrini getir. Issue isteğe bağlı.
3. İlk seferde: kendini `public/data/contributors.json`'a ekle
   (`"<GitHub kullanıcı adın>": { "name": "<sitede görünecek ad>" }`).
4. Dosyaları yaz. Oluşturduğun her şey `"addedBy": "<GitHub kullanıcı adın>"` taşır.
5. Yeşil olana kadar `npm run check`. Kırmızı test dosyayı, kelimeyi ve sorunu söyler.
6. `main`'e pull request aç.

**Ne kadar:** yeni içerik getiren bir pull request **en az 5 kök ve 100 kelime civarı** (ya da en az
30 nesne) getirir. Düzeltmelerde alt sınır yok.

**Emeğin görünür:** [Katkıda bulunanlar sayfası](https://writerforight.github.io/specroots/#/contributors)
kelime ekleyen herkesi eşit boyda, rastgele sıralı baloncuklar olarak gösterir. "Detay", kişinin kaç
kelime eklediğini, bölümlere göre dağılımını ve hangi kökleri eklediğini gösterir.

**Lisans:** eklediğin içerik bu reponun [lisansıyla](LICENSE) yayımlanır.

`main`'e yalnızca repo sahibi birleştirir; her pull request GitHub Actions'ta `npm run check` ve
build'den geçer.

## Kod değişiklikleri

Kod katmanlı TypeScript'tir: `src/domain` (saf sınıflar) → `src/data` → `src/services` → `src/ui`
(her görünüm bir sınıf) → `src/app`. Görünümler her şeyi `ViewContext` ile alır, veri dosyası okumaz.
Renkler ve yazı tipleri `src/styles/tokens.css`'teki tokenlardır. Kararlar [SPEC.md](SPEC.md)'de;
büyük değişiklikten önce issue aç. Kod ve içeriği ayrı pull request'lerde tut.
