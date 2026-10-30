// Die Brille: ein 3D-Modell (Blender, models/brille.glb), das durch die Startseite begleitet.
//
// Aufbau: Die Brille liegt auf einer festen Ebene zwischen den Abschnittsfarben und dem Text.
// Wohin sie in welcher Passage gehört, bestimmen unsichtbare Anker im HTML (.anker[data-pose]):
// am Porträt, in den Wegweiser-Kreisen, hängend neben einem Titel oder über der Ecke einer Glaskarte.
// Während man eine Passage liest, bleibt sie an ihrem Anker und scrollt mit dem Inhalt.
// Erst wenn der nächste Anker ins Bild kommt, gleitet sie langsam dorthin.
//
// Die Gläser brechen die Farbe der Abschnitte hinter ihnen: Ein eigener Shader kennt die
// Abschnittsgrenzen und tastet sie leicht versetzt und farbgetrennt ab (Lichtbrechung).
//
// Schonend gebaut: three.js wird erst geladen, wenn die Seite steht und der Browser Zeit hat.
// Gezeichnet wird nur ein kleines Feld um die Brille (nicht der ganze Bildschirm), nur wenn
// sich etwas bewegt, und mit einem Material ohne Lichtberechnung (Matcap). Auf schwachen
// Geräten, im Datensparmodus oder wenn der Grafikkontext verloren geht, bleibt das Standbild.

let THREE;

const ebene = document.getElementById('brillen-ebene');
const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobil = window.matchMedia('(max-width: 640px)');

// Model width from outer ring to outer ring (Blender units), see brille_blender.py
const MODELL_BREITE = 4.7;
const LINSEN_ABSTAND = 2.44;   // distance between lens centres
const SCHARNIER_X = 2.471, SCHARNIER_Y = 0.46, SCHARNIER_Z = -0.14;   // hinge position (glTF, Y up)
const MAX_ABSCHNITTE = 12;

// Poses per anchor: rotation (rad), folded temples (0..1), opacity, gentle floating
// "vorne": the glasses are drawn above the content (only where they cover a portrait, never text);
// "durchL/durchR": that lens turns clear so the portrait shows through it.
// Between spots, when no spot is on screen, the glasses nest small at the screen edge.
const POSEN = {
  hero:     { rx: 0, ry: 0, rz: 0, falten: 0, schweben: 0.25, vorne: 1, durchL: 1, durchR: 1, buegel: 0 },
  linsen:   { rx: 0, ry: 0, rz: 0, falten: 0, schweben: 0 },
  haengen:  { rx: 0.12, ry: -0.5, rz: 0.16, falten: 0, schweben: 1 },
  oben:     { rx: 0.18, ry: -0.35, rz: -0.06, falten: 0, schweben: 1 },
  spaehen:  { rx: 0.42, ry: -0.3, rz: -0.1, falten: 0, schweben: 0.6 },
  kopf:     { rx: 0.35, ry: 0.1, rz: -0.14, falten: 0, schweben: 0.4, vorne: 1, durchL: 1, durchR: 1 },
  abgelegt: { rx: 1.05, ry: 0.3, rz: -0.12, falten: 1, schweben: 0 },
};
for (const pose of Object.values(POSEN)) {
  pose.vorne ??= 0; pose.durchL ??= 0; pose.durchR ??= 0; pose.buegel ??= 1; pose.deckkraft = 1;
}

function fallbackBild() {
  const buehne = document.querySelector('.brillen-buehne');
  if (!buehne || buehne.querySelector('img')) return;
  const img = new Image();
  img.src = 'Images/brille-standbild.png';
  img.alt = '';
  img.decoding = 'async';
  buehne.appendChild(img);
}

// Weak devices and data saver: keep the still image
function schwachesGeraet() {
  const n = navigator;
  return !!(n.connection?.saveData || (n.deviceMemory && n.deviceMemory <= 2) ||
    (n.hardwareConcurrency && n.hardwareConcurrency <= 2));
}

function webglVerfuegbar() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!ebene || ruhig || schwachesGeraet() || !webglVerfuegbar()) {
  fallbackBild();
} else {
  // The still image shows right away; it is swapped for the 3D glasses once they have drawn
  fallbackBild();
  // Start only once the page has loaded and the browser is idle
  const los = () => starten().catch(() => { ebene.innerHTML = ''; fallbackBild(); });
  const spaeter = () => ('requestIdleCallback' in window ? requestIdleCallback(los, { timeout: 1500 }) : setTimeout(los, 300));
  if (document.readyState === 'complete') spaeter(); else window.addEventListener('load', spaeter, { once: true });
}

// Matcap for the frame: a lacquered rust colour with a soft highlight, painted once into a small canvas.
// One texture lookup per pixel instead of a physically based material with an environment map.
function matcapTextur() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grund = g.createRadialGradient(52, 46, 4, 64, 64, 64);
  grund.addColorStop(0, '#ffb08a');
  grund.addColorStop(0.35, '#e0643a');
  grund.addColorStop(0.75, '#b8461f');
  grund.addColorStop(1, '#5e2010');
  g.fillStyle = grund;
  g.fillRect(0, 0, 128, 128);
  const glanz = g.createRadialGradient(44, 36, 0, 44, 36, 22);
  glanz.addColorStop(0, 'rgba(255,255,255,0.95)');
  glanz.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glanz;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

async function starten() {
  THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const leinwand = renderer.domElement;
  leinwand.style.position = 'absolute';
  leinwand.style.left = '0';
  leinwand.style.top = '0';
  leinwand.style.willChange = 'transform';
  leinwand.style.maxWidth = 'none';
  ebene.appendChild(leinwand);
  // Lost graphics context (memory pressure on phones): fall back to the still image
  leinwand.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    gestoppt = true;
    leinwand.remove();
    fallbackBild();
  });
  let gestoppt = false;

  const szene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(18, 1, 1, 20000);

  // ---------- Glass shader: refracts the section colours behind it ----------
  const abschnitte = { grenzen: [], farben: [] };
  for (let i = 0; i < MAX_ABSCHNITTE; i++) {
    abschnitte.grenzen.push(new THREE.Vector2(-1, -1));
    abschnitte.farben.push(new THREE.Vector3(1, 1, 1));
  }
  const glasUniforms = {
    uVersatz: { value: new THREE.Vector2(0, 0) },   // top left of the drawn tile in CSS px
    uKachel: { value: new THREE.Vector2(1, 1) },    // size of the drawn tile in CSS px
    uDpr: { value: 1 },
    uGrund: { value: new THREE.Vector3(0.949, 0.953, 0.937) },
    uGrenzen: { value: abschnitte.grenzen },
    uFarben: { value: abschnitte.farben },
    uAnzahl: { value: 0 },
    uStaerke: { value: 30 },
    uDeckkraft: { value: 1 },
  };

  function glasMaterial(muster) {
    return new THREE.ShaderMaterial({
      uniforms: { ...glasUniforms, uMuster: { value: muster }, uDurch: { value: 0 } },
      transparent: true,
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vSicht;
        varying vec2 vLokal;
        void main() {
          vLokal = position.xy;
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vSicht = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec2 uVersatz;
        uniform vec2 uKachel;
        uniform float uDpr;
        uniform vec3 uGrund;
        uniform vec2 uGrenzen[${MAX_ABSCHNITTE}];
        uniform vec3 uFarben[${MAX_ABSCHNITTE}];
        uniform int uAnzahl;
        uniform float uStaerke;
        uniform float uDeckkraft;
        uniform float uMuster;
        uniform float uDurch;
        varying vec3 vNormal;
        varying vec3 vSicht;
        varying vec2 vLokal;

        // Colour of the page behind a point (CSS pixels, y from the top)
        vec3 hintergrund(float y) {
          vec3 f = uGrund;
          for (int i = 0; i < ${MAX_ABSCHNITTE}; i++) {
            if (i >= uAnzahl) break;
            if (y >= uGrenzen[i].x && y < uGrenzen[i].y) f = uFarben[i];
          }
          return f;
        }

        float linie(float d, float breite) { return 1.0 - smoothstep(breite * 0.5, breite * 0.5 + 0.02, abs(d)); }

        void main() {
          vec3 n = normalize(vNormal);
          if (!gl_FrontFacing) n = -n;
          vec3 v = normalize(vSicht);
          float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.5);

          // y of this pixel on the screen (CSS px from the top); the canvas only covers a tile
          float y = uVersatz.y + uKachel.y - gl_FragCoord.y / uDpr;
          // Refraction: offset along the surface normal, split by colour (dispersion)
          float versatz = n.y * uStaerke;
          vec3 farbe = vec3(
            hintergrund(y - versatz * 0.80).r,
            hintergrund(y - versatz * 1.00).g,
            hintergrund(y - versatz * 1.25).b
          );
          // Lens pattern from the logo: waves on the left, sun over the horizon on the right
          vec3 bernstein = vec3(0.914, 0.659, 0.404);
          vec3 rost = vec3(0.722, 0.275, 0.122);
          float muster = 0.0;
          vec3 musterFarbe = bernstein;
          if (uMuster < 0.5) {
            for (int i = 0; i < 3; i++) {
              float yy = -0.45 + float(i) * 0.42 + 0.1 * sin(vLokal.x * 3.2 + float(i));
              muster = max(muster, linie(vLokal.y - yy, 0.09));
            }
          } else {
            // half sun resting on a horizon line
            float sonne = (1.0 - smoothstep(0.34, 0.36, length(vLokal - vec2(0.0, -0.24)))) * step(-0.24, vLokal.y);
            float horizont = linie(vLokal.y + 0.3, 0.07);
            muster = max(sonne, horizont);
            musterFarbe = mix(bernstein, rost, horizont);
          }
          farbe = mix(farbe, musterFarbe, muster * 0.22 * (1.0 - uDurch));
          // Glass: faint tint, light rim and a soft highlight
          farbe *= 0.985;
          vec3 l = normalize(vec3(-0.4, 0.9, 0.7));
          float glanz = pow(max(dot(reflect(-l, n), v), 0.0), 40.0);
          float licht = fresnel * 0.45 + glanz * 0.55;
          farbe += vec3(1.0) * licht;
          // Clear lens: only rim light and highlight remain, the content behind shows through
          float alpha = mix(1.0, clamp(0.05 + licht * 1.2, 0.0, 0.85), uDurch);
          farbe = mix(farbe, vec3(1.0), uDurch);
          gl_FragColor = vec4(farbe, alpha * uDeckkraft);
        }`,
    });
  }

  // ---------- Load the model ----------
  const gltf = await new GLTFLoader().loadAsync('models/brille.glb');
  const brille = new THREE.Group();
  const modell = gltf.scene;
  brille.add(modell);
  szene.add(brille);

  const rahmenMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTextur() });
  const buegel = {};
  const glaeser = {};
  modell.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.startsWith('Glas') || o.parent?.name?.startsWith('Glas')) {
      const name = o.name.startsWith('Glas') ? o.name : o.parent.name;
      o.material = glasMaterial(name.endsWith('_R') ? 1 : 0);
      glaeser[name.endsWith('_R') ? 'R' : 'L'] = o.material;
      o.renderOrder = 2;
    } else {
      o.material = rahmenMaterial;
    }
  });
  // Temples fold and grow around their hinge. The model is quantized (KHR_mesh_quantization),
  // which moves the node origins, so each temple is hung on its own pivot at the hinge.
  for (const [name, x] of [['Buegel_L', -SCHARNIER_X], ['Buegel_R', SCHARNIER_X]]) {
    const teil = modell.getObjectByName(name);
    if (!teil) continue;
    const gelenk = new THREE.Group();
    gelenk.position.set(x, SCHARNIER_Y, SCHARNIER_Z);
    modell.add(gelenk);
    modell.updateMatrixWorld(true);
    gelenk.attach(teil);
    buegel[name] = gelenk;
  }

  // ---------- Layout: anchors and sections ----------
  let anker = [];
  let breite = 1, hoehe = 1, dpr = 1;
  let kachelB = 0, kachelH = 0;     // current canvas size (CSS px)
  const flaechen = [...document.querySelectorAll('.flaeche, .fuss')];
  const farbe = new THREE.Color();
  let flaechenDaten = [];

  function istAktiv(el) {
    if (el.classList.contains('nur-desktop') && mobil.matches) return false;
    if (el.classList.contains('nur-mobil') && !mobil.matches) return false;
    return el.getClientRects().length > 0;
  }

  // Document positions of the anchors (only on resize / layout change)
  function vermessen() {
    breite = window.innerWidth;
    hoehe = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    kamera.aspect = breite / hoehe;
    kamera.position.set(0, 0, (hoehe / 2) / Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)));
    kamera.updateProjectionMatrix();
    glasUniforms.uDpr.value = dpr;
    glasUniforms.uStaerke.value = mobil.matches ? 18 : 30;
    kachelB = kachelH = 0;

    // Section colours: read once here, not in every frame
    const syF = window.scrollY;
    flaechenDaten = flaechen.map((el) => {
      const r = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      const wert = el.classList.contains('fuss') ? css.backgroundColor : css.getPropertyValue('--flaeche').trim();
      if (!wert) return null;
      farbe.set(wert);
      farbe.convertLinearToSRGB();
      return { oben: r.top + syF, unten: r.bottom + syF, r: farbe.r, g: farbe.g, b: farbe.b };
    }).filter(Boolean);

    const sy = window.scrollY;
    anker = [...document.querySelectorAll('.anker[data-pose]')].filter(istAktiv).map((el) => {
      const pose = POSEN[el.dataset.pose] || POSEN.haengen;
      const r = el.getBoundingClientRect();
      let x = r.left + r.width / 2;
      let y = r.top + sy + r.height / 2;
      let massstab = r.width / MODELL_BREITE;
      let drehung = 0;
      if (el.dataset.ziel) {
        // The right lens frames a round portrait
        const z = document.querySelector(el.dataset.ziel)?.getBoundingClientRect();
        if (z) {
          massstab = (z.width / 2) * 1.01;
          x = z.left + z.width / 2 - 1.22 * massstab;
          y = z.top + z.height / 2 + sy;
        }
      } else if (el.dataset.pose === 'linsen') {
        // Lenses sit exactly in the two circles; stacked on the phone, the glasses turn sideways
        const [a, b] = [...el.querySelectorAll('.linse')].map((l) => l.getBoundingClientRect());
        const dx = (b.left + b.right - a.left - a.right) / 2;
        const dy = (b.top + b.bottom - a.top - a.bottom) / 2;
        x = (a.left + a.right + b.left + b.right) / 4;
        y = (a.top + a.bottom + b.top + b.bottom) / 4 + sy;
        massstab = Math.hypot(dx, dy) / LINSEN_ABSTAND;
        drehung = Math.atan2(-dy, dx);
      }
      return { pose, x, y, massstab, drehung, oben: r.top + sy, unten: r.bottom + sy };
    }).sort((a, b) => a.oben - b.oben);
  }

  // Section colours behind the glasses, in screen coordinates (cheap: no layout reads)
  function abschnitteLesen(sy) {
    let n = 0;
    for (const f of flaechenDaten) {
      const oben = f.oben - sy, unten = f.unten - sy;
      if (unten < -200 || oben > hoehe + 200 || n >= MAX_ABSCHNITTE) continue;
      abschnitte.grenzen[n].set(oben, unten);
      abschnitte.farben[n].set(f.r, f.g, f.b);
      n++;
    }
    glasUniforms.uAnzahl.value = n;
  }
  const grund = new THREE.Color(getComputedStyle(document.body).backgroundColor).convertLinearToSRGB();
  glasUniforms.uGrund.value.set(grund.r, grund.g, grund.b);

  // ---------- Where the glasses belong right now ----------
  // A spot is either an anchor (moves with the page) or the dock at the screen edge (fixed on screen).
  // All positions are evaluated in screen coordinates every frame, so a glide always ends exactly on
  // its anchor even while the reader keeps scrolling.
  const WERTE = ['rx', 'ry', 'rz', 'falten', 'schweben', 'durchL', 'durchR', 'buegel', 'x', 'y', 'massstab'];
  const weich = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mischen = (a, b, t) => a + (b - a) * t;
  const NISTEN = { rx: 0.15, ry: -0.55, rz: 0.35, falten: 0, schweben: 1, vorne: 0, durchL: 0, durchR: 0, buegel: 1 };

  function kopfHoehe() {
    return document.getElementById('kopf')?.offsetHeight || 70;
  }

  // Resolves a spot to a full state in screen coordinates
  function aufloesen(spot, sy) {
    if (spot.art === 'anker') {
      const a = anker[spot.i];
      return { ...a.pose, rz: a.pose.rz + a.drehung, x: a.x, y: a.y - sy, massstab: a.massstab };
    }
    if (spot.art === 'nest') {
      const w = mobil.matches ? 60 : 96;
      const links = spot.seite === 'links';
      return {
        ...NISTEN,
        ry: links ? -NISTEN.ry : NISTEN.ry,
        rz: links ? -NISTEN.rz : NISTEN.rz,
        x: links ? w * 0.42 : breite - w * 0.42,
        y: hoehe * 0.42,
        massstab: w / MODELL_BREITE,
      };
    }
    return spot.stand;   // frozen point (a glide interrupted half way)
  }

  // The glasses accompany the reader only up to the last anchor (the Multispektive title).
  // From there on they stay put and scroll away with the page instead of following.
  function wunschSpot(sy) {
    let wahl = 0;
    anker.forEach((a, i) => {
      if (a.oben - sy <= hoehe * 0.8) wahl = i;
    });
    return { art: 'anker', i: wahl };
  }
  const gleich = (a, b) => a && b && a.art === b.art && a.i === b.i && a.seite === b.seite;

  let quelle = null;
  let ziel = null;
  let startZeit = 0;
  let dauer = 1;
  let momentan = null;

  function zustand(sy, jetzt) {
    if (!anker.length) return null;
    const wunsch = wunschSpot(sy);
    if (!ziel) {
      ziel = quelle = wunsch;
      startZeit = jetzt - 1e6;
    } else if (!gleich(wunsch, ziel)) {
      // New glide, starting from wherever the glasses are right now
      quelle = { art: 'punkt', stand: { ...momentan } };
      ziel = wunsch;
      const z = aufloesen(ziel, sy);
      const weg = Math.hypot(z.x - momentan.x, z.y - momentan.y);
      const zumNest = ziel.art === 'nest' || quelle.stand.nest;
      dauer = (zumNest ? 1100 : 1400 + Math.min(weg * 0.5, 900)) * (mobil.matches ? 1.15 : 1);
      startZeit = jetzt;
    }
    const a = aufloesen(quelle, sy);
    const b = aufloesen(ziel, sy);
    const roh = THREE.MathUtils.clamp((jetzt - startZeit) / dauer, 0, 1);
    const t = weich(roh);
    const p = {};
    for (const k of WERTE) p[k] = mischen(a[k] ?? 0, b[k] ?? 0, t);
    // Soft arc half way, so the glide reads as a movement, not a slide
    const bogen = Math.sin(Math.PI * t);
    p.ry += bogen * 0.3;
    p.rz += bogen * 0.06;
    p.fertig = roh >= 1;
    p.nest = ziel.art === 'nest' && p.fertig;
    // Glasses heading for a portrait fly in front from the start (no sudden pop);
    // leaving a portrait they drop behind the content right away
    p.vorne = !!b.vorne;
    p.imWegweiser = p.fertig && ziel.art === 'anker' && anker[ziel.i].pose === POSEN.linsen;
    momentan = p;
    return p;
  }

  // ---------- Render loop: draws only a tile around the glasses, only while something moves ----------
  let laeuft = false;
  let letzterScroll = 0;
  let zuletztSichtbar = true;
  let erstesBild = false;
  function bild(zeit) {
    laeuft = false;
    if (gestoppt) return;
    const sy = window.scrollY;
    const p = zustand(sy, zeit);
    if (!p) return;
    document.documentElement.classList.toggle('brille-im-wegweiser', !!p.imWegweiser);
    ebene.classList.toggle('vorne', p.vorne);
    const m = p.massstab;
    // Tile around the glasses: the front (4.7 x 2.3 units) plus whatever the temples
    // (3.5 units long) add when the glasses are turned (ry) or tilted (rx)
    const buegelB = 3.5 * p.buegel * Math.min(1, Math.abs(Math.sin(p.ry)) + 0.25);
    const buegelH = 3.5 * p.buegel * Math.min(1, Math.abs(Math.sin(p.rx)) + 0.3);
    const halbB = m * (2.5 + buegelB + Math.abs(p.rz) * 1.2) + 10;
    const halbH = m * (1.3 + buegelH + Math.abs(p.rz) * 2.2) + 10;
    const sichtbar = p.y + halbH > 0 && p.y - halbH < hoehe && p.x + halbB > 0 && p.x - halbB < breite;
    if (sichtbar !== zuletztSichtbar) {
      leinwand.style.display = sichtbar ? '' : 'none';
      zuletztSichtbar = sichtbar;
    }
    if (sichtbar) {
      // Resize the canvas only when the tile grows, or shrinks a lot
      const wB = Math.ceil(halbB * 2), wH = Math.ceil(halbH * 2);
      if (wB > kachelB || wH > kachelH || wB < kachelB * 0.6 || wH < kachelH * 0.6) {
        kachelB = Math.ceil(wB * 1.1);
        kachelH = Math.ceil(wH * 1.1);
        // Keep the drawing buffer modest on very large tiles
        // Upper limit for the drawing buffer: sharp on retina screens, still light on the GPU
        const grenze = mobil.matches ? 1.3e6 : 2.4e6;
        const pixel = kachelB * kachelH * dpr * dpr;
        renderer.setPixelRatio(pixel > grenze ? Math.sqrt(grenze / (kachelB * kachelH)) : dpr);
        glasUniforms.uDpr.value = renderer.getPixelRatio();
        renderer.setSize(kachelB, kachelH);
      }
      const links = Math.round(p.x - kachelB / 2);
      const oben = Math.round(p.y - kachelH / 2);
      leinwand.style.transform = `translate3d(${links}px, ${oben}px, 0)`;
      kamera.setViewOffset(breite, hoehe, links, oben, kachelB, kachelH);
      glasUniforms.uVersatz.value.set(links, oben);
      glasUniforms.uKachel.value.set(kachelB, kachelH);

      abschnitteLesen(sy);
      const s = zeit / 1000;
      // Phones: no idle floating, the glasses only move with the reader
      const welle = mobil.matches ? 0 : p.schweben;
      brille.position.set(p.x - breite / 2, -(p.y - hoehe / 2) + Math.sin(s * 0.9) * 4 * welle, 0);
      brille.scale.setScalar(m);
      const dreh = p.vorne ? 0 : welle;
      // gentle sway, like hanging on the title
      brille.rotation.set(p.rx + Math.sin(s * 0.7) * 0.03 * dreh, p.ry + Math.sin(s * 0.5) * 0.06 * dreh,
        p.rz + Math.sin(s * 1.1) * 0.035 * dreh);
      const winkel = p.falten * Math.PI * 0.47;
      // Temples grow out of the hinges once the glasses leave the portrait
      const laenge = Math.max(p.buegel, 0.001);
      if (buegel.Buegel_L) { buegel.Buegel_L.rotation.y = -winkel; buegel.Buegel_L.scale.setScalar(laenge); }
      if (buegel.Buegel_R) { buegel.Buegel_R.rotation.y = winkel; buegel.Buegel_R.scale.setScalar(laenge); }
      if (glaeser.L) glaeser.L.uniforms.uDurch.value = p.durchL;
      if (glaeser.R) glaeser.R.uniforms.uDurch.value = p.durchR;
      renderer.render(szene, kamera);
      if (!erstesBild) {
        erstesBild = true;
        document.querySelector('.brillen-buehne img')?.remove();
      }
    }
    if (document.hidden) return;
    if (!p.fertig || zeit - letzterScroll < 300) {
      anfordern();
    } else if (sichtbar && !mobil.matches && p.schweben > 0.01) {
      // Only floating on a laptop: 20 frames per second are enough
      setTimeout(anfordern, 50);
    }
  }
  function anfordern() {
    if (laeuft) return;
    laeuft = true;
    requestAnimationFrame(bild);
  }

  vermessen();
  anfordern();
  window.addEventListener('scroll', () => { letzterScroll = performance.now(); anfordern(); }, { passive: true });
  window.addEventListener('resize', () => { vermessen(); anfordern(); });
  mobil.addEventListener('change', () => { vermessen(); anfordern(); });
  document.addEventListener('visibilitychange', anfordern);
  // Fonts and late layout shifts move the anchors
  let messen = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(messen);
    messen = requestAnimationFrame(() => { vermessen(); anfordern(); });
  }).observe(document.body);
}
