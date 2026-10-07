# Casussen onbegrepen gedrag

Werkplekopdracht en naslag voor deelnemers aan de training Onbegrepen gedrag (RadarVertige).

## Lokaal bekijken
```
npm start
```
Open daarna http://localhost:3000

## Bouwen en publiceren
```
node scripts/build.js      controleert de site en zet hem klaar in dist/
node scripts/publish.js    bouwt, legt de wijzigingen vast en zet ze online
```
`publish.js` accepteert een omschrijving (`node scripts/publish.js "Tekst aangepast"`)
en `--dry-run` om alleen te zien wat er zou gebeuren. Na het publiceren zet
GitHub Pages de site binnen ongeveer een minuut online op
https://radarvertige.github.io/onbegrepen-gedrag/

## Documentatie
Hoe de pagina in elkaar zit en waar je iets aanpast, staat in
[docs/technische-documentatie.md](docs/technische-documentatie.md).
De map `docs/` komt niet op de site; alleen `public/` wordt gepubliceerd.

## Structuur
```
public/
  index.html        opbouw van de pagina (kop, overzicht, voettekst)
  css/
    fonts.css       de twee lettertypes
    style.css       alle opmaak, inclusief telefoon- en tabletweergave
  js/
    casussen.js     de inhoud: teksten van de casussen en welke foto erbij hoort
    app.js          bouwt de casussen op, themafilter en de meelopende balk
  fonts/            Bagoss en Tobias (woff2)
  img/              foto per casus, bestandsnaam = id van de casus
```

Een casustekst aanpassen doe je in `public/js/casussen.js`; een foto vervangen
door het bestand in `public/img/` te overschrijven.

- `scripts/` – `build.js` en `publish.js`, zie hierboven
- `.github/workflows/pages.yml` – bouwt en publiceert naar GitHub Pages bij elke push naar `main`
- `server.js` – kleine webserver zonder extra pakketten, voor lokaal en Heroku
- `Procfile` – vertelt Heroku hoe de app start

Bron casussen: AJB-ZVI Zeeland-West-Brabant (2025), *Zorg ontbreekt, veiligheid wankelt*.
