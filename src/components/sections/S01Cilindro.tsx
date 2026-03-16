import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { PISTON_COLORS } from '../../utils/engine';

/* ── Physical proportions (SVG user units) ──
   Everything is derived from CRANK_R and BIELA_LEN.
   Real ratio biela/manivela ≈ 3–4. We use 3.5 for visual clarity.
*/
const CRANK_R = 44;
const BIELA_LEN = CRANK_R * 3.5;     // 154
const PISTON_H = 34;
const CYL_W = 130;

// Layout: build the SVG from the crank center outward
const CRANK_CY = 420;
const CRANK_CX = 200;
const CYL_X = CRANK_CX - CYL_W / 2;

// TDC / BDC bulón positions (derived from geometry)
const TDC_BULON_Y = CRANK_CY - CRANK_R - BIELA_LEN;  // crank at 0°
const BDC_BULON_Y = CRANK_CY + CRANK_R - BIELA_LEN;  // crank at 180°

// Cylinder walls: just above PMS piston top, just below PMI piston bottom
const CYL_TOP = TDC_BULON_Y - PISTON_H / 2 - 8;      // 8px clearance for combustion chamber
const CYL_BOT = BDC_BULON_Y + PISTON_H / 2 + 12;

const VB_W = 420;
const VB_H = CRANK_CY + CRANK_R + 60;

const PISTON_COLOR = PISTON_COLORS[1];

/* ── label type ── */
interface Label {
  text: string;
  tx: number; ty: number;
  px: number; py: number;
}

export default function S01Cilindro() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  // Crankshaft pin position (circular motion)
  const crankRad = ((angle % 360) * Math.PI) / 180;
  const pinX = CRANK_CX + CRANK_R * Math.sin(crankRad);
  const pinY = CRANK_CY - CRANK_R * Math.cos(crankRad);

  // Bulón: constrained to cylinder centerline (X = CRANK_CX)
  // Biela has fixed length → bulonY = pinY - sqrt(BIELA_LEN² - dx²)
  const dx = pinX - CRANK_CX;
  const bulonY = pinY - Math.sqrt(BIELA_LEN * BIELA_LEN - dx * dx);
  const bulonX = CRANK_CX;

  // Piston top edge
  const pistonY = bulonY - PISTON_H / 2;

  // TDC / BDC piston top-edge positions (for indicators)
  const tdcPistonY = TDC_BULON_Y - PISTON_H / 2;
  const bdcPistonY = BDC_BULON_Y - PISTON_H / 2;

  const labels: Label[] = [
    { text: 'Culata', tx: 24, ty: CYL_TOP - 18, px: CYL_X + CYL_W / 2, py: CYL_TOP - 8 },
    { text: 'V. admisión', tx: 14, ty: CYL_TOP + 6, px: CYL_X + 28, py: CYL_TOP + 4 },
    { text: 'V. escape', tx: 300, ty: CYL_TOP + 6, px: CYL_X + CYL_W - 28, py: CYL_TOP + 4 },
    { text: 'Segmentos', tx: 320, ty: pistonY - 4, px: CYL_X + CYL_W + 4, py: pistonY + 4 },
    { text: 'Pistón', tx: 320, ty: pistonY + 14, px: CYL_X + CYL_W + 4, py: pistonY + PISTON_H / 2 },
    { text: 'Bulón', tx: 320, ty: bulonY + 6, px: bulonX + 22, py: bulonY },
    { text: 'Biela', tx: 20, ty: (bulonY + pinY) / 2, px: (bulonX + pinX) / 2 - 6, py: (bulonY + pinY) / 2 },
    { text: 'Muñequilla', tx: 14, ty: pinY + 4, px: pinX - 10, py: pinY },
    { text: 'Muñón principal', tx: 14, ty: CRANK_CY + 32, px: CRANK_CX - 14, py: CRANK_CY + 10 },
    { text: 'Brazo de manivela', tx: 14, ty: CRANK_CY + 48, px: (CRANK_CX + pinX) / 2, py: (CRANK_CY + pinY) / 2 },
  ];

  return (
    <SectionWrapper id="s01-cilindro" title="1 · El cilindro">
      <p className="text-gray-400 max-w-2xl mb-6">
        Anatomía del conjunto cilindro-pistón-biela-cigüeñal. El pistón se desplaza entre el
        <strong className="text-white"> PMS</strong> (Punto Muerto Superior) y el
        <strong className="text-white"> PMI</strong> (Punto Muerto Inferior) mientras el cigüeñal gira.
      </p>

      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-md"
          style={{ minHeight: 400 }}
        >
          {/* ── Culata (head) ── */}
          <rect
            x={CYL_X - 10} y={CYL_TOP - 22}
            width={CYL_W + 20} height={22}
            rx={4}
            fill="#4B5563" stroke="#6B7280" strokeWidth={1.5}
          />

          {/* valves */}
          <line x1={CYL_X + 28} y1={CYL_TOP - 22} x2={CYL_X + 28} y2={CYL_TOP + 4}
            stroke="#60A5FA" strokeWidth={3} strokeLinecap="round" />
          <line x1={CYL_X + CYL_W - 28} y1={CYL_TOP - 22} x2={CYL_X + CYL_W - 28} y2={CYL_TOP + 4}
            stroke="#F87171" strokeWidth={3} strokeLinecap="round" />

          {/* ── Cylinder walls ── */}
          <line x1={CYL_X} y1={CYL_TOP} x2={CYL_X} y2={CYL_BOT}
            stroke="#9CA3AF" strokeWidth={3} />
          <line x1={CYL_X + CYL_W} y1={CYL_TOP} x2={CYL_X + CYL_W} y2={CYL_BOT}
            stroke="#9CA3AF" strokeWidth={3} />

          {/* ── TDC / BDC indicators (at piston crown = top edge) ── */}
          <line x1={CYL_X - 16} y1={tdcPistonY} x2={CYL_X - 2} y2={tdcPistonY}
            stroke="#34D399" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={CYL_X - 20} y={tdcPistonY + 4}
            textAnchor="end" fill="#34D399" fontSize={10} fontWeight={700}>PMS</text>

          <line x1={CYL_X - 16} y1={bdcPistonY} x2={CYL_X - 2} y2={bdcPistonY}
            stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={CYL_X - 20} y={bdcPistonY + 4}
            textAnchor="end" fill="#F59E0B" fontSize={10} fontWeight={700}>PMI</text>

          {/* ── Piston segments (rings) ── */}
          {[0, 7, 13].map((dy, i) => (
            <rect
              key={i}
              x={CYL_X + 4} y={pistonY - 5 + dy}
              width={CYL_W - 8} height={3}
              rx={1}
              fill="#A1A1AA"
            />
          ))}

          {/* ── Piston body ── */}
          <rect
            x={CYL_X + 4} y={pistonY}
            width={CYL_W - 8} height={PISTON_H}
            rx={4}
            fill={PISTON_COLOR} stroke="#1E3A5F" strokeWidth={1.5}
          />

          {/* bulón (wrist pin) */}
          <circle cx={bulonX} cy={bulonY} r={5} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />

          {/* ── Biela (connecting rod) ── */}
          <line
            x1={bulonX} y1={bulonY}
            x2={pinX} y2={pinY}
            stroke="#D1D5DB" strokeWidth={5} strokeLinecap="round"
          />

          {/* ── Crankshaft ── */}
          {/* muñón principal (main journal) */}
          <circle cx={CRANK_CX} cy={CRANK_CY} r={14}
            fill="#6B7280" stroke="#4B5563" strokeWidth={2} />

          {/* brazo de manivela (crank arm) */}
          <line
            x1={CRANK_CX} y1={CRANK_CY}
            x2={pinX} y2={pinY}
            stroke="#6B7280" strokeWidth={10} strokeLinecap="round"
          />

          {/* muñequilla (crank pin) */}
          <circle cx={pinX} cy={pinY} r={7}
            fill="#E5E7EB" stroke="#4B5563" strokeWidth={1.5} />

          {/* ── Labels ── */}
          {labels.map((l) => (
            <g key={l.text}>
              <line
                x1={l.tx + l.text.length * 3} y1={l.ty}
                x2={l.px} y2={l.py}
                stroke="#6B728080" strokeWidth={0.8}
              />
              <text
                x={l.tx} y={l.ty}
                fill="#D1D5DB" fontSize={10} fontFamily="sans-serif"
              >
                {l.text}
              </text>
            </g>
          ))}
        </svg>

        <AnimationControls
          playing={playing}
          onToggle={toggle}
          speed={speed}
          onSpeedChange={setSpeed}
          angle={angle % 360}
        />
      </div>
    </SectionWrapper>
  );
}
