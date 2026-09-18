export const FURNITURE_CELLS: Record<string,number> = {
  furniture_sofa:0, furniture_table:1, furniture_bed:2, furniture_lamp:3,
  furniture_rug:4, decor_bookshelf:5, furniture_cat_tree:6, furniture_perch:7,
  furniture_terrarium:8, furniture_tunnel:9, furniture_hay:10, furniture_aquarium:11,
  furniture_desk:12, furniture_plant_stand:13, decor_plant:13, furniture_window_seat:14, decor_music_player:15,
};
export function furnitureAnchor(id: string) {
  const cell=FURNITURE_CELLS[id];
  return cell === undefined ? 70 : [90,87,76,65][Math.floor(cell/4)];
}
