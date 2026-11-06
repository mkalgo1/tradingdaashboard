interface SemiCircleGaugeProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  label?: string;
}

export default function SemiCircleGauge({
  value,
  max = 100,
  color = '#22c55e',
  size = 120,
  label,
}: SemiCircleGaugeProps) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 12;
  const strokeWidth = 8;

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalAngle = endAngle - startAngle;

  function polarToCartesian(angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  const start = polarToCartesian(startAngle);
  const bgEnd = polarToCartesian(endAngle);
  const fgEnd = polarToCartesian(startAngle + totalAngle * pct);

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const fgPath =
    pct > 0
      ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${fgEnd.x} ${fgEnd.y}`
      : '';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {fgPath && (
          <path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        )}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill="white"
          fontSize={size * 0.16}
          fontWeight="700"
          fontFamily="'Roboto Mono', monospace"
        >
          {value.toFixed(1)}%
        </text>
        {label && (
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            fill="rgba(148,163,184,0.7)"
            fontSize={size * 0.09}
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
