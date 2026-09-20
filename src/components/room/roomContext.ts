import { createContext } from "react";
import { BASE_TILES,roomGeometry } from "../../../convex/lib/roomTiles";
export const RoomWorld = createContext<HTMLDivElement | null>(null);
export const RoomGeometry=createContext(roomGeometry(BASE_TILES));
