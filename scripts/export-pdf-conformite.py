#!/usr/bin/env python3
"""Exporte les documents de conformite/ via le pipeline skill md-document.

Pipeline officiel (les scripts de la skill possèdent le rendu) :
    markdown_parser.py → html_renderer.py → interactivity_injector.py
puis conversion HTML → PDF avec WeasyPrint.

Sorties :
    conformite/html/                       (7 documents)
    conformite/pdf/                        (7 PDF)
    conformite/html/01-engagement-individuels/   (8 exemplaires)
    conformite/pdf/01-engagement-individuels/    (8 PDF)

Post-traitement léger : les champs à remplir [À COMPLÉTER…] sont entourés
d'une span .a-completer (surlignage) pour le repérage à l'impression.
"""
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

from weasyprint import HTML

RACINE = pathlib.Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "conformite"
SORTIE_HTML = DOSSIER / "html"
SORTIE_PDF = DOSSIER / "pdf"

SCRIPTS = pathlib.Path.home() / ".claude" / "skills" / "md-document" / "scripts"
PARSER = SCRIPTS / "markdown_parser.py"
RENDERER = SCRIPTS / "html_renderer.py"
INJECTOR = SCRIPTS / "interactivity_injector.py"

COMPLETER_RE = re.compile(r"(\[)([^][]*À COMPLÉTER[^][]*)(\])")

CSS_COMPLETER = """
<style>
.a-completer { background:#fdf3d7; border:1px solid #e6c98a; border-radius:3px;
               padding:0 4px; color:#7a5b16; white-space:nowrap; }
@media print { .a-completer { background:#fdf3d7 !important;
               -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
"""

MEMBRES = [
    ("YERIMA Thierry", "Développeur et architecte logiciel"),
    ("AGNILA Max", "Développeur et architecte logiciel"),
    ("KORE Ange", "Développeur et architecte logiciel"),
    ("CHOUCHOU Curie", "Analyste en sécurité (licence professionnelle en sécurité de l'information)"),
    ("ANAGONOU Richard", "Développeur, architecte logiciel et chargé du marketing"),
    ("CHABI MOUKA Merythe", "Management (licence professionnelle)"),
    ("TAIROU Wahab", "______________________"),
]


def run_pipeline(md_text: str, dest_html: pathlib.Path) -> str:
    """Parse + render + injecte la skill, retourne le HTML produit."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        md_file = tmp / "input.md"
        sections = tmp / "sections.json"
        html_file = tmp / "output.html"
        md_file.write_text(md_text, encoding="utf-8")

        subprocess.run(
            [sys.executable, str(PARSER), "--input", str(md_file), "--output", str(sections)],
            check=True, capture_output=True,
        )
        subprocess.run(
            [sys.executable, str(RENDERER), "--sections", str(sections), "--output", str(html_file)],
            check=True, capture_output=True,
        )
        subprocess.run(
            [sys.executable, str(INJECTOR), "--file", str(html_file),
             "--features", "search,smoothscroll,scrollspy"],
            check=True, capture_output=True,
        )
        html = html_file.read_text(encoding="utf-8")

    html = re.sub(r"<link[^>]*prism[^>]*>", "", html, flags=re.I)
    html = html.replace(CSS_COMPLETER, "")
    html = html.replace("</head>", CSS_COMPLETER + "</head>")
    html = COMPLETER_RE.sub(r'\1<span class="a-completer">\2</span>\3', html)

    dest_html.write_text(html, encoding="utf-8")
    return html


def exporter(md_path: pathlib.Path, dest_html: pathlib.Path, dest_pdf: pathlib.Path) -> None:
    texte = md_path.read_text(encoding="utf-8")
    html = run_pipeline(texte, dest_html)
    HTML(string=html, base_url=str(md_path.parent)).write_pdf(str(dest_pdf))


def engagement_individuel(md_path: pathlib.Path, nom: str, fonction: str) -> str:
    texte = md_path.read_text(encoding="utf-8")
    texte = texte.replace(
        "**YERIMA Thierry**, exerçant la fonction de **______________________**",
        f"**{nom}**, exerçant la fonction de **{fonction}**",
    )
    texte = re.sub(
        r"(\*\*Le signataire\*\*\n).*?\n(Signature :)",
        rf"\1{nom}\n\2",
        texte,
        count=1,
        flags=re.S,
    )
    texte = re.sub(
        r"## Liste des signataires.*$",
        "",
        texte,
        flags=re.S,
    )
    return texte


def main() -> None:
    SORTIE_HTML.mkdir(parents=True, exist_ok=True)
    SORTIE_PDF.mkdir(parents=True, exist_ok=True)

    documents = {
        "00-lettre-introductive": "00-lettre-introductive.md",
        "01-engagement-confidentialite": "01-engagement-confidentialite.md",
        "02-registre-traitements": "02-registre-traitements.md",
        "03-modele-consentement": "03-modele-consentement.md",
        "04-charte-securite": "04-charte-securite.md",
        "email-de-depot": "email-de-depot.md",
        "renseignements": "renseignements.md",
    }
    for nom, fichier in documents.items():
        exporter(
            DOSSIER / fichier,
            SORTIE_HTML / f"{nom}.html",
            SORTIE_PDF / f"{nom}.pdf",
        )
        print(f"OK  html+pdf  {nom}")

    engagement = DOSSIER / "01-engagement-confidentialite.md"
    for nom, fonction in MEMBRES:
        slib = "-".join(nom.split()[:2])
        base = f"01-engagement-{slib}"
        dest_html = SORTIE_HTML / "01-engagement-individuels" / f"{base}.html"
        dest_pdf = SORTIE_PDF / "01-engagement-individuels" / f"{base}.pdf"
        dest_html.parent.mkdir(parents=True, exist_ok=True)
        dest_pdf.parent.mkdir(parents=True, exist_ok=True)
        texte = engagement_individuel(engagement, nom, fonction)
        html = run_pipeline(texte, dest_html)
        HTML(string=html, base_url=str(engagement.parent)).write_pdf(str(dest_pdf))
        print(f"OK  html+pdf  {base}")


if __name__ == "__main__":
    sys.exit(main())