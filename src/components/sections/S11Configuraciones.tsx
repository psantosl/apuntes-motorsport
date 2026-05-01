import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import { ENGINE_CONFIGS, PISTON_COLORS, type BalanceRating } from '../../utils/engine';

/* ── Balance badge ── */
function BalanceBadge({ rating }: { rating: BalanceRating }) {
  const styles: Record<BalanceRating, { bg: string; text: string; label: string }> = {
    good: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'BIEN' },
    partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'PARCIAL' },
    bad: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'MAL' },
  };
  const s = styles[rating];
  return (
    <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded text-xs font-bold`}>
      {s.label}
    </span>
  );
}

/* ── Inline engine schematic (top view) ── */
function InlineSchematic({ count, cx, cy }: { count: number; cx: number; cy: number }) {
  const spacing = 36;
  const startX = cx - ((count - 1) * spacing) / 2;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = startX + i * spacing;
        const color = PISTON_COLORS[(i + 1) as keyof typeof PISTON_COLORS] || '#378ADD';
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={14} fill={color} opacity={0.25} stroke={color} strokeWidth={1.5} />
            <text x={x} y={cy + 4} fill={color} fontSize={10} fontWeight={700} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}
      {/* Crankshaft line */}
      <line
        x1={startX - 20} y1={cy}
        x2={startX + (count - 1) * spacing + 20} y2={cy}
        stroke="#6B7280" strokeWidth={2} strokeDasharray="6 3"
      />
    </g>
  );
}

/* ── V engine schematic (proper front view: one cylinder cross-section per bank) ── */
function VSchematic({
  angleDeg,
  cylPerBank,
  cx,
  cy,
}: {
  angleDeg: number;
  cylPerBank: number;
  cx: number;
  cy: number;
}) {
  const halfAngle = (angleDeg / 2) * (Math.PI / 180);

  const crankR = 12;
  const cylBore = 24;             // cylinder bore (perpendicular to bank axis)
  const blockLen = 58;            // cylinder block length along bank (skirt to head)
  const blockStart = crankR + 4;  // distance from crank centre to skirt of block
  const blockEnd = blockStart + blockLen;

  // Bank unit vectors (pointing away from crankcase along bank)
  const leftDx = -Math.sin(halfAngle);
  const leftDy = -Math.cos(halfAngle);
  const rightDx = Math.sin(halfAngle);
  const rightDy = -Math.cos(halfAngle);

  function bank(dx: number, dy: number, color: string, key: string) {
    // perpendicular axis (bore width direction)
    const px = -dy;
    const py = dx;
    const half = cylBore / 2;

    // Block corners (rectangle aligned with bank axis)
    const skirtCx = cx + dx * blockStart;
    const skirtCy = cy + dy * blockStart;
    const headCx = cx + dx * blockEnd;
    const headCy = cy + dy * blockEnd;

    const c1 = { x: skirtCx + px * half, y: skirtCy + py * half };
    const c2 = { x: headCx + px * half,  y: headCy + py * half };
    const c3 = { x: headCx - px * half,  y: headCy - py * half };
    const c4 = { x: skirtCx - px * half, y: skirtCy - py * half };

    // Piston ~40% up the bore (mid-stroke)
    const pistonDist = blockStart + blockLen * 0.4;
    const pCx = cx + dx * pistonDist;
    const pCy = cy + dy * pistonDist;
    const p1 = { x: pCx + px * (half - 1.5), y: pCy + py * (half - 1.5) };
    const p2 = { x: pCx - px * (half - 1.5), y: pCy - py * (half - 1.5) };

    // Cylinder count badge — just outside the head, on the bank axis
    const badgeDist = blockEnd + 14;
    const badgeX = cx + dx * badgeDist;
    const badgeY = cy + dy * badgeDist;

    return (
      <g key={key}>
        {/* Block outline */}
        <path
          d={`M${c1.x},${c1.y} L${c2.x},${c2.y} L${c3.x},${c3.y} L${c4.x},${c4.y} Z`}
          fill={color} fillOpacity={0.1}
          stroke={color} strokeWidth={1.5} strokeLinejoin="round"
        />
        {/* Piston */}
        <line
          x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.9}
        />
        {/* Connecting rod (crank centre to piston pin) */}
        <line
          x1={cx} y1={cy} x2={pCx} y2={pCy}
          stroke="#6B7280" strokeWidth={1.5}
        />
        {/* Cylinder count badge: how many cylinders lie behind in this bank */}
        <text
          x={badgeX} y={badgeY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fontWeight={700} fill={color}
        >
          ×{cylPerBank}
        </text>
      </g>
    );
  }

  const colorL = PISTON_COLORS[1];
  const colorR = PISTON_COLORS[2];

  return (
    <g>
      {bank(leftDx, leftDy, colorL, 'L')}
      {bank(rightDx, rightDy, colorR, 'R')}

      {/* Crankcase / crank centre */}
      <circle cx={cx} cy={cy} r={crankR} fill="#1f2937" stroke="#9CA3AF" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={3.5} fill="#9CA3AF" />

      {/* Angle arc + label */}
      {(() => {
        const arcR = blockStart - 2;
        return (
          <>
            <path
              d={`M ${cx + leftDx * arcR} ${cy + leftDy * arcR} A ${arcR} ${arcR} 0 0 1 ${cx + rightDx * arcR} ${cy + rightDy * arcR}`}
              fill="none" stroke="#F59E0B" strokeWidth={1.2} strokeDasharray="3 2"
            />
            <text
              x={cx} y={cy - arcR - 6}
              fill="#F59E0B" fontSize={12} fontWeight={700} textAnchor="middle"
            >
              {angleDeg}°
            </text>
          </>
        );
      })()}
    </g>
  );
}

/* ── V Preset highlight ── */
interface VPreset {
  angle: number;
  cylPerBank: number;
  name: string;
  detail: string;
}

const V_PRESETS: VPreset[] = [
  { angle: 90, cylPerBank: 1, name: 'V2 90° (L-Twin)', detail: 'Ducati Panigale — balance primario perfecto' },
  { angle: 45, cylPerBank: 1, name: 'V2 45°', detail: 'Harley-Davidson — vibración característica, identidad de marca' },
  { angle: 65, cylPerBank: 2, name: 'V4 65°', detail: 'Aprilia RSV4 — compacto con buen balance' },
  { angle: 90, cylPerBank: 4, name: 'V8 90°', detail: 'Ferrari / F1 clásico — excelente balance' },
];

export default function S11Configuraciones() {
  const [vAngle, setVAngle] = useState(90);
  const [vCylPerBank, setVCylPerBank] = useState(1);
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const [inlineTab, setInlineTab] = useState<3 | 4 | 6>(4);

  const inlineTabs: { count: 3 | 4 | 6; label: string }[] = [
    { count: 3, label: 'I3' },
    { count: 4, label: 'I4' },
    { count: 6, label: 'I6' },
  ];

  const inlineExamples: Record<3 | 4 | 6, string> = {
    3: 'Triumph Street Triple 765, BMW B38',
    4: 'Yamaha R1, Honda CBR1000RR, BMW S1000RR',
    6: 'BMW S54 (M3 E46), BMW S58 (M3 G80)',
  };

  function selectPreset(idx: number) {
    const p = V_PRESETS[idx];
    setVAngle(p.angle);
    setVCylPerBank(p.cylPerBank);
    setActivePreset(idx);
  }

  function handleAngleChange(a: number) {
    setVAngle(a);
    setActivePreset(null);
  }

  return (
    <SectionWrapper id="s11-configuraciones" title="11 · Configuraciones de motor">
      <p className="text-gray-400 max-w-2xl mb-8">
        La disposición de los cilindros determina el <strong className="text-white">equilibrado</strong>,
        la <strong className="text-white">compacidad</strong> y el carácter del motor. Cada configuración
        tiene compromisos distintos entre vibraciones, anchura y altura.
      </p>

      {/* ── INLINE ENGINES ── */}
      <div className="mb-12">
        <h3 className="text-xl text-gray-200 font-semibold mb-4">Motores en línea</h3>
        <p className="text-gray-400 text-sm mb-4">
          Todos los cilindros en fila. Vista superior esquemática — la línea punteada representa el cigüeñal.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {inlineTabs.map(t => (
            <button
              key={t.count}
              onClick={() => setInlineTab(t.count)}
              className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                inlineTab === t.count
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 360 80" className="w-full max-w-md" style={{ minHeight: 70 }}>
            <InlineSchematic count={inlineTab} cx={180} cy={40} />
          </svg>
          <p className="text-gray-500 text-sm">
            <span className="text-white font-semibold">Ejemplos:</span>{' '}
            {inlineExamples[inlineTab]}
          </p>
        </div>
      </div>

      {/* ── V ENGINES ── */}
      <div className="mb-12">
        <h3 className="text-xl text-gray-200 font-semibold mb-4">Motores en V</h3>
        <p className="text-gray-400 text-sm mb-4">
          Dos bancadas de cilindros forman un ángulo. El ángulo afecta al equilibrado y las dimensiones del motor.
          La vista frontal muestra <strong className="text-gray-200">un cilindro por bancada</strong> (corte
          transversal). El número <span className="text-gray-200 font-semibold">×N</span> indica cuántos cilindros
          hay en realidad en cada bancada, alineados a lo largo del cigüeñal hacia adentro de la imagen.
        </p>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {V_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => selectPreset(i)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activePreset === i
                  ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Angle slider */}
        <div className="flex items-center gap-4 mb-4 max-w-md">
          <span className="text-gray-400 text-sm">Ángulo V:</span>
          <input
            type="range" min={30} max={180} step={1} value={vAngle}
            onChange={e => handleAngleChange(Number(e.target.value))}
            className="flex-1 accent-orange-500"
          />
          <span className="text-white font-mono text-sm w-12 text-right">{vAngle}°</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 300 180" className="w-full max-w-sm" style={{ minHeight: 160 }}>
            <VSchematic angleDeg={vAngle} cylPerBank={vCylPerBank} cx={150} cy={150} />
          </svg>

          {activePreset !== null && (
            <div className="bg-gray-800/40 rounded-lg px-4 py-3 text-sm text-center">
              <span className="text-white font-semibold">{V_PRESETS[activePreset].name}</span>
              <span className="text-gray-400"> — {V_PRESETS[activePreset].detail}</span>
            </div>
          )}
        </div>

        {/* Boxer special case */}
        <div className="mt-6 bg-gray-800/30 rounded-lg p-4 max-w-xl">
          <h4 className="text-gray-200 font-semibold mb-2">
            Caso especial: Boxer (180°)
          </h4>
          <p className="text-gray-400 text-sm leading-relaxed">
            Cuando el ángulo V alcanza los <strong className="text-white">180°</strong>, los cilindros
            quedan completamente opuestos en horizontal. Esta configuración se conoce como{' '}
            <strong className="text-orange-400">boxer</strong>.{' '}
            Centro de gravedad muy bajo y excelente equilibrado primario.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Ejemplos: BMW R1250GS (flat twin), Porsche 911 (flat six), Subaru EJ/FA (flat four)
          </p>
        </div>
      </div>

      {/* ── SUMMARY TABLE ── */}
      <div>
        <h3 className="text-xl text-gray-200 font-semibold mb-4">Resumen de configuraciones</h3>

        <div className="bg-gray-800/30 rounded-lg p-4 mb-4 max-w-2xl text-sm text-gray-400 leading-relaxed">
          <p>
            <strong className="text-white">Balance 1° (primario):</strong> vibración a la frecuencia
            del cigüeñal — una oscilación por revolución, generada por el movimiento alternativo
            del pistón.
          </p>
          <p className="mt-2">
            <strong className="text-white">Balance 2° (secundario):</strong> vibración al doble de
            frecuencia — dos oscilaciones por revolución, debida a la geometría finita de la biela
            (el pistón no se mueve de forma puramente sinusoidal). Ver sección 5 (Fuerzas).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 py-2 pr-4 font-semibold">Configuración</th>
                <th className="text-center text-gray-400 py-2 px-3 font-semibold">Balance 1°</th>
                <th className="text-center text-gray-400 py-2 px-3 font-semibold">Balance 2°</th>
                <th className="text-left text-gray-400 py-2 pl-4 font-semibold">Ejemplos</th>
              </tr>
            </thead>
            <tbody>
              {ENGINE_CONFIGS.map((cfg, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="py-2.5 pr-4 text-white font-medium">{cfg.name}</td>
                  <td className="py-2.5 px-3 text-center">
                    <BalanceBadge rating={cfg.primaryBalance} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <BalanceBadge rating={cfg.secondaryBalance} />
                  </td>
                  <td className="py-2.5 pl-4 text-gray-400">{cfg.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionWrapper>
  );
}
