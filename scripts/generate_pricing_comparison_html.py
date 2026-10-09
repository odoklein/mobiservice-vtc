from pathlib import Path

OUT_DIR = Path('deliverables')
HTML_OUT = OUT_DIR / 'comparatif-formules-tarification-vtc-coefficients-corriges.html'


def table(headers, rows, cls=''):
    head = ''.join(f'<th>{h}</th>' for h in headers)
    body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows)
    return f'<table class="{cls}"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'


def bullets(items):
    return '<ul>' + ''.join(f'<li>{item}</li>' for item in items) + '</ul>'


def main():
    OUT_DIR.mkdir(exist_ok=True)
    summary_table = table(
        ['Sujet', 'Formule actuelle', 'Nouvelle formule proposée'],
        [
            ['Lisibilité', 'Moyenne : distances CA/TP et paliers.', 'Élevée : composants tarifaires explicites.'],
            ['Prévisibilité', 'Variable selon le trajet dépôt/client et le palier.', 'Facile à expliquer si durée et péages sont connus.'],
            ['Retour à vide', 'Calculé en km au tarif CA.', 'Calculé par pourcentage de la distance aller.'],
            ['Temps de trajet', 'Non facturé dans le transfert.', 'Facturé à la minute.'],
            ['Suppléments', 'Attente A/R après 15 min seulement.', 'Attente après 10 min + J+1/J+2/J+3.'],
        ])
    existing_components = table(
        ['Élément', 'Aller simple (A/S)', 'Aller-retour (A/R)'],
        [
            ['Déplacement chauffeur', 'Dépôt → prise en charge', 'Dépôt → prise en charge'],
            ['Trajet client', 'Prise en charge → destination', 'Prise en charge ↔ destination (×2)'],
            ['Retour chauffeur', 'Destination → dépôt', 'Prise en charge → dépôt'],
            ['Péages client', '×1', '×2'],
            ['Attente', 'Non appliquée', '15 min offertes, puis 1,20 €/min jour ou 1,80 €/min nuit'],
        ])
    existing_rates = table(
        ['Période', 'TP (trajet client)', 'CA (déplacement / retour chauffeur)'],
        [
            ['Jour (7h–20h, hors dimanche/JF)', '1,32 €/km', '1,32 / 1,10 / 0,90 / 0,70 €/km selon palier'],
            ['Nuit (20h–7h, dimanche/JF)', '1,90 €/km', '1,70 / 1,40 / 1,10 / 0,70 €/km selon palier'],
            ['Agglomération', 'Forfait ≤ 25 km : 33,00 € jour / 47,50 € nuit', 'Le forfait remplace le calcul transport'],
        ])
    new_params = table(
        ['Composant', 'Jour', 'Nuit', 'Règle'],
        [
            ['Prise en charge', '10,00 €', '10,00 €', 'Montant fixe par course'],
            ['Distance aller', '1,20 €/km', '1,70 €/km', 'Distance client retenue'],
            ['Temps de trajet', '0,40 €/min', '0,70 €/min', 'Durée réelle ou estimée à définir'],
            ['Péages', 'Péage ×2', 'Péage ×2', 'Aller + retour, selon la consigne proposée'],
            ['Attente', 'Après 10 min', 'Après 10 min', 'Tarif à confirmer ; à défaut, tarif minute'],
            ['Retour multi-jours', 'J+1 : 35 € ; J+2 : 70 € ; J+3 : 105 €', 'Même règle', 'Cumul ou montant unique à formaliser'],
        ], 'small')
    empty_return = table(
        ['Distance de la course', 'Taux retour à vide', 'Calcul'],
        [
                  ['0 à 50 km', '20 %', 'Distance aller × tarif km × 20 %'],
            ['50 à 120 km', '30 %', 'Distance aller × tarif km × 30 %'],
            ['120 à 180 km', '60 %', 'Distance aller × tarif km × 60 %'],
                  ['180 à 250 km', '65 %', 'Distance aller × tarif km × 65 %'],
                  ['Plus de 250 km', '75 % ou forfait négocié', 'Distance aller × tarif km × 75 %, sauf devis spécifique'],
        ])
    examples = table(
        ['Itinéraire', 'Distance', 'Ancienne formule', 'Nouvelle formule', 'Écart'],
        [
            ['Cluses → Sallanches', '16 km', '42,24 €', '33,04 €', '−9,20 €'],
            ['Cluses → Annecy', '69 km', '139,38 €', '117,64 €', '−21,74 €'],
            ['Cluses → Lyon Saint-Exupéry', '130 km', '262,60 €', '259,60 €', '−3,00 €'],
            ['Cluses → La Mure', '205 km', '414,10 €', '415,90 €', '+1,80 €'],
            ['Cluses → Marseille', '477 km', '963,54 €', '1 011,70 €', '+48,16 €'],
        ], 'numbers')
    cases = table(
        ['Cas', 'Risque', 'Règle recommandée'],
        [
            ['Course exactement à 50 / 120 / 180 / 250 km', 'Bascule de taux ambiguë.', 'Définir des bornes inclusives : 50,00 km reste à 0 %, puis 50,01 km passe à 30 %.'],
            ['Distance > 250 km', 'Le forfait négocié peut être oublié.', 'Alerte et validation manuelle si aucun forfait n’est saisi.'],
            ['Aller-retour client le même jour', 'Risque de facturer deux fois le retour à vide.', 'Formule A/R distincte : TP ×2, puis décision explicite sur le retour à vide.'],
            ['Attente', 'Les 10 min peuvent être interprétées par arrêt ou par course.', '10 min gratuites par course, puis unité d’arrondi affichée.'],
            ['Péages', 'Montant ×2 alors que le retour diffère.', 'Enregistrer péage aller et retour séparément ; ×2 seulement s’ils sont identiques.'],
            ['J+1 / J+2 / J+3', 'Cumul incertain et durée non contrôlée.', 'Préciser si 70 € remplace ou s’ajoute à 35 € ; validation au-delà de J+3.'],
            ['Nuit pendant la course', 'Départ jour, arrivée nuit.', 'Tarif à l’heure de prise en charge ou découpage horaire : choix à formaliser.'],
            ['Remise', 'Remise > prix ou remise sur péages.', 'Interdire un total négatif et définir l’assiette de remise.'],
        ], 'small')
    implementation = table(
        ['Étape', 'Calcul / contrôle'],
        [
            ['1. Déterminer le tarif', 'Jour ou nuit selon la date et l’heure de prise en charge.'],
            ['2. Fixer les données de route', 'Distance, durée, péage aller et péage retour issus de la même source.'],
            ['3. Calculer la base', '10 € + (distance × tarif km) + (durée × tarif minute).'],
            ['4. Appliquer le retour à vide', 'Distance uniquement × taux correspondant ; ne pas appliquer au temps ni aux péages.'],
            ['5. Ajouter les frais', 'Péage aller + péage retour + attente + J+N.'],
            ['6. Appliquer la remise', 'Assiette et plafond explicitement définis.'],
            ['7. Produire le total', 'Arrondi TTC, détail HT/TVA/TTC et paramètres utilisés.'],
        ])

    html = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Comparatif formules tarification VTC</title>
<style>
@page {{ size: A4; margin: 12mm 12mm 13mm; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; font-family: Arial, Helvetica, sans-serif; color:#172033; font-size:9.4pt; line-height:1.32; }}
.page {{ min-height:271mm; position:relative; page-break-after:always; padding-bottom:13mm; }}
.page:last-child {{ page-break-after:auto; }}
.topline {{ font-size:8pt; letter-spacing:.7px; color:#506276; font-weight:700; border-bottom:1px solid #d9e2ec; padding-bottom:4px; margin-bottom:13px; }}
h1 {{ color:#0b2545; font-size:26pt; line-height:1.04; margin:0 0 5px; letter-spacing:-.5px; }}
h2 {{ color:#2e74b5; font-size:15pt; margin:14px 0 6px; line-height:1.1; }}
h3 {{ color:#1f4d78; font-size:11.5pt; margin:11px 0 5px; }}
p {{ margin:0 0 6px; }}
.subtitle {{ color:#5f6b78; font-size:13pt; margin-bottom:16px; }}
.muted {{ color:#5f6b78; }}
.smallnote {{ font-size:8.5pt; color:#5f6b78; font-style:italic; }}
.callout {{ background:#e8eef5; border-left:4px solid #2e74b5; padding:9px 11px; margin:10px 0; }}
.callout.green {{ background:#eaf5ee; border-left-color:#397e52; }}
.callout.amber {{ background:#fff5db; border-left-color:#c28b19; }}
.label {{ color:#0b2545; font-weight:700; letter-spacing:.25px; }}
ol {{ margin:5px 0 8px 20px; padding:0; }} li {{ margin:0 0 4px; }} ul {{ margin:4px 0 6px 17px; padding:0; }}
table {{ width:100%; border-collapse:collapse; margin:5px 0 10px; table-layout:fixed; }}
th {{ background:#e8eef5; color:#0b2545; font-weight:700; text-align:left; border:1px solid #b7c7d8; padding:5px 6px; vertical-align:middle; }}
td {{ border:1px solid #cbd5df; padding:5px 6px; vertical-align:top; }}
.small th, .small td {{ padding:4px 5px; font-size:8.5pt; }}
.numbers td:nth-child(n+2), .numbers th:nth-child(n+2) {{ text-align:right; }}
.twocol {{ display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:5px; }}
.formula {{ background:#f2f4f7; padding:9px 10px; min-height:88px; white-space:pre-line; border:1px solid #d7e0e9; }}
.footer {{ position:absolute; bottom:0; left:0; right:0; border-top:1px solid #d9e2ec; padding-top:4px; color:#657487; font-size:7.5pt; display:flex; justify-content:space-between; }}
.cover {{ padding-top:18mm; }} .cover h2 {{ margin-top:20px; }}
</style></head><body>

<section class="page cover"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; NOTE DE DÉCISION</div>
<h1>Comparatif des formules<br>de tarification VTC</h1><div class="subtitle">Moteur public actuel vs. nouvelle formule proposée</div>
<p class="muted">Périmètre : transferts au départ de Cluses. Montants TTC dans les exemples. Les péages, durées, suppléments et remises restent des variables de la course.</p>
<div class="callout"><span class="label">À RETENIR&nbsp;&nbsp;</span>La formule actuelle est segmentée (dépôt, trajet client, retour) et dépend de paliers. La nouvelle formule est plus lisible : prise en charge + distance + temps + retour à vide + frais éventuels.</div>
<h2>Décision à prendre</h2><ol><li>Choisir une seule formule de référence pour le calculateur public et les réservations.</li><li>Définir les paramètres manquants : TVA, attente, péages, A/R client et forfait négocié au-delà de 250 km.</li><li>Afficher au client un détail identique à celui enregistré dans la réservation et le devis.</li></ol>
<h2>Synthèse comparative</h2>{summary_table}
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>1</span></div></section>

<section class="page"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; COMPARATIF TARIFAIRE</div>
<h2>1. Formule actuelle du calculateur public</h2><p>Cette section décrit le moteur utilisé par <b>/api/pricing/estimate</b>. Il ne contient ni prise en charge fixe, ni tarif minute, ni supplément J+1/J+2/J+3, ni remise.</p>
<h3>Composition</h3>{existing_components}
<h3>Tarifs actuels</h3>{existing_rates}
<div class="callout amber"><span class="label">POINT DE VIGILANCE&nbsp;&nbsp;</span>En A/R, le trajet client est facturé ×2, mais le moteur utilise actuellement CA aller + TP + CA retour pour choisir le palier et le forfait. Le TP n’est pas doublé pour cette décision de palier.</div>
<h3>Atouts et contraintes</h3>{bullets(['Atout : le prix couvre explicitement les déplacements du chauffeur avant et après la course.', 'Atout : les péages ne sont facturés que pendant le transport du client.', 'Contrainte : la règle est difficile à expliquer sans afficher les trois segments CA/TP/CA.', 'Contrainte : le calculateur public et le moteur de réservation ne sont pas parfaitement alignés, notamment sur les péages et la TVA.'])}
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>2</span></div></section>

<section class="page"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; COMPARATIF TARIFAIRE</div>
<h2>2. Nouvelle formule proposée</h2><p><b>Statut :</b> cette formule est proposée dans la conversation. Elle n’est pas encore appliquée par le calculateur public.</p>
<div class="callout green"><span class="label">FORMULE&nbsp;&nbsp;</span>Prix = prise en charge + distance aller + temps de trajet + péages aller-retour + retour à vide + suppléments − remise.</div>
<h3>Paramètres fournis</h3>{new_params}
<h3>Retour à vide proposé</h3>{empty_return}
<h3>Atouts et contraintes</h3>{bullets(['Atout : devis plus transparent, car chaque élément est nommé et additionné.', 'Atout : le prix prend en compte le temps de conduite, utile en trafic dense ou en montagne.', 'Atout : les coûts de retour sont encadrés par une règle commerciale simple.', 'Contrainte : le prix dépend de la durée mesurée ou estimée ; il faut définir la source de vérité.', 'Contrainte : la même course peut varier selon jour/nuit, durée, péage réel et statut multi-jours.'])}
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>3</span></div></section>

<section class="page"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; COMPARATIF TARIFAIRE</div>
<h2>3. Comparaison chiffrée sur les itinéraires exemples</h2><p class="smallnote">Hypothèses : départ et prise en charge à Cluses ; aller simple ; tarif jour ; aucun péage, temps de trajet à 0 min, supplément à 0 € et remise à 0 €. La nouvelle formule est donc une base hors temps.</p>
{examples}
<h3>Lecture des écarts</h3>{bullets(['Sur les distances courtes et moyennes, le retour à vide forfaitisé peut être inférieur au retour CA de l’ancienne formule.', 'À partir de 180 km, le taux de retour à vide (65 % puis 75 %) peut rendre la nouvelle base plus élevée.', 'Dès qu’un temps de trajet est ajouté, la nouvelle formule augmente de 0,40 €/min jour ou 0,70 €/min nuit.', 'Les chiffres ne sont pas comparables si les péages, la durée, les nuits ou les jours de retour sont différents.'])}
<h3>Exemple détaillé : Cluses → Annecy (69 km, jour)</h3><div class="twocol"><div class="formula"><b>Ancienne formule publique</b><br>Trajet client : 69 km × 1,32 € = 91,08 €<br>Retour CA : 69 km × 0,70 € = 48,30 €<br><b>Total : 139,38 €</b></div><div class="formula"><b>Nouvelle formule (hors temps / péages)</b><br>Prise en charge : 10,00 €<br>Distance : 69 km × 1,20 € = 82,80 €<br>Retour à vide : 82,80 € × 30 % = 24,84 €<br><b>Base : 117,64 €</b></div></div>
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>4</span></div></section>

<section class="page"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; COMPARATIF TARIFAIRE</div>
<h2>4. Cas exceptionnels à traiter avant mise en production</h2><p>Ces règles doivent être écrites explicitement dans le calculateur, le devis et l’administration afin d’éviter les prix incohérents et les litiges.</p>
{cases}
<h3>Points techniques et comptables</h3>{bullets(['TVA : fixer le taux applicable à chaque composant et conserver le détail HT/TVA/TTC dans la réservation.', 'Arrondi : calculer avec précision interne, puis arrondir uniquement chaque total affiché à 2 décimales.', 'Données d’itinéraire : figer distance, durée, péages et date/heure au moment de l’établissement du devis.', 'Transparence : afficher clairement retour à vide, durée, péages et suppléments.'])}
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>5</span></div></section>

<section class="page"><div class="topline">MOBISERVICE VTC &nbsp;|&nbsp; COMPARATIF TARIFAIRE</div>
<h2>5. Recommandation de mise en œuvre</h2><div class="callout green"><span class="label">RECOMMANDATION&nbsp;&nbsp;</span>Adopter une seule fonction de calcul partagée par le calculateur public, les réservations, les devis et les factures. Les paramètres tarifaires doivent être administrables et versionnés.</div>
<h3>Règle de calcul proposée à formaliser</h3>{implementation}
<h3>Checklist de validation avant déploiement</h3>{bullets(['Valider la formule séparée pour A/S, A/R même jour et A/R sur plusieurs jours.', 'Valider l’assiette du retour à vide : distance seule (recommandé) ou distance + temps.', 'Valider la règle des péages : montants distincts aller/retour ou multiplication automatique.', 'Valider le tarif d’attente après les 10 minutes gratuites.', 'Valider la TVA de chaque ligne et les règles d’arrondi.', 'Tester au minimum les bornes 50, 120, 180, 250 km, un dimanche, une course de nuit, un péage, une attente et un retour J+1.'])}
<div class="callout"><span class="label">CONCLUSION&nbsp;&nbsp;</span>La nouvelle formule est plus simple à expliquer et à détailler, mais elle doit être spécifiée précisément sur les cas A/R, péages, attente, TVA et forfaits longue distance avant de remplacer le moteur actuel.</div>
<div class="footer"><span>Comparatif tarifaire — document de travail</span><span>6</span></div></section>
</body></html>'''
    HTML_OUT.write_text(html, encoding='utf-8')
    print(HTML_OUT)


if __name__ == '__main__':
    main()
