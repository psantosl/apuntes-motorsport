import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import { PISTON_COLORS } from '../../utils/engine';

/* ── Types ── */
type CrankConfig = 'transversal' | 'longitudinal' | 'counter';

interface ConfigInfo {
  key: CrankConfig;
  label: string;
  shortLabel: string;
  color: string;
  torqueColor: string;
  description: string;
  example: string;
}

const CONFIGS: ConfigInfo[] = [
  {
    key: 'transversal',
    label: 'Motor transversal',
    shortLabel: 'Transversal',
    color: PISTON_COLORS[1],
    torqueColor: '#EF4444',
    description:
      'El cigüeñal es perpendicular a la dirección de marcha. Al inclinar la moto para girar, se rota el eje del cigüeñal. El efecto giroscópico se opone a la inclinación: a más RPM, más resistencia al cambio de dirección.',
    example: 'I4 japoneses (Yamaha R1, Honda CBR) — a 14.000 rpm son notoriamente lentos al entrar en curva.',
  },
  {
    key: 'longitudinal',
    label: 'Motor longitudinal',
    shortLabel: 'Longitudinal',
    color: PISTON_COLORS[3],
    torqueColor: '#F59E0B',
    description:
      'El cigüeñal es paralelo a la dirección de marcha. Al inclinar, no se rota el eje sino que se gira alrededor de él. El efecto giroscópico genera un par de guiñada (yaw) en lugar de resistir la inclinación.',
    example: 'BMW boxer, Moto Guzzi V-twin longitudinal — comportamiento en curva muy diferente.',
  },
  {
    key: 'counter',
    label: 'Cigüeñal contra-rotativo',
    shortLabel: 'Contra-rotativo',
    color: PISTON_COLORS[6],
    torqueColor: '#22C55E',
    description:
      'El cigüeñal gira en sentido contrario a las ruedas. El efecto giroscópico se invierte: en lugar de resistir la inclinación, la favorece. La moto entra en curva con más facilidad.',
    example: 'Ducati Desmosedici GP — Casey Stoner era conocido por explotar esta característica para su agresivo estilo de pilotaje.',
  },
];

/* ── SVG constants ── */
const VB_W = 560;
const VB_H = 440;

/* ── Motorcycle rear view ── */
function MotorcycleRearView({
  cx, cy, leanDeg, config, rpm,
}: {
  cx: number; cy: number; leanDeg: number; config: CrankConfig; rpm: number;
}) {
  const cfgInfo = CONFIGS.find(c => c.key === config)!;
  const torqueMag = Math.min((rpm / 16000) * (Math.abs(leanDeg) / 40), 1);

  // Ground contact at the bottom; bike pivots around it when leaned
  const groundY = cy + 130;

  // Anatomy y-coordinates (upright). Smaller y = higher on screen.
  const tireBottom = groundY;
  const tireTop = groundY - 64;
  const tireHalfW = 13;
  const wheelHubY = groundY - 32;

  const engineCY = groundY - 100;
  const engineW = 76;
  const engineH = 56;
  const engineTop = engineCY - engineH / 2;
  const engineBot = engineCY + engineH / 2;

  const tailTopY = groundY - 165;
  const tailHalfW = 19;

  const torsoBotY = tailTopY;
  const torsoTopY = groundY - 215;
  const torsoHalfW = 30;

  const helmetCY = groundY - 252;
  const helmetRX = 22;
  const helmetRY = 26;

  return (
    <g>
      {/* Ground line */}
      <line x1={cx - 170} y1={groundY} x2={cx + 170} y2={groundY}
        stroke="#333" strokeWidth={1.5} strokeDasharray="8 6" />
      <text x={cx + 160} y={groundY + 16} fill="#444" fontSize={9} textAnchor="end">suelo</text>

      {/* Leaned bike + rider — pivots around ground contact */}
      <g transform={`rotate(${-leanDeg}, ${cx}, ${groundY})`}>

        {/* ── Rear tire (narrow profile from behind) ── */}
        <rect x={cx - tireHalfW} y={tireTop}
          width={tireHalfW * 2} height={tireBottom - tireTop}
          rx={5} fill="#15151a" stroke="#4a4a55" strokeWidth={1.4} />
        {/* Tread hint */}
        {[0.25, 0.5, 0.75].map((t, i) => (
          <line key={i}
            x1={cx - tireHalfW + 3} y1={tireBottom - (tireBottom - tireTop) * t}
            x2={cx + tireHalfW - 3} y2={tireBottom - (tireBottom - tireTop) * t}
            stroke="#26262c" strokeWidth={0.8} />
        ))}
        {/* Hub centre dot */}
        <circle cx={cx} cy={wheelHubY} r={2.5} fill="#444" />

        {/* ── Swingarm (faint, both sides of the wheel) ── */}
        <line x1={cx - 18} y1={engineBot - 4} x2={cx - tireHalfW - 1} y2={tireBottom - 14}
          stroke="#3a3a44" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
        <line x1={cx + 18} y1={engineBot - 4} x2={cx + tireHalfW + 1} y2={tireBottom - 14}
          stroke="#3a3a44" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />

        {/* ── Engine block ── */}
        <rect x={cx - engineW / 2} y={engineTop}
          width={engineW} height={engineH}
          rx={7} fill="#26262e" stroke="#555" strokeWidth={1.5} />
        {/* Cooling fins (verticals) */}
        {[-28, -22, 22, 28].map(dx => (
          <line key={dx}
            x1={cx + dx} y1={engineTop + 8}
            x2={cx + dx} y2={engineBot - 8}
            stroke="#3a3a44" strokeWidth={1} />
        ))}

        {/* ── Crankshaft indicator (config-dependent), drawn over the engine ── */}
        {(() => {
          const ax = engineCY;
          if (config === 'transversal') {
            return (
              <g>
                <line x1={cx - 28} y1={ax} x2={cx + 28} y2={ax}
                  stroke={cfgInfo.color} strokeWidth={3.5} strokeLinecap="round" />
                <circle cx={cx - 28} cy={ax} r={4.5} fill={cfgInfo.color} />
                <circle cx={cx + 28} cy={ax} r={4.5} fill={cfgInfo.color} />
                <path d={`M${cx + 18},${ax - 14} A 14 14 0 1 1 ${cx - 18},${ax - 14}`}
                  fill="none" stroke={cfgInfo.color} strokeWidth={1.5} opacity={0.65} />
                <polygon points={`${cx - 18},${ax - 17} ${cx - 22},${ax - 11} ${cx - 14},${ax - 11}`}
                  fill={cfgInfo.color} opacity={0.65} />
              </g>
            );
          }
          if (config === 'longitudinal') {
            return (
              <g>
                <circle cx={cx} cy={ax} r={12} fill="none" stroke={cfgInfo.color} strokeWidth={2.5} />
                <circle cx={cx} cy={ax} r={3.5} fill={cfgInfo.color} />
                <path d={`M${cx + 9},${ax - 9} A 12 12 0 1 1 ${cx - 9},${ax - 9}`}
                  fill="none" stroke={cfgInfo.color} strokeWidth={1.5} opacity={0.65} />
                <polygon points={`${cx - 9},${ax - 12} ${cx - 13},${ax - 6} ${cx - 5},${ax - 6}`}
                  fill={cfgInfo.color} opacity={0.65} />
              </g>
            );
          }
          // counter — same axis as transversal, reversed rotation
          return (
            <g>
              <line x1={cx - 28} y1={ax} x2={cx + 28} y2={ax}
                stroke={cfgInfo.color} strokeWidth={3.5} strokeLinecap="round" />
              <circle cx={cx - 28} cy={ax} r={4.5} fill={cfgInfo.color} />
              <circle cx={cx + 28} cy={ax} r={4.5} fill={cfgInfo.color} />
              <path d={`M${cx - 18},${ax - 14} A 14 14 0 1 0 ${cx + 18},${ax - 14}`}
                fill="none" stroke={cfgInfo.color} strokeWidth={1.5} opacity={0.8} />
              <polygon points={`${cx + 18},${ax - 17} ${cx + 22},${ax - 11} ${cx + 14},${ax - 11}`}
                fill={cfgInfo.color} opacity={0.8} />
            </g>
          );
        })()}

        {/* ── Tail / subframe (tapers from engine top to seat) ── */}
        <path d={`
          M${cx - engineW / 2 + 10},${engineTop}
          L${cx - tailHalfW},${tailTopY}
          L${cx + tailHalfW},${tailTopY}
          L${cx + engineW / 2 - 10},${engineTop}
          Z
        `}
          fill="#23232b" stroke="#555" strokeWidth={1.5} />

        {/* Seat cap */}
        <ellipse cx={cx} cy={tailTopY - 2} rx={tailHalfW + 2} ry={4}
          fill="#2c2c35" stroke="#666" strokeWidth={1.2} />

        {/* ── Rider torso (shoulders wider than seat) ── */}
        <path d={`
          M${cx - tailHalfW},${torsoBotY}
          L${cx - torsoHalfW + 4},${torsoTopY + 8}
          Q${cx - torsoHalfW},${torsoTopY} ${cx - torsoHalfW + 8},${torsoTopY}
          L${cx + torsoHalfW - 8},${torsoTopY}
          Q${cx + torsoHalfW},${torsoTopY} ${cx + torsoHalfW - 4},${torsoTopY + 8}
          L${cx + tailHalfW},${torsoBotY}
          Z
        `}
          fill="#2c3245" stroke="#4d566c" strokeWidth={1.5} />
        {/* Suit zipper */}
        <line x1={cx} y1={torsoBotY - 4} x2={cx} y2={torsoTopY + 6}
          stroke="#1a1f2c" strokeWidth={1} />

        {/* ── Helmet ── */}
        <ellipse cx={cx} cy={helmetCY} rx={helmetRX} ry={helmetRY}
          fill="#1c1c24" stroke="#4a4a55" strokeWidth={1.5} />
        {/* Helmet visor band */}
        <path d={`
          M${cx - helmetRX + 4},${helmetCY - 6}
          Q${cx},${helmetCY - 11} ${cx + helmetRX - 4},${helmetCY - 6}
          L${cx + helmetRX - 5},${helmetCY + 3}
          Q${cx},${helmetCY + 5} ${cx - helmetRX + 5},${helmetCY + 3} Z
        `}
          fill="#3a4d5e" opacity={0.85} />

      </g>

      {/* ── Gyroscopic torque arrow (world frame, doesn't lean) ── */}
      {Math.abs(leanDeg) > 2 && rpm > 1000 && (() => {
        const arrowLen = 30 + torqueMag * 80;
        let dx = 0;
        let dy = 0;
        let label = '';

        if (config === 'transversal') {
          dx = leanDeg > 0 ? arrowLen : -arrowLen;
          label = 'Resiste inclinación';
        } else if (config === 'longitudinal') {
          dy = -arrowLen * 0.7;
          label = 'Par de guiñada (yaw)';
        } else {
          dx = leanDeg > 0 ? -arrowLen : arrowLen;
          label = 'Favorece inclinación';
        }

        // Originate near the engine in world frame
        const startX = cx;
        const startY = engineCY - engineH / 2 - 6;
        const endX = startX + dx;
        const endY = startY + dy;

        return (
          <g>
            <line x1={startX} y1={startY} x2={endX} y2={endY}
              stroke={cfgInfo.torqueColor} strokeWidth={2.5 + torqueMag * 2}
              strokeLinecap="round" opacity={0.65 + torqueMag * 0.35} />
            {(() => {
              const angle = Math.atan2(endY - startY, endX - startX);
              const headLen = 10;
              const p1x = endX - headLen * Math.cos(angle - 0.4);
              const p1y = endY - headLen * Math.sin(angle - 0.4);
              const p2x = endX - headLen * Math.cos(angle + 0.4);
              const p2y = endY - headLen * Math.sin(angle + 0.4);
              return (
                <polygon points={`${endX},${endY} ${p1x},${p1y} ${p2x},${p2y}`}
                  fill={cfgInfo.torqueColor} opacity={0.7 + torqueMag * 0.3} />
              );
            })()}
            <text x={endX + (dx > 0 ? 8 : dx < 0 ? -8 : 0)}
              y={endY + (dy < 0 ? -8 : 4)}
              textAnchor={dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'}
              fill={cfgInfo.torqueColor} fontSize={11} fontWeight={600}
              opacity={0.8 + torqueMag * 0.2}>
              {label}
            </text>
          </g>
        );
      })()}

      {/* Lean angle indicator — large arc passing outside the bike */}
      {Math.abs(leanDeg) > 1 && (() => {
        const arcR = 290;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle - (leanDeg * Math.PI) / 180;
        const x1 = cx + arcR * Math.cos(startAngle);
        const y1 = groundY + arcR * Math.sin(startAngle);
        const x2 = cx + arcR * Math.cos(endAngle);
        const y2 = groundY + arcR * Math.sin(endAngle);
        const sweep = leanDeg > 0 ? 0 : 1;

        const labelR = arcR + 14;
        const labelX = cx + labelR * Math.cos(endAngle);
        const labelY = groundY + labelR * Math.sin(endAngle);

        return (
          <g>
            {/* Arc */}
            <path d={`M${x1},${y1} A${arcR},${arcR} 0 0,${sweep} ${x2},${y2}`}
              fill="none" stroke="#666" strokeWidth={1} />
            {/* Vertical reference notch at top of arc */}
            <circle cx={cx} cy={groundY - arcR} r={2.5} fill="#888" />
            <text x={cx} y={groundY - arcR - 8}
              fill="#666" fontSize={9} textAnchor="middle">vertical</text>
            {/* Angle label at end of arc */}
            <text x={labelX} y={labelY}
              fill="#bbb" fontSize={13} fontWeight={600}
              textAnchor="middle" dominantBaseline="middle">
              {Math.abs(leanDeg)}°
            </text>
          </g>
        );
      })()}
    </g>
  );
}

export default function S12Giroscopico() {
  const [config, setConfig] = useState<CrankConfig>('transversal');
  const [rpm, setRpm] = useState(8000);
  const [leanDeg, setLeanDeg] = useState(25);

  const activeConfig = CONFIGS.find(c => c.key === config)!;
  const torqueMag = Math.min((rpm / 16000) * (Math.abs(leanDeg) / 40), 1);

  return (
    <SectionWrapper id="s12-giroscopico" title="12 · Efecto giroscópico">
      <p className="text-gray-400 max-w-2xl mb-6">
        El cigüeñal girando a alta velocidad actúa como un <strong className="text-white">giroscopio</strong>.
        Su orientación respecto a la dirección de marcha determina cómo afecta al comportamiento de la moto
        al inclinarse para tomar una curva.
      </p>

      {/* ── Config toggle ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CONFIGS.map(c => (
          <button
            key={c.key}
            onClick={() => setConfig(c.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              config === c.key
                ? 'text-white'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
            style={config === c.key ? {
              backgroundColor: `${c.color}20`,
              color: c.color,
              boxShadow: `inset 0 0 0 1px ${c.color}60`,
            } : undefined}
          >
            {c.shortLabel}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* ── Main SVG visualization ── */}
        <div>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" style={{ minHeight: 360 }}>
            <MotorcycleRearView
              cx={VB_W / 2}
              cy={VB_H / 2 + 20}
              leanDeg={leanDeg}
              config={config}
              rpm={rpm}
            />
          </svg>
        </div>

        {/* ── Controls + info panel ── */}
        <div className="flex flex-col gap-4">
          {/* Sliders */}
          <div className="bg-gray-800/40 rounded-lg p-4 space-y-4">
            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">RPM del cigüeñal</span>
                <span className="text-white font-mono">{rpm.toLocaleString()}</span>
              </div>
              <input type="range" min={1000} max={16000} step={500} value={rpm}
                onChange={e => setRpm(Number(e.target.value))} className="accent-orange-500" />
            </label>
            <label className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ángulo de inclinación</span>
                <span className="text-white font-mono">{leanDeg}°</span>
              </div>
              <input type="range" min={-45} max={45} step={1} value={leanDeg}
                onChange={e => setLeanDeg(Number(e.target.value))} className="accent-orange-500" />
            </label>

            {/* Torque magnitude bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Par giroscópico</span>
                <span className="font-mono">{(torqueMag * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-200"
                  style={{
                    width: `${torqueMag * 100}%`,
                    backgroundColor: activeConfig.torqueColor,
                  }} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg p-5 space-y-3 text-sm leading-relaxed flex-1"
            style={{ backgroundColor: `${activeConfig.color}08`, border: `1px solid ${activeConfig.color}30` }}>
            <p className="text-gray-300">{activeConfig.description}</p>
            <p className="text-gray-500 text-xs">
              <span className="font-semibold text-gray-400">Ejemplo:</span> {activeConfig.example}
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary comparison ── */}
      <div className="max-w-2xl">
        <h3 className="text-lg text-gray-300 font-semibold mb-4">Comparativa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONFIGS.map(c => (
            <div
              key={c.key}
              className={`rounded-lg p-4 cursor-pointer transition-all ${
                config === c.key ? '' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                backgroundColor: `${c.color}10`,
                boxShadow: config === c.key ? `inset 0 0 0 1px ${c.color}50` : undefined,
              }}
              onClick={() => setConfig(c.key)}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: c.color }}>{c.label}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                {c.key === 'transversal' && 'Resiste la inclinación. Moto estable en recta pero lenta al entrar en curva a altas RPM.'}
                {c.key === 'longitudinal' && 'Genera guiñada al inclinar. Comportamiento distinto pero no resiste el lean directamente.'}
                {c.key === 'counter' && 'Favorece la inclinación. La moto cae con más facilidad hacia la curva.'}
              </p>
              <p className="text-gray-600 text-xs mt-2">{c.example.split(' — ')[0]}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
