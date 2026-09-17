import type { PetAction } from "./petPose";
let context: AudioContext | undefined;
export function unlockPetSound() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch { /* Sound is optional on unsupported browsers. */ }
}
export function playPetSound(action: PetAction) {
  if (!context || context.state !== "running") return;
  const notes = { feed: [330, 440, 550], pet: [523, 659, 784], clean: [740, 988, 1175] }[action];
  notes.forEach((frequency, i) => {
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    const start = context!.currentTime + i * 0.09;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.045, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    oscillator.connect(gain);
    gain.connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

