import { ROOM_THEMES, THEMED_FURNITURE_TYPES } from "../../../convex/lib/roomThemes";
export const FURNITURE_CELLS: Record<string,number> = {
  ...Object.fromEntries(ROOM_THEMES.flatMap((theme,row) => THEMED_FURNITURE_TYPES.map((type,col) => [`furniture_${theme.id}_${type.id}`,16+row*4+col]))),
  furniture_garden_bench:52,furniture_garden_arch:53,furniture_garden_fountain:54,furniture_garden_planter:55,
  furniture_sofa:0, furniture_table:1, furniture_bed:2, furniture_lamp:3,
  furniture_rug:4, decor_bookshelf:5, furniture_cat_tree:6, furniture_perch:7,
  furniture_terrarium:8, furniture_tunnel:9, furniture_hay:10, furniture_aquarium:11,
  furniture_desk:12, furniture_plant_stand:13, decor_plant:13, furniture_window_seat:14, decor_music_player:15,
};
export function furnitureAnchor(id: string) {
  const cell=FURNITURE_CELLS[id];
  return cell === undefined ? 70 : cell>=48 ? 81 : cell>=32 ? [90,88,82,76][Math.floor((cell-32)/4)] : cell >= 16 ? [86,81,75,66][Math.floor((cell-16)/4)] : [90,87,76,65][Math.floor(cell/4)];
}
