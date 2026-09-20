import { ROOM_THEMES, THEMED_FURNITURE_TYPES } from "../../../convex/lib/roomThemes";
import { SET_FURNITURE } from "../../../convex/lib/furnitureSets";
export const FURNITURE_CELLS: Record<string,number> = {
  ...Object.fromEntries(SET_FURNITURE.map(item=>[item.id,item.sprite])),
  ...Object.fromEntries(ROOM_THEMES.flatMap((theme,row) => THEMED_FURNITURE_TYPES.map((type,col) => [`furniture_${theme.id}_${type.id}`,16+row*4+col]))),
  furniture_garden_bench:52,furniture_garden_arch:53,furniture_garden_fountain:54,furniture_garden_planter:55,
  furniture_sofa:0, furniture_table:1, furniture_bed:2, furniture_lamp:3,
  furniture_rug:4, decor_bookshelf:5, furniture_cat_tree:6, furniture_perch:7,
  furniture_terrarium:8, furniture_tunnel:9, furniture_hay:10, furniture_aquarium:11,
  furniture_desk:12, furniture_plant_stand:13, decor_plant:13, furniture_window_seat:14, decor_music_player:15,
};
export function furnitureAnchor(id: string) {
  const cell=FURNITURE_CELLS[id];
  if(cell>=88) return [94,96,94,82,97,97,97,82,95,98,96,88,94,96,93,84,97,88][Math.floor((cell-88)/4)];
  if(cell>=56) return [96,98,90,78,96,94,96,79][Math.floor((cell-56)/4)];
  // Anchor% is how far down the pin point sits within the sprite - higher means
  // more of the sprite renders ABOVE the pin. The hand-drawn SVG fallbacks (wall
  // decor with no atlas cell: window, clock, disco ball, streamers) are roughly
  // centered shapes, not floor-standing ones, so they need a much lower anchor
  // than furniture does or they render mostly above their wall pin point and
  // poke out over the top of the wall.
  return cell === undefined ? 40 : cell>=48 ? 81 : cell>=32 ? [90,88,82,76][Math.floor((cell-32)/4)] : cell >= 16 ? [86,81,75,66][Math.floor((cell-16)/4)] : [90,87,76,65][Math.floor(cell/4)];
}
