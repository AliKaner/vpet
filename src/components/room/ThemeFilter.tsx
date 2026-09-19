import { ROOM_THEMES, type RoomThemeId } from "../../../convex/lib/roomThemes";
export function ThemeFilter({ value,onChange }: { value:RoomThemeId | "all";onChange:(value:RoomThemeId | "all")=>void }) {
  return <div className="room-theme-filter" role="group" aria-label="Furniture collection">
    <button type="button" aria-pressed={value === "all"} onClick={()=>onChange("all")}>All collections</button>
    {ROOM_THEMES.map(theme=><button key={theme.id} type="button" aria-pressed={value===theme.id} onClick={()=>onChange(theme.id)}><span aria-hidden style={{background:theme.color}} />{theme.label}</button>)}
  </div>;
}
