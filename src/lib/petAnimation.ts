export type AnimationPose = "idle" | "feed" | "pet" | "clean";
export interface AnimationFrame { cell: number; duration: number }
const idle: AnimationFrame[] = [
  { cell: 0, duration: 1050 }, { cell: 1, duration: 180 },
  { cell: 2, duration: 140 }, { cell: 3, duration: 220 },
  { cell: 0, duration: 600 }, { cell: 3, duration: 240 },
  { cell: 1, duration: 220 }, { cell: 0, duration: 700 },
];
export function animationFrames(pose: AnimationPose): AnimationFrame[] {
  if (pose === "idle") return idle;
  const start = { feed: 4, pet: 8, clean: 12 }[pose];
  // Every action uses the SAME neutral cell as idle at both ends.
  return [
    { cell: 0, duration: 160 },
    ...[0, 1, 2, 3, 2, 3, 2, 3, 2, 1, 0].map((offset) => ({ cell: start + offset, duration: offset < 2 ? 160 : 200 })),
    { cell: 0, duration: 240 },
  ];
}
export function sampleAnimation(pose: AnimationPose, elapsed: number): { cell: number; done: boolean } {
  const frames = animationFrames(pose);
  const total = frames.reduce((sum, frame) => sum + frame.duration, 0);
  if (pose !== "idle" && elapsed >= total) return { cell: 0, done: true };
  let time = Math.max(0, elapsed) % total;
  for (const frame of frames) {
    if (time < frame.duration) return { cell: frame.cell, done: false };
    time -= frame.duration;
  }
  return { cell: 0, done: false };
}
