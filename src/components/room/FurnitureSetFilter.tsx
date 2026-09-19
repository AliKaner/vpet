import { FURNITURE_SETS, type FurnitureSetId } from "../../../convex/lib/furnitureSets";
export function FurnitureSetFilter({value,onChange}:{value:FurnitureSetId|"all";onChange:(value:FurnitureSetId|"all")=>void}) {
  return <label className="furniture-set-filter">Furniture set <select value={value} onChange={e=>onChange(e.target.value as FurnitureSetId|"all")}>
    <option value="all">All furniture sets</option>{FURNITURE_SETS.map(set=><option key={set.id} value={set.id}>{set.label}</option>)}
  </select></label>;
}
