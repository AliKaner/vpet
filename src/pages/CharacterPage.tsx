import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { SHOP_CATALOG } from "../../convex/lib/shopItems";
import { CharacterAvatar } from "../components/character/CharacterAvatar";
import type { Character } from "../../convex/lib/character";

const defaults: Character = { gender: "neutral", hairStyle: "short", eyeColor: "brown", hairColor: "chestnut" };
const choices = {
  gender: [["neutral", "Neutral"], ["feminine", "Feminine"], ["masculine", "Masculine"]],
  hairStyle: [["short", "Short"], ["bob", "Bob"], ["curly", "Curly"], ["long", "Long"], ["bun", "Bun"]],
  hairColor: [["chestnut", "Chestnut"], ["black", "Black"], ["blonde", "Blonde"], ["pink", "Pink"], ["blue", "Blue"]],
  eyeColor: [["brown", "Brown"], ["green", "Green"], ["blue", "Blue"], ["hazel", "Hazel"], ["violet", "Violet"]],
} as const;
export function CharacterPage() {
  const profile = useQuery(api.users.getMyProfile);
  const owned = useQuery(api.shop.getMyInventory);
  const save = useMutation(api.users.updateCharacter);
  const [draft, setDraft] = useState<Character | null>(null);
  const [saving, setSaving] = useState(false);
  const character = draft ?? profile?.character ?? defaults;
  if (!profile || !owned) return <p className="py-10 text-center text-sm text-cocoa-soft">Loading character studio...</p>;
  async function persist() {
    setSaving(true);
    try { await save(character); setDraft(null); } finally { setSaving(false); }
  }
  const clothes = SHOP_CATALOG.filter((item) => item.kind === "clothing" && owned.includes(item.id));
  function set<K extends keyof Character>(key: K, value: Character[K]) { setDraft({ ...character, [key]: value }); }
  return <div className="character-page">
    <div><h1 className="font-display text-2xl font-extrabold text-cocoa">Your character</h1><p className="text-sm text-cocoa-soft">Create the person who lives in the room with your pets.</p></div>
    <div className="character-studio"><CharacterAvatar character={character} /><div className="character-form">
      {(Object.keys(choices) as (keyof typeof choices)[]).map((key) => <fieldset key={key}><legend>{key === "hairStyle" ? "Hair style" : key === "hairColor" ? "Hair color" : key === "eyeColor" ? "Eye color" : "Gender"}</legend><div className="character-options">{choices[key].map(([value, label]) => <button type="button" key={value} className={character[key] === value ? "selected" : ""} onClick={() => set(key, value as Character[typeof key])}>{label}</button>)}</div></fieldset>)}
      <fieldset><legend>Clothing</legend><div className="character-options"><button type="button" className={!character.clothingId ? "selected" : ""} onClick={() => set("clothingId", undefined)}>Everyday</button>{clothes.map((item) => <button type="button" key={item.id} className={character.clothingId === item.id ? "selected" : ""} onClick={() => set("clothingId", item.id)}>{item.icon} {item.label}</button>)}</div></fieldset>
      <button type="button" disabled={saving} className="character-save" onClick={() => void persist()}>{saving ? "Saving…" : "Save character"}</button>
    </div></div>
  </div>;
}
