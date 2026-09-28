'use client';

/**
 * AntalyaInvestmentMap.tsx
 *
 * Şematik Antalya İlçe Haritası (19 İlçe)
 * PDF'de kırmızı ile işaretlenen 19 ilçe düzenine ve konum sıralamasına sadık şematik gösterim.
 */

import { useState, useCallback, useMemo } from 'react';
import { MapEngineProps } from './types';
import { RotateCcw, MapPin, Sparkles } from 'lucide-react';
import rawDistrictMeta from '@/lib/mock-data/antalyaDistricts.json';
import rawDistrictPaths from '@/lib/mock-data/antalyaDistrictPaths.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawDistrictMetaItem {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  isInvestmentDistrict: boolean;
}

interface DistrictMeta {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  isInvestmentDistrict: boolean;
}

// ─── SVG Viewport (Zoomed in on 19 districts) ─────────────────────────────────
const VX = 65;
const VY = 35;
const VW = 840;
const VH = 450;

// ─── Helper to parse district metadata into a map keyed by ID ─────────────────
function parseMetaMap(): Record<string, DistrictMeta> {
  const map: Record<string, DistrictMeta> = {};
  if (Array.isArray(rawDistrictMeta)) {
    (rawDistrictMeta as RawDistrictMetaItem[]).forEach((item) => {
      map[item.name] = {
        id: item.id || item.name,
        name: item.name,
        labelX: item.labelX,
        labelY: item.labelY,
        isInvestmentDistrict: item.isInvestmentDistrict,
      };
    });
  } else {
    Object.entries(rawDistrictMeta as Record<string, any>).forEach(([key, item]) => {
      map[key] = {
        id: item.id || key,
        name: item.name || key,
        labelX: item.labelX,
        labelY: item.labelY,
        isInvestmentDistrict: item.isInvestmentDistrict,
      };
    });
  }
  return map;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AntalyaInvestmentMap({
  selection,
  onDistrictClick,
  onReset,
}: MapEngineProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const metaMap = useMemo(() => parseMetaMap(), []);
  const pathsMap = rawDistrictPaths as Record<string, string | string[]>;

  const handleHover = useCallback((name: string | null) => {
    setHoveredDistrict(name);
  }, []);

  const handleClick = useCallback(
    (name: string) => {
      onDistrictClick(name);
    },
    [onDistrictClick]
  );

  const hoveredMeta = hoveredDistrict ? metaMap[hoveredDistrict] : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">

      {/* ── Top Header Toolbar ── */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 flex-wrap max-w-[calc(100%-24px)]">
        <button
          onClick={onReset}
          title="Antalya Geneli Verilerine Dön"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md backdrop-blur-md ${!selection.district
            ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/20'
            : 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:bg-slate-700 hover:text-white'
            }`}
        >
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span>Antalya</span>
          {!selection.district && (
            <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded text-white">
              Genel
            </span>
          )}
        </button>

        {selection.district && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Seçili: {selection.district}</span>
          </div>
        )}
      </div>



      {/* ── SVG Map ── */}
      <svg
        viewBox={`${VX} ${VY} ${VW} ${VH}`}
        className="w-full h-full select-none"
      >
        <defs>
          {/* Subtle Grid Pattern for background */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          {/* Glow filter for active/hovered districts */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Map Background */}
        <rect x={VX} y={VY} width={VW} height={VH} fill="#0f172a" />
        <rect x={VX} y={VY} width={VW} height={VH} fill="url(#grid)" />

        {/* Akdeniz / Mediterranean Sea visual indicator */}
        <path
          d={`M ${VX} ${VY + VH - 35} Q ${VX + VW / 2} ${VY + VH + 15} ${VX + VW} ${VY + VH - 35} L ${VX + VW} ${VY + VH} L ${VX} ${VY + VH} Z`}
          fill="#0284c7"
          fillOpacity="0.08"
        />
        <text
          x={VX + VW / 2}
          y={VY + VH - 10}
          textAnchor="middle"
          fill="#38bdf8"
          fillOpacity="0.25"
          fontSize="11"
          fontWeight="600"
          letterSpacing="4"
        >
          AKDENİZ
        </text>

        {/* Render 19 District Polygons */}
        {Object.entries(metaMap).map(([name, meta]) => {
          const rawPath = pathsMap[name];
          const pathList = Array.isArray(rawPath) ? rawPath : [rawPath].filter(Boolean);
          const isSelected = selection.district === name;
          const isHovered = hoveredDistrict === name;
          const isInvestment = meta.isInvestmentDistrict;

          // Color calculations
          let fillColor = isInvestment ? '#065f46' : '#1e293b';
          let fillOpacity = isInvestment ? 0.45 : 0.6;
          let strokeColor = isInvestment ? '#10b981' : '#475569';
          let strokeWidth = isInvestment ? 1.5 : 1.2;

          if (isHovered) {
            fillColor = isInvestment ? '#047857' : '#334155';
            fillOpacity = 0.75;
            strokeColor = isInvestment ? '#34d399' : '#94a3b8';
            strokeWidth = 2.2;
          }

          if (isSelected) {
            fillColor = '#2563eb';
            fillOpacity = 0.85;
            strokeColor = '#93c5fd';
            strokeWidth = 3;
          }

          return (
            <g
              key={name}
              className="district-shape cursor-pointer transition-all duration-200"
              onMouseEnter={() => handleHover(name)}
              onMouseLeave={() => handleHover(null)}
              onClick={() => handleClick(name)}
              filter={isSelected ? 'url(#glow)' : undefined}
            >
              {pathList.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-colors duration-150"
                />
              ))}

              {/* Pulsing Green Dot for Investment Districts */}
              {isInvestment && !isSelected && (
                <g transform={`translate(${meta.labelX}, ${meta.labelY - 14})`} style={{ pointerEvents: 'none' }}>
                  <circle r="7" fill="#10b981" opacity="0.6" className="animate-ping" />
                  <circle r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}

              {/* District Center Badge / Marker */}
              <circle
                cx={meta.labelX}
                cy={meta.labelY - 10}
                r={isSelected ? 4.5 : isHovered ? 4 : isInvestment ? 3 : 2.5}
                fill={isSelected ? '#ffffff' : isInvestment ? '#10b981' : '#64748b'}
                stroke={isSelected ? '#2563eb' : '#0f172a'}
                strokeWidth={1.5}
              />

              {/* District Name Text */}
              <text
                x={meta.labelX}
                y={meta.labelY + 6}
                textAnchor="middle"
                fontSize={isSelected ? '11' : isHovered ? '10.5' : isInvestment ? '10' : '9'}
                fontWeight={isSelected || isInvestment ? '700' : '500'}
                fill={isSelected ? '#ffffff' : isHovered ? '#f8fafc' : isInvestment ? '#6ee7b7' : '#94a3b8'}
                fontFamily="Inter, system-ui, sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {name}
              </text>
            </g>
          );
        })}

        {/* Hover Tooltip Overlay */}
        {hoveredDistrict && hoveredMeta && (
          <g transform={`translate(${hoveredMeta.labelX}, ${hoveredMeta.labelY - 36})`} style={{ pointerEvents: 'none' }}>
            <rect
              x="-65"
              y="-12"
              width="130"
              height="26"
              rx="6"
              fill="#0f172a"
              stroke={hoveredMeta.isInvestmentDistrict ? '#10b981' : '#475569'}
              strokeWidth="1.5"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {hoveredDistrict} {hoveredMeta.isInvestmentDistrict ? '★ (Yatırım)' : '(Diğer)'}
            </text>
          </g>
        )}
      </svg>


    </div>
  );
}

