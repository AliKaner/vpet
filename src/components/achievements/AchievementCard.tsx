interface AchievementCardProps {
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function AchievementCard({ label, description, icon, unlocked }: AchievementCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-cozy p-4 shadow-sm transition ${
        unlocked ? "bg-white/70" : "bg-white/30 grayscale"
      }`}
    >
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <div className="flex-1">
        <p className={`font-bold ${unlocked ? "text-cocoa" : "text-cocoa-soft"}`}>{label}</p>
        <p className="text-xs text-cocoa-soft">{description}</p>
      </div>
      {unlocked && <span className="text-xs font-bold text-mint-dark">Unlocked</span>}
    </div>
  );
}
