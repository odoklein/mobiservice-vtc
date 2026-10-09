from pathlib import Path
from datetime import date

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs"
DOCX_PATH = OUT / "Argumentaire_Methode_B_VTC.docx"
CHART_PATH = OUT / "_ecarts_methode_b.png"

# decision_memo (standard_business_brief) token map
NAVY = "0B2545"
BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
MUTED = "5B6573"
LIGHT_BLUE = "E8EEF5"
LIGHT_GRAY = "F2F4F7"
GREEN = "2F6B4F"
GOLD = "7A5A00"
RED = "9B1C1C"
WHITE = "FFFFFF"
CONTENT_DXA = 9360


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color="D6DEE8", size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = qn(f"w:{edge}")
        node = borders.find(tag)
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), size)
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)


def set_table_geometry(table, widths, indent=120):
    table.autofit = False
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.first_child_found_in("w:tblW")
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_layout = tbl_pr.first_child_found_in("w:tblLayout")
    if tbl_layout is None:
        tbl_layout = OxmlElement("w:tblLayout")
        tbl_pr.append(tbl_layout)
    tbl_layout.set(qn("w:type"), "fixed")
    tbl_ind = tbl_pr.first_child_found_in("w:tblInd")
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent))
    tbl_ind.set(qn("w:type"), "dxa")
    grid = tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for index, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.first_child_found_in("w:tcW")
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[index]))
            tc_w.set(qn("w:type"), "dxa")
            cell.width = Inches(widths[index] / 1440)
            set_cell_margins(cell)


def set_run_font(run, size=11, color=NAVY, bold=False, italic=False):
    run.font.name = "Arial"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold
    run.italic = italic


def set_para_format(p, before=0, after=6, line=1.10, keep=False):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if keep:
        pf.keep_with_next = True


def add_text(doc, text="", size=11, color=NAVY, bold=False, italic=False, before=0, after=6, align=None, style=None):
    p = doc.add_paragraph(style=style)
    set_para_format(p, before, after)
    if align is not None:
        p.alignment = align
    if text:
        run = p.add_run(text)
        set_run_font(run, size, color, bold, italic)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    run = p.add_run(text)
    color = BLUE if level < 3 else DARK_BLUE
    size = 16 if level == 1 else (13 if level == 2 else 12)
    set_run_font(run, size=size, color=color, bold=True)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Inches(0.50)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    set_para_format(p, 0, 5, 1.167)
    run = p.add_run(text)
    set_run_font(run, 10.5, NAVY)
    return p


def add_page_field(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Page ")
    set_run_font(run, 8.5, MUTED)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    paragraph._p.append(fld)


def configure_document(doc):
    section = doc.sections[0]
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Arial"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(NAVY)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10

    for level, size, before, after, color in (
        (1, 16, 12, 6, BLUE),
        (2, 13, 10, 5, BLUE),
        (3, 12, 8, 4, DARK_BLUE),
    ):
        style = styles[f"Heading {level}"]
        style.font.name = "Arial"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)
        style.font.bold = True
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    # Header and footer: quiet running label, as required by the chosen preset.
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_para_format(hp, 0, 0, 1.0)
    hr = hp.add_run("MOBISERVICE VTC  |  ARGUMENTAIRE DÉCISION PRODUIT")
    set_run_font(hr, 8.5, MUTED, bold=True)
    footer = section.footer
    fp = footer.paragraphs[0]
    add_page_field(fp)


def write_cell(cell, text, size=9.2, color=NAVY, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = cell.paragraphs[0]
    p.alignment = align
    set_para_format(p, 0, 0, 1.05)
    run = p.add_run(text)
    set_run_font(run, size, color, bold)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_callout(doc, label, message, fill=LIGHT_BLUE, label_color=BLUE):
    table = doc.add_table(rows=1, cols=1)
    set_table_geometry(table, [CONTENT_DXA])
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    set_cell_border(cell, "C9D7E6", "8")
    p = cell.paragraphs[0]
    set_para_format(p, 0, 0, 1.12)
    r = p.add_run(label + "  ")
    set_run_font(r, 10.5, label_color, True)
    r = p.add_run(message)
    set_run_font(r, 10.5, NAVY)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_metric_strip(doc):
    table = doc.add_table(rows=1, cols=3)
    set_table_geometry(table, [3120, 3120, 3120])
    labels = [
        ("5", "trajets réels testés"),
        ("+11,5 à +55,5 %", "écart B vs. actuel"),
        ("1", "moteur à unifier"),
    ]
    for i, (value, caption) in enumerate(labels):
        cell = table.cell(0, i)
        set_cell_shading(cell, NAVY)
        set_cell_border(cell, NAVY, "0")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_para_format(p, 0, 0, 1.0)
        r = p.add_run(value + "\n")
        set_run_font(r, 18, WHITE, True)
        r = p.add_run(caption)
        set_run_font(r, 8.5, "DCE7F3")
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def create_chart():
    trips = ["Genève\nAéroport", "Annecy", "Chamonix", "Lyon\nPart-Dieu", "Grenoble"]
    current = [103.83, 144.48, 83.22, 392.60, 338.58]
    method_b = [161.40, 178.70, 92.78, 518.40, 447.42]
    width, height = 1476, 630
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    font_dir = Path("C:/Windows/Fonts")
    regular = ImageFont.truetype(str(font_dir / "arial.ttf"), 24)
    small = ImageFont.truetype(str(font_dir / "arial.ttf"), 20)
    bold = ImageFont.truetype(str(font_dir / "arialbd.ttf"), 20)
    y_top, y_bottom = 70, 500
    max_value = 560
    chart_h = y_bottom - y_top
    draw.text((90, 18), "Comparaison des prix TTC", font=bold, fill="#0B2545")
    draw.rectangle((910, 20, 930, 40), fill="#5B6573")
    draw.text((940, 16), "Moteur actuel", font=small, fill="#5B6573")
    draw.rectangle((1120, 20, 1140, 40), fill="#2E74B5")
    draw.text((1150, 16), "Méthode B calibrée", font=small, fill="#2E74B5")
    for tick in (0, 100, 200, 300, 400, 500):
        y = y_bottom - int(tick / max_value * chart_h)
        draw.line((90, y, 1425, y), fill="#E3E8EE", width=2)
        draw.text((25, y - 12), str(tick), font=small, fill="#5B6573")
    draw.line((90, y_top, 90, y_bottom), fill="#6D7885", width=2)
    draw.line((90, y_bottom, 1425, y_bottom), fill="#6D7885", width=2)
    group_width = 260
    for i, trip in enumerate(trips):
        x = 150 + i * group_width
        h_current = int(current[i] / max_value * chart_h)
        h_b = int(method_b[i] / max_value * chart_h)
        draw.rectangle((x, y_bottom - h_current, x + 68, y_bottom), fill="#5B6573")
        draw.rectangle((x + 82, y_bottom - h_b, x + 150, y_bottom), fill="#2E74B5")
        uplift = f"+{(method_b[i] - current[i]) / current[i] * 100:.0f}%"
        draw.text((x + 62, y_bottom - h_b - 28), uplift, font=bold, fill="#1F4D78")
        lines = trip.split("\n")
        for line_i, line in enumerate(lines):
            text_box = draw.textbbox((0, 0), line, font=small)
            text_w = text_box[2] - text_box[0]
            draw.text((x + 75 - text_w / 2, 515 + line_i * 24), line, font=small, fill="#0B2545")
    image.save(CHART_PATH)


def add_price_table(doc):
    headers = ["Trajet", "Actuel", "B", "Écart", "Pourquoi cela compte"]
    rows = [
        ["Genève Aéroport", "103,83 €", "161,40 €", "+55,5 %", "61 min aujourd'hui non valorisées"],
        ["Annecy", "144,48 €", "178,70 €", "+23,7 %", "Temps + retour progressif"],
        ["Chamonix", "83,22 €", "92,78 €", "+11,5 %", "Écart maîtrisé, cas montagne"],
        ["Lyon Part-Dieu", "392,60 €", "518,40 €", "+32,0 %", "3 h d'exploitation mieux couvertes"],
        ["Grenoble", "338,58 €", "447,42 €", "+32,1 %", "Longue distance et autoroute sécurisées"],
    ]
    table = doc.add_table(rows=1, cols=len(headers))
    set_table_geometry(table, [1650, 900, 900, 880, 5030])
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        set_cell_shading(cell, LIGHT_BLUE)
        set_cell_border(cell)
        write_cell(cell, header, 8.7, DARK_BLUE, True, WD_ALIGN_PARAGRAPH.CENTER if 0 < i < 4 else WD_ALIGN_PARAGRAPH.LEFT)
    for row in rows:
        cells = table.add_row().cells
        for i, text in enumerate(row):
            set_cell_shading(cells[i], WHITE)
            set_cell_border(cells[i])
            write_cell(cells[i], text, 8.4, NAVY, False, WD_ALIGN_PARAGRAPH.CENTER if 0 < i < 4 else WD_ALIGN_PARAGRAPH.LEFT)
    source = add_text(doc, "Hypothèse de calcul B : 0 € de prise en charge, 1,32 €/km, 1,20 €/min, retour progressif et péages de l'itinéraire. Les prix B augmenteraient du même montant si un frais de prise en charge était ajouté.", size=8.2, color=MUTED, italic=True, before=4, after=5)
    source.paragraph_format.keep_together = True


def page_break(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    create_chart()
    doc = Document()
    configure_document(doc)

    # Page 1 - decision opening
    add_text(doc, "NOTE DE DÉCISION PRODUIT", size=10, color=BLUE, bold=True, before=18, after=3)
    add_text(doc, "Pourquoi faire évoluer le moteur de prix VTC", size=26, color=NAVY, bold=True, before=0, after=6)
    add_text(doc, "Argumentaire marketing pour convaincre le Product Owner d'adopter un modèle hybride inspiré de la Méthode B améliorée.", size=13, color=MUTED, before=0, after=16)
    meta = doc.add_table(rows=3, cols=2)
    set_table_geometry(meta, [1500, 7860])
    for label, value, row in [
        ("Destinataire", "Product Owner / équipe produit", 0),
        ("Préparé par", "Équipe marketing", 1),
        ("Décision attendue", "Valider un moteur unique, explicable et rentable", 2),
    ]:
        set_cell_shading(meta.cell(row, 0), LIGHT_GRAY)
        set_cell_shading(meta.cell(row, 1), WHITE)
        set_cell_border(meta.cell(row, 0)); set_cell_border(meta.cell(row, 1))
        write_cell(meta.cell(row, 0), label, 9.5, DARK_BLUE, True)
        write_cell(meta.cell(row, 1), value, 9.5, NAVY)
    add_text(doc, "", after=4)
    add_metric_strip(doc)
    add_heading(doc, "La recommandation en une phrase", 1)
    add_callout(doc, "DÉCISION À PRENDRE", "Ne pas conserver le moteur actuel tel quel. Construire un modèle hybride : kilomètres + temps réel + retour progressif + frais exacts, dans une seule source de vérité.", fill="EAF3EE", label_color=GREEN)
    add_heading(doc, "Le message à porter", 2)
    add_text(doc, "Le sujet n'est pas “augmenter les prix”. Le sujet est d'arrêter de vendre des courses dont le prix ne reflète ni le temps immobilisé, ni les frais réels, ni la cohérence entre le devis et la réservation.", size=11, color=NAVY, before=0, after=8)
    add_bullet(doc, "Pour le client : un prix plus cohérent, explicable et ferme avant réservation.")
    add_bullet(doc, "Pour le chauffeur : une course rentable même quand l'axe est lent, chargé ou éloigné.")
    add_bullet(doc, "Pour le produit : une seule logique, testable, administrable et facturable sans écart.")
    page_break(doc)

    # Page 2 - compelling facts
    add_heading(doc, "Le problème actuel : trois prix possibles pour une même course", 1)
    add_text(doc, "Le risque n'est pas théorique. Le code actuel sépare le devis affiché, la réservation enregistrée et les paramètres administrables.", size=11, before=0, after=8)
    problem = doc.add_table(rows=1, cols=3)
    set_table_geometry(problem, [2450, 2800, 4110])
    for i, text in enumerate(["Étape", "Moteur utilisé", "Risque commercial"]):
        cell = problem.rows[0].cells[i]
        set_cell_shading(cell, LIGHT_BLUE); set_cell_border(cell)
        write_cell(cell, text, 9.2, DARK_BLUE, True)
    data = [
        ("Devis client", "Grille codée en dur", "Péage et attente peuvent être affichés."),
        ("Réservation", "Autre moteur, piloté par la base", "Péage et attente ne sont pas transmis au recalcul."),
        ("Admin", "Règles modifiables", "Une modification peut ne pas changer le devis public."),
    ]
    for row in data:
        cells = problem.add_row().cells
        for i, text in enumerate(row):
            set_cell_shading(cells[i], WHITE); set_cell_border(cells[i])
            write_cell(cells[i], text, 9.0, NAVY)
    add_text(doc, "Impact : le client voit une promesse de prix, mais le système ne garantit pas que la même logique survive jusqu'au devis final, au paiement et à la facture.", size=9.2, color=RED, bold=True, before=5, after=10)
    add_heading(doc, "Ce que le moteur actuel ne rémunère pas", 2)
    add_bullet(doc, "Le temps de conduite d'un transfert : une heure de bouchons, de frontière ou de route de montagne vaut 0 €.")
    add_bullet(doc, "Le coût de certains retours à vide et leurs péages, pourtant nécessaires pour remettre le véhicule à disposition.")
    add_bullet(doc, "Les réalités aéroport, montagne, attente, saison et suppléments, faute de règles unifiées.")
    add_callout(doc, "POINT À FAIRE COMPRENDRE AU PO", "La baisse du tarif CA à 0,70 €/km sur les longues distances n'est pas une stratégie de conversion : c'est une réduction automatique appliquée à tout le retour, sans contrôle de marge par heure ni par course.", fill="FFF6E7", label_color=GOLD)
    add_heading(doc, "Ce qui reste positif", 2)
    add_text(doc, "Le moteur connaît déjà le dépôt, le trajet client, le retour, le jour/nuit et le forfait local. La cible n'est donc pas une réécriture aveugle : c'est une unification et une mise à niveau des règles existantes.", size=10.6, after=4)
    page_break(doc)

    # Page 3 - proof / prices
    add_heading(doc, "Les chiffres : la Méthode B rétablit la valeur du temps", 1)
    add_text(doc, "Simulation tarif jour, aller simple au départ du dépôt de Cluses. Elle reprend les tarifs actuels pour ne pas comparer deux grilles arbitraires.", size=10.5, color=MUTED, before=0, after=6)
    add_price_table(doc)
    doc.add_picture(str(CHART_PATH), width=Inches(6.35))
    last = doc.paragraphs[-1]
    last.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(doc, "Lecture : l'écart provient d'abord des minutes qui sont aujourd'hui gratuites. Sur Lyon et Grenoble, le modèle actuel couvre mal le temps et le retour ; sur Chamonix, le changement reste commercialement modéré.", size=9.5, color=NAVY, before=4, after=6)
    add_callout(doc, "ANGLE MARKETING", "Un prix plus juste ne signifie pas un prix imprévisible. Avec un prix ferme affiché et une décomposition simple, la hausse est défendable : elle correspond à un service premium réellement disponible, pas seulement à des kilomètres.", fill="EAF3EE", label_color=GREEN)
    page_break(doc)

    # Page 4 - objections and response
    add_heading(doc, "Répondre aux objections avant qu'elles ne bloquent la décision", 1)
    objections = doc.add_table(rows=1, cols=2)
    set_table_geometry(objections, [3300, 6060])
    for i, text in enumerate(["Objection du Product Owner", "Réponse à utiliser"]):
        cell = objections.rows[0].cells[i]
        set_cell_shading(cell, LIGHT_BLUE); set_cell_border(cell)
        write_cell(cell, text, 9.5, DARK_BLUE, True)
    objections_data = [
        ("“Les prix vont monter.”", "Oui sur les courses longues ou lentes, là où le prix actuel ne paie pas le temps. Nous protégeons la conversion avec un prix ferme, des forfaits aéroport et un retour progressif plutôt qu'un retour facturé à 100 % partout."),
        ("“La formule B est trop complexe.”", "La complexité doit être dans le moteur, pas dans l'écran client. Le client voit 3 à 5 lignes claires : trajet, temps, retour, péages, suppléments."),
        ("“On peut simplement augmenter le €/km.”", "Non : cela sur-facturerait les trajets rapides tout en laissant les bouchons, la montagne et l'attente sans solution. Le temps est le bon signal économique."),
        ("“On risque de perdre Genève.”", "Créer un forfait aéroport ou un plafond commercial. La Méthode B devient le coût de référence ; l'offre commerciale est une décision explicite, pas une sous-facturation cachée."),
        ("“C'est un projet technique lourd.”", "Le chantier est ciblé : une fonction serveur unique, une configuration versionnée et une batterie de scénarios. Les segments et durées existent déjà."),
    ]
    for left, right in objections_data:
        cells = objections.add_row().cells
        for i, text in enumerate((left, right)):
            set_cell_shading(cells[i], WHITE); set_cell_border(cells[i])
            write_cell(cells[i], text, 8.7, NAVY, i == 0)
    add_heading(doc, "Le compromis à proposer", 2)
    add_text(doc, "Ne pas déployer une formule brute. Adopter la Méthode B comme socle économique, puis ajouter les garde-fous qui sécurisent la conversion et l'exploitation.", size=10.6, after=5)
    add_bullet(doc, "Frais de prise en charge, prix/km et prix/min configurables par plage horaire.")
    add_bullet(doc, "Retour 0 % / 30 % / 50 %, puis validation manuelle au-delà de 250 km.")
    add_bullet(doc, "Forfaits aéroport, supplément hiver/montagne et politique de péage explicite.")
    add_bullet(doc, "Marge plancher et validation humaine quand la course sort du cadre normal.")
    page_break(doc)

    # Page 5 - call to action
    add_heading(doc, "La demande au Product Owner", 1)
    add_callout(doc, "DÉCISION", "Valider le principe d'un moteur hybride unique. L'objectif du prochain sprint est de livrer un calcul identique sur le devis, la réservation, le paiement et la facture.", fill="EAF3EE", label_color=GREEN)
    add_heading(doc, "Plan de décision en 3 étapes", 2)
    steps = doc.add_table(rows=3, cols=2)
    set_table_geometry(steps, [1350, 8010])
    for i, (step, text) in enumerate([
        ("1. Cadrer", "Fixer les paramètres commerciaux : frais de prise en charge, €/km, €/min, forfaits aéroport, minimum, seuils retour et politique péages."),
        ("2. Unifier", "Remplacer les moteurs divergents par une API serveur unique et versionner chaque devis avec ses entrées routières et règles utilisées."),
        ("3. Prouver", "Tester jour/nuit, A/S/A/R, attente, péages et les cinq itinéraires Rhône-Alpes avant mise en production."),
    ]):
        set_cell_shading(steps.cell(i, 0), NAVY)
        set_cell_shading(steps.cell(i, 1), WHITE)
        set_cell_border(steps.cell(i, 0), NAVY, "0"); set_cell_border(steps.cell(i, 1))
        write_cell(steps.cell(i, 0), step, 10, WHITE, True, WD_ALIGN_PARAGRAPH.CENTER)
        write_cell(steps.cell(i, 1), text, 9.7, NAVY)
    add_heading(doc, "Phrase de clôture pour le rendez-vous", 2)
    quote = doc.add_table(rows=1, cols=1)
    set_table_geometry(quote, [CONTENT_DXA])
    cell = quote.cell(0, 0)
    set_cell_shading(cell, LIGHT_BLUE); set_cell_border(cell, "B7CAE0", "10")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_format(p, 2, 2, 1.20)
    r = p.add_run("« Nous ne demandons pas d'augmenter les prix. Nous demandons que le prix promis couvre réellement le service vendu, du premier kilomètre jusqu'au retour du véhicule. »")
    set_run_font(r, 14, NAVY, True, True)
    add_heading(doc, "Annexe - éléments de preuve", 2)
    add_text(doc, "Audit technique interne : `docs/AUDIT_TARIFICATION_VTC_2026-07-23.md`. Références routières consultées le 23 juillet 2026 : Mappy pour Annecy, Chamonix, Lyon et Grenoble. Les données de trafic, péages et itinéraires doivent être recalculées lors de la réservation.", size=8.5, color=MUTED, before=0, after=3)
    add_text(doc, f"Version marketing - {date(2026, 7, 23).strftime('%d/%m/%Y')}", size=8.5, color=MUTED, before=0, after=0)

    doc.core_properties.title = "Pourquoi faire évoluer le moteur de prix VTC"
    doc.core_properties.subject = "Argumentaire marketing - Méthode B améliorée"
    doc.core_properties.author = "MobiService VTC"
    doc.save(DOCX_PATH)
    print(DOCX_PATH)


if __name__ == "__main__":
    build()
