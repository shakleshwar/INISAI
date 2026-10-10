import React, { useMemo, useRef, useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { EQ_PRESETS_DATA } from '../../store/useSettingsStore';
import type { EqPreset } from '../../store/useSettingsStore';

interface StudioEqualizerProps {
  eqBands: [number, number, number, number, number];
  equalizerPreset: EqPreset;
  crossfadeDuration: number;
  onBandChange: (index: number, val: number) => void;
  onPresetChange: (preset: EqPreset) => void;
  onCrossfadeChange: (seconds: number) => void;
}

const BANDS = [
  { label: '60 Hz', sub: 'Sub-Bass', freq: 60 },
  { label: '230 Hz', sub: 'Bass', freq: 230 },
  { label: '910 Hz', sub: 'Mids', freq: 910 },
  { label: '3.6 kHz', sub: 'Presence', freq: 3600 },
  { label: '14 kHz', sub: 'Air', freq: 14000 },
];

export function StudioEqualizer({
  eqBands,
  equalizerPreset,
  crossfadeDuration,
  onBandChange,
  onPresetChange,
  onCrossfadeChange
}: StudioEqualizerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeDraggingNode, setActiveDraggingNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Guarantee valid 5-number tuple at all times
  const safeBands: [number, number, number, number, number] = useMemo(() => {
    if (Array.isArray(eqBands) && eqBands.length === 5) {
      return eqBands.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0)) as [number, number, number, number, number];
    }
    return [0, 0, 0, 0, 0];
  }, [eqBands]);

  // Check if current band values match any preset exactly
  const activeMatchingPreset = useMemo(() => {
    const matched = (Object.keys(EQ_PRESETS_DATA) as EqPreset[]).find((presetKey) => {
      const presetValues = EQ_PRESETS_DATA[presetKey];
      return presetValues.every((val, i) => val === safeBands[i]);
    });
    return matched ?? (equalizerPreset === 'flat' ? null : equalizerPreset);
  }, [safeBands, equalizerPreset]);

  // ═══ Natural Smooth Parametric Curve Interpolation ═══
  const { curvePath, fillPath, controlPoints } = useMemo(() => {
    const svgWidth = 500;
    const centerY = 60;
    const yMaxDelta = 44; // ±12 dB maps to ±44px deviation (y in [16, 104])

    // 5 X coordinates strictly centered in 5 equal columns: 10%, 30%, 50%, 70%, 90%
    const xCoords = [50, 150, 250, 350, 450];

    // Compute accurate Y for each band
    const points = safeBands.map((val, i) => {
      const clamped = Math.max(-12, Math.min(12, val));
      const y = centerY - (clamped / 12) * yMaxDelta;
      return { x: xCoords[i], y, val: clamped };
    });

    // Sub-bass (Band 0) is a low-shelf filter: below 60 Hz it holds the shelf smoothly to x = 0
    // High-shelf (Band 4) is a high-shelf filter: above 14 kHz it holds the shelf smoothly to x = 500
    const knots = [
      { x: 0, y: points[0].y },
      ...points.map(p => ({ x: p.x, y: p.y })),
      { x: svgWidth, y: points[4].y }
    ];

    const n = knots.length; // 7

    // Compute secant slopes
    const deltas: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      deltas.push((knots[i + 1].y - knots[i].y) / (knots[i + 1].x - knots[i].x));
    }

    // Tangents with acoustic curvature damping
    const slopes: number[] = new Array(n).fill(0);
    slopes[0] = 0; // Natural horizontal low-shelf at left boundary
    slopes[n - 1] = 0; // Natural horizontal high-shelf at right boundary

    for (let i = 1; i < n - 1; i++) {
      const dPrev = deltas[i - 1];
      const dNext = deltas[i];

      // If local peak or trough (sign change) -> horizontal crest
      if (dPrev * dNext < 0) {
        slopes[i] = 0;
      } else if (dPrev === 0 && dNext === 0) {
        slopes[i] = 0;
      } else {
        // Smooth acoustic blending slope
        slopes[i] = ((dPrev + dNext) / 2) * 0.75;
      }
    }

    // Construct continuous cubic Bezier path
    let curveD = `M ${knots[0].x.toFixed(1)},${knots[0].y.toFixed(1)} `;

    for (let i = 0; i < n - 1; i++) {
      const p0 = knots[i];
      const p1 = knots[i + 1];
      const dx = p1.x - p0.x;

      const cp1x = p0.x + dx / 3;
      const cp1y = Math.max(14, Math.min(106, p0.y + (slopes[i] * dx) / 3));

      const cp2x = p1.x - dx / 3;
      const cp2y = Math.max(14, Math.min(106, p1.y - (slopes[i + 1] * dx) / 3));

      curveD += `C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)} `;
    }

    // Area fill path cleanly closes along the 0 dB center baseline (Y = 60)
    const fillD = `${curveD} L ${svgWidth},${centerY} L 0,${centerY} Z`;

    return {
      curvePath: curveD,
      fillPath: fillD,
      controlPoints: points
    };
  }, [eqBands]);

  // ═══ Direct 1:1 Zero-Lag Interactive Node Dragging on Canvas ═══
  const handlePointerDownNode = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDraggingNode(index);

    const target = e.currentTarget as Element;
    target.setPointerCapture?.(e.pointerId);

    const updateGainFromPointer = (clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clampedClientY = Math.max(rect.top, Math.min(rect.bottom, clientY));
      const normalizedY = (clampedClientY - rect.top) / rect.height; // 0..1
      const ySvg = normalizedY * 120;

      // Inverted formula: y = 60 - (dB / 12) * 44 => dB = ((60 - y) / 44) * 12
      const rawDb = ((60 - ySvg) / 44) * 12;
      const clampedDb = Math.round(Math.max(-12, Math.min(12, rawDb)));
      onBandChange(index, clampedDb);
    };

    const handlePointerMoveGlobal = (ev: PointerEvent) => {
      updateGainFromPointer(ev.clientY);
    };

    const handlePointerUpGlobal = (ev: PointerEvent) => {
      target.releasePointerCapture?.(ev.pointerId);
      setActiveDraggingNode(null);
      window.removeEventListener('pointermove', handlePointerMoveGlobal);
      window.removeEventListener('pointerup', handlePointerUpGlobal);
      window.removeEventListener('pointercancel', handlePointerUpGlobal);
    };

    window.addEventListener('pointermove', handlePointerMoveGlobal);
    window.addEventListener('pointerup', handlePointerUpGlobal);
    window.addEventListener('pointercancel', handlePointerUpGlobal);
  };

  // ═══ Tactile Channel Rail Pointer Dragging & Tapping ═══
  const handleChannelPointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rail = e.currentTarget;
    rail.setPointerCapture?.(e.pointerId);

    const updateFromRail = (clientY: number) => {
      const rect = rail.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const clampedY = Math.max(0, Math.min(rect.height, relativeY));
      const normalized = clampedY / rect.height; // 0 at top (+12dB), 1 at bottom (-12dB)
      const rawDb = 12 - normalized * 24;
      const clampedDb = Math.round(Math.max(-12, Math.min(12, rawDb)));
      onBandChange(index, clampedDb);
    };

    updateFromRail(e.clientY);

    const onRailMove = (ev: PointerEvent) => {
      updateFromRail(ev.clientY);
    };

    const onRailUp = (ev: PointerEvent) => {
      rail.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener('pointermove', onRailMove);
      window.removeEventListener('pointerup', onRailUp);
      window.removeEventListener('pointercancel', onRailUp);
    };

    window.addEventListener('pointermove', onRailMove);
    window.addEventListener('pointerup', onRailUp);
    window.addEventListener('pointercancel', onRailUp);
  };

  return (
    <div className="p-3.5 sm:p-6 rounded-2xl bg-[#09090d] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-4 sm:space-y-6">
      
      {/* ═══ Header & Preset Selector ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-inner">
            <Sliders size={15} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Parametric Equalizer</span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10 uppercase tracking-wider">
                5-Band
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 hidden sm:block">
              Continuous ±12 dB hardware dynamic range
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {(Object.keys(EQ_PRESETS_DATA) as EqPreset[]).map((presetKey) => {
            const isSelected = activeMatchingPreset === presetKey;
            return (
              <button
                key={presetKey}
                onClick={() => onPresetChange(presetKey)}
                className={`px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-150 active:scale-[0.96] cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                }`}
              >
                {presetKey.replace('_', ' ')}
              </button>
            );
          })}

          <button
            onClick={() => onPresetChange('flat')}
            title="Reset to Flat"
            className="p-1 sm:p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-[0.96] border border-white/5 ml-0.5"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ═══ Clean Minimal Spectrum Window ═══ */}
      <div className="relative w-full rounded-xl sm:rounded-2xl bg-[#040406] border border-white/[0.08] p-2.5 sm:p-4 overflow-hidden select-none">
        
        {/* Dynamic SVG Parametric Curve & Visual Feedback */}
        <div className="relative w-full h-28 sm:h-36">
          <svg
            ref={svgRef}
            viewBox="0 0 500 120"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible touch-none block"
          >
            <defs>
              {/* Minimal Monochrome Area Fill Gradient */}
              <linearGradient id="eqMinimalGrad" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="10%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
                <stop offset="90%" stopColor="#ffffff" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* ═══ Clean Minimal Grid Lines ═══ */}
            {/* +12 dB Grid Line */}
            <line x1="0" y1="16" x2="500" y2="16" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" strokeWidth="1" />
            
            {/* Center 0 dB Unity Gain Baseline */}
            <line
              x1="0"
              y1="60"
              x2="500"
              y2="60"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            {/* -12 dB Grid Line */}
            <line x1="0" y1="104" x2="500" y2="104" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" strokeWidth="1" />

            {/* Subtle Vertical Guides at the 5 Band Centers */}
            {[50, 150, 250, 350, 450].map((x) => (
              <line
                key={x}
                x1={x}
                y1="6"
                x2={x}
                y2="114"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeDasharray="2 4"
                strokeWidth="1"
              />
            ))}

            {/* ═══ Minimal Y-Axis dB Labels (3 Clean Markers, Zero Clutter) ═══ */}
            <text x="6" y="15" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="ui-monospace, monospace" fontWeight="500">+12 dB</text>
            <text x="6" y="63" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="ui-monospace, monospace" fontWeight="600">0 dB</text>
            <text x="6" y="108" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="ui-monospace, monospace" fontWeight="500">-12 dB</text>

            {/* ═══ Minimal Area Fill Bounded by 0 dB Baseline ═══ */}
            <path 
              d={fillPath} 
              fill="url(#eqMinimalGrad)" 
              className={activeDraggingNode !== null ? 'transition-none' : 'transition-all duration-200 ease-out'}
            />

            {/* ═══ Crisp Minimal White Transfer Curve ═══ */}
            <path
              d={curvePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] ${
                activeDraggingNode !== null ? 'transition-none' : 'transition-all duration-200 ease-out'
              }`}
            />

            {/* ═══ Minimal Studio Puck Nodes ═══ */}
            {controlPoints.map((pt, i) => {
              const val = pt.val;
              const isDragging = activeDraggingNode === i;
              const isHovered = hoveredNode === i;
              const isActive = Math.abs(val) > 0.5;

              return (
                <g 
                  key={i}
                  className="cursor-ns-resize group select-none"
                  onPointerDown={(e) => handlePointerDownNode(i, e)}
                  onPointerEnter={() => setHoveredNode(i)}
                  onPointerLeave={() => setHoveredNode(null)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onBandChange(i, 0);
                  }}
                >
                  {/* Generous Touch Target (r=24 = 48px touch target) */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="24"
                    fill="transparent"
                  />

                  {/* Clean Outer Ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isDragging ? 11 : isHovered ? 9 : 7}
                    fill="#09090d"
                    stroke="#ffffff"
                    strokeWidth={isDragging ? 2 : 1.5}
                    strokeOpacity={isDragging ? 1 : isHovered ? 0.9 : isActive ? 0.6 : 0.3}
                    className={activeDraggingNode !== null ? 'transition-none' : 'transition-all duration-150'}
                  />

                  {/* Solid White Center Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isDragging ? 3.5 : 2.5}
                    fill="#ffffff"
                  />

                  {/* Clean Floating Readout Tooltip during drag/hover */}
                  {(isDragging || isHovered) && (
                    <g transform={`translate(${pt.x}, ${Math.max(14, pt.y - 18)})`}>
                      <rect
                        x="-20"
                        y="-12"
                        width="40"
                        height="15"
                        rx="4"
                        fill="#121218"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.75"
                        className="drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="-1.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8.5"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="bold"
                      >
                        {val > 0 ? `+${val}` : val} dB
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ═══ 5 Physical Studio Fader Channels (Full Width, Zero Squeeze) ═══ */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-4 pt-1">
        {BANDS.map((band, idx) => {
          const val = safeBands[idx] ?? 0;
          const pct = Math.max(0, Math.min(100, ((val + 12) / 24) * 100));
          const isBoost = val > 0;
          const isCut = val < 0;
          const isActive = val !== 0;

          return (
            <div 
              key={band.label} 
              className="flex flex-col items-center group select-none"
            >
              {/* dB Readout Badge */}
              <div 
                className={`text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded mb-2 tracking-tight tabular-nums transition-all cursor-pointer ${
                  isActive 
                    ? 'text-white bg-white/10 border border-white/20 shadow-sm' 
                    : 'text-zinc-500 bg-white/[0.03] border border-white/[0.04]'
                }`}
                onClick={() => onBandChange(idx, 0)}
                title="Click to reset to 0 dB"
              >
                {val > 0 ? `+${val}` : val} dB
              </div>

              {/* Physical Fader Channel Track Container */}
              <div 
                className="relative h-32 sm:h-40 w-8 sm:w-12 flex items-center justify-center cursor-ns-resize touch-none"
                onPointerDown={(e) => handleChannelPointerDown(idx, e)}
                onDoubleClick={() => onBandChange(idx, 0)}
                title={`${band.label}: ${val} dB (Drag to adjust, double-click to reset)`}
              >
                {/* Visual Fader Slot / Rail */}
                <div className="w-2 sm:w-2.5 h-full rounded-full bg-[#030306] border border-white/10 relative overflow-hidden shadow-inner flex flex-col justify-center pointer-events-none">
                  
                  {/* Center 0 dB Notch Marker */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/30 z-10" />

                  {/* Level Fill: Boost (rises from center) or Cut (falls from center) */}
                  {isBoost && (
                    <div 
                      className="absolute left-0 right-0 bg-white/40"
                      style={{
                        bottom: '50%',
                        height: `${(val / 12) * 50}%`
                      }}
                    />
                  )}
                  {isCut && (
                    <div 
                      className="absolute left-0 right-0 bg-white/20"
                      style={{
                        top: '50%',
                        height: `${(-val / 12) * 50}%`
                      }}
                    />
                  )}
                </div>

                {/* Tactile Hardware Fader Cap */}
                <div 
                  className="absolute pointer-events-none z-20 left-1/2 -translate-x-1/2"
                  style={{
                    bottom: `calc(${pct}% - 9px)`
                  }}
                >
                  <div className="w-7 sm:w-9 h-4.5 rounded bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
                    <div className="w-3.5 sm:w-4.5 h-[1.5px] bg-white rounded-full opacity-80" />
                  </div>
                </div>

                {/* Accessible Invisible HTML5 Range Input */}
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={val}
                  onChange={(e) => onBandChange(idx, Number(e.target.value))}
                  aria-label={`${band.label} Gain`}
                  className="sr-only"
                />
              </div>

              {/* Frequency Label & Category (Never Wraps or Truncates) */}
              <div 
                className="mt-2.5 text-center cursor-pointer group-hover:text-white transition-colors"
                onClick={() => onBandChange(idx, 0)}
                title="Click to reset to 0 dB"
              >
                <span className="text-[11px] sm:text-xs font-bold text-zinc-200 block tracking-tight">
                  {band.label}
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium uppercase tracking-wider block mt-0.5">
                  {band.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Smart Crossfade Transition Slider ═══ */}
      <div className="pt-3.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="max-w-md">
          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <span>Smart Crossfade</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-semibold">
              0s – 12s
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Smooth transition between ending and upcoming tracks
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <div className="relative flex-1 flex items-center h-6">
            {/* Custom filled track rail */}
            <div className="absolute inset-x-0 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ width: `${(crossfadeDuration / 12) * 100}%` }}
              />
            </div>
            
            {/* Range input */}
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={crossfadeDuration}
              onChange={(e) => onCrossfadeChange(Number(e.target.value))}
              aria-label="Crossfade Duration"
              className="relative w-full h-full opacity-0 cursor-pointer z-10"
            />

            {/* Custom Thumb indicator */}
            <div 
              className="absolute pointer-events-none w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] border border-white/30 -ml-1.5 transition-all duration-75"
              style={{ left: `${(crossfadeDuration / 12) * 100}%` }}
            />
          </div>

          <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/10 border border-white/10 min-w-10 text-center tabular-nums">
            {crossfadeDuration}s
          </span>
        </div>
      </div>

    </div>
  );
}

export default StudioEqualizer;
