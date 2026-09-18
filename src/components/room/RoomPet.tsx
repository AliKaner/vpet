import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RoomWorld } from "./roomContext";
export function RoomPet({ children, index, name }: { children: ReactNode; index: number; name: string }) {
  const world = useContext(RoomWorld);
  if (!world) return null;
  const col = index % 3;
  const row = Math.floor(index / 3);
  return createPortal(<div className="world-pet" style={{ left: `${34+col*17-row*5}%`, top: `${68+row*9}%`, zIndex: 70+row*9 }}><span className="world-pet-name">{name}</span>{children}</div>, world);
}
