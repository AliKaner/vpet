import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AchievementCard } from "../components/achievements/AchievementCard";

export function AchievementsPage() {
  const achievements = useQuery(api.achievements.getMyAchievements);

  if (achievements === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading achievements...</p>;
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <h1 className="font-display text-2xl font-extrabold text-cocoa">Achievements</h1>
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} {...achievement} />
      ))}
    </div>
  );
}
