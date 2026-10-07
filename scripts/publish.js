/*
 * publish.js – zet de huidige versie online.
 *
 * Gebruik:
 *   node scripts/publish.js                    publiceren
 *   node scripts/publish.js "Tekst aangepast"  publiceren met een eigen omschrijving
 *   node scripts/publish.js --dry-run          alleen laten zien wat er zou gebeuren
 *   (of: npm run publish -- "Tekst aangepast")
 *
 * Wat het doet:
 *   1. Draait de build (scripts/build.js). Bij een fout stopt het hier.
 *   2. Legt alle wijzigingen vast in git (commit) op de branch main.
 *   3. Stuurt ze naar GitHub (push). GitHub Pages zet de site daarna zelf
 *      online; dat duurt ongeveer een minuut.
 *
 * Let op: stap 2 neemt álle gewijzigde bestanden in deze map mee, behalve wat
 * in .gitignore staat. Het script toont ze eerst.
 */
const { execFileSync } = require("child_process");
const path = require("path");
const { build } = require("./build");

const ROOT = path.join(__dirname, "..");
const BRANCH = "main";
const SITE = "https://radarvertige.github.io/onbegrepen-gedrag/";
const ACTIONS = "https://github.com/Radarvertige/onbegrepen-gedrag/actions";

/** Voert een git-opdracht uit en geeft de uitvoer terug als tekst. */
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();

function publish() {
  const args = process.argv.slice(2);
  const proef = args.includes("--dry-run");
  const bericht = args.find(a => !a.startsWith("--")) || `Site bijgewerkt op ${new Date().toLocaleDateString("nl-NL")}`;

  if (!build()) return 1;

  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== BRANCH) {
    console.error(`Gestopt: je staat op de branch "${branch}". Publiceren kan alleen vanaf "${BRANCH}".`);
    return 1;
  }

  // Wat is er gewijzigd, en staat er nog iets klaar dat niet naar GitHub is gestuurd?
  const wijzigingen = git("status", "--porcelain");
  git("fetch", "origin", BRANCH);
  const achter = Number(git("rev-list", "--count", `HEAD..origin/${BRANCH}`));
  const voor = Number(git("rev-list", "--count", `origin/${BRANCH}..HEAD`));

  if (achter) {
    console.error(`Gestopt: op GitHub staan ${achter} wijziging(en) die je hier nog niet hebt. Haal ze eerst op met: git pull`);
    return 1;
  }
  if (!wijzigingen && !voor) {
    console.log("Niets te publiceren: alles staat al op GitHub.");
    return 0;
  }

  if (wijzigingen) {
    console.log("Gewijzigde bestanden:");
    console.log(wijzigingen.split("\n").map(r => "  " + r).join("\n"));
  }
  if (proef) {
    console.log(`\nProef (--dry-run): er is niets vastgelegd of verstuurd.\nOmschrijving zou zijn: "${bericht}"`);
    return 0;
  }

  if (wijzigingen) {
    git("add", "-A");
    git("commit", "-m", bericht);
    console.log(`Vastgelegd: "${bericht}"`);
  }
  git("push", "origin", BRANCH);
  console.log(`Verstuurd naar GitHub. De site wordt nu bijgewerkt (ongeveer een minuut).\n  Voortgang: ${ACTIONS}\n  Site:      ${SITE}`);
  return 0;
}

try { process.exit(publish()); }
catch (e) {
  // Meestal een git-fout; de melding van git zelf zegt het duidelijkst wat er mis is
  console.error("Publiceren mislukt:\n" + (e.stderr || e.message));
  process.exit(1);
}
