import { clamp } from "../../../convex/lib/petMath";

interface StatBarProps {
  label: string;
  value: number;
  icon: string;
  colorVar: string;
}

export function StatBar({ label, value, icon, colorVar }: StatBarProps) {
  const pct = Math.round(clamp(value, 0, 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center text-lg" aria-hidden>
        {icon}
      </span>
      <div className="flex-1">
        <div className="mb-0.5 flex justify-between text-xs font-semibold text-cocoa-soft">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: colorVar }}
          />
        </div>
      </div>
    </div>
  );
}
