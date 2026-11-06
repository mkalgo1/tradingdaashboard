interface GaugeProps {
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
  size = 130,
  label,
}: GaugeProps) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const strokeWidth = 9;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // 240-degree arc gauge (speedometer style, open at bottom)
  // Arc spans 240 degrees (from 150 deg to 390 deg)
  const arcDegree = 240;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (arcDegree / 360) * circumference;
  const dashOffset = arcLength * (1 - pct);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg
        width={size}
        height={size * 0.88}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`gauge-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={color} floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Background Track (240 deg arc) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
        />

        {/* Active Progress Arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#gauge-grad-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          filter="url(#gauge-glow)"
          transform={`rotate(150 ${cx} ${cy})`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Center Percentage Display */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="24"
          fontWeight="800"
          fontFamily="'Roboto Mono', monospace"
          className="tracking-tight"
        >
          {value.toFixed(1)}%
        </text>

        {/* Subtitle / Status below the number */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="10"
          fontWeight="700"
          fontFamily="'Roboto Mono', monospace"
          letterSpacing="0.08em"
        >
          {label || (value >= 75 ? 'OPTIMAL' : value >= 50 ? 'AVERAGE' : 'DEFICIT')}
        </text>
      </svg>
    </div>
  );
}
