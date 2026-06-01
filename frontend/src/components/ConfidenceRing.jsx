import { motion } from 'framer-motion';

/**
 * ConfidenceRing
 * ==============
 * Animated SVG radial ring displaying a 0–100 percentage value.
 *
 * Props:
 *   value      — number 0–100 (clamped internally)
 *   size       — diameter in px (default 96)
 *   stroke     — ring fill colour (default '#3b82f6')
 *   label      — small caption below the number
 *   thickness  — stroke width (default 7)
 *   fontSize   — centre number font size class (default 'text-lg')
 */
const ConfidenceRing = ({
  value     = 0,
  size      = 96,
  stroke    = '#3b82f6',
  label     = '',
  thickness = 7,
  fontSize  = 'text-lg',
}) => {
  const safeValue  = Math.min(Math.max(Number(value) || 0, 0), 100);
  const radius     = (size - thickness * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset     = circumference - (safeValue / 100) * circumference;
  const center     = size / 2;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth={thickness}
        />
        {/* Progress */}
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>

      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${fontSize} font-bold text-slate-800 leading-none`}>
          {Math.round(safeValue)}%
        </span>
        {label && (
          <span className="text-[9px] font-medium text-slate-400 mt-0.5 leading-none">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConfidenceRing;