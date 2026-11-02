# IkBenMedia

Website van IkBenMedia, het ontwerpbureau van Ischa Biesbrouck in Haarlem.
Live: https://ischabiesbrouck.github.io/ikbenmedia/

## Teksten aanpassen

1. Pas de tekst aan in `_bron/paginas/` (één bestand per pagina). Bovenaan elk bestand staan
   de titel en omschrijving voor Google, en eventueel de veelgestelde vragen.
2. Header en footer staan in `_bron/opmaak.html`.
3. Draai daarna:

```bash
python bouw.py
```

Het script maakt de HTML-pagina's, `sitemap.xml` en `robots.txt` opnieuw.
Commit en push daarna naar `main`; GitHub Pages zet de site vanzelf online.

## Eigen domein koppelen

1. Zet in `bouw.py` de regel `BASIS_URL` op het nieuwe adres, bijvoorbeeld `https://www.ikbenmedia.nl/`.
2. Draai `python bouw.py`.
3. Vul het domein in onder GitHub → Settings → Pages → Custom domain en zet de DNS bij uw domeinprovider.
4. Meld het domein aan bij Google Search Console en dien `sitemap.xml` in.

`robots.txt` werkt pas echt als de site op de hoofdmap van een eigen domein staat.

## Lokaal bekijken

```bash
python -m http.server 8800
```

## Techniek

- Gewone HTML, CSS en JavaScript. Geen frameworks, geen cookies, geen trackers.
- Lettertype Archivo (SIL Open Font License), zelf gehost in `assets/fonts/`.
- Het contactformulier opent het e-mailprogramma van de bezoeker (GitHub Pages heeft geen server).
