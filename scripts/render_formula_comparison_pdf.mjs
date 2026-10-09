import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = nodeRepl.cwd;
const outDir = path.join(root, "deliverables");
const qaDir = path.join(outDir, "comparison-render");
const htmlPath = path.join(qaDir, "comparatif-formules-tarification-vtc.html");
const pdfPath = path.join(outDir, "comparatif-formules-tarification-vtc.pdf");

await fs.mkdir(qaDir, { recursive: true });

const rates = [
  ["Trajet client (TP)", "1,32 €/km", "1,90 €/km"],
  ["CA — palier >25–50 km", "1,32 €/km", "1,70 €/km"],
  ["CA — palier >50–75 km", "1,10 €/km", "1,40 €/km"],
  ["CA — palier >75–100 km", "0,90 €/km", "1,10 €/km"],
  ["CA — palier >100 km", "0,70 €/km", "0,70 €/km"],
  ["Forfait ≤25 km", "33,00 € TTC", "47,50 € TTC"],
  ["Attente A/R après 15 min", "1,20 €/min", "1,80 €/min"],
];

const risks = [
  ["Enregistrement", "Le serveur recalcule sans péage ni attente.", "Prix enregistré potentiellement inférieur au prix affiché.", "Critique"],
  ["Deux moteurs", "L’estimateur utilise des constantes ; la sauvegarde peut utiliser la base.", "Deux tarifs différents pour une même course.", "Critique"],
  ["Attente affichée", "L’écran annonce 10 min gratuites ; le moteur en déduit 15.", "Information client incohérente.", "Haute"],
  ["Palier A/R", "Le palier CA est choisi avec CA aller + 1×TP + CA retour.", "Le TP retour est facturé mais ne participe pas au choix du palier.", "Haute"],
  ["J+1 à J+3", "L’immobilisation est calculée séparément mais non ajoutée au total.", "Le supplément peut manquer au devis.", "Haute"],
  ["TVA sauvegardée", "La réservation stocke un taux global de 10 %.", "Le détail à 20 % des péages/MAD peut être perdu.", "Moyenne"],
];

const table = (headers, rows, cls = "") => `
  <table class="${cls}">
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;

const callout = (label, text, cls = "blue") =>
  `<div class="callout ${cls}"><b>${label.toUpperCase()}</b><span>${text}</span></div>`;

const formula = (label, text, note) => `
  <div class="formula"><div class="formula-label">${label}</div><pre>${text}</pre></div>
  ${note ? `<div class="formula-note">${note}</div>` : ""}`;

const item = (label, text) => `<p class="item"><b>${label} —</b> ${text}</p>`;

const page = (number, content) => `
  <section class="page">
    <header><span>MOBISERVICE VTC</span><span>COMPARATIF TARIFAIRE</span></header>
    <main>${content}</main>
    <footer><span>Document de travail — 31 juillet 2026</span><span>${number}</span></footer>
  </section>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Comparatif des formules de tarification VTC</title>
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #dfe6ed; font-family: Arial, sans-serif; color: #172b4d; }
  .page { width: 8.5in; height: 11in; margin: 0 auto 18px; background: white; padding: .43in .72in .43in; position: relative; page-break-after: always; overflow: hidden; }
  header { height: .30in; border-bottom: 1px solid #d7e0e8; display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 700; letter-spacing: .08em; color: #60758a; }
  main { padding-top: .20in; }
  footer { position: absolute; left: .72in; right: .72in; bottom: .22in; border-top: 1px solid #d7e0e8; padding-top: 6px; display: flex; justify-content: space-between; font-size: 8pt; color: #60758a; }
  h1 { margin: 0 0 12px; font-size: 18pt; line-height: 1.1; color: #1f6feb; }
  h2 { margin: 15px 0 7px; font-size: 13pt; color: #1f6feb; }
  h3 { margin: 11px 0 5px; font-size: 11pt; color: #102a43; }
  p { margin: 0 0 7px; font-size: 9.7pt; line-height: 1.34; }
  .kicker { margin: 0 0 5px; color: #1f8a5b; font-size: 9pt; font-weight: 700; letter-spacing: .12em; }
  .cover-title { margin: 0; font-size: 26pt; line-height: 1.06; color: #102a43; }
  .subtitle { margin: 8px 0 16px; color: #60758a; font-size: 13pt; }
  .meta { color: #60758a; font-size: 9pt; margin-bottom: 3px; }
  .meta b { color: #172b4d; }
  .callout { border-left: 5px solid #1f6feb; background: #eaf2ff; padding: 12px 14px; margin: 12px 0; display: flex; gap: 12px; align-items: flex-start; font-size: 10pt; line-height: 1.34; }
  .callout b { color: #1f6feb; font-size: 8.5pt; min-width: 88px; letter-spacing: .06em; }
  .callout span { font-weight: 700; color: #102a43; }
  .callout.green { background: #e9f7f0; border-color: #1f8a5b; }
  .callout.green b { color: #1f8a5b; }
  .callout.gold { background: #fff5d6; border-color: #a66b00; }
  .callout.gold b { color: #a66b00; }
  table { width: 100%; border-collapse: collapse; margin: 7px 0 11px; font-size: 8.7pt; line-height: 1.23; table-layout: fixed; }
  th { background: #102a43; color: white; padding: 7px 8px; text-align: left; font-size: 8.4pt; }
  td { border: 1px solid #cfd9e3; padding: 7px 8px; vertical-align: middle; }
  tr:nth-child(even) td { background: #f4f7fa; }
  .summary th:nth-child(1) { width: 19%; } .summary th:nth-child(2) { width: 32%; } .summary th:nth-child(3) { width: 30%; } .summary th:nth-child(4) { width: 19%; }
  .summary td:last-child, .risk td:last-child { text-align: center; font-weight: 700; }
  .rates th:nth-child(1) { width: 44%; } .rates th:nth-child(2) { width: 24%; } .rates th:nth-child(3) { width: 32%; }
  .rates td:not(:first-child) { text-align: center; }
  .example th:nth-child(1) { width: 28%; } .example th:nth-child(2) { width: 46%; } .example th:nth-child(3) { width: 26%; }
  .example td:last-child { text-align: right; font-weight: 700; }
  .example tr:last-child td { background: #e9f7f0; font-weight: 700; }
  .risk { font-size: 8pt; }
  .risk th:nth-child(1) { width: 17%; } .risk th:nth-child(2) { width: 34%; } .risk th:nth-child(3) { width: 34%; } .risk th:nth-child(4) { width: 15%; }
  .formula { margin-top: 7px; background: #102a43; color: white; padding: 10px 13px; }
  .formula-label { color: #a8c7fa; font-weight: 700; font-size: 8.5pt; letter-spacing: .08em; margin-bottom: 5px; }
  pre { margin: 0; white-space: pre-wrap; font-family: Consolas, "Courier New", monospace; font-weight: 700; font-size: 9.7pt; line-height: 1.34; }
  .formula-note { background: #f4f7fa; color: #60758a; padding: 7px 12px; font-size: 8.8pt; line-height: 1.25; margin-bottom: 9px; }
  .muted { color: #60758a; font-size: 9pt; }
  .item { margin-bottom: 7px; padding-left: 11px; border-left: 3px solid #d7e0e8; }
  .verdict { font-size: 11pt; font-weight: 700; color: #102a43; line-height: 1.42; }
  .sources { margin-top: 8px; font-size: 8.2pt; line-height: 1.45; color: #60758a; }
</style></head><body>
${page(1, `
  <div class="kicker">NOTE DE COMPARAISON</div>
  <div class="cover-title">Formule actuelle de la plateforme<br>vs. formule transmise</div>
  <div class="subtitle">Calcul des transferts VTC — aller simple et aller-retour</div>
  <div class="meta"><b>Objet :</b> vérifier les écarts de calcul et les risques d’implémentation</div>
  <div class="meta"><b>Périmètre :</b> calculateur public /api/pricing/estimate et enregistrement d’une réservation</div>
  ${callout("Conclusion", "La formule transmise est identique au calculateur public pour un aller simple, et donne bien 139,38 € TTC hors péage pour Cluses → Annecy. Les écarts importants proviennent surtout de l’implémentation lors de l’enregistrement de la réservation.", "green")}
  <h1>Résultat en un coup d’œil</h1>
  ${table(["Point comparé", "Plateforme affichée", "Formule transmise", "Verdict"], [
    ["A/S", "CA aller + TP + CA retour + péage ×1", "Même formule", "Identique"],
    ["Départ Cluses", "CA aller = 0", "CA aller omis car nul", "Identique"],
    ["A/R", "CA aller + 2×TP + CA retour + 2×péage + attente", "Même formule", "Identique"],
    ["Attente", "15 min gratuites, puis 1,20/1,80 €/min", "Même règle", "Identique"],
    ["Sauvegarde", "Recalcul séparé sans péage ni attente", "Non prévu", "Écart critique"],
  ], "summary")}
  ${callout("Décision recommandée", "Conserver la formule transmise comme formule de référence, mais utiliser une seule fonction de calcul côté serveur pour l’estimation, la réservation, le devis et la facture.", "gold")}
`)}
${page(2, `
  <h1>1. Les deux formules, mises à plat</h1>
  <p class="muted">Les distances sont calculées depuis le dépôt fixe : 4 rue des Artisans, 74300 Cluses.</p>
  <h2>Formule actuellement affichée par la plateforme</h2>
  ${formula("ALLER SIMPLE", "Prix TTC = (CA aller × tarif CA) + (TP × tarif TP)\n          + (CA retour × tarif CA) + péage client", "CA retour est toujours inclus. Le péage du trajet client est compté une seule fois.")}
  ${formula("ALLER-RETOUR", "Prix TTC = (CA aller × tarif CA) + (2 × TP × tarif TP)\n          + (CA retour × tarif CA) + (2 × péage)\n          + attente facturable", "Pour un A/R, CA retour est fixé égal à CA aller, car le client revient au point de prise en charge.")}
  <h2>Formule transmise</h2>
  ${formula("ALLER SIMPLE", "Prix total = CA aller + trajet client (TP)\n           + CA retour + péage client", "Chaque composant CA/TP est bien distance × tarif. Péage facturé une seule fois.")}
  ${formula("PRISE EN CHARGE DIRECTEMENT À CLUSES", "Prix = (distance client × tarif TP)\n     + (distance retour × tarif CA) + péage", "Cette écriture ne supprime pas CA aller : elle constate simplement que sa distance est égale à zéro.")}
  ${callout("Équivalence", "Pour un aller simple, les deux écritures produisent exactement le même résultat lorsque les mêmes distances, paliers et péages sont utilisés.", "green")}
`)}
${page(3, `
  <h1>2. Tarifs et exemple de contrôle</h1>
  <h2>Grille utilisée dans les deux formules</h2>
  ${table(["Élément", "Jour", "Nuit / dimanche / jour férié"], rates, "rates")}
  <p class="muted">Plage jour : 07:00–19:59, hors dimanche et jours fériés français. Plage nuit : 20:00–06:59, dimanche et jours fériés 24 h/24.</p>
  <h2>Exemple commun : Cluses → Annecy</h2>
  <p class="muted">Hypothèses : prise en charge à Cluses, 69 km, tarif jour, aller simple, hors péage.</p>
  ${table(["Composant", "Calcul", "Montant"], [
    ["CA aller", "0 km × tarif CA", "0,00 €"],
    ["Trajet client (TP)", "69 km × 1,32 €/km", "91,08 €"],
    ["CA retour", "69 km × 0,70 €/km", "48,30 €"],
    ["Péage", "Hors exemple", "0,00 €"],
    ["TOTAL TTC", "91,08 € + 48,30 €", "139,38 €"],
  ], "example")}
  ${callout("Résultat", "Plateforme affichée : 139,38 € TTC. Formule transmise : 139,38 € TTC. Écart : 0,00 €.", "green")}
  <p class="verdict">La formule ne contient ni prise en charge fixe de 10 €, ni prix de trajet à la minute, ni coefficient de retour à vide, ni supplément automatique J+1.</p>
`)}
${page(4, `
  <h1>3. Différences réelles et risques actuels</h1>
  <p class="muted">Les différences ci-dessous ne viennent pas de la formule commerciale transmise. Elles viennent des chemins de calcul distincts présents dans la plateforme.</p>
  ${table(["Sujet", "Comportement constaté", "Conséquence", "Priorité"], risks, "risk")}
  <h2>Interprétation du palier</h2>
  ${item("Aller simple", "la plateforme choisit le tarif CA à partir de CA aller + TP + CA retour. C’est cohérent avec l’exemple Cluses → Annecy : 0 + 69 + 69 = 138 km, donc palier >100 km.")}
  ${item("Aller-retour", "le prix facture 2×TP, mais le palier reste déterminé avec un seul TP. Cette règle doit être confirmée explicitement avant de figer la nouvelle formule.")}
  ${callout("Point à valider", "Pour un A/R, le palier CA doit-il être déterminé avec CA aller + TP + CA retour ou avec la distance réellement facturée CA aller + 2×TP + CA retour ?", "gold")}
`)}
${page(5, `
  <h1>4. Recommandation de mise en œuvre</h1>
  ${callout("Formule cible", "Prix TTC = CA aller + TP facturé + CA retour + péage client + attente/MAD applicable. Aucune prise en charge fixe, aucun prix à la minute pour le trajet et aucun coefficient de retour à vide.", "green")}
  <h2>Règles à figer dans une seule fonction serveur</h2>
  ${item("1. Distances", "figer CA aller, TP et CA retour issus de la même matrice routière.")}
  ${item("2. Horaire", "choisir jour/nuit selon l’heure locale de prise en charge, dimanche et jours fériés inclus.")}
  ${item("3. Palier", "documenter l’assiette exacte du palier CA, particulièrement pour les A/R.")}
  ${item("4. Péages", "facturer ×1 en A/S et ×2 en A/R, uniquement lorsque le client est transporté.")}
  ${item("5. Attente", "afficher et appliquer 15 minutes gratuites, puis 1,20 €/min jour ou 1,80 €/min nuit.")}
  ${item("6. TVA", "conserver séparément transport à 10 % et péage/MAD à 20 %.")}
  ${item("7. Persistance", "enregistrer exactement le prix calculé par la fonction serveur, avec son détail et sa version tarifaire.")}
  <h2>Verdict final</h2>
  <p class="verdict">La formule transmise peut servir de formule commerciale de référence : elle correspond au calculateur public actuel pour les cas décrits. Le chantier nécessaire n’est pas un changement de formule, mais l’unification et la sécurisation de son exécution dans toute la plateforme.</p>
  <h2>Sources techniques vérifiées</h2>
  <p class="sources">app/api/pricing/estimate/route.ts — construction des distances, péages et appel du calculateur public<br>
  lib/pricing/tariffs-2026.ts — tarifs, forfait, formule A/S-A/R, attente et TVA<br>
  app/api/bookings/route.ts — recalcul et enregistrement serveur<br>
  lib/pricing.ts — deuxième moteur et chargement des tarifs configurables<br>
  app/(public)/reservation/page.tsx — affichage client et immobilisation J+1 à J+3</p>
`)}
</body></html>`;

await fs.writeFile(htmlPath, html, "utf8");

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const browserPage = await browser.newPage({ viewport: { width: 1100, height: 1500 }, deviceScaleFactor: 1 });
await browserPage.goto(`file:///${htmlPath.replaceAll("\\", "/")}`, { waitUntil: "networkidle" });
await browserPage.pdf({
  path: pdfPath,
  format: "Letter",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: true,
});

const pageElements = browserPage.locator(".page");
const count = await pageElements.count();
for (let i = 0; i < count; i++) {
  await pageElements.nth(i).screenshot({ path: path.join(qaDir, `page-${i + 1}.png`) });
}
await browser.close();

console.log(JSON.stringify({ pdfPath, htmlPath, qaDir, pages: count }, null, 2));
