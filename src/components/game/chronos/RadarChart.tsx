'use client';

interface RadarChartProps {
  stats: Record<string, number>; // label -> value (0-100)
  color: string;
  size?: number;
}

export function RadarChart({ stats, color, size = 120 }: RadarChartProps) {
  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const count = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 20;

  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate polygon points for a given set of values
  const getPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const angle = startAngle + i * angleStep;
      const r = (v / 100) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Grid lines */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={Array.from({ length: count }, (_, i) => {
            const angle = startAngle + i * angleStep;
            const r = level * radius;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(angle)}
            y2={cy + radius * Math.sin(angle)}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={getPoints(values)}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Data points */}
      {values.map((v, i) => {
        const angle = startAngle + i * angleStep;
        const r = (v / 100) * radius;
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r={2.5}
            fill={color}
          />
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = radius + 14;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-muted"
            style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}
          >
            {label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
