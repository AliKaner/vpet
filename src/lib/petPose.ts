export type PetAction = "feed" | "pet" | "clean";
export function actionPose(action: string): PetAction {
  if (action === "feed") return "feed";
  if (action.startsWith("clean") || action === "bathe" || action === "groom") return "clean";
  return "pet";
}
