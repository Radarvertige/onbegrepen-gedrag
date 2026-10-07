const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const page = fs.readFileSync(path.join(__dirname, "public", "index.html"));

http.createServer((req, res) => {
  if (req.url === "/" || req.url.startsWith("/?") || req.url.startsWith("/#")) {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex"
    });
    return res.end(page);
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Niet gevonden");
}).listen(PORT, () => console.log(`Draait op poort ${PORT}`));
