# multispektive.ch – Kontext für Claude Code

Website von **Soony Neudeck** (Coaching & Training, Riehen/Basel und online), Marke **Multispektive**.
Statische Seite, gehostet über **GitHub Pages** aus `main` → Ordner `docs/` (`docs/CNAME` = www.multispektive.ch).
Projektinhaber im Chat ist **Mika oder Arthur**. Kommunikation **auf Deutsch**.

## Arbeitsweise mit Mika

- **Nie selbst committen oder pushen.** Mika committet in IntelliJ.
- Es gibt zwei Ordner mit identischem `docs/`:
  - **IntelliJ / Git (massgeblich):** `/Users/mikaneudeck/IdeaProjects/multispektive.gitghub.io`
  - **Arbeitsordner (ZIP-Kopie, kein Git):** `~/Documents/Dokumente – MacBook Pro von Mika/Projekte/Mama Website/multispektive.gitghub.io-main`
    Enthält zusätzlich `tools/brille_blender.py`, `PLAN.md`, `FOTO-BRIEFING.md`.
  - Wenn in einem Ordner geändert wird, `docs/` danach in den anderen spiegeln
    (`rsync -a --exclude .DS_Store <quelle>/docs/ <ziel>/docs/`) und mit `diff -rq` bestätigen.
- **Pfad-Falle:** Im Arbeitsordner steht vor dem Gedankenstrich in „Dokumente – MacBook“ ein **geschütztes
  Leerzeichen (U+00A0)**. Ein getippter Pfad mit normalem Leerzeichen legt einen falschen neuen Ordner an.
  Dort per Bash mit `$PWD` bzw. relativen Pfaden arbeiten.
- Vor grösseren Umbauten kurz planen und bei echten Geschmacksfragen nachfragen. Ergebnisse immer mit
  Screenshots prüfen (siehe „Testen“) und ehrlich sagen, was nicht getestet werden konnte (z. B. echtes iPhone).

## Inhaltliche Regeln (wichtigste Korrekturen von Mika)

- **Bestehenden Text nie umschreiben.** Verschieben, neu anordnen und *ergänzen* ist erlaubt.
  Nach jedem Umbau prüfen, dass jeder Satz noch wortgleich vorhanden ist.
- Quellen für Ergänzungen: `concept/Content Sept.2026_V1.docx` hat Vorrang; aus `Content Juli2026.docx`
  nur Listen, die im Sept.-Text fehlen (Coachingthemen, Kernkompetenzen, Workshops); `docs/products/*.html`.
- **Durchgehend „ss“ statt „ß“** (Schweiz).
- Ansprache: Du-Form. Ausnahme `products/` (alte Texte in Sie-Form, unverändert).
- Nicht veröffentlicht, nur als HTML-Kommentar erhalten: unfertige Fallbeispiele (Right-Placement) und
  Seminardaten 2019 (Preis/Ort/Uhrzeit).
- Nichts erfinden: Ablauf/Dauer, Preise, Ort, Stimmen fehlen in allen Quellen → sichtbare Platzhalter
  (`.platzhalter`, Abschnitt `#ablauf`) bis die Coachin liefert.
- Fotos: unscharfe oder rein dekorative Bilder von der Seite nehmen, aber in `docs/Images/` lassen.
  Neue Fotos kommen aus einem Shooting (`FOTO-BRIEFING.md`), bis dahin Platzhalter `.foto` mit `.foto__hinweis`.
  Hero: **Foto 1a + 1b** (zwei Perspektiven) in den beiden Brillengläsern; aktuell `Soony_Titelbild.jpeg`
  (nur 320 px, unscharf) und `Soony_Neudeck_Front.jpeg`.
- E-Mail nie im Klartext ins HTML/JSON-LD (Schutz über `.js-email` in `script.js`).

## Gestaltung: „Lichtbrechung“

Idee: Multi-*spektive* ↔ *Spektrum*. Weisses Licht fällt durch Glas und zerfällt in Farben –
nie nur eine Perspektive auf einen Menschen. Die Logo-Brille (zwei verschiedene Gläser) ist das Leitmotiv.

- Farben (`:root` in `style.css`): Glas `#f2f3ef` (Hintergrund), Tinte `#2a2030` (Text/dunkle Flächen = Aubergine),
  Rost `#b8461f` (nur Buttons/Links), Salbei `#8e9b88`, Bernstein `#e9a867`, Spektrum `--spektrum-1…6`.
- Schriften lokal (`fonts.css`, `docs/fonts/`): **Gloock** (Überschriften), **Figtree** (Text). Keine Google-Server.
- **Startseite: nur zwei Hintergründe**, hart im Wechsel: hell ↔ Aubergine
  (Hero/Wegweiser hell → Multispektive dunkel → Kennst du das hell → Für Frauen dunkel → Junge Erwachsene hell →
  Training dunkel → Über mich hell → Kontakt dunkel). Dunkle Abschnitte: `.abschnitt--dunkel.flaeche`.
- **Über mich** (`body.seite-ueber`): leicht salbeigrüner heller Grund, zweite Farbe ebenfalls Aubergine.
- **Nichts klebt beim Scrollen mit** (kein `position: sticky` ausser der Kopfzeile).
- Grafiken stehen fest neben ihrem Text; lange Passagen **abwechselnd** Text | Grafik (`.passage`,
  `.passage--umgekehrt`, `.passage--karte` für Glaskarte links). Jede Passage hat eine eigene, inhaltlich
  passende SVG-Grafik – kein leerer Raum neben Text.
- Liquid Glass nur, wo es Bedeutung hat (`.glas`: Wegweiser-Linsen, Zitatkarten, Formular, Themen-Chips).
  Glasrand um die Hero-Fotos: sehr dünn, fest im Verhältnis zur Brille (`--rand-glas: 0.7cqi`).
- Vermeiden: Labels in Grossbuchstaben, Karten mit grauem Schatten, viele verstreute Effekte.
  Barrierefreiheit: sichtbarer Fokus, `prefers-reduced-motion` respektiert, Kontrast.

## Bewegung

- **Grafik-Animationen**: einmalig beim Erscheinen. `script.js` setzt `html.anim` und `.zeigen` auf `.auftritt`
  (IntersectionObserver). Bausteine in CSS: `.zeichnen` (Linie wird gezeichnet, Länge `--l` per JS),
  `.einblenden` (`--dx/--dy/--s/--v/--o`), `.spaet`, `.faecher-blatt` (`--w`). Ohne JS/bei reduzierter
  Bewegung ist der Endzustand sichtbar.
- **Seitenwechsel**: sechs Spektralbänder fallen über die Seite und heben sich auf der neuen Seite wieder ab
  (`.lichtwechsel` in `script.js`/`style.css`; Kopfskript in jeder Seite setzt `html.lichtwechsel-ankunft`).

## Die 3D-Brille (`docs/brille.js`, three.js 0.170 lokal in `docs/vendor/`, Import-Map im `<head>`)

- Modell `docs/models/brille.glb` aus **Blender** (`tools/brille_blender.py` im Arbeitsordner, Blender 5.1:
  `/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/brille_blender.py -- out.glb vorschau.png`),
  danach komprimiert: `npx @gltf-transform/cli quantize out.glb docs/models/brille.glb` (~300 KB).
  Durch die Quantisierung verschieben sich Knoten-Ursprünge → in `brille.js` hängen die Bügel an
  Gelenk-Gruppen am Scharnier (`SCHARNIER_X/Y/Z`). Nicht entfernen.
- Positionen über unsichtbare Anker im HTML: `.anker[data-pose]` (Posen in `POSEN`).
  - **Startseite:** Hero (beide Gläser rahmen Foto 1a/1b, `data-ziel=".hero-foto--rechts"`) → Gläser rasten in die
    zwei Wegweiser-Kreise ein → hängt am Titel „Es gibt nie nur eine Wahrheit …“ und **bleibt dort**.
  - **Über mich:** über dem Titel „Soony Neudeck“ → hängt an „Warum ich Menschen begleite“ und bleibt.
  - Danach folgt sie **nicht** weiter (Mika fand das Mitfolgen stressig). Sie darf nie Text verdecken.
- Gläser: eigener Shader bricht die Abschnittsfarben dahinter (Farbsäume); Gestell: Matcap-Material.
- **Ressourcen schonen** (Seite war auf dem Handy abgestürzt): three.js erst nach `load`/Leerlauf laden;
  nur eine kleine Kachel um die Brille zeichnen (`setViewOffset`), nicht den ganzen Bildschirm; nur zeichnen,
  wenn sich etwas bewegt; Handy ohne Dauer-Schweben; Pixel-Obergrenze; Standbild `Images/brille-standbild.png`
  bei schwachen Geräten, Datensparmodus, reduzierter Bewegung oder verlorenem WebGL-Kontext.
  Auf dem Handy muss die Hero-Brille beim Öffnen vollständig mit beiden Fotos sichtbar sein.

## Dateien

- `docs/index.html` Startseite · `docs/ueber-mich.html` · `docs/impressum.html` · `docs/datenschutz.html`
  · `docs/products/right-placement.html`, `open-class-2019.html` (verlinkt aus „Training & Workshops“) · `docs/404.html`
- `docs/style.css` (alles CSS), `docs/script.js` (Menü, Kopfzeile, E-Mail-Schutz, Formspree-Formular,
  Grafik-Animationen, Seitenwechsel), `docs/brille.js`
- SEO: Open-Graph-Bild `Images/og-bild.jpg`, Icons, JSON-LD (ohne E-Mail) auf der Startseite,
  `sitemap.xml`, `robots.txt`. IntelliJ kennt das Sitemap-Schema über `.idea/schemas/sitemap.xsd` + `.idea/misc.xml`.
- Kontaktformular: Formspree `https://formspree.io/f/xqpeqdnp` (in Datenschutzerklärung erwähnt).
- Kein Build-Schritt, keine externen Server zur Laufzeit (Datenschutz CH/EU).

## Testen

- Lokal: `cd docs && python3 -m http.server 8765` → http://localhost:8765
- Screenshots: `puppeteer-core` (in einem Temp-Ordner installieren) mit
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, headless. Laptop 1440×900, Handy 390×844
  (auch 360/430). Bei Animationen und Brillen-Übergängen 3–4 s warten. Achtung: `clip` in Puppeteer ist in
  Dokument-Koordinaten (`+ scrollY`).
- Nach Textumbauten: alle Sätze der vorherigen Version gegen die neue prüfen (HTML entfernen, `ß→ss` normalisieren).
- Bekannte CSS-Falle: `grid-area`-Regeln nur auf direkte Kinder (`.kapitel > .kapitel__kopf`), sonst
  zerschiessen sie andere Grids.

## Offen

- Fotoshooting (Foto 1a/1b, 2, 3, 4 laut `FOTO-BRIEFING.md`), danach Bilder in mehreren Grössen einsetzen.
- Inhalte von der Coachin für Ablauf/Dauer, Preise, Stimmen – vorher Platzhalter nicht live lassen
  oder ausblenden.
- Test auf echtem iPhone (Safari) durch Mika.
