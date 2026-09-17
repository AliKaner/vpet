import { formatCountdown } from "../../lib/formatDuration";

interface ActionButtonProps {
  label: string;
  icon: string;
  accentClass: string;
  cooldownRemainingMs: number;
  pending: boolean;
  onPress: () => void;
}

export function ActionButton({ label, icon, accentClass, cooldownRemainingMs, pending, onPress }: ActionButtonProps) {
  const disabled = cooldownRemainingMs > 0 || pending;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-3 text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${accentClass}`}
    >
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-bold">{label}</span>
      {cooldownRemainingMs > 0 && (
        <span className="text-[10px] font-medium opacity-90">{formatCountdown(cooldownRemainingMs)}</span>
      )}
    </button>
  );
}
