#!/usr/bin/env python3
"""Bouwt de IkBenMedia-website uit de map src/ naar gewone HTML-bestanden.

Gebruik:  python bouw.py

- Teksten staan in _bron/paginas/*.html. Bovenaan elk bestand staat een blok
  <!--meta ... --> met titel, omschrijving en (optioneel) veelgestelde vragen.
- De opmaak rond elke pagina (header, footer) staat in _bron/opmaak.html.
- Mappen die met _ beginnen, zet GitHub Pages niet online.
- Koppelt u later een eigen domein, verander dan alleen BASIS_URL hieronder
  en draai het script opnieuw.
"""
import hashlib
import html
import json
import re
from datetime import date
from pathlib import Path

BASIS_URL = "https://ischabiesbrouck.github.io/ikbenmedia/"

MAP = Path(__file__).resolve().parent
SRC = MAP / "_bron"

BEDRIJF = {
    "naam": "IkBenMedia",
    "eigenaar": "Ischa Biesbrouck",
    "slogan": "Projecten met een verhaal, ontwerp met een ziel.",
    "email": "info@ikbenmedia.nl",
    "telefoon": "+31628351290",
    "straat": "Rijnstraat 129",
    "postcode": "2025 RR",
    "plaats": "Haarlem",
}

NAVIGATIE = [
    ("Werk", "#werk", "werk"),
    ("Diensten", "diensten/", "diensten"),
    ("Over mij", "over-mij/", "over-mij"),
    ("Contact", "contact/", "contact"),
]

DIENSTEN = [
    ("Logo-ontwerp", "diensten/logo-ontwerp/"),
    ("Huisstijl", "diensten/huisstijl/"),
    ("Website laten maken", "diensten/website-laten-maken/"),
    ("Social media", "diensten/social-media/"),
    ("Drukwerk", "diensten/drukwerk/"),
    ("Videografie en advies", "diensten/videografie-en-advies/"),
]


def versie(pad):
    return hashlib.sha1((MAP / pad).read_bytes()).hexdigest()[:8]


def lees_pagina(bestand):
    tekst = bestand.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", tekst, re.S)
    if not m:
        raise SystemExit(f"{bestand.name}: meta-blok ontbreekt")
    meta = json.loads(m.group(1))
    meta["inhoud"] = tekst[m.end():]
    return meta


def faq_html(vragen):
    items = []
    for vraag, antwoord in vragen:
        items.append(
            '<details class="faq-item">'
            f'<summary><span>{html.escape(vraag)}</span><span class="faq-icoon" aria-hidden="true"></span></summary>'
            f'<div class="faq-antwoord"><p>{antwoord}</p></div>'
            "</details>"
        )
    return '<div class="faq">' + "".join(items) + "</div>"


def kruimelpad_html(kruimels, r):
    if not kruimels:
        return ""
    delen = [f'<li><a href="{r or "./"}">Home</a></li>']
    for naam, pad in kruimels:
        if pad:
            delen.append(f'<li><a href="{r}{pad}">{html.escape(naam)}</a></li>')
        else:
            delen.append(f'<li><span aria-current="page">{html.escape(naam)}</span></li>')
    return ('<nav class="kruimelpad wrap" aria-label="Kruimelpad"><ol>'
            + "".join(delen) + "</ol></nav>")


def structured_data(meta, url):
    b = BASIS_URL
    org = {
        "@type": "ProfessionalService",
        "@id": b + "#organisatie",
        "name": BEDRIJF["naam"],
        "alternateName": "IkBenMedia Intelligent Ontwerp",
        "description": "Grafisch ontwerpbureau in Haarlem voor logo-ontwerp, huisstijl, websites, social media, drukwerk en videografie.",
        "slogan": BEDRIJF["slogan"],
        "url": b,
        "logo": {"@type": "ImageObject", "url": b + "assets/img/logo-512.png", "width": 512, "height": 512},
        "image": b + "assets/img/og-ikbenmedia.jpg",
        "email": BEDRIJF["email"],
        "telephone": BEDRIJF["telefoon"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": BEDRIJF["straat"],
            "postalCode": BEDRIJF["postcode"],
            "addressLocality": BEDRIJF["plaats"],
            "addressRegion": "Noord-Holland",
            "addressCountry": "NL",
        },
        "areaServed": [
            {"@type": "City", "name": "Haarlem"},
            {"@type": "AdministrativeArea", "name": "Noord-Holland"},
            {"@type": "Country", "name": "Nederland"},
        ],
        "founder": {"@id": b + "#ischa"},
        "knowsAbout": ["Grafisch ontwerp", "Logo-ontwerp", "Huisstijl", "Webdesign",
                       "Social media", "Drukwerk", "Videografie"],
        "makesOffer": [
            {"@type": "Offer", "itemOffered": {"@id": b + pad + "#dienst"}} for _, pad in DIENSTEN
        ],
    }
    persoon = {
        "@type": "Person",
        "@id": b + "#ischa",
        "name": BEDRIJF["eigenaar"],
        "jobTitle": "Grafisch ontwerper",
        "worksFor": {"@id": b + "#organisatie"},
        "image": b + "assets/img/ischa-portret-854.webp",
        "url": b + "over-mij/",
    }
    website = {
        "@type": "WebSite",
        "@id": b + "#website",
        "url": b,
        "name": BEDRIJF["naam"],
        "inLanguage": "nl-NL",
        "publisher": {"@id": b + "#organisatie"},
    }
    pagina = {
        "@type": meta.get("paginatype", "WebPage"),
        "@id": url + "#webpagina",
        "url": url,
        "name": meta["titel"],
        "description": meta["omschrijving"],
        "isPartOf": {"@id": b + "#website"},
        "about": {"@id": b + "#organisatie"},
        "inLanguage": "nl-NL",
        "primaryImageOfPage": {"@type": "ImageObject", "url": b + "assets/img/og-ikbenmedia.jpg"},
    }
    graaf = [org, persoon, website, pagina]

    if meta.get("kruimels"):
        lijst = [{"@type": "ListItem", "position": 1, "name": "Home", "item": b}]
        for i, (naam, pad) in enumerate(meta["kruimels"], start=2):
            item = {"@type": "ListItem", "position": i, "name": naam}
            item["item"] = b + pad if pad else url
            lijst.append(item)
        graaf.append({"@type": "BreadcrumbList", "@id": url + "#kruimelpad", "itemListElement": lijst})
        pagina["breadcrumb"] = {"@id": url + "#kruimelpad"}

    if meta.get("dienst"):
        graaf.append({
            "@type": "Service",
            "@id": url + "#dienst",
            "name": meta["dienst"],
            "serviceType": meta["dienst"],
            "description": meta["omschrijving"],
            "provider": {"@id": b + "#organisatie"},
            "areaServed": {"@type": "City", "name": "Haarlem"},
            "url": url,
        })
        pagina["mainEntity"] = {"@id": url + "#dienst"}

    if meta.get("faq"):
        graaf.append({
            "@type": "FAQPage",
            "@id": url + "#faq",
            "mainEntity": [
                {"@type": "Question", "name": v,
                 "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
                for v, a in meta["faq"]
            ],
        })

    return json.dumps({"@context": "https://schema.org", "@graph": graaf},
                      ensure_ascii=False, indent=1)


def bouw():
    opmaak = (SRC / "opmaak.html").read_text(encoding="utf-8")
    css_v, js_v = versie("assets/css/style.css"), versie("assets/js/main.js")
    vandaag = date.today().isoformat()
    sitemap = []

    for bestand in sorted((SRC / "paginas").glob("*.html")):
        meta = lees_pagina(bestand)
        pad = meta["pad"]                         # bijv. "" of "diensten/huisstijl/"
        is_404 = bestand.stem == "404"
        r = BASIS_URL if is_404 else "../" * pad.count("/")
        url = BASIS_URL + pad

        inhoud = meta["inhoud"]
        if meta.get("faq"):
            inhoud = inhoud.replace("{{faq}}", faq_html(meta["faq"]))

        nav = []
        for naam, link, sleutel in NAVIGATIE:
            huidig = ' aria-current="page"' if meta.get("sectie") == sleutel else ""
            nav.append(f'<li><a href="{r}{link}"{huidig}>{naam}</a></li>')

        diensten_links = "".join(f'<li><a href="{r}{p}">{n}</a></li>' for n, p in DIENSTEN)

        vervang = {
            "titel": html.escape(meta["titel"]),
            "omschrijving": html.escape(meta["omschrijving"]),
            "canonical": url,
            "robots": "noindex" if is_404 else "index, follow, max-image-preview:large",
            "og_type": "website",
            "og_beeld": BASIS_URL + "assets/img/og-ikbenmedia.jpg",
            "jsonld": structured_data(meta, url),
            "nav": "".join(nav),
            "diensten_links": diensten_links,
            "kruimelpad": kruimelpad_html(meta.get("kruimels"), r),
            "body_klasse": meta.get("klasse", ""),
            "css_v": css_v,
            "js_v": js_v,
            "jaar": str(date.today().year),
        }
        pagina = opmaak
        for sleutel, waarde in vervang.items():
            pagina = pagina.replace("{{" + sleutel + "}}", waarde)
        pagina = pagina.replace("{{inhoud}}", inhoud.replace("{{r}}", r))
        pagina = pagina.replace("{{r}}", r)

        doel = MAP / ("404.html" if is_404 else pad + "index.html")
        doel.parent.mkdir(parents=True, exist_ok=True)
        doel.write_text(pagina, encoding="utf-8", newline="\n")
        print("gebouwd:", doel.relative_to(MAP))

        if not is_404:
            sitemap.append((url, meta.get("prioriteit", "0.7")))

    regels = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, prio in sitemap:
        regels.append(f"  <url><loc>{url}</loc><lastmod>{vandaag}</lastmod><priority>{prio}</priority></url>")
    regels.append("</urlset>")
    (MAP / "sitemap.xml").write_text("\n".join(regels) + "\n", encoding="utf-8", newline="\n")
    (MAP / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {BASIS_URL}sitemap.xml\n", encoding="utf-8", newline="\n")
    print("gebouwd: sitemap.xml, robots.txt")


if __name__ == "__main__":
    bouw()
