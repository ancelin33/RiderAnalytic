import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Radio,
  Trophy,
  Map as MapIcon,
  Palette,
  Activity,
  ListChecks,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS — neon CRT arcade cabinet
--------------------------------------------------------- */
const C = {
  crt: "#1a1330",
  screen: "#241c40",
  panel: "#2a2050",
  panelLine: "#4a3d7a",
  cyan: "#00d4c8",
  magenta: "#ff3d81",
  yellow: "#ffd23f",
  green: "#8affc1",
  orange: "#ff7a1f",
  text: "#fdf6ec",
  textDim: "#6b5f99",
  danger: "#ff5470",
};

const FONT_LINK_ID = "arcade-fonts";
function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
    document.head.appendChild(link);
  }, []);
}

const DISPLAY_FONT = "'Arial Black', Arial, sans-serif";
const MONO_FONT = "'Share Tech Mono', monospace";

/* ---------------------------------------------------------
   TRICK DEFINITIONS
--------------------------------------------------------- */
const TRICKS = [
  { name: "Ollie", baseScore: 50, minAir: 150, category: "figure" },
  { name: "Nollie", baseScore: 65, minAir: 160, category: "figure" },
  { name: "Kickflip", baseScore: 85, minAir: 220, category: "figure" },
  { name: "Heelflip", baseScore: 85, minAir: 220, category: "figure" },
  { name: "Varial Kickflip", baseScore: 110, minAir: 250, category: "figure" },
  { name: "Hardflip", baseScore: 135, minAir: 270, category: "figure" },
  { name: "Impossible", baseScore: 140, minAir: 280, category: "figure" },
  { name: "Shove-it", baseScore: 60, minAir: 180, category: "figure" },
  { name: "360 Flip", baseScore: 160, minAir: 320, category: "figure" },
  { name: "Frontside 180", baseScore: 70, minAir: 190, category: "figure" },
  { name: "Backside 180", baseScore: 70, minAir: 190, category: "figure" },
  { name: "Manual", baseScore: 45, minAir: 0, category: "figure" },
  { name: "Nose Manual", baseScore: 55, minAir: 0, category: "figure" },
  { name: "Boardslide", baseScore: 115, minAir: 0, category: "slide" },
  { name: "Noseslide", baseScore: 110, minAir: 0, category: "slide" },
  { name: "Tailslide", baseScore: 120, minAir: 0, category: "slide" },
  { name: "50-50 Grind", baseScore: 100, minAir: 0, category: "grind" },
  { name: "Nosegrind", baseScore: 120, minAir: 0, category: "grind" },
  { name: "Smith Grind", baseScore: 130, minAir: 0, category: "grind" },
  { name: "Crooked Grind", baseScore: 125, minAir: 0, category: "grind" },
  { name: "Feeble Grind", baseScore: 118, minAir: 0, category: "grind" },
];

const TRICK_CATEGORIES = [
  { id: "figure", label: "FIGURES", color: C.yellow },
  { id: "slide", label: "SLIDES", color: C.cyan },
  { id: "grind", label: "GRINDS", color: C.magenta },
  { id: "combo", label: "COMBOS", color: C.green },
];

// deterministic pseudo-random so a bot's generated library stays stable across renders
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function nameSeed(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h || 1;
}
function generateBotLibrary(bot) {
  const rand = seededRandom(nameSeed(bot.name));
  return TRICKS.map((t) => {
    const attempted = rand() > 0.3;
    const landed = attempted ? Math.floor(rand() * 140) + 1 : 0;
    const variance = 0.6 + rand() * 0.4;
    const best = landed ? Math.round(t.baseScore * variance) : 0;
    return { name: t.name, category: t.category, landed, best };
  }).map((entry) =>
    entry.name === bot.bestTrick.name
      ? { ...entry, landed: Math.max(entry.landed, 14), best: bot.bestTrick.score }
      : entry
  );
}

const NATIONS = [
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "SE", name: "Suede", flag: "🇸🇪" },
];

function attemptTrick() {
  const trick = TRICKS[Math.floor(Math.random() * TRICKS.length)];
  const isGroundTrick = trick.category === "slide" || trick.category === "grind";
  const clean = 0.35 + Math.random() * 0.65;
  const airtime = isGroundTrick
    ? Math.round(400 + Math.random() * 1400)
    : Math.round(trick.minAir * (0.65 + Math.random() * 0.7));
  const rotationDeg = Math.round(180 + Math.random() * 540);
  const validated = isGroundTrick ? clean > 0.5 && airtime > 250 : clean > 0.55 && airtime >= trick.minAir * 0.75;
  const score = validated ? Math.round(trick.baseScore * clean) : 0;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trick.name,
    category: trick.category,
    clean,
    airtime,
    rotationDeg,
    validated,
    score,
    t: Date.now(),
  };
}

/* ---------------------------------------------------------
   CUSTOMIZATION OPTIONS — named items like the arcade UI
--------------------------------------------------------- */
const DECKS = [
  { name: "NO LIMIT SKATE (SKULL)", color: "#ff2fd6" },
  { name: "TOXIC VOLT", color: "#39ff6a" },
  { name: "ELECTRIC BLUE", color: "#1fe6ff" },
  { name: "INFERNO", color: "#ff7a1f" },
  { name: "BONE WHITE", color: "#e7e7e7" },
];
const WHEELS = [
  { name: "SPOILER", color: "#2a2a33" },
  { name: "GHOST", color: "#e7e7e7" },
  { name: "SKATE GOAT", color: "#39ff6a" },
  { name: "HAZARD", color: "#fff200" },
];
const GRIPS = [
  { name: "BLACKOUT", color: "#111318" },
  { name: "RIOT PINK", color: "#ff2fd6" },
  { name: "VOLT", color: "#1fe6ff" },
];
const SHIRTS = [
  { name: "GRAPHIC ORANGE", color: "#ff7a1f" },
  { name: "RIOT PINK", color: "#ff2fd6" },
  { name: "VOLT CYAN", color: "#1fe6ff" },
  { name: "ACID GREEN", color: "#39ff6a" },
];
const PANTS = [
  { name: "BAGGY NOIR", color: "#26262e" },
  { name: "DENIM DELAVE", color: "#4a5a7a" },
  { name: "CARGO KAKI", color: "#6b6a4f" },
  { name: "RIOT PINK", color: "#7a2f52" },
];
const TRUCKS = [
  { name: "SILVER", color: "#8a8a9a" },
  { name: "BLACK OPS", color: "#2a2a2e" },
  { name: "GOLD RUSH", color: "#c9a227" },
  { name: "VOLT", color: "#1fe6ff" },
];
const SKIN_TONES = [
  { name: "CLAIR", color: "#f0c9a0" },
  { name: "MEDIUM", color: "#e0ad81" },
  { name: "HALE", color: "#c78a56" },
  { name: "FONCE", color: "#8a5a36" },
  { name: "TRES FONCE", color: "#5a3a24" },
];
const HAIR_COLORS = [
  { name: "BRUN", color: "#20160f" },
  { name: "BLOND", color: "#d9b45a" },
  { name: "ROUX", color: "#a1502e" },
  { name: "NOIR", color: "#0d0a08" },
  { name: "ROSE FLASH", color: "#ff2fd6" },
  { name: "VOLT", color: "#1fe6ff" },
];
const HAIRSTYLES = [
  { id: "court", name: "COURT", color: "#8a7a68" },
  { id: "buzz", name: "BUZZ CUT", color: "#6b5d4f" },
  { id: "long", name: "LONGS", color: "#a08b6f" },
  { id: "mohawk", name: "MOHAWK", color: "#ff4b1f" },
  { id: "casquette", name: "CASQUETTE", color: "#2a2a2e" },
  { id: "bonnet", name: "BONNET", color: "#1fe6ff" },
  { id: "chauve", name: "CHAUVE", color: "#e0ad81" },
];
const SHOES = [
  { name: "BLACKOUT", color: "#151515" },
  { name: "BONE WHITE", color: "#e7e7e7" },
  { name: "RIOT PINK", color: "#ff2fd6" },
  { name: "VOLT", color: "#1fe6ff" },
];

/* ---------------------------------------------------------
   TRICK ILLUSTRATIONS — original line-art (no scraped photos)
--------------------------------------------------------- */
function getMasteryLevel(landed) {
  if (!landed) return null;
  if (landed <= 10) return { label: "1ST TIME", color: C.cyan };
  if (landed <= 50) return { label: "INTERMEDIAIRE", color: C.green };
  if (landed <= 100) return { label: "VETERAN", color: C.magenta };
  return { label: "MAITRISE ULTIME", color: C.yellow };
}

function TrickIcon({ category, accent = C.cyan, size = 56 }) {
  const isGroundTrick = category === "slide" || category === "grind";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect x="0" y="0" width="100" height="100" rx="6" fill="#0a0e24" />
      {/* head */}
      <circle cx="50" cy="26" r="8" fill="none" stroke={C.text} strokeWidth="3" />
      {/* torso */}
      <line x1="50" y1="34" x2="47" y2="56" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
      {/* arms out for balance */}
      <line x1="47" y1="40" x2="28" y2="34" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
      <line x1="47" y1="40" x2="70" y2="30" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
      {isGroundTrick ? (
        <>
          {/* bent legs standing sideways on a rail/ledge */}
          <line x1="47" y1="56" x2="35" y2="66" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="47" y1="56" x2="60" y2="64" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="66" x2="30" y2="70" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="64" x2="66" y2="70" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          {/* rail — thicker/rounder for slide (ledge), thinner for grind (rail) */}
          <line
            x1="10"
            y1="72"
            x2="90"
            y2="72"
            stroke={accent}
            strokeWidth={category === "slide" ? 7 : 4}
            strokeLinecap={category === "slide" ? "square" : "round"}
          />
          <line x1="18" y1="72" x2="18" y2="80" stroke={accent} strokeWidth="3" />
          <line x1="82" y1="72" x2="82" y2="80" stroke={accent} strokeWidth="3" />
        </>
      ) : (
        <>
          {/* crouched legs mid-air */}
          <line x1="47" y1="56" x2="34" y2="62" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="47" y1="56" x2="58" y2="63" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="62" x2="30" y2="55" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <line x1="58" y1="63" x2="63" y2="56" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          {/* board separated below, mid-flip */}
          <rect x="18" y="76" width="44" height="6" rx="3" fill={accent} transform="rotate(-18 40 79)" />
          {/* rotation arrow */}
          <path
            d="M 68 72 A 14 14 0 1 1 66 58"
            fill="none"
            stroke={C.yellow}
            strokeWidth="3"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={C.yellow} />
            </marker>
          </defs>
        </>
      )}
      {category === "combo" && (
        <circle cx="82" cy="18" r="10" fill={accent} stroke="#0a0e24" strokeWidth="2" />
      )}
      {category === "combo" && (
        <text x="82" y="23" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0a0e24">
          +
        </text>
      )}
    </svg>
  );
}


function makeFaceTexture(skinColor) {
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = 128;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 128, 128);
  // brows only — eyes, nose, mouth and ears are real 3D geometry now
  ctx.strokeStyle = "#3a2416";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, 46);
  ctx.lineTo(56, 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(72, 44);
  ctx.lineTo(92, 46);
  ctx.stroke();
  return new THREE.CanvasTexture(cnv);
}

function makeDeckGeometry(width, length, thickness, radius) {
  const w = width / 2;
  const l = length / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -l + radius);
  shape.lineTo(-w, l - radius);
  shape.quadraticCurveTo(-w, l, -w + radius, l);
  shape.lineTo(w - radius, l);
  shape.quadraticCurveTo(w, l, w, l - radius);
  shape.lineTo(w, -l + radius);
  shape.quadraticCurveTo(w, -l, w - radius, -l);
  shape.lineTo(-w + radius, -l);
  shape.quadraticCurveTo(-w, -l, -w, -l + radius);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);
  return geo;
}

function makeRoundedBoxGeometry(width, depth, height, radius) {
  const w = width / 2;
  const d = depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -d + radius);
  shape.lineTo(-w, d - radius);
  shape.quadraticCurveTo(-w, d, -w + radius, d);
  shape.lineTo(w - radius, d);
  shape.quadraticCurveTo(w, d, w, d - radius);
  shape.lineTo(w, -d + radius);
  shape.quadraticCurveTo(w, -d, w - radius, -d);
  shape.lineTo(-w + radius, -d);
  shape.quadraticCurveTo(-w, -d, -w, -d + radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -height / 2, 0);
  return geo;
}

function addHairstyle(hips, style, hairMat, shadowAll) {
  if (style === "chauve") return; // no hair mesh at all

  if (style === "buzz") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), hairMat));
    cap.position.set(0, 0.465, 0.015);
    hips.add(cap);
    return;
  }

  if (style === "long") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.083, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat));
    cap.position.set(0, 0.465, 0.015);
    hips.add(cap);
    const back = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.17, 0.045), hairMat));
    back.position.set(0, 0.36, -0.05);
    hips.add(back);
    return;
  }

  if (style === "mohawk") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.079, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.32), hairMat));
    cap.position.set(0, 0.472, 0.015);
    hips.add(cap);
    const ridge = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.075, 0.13), hairMat));
    ridge.position.set(0, 0.535, 0.02);
    hips.add(ridge);
    return;
  }

  if (style === "casquette") {
    const dome = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.086, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat));
    dome.position.set(0, 0.468, 0.015);
    hips.add(dome);
    const brim = shadowAll(
      new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7), hairMat)
    );
    brim.rotation.x = Math.PI / 2;
    brim.position.set(0, 0.432, 0.088);
    hips.add(brim);
    return;
  }

  if (style === "bonnet") {
    const dome = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat));
    dome.position.set(0, 0.46, 0.015);
    hips.add(dome);
    const brimRing = shadowAll(new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.012, 8, 20), hairMat));
    brimRing.rotation.x = Math.PI / 2;
    brimRing.position.set(0, 0.408, 0.015);
    hips.add(brimRing);
    return;
  }

  // "court" (default) — short cropped hair
  const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat));
  cap.position.set(0, 0.465, 0.015);
  hips.add(cap);
}

function buildSkateRig(custom, stance = "regular") {
  const group = new THREE.Group();
  const shadowAll = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const board = new THREE.Group();
  // board kept at its original orientation, nudged forward so it sits under the front
  // (weight-bearing) foot instead of the leg's lean pushing that foot past the nose
  board.position.z = 0;
  group.add(board);

  const deckMat = new THREE.MeshStandardMaterial({ color: custom.deck, roughness: 0.5, emissive: custom.deck, emissiveIntensity: 0.1 });
  const deck = shadowAll(new THREE.Mesh(makeDeckGeometry(0.22, 0.9, 0.03, 0.09), deckMat));
  deck.position.y = 0.06;
  board.add(deck);

  const grip = shadowAll(
    new THREE.Mesh(makeDeckGeometry(0.215, 0.89, 0.006, 0.088), new THREE.MeshStandardMaterial({ color: custom.grip, roughness: 0.95 }))
  );
  grip.position.y = 0.077;
  board.add(grip);

  const wheelMat = new THREE.MeshStandardMaterial({ color: custom.wheels, roughness: 0.3, emissive: custom.wheels, emissiveIntensity: 0.12 });
  const truckMat = new THREE.MeshStandardMaterial({ color: custom.trucks, roughness: 0.4, metalness: 0.7 });
  [0.32, -0.32].forEach((z) => {
    const truck = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.05), truckMat));
    truck.position.set(0, 0.03, z);
    board.add(truck);
    [0.1, -0.1].forEach((x) => {
      const wheel = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), wheelMat));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.02, z);
      board.add(wheel);
    });
  });

  // ---- skater body: layered joints for a more believable stance ----
  const skinTone = custom.skin;
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: custom.shirt, roughness: 0.55, emissive: custom.shirt, emissiveIntensity: 0.08 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: custom.pants, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: custom.shoes || "#151515", roughness: 0.5 });
  const shoeSoleMat = new THREE.MeshStandardMaterial({ color: "#e7e7e7", roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: custom.hair, roughness: 0.6 });

  // pelvis anchor — the whole rider is scaled up from here so body proportions read
  // correctly next to the board (previously the rider was barely taller than the deck)
  const hips = new THREE.Group();
  hips.scale.set(1.4, 1.4, 1.4);
  hips.position.set(0, 0.76, 0);
  group.add(hips);

  // torso: two stacked segments (waist -> chest)
  const waist = shadowAll(new THREE.Mesh(makeRoundedBoxGeometry(0.19, 0.13, 0.14, 0.03), pantsMat));
  waist.position.set(0, 0.07, 0);
  hips.add(waist);

  const chest = shadowAll(new THREE.Mesh(makeRoundedBoxGeometry(0.2, 0.14, 0.22, 0.035), shirtMat));
  chest.position.set(0, 0.24, 0.015);
  hips.add(chest);

  const neck = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 8), skinMat));
  neck.position.set(0, 0.37, 0.02);
  hips.add(neck);

  const head = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.078, 20, 20), skinMat));
  head.position.set(0, 0.44, 0.02);
  head.material = new THREE.MeshStandardMaterial({ map: makeFaceTexture(skinTone), roughness: 0.8 });
  hips.add(head);

  // face features — real 3D geometry, positioned around the head sphere
  const eyeMat = new THREE.MeshStandardMaterial({ color: "#1c1410", roughness: 0.4 });
  [-1, 1].forEach((s) => {
    const eye = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), eyeMat));
    eye.position.set(s * 0.03, 0.455, 0.088);
    hips.add(eye);
  });

  const nose = shadowAll(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 8), skinMat));
  nose.position.set(0, 0.435, 0.09);
  nose.rotation.x = Math.PI / 2;
  hips.add(nose);

  const mouth = shadowAll(
    new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.01), new THREE.MeshStandardMaterial({ color: "#7a3d2c", roughness: 0.6 }))
  );
  mouth.position.set(0, 0.405, 0.086);
  hips.add(mouth);

  [-1, 1].forEach((s) => {
    const ear = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), skinMat));
    ear.scale.set(0.6, 1, 1);
    ear.position.set(s * 0.078, 0.44, 0.015);
    hips.add(ear);
  });

  addHairstyle(hips, custom.hairstyle || "court", hairMat, shadowAll);

  // legs: hip -> knee -> ankle, nested so the knee bend direction is always anatomically
  // consistent (thigh forward, shin folds back under it, ankle levels the foot on the deck).
  // Both legs bend at the same parallel angle; only the foot shifts slightly front/back.
  // stance sets which foot leads: goofy = right foot forward, regular = left foot forward.
  const frontSide = stance === "goofy" ? -1 : 1; // side === +1 is the rider's right leg
  const baseHipAngle = -0.3; // shared crouch bend
  const kneeAngle = 0.55;
  const stanceLean = 0.4; // reach toward the nose/tail via lean, not a big hip offset

  [-1, 1].forEach((side) => {
    const isFront = side === frontSide;
    const hipZ = isFront ? 0.06 : -0.06; // stays inside the pelvis footprint — visually attached
    const hipAngle = baseHipAngle + (isFront ? -stanceLean : stanceLean);
    const ankleAngle = -(hipAngle + kneeAngle); // cancels hip+knee tilt so this foot sits flat

    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.1, 0, hipZ);
    hipPivot.rotation.x = hipAngle;
    hips.add(hipPivot);

    // joint cap bridges any visual seam between the pelvis and the thigh
    const hipCap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), pantsMat));
    hipPivot.add(hipCap);

    const thigh = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.22, 10), pantsMat));
    thigh.position.set(0, -0.11, 0);
    thigh.rotation.y = isFront ? Math.PI / 2 : -Math.PI / 2;
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.22, 0);
    kneePivot.rotation.x = kneeAngle;
    hipPivot.add(kneePivot);

    const shin = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.22, 10), pantsMat));
    shin.position.set(0, -0.11, 0);
    shin.rotation.y = isFront ? Math.PI / 2 : -Math.PI / 2;
    kneePivot.add(shin);

    const anklePivot = new THREE.Group();
    anklePivot.position.set(0, -0.22, 0);
    anklePivot.rotation.x = ankleAngle;
    kneePivot.add(anklePivot);

    // foot stays right at the ankle — no separate offset, so it never detaches visually
    const shoe = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.16), shoeMat));
    shoe.position.set(0, -0.03, 0);
    shoe.rotation.y = side * (Math.PI / 2) - Math.PI / 2;
    anklePivot.add(shoe);
    const sole = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.012, 0.165), shoeSoleMat));
    sole.position.set(0, -0.055, 0);
    sole.rotation.y = side * (Math.PI / 2) - Math.PI / 2;
    anklePivot.add(sole);

    if (!isFront) {
      group.userData.backHipPivot = hipPivot;
      group.userData.backKneePivot = kneePivot;
      group.userData.backLegBaseHip = hipAngle;
      group.userData.backLegBaseKnee = kneeAngle;
    }
  });

  // arms: shoulder -> elbow -> hand, nested so both sides stay symmetric and aligned
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.115, 0.32, 0.01);
    shoulder.rotation.z = side * 0.55; // spread out to the side for balance
    hips.add(shoulder);

    const upperArm = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.16, 8), shirtMat));
    upperArm.position.set(0, -0.08, 0);
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.16, 0);
    elbow.rotation.x = -0.55; // same bend direction for both arms (own local frame)
    shoulder.add(elbow);

    const forearm = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.15, 8), skinMat));
    forearm.position.set(0, -0.075, 0);
    elbow.add(forearm);

    const hand = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), skinMat));
    hand.position.set(0, -0.155, 0);
    elbow.add(hand);
  });

  group.position.y = 0.05;
  return group;
}

function makeGroundTexture() {
  const size = 256;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = size;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#0e1024";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#1fe6ff33";
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cnv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

/* ---------------------------------------------------------
   LIVE 3D VIEW
--------------------------------------------------------- */
function Live3DView({ custom, telemetryRef, connected, usePhone, phoneTiltRef, stance, esp32Status }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.screen);
    scene.fog = new THREE.Fog(C.screen, 4, 11);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(3, 5, 2);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -2;
    dir.shadow.camera.right = 2;
    dir.shadow.camera.top = 2;
    dir.shadow.camera.bottom = -2;
    scene.add(dir);
    const rimA = new THREE.PointLight(0xff2fd6, 1.4, 8);
    rimA.position.set(-2, 1.5, -2);
    scene.add(rimA);
    const rimB = new THREE.PointLight(0x1fe6ff, 1.2, 8);
    rimB.position.set(2, 1, 2);
    scene.add(rimB);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 3),
      new THREE.MeshStandardMaterial({ color: "#c9c9c9", metalness: 0.8, roughness: 0.3, emissive: 0x1fe6ff, emissiveIntensity: 0.05 })
    );
    rail.position.set(1.4, 0.25, 0);
    scene.add(rail);
    [1.5, -1.5].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), rail.material);
      leg.position.set(1.4, 0.12, z);
      scene.add(leg);
    });

    const rig = buildSkateRig(custom, stance);
    rig.rotation.y = Math.PI; // an additional quarter turn, counter-clockwise
    scene.add(rig);

    camera.position.set(0, 1.55, 2.9);

    let swayT = 0;
    let flipT = 0;
    let raf;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      swayT += dt * 0.3;
      const angle = Math.sin(swayT) * 0.22;
      camera.position.x = Math.sin(angle) * 2.9;
      camera.position.z = Math.cos(angle) * 2.9;
      camera.lookAt(0, 0.78, 0);

      const tm = telemetryRef.current;
      let idlePitch, idleRoll;
      if (usePhone) {
        const tilt = phoneTiltRef.current;
        idlePitch = THREE.MathUtils.clamp((tilt.beta * Math.PI) / 180, -0.6, 0.6) * 0.4;
        idleRoll = THREE.MathUtils.clamp((tilt.gamma * Math.PI) / 180, -0.6, 0.6) * 0.4;
      } else {
        idlePitch = Math.sin(clock.elapsedTime * 1.6) * 0.03 * (0.4 + tm.speed / 25);
        idleRoll = Math.sin(clock.elapsedTime * 1.1 + 1) * 0.05 * (0.4 + tm.speed / 25);
      }

      if (tm.trickPulse > 0) {
        flipT += dt * (1000 / Math.max(tm.trickAirtime, 200));
        const spin = (Math.min(flipT, 1) * (tm.trickRotation * Math.PI)) / 180;
        rig.rotation.x = spin * (tm.trickGrind ? 0 : 1);
        rig.position.y = 0.05 + Math.sin(Math.min(flipT, 1) * Math.PI) * 0.35;
        if (flipT >= 1) {
          tm.trickPulse = 0;
          flipT = 0;
          rig.rotation.x = 0;
          rig.position.y = 0.05;
        }
      } else {
        rig.rotation.x = idlePitch;
        rig.rotation.z = idleRoll;
        rig.position.y = 0.05;
      }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custom.deck, custom.trucks, custom.wheels, custom.grip, custom.shirt, custom.pants, custom.shoes, custom.skin, custom.hair, custom.hairstyle, usePhone, stance]);

  return (
    <div style={{ position: "relative", width: "100%", height: 320, borderRadius: 24, overflow: "hidden", border: `3px solid ${C.cyan}`, boxShadow: `0 0 14px ${C.cyan}55, inset 0 0 20px #00000088` }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          background: "rgba(26,19,48,0.85)",
          borderRadius: 999,
          border: `2px solid ${connected ? C.green : C.danger}`,
          fontFamily: MONO_FONT,
          fontSize: 12,
          color: connected ? C.green : C.danger,
        }}
      >
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {esp32Status === "connected"
          ? "BOITIER RIDERANALYTIC · LIVE"
          : connected
          ? "MODE DEMO (boitier non detecte)"
          : "RECHERCHE DU BOITIER..."}
      </div>
      {usePhone && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: "4px 10px",
            background: "rgba(26,19,48,0.85)",
            borderRadius: 999,
            border: `2px solid ${C.magenta}`,
            fontFamily: MONO_FONT,
            fontSize: 11,
            color: C.magenta,
          }}
        >
          CAPTEURS TEL ACTIFS
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   GARAGE PREVIEW (turntable)
--------------------------------------------------------- */
function GaragePreview({ custom, stance }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.screen);
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 2.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 0.9);
    d.position.set(2, 3, 2);
    d.castShadow = true;
    scene.add(d);
    const p1 = new THREE.PointLight(0xff2fd6, 1, 6);
    p1.position.set(-1.5, 1, 1);
    scene.add(p1);
    const p2 = new THREE.PointLight(0x1fe6ff, 1, 6);
    p2.position.set(1.5, 1, -1);
    scene.add(p2);

    const rig = buildSkateRig(custom, stance);
    scene.add(rig);

    const previewGround = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 32),
      new THREE.MeshStandardMaterial({ color: "#0e1024", roughness: 1 })
    );
    previewGround.rotation.x = -Math.PI / 2;
    previewGround.receiveShadow = true;
    scene.add(previewGround);

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      rig.rotation.y += 0.012;
      camera.lookAt(0, 0.78, 0);
      renderer.render(scene, camera);
    }
    animate();
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [custom.deck, custom.trucks, custom.wheels, custom.grip, custom.shirt, custom.pants, custom.shoes, custom.skin, custom.hair, custom.hairstyle, stance]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: 240, borderRadius: 24, overflow: "hidden", border: `3px solid ${C.magenta}`, boxShadow: `0 0 14px ${C.magenta}55` }}
    />
  );
}

/* ---------------------------------------------------------
   LAST TRICK REPLAY — loops the trick's 3D motion, 1s pause between loops
--------------------------------------------------------- */
function TrickReplayView({ trick, custom, stance }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!trick) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.screen);
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.35, 2.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 0.9);
    d.position.set(2, 3, 2);
    scene.add(d);
    const p1 = new THREE.PointLight(trick.validated ? 0x5cff7a : 0xff3860, 1, 6);
    p1.position.set(-1.5, 1, 1);
    scene.add(p1);

    const rig = buildSkateRig(custom, stance);
    scene.add(rig);

    const isSpin = trick.category === "figure" || trick.category === "combo";
    const airtime = Math.max(200, trick.airtime || 300);
    const rotationRad = ((trick.rotationDeg || 360) * Math.PI) / 180;
    const PAUSE_MS = 1000; // wait one second between loops

    let raf;
    let phase = "play";
    let phaseStart = performance.now();

    function animate(now) {
      raf = requestAnimationFrame(animate);
      const elapsed = now - phaseStart;

      if (phase === "play") {
        const t = Math.min(1, elapsed / airtime);
        rig.rotation.x = isSpin ? t * rotationRad : 0;
        rig.position.y = 0.05 + Math.sin(t * Math.PI) * (isSpin ? 0.3 : 0.08);
        if (t >= 1) {
          phase = "pause";
          phaseStart = now;
          rig.rotation.x = 0;
          rig.position.y = 0.05;
        }
      } else if (elapsed >= PAUSE_MS) {
        phase = "play";
        phaseStart = now;
      }

      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trick,
    custom.deck,
    custom.trucks,
    custom.wheels,
    custom.grip,
    custom.shirt,
    custom.pants,
    custom.shoes,
    custom.skin,
    custom.hair,
    stance,
  ]);

  if (!trick) return null;

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: 150,
        borderRadius: 16,
        overflow: "hidden",
        border: `2px solid ${trick.validated ? C.green : C.danger}`,
      }}
    />
  );
}

/* ---------------------------------------------------------
   REAL-WORLD MAP — OpenStreetMap tiles + geolocation
--------------------------------------------------------- */
const MAP_ZOOM = 19;
const METERS_PER_DEG_LAT = 111320;

function lon2x(lon, z) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}
function lat2y(lat, z) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z);
}
function metersToDelta(dxMeters, dyMeters, atLat) {
  const dLat = dyMeters / METERS_PER_DEG_LAT;
  const dLon = dxMeters / (METERS_PER_DEG_LAT * Math.cos((atLat * Math.PI) / 180));
  return { dLat, dLon };
}
function geoKey(lat, lon) {
  // clusters roughly every ~4m
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

function SpotsMap({ baseGeo, playerGeo, spotsGeo, namedSpots = [] }) {
  if (!baseGeo || !playerGeo) return null;
  const z = MAP_ZOOM;
  const centerPxX = lon2x(baseGeo.lon, z) * 256;
  const centerPxY = lat2y(baseGeo.lat, z) * 256;
  const centerTileX = Math.floor(centerPxX / 256);
  const centerTileY = Math.floor(centerPxY / 256);
  const originPxX = (centerTileX - 1) * 256;
  const originPxY = (centerTileY - 1) * 256;

  const playerPxX = lon2x(playerGeo.lon, z) * 256;
  const playerPxY = lat2y(playerGeo.lat, z) * 256;

  const viewW = 320;
  const viewH = 280;
  const translateX = viewW / 2 - (playerPxX - originPxX);
  const translateY = viewH / 2 - (playerPxY - originPxY);

  const tiles = [];
  for (let ty = -1; ty <= 1; ty++) {
    for (let tx = -1; tx <= 1; tx++) {
      tiles.push({
        x: centerTileX + tx,
        y: centerTileY + ty,
        left: (centerTileX + tx - (centerTileX - 1)) * 256,
        top: (centerTileY + ty - (centerTileY - 1)) * 256,
      });
    }
  }

  return (
    <div style={{ width: "100%", height: viewH, overflow: "hidden", position: "relative", borderRadius: 16 }}>
      <div
        style={{
          position: "absolute",
          width: 768,
          height: 768,
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      >
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", left: t.left, top: t.top, width: 256, height: 256, filter: "saturate(0.9) brightness(0.85)" }}
            onError={(e) => {
              e.currentTarget.style.background = "#1a1330";
            }}
          />
        ))}
        {Object.values(spotsGeo).map((s) => {
          const px = lon2x(s.lon, z) * 256 - originPxX;
          const py = lat2y(s.lat, z) * 256 - originPxY;
          const heat = Math.min(1, s.count / 5);
          return (
            <div
              key={`${s.lat}-${s.lon}`}
              style={{
                position: "absolute",
                left: px - 10,
                top: py - 10,
                width: 20,
                height: 20,
                borderRadius: 999,
                background: `rgba(255,61,129,${0.35 + heat * 0.55})`,
                border: `2px solid ${C.magenta}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {s.count}
            </div>
          );
        })}
        {namedSpots.map((s) => {
          const px = lon2x(s.lon, z) * 256 - originPxX;
          const py = lat2y(s.lat, z) * 256 - originPxY;
          if (px < -40 || px > 808 || py < -40 || py > 808) return null;
          return (
            <div
              key={s.id}
              style={{
                position: "absolute",
                left: px - 16,
                top: py - 34,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${C.yellow}`,
                  boxShadow: `0 0 8px ${C.yellow}aa`,
                  background: "#1a1330",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.photo ? (
                  <img src={s.photo} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 14 }}>📍</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: "#1a1330",
                  background: C.yellow,
                  padding: "1px 5px",
                  borderRadius: 6,
                  marginTop: 2,
                  maxWidth: 70,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: playerPxX - originPxX - 8,
            top: playerPxY - originPxY - 8,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: C.cyan,
            border: "3px solid #fff",
            boxShadow: `0 0 10px ${C.cyan}`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
          fontSize: 8,
          color: "#00000099",
          background: "rgba(255,255,255,0.6)",
          padding: "1px 4px",
          borderRadius: 4,
        }}
      >
        © OpenStreetMap
      </div>
    </div>
  );
}


function NeonPanel({ children, color = C.cyan, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.panel,
        color: C.text,
        border: `2px solid ${color}`,
        boxShadow: `0 2px 10px rgba(0,0,0,0.12)`,
        borderRadius: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SkateWheelIcon({ color = C.cyan, size = 20 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="17" fill="#0a0e24" stroke={color} strokeWidth="3.5" />
      <circle cx="20" cy="20" r="9" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="20" cy="20" r="3" fill={color} />
      {[0, 90, 180, 270].map((deg) => (
        <circle
          key={deg}
          cx={20 + 12 * Math.cos((deg * Math.PI) / 180)}
          cy={20 + 12 * Math.sin((deg * Math.PI) / 180)}
          r="1.6"
          fill={color}
        />
      ))}
    </svg>
  );
}

function NeonTitle({ children, color = C.green, style }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: 18,
        color,
        padding: "8px 22px",
        border: `2px solid ${C.cyan}`,
        borderRadius: 999,
        background: "#241c40",
        boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
        letterSpacing: 0.5,
        ...style,
      }}
    >
      <SkateWheelIcon color={C.cyan} size={style?.fontSize ? style.fontSize + 6 : 22} />
      {children}
    </div>
  );
}

function CheckerStripe({ side }) {
  return (
    <div
      style={{
        flex: 1,
        height: 16,
        borderRadius: 999,
        backgroundImage: `repeating-linear-gradient(135deg, ${C.magenta} 0 7px, ${C.yellow} 7px 14px)`,
        opacity: 0.95,
        transform: side === "left" ? "skewX(-14deg)" : "skewX(14deg)",
      }}
    />
  );
}

function CarouselPicker({ items, index, onChange }) {
  const item = items[index];
  return (
    <NeonPanel color={C.cyan} style={{ padding: "14px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <button
          onClick={() => onChange((index - 1 + items.length) % items.length)}
          style={arrowBtnStyle}
          aria-label="precedent"
        >
          <ChevronLeft size={18} color={C.cyan} />
        </button>
        <div
          style={{
            width: 90,
            height: 60,
            borderRadius: 16,
            background: item.color,
            border: `3px solid ${C.yellow}`,
            boxShadow: `0 0 10px ${item.color}aa`,
          }}
        />
        <button
          onClick={() => onChange((index + 1) % items.length)}
          style={arrowBtnStyle}
          aria-label="suivant"
        >
          <ChevronRight size={18} color={C.cyan} />
        </button>
      </div>
      <div
        style={{
          textAlign: "center",
          fontFamily: MONO_FONT,
          fontSize: 13,
          color: C.yellow,
          marginTop: 10,
          letterSpacing: 1,
        }}
      >
        {item.name}
      </div>
    </NeonPanel>
  );
}

const arrowBtnStyle = {
  background: "#241c40",
  border: `2px solid ${C.cyan}`,
  borderRadius: 999,
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  background: "#0a0e24",
  border: `2px solid ${C.panelLine}`,
  borderRadius: 12,
  color: C.text,
  fontSize: 13,
  padding: "8px 10px",
  fontFamily: MONO_FONT,
  boxSizing: "border-box",
};

function pillToggleStyle(active) {
  return {
    padding: "8px 12px",
    fontFamily: MONO_FONT,
    fontSize: 10,
    letterSpacing: 0.5,
    background: active ? C.magenta : "#f0eef8",
    color: active ? "#fff" : "#4a3d7a",
    border: `2px solid ${active ? C.magenta : C.panelLine}`,
    borderRadius: 999,
    cursor: "pointer",
    flex: 1,
  };
}

function FormField({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   NAV
--------------------------------------------------------- */
const TABS = [
  { id: "live", label: "LIVE", icon: Radio },
  { id: "tricks", label: "FIGURES", icon: ListChecks },
  { id: "stats", label: "RAPPORTS", icon: Activity },
  { id: "spots", label: "SPOTS", icon: MapIcon },
  { id: "garage", label: "PROFIL", icon: Palette },
  { id: "ranking", label: "RANKING", icon: Trophy },
];

const GARAGE_TABS = [
  { id: "deck", label: "DECK", items: DECKS },
  { id: "trucks", label: "TRUCKS", items: TRUCKS },
  { id: "wheels", label: "WHEELS", items: WHEELS },
  { id: "grip", label: "GRIP TAPE", items: GRIPS },
  { id: "shirt", label: "SHIRT", items: SHIRTS },
  { id: "pants", label: "PANTALON", items: PANTS },
  { id: "shoes", label: "CHAUSSURES", items: SHOES },
  { id: "skin", label: "PEAU", items: SKIN_TONES },
  { id: "hair", label: "CHEVEUX", items: HAIR_COLORS },
  { id: "hairstyle", label: "COIFFURE", items: HAIRSTYLES },
];

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function SkateTrackerApp() {
  useFonts();
  const [tab, setTab] = useState("live");
  const [connected, setConnected] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [speedLog, setSpeedLog] = useState([]);
  const [tricks, setTricks] = useState([]);
  const [spots, setSpots] = useState({});
  const [pos, setPos] = useState({ x: 4, y: 4 });
  const startRef = useRef(Date.now());
  const sessionIdRef = useRef(`session-${Date.now()}`);
  const [durationSec, setDurationSec] = useState(0);
  const [pauseSec, setPauseSec] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [viewingSession, setViewingSession] = useState(null);

  const [garageTab, setGarageTab] = useState("deck");
  const [idx, setIdx] = useState({
    deck: 0,
    trucks: 0,
    wheels: 0,
    grip: 0,
    shirt: 0,
    pants: 0,
    shoes: 0,
    skin: 0,
    hair: 0,
    hairstyle: 0,
  });

  const [usePhone, setUsePhone] = useState(false);
  const [sensorStatus, setSensorStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const usePhoneRef = useRef(false);
  const phoneTiltRef = useRef({ beta: 0, gamma: 0 });
  const motionStateRef = useRef({ lastSpike: 0 });

  const [customPhotos, setCustomPhotos] = useState({});
  const [editingTrick, setEditingTrick] = useState(null);
  const [photoDraft, setPhotoDraft] = useState("");

  const [riderProfile, setRiderProfile] = useState({
    pseudo: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    age: "",
    city: "",
    stance: "regular",
    profilePhoto: "",
    country: "",
  });
  const [editingProfilePhoto, setEditingProfilePhoto] = useState(false);
  const [profilePhotoDraft, setProfilePhotoDraft] = useState("");

  const [toasts, setToasts] = useState([]);
  function pushToast(text, epic) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, epic }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, epic ? 3600 : 2400);
  }
  const [baseGeo, setBaseGeo] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [geoPos, setGeoPos] = useState(null);
  const [spotsGeo, setSpotsGeo] = useState({});
  const geoPosRef = useRef(null);
  const geoGrantedRef = useRef(false);

  const [namedSpots, setNamedSpots] = useState([]);
  const [trickStats, setTrickStats] = useState({}); // { [name]: { validated, failed, days: [] } }
  const [trickNotes, setTrickNotes] = useState({}); // { [name]: { blocker, tuto } }
  const [detailTrick, setDetailTrick] = useState(null);
  const [viewingRider, setViewingRider] = useState(null);
  const [figCategory, setFigCategory] = useState(TRICK_CATEGORIES[0].id);
  const [comboSelection, setComboSelection] = useState([]);

  function toggleComboTrick(name) {
    setComboSelection((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function validateCombo() {
    if (comboSelection.length < 2) return;
    const comboName = comboSelection.join(" + ");
    const comboScore = comboSelection.reduce((sum, n) => {
      const t = TRICKS.find((tr) => tr.name === n);
      return sum + (t ? Math.round(t.baseScore * 1.2) : 60);
    }, 0);
    const res = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: comboName,
      grind: false,
      clean: 0.9,
      airtime: 300 * comboSelection.length,
      rotationDeg: 0,
      validated: true,
      score: comboScore,
      t: Date.now(),
    };
    setTricks((prev) => [res, ...prev].slice(0, 100));
    updateTrickStats(comboName, true);
    recordGeoSpot();
    pushToast(`✔ Combo valide — ${comboName} +${comboScore}`, comboScore > 250);
    setComboSelection([]);
  }
  const [spotSearchQuery, setSpotSearchQuery] = useState("");
  const [spotSearchStatus, setSpotSearchStatus] = useState("idle"); // idle | searching | found | notfound | error
  const [spotSearchResult, setSpotSearchResult] = useState(null);
  const [newSpotName, setNewSpotName] = useState("");
  const [newSpotPhoto, setNewSpotPhoto] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("trick-photos", false);
        if (res && res.value) setCustomPhotos(JSON.parse(res.value));
      } catch (e) {
        // no saved photos yet — keep defaults
      }
      try {
        const res2 = await window.storage.get("rider-profile", false);
        if (res2 && res2.value) setRiderProfile(JSON.parse(res2.value));
      } catch (e) {
        // no saved profile yet — keep defaults
      }
      try {
        const res3 = await window.storage.get("named-spots", false);
        if (res3 && res3.value) setNamedSpots(JSON.parse(res3.value));
      } catch (e) {
        // no saved spots yet — keep defaults
      }
      try {
        const res4 = await window.storage.get("trick-stats", false);
        if (res4 && res4.value) setTrickStats(JSON.parse(res4.value));
      } catch (e) {
        // no saved stats yet — keep defaults
      }
      try {
        const res5 = await window.storage.get("trick-notes", false);
        if (res5 && res5.value) setTrickNotes(JSON.parse(res5.value));
      } catch (e) {
        // no saved notes yet — keep defaults
      }
      try {
        const res6 = await window.storage.get("session-history", false);
        if (res6 && res6.value) setSessionHistory(JSON.parse(res6.value));
      } catch (e) {
        // no saved sessions yet — keep defaults
      }
    })();
  }, []);

  function updateTrickStats(name, validated, score, spotName) {
    setTrickStats((prev) => {
      const today = new Date().toISOString().slice(0, 10);
      const cur = prev[name] || { validated: 0, failed: 0, days: [], bestSpot: null, bestScore: 0 };
      const days = cur.days.includes(today) ? cur.days : [...cur.days, today];
      const upgradeSpot = validated && score > (cur.bestScore || 0);
      const next = {
        ...prev,
        [name]: {
          validated: cur.validated + (validated ? 1 : 0),
          failed: cur.failed + (validated ? 0 : 1),
          days,
          bestScore: upgradeSpot ? score : cur.bestScore || 0,
          bestSpot: upgradeSpot ? spotName || "Zone non nommee" : cur.bestSpot || null,
        },
      };
      (async () => {
        try {
          await window.storage.set("trick-stats", JSON.stringify(next), false);
        } catch (e) {
          // storage unavailable — stats still apply for this session
        }
      })();
      return next;
    });
  }

  function saveTrickNotes(name, patch) {
    setTrickNotes((prev) => {
      const next = { ...prev, [name]: { ...(prev[name] || { blocker: "", tuto: "" }), ...patch } };
      (async () => {
        try {
          await window.storage.set("trick-notes", JSON.stringify(next), false);
        } catch (e) {
          // storage unavailable — notes still apply for this session
        }
      })();
      return next;
    });
  }

  async function searchSpotLocation() {
    if (!spotSearchQuery.trim()) return;
    setSpotSearchStatus("searching");
    setSpotSearchResult(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(spotSearchQuery)}`
      );
      const data = await res.json();
      if (data && data[0]) {
        setSpotSearchResult({
          displayName: data[0].display_name,
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
        setNewSpotName(spotSearchQuery);
        setSpotSearchStatus("found");
      } else {
        setSpotSearchStatus("notfound");
      }
    } catch (e) {
      setSpotSearchStatus("error");
    }
  }

  async function saveNamedSpot() {
    if (!spotSearchResult) return;
    const spot = {
      id: `${Date.now()}`,
      name: newSpotName.trim() || spotSearchResult.displayName,
      lat: spotSearchResult.lat,
      lon: spotSearchResult.lon,
      photo: newSpotPhoto.trim(),
    };
    const next = [...namedSpots, spot];
    setNamedSpots(next);
    try {
      await window.storage.set("named-spots", JSON.stringify(next), false);
    } catch (e) {
      // storage unavailable — spot still applies for this session
    }
    setSpotSearchResult(null);
    setSpotSearchQuery("");
    setNewSpotName("");
    setNewSpotPhoto("");
    setSpotSearchStatus("idle");
  }

  async function removeNamedSpot(id) {
    const next = namedSpots.filter((s) => s.id !== id);
    setNamedSpots(next);
    try {
      await window.storage.set("named-spots", JSON.stringify(next), false);
    } catch (e) {
      // ignore
    }
  }

  function updateRiderProfile(patch) {
    setRiderProfile((prev) => {
      const next = { ...prev, ...patch };
      (async () => {
        try {
          await window.storage.set("rider-profile", JSON.stringify(next), false);
        } catch (e) {
          // storage unavailable — profile still applies for this session
        }
      })();
      return next;
    });
  }

  async function saveCustomPhotos(next) {
    setCustomPhotos(next);
    try {
      await window.storage.set("trick-photos", JSON.stringify(next), false);
    } catch (e) {
      // storage unavailable — photo still applies for this session
    }
  }

  function enableLocation() {
    setGeoStatus("requesting");
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const g = { lat: p.coords.latitude, lon: p.coords.longitude };
        setBaseGeo(g);
        setGeoPos(g);
        geoPosRef.current = g;
        geoGrantedRef.current = true;
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function findNearestSpotName() {
    if (!geoPosRef.current || !namedSpots.length) return null;
    const { lat, lon } = geoPosRef.current;
    let best = null;
    let bestDist = Infinity;
    namedSpots.forEach((s) => {
      const dLat = (s.lat - lat) * METERS_PER_DEG_LAT;
      const dLon = (s.lon - lon) * METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < bestDist) {
        bestDist = dist;
        best = s.name;
      }
    });
    return bestDist <= 60 ? best : null; // within ~60m of a saved spot
  }

  function recordGeoSpot() {
    if (!geoGrantedRef.current || !geoPosRef.current) return;
    const { lat, lon } = geoPosRef.current;
    const key = geoKey(lat, lon);
    setSpotsGeo((prev) => {
      const existing = prev[key];
      return { ...prev, [key]: { lat, lon, count: (existing?.count || 0) + 1 } };
    });
  }

  const custom = {
    deck: DECKS[idx.deck].color,
    trucks: TRUCKS[idx.trucks].color,
    wheels: WHEELS[idx.wheels].color,
    grip: GRIPS[idx.grip].color,
    shirt: SHIRTS[idx.shirt].color,
    pants: PANTS[idx.pants].color,
    shoes: SHOES[idx.shoes].color,
    skin: SKIN_TONES[idx.skin].color,
    hair: HAIR_COLORS[idx.hair].color,
    hairstyle: HAIRSTYLES[idx.hairstyle].id,
  };

  const telemetryRef = useRef({ speed: 0, trickPulse: 0, trickAirtime: 300, trickRotation: 360, trickGrind: false });

  const bots = useMemo(
    () => [
      {
        name: "SK8_NIKO",
        score: 4820,
        bestTrick: { name: "360 Flip", score: 148 },
        maxSpeed: 27.4,
        bestAir: 640,
        country: "IT",
        stance: "regular",
        city: "Los Angeles",
        age: 22,
        heightCm: 178,
        weightKg: 70,
      },
      {
        name: "RIDER_X",
        score: 4310,
        bestTrick: { name: "Kickflip", score: 132 },
        maxSpeed: 24.1,
        bestAir: 520,
        country: "ES",
        stance: "goofy",
        city: "Sao Paulo",
        age: 19,
        heightCm: 172,
        weightKg: 64,
      },
      {
        name: "GRINDQUEEN",
        score: 3990,
        bestTrick: { name: "Boardslide", score: 128 },
        maxSpeed: 19.8,
        bestAir: 410,
        country: "FR",
        stance: "regular",
        city: "Marseille",
        age: 26,
        heightCm: 165,
        weightKg: 58,
      },
      {
        name: "OLLIE_KID",
        score: 2750,
        bestTrick: { name: "Ollie", score: 88 },
        maxSpeed: 21.5,
        bestAir: 380,
        country: "NL",
        stance: "goofy",
        city: "Osaka",
        age: 16,
        heightCm: 160,
        weightKg: 50,
      },
      {
        name: "FAKIE_FRED",
        score: 1980,
        bestTrick: { name: "Heelflip", score: 95 },
        maxSpeed: 17.2,
        bestAir: 290,
        country: "GB",
        stance: "regular",
        city: "Londres",
        age: 24,
        heightCm: 180,
        weightKg: 75,
      },
    ],
    []
  );

  const [esp32Status, setEsp32Status] = useState("idle"); // idle | searching | connected | unavailable
  const esp32ConnectedRef = useRef(false);
  const wsRef = useRef(null);

  function connectESP32() {
    if (wsRef.current) return;
    setEsp32Status("searching");
    let ws;
    try {
      ws = new WebSocket("ws://192.168.4.1:81/");
    } catch (e) {
      setEsp32Status("unavailable");
      setTimeout(connectESP32, 5000);
      return;
    }
    wsRef.current = ws;
    const openTimeout = setTimeout(() => {
      if (ws.readyState !== 1) ws.close();
    }, 3000);

    ws.onopen = () => {
      clearTimeout(openTimeout);
      esp32ConnectedRef.current = true;
      setEsp32Status("connected");
      setConnected(true);
    };
    ws.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        const mag = Math.sqrt((d.ax || 0) ** 2 + (d.ay || 0) ** 2 + (d.az || 0) ** 2);
        telemetryRef.current.speed = Math.min(32, mag * 1.4);
        const now = Date.now();
        if (mag > 22 && now - motionStateRef.current.lastSpike > 1100) {
          motionStateRef.current.lastSpike = now;
          pushRealTrick(mag, { alpha: d.gz || 0, beta: d.gx || 0, gamma: d.gy || 0 });
        }
      } catch (e) {
        // ignore malformed frames
      }
    };
    ws.onclose = () => {
      clearTimeout(openTimeout);
      wsRef.current = null;
      esp32ConnectedRef.current = false;
      setEsp32Status("unavailable");
      setTimeout(connectESP32, 5000); // keep retrying — connects automatically once the boitier is reachable
    };
    ws.onerror = () => {
      ws.close();
    };
  }

  useEffect(() => {
    connectESP32();
    // demo fallback: if no real boitier answers, still light up the demo after a moment
    const t = setTimeout(() => setConnected(true), 1800);
    return () => {
      clearTimeout(t);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // --- real phone motion sensors (accelerometer + gyroscope via browser) ---
  function pushRealTrick(mag, rotationRate) {
    const rr = rotationRate || {};
    const axes = {
      alpha: Math.abs(rr.alpha || 0),
      beta: Math.abs(rr.beta || 0),
      gamma: Math.abs(rr.gamma || 0),
    };
    const rot = axes.alpha + axes.beta + axes.gamma;
    const dominant = Object.entries(axes).sort((a, b) => b[1] - a[1])[0][0];
    let name = "Ollie";
    const category = "figure";
    if (rot > 220) name = dominant === "alpha" ? "Shove-it" : dominant === "beta" ? "Kickflip" : "Heelflip";
    if (rot > 480) name = "360 Flip";
    const clean = Math.min(1, 0.35 + rot / 900 + (mag - 15) / 45);
    const validated = mag > 15 && clean > 0.45;
    const score = validated ? Math.round((55 + rot / 4) * clean) : 0;
    const airtime = Math.min(900, Math.round(140 + rot * 0.5));
    const spotName = findNearestSpotName();
    const res = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      category,
      clean,
      airtime,
      rotationDeg: Math.round(rot),
      validated,
      score,
      spotName,
      t: Date.now(),
    };
    telemetryRef.current.trickPulse = 1;
    telemetryRef.current.trickAirtime = airtime;
    telemetryRef.current.trickRotation = Math.min(720, Math.round(rot));
    telemetryRef.current.trickGrind = category !== "figure";
    setTricks((prev) => [res, ...prev].slice(0, 100));
    updateTrickStats(res.name, res.validated, res.score, res.spotName);
    if (res.validated) {
      setSpots((prev) => {
        const gx = Math.floor(pos.x);
        const gy = Math.floor(pos.y);
        const key = `${gx},${gy}`;
        return { ...prev, [key]: (prev[key] || 0) + 1 };
      });
      recordGeoSpot();
      const isWorldClass = res.clean > 0.85;
      pushToast(
        isWorldClass ? `🌍 NIVEAU EUROPEEN — ${name} +${score} !` : `✔ Figure validee — ${name} +${score}`,
        isWorldClass
      );
    }
  }

  useEffect(() => {
    function onOrientation(e) {
      phoneTiltRef.current = { beta: e.beta || 0, gamma: e.gamma || 0 };
    }
    function onMotion(e) {
      const a = e.acceleration && e.acceleration.x !== null ? e.acceleration : e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      telemetryRef.current.speed = Math.min(32, mag * 1.4); // pseudo-intensity reused for the live gauge
      const now = Date.now();
      const baseline = e.acceleration && e.acceleration.x !== null ? 13 : 24; // spike threshold differs if gravity included
      if (mag > baseline && now - motionStateRef.current.lastSpike > 1100) {
        motionStateRef.current.lastSpike = now;
        pushRealTrick(mag, e.rotationRate);
      }
    }
    if (usePhone) {
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("devicemotion", onMotion);
    }
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePhone, pos.x, pos.y]);

  async function enablePhoneSensors() {
    setSensorStatus("requesting");
    try {
      let granted = true;
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const r = await DeviceMotionEvent.requestPermission();
        granted = r === "granted";
      }
      if (granted && typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const r2 = await DeviceOrientationEvent.requestPermission();
        granted = r2 === "granted";
      }
      if (!granted) {
        setSensorStatus("denied");
        return;
      }
      usePhoneRef.current = true;
      setUsePhone(true);
      setConnected(true);
      setSensorStatus("granted");
    } catch (err) {
      setSensorStatus("unsupported");
    }
  }

  function disablePhoneSensors() {
    usePhoneRef.current = false;
    setUsePhone(false);
    setSensorStatus("idle");
  }

  useEffect(() => {
    const iv = setInterval(() => {
      if (!connected) return;
      if (usePhoneRef.current || esp32ConnectedRef.current) {
        // speed value already driven by real accelerometer magnitude in telemetryRef
        setSpeed(telemetryRef.current.speed);
        setSpeedLog((log) => {
          const t = (Date.now() - startRef.current) / 1000;
          const arr = [...log, { t: Math.round(t), speed: Math.round(telemetryRef.current.speed * 10) / 10 }];
          return arr.length > 60 ? arr.slice(arr.length - 60) : arr;
        });
        setDurationSec(Math.round((Date.now() - startRef.current) / 1000));
        if (telemetryRef.current.speed < 1.5) setPauseSec((p) => p + 0.4);
        return;
      }
      setSpeed((prev) => {
        const next = Math.max(0, Math.min(32, prev + (Math.random() - 0.45) * 2.2));
        telemetryRef.current.speed = next;
        setSpeedLog((log) => {
          const t = (Date.now() - startRef.current) / 1000;
          const arr = [...log, { t: Math.round(t), speed: Math.round(next * 10) / 10 }];
          return arr.length > 60 ? arr.slice(arr.length - 60) : arr;
        });
        return next;
      });
      setPos((p) => {
        const nx = Math.min(7, Math.max(0, p.x + (Math.random() - 0.5) * 0.6));
        const ny = Math.min(7, Math.max(0, p.y + (Math.random() - 0.5) * 0.6));
        return { x: nx, y: ny };
      });
      if (geoGrantedRef.current && geoPosRef.current) {
        const { dLat, dLon } = metersToDelta(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          geoPosRef.current.lat
        );
        const next = { lat: geoPosRef.current.lat + dLat, lon: geoPosRef.current.lon + dLon };
        geoPosRef.current = next;
        setGeoPos(next);
      }
      setDurationSec(Math.round((Date.now() - startRef.current) / 1000));
      if (telemetryRef.current.speed < 1.5) setPauseSec((p) => p + 0.4);
    }, 400);
    return () => clearInterval(iv);
  }, [connected]);

  useEffect(() => {
    let cancelled = false;
    function schedule() {
      const delay = 2800 + Math.random() * 3200;
      const t = setTimeout(() => {
        if (cancelled || !connected || usePhoneRef.current || esp32ConnectedRef.current) {
          schedule();
          return;
        }
        const res = attemptTrick();
        const gx = Math.floor(pos.x);
        const gy = Math.floor(pos.y);
        res.spotName = findNearestSpotName() || `Zone (${gx},${gy})`;
        telemetryRef.current.trickPulse = 1;
        telemetryRef.current.trickAirtime = res.airtime;
        telemetryRef.current.trickRotation = res.rotationDeg;
        telemetryRef.current.trickGrind = res.category === "slide" || res.category === "grind";
        setTricks((prev) => [res, ...prev].slice(0, 100));
        updateTrickStats(res.name, res.validated, res.score, res.spotName);
        if (res.validated) {
          setSpots((prev) => {
            const key = `${gx},${gy}`;
            return { ...prev, [key]: (prev[key] || 0) + 1 };
          });
          recordGeoSpot();
          const isWorldClass = res.clean > 0.85;
          pushToast(
            isWorldClass ? `🌍 NIVEAU EUROPEEN — ${res.name} +${res.score} !` : `✔ Figure validee — ${res.name} +${res.score}`,
            isWorldClass
          );
        }
        schedule();
      }, delay);
      return t;
    }
    const t = schedule();
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, pos.x, pos.y]);

  const validatedTricks = tricks.filter((t) => t.validated);
  const avgSpeed = speedLog.length ? speedLog.reduce((a, b) => a + b.speed, 0) / speedLog.length : 0;
  const maxSpeed = speedLog.length ? Math.max(...speedLog.map((s) => s.speed)) : 0;
  const youScore = validatedTricks.reduce((a, b) => a + b.score, 0);
  const successRate = tricks.length ? Math.round((validatedTricks.length / tricks.length) * 100) : 0;

  const latestStatsRef = useRef(null);
  latestStatsRef.current = {
    avgSpeed,
    maxSpeed,
    successRate,
    durationSec,
    pauseSec,
    trickCount: tricks.length,
    validatedCount: validatedTricks.length,
    lastTrick: tricks[0] || null,
  };

  useEffect(() => {
    function saveSessionSnapshot() {
      const s = latestStatsRef.current;
      if (!s || s.durationSec < 5) return; // skip near-empty sessions
      const record = {
        id: sessionIdRef.current,
        date: new Date(startRef.current).toISOString(),
        avgSpeed: Math.round(s.avgSpeed * 10) / 10,
        maxSpeed: Math.round(s.maxSpeed * 10) / 10,
        successRate: s.successRate,
        durationSec: s.durationSec,
        pauseSec: Math.round(s.pauseSec),
        trickCount: s.trickCount,
        validatedCount: s.validatedCount,
        lastTrick: s.lastTrick,
      };
      setSessionHistory((prev) => {
        const next = [...prev.filter((r) => r.id !== record.id), record]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 30);
        (async () => {
          try {
            await window.storage.set("session-history", JSON.stringify(next), false);
          } catch (e) {
            // storage unavailable — history still applies for this session
          }
        })();
        return next;
      });
    }
    const iv = setInterval(saveSessionSnapshot, 20000);
    window.addEventListener("beforeunload", saveSessionSnapshot);
    return () => {
      clearInterval(iv);
      window.removeEventListener("beforeunload", saveSessionSnapshot);
      saveSessionSnapshot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const library = useMemo(() => {
    const byName = {};
    TRICKS.forEach((t) => (byName[t.name] = { name: t.name, landed: 0, best: 0, category: t.category }));
    validatedTricks.forEach((t) => {
      if (!byName[t.name]) byName[t.name] = { name: t.name, landed: 0, best: 0, category: "combo" };
      byName[t.name].landed += 1;
      byName[t.name].best = Math.max(byName[t.name].best, t.score);
    });
    return Object.values(byName);
  }, [validatedTricks]);

  const ranking = useMemo(() => {
    return [...bots, { name: "TOI", score: youScore, you: true, country: riderProfile.country }].sort(
      (a, b) => b.score - a.score
    );
  }, [bots, youScore, riderProfile.country]);

  const [rankingCountry, setRankingCountry] = useState("ALL");
  const filteredRanking = useMemo(() => {
    if (rankingCountry === "ALL") return ranking;
    return ranking.filter((r) => r.country === rankingCountry);
  }, [ranking, rankingCountry]);

  const youBestTrick = useMemo(() => {
    if (!validatedTricks.length) return { name: "—", score: 0 };
    return validatedTricks.reduce((a, b) => (b.score > a.score ? b : a), validatedTricks[0]);
  }, [validatedTricks]);

  const youBestAir = useMemo(
    () => (validatedTricks.length ? Math.max(...validatedTricks.map((t) => t.airtime)) : 0),
    [validatedTricks]
  );

  function openRiderProfile(r) {
    if (r.you) {
      setViewingRider({
        you: true,
        name: riderProfile.pseudo || "TOI",
        photo: riderProfile.profilePhoto,
        country: riderProfile.country,
        city: riderProfile.city,
        age: riderProfile.age || "—",
        heightCm: riderProfile.heightCm || "—",
        weightKg: riderProfile.weightKg || "—",
        stance: riderProfile.stance,
        score: r.score,
        maxSpeed: Math.round(maxSpeed * 10) / 10,
        bestTrick: youBestTrick,
        library,
      });
    } else {
      setViewingRider({
        you: false,
        name: r.name,
        photo: null,
        country: r.country,
        city: null,
        age: 18 + (r.name.length % 15),
        heightCm: 165 + (r.name.length % 25),
        weightKg: 55 + (r.name.length % 30),
        stance: r.name.length % 2 === 0 ? "goofy" : "regular",
        score: r.score,
        maxSpeed: r.maxSpeed,
        bestTrick: r.bestTrick,
      });
    }
  }

  const trickRanking = useMemo(() => {
    return [
      ...bots.map((b) => ({ name: b.name, value: b.bestTrick.score, sub: b.bestTrick.name })),
      { name: "TOI", value: youBestTrick.score, sub: youBestTrick.name, you: true },
    ].sort((a, b) => b.value - a.value);
  }, [bots, youBestTrick]);

  const speedRanking = useMemo(() => {
    return [
      ...bots.map((b) => ({ name: b.name, value: b.maxSpeed })),
      { name: "TOI", value: Math.round(maxSpeed * 10) / 10, you: true },
    ].sort((a, b) => b.value - a.value);
  }, [bots, maxSpeed]);

  const airRanking = useMemo(() => {
    return [
      ...bots.map((b) => ({ name: b.name, value: b.bestAir })),
      { name: "TOI", value: youBestAir, you: true },
    ].sort((a, b) => b.value - a.value);
  }, [bots, youBestAir]);

  const fmtDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf6ef",
        color: "#1a1330",
        fontFamily: MONO_FONT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes toastIn { from { transform: translateY(-16px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toastPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
      `}</style>

      {/* toast notifications */}
      <div style={{ position: "fixed", top: 10, left: 10, right: 10, zIndex: 100, display: "flex", flexDirection: "column", gap: 6 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: t.epic ? "14px 16px" : "10px 14px",
              borderRadius: 16,
              background: t.epic ? `linear-gradient(90deg, ${C.magenta}, ${C.yellow})` : C.panel,
              border: `2px solid ${t.epic ? "#fff" : C.cyan}`,
              color: t.epic ? "#1a1330" : C.text,
              fontFamily: t.epic ? DISPLAY_FONT : MONO_FONT,
              fontWeight: t.epic ? 900 : 400,
              fontSize: t.epic ? 14 : 12,
              boxShadow: t.epic ? `0 0 24px ${C.yellow}aa` : `0 0 10px ${C.cyan}55`,
              animation: t.epic ? "toastIn 0.3s ease-out, toastPulse 0.6s ease-in-out 0.3s 2" : "toastIn 0.25s ease-out",
              textAlign: "center",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* trick detail sheet */}
      {detailTrick && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4,5,13,0.85)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setDetailTrick(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              background: C.screen,
              color: C.text,
              borderRadius: "24px 24px 0 0",
              border: `2px solid ${C.cyan}`,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: 18, color: C.text }}>{detailTrick}</div>
              <button
                onClick={() => setDetailTrick(null)}
                style={{ ...arrowBtnStyle, width: 30, height: 30, fontSize: 14, color: C.text }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              <StatBox label="VALIDEES" value={(trickStats[detailTrick]?.validated || 0).toString()} unit="" color={C.green} />
              <StatBox label="RATEES" value={(trickStats[detailTrick]?.failed || 0).toString()} unit="" color={C.danger} />
              <StatBox label="JOURS TENTES" value={(trickStats[detailTrick]?.days?.length || 0).toString()} unit="" color={C.yellow} />
            </div>

            <div style={{ marginTop: 10 }}>
              <StatBox
                label="MEILLEUR SPOT"
                value={trickStats[detailTrick]?.bestSpot || "—"}
                unit={trickStats[detailTrick]?.bestScore ? `+${trickStats[detailTrick].bestScore}` : ""}
                color={C.magenta}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <FormField label="CE QUI BLOQUE POUR LA VALIDER">
                <textarea
                  value={trickNotes[detailTrick]?.blocker || ""}
                  onChange={(e) => saveTrickNotes(detailTrick, { blocker: e.target.value })}
                  placeholder="Ex: je n'ouvre pas assez les epaules, je freine la rotation..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </FormField>
            </div>

            <div style={{ marginTop: 12 }}>
              <FormField label="TUTO POUR Y ARRIVER">
                <textarea
                  value={trickNotes[detailTrick]?.tuto || ""}
                  onChange={(e) => saveTrickNotes(detailTrick, { tuto: e.target.value })}
                  placeholder="Notes, etapes, lien video..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* read-only rider profile viewer */}
      {viewingRider && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4,5,13,0.85)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setViewingRider(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              background: C.screen,
              color: C.text,
              borderRadius: "24px 24px 0 0",
              border: `2px solid ${C.cyan}`,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 0.5 }}>
                {viewingRider.you ? "PROFIL (LECTURE SEULE)" : "PROFIL SIMULE (LECTURE SEULE)"}
              </div>
              <button
                onClick={() => setViewingRider(null)}
                style={{ ...arrowBtnStyle, width: 30, height: 30, fontSize: 14, color: C.text }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: `2px solid ${C.cyan}`,
                  background: "#0a0e24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 900,
                  fontSize: 22,
                  color: C.textDim,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {viewingRider.photo ? (
                  <img
                    src={viewingRider.photo}
                    alt={viewingRider.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  viewingRider.name.charAt(0)
                )}
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: 16, color: C.text }}>
                  {NATIONS.find((n) => n.code === viewingRider.country)?.flag || ""} {viewingRider.name}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                  {viewingRider.city} · {NATIONS.find((n) => n.code === viewingRider.country)?.name || "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              <StatBox label="SCORE" value={`${viewingRider.score}`} unit="" color={C.magenta} />
              <StatBox label="AGE" value={`${viewingRider.age}`} unit="ans" color={C.cyan} />
              <StatBox
                label="STANCE"
                value={viewingRider.stance === "goofy" ? "GOOFY" : "REGULAR"}
                unit=""
                color={C.yellow}
              />
              <StatBox label="TAILLE" value={`${viewingRider.heightCm}`} unit="cm" color={C.textDim} />
              <StatBox label="POIDS" value={`${viewingRider.weightKg}`} unit="kg" color={C.textDim} />
              <StatBox label="VITESSE MAX" value={`${viewingRider.maxSpeed}`} unit="km/h" color={C.green} />
            </div>

            <div style={{ marginTop: 18 }}>
              <NeonTitle color={C.magenta} style={{ fontSize: 13 }}>
                BIBLIOTHEQUE
              </NeonTitle>
              {TRICK_CATEGORIES.filter((c) => c.id !== "combo").map((cat) => {
                const items = (viewingRider.you ? viewingRider.library : generateBotLibrary(viewingRider)).filter(
                  (l) => l.category === cat.id && l.landed > 0
                );
                if (!items.length) return null;
                return (
                  <div key={cat.id} style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, color: cat.color, letterSpacing: 0.5, marginBottom: 8 }}>{cat.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {items.map((l) => {
                        const mastery = getMasteryLevel(l.landed);
                        return (
                          <div
                            key={l.name}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              background: C.panel,
                              borderRadius: 12,
                              border: `1px solid ${C.panelLine}`,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{l.name}</div>
                              <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                                {l.landed} validee{l.landed > 1 ? "s" : ""}
                                {mastery ? ` · ${mastery.label}` : ""}
                              </div>
                            </div>
                            <div style={{ fontSize: 14, color: C.yellow }}>{l.best}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* past session detail — same layout as the live report */}
      {viewingSession && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4,5,13,0.85)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setViewingSession(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              background: C.screen,
              color: C.text,
              borderRadius: "24px 24px 0 0",
              border: `2px solid ${C.magenta}`,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: 16, color: C.text }}>
                {new Date(viewingSession.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                onClick={() => setViewingSession(null)}
                style={{ ...arrowBtnStyle, width: 30, height: 30, fontSize: 14, color: C.text }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              <StatBox label="VITESSE MOY." value={viewingSession.avgSpeed} unit="km/h" color={C.cyan} />
              <StatBox label="VITESSE MAX" value={viewingSession.maxSpeed} unit="km/h" color={C.magenta} />
              <StatBox label="DUREE TOTALE" value={fmtDuration(viewingSession.durationSec)} unit="" color={C.yellow} />
              <StatBox label="REUSSITE" value={`${viewingSession.successRate}`} unit="%" color={C.green} />
              <StatBox
                label="TEMPS ACTIF"
                value={fmtDuration(Math.max(0, viewingSession.durationSec - viewingSession.pauseSec))}
                unit=""
                color={C.cyan}
              />
              <StatBox label="TEMPS DE PAUSE" value={fmtDuration(viewingSession.pauseSec)} unit="" color={C.textDim} />
              <StatBox label="FIGURES VALIDEES" value={`${viewingSession.validatedCount}`} unit={`/${viewingSession.trickCount}`} color={C.magenta} />
              {viewingSession.lastTrick && (
                <StatBox
                  label="DERNIERE FIGURE"
                  value={viewingSession.lastTrick.name}
                  unit={viewingSession.lastTrick.validated ? `+${viewingSession.lastTrick.score}` : "ratee"}
                  color={viewingSession.lastTrick.validated ? C.green : C.danger}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div
        style={{
          padding: "20px 14px 16px",
          background: "#000",
          backgroundImage:
            "repeating-linear-gradient(60deg, rgba(255,255,255,0.09) 0 1.5px, transparent 1.5px 26px), repeating-linear-gradient(-60deg, rgba(200,200,200,0.07) 0 1.5px, transparent 1.5px 26px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px)",
          borderBottom: "3px solid #3a3a3a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <NeonTitle color={C.yellow} style={{ fontSize: 34, padding: "12px 30px" }}>
            RideAnalytic
          </NeonTitle>
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, padding: "0 14px", paddingBottom: 96 }}>
        {tab === "live" && (
          <div>
            <Live3DView
              custom={custom}
              telemetryRef={telemetryRef}
              connected={connected}
              usePhone={usePhone}
              phoneTiltRef={phoneTiltRef}
              stance={riderProfile.stance}
              esp32Status={esp32Status}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={usePhone ? disablePhoneSensors : enablePhoneSensors}
                style={{
                  padding: "8px 12px",
                  fontFamily: MONO_FONT,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  background: usePhone ? "#0a0e24" : "transparent",
                  color: usePhone ? C.magenta : C.cyan,
                  border: `2px solid ${usePhone ? C.magenta : C.cyan}`,
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                {usePhone ? "DESACTIVER CAPTEURS TEL." : "UTILISER LES CAPTEURS DU TEL."}
              </button>
              <span style={{ fontSize: 10, color: C.textDim }}>
                {sensorStatus === "requesting" && "Autorisation en cours..."}
                {sensorStatus === "denied" && "Permission refusee par le navigateur."}
                {sensorStatus === "unsupported" && "Capteurs non disponibles ici."}
                {sensorStatus === "granted" && usePhone && "Bouge ton telephone pour piloter le skateur."}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
              <StatBox
                label={usePhone ? "INTENSITE" : "VITESSE"}
                value={`${speed.toFixed(1)}`}
                unit={usePhone ? "m/s²" : "km/h"}
                color={C.cyan}
              />
              <StatBox label="DUREE" value={fmtDuration(durationSec)} unit="" color={C.yellow} />
              <StatBox label="FIGURES" value={`${validatedTricks.length}`} unit={`/${tricks.length}`} color={C.magenta} />
            </div>

            <NeonPanel color={C.panelLine} style={{ marginTop: 12, padding: "12px 8px 4px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={speedLog}>
                  <CartesianGrid stroke={C.panelLine} strokeDasharray="2 4" />
                  <XAxis dataKey="t" stroke={C.textDim} fontSize={10} tickFormatter={(v) => `${v}s`} />
                  <YAxis stroke={C.textDim} fontSize={10} />
                  <Tooltip contentStyle={{ background: C.screen, border: `1px solid ${C.cyan}`, fontSize: 11 }} labelFormatter={(v) => `${v}s`} />
                  <Line type="monotone" dataKey="speed" stroke={C.cyan} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </NeonPanel>
          </div>
        )}

        {tab === "tricks" && (
          <div>
            <NeonTitle color={C.magenta}>BIBLIOTHEQUE</NeonTitle>

            <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
              {TRICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFigCategory(cat.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "8px 2px",
                    fontFamily: MONO_FONT,
                    fontSize: 9,
                    letterSpacing: 0.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    background: figCategory === cat.id ? cat.color : "transparent",
                    color: figCategory === cat.id ? "#1a1330" : "#4a3d7a",
                    border: `2px solid ${figCategory === cat.id ? cat.color : C.panelLine}`,
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {TRICK_CATEGORIES.map((cat) => {
              if (cat.id !== figCategory) return null;
              const items = library.filter((l) => l.category === cat.id);
              if (!items.length) {
                return (
                  <div key={cat.id} style={{ marginTop: 18, fontSize: 12, color: C.textDim }}>
                    Pas encore de figure dans cette categorie.
                  </div>
                );
              }
              return (
                <div key={cat.id} style={{ marginTop: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    {items.map((l) => (
                <NeonPanel
                  key={l.name}
                  color={l.landed ? C.yellow : C.panelLine}
                  style={{
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    opacity: l.landed ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 110,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: `1px solid ${C.panelLine}`,
                      background: "#241c40",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {customPhotos[l.name] ? (
                      <img
                        src={customPhotos[l.name]}
                        alt={l.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <TrickIcon category={l.category} accent={l.landed ? C.yellow : C.cyan} size={92} />
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{l.name}</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                      {l.category.toUpperCase()} · {l.landed} validee{l.landed > 1 ? "s" : ""}
                    </div>
                    {getMasteryLevel(l.landed) && (
                      <div
                        style={{
                          display: "inline-block",
                          marginTop: 5,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          color: "#1a1330",
                          background: getMasteryLevel(l.landed).color,
                        }}
                      >
                        {getMasteryLevel(l.landed).label}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 20, color: l.landed ? C.yellow : C.textDim, fontFamily: DISPLAY_FONT, fontWeight: 900 }}>
                    {l.best || "—"}
                  </div>

                  {editingTrick === l.name ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        value={photoDraft}
                        onChange={(e) => setPhotoDraft(e.target.value)}
                        placeholder="Lien d'image (URL)"
                        style={{
                          background: "#0a0e24",
                          border: `2px solid ${C.cyan}`,
                          borderRadius: 12,
                          color: C.text,
                          fontSize: 11,
                          padding: "6px 8px",
                          fontFamily: MONO_FONT,
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            const next = { ...customPhotos, [l.name]: photoDraft.trim() };
                            if (!photoDraft.trim()) delete next[l.name];
                            saveCustomPhotos(next);
                            setEditingTrick(null);
                            setPhotoDraft("");
                          }}
                          style={{ ...arrowBtnStyle, flex: 1, width: "auto", padding: "6px 0", fontSize: 11, color: C.green, border: `1px solid ${C.green}` }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setEditingTrick(null);
                            setPhotoDraft("");
                          }}
                          style={{ ...arrowBtnStyle, flex: 1, width: "auto", padding: "6px 0", fontSize: 11 }}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        onClick={() => {
                          setEditingTrick(l.name);
                          setPhotoDraft(customPhotos[l.name] || "");
                        }}
                        style={{
                          background: "none",
                          border: `2px solid ${C.panelLine}`,
                          borderRadius: 999,
                          color: C.textDim,
                          fontSize: 9,
                          padding: "5px 6px",
                          cursor: "pointer",
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {customPhotos[l.name] ? "MODIFIER PHOTO" : "AJOUTER MA PHOTO"}
                      </button>
                      {customPhotos[l.name] && (
                        <button
                          onClick={() => {
                            const next = { ...customPhotos };
                            delete next[l.name];
                            saveCustomPhotos(next);
                          }}
                          style={{
                            background: "none",
                            border: `2px solid ${C.panelLine}`,
                            borderRadius: 999,
                            color: C.textDim,
                            fontSize: 9,
                            padding: "5px 6px",
                            cursor: "pointer",
                            fontFamily: MONO_FONT,
                          }}
                        >
                          RETIRER
                        </button>
                      )}
                      <button
                        onClick={() => setDetailTrick(l.name)}
                        style={{
                          background: "none",
                          border: `2px solid ${C.cyan}`,
                          borderRadius: 999,
                          color: C.cyan,
                          fontSize: 9,
                          padding: "5px 6px",
                          cursor: "pointer",
                          fontFamily: MONO_FONT,
                        }}
                      >
                        FICHE INFO
                      </button>
                    </div>
                  )}
                </NeonPanel>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {tab === "stats" && (
          <div>
            <NeonTitle color={C.cyan}>RAPPORT D'ACTIVITE</NeonTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <StatBox label="VITESSE MOY." value={avgSpeed.toFixed(1)} unit="km/h" color={C.cyan} />
              <StatBox label="VITESSE MAX" value={maxSpeed.toFixed(1)} unit="km/h" color={C.magenta} />
              <StatBox label="DUREE TOTALE" value={fmtDuration(durationSec)} unit="" color={C.yellow} />
              <StatBox label="REUSSITE" value={`${successRate}`} unit="%" color={C.green} />
              <StatBox label="TEMPS ACTIF" value={fmtDuration(Math.max(0, durationSec - Math.round(pauseSec)))} unit="" color={C.cyan} />
              <StatBox label="TEMPS DE PAUSE" value={fmtDuration(Math.round(pauseSec))} unit="" color={C.textDim} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 10, borderRadius: 999, background: C.panel, overflow: "hidden", display: "flex", border: `1px solid ${C.panelLine}` }}>
                <div
                  style={{
                    width: `${durationSec ? Math.min(100, ((durationSec - pauseSec) / durationSec) * 100) : 0}%`,
                    background: C.cyan,
                  }}
                />
                <div
                  style={{
                    width: `${durationSec ? Math.min(100, (pauseSec / durationSec) * 100) : 0}%`,
                    background: C.textDim,
                  }}
                />
              </div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 4, textAlign: "center" }}>
                ACTIF vs PAUSE sur la duree totale de la session
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <NeonTitle color={C.yellow} style={{ fontSize: 10 }}>DERNIERE FIGURE</NeonTitle>
            </div>
            {tricks[0] ? (
              <>
                <div style={{ marginTop: 8 }}>
                  <TrickReplayView trick={tricks[0]} custom={custom} stance={riderProfile.stance} />
                </div>
                <TrickTicker trick={tricks[0]} />
              </>
            ) : (
              <div style={{ color: C.textDim, fontSize: 12, marginTop: 8 }}>En attente de la premiere figure...</div>
            )}

            <div style={{ marginTop: 18 }}>
              <NeonTitle color={C.cyan} style={{ fontSize: 10 }}>HISTORIQUE SESSION</NeonTitle>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {tricks.slice(0, 20).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    padding: "6px 10px",
                    background: C.panel,
                    borderRadius: 12,
                    borderLeft: `4px solid ${t.validated ? C.green : C.danger}`,
                  }}
                >
                  <span>{t.name}</span>
                  <span style={{ color: t.validated ? C.green : C.danger }}>
                    {t.validated ? `VALIDEE +${t.score}` : "RATEE"}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <NeonTitle color={C.magenta} style={{ fontSize: 10 }}>SESSIONS PRECEDENTES</NeonTitle>
            </div>
            {sessionHistory.filter((s) => s.id !== sessionIdRef.current).length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {sessionHistory
                  .filter((s) => s.id !== sessionIdRef.current)
                  .map((s) => (
                    <NeonPanel
                      key={s.id}
                      color={C.panelLine}
                      onClick={() => setViewingSession(s)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                          {new Date(s.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div style={{ fontSize: 10, color: "#a89bd6", marginTop: 2 }}>
                          {fmtDuration(s.durationSec)} · {s.validatedCount}/{s.trickCount} figures
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: C.cyan }}>{s.maxSpeed} km/h max</div>
                    </NeonPanel>
                  ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>
                Pas encore d'autre session enregistree.
              </div>
            )}
          </div>
        )}

        {tab === "spots" && (
          <div>
            <NeonTitle color={C.yellow}>CARTOGRAPHIE DES SPOTS</NeonTitle>

            {geoStatus === "granted" ? (
              <>
                <div style={{ marginTop: 12 }}>
                  <NeonPanel color={C.panelLine} style={{ padding: 6 }}>
                    <SpotsMap baseGeo={baseGeo} playerGeo={geoPos} spotsGeo={spotsGeo} namedSpots={namedSpots} />
                  </NeonPanel>
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 8 }}>
                  Position de reference reelle captee une fois ; le deplacement autour est simule pour la demo. Les
                  spots sont ancres a de vraies coordonnees GPS.
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0 14px", flexWrap: "wrap" }}>
                  <button
                    onClick={enableLocation}
                    style={{
                      padding: "8px 14px",
                      fontFamily: MONO_FONT,
                      fontSize: 11,
                      background: "transparent",
                      color: C.cyan,
                      border: `2px solid ${C.cyan}`,
                      borderRadius: 999,
                      cursor: "pointer",
                    }}
                  >
                    ACTIVER LA LOCALISATION
                  </button>
                  <span style={{ fontSize: 10, color: C.textDim }}>
                    {geoStatus === "requesting" && "Autorisation en cours..."}
                    {geoStatus === "denied" && "Permission refusee — carte abstraite affichee."}
                    {geoStatus === "unsupported" && "Localisation indisponible ici."}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textDim, margin: "0 0 14px" }}>
                  Carte de secours (grille abstraite) tant que la localisation n'est pas activee.
                </div>
                <NeonPanel color={C.panelLine} style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3, padding: 8 }}>
                  {Array.from({ length: 64 }).map((_, i) => {
                    const gx = i % 8;
                    const gy = Math.floor(i / 8);
                    const count = spots[`${gx},${gy}`] || 0;
                    const isPlayer = gx === Math.floor(pos.x) && gy === Math.floor(pos.y);
                    const heat = Math.min(1, count / 5);
                    return (
                      <div
                        key={i}
                        style={{
                          aspectRatio: "1",
                          borderRadius: 8,
                          background: count ? `rgba(255,61,129,${0.2 + heat * 0.7})` : "#1a1330",
                          border: isPlayer ? `2px solid ${C.cyan}` : "1px solid #4a3d7a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: C.text,
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </NeonPanel>
              </>
            )}

            {/* find or add a named spot by postal code or spot name */}
            <div style={{ marginTop: 22 }}>
              <NeonTitle color={C.magenta} style={{ fontSize: 13 }}>
                TROUVER MON SPOT
              </NeonTitle>
              <NeonPanel color={C.panelLine} style={{ padding: 14, marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={spotSearchQuery}
                    onChange={(e) => setSpotSearchQuery(e.target.value)}
                    placeholder="Code postal ou nom du spot"
                    style={{ ...inputStyle, flex: 1 }}
                    onKeyDown={(e) => e.key === "Enter" && searchSpotLocation()}
                  />
                  <button
                    onClick={searchSpotLocation}
                    style={{ ...arrowBtnStyle, width: "auto", padding: "0 14px", fontSize: 11, color: C.cyan, border: `2px solid ${C.cyan}` }}
                  >
                    CHERCHER
                  </button>
                </div>
                <div style={{ fontSize: 10, color: C.textDim }}>
                  {spotSearchStatus === "searching" && "Recherche en cours..."}
                  {spotSearchStatus === "notfound" && "Aucun lieu trouve — essaie un nom plus precis."}
                  {spotSearchStatus === "error" && "Recherche indisponible pour le moment."}
                </div>

                {spotSearchResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${C.panelLine}`, paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.text }}>{spotSearchResult.displayName}</div>
                    <FormField label="NOM DU SPOT">
                      <input value={newSpotName} onChange={(e) => setNewSpotName(e.target.value)} style={inputStyle} />
                    </FormField>
                    <FormField label="PHOTO DU SPOT (URL, optionnel)">
                      <input
                        value={newSpotPhoto}
                        onChange={(e) => setNewSpotPhoto(e.target.value)}
                        placeholder="Lien d'image"
                        style={inputStyle}
                      />
                    </FormField>
                    <button
                      onClick={saveNamedSpot}
                      style={{
                        ...arrowBtnStyle,
                        width: "auto",
                        padding: "8px 0",
                        fontSize: 11,
                        color: C.green,
                        border: `2px solid ${C.green}`,
                      }}
                    >
                      ENREGISTRER CE SPOT
                    </button>
                  </div>
                )}
              </NeonPanel>

              {namedSpots.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {namedSpots.map((s) => (
                    <NeonPanel
                      key={s.id}
                      color={C.panelLine}
                      style={{ padding: 10, display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          overflow: "hidden",
                          background: "#0a0e24",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 18 }}>📍</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 9, color: C.textDim }}>
                          {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNamedSpot(s.id)}
                        style={{ background: "none", border: `2px solid ${C.panelLine}`, borderRadius: 999, color: C.textDim, fontSize: 9, padding: "5px 8px", cursor: "pointer", fontFamily: MONO_FONT }}
                      >
                        RETIRER
                      </button>
                    </NeonPanel>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "garage" && (
          <div>
            <NeonTitle color={C.green}>PROFIL</NeonTitle>
            <div style={{ marginTop: 12 }}>
              <GaragePreview custom={custom} stance={riderProfile.stance} />
            </div>

            <div style={{ marginTop: 20 }}>
              <NeonTitle color={C.magenta} style={{ fontSize: 13 }}>
                MATERIEL
              </NeonTitle>

              <div style={{ marginTop: 12 }}>
                <FormField label="PREFERENCE DE RIDE">
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => updateRiderProfile({ stance: "goofy" })}
                      style={pillToggleStyle(riderProfile.stance === "goofy")}
                    >
                      GOOFY (pied droit devant)
                    </button>
                    <button
                      onClick={() => updateRiderProfile({ stance: "regular" })}
                      style={pillToggleStyle(riderProfile.stance === "regular")}
                    >
                      REGULAR (pied droit derriere)
                    </button>
                  </div>
                </FormField>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                {GARAGE_TABS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGarageTab(g.id)}
                    style={{
                      flex: "1 1 auto",
                      padding: "8px 10px",
                      fontFamily: MONO_FONT,
                      fontSize: 12,
                      letterSpacing: 1,
                      background: garageTab === g.id ? "#0a0e24" : "transparent",
                      color: garageTab === g.id ? C.yellow : C.textDim,
                      border: `1px solid ${garageTab === g.id ? C.magenta : C.panelLine}`,
                      borderRadius: 999,
                      cursor: "pointer",
                      boxShadow: garageTab === g.id ? `0 0 8px ${C.magenta}66` : "none",
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                {GARAGE_TABS.filter((g) => g.id === garageTab).map((g) => (
                  <CarouselPicker
                    key={g.id}
                    items={g.items}
                    index={idx[g.id]}
                    onChange={(i) => setIdx((s) => ({ ...s, [g.id]: i }))}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <NeonTitle color={C.cyan} style={{ fontSize: 13 }}>
                INFOS RIDER
              </NeonTitle>
              <NeonPanel color={C.panelLine} style={{ padding: 14, marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `2px solid ${C.cyan}`,
                      background: "#0a0e24",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {riderProfile.profilePhoto ? (
                      <img
                        src={riderProfile.profilePhoto}
                        alt="profil"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 22, color: C.textDim }}>?</span>
                    )}
                  </div>
                  {editingProfilePhoto ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <input
                        value={profilePhotoDraft}
                        onChange={(e) => setProfilePhotoDraft(e.target.value)}
                        placeholder="Lien d'image (URL)"
                        style={inputStyle}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            updateRiderProfile({ profilePhoto: profilePhotoDraft.trim() });
                            setEditingProfilePhoto(false);
                          }}
                          style={{ ...arrowBtnStyle, flex: 1, width: "auto", padding: "6px 0", fontSize: 11, color: C.green, border: `1px solid ${C.green}` }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingProfilePhoto(false)}
                          style={{ ...arrowBtnStyle, flex: 1, width: "auto", padding: "6px 0", fontSize: 11 }}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setProfilePhotoDraft(riderProfile.profilePhoto || "");
                        setEditingProfilePhoto(true);
                      }}
                      style={{
                        background: "none",
                        border: `2px solid ${C.panelLine}`,
                        borderRadius: 999,
                        color: C.textDim,
                        fontSize: 10,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {riderProfile.profilePhoto ? "MODIFIER PHOTO" : "AJOUTER MA PHOTO"}
                    </button>
                  )}
                </div>

                <FormField label="PSEUDO">
                  <input
                    value={riderProfile.pseudo}
                    onChange={(e) => updateRiderProfile({ pseudo: e.target.value })}
                    placeholder="Ton blaze"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="GENRE">
                  <div style={{ display: "flex", gap: 6 }}>
                    {["Homme", "Femme", "Autre"].map((g) => (
                      <button
                        key={g}
                        onClick={() => updateRiderProfile({ gender: g })}
                        style={pillToggleStyle(riderProfile.gender === g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div style={{ display: "flex", gap: 10 }}>
                  <FormField label="TAILLE (CM)" style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={riderProfile.heightCm}
                      onChange={(e) => updateRiderProfile({ heightCm: e.target.value })}
                      placeholder="175"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="POIDS (KG)" style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={riderProfile.weightKg}
                      onChange={(e) => updateRiderProfile({ weightKg: e.target.value })}
                      placeholder="68"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="AGE" style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={riderProfile.age}
                      onChange={(e) => updateRiderProfile({ age: e.target.value })}
                      placeholder="24"
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <FormField label="VILLE" style={{ flex: 1 }}>
                    <input
                      value={riderProfile.city}
                      onChange={(e) => updateRiderProfile({ city: e.target.value })}
                      placeholder="Ta ville"
                      style={inputStyle}
                    />
                  </FormField>
                  <FormField label="PAYS" style={{ flex: 1 }}>
                    <select
                      value={riderProfile.country}
                      onChange={(e) => updateRiderProfile({ country: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Choisir...</option>
                      {NATIONS.map((n) => (
                        <option key={n.code} value={n.code}>
                          {n.flag} {n.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </NeonPanel>
            </div>
          </div>
        )}

        {tab === "ranking" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <NeonTitle color={C.yellow}>CLASSEMENT</NeonTitle>
              <NeonTitle color={C.cyan} style={{ fontSize: 12 }}>
                EUROPEEN
              </NeonTitle>
            </div>

            <div style={{ marginTop: 12 }}>
              <FormField label="FILTRER PAR PAYS">
                <select value={rankingCountry} onChange={(e) => setRankingCountry(e.target.value)} style={inputStyle}>
                  <option value="ALL">🌍 Tous les pays (Europeen)</option>
                  {NATIONS.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.flag} {n.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* podium — top 3 (filtered) */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginTop: 18, marginBottom: 20 }}>
              {[filteredRanking[1], filteredRanking[0], filteredRanking[2]].map((r, idx) => {
                if (!r) return <div key={idx} style={{ flex: 1 }} />;
                const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                const height = place === 1 ? 108 : place === 2 ? 82 : 62;
                const color = place === 1 ? C.yellow : place === 2 ? "#d7d7e8" : "#e0a361";
                const emblem = place === 1 ? "🏆" : place === 2 ? "🥈" : "🥉";
                return (
                  <div key={r.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: place === 1 ? 30 : 24 }}>{emblem}</div>
                    <div
                      onClick={() => openRiderProfile(r)}
                      style={{
                        width: place === 1 ? 52 : 42,
                        height: place === 1 ? 52 : 42,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: `3px solid ${color}`,
                        boxShadow: `0 0 10px ${color}aa`,
                        background: "#0a0e24",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {r.you && riderProfile.profilePhoto ? (
                        <img
                          src={riderProfile.profilePhoto}
                          alt={r.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: 16, color: C.text }}>
                          {r.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: r.you ? C.magenta : "#1a1330" }}>
                      {NATIONS.find((n) => n.code === r.country)?.flag || ""} {r.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#4a3d7a" }}>{r.score}</div>
                    <div
                      style={{
                        width: "100%",
                        height,
                        borderRadius: "14px 14px 0 0",
                        background: color,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingTop: 8,
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 900,
                        fontSize: 20,
                        color: "#1a1330",
                        boxShadow: `0 0 16px ${color}88`,
                      }}
                    >
                      {place}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredRanking.map((r, i) => (
                <NeonPanel
                  key={r.name}
                  color={r.you ? C.yellow : C.panelLine}
                  onClick={() => openRiderProfile(r)}
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: r.you ? "#3d3419" : C.panel,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 900,
                        fontSize: 13,
                        color: i === 0 ? C.yellow : i === 1 ? "#c9c9c9" : i === 2 ? "#cd7f32" : "#a89bd6",
                        width: 26,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: r.you ? 700 : 400 }}>
                      {NATIONS.find((n) => n.code === r.country)?.flag || ""} {r.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: C.magenta }}>{r.score}</span>
                </NeonPanel>
              ))}
            </div>

            {/* category leaderboards */}
            <CategoryBoard
              title="MEILLEURE FIGURE VALIDEE SUR UN SPOT"
              color={C.cyan}
              rows={trickRanking}
              unit=""
              onSelect={(name) => {
                const r = ranking.find((x) => x.name === name);
                if (r) openRiderProfile(r);
              }}
            />
            <CategoryBoard
              title="LE PLUS RAPIDE"
              color={C.magenta}
              rows={speedRanking}
              unit=" km/h"
              onSelect={(name) => {
                const r = ranking.find((x) => x.name === name);
                if (r) openRiderProfile(r);
              }}
            />
            <CategoryBoard
              title="LE PLUS HAUT (AIRTIME)"
              color={C.yellow}
              rows={airRanking}
              unit=" ms"
              onSelect={(name) => {
                const r = ranking.find((x) => x.name === name);
                if (r) openRiderProfile(r);
              }}
            />
          </div>
        )}
      </div>

      {/* bottom nav — rounded floating jam bar */}
      <div
        style={{
          position: "fixed",
          bottom: 10,
          left: 10,
          right: 10,
          background: "#241c40",
          borderRadius: 26,
          border: `2px solid ${C.cyan}`,
          boxShadow: `0 4px 14px rgba(0,0,0,0.25)`,
          zIndex: 60,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", padding: 6, gap: 4 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                background: tab === id ? C.magenta : "none",
                border: "none",
                borderRadius: 999,
                padding: "8px 2px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
                color: tab === id ? "#fff" : C.textDim,
              }}
            >
              <Icon size={16} />
              <span style={{ fontSize: 9, letterSpacing: 0.5 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBoard({ title, color, rows, unit, onSelect }) {
  return (
    <div style={{ marginTop: 22 }}>
      <NeonTitle color={color} style={{ fontSize: 13 }}>
        {title}
      </NeonTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
        {rows.map((r, i) => (
          <div
            key={r.name}
            onClick={() => onSelect && onSelect(r.name)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 12px",
              borderRadius: 12,
              background: r.you ? "#3d3419" : C.panel,
              border: `1px solid ${r.you ? C.yellow : C.panelLine}`,
              color: C.text,
              cursor: onSelect ? "pointer" : "default",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "#a89bd6", width: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: r.you ? 700 : 400 }}>{r.name}</span>
              {r.sub && <span style={{ fontSize: 9, color: "#a89bd6" }}>({r.sub})</span>}
            </div>
            <span style={{ fontSize: 13, color }}>
              {r.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, color }) {
  return (
    <NeonPanel color={color} style={{ padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, color, marginTop: 2, textShadow: `0 0 8px ${color}66` }}>
        {value}
        <span style={{ fontSize: 11, color: C.textDim }}> {unit}</span>
      </div>
    </NeonPanel>
  );
}

function TrickTicker({ trick }) {
  const color = trick.validated ? C.green : C.danger;
  return (
    <NeonPanel color={color} style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
      <div>
        <div style={{ fontFamily: DISPLAY_FONT, fontSize: 13, color: C.text }}>{trick.name}</div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
          AIR {trick.airtime}ms · ROT {trick.rotationDeg}° · CLEAN {Math.round(trick.clean * 100)}%
        </div>
      </div>
      <div style={{ fontSize: 22, color, textShadow: `0 0 10px ${color}` }}>{trick.validated ? `+${trick.score}` : "X"}</div>
    </NeonPanel>
  );
}
