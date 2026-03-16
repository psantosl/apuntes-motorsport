// Piston colors consistent across the entire app
export const PISTON_COLORS = {
  1: '#378ADD', // azul
  2: '#D85A30', // coral
  3: '#1D9E75', // verde
  4: '#7F77DD', // morado
  5: '#BA7517', // ámbar
  6: '#D4537E', // rosa
} as const;

export const EXPLOSION_COLOR = '#EF9F27';

// Piston position calculation (NOT purely sinusoidal)
// pistonPos = -cos(crankAngle) + lambda/4 * (1 - cos(2*crankAngle))
// lambda = r/l (crank radius / connecting rod length), typically 0.28
export function pistonPosition(crankAngleDeg: number, lambda = 0.28): number {
  const theta = (crankAngleDeg * Math.PI) / 180;
  // Returns normalized position: 0 = TDC (top), 1 = BDC (bottom)
  // raw: -1 at TDC to +1 at BDC for cos term
  const primary = -Math.cos(theta);
  const secondary = (lambda / 4) * (1 - Math.cos(2 * theta));
  // Normalize to 0..1 range
  const raw = primary + secondary;
  // min occurs at theta=0: -1 + 0 = -1
  // max occurs near theta=180: 1 + lambda/2
  const min = -1;
  const max = 1 + lambda / 2;
  return (raw - min) / (max - min);
}

// Primary force of piston i: F1 = cos(theta + offset)
export function primaryForce(crankAngleDeg: number, offsetDeg: number): number {
  const theta = ((crankAngleDeg + offsetDeg) * Math.PI) / 180;
  return Math.cos(theta);
}

// Secondary force: F2 = lambda * cos(2*(theta + offset))
export function secondaryForce(crankAngleDeg: number, offsetDeg: number, lambda = 0.28): number {
  const theta = ((crankAngleDeg + offsetDeg) * Math.PI) / 180;
  return lambda * Math.cos(2 * theta);
}

// Check if piston is at TDC (within threshold degrees)
export function isAtTDC(crankAngleDeg: number, offsetDeg: number, threshold = 15): boolean {
  const angle = ((crankAngleDeg + offsetDeg) % 360 + 360) % 360;
  return angle < threshold || angle > (360 - threshold);
}

// For 4T: check if this TDC is a firing TDC
// firingOffset for I4 standard: [0, 540, 180, 360] (order 1-3-4-2)
export function isFiringTDC4T(
  crankAngleDeg: number,
  firingOffset: number,
  threshold = 15
): boolean {
  const angle = ((crankAngleDeg - firingOffset) % 720 + 720) % 720;
  return angle < threshold || angle > (720 - threshold);
}

// For 2T: every TDC is a firing event
export function isFiring2T(crankAngleDeg: number, crankOffset: number, threshold = 15): boolean {
  return isAtTDC(crankAngleDeg, crankOffset, threshold);
}

// Engine configurations
export const I4_OFFSETS = [0, 180, 180, 0];
export const I6_OFFSETS = [0, 120, 240, 360, 480, 600];
export const I4_FIRING_OFFSETS_4T = [0, 540, 180, 360]; // order 1-3-4-2
// Honda NSR500 V4 2T — simplified to inline representation
// Screamer (pre-1990): 180° crank, no bank split → firing every 90°
// Each piston independent, evenly spaced — no pairs
export const SCREAMER_2T_OFFSETS = [0, 90, 180, 270];
// Big Bang (1992+): 0° crank with 180° bank split
// Pairs within each bank move together (0° apart),
// banks separated by 68° (from 180°−112° V-angle)
// Firing pattern: P1+P2 at 0°, P3+P4 at 68°, then 292° gap
// Offset convention: TDC when (crankAngle + offset) ≡ 0° mod 360
// So offset = 360° - firingDelay: P3+P4 fire at 68° → offset = 292°
export const BIGBANG_2T_OFFSETS = [0, 0, 292, 292];

export type BalanceRating = 'good' | 'partial' | 'bad';

export interface EngineConfig {
  name: string;
  primaryBalance: BalanceRating;
  secondaryBalance: BalanceRating;
  examples: string;
}

export const ENGINE_CONFIGS: EngineConfig[] = [
  { name: 'Monocilíndrico', primaryBalance: 'bad', secondaryBalance: 'bad', examples: 'KTM 450 SX-F' },
  { name: 'Parallel Twin 180°', primaryBalance: 'good', secondaryBalance: 'bad', examples: 'Yamaha MT-07' },
  { name: 'Parallel Twin 270°', primaryBalance: 'partial', secondaryBalance: 'partial', examples: 'Yamaha CP2' },
  { name: 'V-Twin 90°', primaryBalance: 'good', secondaryBalance: 'partial', examples: 'Ducati L-Twin' },
  { name: 'I3', primaryBalance: 'good', secondaryBalance: 'partial', examples: 'Triumph 765' },
  { name: 'I4', primaryBalance: 'good', secondaryBalance: 'bad', examples: 'Yamaha R1' },
  { name: 'I6', primaryBalance: 'good', secondaryBalance: 'good', examples: 'BMW S54/S58' },
];
