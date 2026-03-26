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
const VB_W = 500;
const VB_H = 420;

/* ── Motorcycle rear view ── */
function MotorcycleRearView({
  cx, cy, leanDeg, config, rpm,
}: {
  cx: number; cy: number; leanDeg: number; config: CrankConfig; rpm: number;
}) {
  const cfgInfo = CONFIGS.find(c => c.key === config)!;
  const torqueMag = Math.min((rpm / 16000) * (Math.abs(leanDeg) / 40), 1);

  // Ground contact point stays fixed, bike rotates around bottom
  const groundY = cy + 95;

  return (
    <g>
      {/* Ground line */}
      <line x1={cx - 140} y1={groundY} x2={cx + 140} y2={groundY}
        stroke="#333" strokeWidth={1.5} strokeDasharray="8 6" />
      <text x={cx + 130} y={groundY + 16} fill="#444" fontSize={9} textAnchor="end">suelo</text>

      {/* Leaned motorcycle group — pivots around ground contact */}
      <g transform={`rotate(${-leanDeg}, ${cx}, ${groundY})`}>

        {/* ── Rear tire ── */}
        <ellipse cx={cx} cy={groundY - 42} rx={38} ry={50}
          fill="#1a1a1a" stroke="#555" strokeWidth={2} />
        {/* Tire tread lines */}
        {[-30, -15, 0, 15, 30].map(dy => (
          <line key={dy} x1={cx - 28} y1={groundY - 42 + dy} x2={cx + 28} y2={groundY - 42 + dy}
            stroke="#333" strokeWidth={1} />
        ))}
        {/* Rim */}
        <ellipse cx={cx} cy={groundY - 42} rx={22} ry={30}
          fill="none" stroke="#666" strokeWidth={1.5} />
        {/* Hub */}
        <circle cx={cx} cy={groundY - 42} r={6} fill="#555" stroke="#777" strokeWidth={1} />
        {/* Sprocket (rear) */}
        <circle cx={cx} cy={groundY - 42} r={12} fill="none" stroke="#888" strokeWidth={1} strokeDasharray="3 3" />

        {/* ── Swingarm ── */}
        <line x1={cx} y1={groundY - 42} x2={cx + 5} y2={groundY - 105}
          stroke="#777" strokeWidth={4} strokeLinecap="round" />

        {/* ── Rear shock ── */}
        <line x1={cx - 8} y1={groundY - 75} x2={cx - 5} y2={groundY - 110}
          stroke="#999" strokeWidth={2} strokeLinecap="round" />

        {/* ── Engine block ── */}
        <rect x={cx - 28} y={groundY - 130} width={56} height={40}
          rx={5} fill="#2a2a35" stroke="#555" strokeWidth={1.5} />
        {/* Engine fins */}
        {[-8, 0, 8].map(dy => (
          <line key={dy} x1={cx - 26} y1={groundY - 115 + dy} x2={cx + 26} y2={groundY - 115 + dy}
            stroke="#444" strokeWidth={1} />
        ))}

        {/* ── Crankshaft indicator inside engine ── */}
        {config === 'transversal' && (
          <g>
            {/* Horizontal line = perpendicular to travel */}
            <line x1={cx - 18} y1={groundY - 110} x2={cx + 18} y2={groundY - 110}
              stroke={cfgInfo.color} strokeWidth={3} strokeLinecap="round" />
            <circle cx={cx - 18} cy={groundY - 110} r={4} fill={cfgInfo.color} />
            <circle cx={cx + 18} cy={groundY - 110} r={4} fill={cfgInfo.color} />
            {/* Rotation arrow */}
            <path d={`M${cx + 12},${groundY - 120} A 14 14 0 1 1 ${cx - 12},${groundY - 120}`}
              fill="none" stroke={cfgInfo.color} strokeWidth={1.5} opacity={0.6} />
            <polygon points={`${cx - 12},${groundY - 123} ${cx - 16},${groundY - 118} ${cx - 10},${groundY - 118}`}
              fill={cfgInfo.color} opacity={0.6} />
          </g>
        )}
        {config === 'longitudinal' && (
          <g>
            {/* Dot = looking at crankshaft end-on (parallel to travel) */}
            <circle cx={cx} cy={groundY - 110} r={10} fill="none"
              stroke={cfgInfo.color} strokeWidth={2.5} />
            <circle cx={cx} cy={groundY - 110} r={3} fill={cfgInfo.color} />
            {/* Rotation arrow */}
            <path d={`M${cx + 8},${groundY - 118} A 12 12 0 1 1 ${cx - 8},${groundY - 118}`}
              fill="none" stroke={cfgInfo.color} strokeWidth={1.5} opacity={0.6} />
          </g>
        )}
        {config === 'counter' && (
          <g>
            {/* Horizontal line like transversal */}
            <line x1={cx - 18} y1={groundY - 110} x2={cx + 18} y2={groundY - 110}
              stroke={cfgInfo.color} strokeWidth={3} strokeLinecap="round" />
            <circle cx={cx - 18} cy={groundY - 110} r={4} fill={cfgInfo.color} />
            <circle cx={cx + 18} cy={groundY - 110} r={4} fill={cfgInfo.color} />
            {/* REVERSE rotation arrow */}
            <path d={`M${cx - 12},${groundY - 120} A 14 14 0 1 0 ${cx + 12},${groundY - 120}`}
              fill="none" stroke="#22C55E" strokeWidth={1.5} opacity={0.8} />
            <polygon points={`${cx + 12},${groundY - 123} ${cx + 16},${groundY - 118} ${cx + 10},${groundY - 118}`}
              fill="#22C55E" opacity={0.8} />
            <text x={cx} y={groundY - 126} textAnchor="middle" fill="#22C55E" fontSize={7} opacity={0.7}>
              CONTRA
            </text>
          </g>
        )}

        {/* ── Frame/subframe ── */}
        <path d={`M${cx - 30},${groundY - 130} L${cx - 22},${groundY - 170} L${cx + 22},${groundY - 170} L${cx + 30},${groundY - 130}`}
          fill="#222" stroke="#555" strokeWidth={1.5} />

        {/* ── Fuel tank ── */}
        <path d={`M${cx - 24},${groundY - 168} Q${cx - 30},${groundY - 190} ${cx - 18},${groundY - 200}
                   L${cx + 18},${groundY - 200} Q${cx + 30},${groundY - 190} ${cx + 24},${groundY - 168} Z`}
          fill="#2a2a35" stroke="#666" strokeWidth={1.5} />

        {/* ── Seat ── */}
        <path d={`M${cx - 22},${groundY - 168} Q${cx},${groundY - 175} ${cx + 8},${groundY - 168}`}
          fill="none" stroke="#888" strokeWidth={3} strokeLinecap="round" />

        {/* ── Clip-ons / handlebars ── */}
        <line x1={cx - 26} y1={groundY - 200} x2={cx - 38} y2={groundY - 206}
          stroke="#999" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx + 26} y1={groundY - 200} x2={cx + 38} y2={groundY - 206}
          stroke="#999" strokeWidth={2.5} strokeLinecap="round" />

        {/* ── Windscreen ── */}
        <path d={`M${cx - 16},${groundY - 200} Q${cx},${groundY - 220} ${cx + 16},${groundY - 200}`}
          fill="none" stroke="#556" strokeWidth={1.5} />

        {/* ── Exhaust (right side) ── */}
        <path d={`M${cx + 28},${groundY - 95} Q${cx + 40},${groundY - 80} ${cx + 35},${groundY - 55}`}
          fill="none" stroke="#888" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* ── Gyroscopic torque arrow (NOT leaned — stays in world frame) ── */}
      {Math.abs(leanDeg) > 2 && rpm > 1000 && (() => {
        const arrowLen = 30 + torqueMag * 70;
        let dx = 0;
        let dy = 0;
        let label = '';

        if (config === 'transversal') {
          // Resists lean — pushes opposite to lean
          dx = leanDeg > 0 ? arrowLen : -arrowLen;
          label = 'Resiste inclinación';
        } else if (config === 'longitudinal') {
          // Yaw torque — pushes forward/backward
          dy = -arrowLen * 0.7;
          label = 'Par de guiñada (yaw)';
        } else {
          // Helps lean — pushes same direction as lean
          dx = leanDeg > 0 ? -arrowLen : arrowLen;
          label = 'Favorece inclinación';
        }

        const startX = cx;
        const startY = cy - 40;
        const endX = startX + dx;
        const endY = startY + dy;

        return (
          <g>
            {/* Arrow shaft */}
            <line x1={startX} y1={startY} x2={endX} y2={endY}
              stroke={cfgInfo.torqueColor} strokeWidth={2.5 + torqueMag * 2}
              strokeLinecap="round" opacity={0.6 + torqueMag * 0.4} />
            {/* Arrowhead */}
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
            {/* Label */}
            <text x={endX + (dx > 0 ? 8 : dx < 0 ? -8 : 0)}
              y={endY + (dy < 0 ? -8 : 0)}
              textAnchor={dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'}
              fill={cfgInfo.torqueColor} fontSize={11} fontWeight={600}
              opacity={0.7 + torqueMag * 0.3}>
              {label}
            </text>
          </g>
        );
      })()}

      {/* Lean angle arc indicator */}
      {Math.abs(leanDeg) > 1 && (() => {
        const arcR = 60;
        const startAngle = -Math.PI / 2; // straight up
        const endAngle = startAngle - (leanDeg * Math.PI) / 180;
        const x1 = cx + arcR * Math.cos(startAngle);
        const y1 = groundY + arcR * Math.sin(startAngle);
        const x2 = cx + arcR * Math.cos(endAngle);
        const y2 = groundY + arcR * Math.sin(endAngle);
        const largeArc = Math.abs(leanDeg) > 180 ? 1 : 0;
        const sweep = leanDeg > 0 ? 0 : 1;
        return (
          <g>
            {/* Vertical reference */}
            <line x1={cx} y1={groundY} x2={cx} y2={groundY - arcR - 5}
              stroke="#444" strokeWidth={1} strokeDasharray="3 3" />
            {/* Arc */}
            <path d={`M${x1},${y1} A${arcR},${arcR} 0 ${largeArc},${sweep} ${x2},${y2}`}
              fill="none" stroke="#666" strokeWidth={1.5} />
            {/* Angle text */}
            <text x={cx + (leanDeg > 0 ? -20 : 20)} y={groundY - arcR - 8}
              fill="#888" fontSize={11} fontWeight={600} textAnchor="middle">
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
