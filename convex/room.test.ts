/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
async function setup() {
  const t = convexTest(schema,modules);
  const [a,b,c] = await t.run(async ctx => {
    const a = await ctx.db.insert("users",{name:"A"});
    const b = await ctx.db.insert("users",{name:"B",partnerId:a});
    const c = await ctx.db.insert("users",{name:"C"});
    await ctx.db.patch(a,{partnerId:b});
    await ctx.db.insert("inventoryItems",{ownerId:a,itemId:"furniture_cat_tree",purchasedAt:0});
    await ctx.db.insert("inventoryItems",{ownerId:a,itemId:"cloth_overalls",purchasedAt:0});
    return [a,b,c];
  });
  return { t, a:t.withIdentity({subject:a}), b:t.withIdentity({subject:b}), c:t.withIdentity({subject:c}) };
}
test("partners share placements, moves, orientation and removals",async () => {
  const {a,b} = await setup();
  await a.mutation(api.decor.placeItem,{itemId:"furniture_cat_tree"});
  await b.mutation(api.decor.moveItem,{itemId:"furniture_cat_tree",x:40,y:60,flipped:true});
  expect((await a.query(api.decor.getMyRoom)).placements).toEqual([{itemId:"furniture_cat_tree",x:40,y:60,flipped:true}]);
  await b.mutation(api.decor.removeItem,{itemId:"furniture_cat_tree"});
  expect((await a.query(api.decor.getMyRoom)).placements).toEqual([]);
});
test("foreign and anonymous users cannot move household items; bounds are enforced",async () => {
  const {t,a,c} = await setup();
  await a.mutation(api.decor.placeItem,{itemId:"furniture_cat_tree"});
  const args = {itemId:"furniture_cat_tree",x:40,y:60,flipped:false};
  await expect(c.mutation(api.decor.moveItem,args)).rejects.toThrow();
  await expect(t.mutation(api.decor.moveItem,args)).rejects.toThrow();
  for (const x of [-1,100,NaN,Infinity]) await expect(a.mutation(api.decor.moveItem,{...args,x})).rejects.toThrow();
  expect((await a.query(api.decor.getMyRoom)).placements[0].x).toBeUndefined();
});
test("character customization persists and requires personally owned clothing",async () => {
  const {a,b} = await setup();
  const character = {gender:"neutral",hairStyle:"bob",eyeColor:"green",hairColor:"black",skinTone:"deep",accessory:"glasses",clothingId:"cloth_overalls"} as const;
  await a.mutation(api.users.updateCharacter,character);
  expect((await a.query(api.users.getMyProfile)).character).toEqual(character);
  await expect(b.mutation(api.users.updateCharacter,character)).rejects.toThrow();
  await expect(a.mutation(api.users.updateCharacter,{...character,clothingId:"furniture_cat_tree"})).rejects.toThrow();
  await a.mutation(api.users.updateCharacter,{...character,clothingId:undefined});
  expect((await a.query(api.users.getMyProfile)).character?.clothingId).toBeUndefined();
});
