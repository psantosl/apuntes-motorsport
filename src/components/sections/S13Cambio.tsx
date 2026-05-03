import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import SectionWrapper from '../SectionWrapper';

/* ── Gearbox spec ─────────────────────────────────────────────────────
 * Simplified 4-speed + R + N. All forward gears are constant-mesh:
 * a gear fixed to the countershaft is always meshed with a "free"
 * gear riding on bearings on the output shaft. A sliding sleeve
 * (synchronizer) on the output shaft locks the chosen free gear to
 * the output → power flows through that pair.
 *
 * Ratio = (countershaft RPM) / (output RPM) for the engaged pair.
 * Total reduction from input = primary ratio × selected ratio.
 * ──────────────────────────────────────────────────────────────────── */

type GearKey = 'R' | 'N' | '1' | '2' | '3' | '4';

interface GearSpec {
  key: GearKey;
  label: string;
  ratio: number;            // counter→output (negative for R, 0 for N)
  outputRadius: number;     // 3D visual: free gear on output shaft
  counterRadius: number;    // fixed gear on countershaft (always meshed)
  color: number;
}

/* Center distance between input/output shafts and the countershaft.
 * For meshing pairs: counter_radius + free_radius = D.
 * Gear sizes derived from this so every pair actually meshes visually. */
const D = 1.7;

const FORWARD: GearSpec[] = [
  // counter + output radii sum to D for clean meshing
  { key: '1', label: '1ª', ratio: 3.42, color: 0x378ADD, counterRadius: 0.385, outputRadius: 1.315 },
  { key: '2', label: '2ª', ratio: 1.95, color: 0xD85A30, counterRadius: 0.576, outputRadius: 1.124 },
  { key: '3', label: '3ª', ratio: 1.34, color: 0x1D9E75, counterRadius: 0.726, outputRadius: 0.974 },
  { key: '4', label: '4ª', ratio: 0.97, color: 0x7F77DD, counterRadius: 0.863, outputRadius: 0.837 },
];

const REVERSE: GearSpec = {
  key: 'R',
  label: 'R',
  ratio: -3.00,
  color: 0xBA7517,
  counterRadius: 0.40,
  outputRadius: 1.20,
};
const REVERSE_IDLER_R = 0.45;

const PRIMARY_RATIO = 1.6;
// counter spins SLOWER than input → counter gear is bigger.
// counter_R = ratio * input_R, and they sum to D
const PRIMARY_INPUT_R = D / (PRIMARY_RATIO + 1);     // ≈ 0.654
const PRIMARY_COUNTER_R = D - PRIMARY_INPUT_R;        // ≈ 1.046

/* ── Geometry constants ── */
const SHAFT_RADIUS = 0.13;
const SHAFT_INPUT_Y = D / 2;          // 0.85
const SHAFT_COUNTER_Y = -D / 2;       // -0.85
const X_DRIVE = -3.6;                 // primary drive pair
const X_INPUT_TIP = X_DRIVE + 0.4;    // where input shaft ends (just past primary gear)
const X_FORWARD = [-1.6, 0, 1.6, 3.2];  // 1, 2, 3, 4 along output (symmetric spacing)
const X_REVERSE = 4.5;
const X_SLEEVE_12 = (X_FORWARD[0] + X_FORWARD[1]) / 2;
const X_SLEEVE_34 = (X_FORWARD[2] + X_FORWARD[3]) / 2;
const SLEEVE_TRAVEL = 0.32;
const SHAFT_LEFT = X_DRIVE - 1.5;
const SHAFT_RIGHT = X_REVERSE + 0.7;

const GEAR_THICKNESS = 0.42;
const SLEEVE_LEN = 0.40;

/* ── Build helpers ─────────────────────────────────────────────────── */

function makeShaft(length: number, color: number, stripeColor: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, length, 24);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
  const shaft = new THREE.Mesh(geo, mat);

  // Off-axis stripe so rotation direction is obvious
  const stripeGeo = new THREE.BoxGeometry(length * 0.94, 0.05, 0.05);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: stripeColor, metalness: 0.4, roughness: 0.5,
    emissive: stripeColor, emissiveIntensity: 0.25,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = SHAFT_RADIUS;  // sit on the shaft surface
  shaft.add(stripe);

  return shaft;
}

function makeGear(radius: number, thickness: number, color: number): THREE.Mesh {
  // Cog-toothed gear via extruded shape — teeth visible so rotation is obvious.
  const teeth = Math.max(10, Math.round(radius * 18));
  const outerR = radius;
  const innerR = radius * 0.86;

  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.3) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.7) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    if (i === 0) shape.moveTo(innerR * Math.cos(a0), innerR * Math.sin(a0));
    shape.lineTo(outerR * Math.cos(a1), outerR * Math.sin(a1));
    shape.lineTo(outerR * Math.cos(a2), outerR * Math.sin(a2));
    shape.lineTo(innerR * Math.cos(a3), innerR * Math.sin(a3));
  }
  shape.closePath();

  // Centre hole for the shaft to pass through
  const hole = new THREE.Path();
  hole.absarc(0, 0, SHAFT_RADIUS * 1.1, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 4,
  });
  // Centre extrusion along its axis, then rotate so depth runs along world X (shaft axis)
  geo.translate(0, 0, -thickness / 2);
  geo.rotateY(Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.55,
    roughness: 0.4,
  });
  return new THREE.Mesh(geo, mat);
}

/* ── Synchroniser parts ─────────────────────────────────────────────
 * A real synchroniser (Borg-Warner type) is:
 *   1. a HUB splined to the output shaft (rotates with it)
 *   2. a SLEEVE riding on the hub via internal splines (slides axially)
 *   3. a BLOCKER RING (one per side) sitting between sleeve and gear,
 *      with a friction cone that mates with a cone on the free gear
 *   4. on the free gear: a CONE for friction-matching speeds and a
 *      DOG-TEETH ring that the sleeve finally engages with
 *
 * Engagement sequence when selecting a gear:
 *   a. sleeve moves axially toward the chosen gear, pushing the blocker ring
 *   b. blocker's cone meets the gear's cone → friction synchronises speeds
 *   c. once speeds match, sleeve passes through the blocker and locks into
 *      the gear's dog teeth → gear is now rigid with the shaft
 * ───────────────────────────────────────────────────────────────────── */

const HUB_R = 0.22;
const HUB_LEN = 0.42;
const SLEEVE_OUTER_R = 0.30;
const SLEEVE_INNER_R = 0.23;     // slightly larger than hub
const BLOCKER_R_OUTER = 0.30;
const BLOCKER_R_INNER = 0.22;
const BLOCKER_LEN = 0.10;
const BLOCKER_NEUTRAL = 0.30;     // X distance from hub centre to blocker centre, neutral
const BLOCKER_MAX = 0.40;         // max X distance (when pushed against cone)
const CONE_R_OUT = 0.32;
const CONE_R_IN = 0.20;
const CONE_LEN = 0.18;
const DOG_R = 0.20;
const DOG_LEN = 0.08;
const DOG_TEETH_COUNT = 14;

function makeHub(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(HUB_R, HUB_R, HUB_LEN, 20);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a4a55, metalness: 0.7, roughness: 0.3 });
  return new THREE.Mesh(geo, mat);
}

function makeSleeve(): THREE.Mesh {
  // Hollow ring: outer cylinder with the hub passing through
  const shape = new THREE.Shape();
  shape.absarc(0, 0, SLEEVE_OUTER_R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, SLEEVE_INNER_R, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: SLEEVE_LEN, bevelEnabled: false, curveSegments: 24,
  });
  geo.translate(0, 0, -SLEEVE_LEN / 2);
  geo.rotateY(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8c8d8, metalness: 0.65, roughness: 0.35,
  });
  return new THREE.Mesh(geo, mat);
}

function makeBlockerRing(): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, BLOCKER_R_OUTER, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, BLOCKER_R_INNER, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: BLOCKER_LEN, bevelEnabled: false, curveSegments: 20,
  });
  geo.translate(0, 0, -BLOCKER_LEN / 2);
  geo.rotateY(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc07a3a, metalness: 0.5, roughness: 0.4,
  });
  return new THREE.Mesh(geo, mat);
}

/** Cone protrusion + dog-teeth ring attached to the sleeve-facing side of a free gear. */
function makeSyncSurface(side: 'L' | 'R'): THREE.Group {
  const group = new THREE.Group();
  const sign = side === 'R' ? +1 : -1;

  // Cone: bigger ring at the gear face, narrower toward the dog teeth
  const coneGeo = new THREE.CylinderGeometry(CONE_R_IN, CONE_R_OUT, CONE_LEN, 20, 1, false);
  coneGeo.rotateZ(side === 'R' ? -Math.PI / 2 : Math.PI / 2);  // narrow end faces sleeve
  const coneMat = new THREE.MeshStandardMaterial({ color: 0x8b6033, metalness: 0.4, roughness: 0.5 });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.x = sign * (GEAR_THICKNESS / 2 + CONE_LEN / 2);
  group.add(cone);

  // Dog-teeth ring: small toothed cylinder past the cone tip
  const dogShape = new THREE.Shape();
  const dogOuter = DOG_R;
  const dogInner = DOG_R * 0.78;
  for (let i = 0; i < DOG_TEETH_COUNT; i++) {
    const a0 = (i / DOG_TEETH_COUNT) * Math.PI * 2;
    const a1 = ((i + 0.35) / DOG_TEETH_COUNT) * Math.PI * 2;
    const a2 = ((i + 0.65) / DOG_TEETH_COUNT) * Math.PI * 2;
    const a3 = ((i + 1) / DOG_TEETH_COUNT) * Math.PI * 2;
    if (i === 0) dogShape.moveTo(dogInner * Math.cos(a0), dogInner * Math.sin(a0));
    dogShape.lineTo(dogOuter * Math.cos(a1), dogOuter * Math.sin(a1));
    dogShape.lineTo(dogOuter * Math.cos(a2), dogOuter * Math.sin(a2));
    dogShape.lineTo(dogInner * Math.cos(a3), dogInner * Math.sin(a3));
  }
  dogShape.closePath();
  const dogHole = new THREE.Path();
  dogHole.absarc(0, 0, SHAFT_RADIUS * 1.1, 0, Math.PI * 2, true);
  dogShape.holes.push(dogHole);
  const dogGeo = new THREE.ExtrudeGeometry(dogShape, {
    depth: DOG_LEN, bevelEnabled: false, curveSegments: 4,
  });
  dogGeo.translate(0, 0, -DOG_LEN / 2);
  dogGeo.rotateY(Math.PI / 2);
  const dogMat = new THREE.MeshStandardMaterial({ color: 0x9a9aaa, metalness: 0.65, roughness: 0.3 });
  const dog = new THREE.Mesh(dogGeo, dogMat);
  dog.position.x = sign * (GEAR_THICKNESS / 2 + CONE_LEN + DOG_LEN / 2 + 0.02);
  group.add(dog);

  return group;
}

interface SyncAssembly {
  hub: THREE.Mesh;
  sleeve: THREE.Mesh;
  blockerL: THREE.Mesh;
  blockerR: THREE.Mesh;
  /** Local X (relative to outputShaft) of the hub centre */
  baseX: number;
}

interface Gearbox {
  inputShaft: THREE.Mesh;
  outputShaft: THREE.Mesh;
  countershaft: THREE.Mesh;
  primaryInput: THREE.Mesh;
  primaryCounter: THREE.Mesh;
  forwardCounter: THREE.Mesh[];
  forwardOutput: THREE.Mesh[];
  reverseCounter: THREE.Mesh;
  reverseOutput: THREE.Mesh;
  reverseIdler: THREE.Mesh;
  sync12: SyncAssembly;
  sync34: SyncAssembly;
  reset: () => void;
  dispose: () => void;
}

function buildGearbox(scene: THREE.Scene): Gearbox {
  const root = new THREE.Group();
  scene.add(root);

  // Shafts — distinct colors + a yellow stripe on each so rotation is obvious.
  //   Input shaft  : warm bronze  (cluth side)
  //   Output shaft : cool blue-grey (differs from input → clearly two shafts)
  //   Countershaft : neutral grey
  const inputLen = X_INPUT_TIP - SHAFT_LEFT;
  const inputShaft = makeShaft(inputLen, 0xb08858, 0xffd040);
  inputShaft.position.set((SHAFT_LEFT + X_INPUT_TIP) / 2, SHAFT_INPUT_Y, 0);

  const outputLen = SHAFT_RIGHT - X_INPUT_TIP;
  const outputShaft = makeShaft(outputLen, 0x6a849c, 0xff7040);
  outputShaft.position.set((X_INPUT_TIP + SHAFT_RIGHT) / 2, SHAFT_INPUT_Y, 0);

  const counterLen = SHAFT_RIGHT - SHAFT_LEFT;
  const countershaft = makeShaft(counterLen, 0x6a6a78, 0x40e070);
  countershaft.position.set((SHAFT_LEFT + SHAFT_RIGHT) / 2, SHAFT_COUNTER_Y, 0);

  // Bigger coupling at the input/output seam — clearly marks the two shafts
  const collarGeo = new THREE.CylinderGeometry(SHAFT_RADIUS * 1.8, SHAFT_RADIUS * 1.8, 0.18, 20);
  collarGeo.rotateZ(Math.PI / 2);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x303038, metalness: 0.7, roughness: 0.4 });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.set(X_INPUT_TIP, SHAFT_INPUT_Y, 0);
  root.add(collar);

  root.add(inputShaft, outputShaft, countershaft);

  // Primary drive pair (input → counter, constant mesh)
  const primaryInput = makeGear(PRIMARY_INPUT_R, GEAR_THICKNESS, 0xd6c070);
  primaryInput.position.set(X_DRIVE, SHAFT_INPUT_Y, 0);
  inputShaft.add(primaryInput);
  // Reposition gear so it sits in world but parented to input shaft (already aligned)
  primaryInput.position.x -= inputShaft.position.x;
  primaryInput.position.y -= inputShaft.position.y;

  const primaryCounter = makeGear(PRIMARY_COUNTER_R, GEAR_THICKNESS, 0xd6c070);
  primaryCounter.position.set(X_DRIVE - countershaft.position.x, SHAFT_COUNTER_Y - countershaft.position.y, 0);
  countershaft.add(primaryCounter);

  // Forward gear pairs (counter fixed; output free on bearings, parented to scene root)
  // Each forward gear gets a cone + dog teeth ring on the side facing its sync sleeve.
  const forwardCounter: THREE.Mesh[] = [];
  const forwardOutput: THREE.Mesh[] = [];
  FORWARD.forEach((g, i) => {
    const x = X_FORWARD[i];

    const cg = makeGear(g.counterRadius, GEAR_THICKNESS, g.color);
    cg.position.set(x - countershaft.position.x, SHAFT_COUNTER_Y - countershaft.position.y, 0);
    countershaft.add(cg);
    forwardCounter.push(cg);

    const og = makeGear(g.outputRadius, GEAR_THICKNESS, g.color);
    og.position.set(x, SHAFT_INPUT_Y, 0);
    // Add cone + dog teeth on the sleeve-facing side
    // sleeve12 is between gears 0 and 1 → gear 0 has sync surface on RIGHT, gear 1 on LEFT
    // sleeve34 is between gears 2 and 3 → gear 2 has sync surface on RIGHT, gear 3 on LEFT
    const side: 'L' | 'R' = (i === 0 || i === 2) ? 'R' : 'L';
    og.add(makeSyncSurface(side));
    root.add(og);
    forwardOutput.push(og);
  });

  // Reverse counter gear — fixed to counter shaft (always rotates with it)
  const reverseCounter = makeGear(REVERSE.counterRadius, GEAR_THICKNESS, REVERSE.color);
  reverseCounter.position.set(X_REVERSE - countershaft.position.x, SHAFT_COUNTER_Y - countershaft.position.y, 0);
  countershaft.add(reverseCounter);

  // Reverse output — FIXED to output shaft (rotates with it). The path is engaged
  // not by a sleeve but by sliding the IDLER into mesh.
  const reverseOutput = makeGear(REVERSE.outputRadius, GEAR_THICKNESS, REVERSE.color);
  reverseOutput.position.set(X_REVERSE - outputShaft.position.x, SHAFT_INPUT_Y - outputShaft.position.y, 0);
  outputShaft.add(reverseOutput);

  // Reverse idler — sliding gear on its own stub shaft. Lives at z ≈ 0.81 (in mesh)
  // when reverse is engaged, otherwise pulled out to z ≈ 2.6 (clearly disengaged).
  const reverseIdler = makeGear(REVERSE_IDLER_R, GEAR_THICKNESS * 0.85, 0x9a8a4a);
  reverseIdler.position.set(X_REVERSE, -0.588, 2.6);  // start out of mesh
  root.add(reverseIdler);

  // ── Synchroniser assemblies (one between gears 1-2, one between gears 3-4) ──
  function buildSync(centerX: number): SyncAssembly {
    const localX = centerX - outputShaft.position.x;
    const localY = SHAFT_INPUT_Y - outputShaft.position.y;

    const hub = makeHub();
    hub.position.set(localX, localY, 0);
    outputShaft.add(hub);

    const sleeve = makeSleeve();
    sleeve.position.set(localX, localY, 0);
    outputShaft.add(sleeve);

    const blockerL = makeBlockerRing();
    blockerL.position.set(localX - BLOCKER_NEUTRAL, localY, 0);
    outputShaft.add(blockerL);

    const blockerR = makeBlockerRing();
    blockerR.position.set(localX + BLOCKER_NEUTRAL, localY, 0);
    outputShaft.add(blockerR);

    return { hub, sleeve, blockerL, blockerR, baseX: localX };
  }

  const sync12 = buildSync(X_SLEEVE_12);
  const sync34 = buildSync(X_SLEEVE_34);

  // Tag colors as userData for highlight reset
  function tagOriginal(mesh: THREE.Mesh, color: number) {
    (mesh.material as THREE.MeshStandardMaterial).userData = { baseColor: color };
  }
  tagOriginal(primaryInput, 0xd6c070);
  tagOriginal(primaryCounter, 0xd6c070);
  FORWARD.forEach((g, i) => {
    tagOriginal(forwardCounter[i], g.color);
    tagOriginal(forwardOutput[i], g.color);
  });
  tagOriginal(reverseCounter, REVERSE.color);
  tagOriginal(reverseOutput, REVERSE.color);
  tagOriginal(reverseIdler, 0x9a8a4a);

  return {
    inputShaft, outputShaft, countershaft,
    primaryInput, primaryCounter,
    forwardCounter, forwardOutput,
    reverseCounter, reverseOutput, reverseIdler,
    sync12, sync34,
    reset: () => { /* no-op for now */ },
    dispose: () => {
      root.traverse(obj => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material as THREE.Material | undefined;
        if (mat) mat.dispose();
      });
      scene.remove(root);
    },
  };
}

/* Engagement target: -1 (left gear), 0 (neutral), +1 (right gear) for each sync. */
function syncTargets(gear: GearKey): { s12: number; s34: number; idler: boolean } {
  switch (gear) {
    case '1': return { s12: -1, s34: 0, idler: false };
    case '2': return { s12: +1, s34: 0, idler: false };
    case '3': return { s12: 0, s34: -1, idler: false };
    case '4': return { s12: 0, s34: +1, idler: false };
    case 'R': return { s12: 0, s34: 0, idler: true };
    case 'N': return { s12: 0, s34: 0, idler: false };
  }
}

const IDLER_Z_IN = 0.809;
const IDLER_Z_OUT = 2.6;

/* ── Component ─────────────────────────────────────────────────────── */
export default function S13Cambio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    cleanup: () => void;
    setGear: (g: GearKey) => void;
    setRPM: (r: number) => void;
  } | null>(null);

  const [gear, setGear] = useState<GearKey>('N');
  const [rpm, setRpm] = useState(2500);

  useEffect(() => {
    const container: HTMLDivElement | null = containerRef.current;
    if (!container) return;
    const c: HTMLDivElement = container;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a22);

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3.5, 3.5, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xc0c0d0, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(8, 10, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc0d0ff, 0.5);
    fill.position.set(-6, 4, -4);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xffe0c0, 0.3);
    back.position.set(0, -3, -8);
    scene.add(back);

    const gb = buildGearbox(scene);

    // Animation state held in closures
    let currentGear: GearKey = 'N';
    let currentRpm = 2500;

    let inputAngle = 0;
    let counterAngle = 0;
    // Each free output gear has its own angle (always rotating from countershaft)
    const freeOutputAngles = FORWARD.map(() => 0);
    let idlerAngle = 0;

    // Smoothed engagement state
    const targetState = { s12: 0, s34: 0, idlerZ: IDLER_Z_OUT };
    const currentState = { s12: 0, s34: 0, idlerZ: IDLER_Z_OUT };

    function applyHighlights(gearKey: GearKey) {
      // Dim everything to base
      const dim = (mesh: THREE.Mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const base = (mat.userData?.baseColor as number) ?? 0x808080;
        mat.color.setHex(base);
        mat.emissive.setHex(0x000000);
      };
      dim(gb.primaryInput); dim(gb.primaryCounter);
      gb.forwardCounter.forEach(dim);
      gb.forwardOutput.forEach(dim);
      dim(gb.reverseCounter); dim(gb.reverseOutput); dim(gb.reverseIdler);

      // Highlight the active path
      const highlight = (mesh: THREE.Mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const base = (mat.userData?.baseColor as number) ?? 0x808080;
        mat.emissive.setHex(base);
        mat.emissiveIntensity = 0.55;
      };
      if (gearKey !== 'N') {
        highlight(gb.primaryInput); highlight(gb.primaryCounter);
      }
      const idx = FORWARD.findIndex(g => g.key === gearKey);
      if (idx >= 0) {
        highlight(gb.forwardCounter[idx]);
        highlight(gb.forwardOutput[idx]);
      } else if (gearKey === 'R') {
        highlight(gb.reverseCounter);
        highlight(gb.reverseIdler);
        highlight(gb.reverseOutput);
      }
    }
    applyHighlights('N');

    const setGearInScene = (g: GearKey) => {
      currentGear = g;
      const t = syncTargets(g);
      targetState.s12 = t.s12;
      targetState.s34 = t.s34;
      targetState.idlerZ = t.idler ? IDLER_Z_IN : IDLER_Z_OUT;
      applyHighlights(g);
    };

    const setRPMInScene = (r: number) => { currentRpm = r; };

    let frameId = 0;
    const clock = new THREE.Clock();

    function animate() {
      const dt = Math.min(clock.getDelta(), 0.05);

      // Convert RPM (engine) to angular velocity (rad/s).
      // Visual speed is exaggerated: real 2500 RPM is way too fast to see,
      // so we scale down by /60 (RPS) and apply visualScale to slow further.
      const visualScale = 1 / 80;  // tweak for nice visual rate
      const inputW = (currentRpm / 60) * 2 * Math.PI * visualScale;

      // Counter spins in OPPOSITE direction to input (gear pair flips sign)
      const counterW = -inputW / PRIMARY_RATIO;

      inputAngle += inputW * dt;
      counterAngle += counterW * dt;

      gb.inputShaft.rotation.x = inputAngle;
      gb.countershaft.rotation.x = counterAngle;

      // Each free output gear rotates with countershaft via its own ratio
      // Output free gear angular vel = -counterW / (counter/output ratio)
      // ratio = counter_RPM / output_RPM.  In our spec: ratio = counter_radius_pair...
      // Simpler: visually counter R and output R determine rotation.
      // free_w = -counter_w * (counter_radius / output_radius)
      FORWARD.forEach((g, i) => {
        const wFree = -counterW * (g.counterRadius / g.outputRadius);
        freeOutputAngles[i] += wFree * dt;
        gb.forwardOutput[i].rotation.x = freeOutputAngles[i];
      });

      // Idler smoothly slides along Z (in = engaged with both shafts, out = parked)
      const easeIdler = 1 - Math.exp(-dt * 5);
      currentState.idlerZ += (targetState.idlerZ - currentState.idlerZ) * easeIdler;
      gb.reverseIdler.position.z = currentState.idlerZ;

      // Idler only rotates when in mesh (otherwise free-spinning on its stub, leave still)
      const idlerInMesh = currentState.idlerZ < (IDLER_Z_OUT + IDLER_Z_IN) / 2;
      if (idlerInMesh) {
        const idlerW = -counterW * (REVERSE.counterRadius / REVERSE_IDLER_R);
        idlerAngle += idlerW * dt;
        gb.reverseIdler.rotation.x = idlerAngle;
      }

      // Output shaft rotates only when locked.
      // Forward gears: locked when sleeve has fully engaged (|s| close to 1)
      // Reverse: locked when idler is fully in mesh
      let outputW = 0;
      if (currentGear === 'R') {
        if (idlerInMesh) {
          // counter → idler → output: two sign flips, ends opposite to forward direction
          outputW = counterW * (REVERSE.counterRadius / REVERSE.outputRadius);
        }
      } else if (currentGear !== 'N') {
        const g = FORWARD.find(x => x.key === currentGear)!;
        outputW = -counterW * (g.counterRadius / g.outputRadius);
      }
      gb.outputShaft.rotation.x += outputW * dt;

      // Smoothly drive sync engagement state
      const easeSleeve = 1 - Math.exp(-dt * 7);
      currentState.s12 += (targetState.s12 - currentState.s12) * easeSleeve;
      currentState.s34 += (targetState.s34 - currentState.s34) * easeSleeve;

      // Apply sleeve + blocker positions for each sync.
      // Sleeve travels full SLEEVE_TRAVEL; blocker on the engaging side only travels
      // BLOCKER_MAX from hub centre — it stops when its cone hits the gear's cone,
      // letting the sleeve slide further to engage the dog teeth.
      function placeSync(sa: SyncAssembly, t: number) {
        const sleeveOffset = t * SLEEVE_TRAVEL;
        sa.sleeve.position.x = sa.baseX + sleeveOffset;
        // Blocker on engaging side moves with sleeve up to BLOCKER_MAX, then stops
        const tR = Math.max(0, t);   // engagement strength toward right gear
        const tL = Math.max(0, -t);  // toward left gear
        const blockerR_X = BLOCKER_NEUTRAL + (BLOCKER_MAX - BLOCKER_NEUTRAL) * Math.min(1, tR * 1.4);
        const blockerL_X = -(BLOCKER_NEUTRAL + (BLOCKER_MAX - BLOCKER_NEUTRAL) * Math.min(1, tL * 1.4));
        sa.blockerR.position.x = sa.baseX + blockerR_X;
        sa.blockerL.position.x = sa.baseX + blockerL_X;

        // Heat up blocker emissive when active (friction phase visible)
        const matR = sa.blockerR.material as THREE.MeshStandardMaterial;
        const matL = sa.blockerL.material as THREE.MeshStandardMaterial;
        matR.emissive.setHex(0xff5020);
        matR.emissiveIntensity = tR * 0.6;
        matL.emissive.setHex(0xff5020);
        matL.emissiveIntensity = tL * 0.6;
      }
      placeSync(gb.sync12, currentState.s12);
      placeSync(gb.sync34, currentState.s34);

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      const w = c.clientWidth;
      const h = c.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    sceneRef.current = {
      cleanup: () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', onResize);
        controls.dispose();
        gb.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      },
      setGear: setGearInScene,
      setRPM: setRPMInScene,
    };

    return () => sceneRef.current?.cleanup();
  }, []);

  // Push state changes into the scene
  useEffect(() => { sceneRef.current?.setGear(gear); }, [gear]);
  useEffect(() => { sceneRef.current?.setRPM(rpm); }, [rpm]);

  /* ── Derived numbers for display ── */
  const ratio =
    gear === 'N' ? 0
    : gear === 'R' ? REVERSE.ratio
    : FORWARD.find(g => g.key === gear)?.ratio ?? 0;
  const counterRpm = gear === 'N' ? rpm / PRIMARY_RATIO : rpm / PRIMARY_RATIO;
  const outputRpm = ratio === 0 ? 0 : counterRpm / Math.abs(ratio);
  const totalReduction = ratio === 0 ? 0 : PRIMARY_RATIO * Math.abs(ratio);

  /* ── UI ── */
  const gearButtons: { key: GearKey; label: string; cls?: string }[] = [
    { key: 'R', label: 'R' },
    { key: 'N', label: 'N' },
    { key: '1', label: '1ª' },
    { key: '2', label: '2ª' },
    { key: '3', label: '3ª' },
    { key: '4', label: '4ª' },
  ];

  return (
    <SectionWrapper id="s13-cambio" title="13 · Cambio manual">
      <p className="text-gray-400 max-w-3xl mb-6">
        Una caja de cambios manual usa <strong className="text-white">tres ejes</strong>: el primario
        (recibe el par del embrague), el intermedio (countershaft) y el secundario (sale al diferencial).
        Todos los engranajes están <strong className="text-white">constantemente engranados</strong>:
        los del intermedio están fijos a su eje, los del secundario giran libres sobre cojinetes.
        Un <strong className="text-white">manguito sincronizador</strong> deslizándose sobre el secundario
        bloquea uno de esos engranajes libres → el par fluye por ese par y aparece la relación.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* 3D scene */}
        <div className="relative bg-gray-950/60 rounded-lg border border-gray-800 overflow-hidden"
          style={{ minHeight: 480 }}>
          <div ref={containerRef} className="w-full h-full" style={{ minHeight: 480 }} />
          <div className="absolute top-3 left-3 bg-black/60 px-3 py-2 rounded text-xs text-gray-300 leading-relaxed pointer-events-none">
            <div>Marcha: <span className="text-orange-400 font-semibold">{gear}</span></div>
            <div>Relación: <span className="text-white font-mono">
              {ratio === 0 ? '—' : ratio.toFixed(2)}:1
            </span></div>
            <div>Total (× primaria): <span className="text-white font-mono">
              {totalReduction === 0 ? '—' : totalReduction.toFixed(2)}:1
            </span></div>
          </div>
          <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-2 rounded text-[11px] text-gray-300 leading-relaxed pointer-events-none space-y-0.5">
            <div className="text-gray-500 mb-1 font-semibold tracking-wide text-[10px]">EJES (raya luminosa indica giro)</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#b08858' }}></span>Primario · <span className="inline-block w-3 h-3 rounded-sm align-middle mx-2" style={{ background: '#6a849c' }}></span>Secundario · <span className="inline-block w-3 h-3 rounded-sm align-middle mx-2" style={{ background: '#6a6a78' }}></span>Intermedio</div>
            <div className="text-gray-500 mt-2 mb-1 font-semibold tracking-wide text-[10px]">ENGRANAJES</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#d6c070' }}></span>Par primario (siempre engranado)</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#378ADD' }}></span>1ª <span className="inline-block w-3 h-3 rounded-sm align-middle mx-1" style={{ background: '#D85A30' }}></span>2ª <span className="inline-block w-3 h-3 rounded-sm align-middle mx-1" style={{ background: '#1D9E75' }}></span>3ª <span className="inline-block w-3 h-3 rounded-sm align-middle mx-1" style={{ background: '#7F77DD' }}></span>4ª <span className="inline-block w-3 h-3 rounded-sm align-middle mx-1" style={{ background: '#BA7517' }}></span>R</div>
            <div className="text-gray-500 mt-2 mb-1 font-semibold tracking-wide text-[10px]">SINCRONIZADOR</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#4a4a55' }}></span>Hub (fijo al secundario) · <span className="inline-block w-3 h-3 rounded-sm align-middle mx-2" style={{ background: '#c8c8d8' }}></span>Manguito</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#c07a3a' }}></span>Anillo blocker (se ilumina con la fricción)</div>
            <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{ background: '#8b6033' }}></span>Cono + <span className="inline-block w-3 h-3 rounded-sm align-middle mx-2" style={{ background: '#9a9aaa' }}></span>dientes (en cara del engranaje)</div>
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 pointer-events-none">
            arrastra para rotar · rueda para zoom
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/40 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Selector</p>
            <div className="grid grid-cols-3 gap-2">
              {gearButtons.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGear(g.key)}
                  className={`py-2.5 rounded font-semibold text-sm transition-colors ${
                    gear === g.key
                      ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/40 rounded-lg p-4 space-y-3">
            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">RPM motor (entrada)</span>
                <span className="text-white font-mono">{rpm.toLocaleString()}</span>
              </div>
              <input
                type="range" min={800} max={7000} step={100} value={rpm}
                onChange={e => setRpm(Number(e.target.value))}
                className="accent-orange-500"
              />
            </label>

            <div className="text-xs text-gray-400 grid grid-cols-2 gap-y-1 pt-2 border-t border-gray-700">
              <span>Primaria (input → counter)</span>
              <span className="text-white font-mono text-right">{PRIMARY_RATIO.toFixed(2)}:1</span>
              <span>RPM countershaft</span>
              <span className="text-white font-mono text-right">{Math.round(counterRpm).toLocaleString()}</span>
              <span>RPM salida</span>
              <span className="text-white font-mono text-right">{Math.round(outputRpm).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed bg-gray-800/20 rounded-lg p-3 border border-gray-800/60">
            <p className="mb-2 text-gray-400 font-semibold">Sincronizador (cómo engrana realmente):</p>
            <p>
              Al meter una marcha el manguito empuja el <strong className="text-gray-300">anillo blocker</strong>,
              que aprieta su cono contra el del engranaje libre — la fricción iguala las velocidades
              (verás el blocker iluminarse). Cuando coinciden, el manguito atraviesa el blocker y
              <strong className="text-gray-300"> se encaja con los dientes (dog teeth)</strong> del engranaje:
              ahora el engranaje está rígidamente unido al secundario.
            </p>
            <p className="mt-2 text-gray-400 font-semibold">Marcha atrás:</p>
            <p>
              No tiene sincronizador. El <strong className="text-gray-300">idler</strong> está fuera de
              malla en condiciones normales — al meter R se desplaza axialmente para acoplarse
              simultáneamente con el intermedio y el secundario. Por eso conviene parar el coche
              primero: si los engranajes giran a velocidades distintas, los dientes se "rascan".
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
