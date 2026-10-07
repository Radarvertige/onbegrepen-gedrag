# Technische documentatie – Casussen onbegrepen gedrag

Dit document legt uit waar de pagina voor dient, hoe hij in elkaar zit en waar je moet zijn als je iets wilt aanpassen. Het is bedoeld voor wie het beheer overneemt.

De links met een regelnummer (bijvoorbeeld `app.js:103`) wijzen naar de plek in de code. Regelnummers verschuiven als de code verandert; de naam van de functie is dan het houvast.

## 1. Waar is dit voor?

De pagina is de werkplekopdracht en naslag bij de training Onbegrepen gedrag van RadarVertige. Deelnemers lezen achttien casussen uit de praktijk van politie, zorg en gemeenten in Zeeland-West-Brabant. De teksten komen uit het booklet *Zorg ontbreekt, veiligheid wankelt* (AJB-ZVI Zeeland-West-Brabant, 2025).

Wat een deelnemer kan doen:

- alle casussen achter elkaar lezen;
- filteren op thema, bijvoorbeeld alleen casussen over dakloosheid;
- per casus in de radar zien welke soorten problematiek er spelen;
- via de meelopende balk bovenin naar een andere casus springen.

De pagina is bedoeld voor https://radarvertige.github.io/onbegrepen-gedrag/ en om vanuit RadarOnline als bron te gebruiken.

## 2. Hoe zit het in elkaar?

Het is een statische site: gewone bestanden, zonder database, zonder inloggen en zonder extra pakketten. De bestanden in `public/` gaan ongewijzigd online; de build controleert en kopieert ze alleen.

```
onbegrepen-gedrag/
  public/                 alles wat online komt
    index.html            vaste teksten en lege houders
    css/
      fonts.css           de twee lettertypes
      style.css           alle opmaak
    js/
      casussen.js         de inhoud: casusteksten en foto's
      app.js              bouwt de pagina op, filter en balk
    fonts/                Bagoss en Tobias (woff2)
    img/                  foto per casus
    robots.txt            houdt zoekmachines en AI-crawlers weg
  docs/                   deze documentatie (komt niet online)
  scripts/
    build.js              controleert de site en zet hem klaar in dist/
    publish.js            zet de huidige versie online
  dist/                   uitvoer van de build (staat niet in git)
  server.js               webserver voor lokaal en Heroku
  Procfile                startopdracht voor Heroku
  package.json            naam, startscript en Node-versie
  .github/workflows/
    pages.yml             publiceert public/ naar GitHub Pages
```

De taakverdeling:

| Bestand | Rol |
|---|---|
| [index.html](../public/index.html) | Het geraamte: kopblok, inleiding, voettekst en lege houders met een `id`. |
| [casussen.js](../public/js/casussen.js) | Alleen gegevens: de casussen en welke foto erbij hoort. |
| [app.js](../public/js/app.js) | Leest de gegevens en vult de houders. Regelt het themafilter en de balk. |
| [style.css](../public/css/style.css) | Hoe alles eruitziet, ook op telefoon en tablet. |

Wat er gebeurt als iemand de pagina opent:

1. De browser laadt `index.html` met de opmaak en de lettertypes.
2. `casussen.js` wordt geladen en zet de gegevens klaar in `CASUSSEN` en `FOTOS`.
3. `app.js` wordt geladen en voert het startblok uit ([app.js:201](../public/js/app.js#L201)): casussen opbouwen, de grote radar tekenen, filterknoppen maken, de balk koppelen en het filter op "Alle" zetten.

De volgorde van de twee scripts onderaan `index.html` is daarom van belang: eerst de gegevens, dan het script dat ze gebruikt.

## 3. De inhoud: casussen.js

### CASUSSEN

[casussen.js:26](../public/js/casussen.js#L26) – de lijst met casussen, in de volgorde waarin ze op de pagina komen. De nummering (01, 02, …) volgt die volgorde.

| Veld | Verplicht | Betekenis |
|---|---|---|
| `id` | ja | Unieke naam in kleine letters zonder spaties. Wordt het anker in de link (`#gerard`) en de bestandsnaam van de foto. |
| `naam` | ja | Titel van de casus. |
| `sub` | ja | Ondertitel. |
| `tags` | ja | Thema's. Hieruit ontstaan vanzelf de filterknoppen. |
| `tekst` | ja | De alinea's, één tekst per alinea. |
| `kern` | ja | Tekst van het blok "Zorg ontbreekt, veiligheid wankelt". |
| `p` | nee | Problematiek voor de radar: codes met komma's ertussen (zie hieronder). Zonder `p` krijgt de casus geen radar. |
| `cw` | nee | Waarschuwing in een geel blok boven de tekst. |

De codes voor `p`:

| Code | Betekenis |
|---|---|
| `psy` | Psychische problematiek |
| `ver` | Verslaving |
| `lvb` | Licht verstandelijke beperking |
| `dak` | Dakloosheid |
| `agr` | Agressie of geweld |

### FOTOS

[casussen.js:144](../public/js/casussen.js#L144) – de foto per casus, op `id`. Per foto een `src` (pad naar het bestand) en een `alt` (beschrijving voor wie de foto niet kan zien). Niet elke casus heeft een foto. De foto's zijn vierkant, 420 bij 420 pixels, en worden rond afgesneden.

## 4. De logica: app.js

Het bestand is in zes genummerde blokken verdeeld. Hieronder elk onderdeel met wat het doet.

### Instellingen

| Naam | Plek | Wat het is |
|---|---|---|
| `LAGEN` | [app.js:26](../public/js/app.js#L26) | De vijf soorten problematiek met code en naam. De volgorde is die van de radar: de eerste is de binnenste boog. |
| `RADII` | [app.js:35](../public/js/app.js#L35) | Straal van elke boog, in dezelfde volgorde als `LAGEN`. |
| `LEESLIJN` | [app.js:38](../public/js/app.js#L38) | Hoogte in pixels waarboven een casus telt als "in beeld". Bepaalt wat de balk toont. |
| `lagenVan(c)` | [app.js:41](../public/js/app.js#L41) | Geeft de codes uit het veld `p` van een casus als lijst. |
| `MET_RADAR` | [app.js:44](../public/js/app.js#L44) | Aantal casussen met een radar. Dit is de 17 in "10 van 17" en wordt automatisch geteld. |
| `THEMAS` | [app.js:47](../public/js/app.js#L47) | Alle thema's uit de casussen, alfabetisch, met "Alle" vooraan. |

### Bouwstenen

Kleine functies die een stukje HTML teruggeven.

| Functie | Plek | Wat het doet |
|---|---|---|
| `esc(s)` | [app.js:59](../public/js/app.js#L59) | Maakt tekst veilig om in HTML te plakken. Alle tekst uit `casussen.js` gaat hier doorheen. |
| `radarSVG(widths)` | [app.js:66](../public/js/app.js#L66) | Tekent de radar. Krijgt per boog een lijndikte; 0 geeft een stippellijn ("speelt niet"). |
| `legenda(aan, extra)` | [app.js:80](../public/js/app.js#L80) | De lijst naast de radar. Met `extra` (aantallen) toont hij "10 van 17"; dat gebeurt alleen bij de grote radar bovenaan. |
| `rondFoto(f, kant)` | [app.js:89](../public/js/app.js#L89) | De ronde foto in de tekst, links (`l`) of rechts (`r`). |

### Opbouwen

| Functie | Plek | Wat het doet |
|---|---|---|
| `bouwCasus(c, i)` | [app.js:103](../public/js/app.js#L103) | Zet één casus op de pagina (in `#casussen`) en de bijbehorende regel in de inhoudsopgave (`#toc`). Foto's komen om en om rechts en links. |
| `bouwOverzicht()` | [app.js:124](../public/js/app.js#L124) | Tekent de grote radar in `#overzicht`. Hoe vaker een problematiek voorkomt, hoe dikker de boog. |
| `bouwFilters()` | [app.js:130](../public/js/app.js#L130) | Maakt voor elk thema een knop in `#filters`. |

### Themafilter

| Functie | Plek | Wat het doet |
|---|---|---|
| `kiesThema(thema)` | [app.js:144](../public/js/app.js#L144) | Toont alleen de casussen met het gekozen thema, in de pagina en in de inhoudsopgave. Werkt ook de teller, de knoppen en de keuzelijst van de balk bij. |

Het filter werkt met het `hidden`-attribuut op elk artikel en elke regel in de inhoudsopgave. Elk van die elementen heeft een `data-tags` met zijn thema's; `bouwCasus` zet die erop.

### Meelopende balk

De balk verschijnt zodra het casusoverzicht uit beeld is. Hij toont de casus die de lezer voor zich heeft en laat springen naar een andere, altijd binnen het gekozen thema.

| Functie | Plek | Wat het doet |
|---|---|---|
| `zichtbaar()` | [app.js:161](../public/js/app.js#L161) | De casussen die het filter nu toont, in paginavolgorde. |
| `huidige(lijst)` | [app.js:168](../public/js/app.js#L168) | De casus die de lezer nu leest: de laatste waarvan de bovenkant boven de `LEESLIJN` zit. |
| `ververs()` | [app.js:175](../public/js/app.js#L175) | Toont of verbergt de balk en zet de keuzelijst en de pijlen goed. Draait bij scrollen, bij schalen van het venster en na het filteren. |
| `stap(d)` | [app.js:188](../public/js/app.js#L188) | Scrolt naar de vorige (`-1`) of volgende (`1`) zichtbare casus. |
| `koppelBalk()` | [app.js:191](../public/js/app.js#L191) | Koppelt de keuzelijst en de pijlen aan hun actie en houdt de balk bij tijdens het scrollen. |

### Wie roept wie aan

```
Start (app.js:201)
  CASUSSEN.forEach(bouwCasus)   → radarSVG, legenda, rondFoto, esc
  bouwOverzicht()               → radarSVG, legenda
  bouwFilters()                 → klik op een knop: kiesThema
  koppelBalk()                  → keuzelijst en pijlen: stap; scrollen: ververs
  kiesThema("Alle")             → zichtbaar, ververs

ververs()                       → zichtbaar, huidige
stap(d)                         → zichtbaar, huidige
```

### Houders in index.html

`app.js` zoekt deze elementen op hun `id`. Hernoem je er een in [index.html](../public/index.html), pas dan ook `app.js` aan.

| `id` | Wat erin komt | Gevuld door |
|---|---|---|
| `overzicht` | De grote radar met telling | `bouwOverzicht` |
| `index` | Het hele casusoverzicht; de balk kijkt of dit nog in beeld is | `ververs` |
| `filters` | De themaknoppen | `bouwFilters` |
| `count` | De teller ("18 casussen") | `kiesThema` |
| `toc` | De inhoudsopgave | `bouwCasus` |
| `balk` | De meelopende balk | `ververs` |
| `spring` | De keuzelijst in de balk | `kiesThema`, `ververs` |
| `vorige`, `volgende` | De pijlen in de balk | `koppelBalk` |
| `casussen` | De casussen zelf | `bouwCasus` |

## 5. De opmaak: style.css

[style.css](../public/css/style.css) is in tien genummerde blokken verdeeld:

| Blok | Plek | Inhoud |
|---|---|---|
| 1. Huisstijl | [style.css:28](../public/css/style.css#L28) | Kleuren en lettertypes als variabelen. Wijzig je hier een kleur, dan verandert hij overal. |
| 2. Basis | [style.css:37](../public/css/style.css#L37) | Paginabreedte (`.wrap`), koppen en de regel die het filter laat werken (`[hidden]`). |
| 3. Kopblok | [style.css:47](../public/css/style.css#L47) | Het grijze vlak bovenaan met de radarlijnen. |
| 4. Casusoverzicht | [style.css:57](../public/css/style.css#L57) | Themaknoppen en inhoudsopgave. |
| 5. Meelopende balk | [style.css:73](../public/css/style.css#L73) | De balk bovenin. |
| 6. Casus | [style.css:86](../public/css/style.css#L86) | Kop, tags, kernblok en de gele waarschuwing. |
| 7. Radar | [style.css:105](../public/css/style.css#L105) | De radar met legenda, klein en groot. |
| 8. Tekst en foto | [style.css:122](../public/css/style.css#L122) | De lopende tekst en de ronde foto. |
| 9. Voettekst | [style.css:133](../public/css/style.css#L133) | Bronvermelding. |
| 10. Schermbreedtes | [style.css:137](../public/css/style.css#L137) | Aanpassingen voor telefoon, tablet en breed scherm. |

De kleuren en lettertypes:

| Variabele | Waarde | Gebruik |
|---|---|---|
| `--wit` | `#FFFCF7` | Achtergrond (gebroken wit) |
| `--zwart` | `#2B0039` | Tekst en lijnen |
| `--aw` | `#F2F0E7` | Vlakkleur: kopblok en kernblok |
| `--geel` | `#FFD789` | Waarschuwingsblok |
| `--functioneel` | Bagoss | Knoppen, labels en navigatie |
| `--inhoud` | Tobias | Koppen en leestekst |

De basis van het stylesheet is de smalle weergave. Blok 10 past dat aan per schermbreedte:

| Scherm | Breedte | Indeling |
|---|---|---|
| Telefoon | tot 600 px | Eén kolom, foto gecentreerd tussen de alinea's, radarlijnen in de kop kleiner en lichter. |
| Tablet staand | 601 tot 959 px | Eén kolom, foto naast de tekst. |
| Tablet liggend en desktop | vanaf 960 px | Twee kolommen: kop en radar links, tekst rechts. De linkerkolom loopt mee als het scherm minstens 700 px hoog is. |

De pagina is maximaal 68rem breed (ongeveer 1090 pixels). Die maat staat op twee plekken: bij `.wrap` en bij `.balk-in`. Pas ze samen aan.

## 6. Veelvoorkomende aanpassingen

**Een tekst wijzigen.** Zoek de casus in [casussen.js](../public/js/casussen.js) en pas de tekst aan. Elke tekst staat tussen dubbele aanhalingstekens. Gebruik in de tekst zelf ‘ ’ of “ ” in plaats van een recht dubbel aanhalingsteken, anders breekt het bestand.

**Een casus toevoegen.** Kopieer een bestaand blok in `CASUSSEN`, geef het een nieuw `id` en vul de velden in. Nummering, inhoudsopgave en filterknoppen passen zich aan. Op twee plekken in [index.html](../public/index.html) staat het aantal als vaste tekst: "18 casussen" in het kopblok en "zeventien casussen" in de uitleg bij de radar. Pas die met de hand aan.

**Een foto toevoegen of vervangen.** Zet een vierkante jpg in [public/img/](../public/img/), bij voorkeur 420 bij 420 pixels, met het `id` van de casus als naam. Vervang je een bestaande foto, dan is overschrijven genoeg; pas wel de `alt` aan. Bij een nieuwe foto voeg je een regel toe aan `FOTOS`.

**Een thema toevoegen.** Zet het in de `tags` van een casus. De knop verschijnt vanzelf.

**Een soort problematiek toevoegen.** Voeg een regel toe aan `LAGEN` en een straal aan `RADII` in [app.js](../public/js/app.js). Controleer of de extra boog nog in de tekening past: de `viewBox` in `radarSVG` is 230 breed.

**Een ander bestandstype gebruiken, bijvoorbeeld png.** Voeg het toe aan `TYPES` in [server.js:19](../server.js#L19). Anders geeft de lokale server en Heroku een 404. GitHub Pages heeft dit niet nodig.

## 7. Lokaal bekijken

Er is alleen Node.js nodig; er hoeft niets geïnstalleerd te worden.

```
node server.js
```

Open daarna http://localhost:3000. Na een wijziging is de pagina verversen genoeg: de server leest de bestanden bij elk verzoek opnieuw.

`npm start` doet hetzelfde. Krijg je in PowerShell de melding dat scripts zijn uitgeschakeld, gebruik dan `node server.js` of `npm.cmd start`.

[server.js](../server.js) stuurt alleen bestanden binnen `public/` met een type uit `TYPES`. Al het andere geeft een 404 via `nietGevonden` ([server.js:28](../server.js#L28)).

## 8. Bouwen en online zetten

De code staat in https://github.com/Radarvertige/onbegrepen-gedrag. Er zijn twee opdrachten, beide vanuit de hoofdmap van het project.

### Bouwen

```
node scripts/build.js
```

[build.js](../scripts/build.js) controleert de site en zet hem daarna klaar in de map `dist/`. Bij een fout stopt het met een melding per fout en blijft `dist/` zoals het was. De controle (`controleer`, [build.js:32](../scripts/build.js#L32)) kijkt of:

- `casussen.js` en `app.js` geldig JavaScript zijn;
- elke casus de verplichte velden heeft en een uniek `id`;
- de codes in `p` bestaan in `LAGEN`;
- elke foto bij een casus hoort, een beschrijving heeft en als bestand aanwezig is;
- de bestanden waar `index.html` en `fonts.css` naar verwijzen er zijn;
- `robots.txt` aanwezig is.

Draai de build na het bewerken van een casus: een vergeten komma of aanhalingsteken komt er direct uit.

### Publiceren

```
node scripts/publish.js
node scripts/publish.js "Tekst van casus 3 aangepast"
node scripts/publish.js --dry-run
```

[publish.js](../scripts/publish.js) doet drie dingen achter elkaar (`publish`, [publish.js:31](../scripts/publish.js#L31)):

1. De build draaien. Bij een fout stopt het hier en gaat er niets online.
2. Alle wijzigingen vastleggen in git op de branch `main`, met de opgegeven omschrijving of anders de datum.
3. Ze naar GitHub sturen. GitHub Pages zet de site daarna zelf online; dat duurt ongeveer een minuut.

Met `--dry-run` zie je alleen welke bestanden mee zouden gaan; er wordt niets vastgelegd of verstuurd. Het script neemt alle gewijzigde bestanden in de projectmap mee, behalve wat in [.gitignore](../.gitignore) staat. Het stopt als je niet op `main` staat of als er op GitHub wijzigingen staan die je lokaal nog niet hebt.

Dezelfde opdrachten bestaan als `npm run build` en `npm run publish`. Geeft PowerShell de melding dat scripts zijn uitgeschakeld, gebruik dan de `node`-opdrachten hierboven.

### Wat GitHub doet

**GitHub Pages.** Bij elke push naar `main` draait [pages.yml](../.github/workflows/pages.yml): het voert dezelfde build uit en publiceert `dist/`. Voorwaarde is dat in de instellingen van de repository onder Pages de bron op "GitHub Actions" staat. Of een publicatie gelukt is, zie je op het tabblad Actions.

**Heroku.** Het [Procfile](../Procfile) start `server.js`, zodat de site ook op Heroku kan draaien. Voor GitHub Pages is dit niet nodig. Of er een Heroku-app aan deze repository gekoppeld is, staat nergens in de code.

**Wat wel en niet online komt.** Alleen de inhoud van `public/` staat op de site. Deze documentatie, `server.js` en de rest zijn via de site niet te bereiken. Ze staan wel in de repository op GitHub; wie de repository mag zien, kan ze daar lezen.

## 9. Aandachtspunten

- **Zoekmachines en AI.** De pagina vraagt op drie manieren om niet opgenomen te worden: [robots.txt](../public/robots.txt) (niets ophalen), een `robots`-tag in `index.html` (niet opnemen, niet gebruiken voor AI) en een header in `server.js`. Dit zijn verzoeken; nette zoekmachines en AI-crawlers houden zich eraan, maar afdwingen kan het niet. Afgeschermd is de pagina er ook niet mee: wie de link heeft, kan hem openen.
- **robots.txt op GitHub Pages.** Crawlers lezen `robots.txt` alleen in de hoofdmap van een domein. Op `radarvertige.github.io/onbegrepen-gedrag/` staat het bestand een map te diep en wordt het genegeerd. Het werkt wel op een eigen (sub)domein of op Heroku. Om het op GitHub Pages te laten werken moet er een `robots.txt` in de repository `Radarvertige/radarvertige.github.io` staan, of moet de site een eigen domein krijgen. Tot die tijd doet de `robots`-tag het werk.
- **De repository is publiek.** De casusteksten staan ook leesbaar op github.com. Daar heeft deze `robots.txt` geen invloed op.
- **In een kader in RadarOnline.** De indeling volgt de breedte van het kader, niet die van het scherm. Is het kader zo hoog als de hele pagina, dan scrolt RadarOnline in plaats van de pagina en blijft de balk niet bovenin staan.
- **Lettertypes.** Bagoss en Tobias zijn huisstijl-lettertypes met een licentie. Ze staan als bestand in de repository.
- **Foto's.** Ter illustratie, uit Adobe Stock en Freepik via het booklet. De bronvermelding staat in de voettekst van `index.html`.
- **Voornamen.** De namen in de casussen zijn gefingeerd.
