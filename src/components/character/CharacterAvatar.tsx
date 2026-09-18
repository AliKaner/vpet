import type { Character } from "../../../convex/lib/character";
const hair: Record<Character["hairColor"], string> = { chestnut: "#9c5d3c", black: "#3d3b49", blonde: "#e7c36e", pink: "#db8eaf", blue: "#6f9fd0" };
const eyes: Record<Character["eyeColor"], string> = { brown: "#6e4939", green: "#5ca37e", blue: "#6096c4", hazel: "#a48a4b", violet: "#9876ba" };
export function CharacterAvatar({ character, small = false }: { character: Character; small?: boolean }) {
  return <span className={`character-avatar character-${character.gender} hair-${character.hairStyle} ${small ? "character-avatar-small" : ""}`}>
    <span className="character-hair" style={{ background: hair[character.hairColor] }} />
    <span className="character-face"><i style={{ background: eyes[character.eyeColor] }} /><i style={{ background: eyes[character.eyeColor] }} /></span>
    <span className="character-shirt" />
  </span>;
}
