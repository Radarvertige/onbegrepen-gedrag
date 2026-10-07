/*
 * build.js – controleert de site en zet hem klaar in de map dist/.
 *
 * Gebruik:  node scripts/build.js     (of: npm run build)
 *
 * Wat het doet:
 *   1. Controleert public/ op fouten die de pagina zouden breken (zie controleer).
 *   2. Maakt dist/ leeg en kopieert public/ erheen.
 *
 * Bij een fout stopt het script met een melding en blijft dist/ zoals het was.
 * GitHub Pages draait ditzelfde script en publiceert dist/ (zie
 * .github/workflows/pages.yml); een kapotte versie komt zo niet online.
 * Geen extra pakketten nodig.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

const lees = rel => fs.readFileSync(path.join(PUBLIC, rel), "utf8");
const bestaat = rel => fs.existsSync(path.join(PUBLIC, rel));

/**
 * Loopt public/ na en geeft een lijst met gevonden fouten (leeg = in orde).
 * Controleert: de scripts zijn geldig JavaScript, elke casus heeft de
 * verplichte velden en een uniek id, problematiekcodes bestaan, foto's en
 * andere bestanden waarnaar verwezen wordt zijn er, en robots.txt is aanwezig.
 */
function controleer() {
  const fouten = [];

  // De scripts moeten geldig JavaScript zijn
  const bron = {};
  for (const rel of ["js/casussen.js", "js/app.js"]) {
    try { bron[rel] = lees(rel); new vm.Script(bron[rel], { filename: rel }); }
    catch (e) { fouten.push(`${rel}: ${e.message}`); }
  }
  if (fouten.length) return fouten;

  // Gegevens uit casussen.js en de geldige problematiekcodes uit app.js inlezen
  let CASUSSEN, FOTOS, codes;
  try {
    ({ CASUSSEN, FOTOS } = vm.runInNewContext(bron["js/casussen.js"] + "\n;({CASUSSEN, FOTOS})"));
    const lagen = bron["js/app.js"].match(/const LAGEN = (\[[\s\S]*?\]);/);
    codes = vm.runInNewContext(lagen[1]).map(l => l[0]);
  } catch (e) {
    return [`De gegevens konden niet worden ingelezen: ${e.message}`];
  }

  // Elke casus: verplichte velden, uniek id, bestaande codes
  const ids = new Set();
  CASUSSEN.forEach((c, i) => {
    const wie = `Casus ${i + 1} (${c.id || "zonder id"})`;
    for (const veld of ["id", "naam", "sub", "kern"]) {
      if (typeof c[veld] !== "string" || !c[veld].trim()) fouten.push(`${wie}: veld "${veld}" ontbreekt of is leeg`);
    }
    for (const veld of ["tags", "tekst"]) {
      if (!Array.isArray(c[veld]) || !c[veld].length) fouten.push(`${wie}: veld "${veld}" ontbreekt of is leeg`);
    }
    if (c.id && !/^[a-z0-9-]+$/.test(c.id)) fouten.push(`${wie}: id mag alleen kleine letters, cijfers en streepjes bevatten`);
    if (ids.has(c.id)) fouten.push(`${wie}: id komt meer dan één keer voor`);
    ids.add(c.id);
    for (const code of (c.p || "").split(",").filter(Boolean)) {
      if (!codes.includes(code)) fouten.push(`${wie}: onbekende problematiekcode "${code}" (geldig: ${codes.join(", ")})`);
    }
  });

  // Elke foto hoort bij een casus en het bestand bestaat
  for (const [id, f] of Object.entries(FOTOS)) {
    if (!ids.has(id)) fouten.push(`FOTOS: "${id}" hoort bij geen enkele casus`);
    if (!f.src || !bestaat(f.src)) fouten.push(`FOTOS: bestand ontbreekt voor "${id}": ${f.src}`);
    if (!f.alt || !f.alt.trim()) fouten.push(`FOTOS: beschrijving (alt) ontbreekt voor "${id}"`);
  }

  // Bestanden waar index.html en fonts.css naar verwijzen
  for (const m of lees("index.html").matchAll(/(?:href|src)="([^"#:]+)"/g)) {
    if (!bestaat(m[1])) fouten.push(`index.html verwijst naar een bestand dat ontbreekt: ${m[1]}`);
  }
  for (const m of lees("css/fonts.css").matchAll(/url\("([^"]+)"\)/g)) {
    if (!bestaat(path.join("css", m[1]))) fouten.push(`fonts.css verwijst naar een bestand dat ontbreekt: ${m[1]}`);
  }

  if (!bestaat("robots.txt")) fouten.push("robots.txt ontbreekt");
  return fouten;
}

/** Telt de bestanden en de totale grootte van een map. */
function omvang(map) {
  let aantal = 0, bytes = 0;
  for (const e of fs.readdirSync(map, { withFileTypes: true })) {
    const p = path.join(map, e.name);
    if (e.isDirectory()) { const o = omvang(p); aantal += o.aantal; bytes += o.bytes; }
    else { aantal++; bytes += fs.statSync(p).size; }
  }
  return { aantal, bytes };
}

/**
 * Controleert de site en zet hem klaar in dist/.
 * @returns {boolean} true als het gelukt is, false bij fouten
 */
function build() {
  const fouten = controleer();
  if (fouten.length) {
    console.error(`Build gestopt: ${fouten.length} fout(en) gevonden.`);
    fouten.forEach(f => console.error("  - " + f));
    return false;
  }
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(PUBLIC, DIST, { recursive: true });
  const { aantal, bytes } = omvang(DIST);
  console.log(`Build gelukt: ${aantal} bestanden (${Math.round(bytes / 1024)} kB) in dist/`);
  return true;
}

module.exports = { build, controleer };

// Rechtstreeks gestart (niet ingeladen door publish.js)
if (require.main === module) process.exit(build() ? 0 : 1);
