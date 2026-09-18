import type { Character } from "../../../convex/lib/character";
const hair = { chestnut: "#9c5d3c", black: "#3d3b49", blonde: "#e7c36e", pink: "#db8eaf", blue: "#6f9fd0" };
const eyes = { brown: "#6e4939", green: "#5ca37e", blue: "#6096c4", hazel: "#a48a4b", violet: "#9876ba" };
const skin = { peach: "#f2c59c", warm: "#dba477", tan: "#ad7756", deep: "#78503f" };
const outfitColors: Record<string,string> = { cloth_hoodie:"#bdacd5",cloth_raincoat:"#efc96a",cloth_pajamas:"#a9bedb",cloth_overalls:"#719dab",cloth_sweater:"#bc7f83",cloth_vest:"#9da977" };
export function CharacterAvatar({ character:c, small = false }: { character: Character; small?: boolean }) {
  const outfit = c.clothingId ?? "";
  return <svg className={`character-doll ${small ? "small" : ""}`} viewBox="0 0 80 112" role="img" aria-label="Your customized character" shapeRendering="crispEdges">
    <ellipse cx="40" cy="105" rx="25" ry="5" fill="#68533c22" />
    <g stroke="#594637" strokeWidth="2" strokeLinejoin="round">
      <path d="M26 81v20h11V84h6v17h11V81Z" fill="#777994" /><path d="M24 99h14v6H22v-4Zm18 0h14l3 4v2H42Z" fill="#705547" />
      <path d="M22 62 13 85l8 4 7-14h24l7 14 8-4-9-23Z" fill={skin[c.skinTone ?? "peach"]} />
      <path d="M25 61h30l6 17-9 2v9H28v-9l-9-2Z" fill={outfitColors[outfit] ?? "#9bbfaf"} />
      {outfit === "cloth_overalls" && <path d="M30 62v13h20V62M28 89V75h24v14" fill="#648597" />}
      {outfit === "cloth_hoodie" && <path d="m29 65 11 10 11-10M34 78h12v7H34Z" fill="#a08fba" />}
      {outfit === "cloth_raincoat" && <path d="M40 64v24m-8-12h3m10 0h3" stroke="#a48438" />}
      {outfit === "cloth_pajamas" && <path d="m32 72 2 3 3-2m8 5 2 3 3-2" stroke="#fff0b9" />}
      <path d={`M17 30V18h6V12h34v6h6v${c.hairStyle === "long" ? 55 : c.hairStyle === "bob" ? 43 : 25}H17Z`} fill={hair[c.hairColor]} />
      {c.hairStyle === "bun" && <path d="M42 6h14v13H42Z" fill={hair[c.hairColor]} />}
      {c.hairStyle === "curly" && <path d="M14 21v-8h8V7h12V4h15v4h12v8h6v17H14Z" fill={hair[c.hairColor]} />}
      <path d="M21 29h38v25l-7 9H28l-7-9Z" fill={skin[c.skinTone ?? "peach"]} />
      <path d="M19 24h42v12H47v-7H33v9H20Z" fill={hair[c.hairColor]} />
      <path d="M28 42h6v8h-6Zm18 0h6v8h-6Z" fill={eyes[c.eyeColor]} stroke="none" /><path d="M29 42h2v2h-2m18-2h2v2h-2" stroke="#fff" strokeWidth="1" />
      <path d="M36 54h8" stroke="#956258" />
      {c.accessory === "glasses" && <path d="M24 40h13v12H24Zm19 0h13v12H43ZM37 44h6" fill="none" stroke="#514c60" />}
      {c.accessory === "freckles" && <path d="M25 52h2m3 1h2m17 0h2m3-1h2" stroke="#a26b4e" />}
      {outfit === "cloth_scarf" && <path d="M25 61h30v7H41v13h-8V68h-8Z" fill="#d99893" />}
      {outfit === "cloth_cap" && <path d="M19 25V14h37v11h9v5H17v-5Z" fill="#80a7ba" />}
      {outfit === "cloth_crown" && <path d="m22 19-2-13 12 8 8-12 8 12 12-8-2 13Z" fill="#efc96a" />}
      {outfit === "cloth_bow" && <path d="m44 15 13-7v15Zm0 0L32 8v15Z" fill="#d998b1" />}
    </g>
  </svg>;
}
