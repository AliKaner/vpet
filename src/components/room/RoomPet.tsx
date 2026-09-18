import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RoomWorld } from "./roomContext";
export function RoomPet({ children, index, name, total = 2 }: { children: ReactNode; index: number; name: string; total?: number }) {
  const world = useContext(RoomWorld);
  if (!world) return null;
  const columns = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total/columns);
  const u = 28+(index%columns)*48/Math.max(1,columns-1);
  const v = 30+Math.floor(index/columns)*48/Math.max(1,rows-1);
  const left = total <= 3 ? 52+(index-(total-1)/2)*19 : 50+(u-v)*.42;
  const top = total <= 3 ? 71 : 42+(u+v)*.24;
  return createPortal(<div className="world-pet" style={{ left:`${left}%`,top:`${top}%`,width:total > 3 ? `${Math.max(10,26/Math.sqrt(total/2))}%` : undefined,zIndex:Math.round(top) }}><span className="world-pet-name">{name}</span>{children}</div>,world);
}
