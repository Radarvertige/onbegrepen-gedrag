/*
 * server.js – kleine webserver die de map public/ serveert. Geen extra pakketten.
 *
 * Bedoeld voor lokaal bekijken (npm start) en voor Heroku (zie Procfile).
 * GitHub Pages gebruikt dit bestand niet: daar worden de bestanden uit public/
 * rechtstreeks gepubliceerd.
 *
 * Alleen bestanden binnen public/ met een type uit TYPES worden verstuurd;
 * al het andere (ook docs/ en dit bestand zelf) geeft een 404.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Heroku geeft de poort mee via PORT; lokaal is het 3000
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");
// Toegestane bestandstypen. Komt er een nieuw soort bestand in public/ (bijvoorbeeld .png), voeg het hier toe.
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".txt": "text/plain; charset=utf-8"
};

function nietGevonden(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Niet gevonden");
}

http.createServer((req, res) => {
  let pad;
  try { pad = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { return nietGevonden(res); }
  if (pad === "/") pad = "/index.html";

  // Alleen bekende bestandstypen binnen public/
  const bestand = path.join(ROOT, pad);
  const type = TYPES[path.extname(bestand)];
  if (!type || !bestand.startsWith(ROOT + path.sep)) return nietGevonden(res);

  fs.readFile(bestand, (err, inhoud) => {
    if (err) return nietGevonden(res);
    // X-Robots-Tag: zoekmachines nemen de pagina niet op
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex"
    });
    res.end(inhoud);
  });
}).listen(PORT, () => console.log(`Draait op poort ${PORT}`));
