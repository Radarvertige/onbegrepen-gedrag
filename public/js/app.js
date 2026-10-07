/*
 * app.js – bouwt de pagina op uit de gegevens in casussen.js.
 *
 * Wordt geladen ná casussen.js en gebruikt daaruit CASUSSEN en FOTOS.
 * index.html bevat alleen lege houders (#overzicht, #filters, #toc, #casussen,
 * #balk); dit bestand vult ze en regelt het themafilter en de meelopende balk.
 *
 * Indeling:
 *   1. Instellingen
 *   2. Bouwstenen (stukjes HTML)
 *   3. Casussen en inhoudsopgave opbouwen
 *   4. Themafilter
 *   5. Meelopende balk
 *   6. Start
 *
 * Uitgebreide uitleg: docs/technische-documentatie.md
 */

/* ---------- 1. Instellingen ---------- */

/**
 * De vijf soorten problematiek: [code, naam]. De code staat bij een casus in
 * het veld `p` (casussen.js). De volgorde is die van de radar: de eerste is de
 * binnenste boog, de laatste de buitenste.
 */
const LAGEN = [
  ["psy", "Psychische problematiek"],
  ["ver", "Verslaving"],
  ["lvb", "Licht verstandelijke beperking"],
  ["dak", "Dakloosheid"],
  ["agr", "Agressie of geweld"]
];

/** Straal van elke boog in de radar, in dezelfde volgorde als LAGEN. */
const RADII = [22, 44, 66, 88, 110];

/** Een casus telt als "in beeld" zodra zijn bovenkant boven deze lijn zit (px vanaf de bovenrand). */
const LEESLIJN = 120;

/** Codes van de problematiek bij een casus, bijvoorbeeld ["psy", "ver"]. Leeg als `p` ontbreekt. */
const lagenVan = c => (c.p || "").split(",").filter(Boolean);

/** Aantal casussen met een radar; de noemer in "10 van 17" in het overzicht. */
const MET_RADAR = CASUSSEN.filter(c => lagenVan(c).length).length;

/** Alle thema's uit de casussen, alfabetisch, met "Alle" vooraan. Dit worden de filterknoppen. */
const THEMAS = ["Alle"].concat([...new Set(CASUSSEN.flatMap(c => c.tags))].sort((a, b) => a.localeCompare(b, "nl")));

// Houders uit index.html
const main = document.getElementById("casussen"), toc = document.getElementById("toc"),
      filters = document.getElementById("filters"), count = document.getElementById("count"),
      balk = document.getElementById("balk"), spring = document.getElementById("spring"),
      vorige = document.getElementById("vorige"), volgende = document.getElementById("volgende"),
      index = document.getElementById("index");

/* ---------- 2. Bouwstenen ---------- */

/** Maakt tekst veilig om in HTML te plakken. */
const esc = s => s.replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

/**
 * Tekent de radar: vijf halve bogen, één per laag uit LAGEN.
 * @param {number[]} widths lijndikte per boog; 0 betekent "speelt niet" en
 *   geeft een dunne stippellijn.
 */
function radarSVG(widths){
  const c=115, base=115;
  return `<svg viewBox="0 0 230 118" aria-hidden="true" fill="none" stroke="#2B0039">`+
    LAGEN.map((l,i)=>{const r=RADII[i],w=widths[i];
      return `<path d="M${c-r} ${base} A${r} ${r} 0 0 1 ${c+r} ${base}" stroke-width="${w||1}" ${w? '' : 'stroke-opacity=".25" stroke-dasharray="3 4"'}/>`}).join("")+
    `<line x1="0" y1="${base}" x2="230" y2="${base}" stroke-opacity=".25"/></svg>`;
}

/**
 * Legenda naast de radar, van buitenste naar binnenste boog.
 * @param {string[]} aan codes van de lagen die spelen; de rest wordt grijs.
 * @param {Object<string,number>} [extra] aantal casussen per code; alleen het
 *   overzicht bovenaan geeft dit mee en toont dan "10 van 17".
 */
function legenda(aan, extra){
  return `<ul>${LAGEN.slice().reverse().map(([k,n])=>`<li class="${aan.includes(k)?'':'uit'}"><i></i>${extra?`<b>${extra[k]} van ${MET_RADAR}</b>`:''}${n}</li>`).join("")}</ul>`;
}

/**
 * Ronde foto in de lopende tekst.
 * @param {{src:string, alt:string}} f foto uit FOTOS
 * @param {"l"|"r"} kant links of rechts van de tekst
 */
function rondFoto(f,kant){
  return `<figure class="rond ${kant}"><img src="${f.src}" alt="${esc(f.alt)}" loading="lazy"></figure>`;
}

/* ---------- 3. Casussen en inhoudsopgave opbouwen ---------- */

let fotoTeller=0; // telt de casussen met foto, zodat foto's om en om rechts en links staan

/**
 * Zet één casus op de pagina: het artikel in #casussen en de regel in de
 * inhoudsopgave (#toc). Beide krijgen `data-tags`, waar het themafilter op let.
 * @param {object} c casus uit CASUSSEN
 * @param {number} i positie in CASUSSEN (0 = eerste)
 */
function bouwCasus(c,i){
  const nr = String(i+1).padStart(2,"0");
  const a = document.createElement("article");
  a.className="casus"; a.id=c.id; a.dataset.tags=c.tags.join("|"); a.dataset.label=`${nr} · ${c.naam}`;
  const lagen=lagenVan(c);
  const f=FOTOS[c.id];
  const kant = f ? (fotoTeller++ % 2 ? "l" : "r") : "";
  const alinea = c.tekst.map(p=>`<p>${esc(p)}</p>`);
  // De foto komt na de eerste alinea; bij een korte casus (twee alinea's of minder) ervoor
  if(f) alinea.splice(c.tekst.length>2?1:0,0,rondFoto(f,kant));
  a.innerHTML = `<div class="casus-top"><div class="casus-head"><span class="eyebrow">Casus ${nr}</span><h2>${esc(c.naam)}</h2><h3>${esc(c.sub)}</h3>
    <div class="tags">${c.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div></div>${lagen.length?`<div class="radar" role="img" aria-label="Problematiek: ${LAGEN.filter(l=>lagen.includes(l[0])).map(l=>l[1].toLowerCase()).join(", ")}">${radarSVG(LAGEN.map(l=>lagen.includes(l[0])?2:0))}${legenda(lagen)}</div>`:""}</div>
    <div class="body">${c.cw?`<p class="cw">${esc(c.cw)}</p>`:""}${alinea.join("")}</div>
    <div class="kern"><b>Zorg ontbreekt, veiligheid wankelt</b><p>${esc(c.kern)}</p></div>`;
  main.appendChild(a);
  const li = document.createElement("li"); li.dataset.tags=a.dataset.tags;
  li.innerHTML = `<a href="#${c.id}"><span>${nr}</span><strong>${esc(c.naam)}</strong></a>`;
  toc.appendChild(li);
}

/** Tekent de grote radar bovenaan: hoe vaker een problematiek voorkomt, hoe dikker de boog. */
function bouwOverzicht(){
  const tel={}; LAGEN.forEach(([k])=>tel[k]=CASUSSEN.filter(c=>lagenVan(c).includes(k)).length);
  document.getElementById("overzicht").innerHTML = radarSVG(LAGEN.map(([k])=>1+tel[k]*0.45)) + legenda(LAGEN.map(l=>l[0]), tel);
}

/** Maakt voor elk thema een filterknop in #filters. */
function bouwFilters(){
  THEMAS.forEach(t=>{
    const b=document.createElement("button"); b.type="button"; b.dataset.t=t; b.textContent=t; b.id="f-"+t.toLowerCase().replace(/\W+/g,"-");
    b.addEventListener("click",()=>kiesThema(t)); filters.appendChild(b);
  });
}

/* ---------- 4. Themafilter ---------- */

/**
 * Toont alleen de casussen met het gekozen thema, in de pagina én in de
 * inhoudsopgave, en werkt de teller, de knoppen en de keuzelijst van de balk bij.
 * @param {string} thema een waarde uit THEMAS; "Alle" toont alles
 */
function kiesThema(thema){
  let n=0;
  document.querySelectorAll("article.casus, #toc li").forEach(el=>{
    const show = thema==="Alle" || el.dataset.tags.split("|").includes(thema);
    el.hidden=!show; if(show && el.tagName==="ARTICLE") n++;
  });
  filters.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.t===thema));
  count.textContent = thema==="Alle" ? `${n} casussen` : `${n} casussen met thema ‘${thema}’`;
  spring.replaceChildren(...zichtbaar().map(a=>new Option(a.dataset.label,a.id)));
  ververs();
}

/* ---------- 5. Meelopende balk ---------- */
// Verschijnt zodra het casusoverzicht (#index) uit beeld is. Toont de casus die
// je leest en springt naar een andere, altijd binnen het gekozen thema.

/** De casussen die het themafilter nu toont, in paginavolgorde. */
const zichtbaar = () => [...document.querySelectorAll("article.casus:not([hidden])")];

/**
 * De casus die de lezer nu voor zich heeft: de laatste waarvan de bovenkant
 * boven de LEESLIJN zit. Staat er nog geen zo hoog, dan de eerste.
 * @param {HTMLElement[]} lijst uitkomst van zichtbaar()
 */
function huidige(lijst){
  let h=lijst[0];
  for(const a of lijst){ if(a.getBoundingClientRect().top<=LEESLIJN) h=a; else break; }
  return h;
}

/** Toont of verbergt de balk en zet keuzelijst en pijlen goed. Draait bij scrollen, schalen en na het filteren. */
function ververs(){
  balk.hidden = index.getBoundingClientRect().bottom > 0;
  if(balk.hidden) return;
  const lijst=zichtbaar(), i=lijst.indexOf(huidige(lijst));
  // Niet aan de keuzelijst zitten terwijl de lezer erin aan het kiezen is
  if(i>=0 && document.activeElement!==spring) spring.value=lijst[i].id;
  vorige.disabled = i<=0; volgende.disabled = i<0 || i>=lijst.length-1;
}

/**
 * Scrolt naar de vorige of volgende zichtbare casus.
 * @param {-1|1} d richting
 */
function stap(d){ const lijst=zichtbaar(), a=lijst[lijst.indexOf(huidige(lijst))+d]; if(a) a.scrollIntoView(); }

/** Koppelt de knoppen van de balk en houdt hem bij tijdens het scrollen. */
function koppelBalk(){
  spring.addEventListener("change",()=>{ document.getElementById(spring.value).scrollIntoView(); spring.blur(); });
  vorige.addEventListener("click",()=>stap(-1));
  volgende.addEventListener("click",()=>stap(1));
  // Scrollen vuurt heel vaak; hooguit één keer per beeldverversing bijwerken
  let wacht=false;
  addEventListener("scroll",()=>{ if(wacht) return; wacht=true; requestAnimationFrame(()=>{ wacht=false; ververs(); }); },{passive:true});
  addEventListener("resize",ververs);
}

/* ---------- 6. Start ---------- */

CASUSSEN.forEach(bouwCasus);
bouwOverzicht();
bouwFilters();
koppelBalk();
kiesThema("Alle");
