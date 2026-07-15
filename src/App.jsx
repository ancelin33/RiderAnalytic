import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Wifi,
  WifiOff,
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
    3D PROCEDURAL BUILDERS
--------------------------------------------------------- */
function makeFaceTexture(skinColor) {
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = 128;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#3a2416";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(36, 46); ctx.lineTo(56, 44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(72, 44); ctx.lineTo(92, 46); ctx.stroke();
  return new THREE.CanvasTexture(cnv);
}

function makeDeckGeometry(width, length, thickness, radius) {
  const w = width / 2; const l = length / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -l + radius); shape.lineTo(-w, l - radius);
  shape.quadraticCurveTo(-w, l, -w + radius, l); shape.lineTo(w - radius, l);
  shape.quadraticCurveTo(w, l, w, l - radius); shape.lineTo(w, -l + radius);
  shape.quadraticCurveTo(w, -l, w - radius, -l); shape.lineTo(-w + radius, -l);
  shape.quadraticCurveTo(-w, -l, -w, -l + radius);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -thickness / 2, 0);
  return geo;
}

function makeRoundedBoxGeometry(width, depth, height, radius) {
  const w = width / 2; const d = depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -d + radius); shape.lineTo(-w, d - radius);
  shape.quadraticCurveTo(-w, d, -w + radius, d); shape.lineTo(w - radius, d);
  shape.quadraticCurveTo(w, d, w, d - radius); shape.lineTo(w, -d + radius);
  shape.quadraticCurveTo(w, -d, w - radius, -d); shape.lineTo(-w + radius, -d);
  shape.quadraticCurveTo(-w, -d, -w, -d + radius);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -height / 2, 0);
  return geo;
}

function addHairstyle(hips, style, hairMat, shadowAll) {
  if (style === "chauve") return;
  if (style === "buzz") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), hairMat));
    cap.position.set(0, 0.465, 0.015); hips.add(cap); return;
  }
  if (style === "long") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.083, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat));
    cap.position.set(0, 0.465, 0.015); hips.add(cap);
    const back = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.17, 0.045), hairMat));
    back.position.set(0, 0.36, -0.05); hips.add(back); return;
  }
  if (style === "mohawk") {
    const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.079, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.32), hairMat));
    cap.position.set(0, 0.472, 0.015); hips.add(cap);
    const ridge = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.075, 0.13), hairMat));
    ridge.position.set(0, 0.535, 0.02); hips.add(ridge); return;
  }
  if (style === "casquette") {
    const dome = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.086, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat));
    dome.position.set(0, 0.468, 0.015); hips.add(dome);
    const brim = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7), hairMat));
    brim.rotation.x = Math.PI / 2; brim.position.set(0, 0.432, 0.088); hips.add(brim); return;
  }
  if (style === "bonnet") {
    const dome = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat));
    dome.position.set(0, 0.46, 0.015); hips.add(dome);
    const brimRing = shadowAll(new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.012, 8, 20), hairMat));
    brimRing.rotation.x = Math.PI / 2; brimRing.position.set(0, 0.408, 0.015); hips.add(brimRing); return;
  }
  const cap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat));
  cap.position.set(0, 0.465, 0.015); hips.add(cap);
}

function buildSkateRig(custom, stance = "regular") {
  const group = new THREE.Group();
  const shadowAll = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
  const board = new THREE.Group(); board.position.z = 0; group.add(board);

  const deckMat = new THREE.MeshStandardMaterial({ color: custom.deck, roughness: 0.5, emissive: custom.deck, emissiveIntensity: 0.1 });
  const deck = shadowAll(new THREE.Mesh(makeDeckGeometry(0.22, 0.9, 0.03, 0.09), deckMat));
  deck.position.y = 0.06; board.add(deck);

  const grip = shadowAll(new THREE.Mesh(makeDeckGeometry(0.215, 0.89, 0.006, 0.088), new THREE.MeshStandardMaterial({ color: custom.grip, roughness: 0.95 })));
  grip.position.y = 0.077; board.add(grip);

  const wheelMat = new THREE.MeshStandardMaterial({ color: custom.wheels, roughness: 0.3, emissive: custom.wheels, emissiveIntensity: 0.12 });
  const truckMat = new THREE.MeshStandardMaterial({ color: custom.trucks, roughness: 0.4, metalness: 0.7 });
  
  [0.32, -0.32].forEach(z => {
    const truck = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.05), truckMat));
    truck.position.set(0, 0.03, z); board.add(truck);
    [0.1, -0.1].forEach(x => {
      const wheel = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), wheelMat));
      wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.02, z); board.add(wheel);
    });
  });

  const skinTone = custom.skin;
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: custom.shirt, roughness: 0.55, emissive: custom.shirt, emissiveIntensity: 0.08 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: custom.pants, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: custom.shoes || "#151515", roughness: 0.5 });
  const shoeSoleMat = new THREE.MeshStandardMaterial({ color: "#e7e7e7", roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: custom.hair, roughness: 0.6 });

  const hips = new THREE.Group(); hips.scale.set(1.4, 1.4, 1.4); hips.position.set(0, 0.76, 0); group.add(hips);
  const waist = shadowAll(new THREE.Mesh(makeRoundedBoxGeometry(0.19, 0.13, 0.14, 0.03), pantsMat)); waist.position.set(0, 0.07, 0); hips.add(waist);
  const chest = shadowAll(new THREE.Mesh(makeRoundedBoxGeometry(0.2, 0.14, 0.22, 0.035), shirtMat)); chest.position.set(0, 0.24, 0.015); hips.add(chest);
  const neck = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 8), skinMat)); neck.position.set(0, 0.37, 0.02); hips.add(neck);
  const head = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.078, 20, 20), skinMat)); head.position.set(0, 0.44, 0.02); head.material = new THREE.MeshStandardMaterial({ map: makeFaceTexture(skinTone), roughness: 0.8 }); hips.add(head);

  [-1, 1].forEach(s => {
    const eye = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), new THREE.MeshStandardMaterial({ color: "#1c1410", roughness: 0.4 })));
    eye.position.set(s * 0.03, 0.455, 0.088); hips.add(eye);
  });
  const nose = shadowAll(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 8), skinMat)); nose.position.set(0, 0.435, 0.09); nose.rotation.x = Math.PI / 2; hips.add(nose);
  const mouth = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.01), new THREE.MeshStandardMaterial({ color: "#7a3d2c", roughness: 0.6 }))); mouth.position.set(0, 0.405, 0.086); hips.add(mouth);
  [-1, 1].forEach(s => {
    const ear = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), skinMat)); ear.scale.set(0.6, 1, 1); ear.position.set(s * 0.078, 0.44, 0.015); hips.add(ear);
  });

  addHairstyle(hips, custom.hairstyle || "court", hairMat, shadowAll);

  const frontSide = stance === "goofy" ? -1 : 1;
  const baseHipAngle = -0.3; const kneeAngle = 0.55; const stanceLean = 0.4;

  [-1, 1].forEach(side => {
    const isFront = side === frontSide;
    const hipZ = isFront ? 0.06 : -0.06;
    const hipAngle = baseHipAngle + (isFront ? -stanceLean : stanceLean);
    const ankleAngle = -(hipAngle + kneeAngle);

    const hipPivot = new THREE.Group(); hipPivot.position.set(side * 0.1, 0, hipZ); hipPivot.rotation.x = hipAngle; hips.add(hipPivot);
    const hipCap = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), pantsMat)); hipPivot.add(hipCap);
    const thigh = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.22, 10), pantsMat)); thigh.position.set(0, -0.11, 0); thigh.rotation.y = isFront ? Math.PI / 2 : -Math.PI / 2; hipPivot.add(thigh);

    const kneePivot = new THREE.Group(); kneePivot.position.set(0, -0.22, 0); kneePivot.rotation.x = kneeAngle; hipPivot.add(kneePivot);
    const shadowCyl = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.22, 10), pantsMat)); shadowCyl.position.set(0, -0.11, 0); shadowCyl.rotation.y = isFront ? Math.PI / 2 : -Math.PI / 2; kneePivot.add(shadowCyl);

    const anklePivot = new THREE.Group(); anklePivot.position.set(0, -0.22, 0); anklePivot.rotation.x = ankleAngle; kneePivot.add(anklePivot);
    const shoe = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.16), shoeMat)); shoe.position.set(0, -0.03, 0); shoe.rotation.y = side * (Math.PI / 2) - Math.PI / 2; anklePivot.add(shoe);
    const sole = shadowAll(new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.012, 0.165), shoeSoleMat)); sole.position.set(0, -0.055, 0); sole.rotation.y = side * (Math.PI / 2) - Math.PI / 2; anklePivot.add(sole);
  });

  [-1, 1].forEach(side => {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.115, 0.32, 0.01); shoulder.rotation.z = side * 0.55; hips.add(shoulder);
    const upperArm = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.16, 8), shirtMat)); upperArm.position.set(0, -0.08, 0); shoulder.add(upperArm);
    const elbow = new THREE.Group(); elbow.position.set(0, -0.16, 0); elbow.rotation.x = -0.55; shoulder.add(elbow);
    const forearm = shadowAll(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.15, 8), skinMat)); forearm.position.set(0, -0.075, 0); elbow.add(forearm);
    const hand = shadowAll(new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), skinMat)); hand.position.set(0, -0.155, 0); elbow.add(hand);
  });

  group.position.y = 0.05;
  return group;
}

function makeGroundTexture() {
  const size = 256; const cnv = document.createElement("canvas"); cnv.width = cnv.height = size; const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#0e1024"; ctx.fillRect(0, 0, size, size); ctx.strokeStyle = "#1fe6ff33"; ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cnv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(10, 10);
  return tex;
}

/* ---------------------------------------------------------
    LIVE 3D VIEW (Main Screen Component)
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
    dir.position.set(3, 5, 2); dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: makeGroundTexture(), roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    const rig = buildSkateRig(custom, stance);
    rig.rotation.y = Math.PI; scene.add(rig);

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
      
      // Utilisation directe des angles de l'ESP32 s'il est connecté, sinon fallback démo/téléphone
      let targetPitch = tm.pitch;
      let targetRoll = tm.roll;

      if (esp32Status !== "connected") {
        if (usePhone) {
          const tilt = phoneTiltRef.current;
          targetPitch = THREE.MathUtils.clamp((tilt.beta * Math.PI) / 180, -0.6, 0.6) * 0.4;
          targetRoll = THREE.MathUtils.clamp((tilt.gamma * Math.PI) / 180, -0.6, 0.6) * 0.4;
        } else {
          targetPitch = Math.sin(clock.elapsedTime * 1.6) * 0.03 * (0.4 + tm.speed / 25);
          targetRoll = Math.sin(clock.elapsedTime * 1.1 + 1) * 0.05 * (0.4 + tm.speed / 25);
        }
      }

      if (tm.trickPulse > 0) {
        flipT += dt * (1000 / Math.max(tm.trickAirtime, 200));
        const spin = (Math.min(flipT, 1) * (tm.trickRotation * Math.PI)) / 180;
        rig.rotation.x = spin;
        rig.position.y = 0.05 + Math.sin(Math.min(flipT, 1) * Math.PI) * 0.35;
        if (flipT >= 1) {
          tm.trickPulse = 0;
          flipT = 0;
          rig.rotation.x = 0;
          rig.position.y = 0.05;
        }
      } else {
        // Applique l'orientation en temps réel lissée
        rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, targetPitch, 0.2);
        rig.rotation.z = THREE.MathUtils.lerp(rig.rotation.z, targetRoll, 0.2);
        rig.position.y = 0.05;
      }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [custom, usePhone, stance, esp32Status]);

  return (
    <div style={{ position: "relative", width: "100%", height: 320, borderRadius: 24, overflow: "hidden", border: `3px solid ${C.cyan}`, boxShadow: `0 0 14px ${C.cyan}55` }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(26,19,48,0.85)", borderRadius: 999, border: `2px solid ${connected ? C.green : C.danger}`, fontFamily: MONO_FONT, fontSize: 12, color: connected ? C.green : C.danger }}>
        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
        {esp32Status === "connected" ? "BOITIER RIDERANALYTIC · LIVE" : connected ? "MODE DEMO (boitier non detecte)" : "RECHERCHE DU BOITIER..."}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
    GARAGE PREVIEW COMPONENT
--------------------------------------------------------- */
function GaragePreview({ custom, stance }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(C.screen);
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 50);
    camera.position.set(0, 1.2, 2.2);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.6); dLight.position.set(1, 3, 2); scene.add(dLight);

    const rig = buildSkateRig(custom, stance);
    scene.add(rig);

    let raf;
    function rot() {
      raf = requestAnimationFrame(rot);
      rig.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    rot();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [custom, stance]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

/* ---------------------------------------------------------
    MAIN ROOT APPLICATION
--------------------------------------------------------- */
export default function App() {
  useFonts();
  
  // États de l'application
  const [activeTab, setActiveTab] = useState("live");
  const [connected, setConnected] = useState(false);
  const [esp32Status, setEsp32Status] = useState("disconnected"); // 'disconnected' | 'connected'
  const [stance, setStance] = useState("regular");
  const [usePhone, setUsePhone] = useState(false);

  // Customization
  const [custom, setCustom] = useState({
    deck: DECKS[0].color,
    wheels: WHEELS[0].color,
    grip: GRIPS[0].color,
    shirt: SHIRTS[0].color,
    pants: PANTS[0].color,
    trucks: TRUCKS[0].color,
    skin: SKIN_TONES[1].color,
    hair: HAIR_COLORS[0].color,
    hairstyle: HAIRSTYLES[0].id,
    shoes: SHOES[0].color,
  });

  // Télémétrie mutable partagée avec Three.js
  const telemetryRef = useRef({
    speed: 0, pitch: 0, roll: 0,
    trickPulse: 0, trickAirtime: 0, trickRotation: 0, trickGrind: false
  });

  const phoneTiltRef = useRef({ beta: 0, gamma: 0 });
  const [chartData, setChartData] = useState([]);

  // LIAISON SERVEUR ESP32 (Polling toutes les 200ms)
  useEffect(() => {
    const interval = setInterval(() => {
      // Étape 1 : Récupérer la télémétrie en temps réel depuis l'ESP32
      fetch("/data")
        .then((res) => res.json())
        .then((data) => {
          setConnected(true);
          setEsp32Status("connected");
          
          // Injecter les angles bruts convertis en radians pour Three.js
          telemetryRef.current.pitch = (data.pitch * Math.PI) / 180;
          telemetryRef.current.roll = (data.roll * Math.PI) / 180;
          telemetryRef.current.speed = data.speed || 0;

          // Gestion des tricks envoyés par l'ESP32
          if (data.trickDetected) {
            telemetryRef.current.trickPulse = 1;
            telemetryRef.current.trickAirtime = data.airtime || 300;
            telemetryRef.current.trickRotation = data.rotation || 360;
          }

          // Remplir le graphique en direct
          setChartData((prev) => {
            const next = [...prev, { time: new Date().toLocaleTimeString(), pitch: data.pitch, roll: data.roll }];
            if (next.length > 30) next.shift();
            return next;
          });
        })
        .catch(() => {
          // Si l'ESP32 ne répond pas, on passe en mode Simulation démo
          setEsp32Status("disconnected");
          setConnected(true); // Reste "vrai" pour faire vivre l'interface en démo
          
          // Simulation de données
          setChartData((prev) => {
            const next = [...prev, { time: new Date().toLocaleTimeString(), pitch: Math.sin(Date.now()/500)*20, roll: Math.cos(Date.now()/500)*20 }];
            if (next.length > 30) next.shift();
            return next;
          });
        });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Étape 2 : Envoyer les configurations de style de l'utilisateur à l'ESP32 quand elles changent
  useEffect(() => {
    fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom, stance }),
    }).catch((err) => console.log("ESP32 non connecté pour la config, sauvegarde locale active."));
  }, [custom, stance]);

  return (
    <div style={{ backgroundColor: C.crt, minHeight: "100vh", color: C.text, fontFamily: MONO_FONT, padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${C.panelLine}`, paddingBottom: 12, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: DISPLAY_FONT, color: C.cyan, fontSize: 28, textShadow: `0 0 8px ${C.cyan}` }}>RIDERANALYTIC APP</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setActiveTab("live")} style={{ padding: "8px 16px", background: activeTab === "live" ? C.cyan : C.panel, color: activeTab === "live" ? C.crt : C.text, border: "none", cursor: "pointer", fontWeight: "bold" }}>LIVE ACCEL</button>
          <button onClick={() => setActiveTab("garage")} style={{ padding: "8px 16px", background: activeTab === "garage" ? C.magenta : C.panel, color: activeTab === "garage" ? C.crt : C.text, border: "none", cursor: "pointer", fontWeight: "bold" }}>GARAGE STYLE</button>
        </div>
      </header>

      {activeTab === "live" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Live3DView custom={custom} telemetryRef={telemetryRef} connected={connected} usePhone={usePhone} phoneTiltRef={phoneTiltRef} stance={stance} esp32Status={esp32Status} />
          
          <div style={{ background: C.screen, padding: 16, borderRadius: 16, border: `2px solid ${C.panelLine}` }}>
            <h3 style={{ color: C.yellow, marginBottom: 12 }}>MONITEUR TEMPS RÉEL (DEGRÉS)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.panelLine} />
                <XAxis dataKey="time" stroke={C.textDim} />
                <YAxis stroke={C.textDim} domain={[-90, 90]} />
                <Tooltip />
                <Line type="monotone" dataKey="pitch" stroke={C.cyan} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="roll" stroke={C.magenta} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "garage" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ height: 350, background: C.screen, borderRadius: 24, border: `2px solid ${C.magenta}`, overflow: "hidden" }}>
            <GaragePreview custom={custom} stance={stance} />
          </div>

          <div style={{ background: C.panel, padding: 16, borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: C.cyan, display: "block", marginBottom: 4 }}>STYLE RIDER (STANCE)</label>
              <select value={stance} onChange={(e) => setStance(e.target.value)} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                <option value="regular">REGULAR (Gauche devant)</option>
                <option value="goofy">GOOFY (Droite devant)</option>
              </select>
            </div>

            <div>
              <label style={{ color: C.yellow, display: "block", marginBottom: 4 }}>COULEUR DU DECK</label>
              <select value={custom.deck} onChange={(e) => setCustom({ ...custom, deck: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {DECKS.map((d) => <option key={d.name} value={d.color}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.magenta, display: "block", marginBottom: 4 }}>COULEUR T-SHIRT</label>
              <select value={custom.shirt} onChange={(e) => setCustom({ ...custom, shirt: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {SHIRTS.map((s) => <option key={s.name} value={s.color}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.green, display: "block", marginBottom: 4 }}>COUPE DE CHEVEUX</label>
              <select value={custom.hairstyle} onChange={(e) => setCustom({ ...custom, hairstyle: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {HAIRSTYLES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.cyan, display: "block", marginBottom: 4 }}>COULEUR DES CHEVEUX</label>
              <select value={custom.hair} onChange={(e) => setCustom({ ...custom, hair: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {HAIR_COLORS.map((hc) => <option key={hc.name} value={hc.color}>{hc.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.orange, display: "block", marginBottom: 4 }}>COULEUR DU PANTALON</label>
              <select value={custom.pants} onChange={(e) => setCustom({ ...custom, pants: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {PANTS.map((p) => <option key={p.name} value={p.color}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: C.yellow, display: "block", marginBottom: 4 }}>ROUES</label>
              <select value={custom.wheels} onChange={(e) => setCustom({ ...custom, wheels: e.target.value })} style={{ width: "100%", padding: 6, background: C.screen, color: C.text, border: `1px solid ${C.panelLine}` }}>
                {WHEELS.map((w) => <option key={w.name} value={w.color}>{w.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
