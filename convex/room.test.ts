/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { SET_FURNITURE } from "./lib/furnitureSets";
import { isWallFurniture } from "./lib/shopItems";
const modules = import.meta.glob("./**/*.ts");
test("every expansion item can be bought and placed; curtains require a wall",async()=>{
  const t=convexTest(schema,modules);
  const id=await t.run(ctx=>ctx.db.insert("users",{name:"Collector",coins:10000}));
  const user=t.withIdentity({subject:id});
  for(let expectedLevel=1;expectedLevel<6;expectedLevel++) await user.mutation(api.decor.upgradeHome,{expectedLevel});
  for(const item of SET_FURNITURE) {
    await user.mutation(api.shop.buyItem,{itemId:item.id});
    if(item.wallMounted) await expect(user.mutation(api.decor.placeItem,{itemId:item.id,area:"garden"})).rejects.toThrow("inside");
    await user.mutation(api.decor.placeItem,{itemId:item.id,area:item.outdoor?"garden":"room"});
  }
  expect((await user.query(api.decor.getMyRoom)).placements).toHaveLength(32);
  expect(isWallFurniture("furniture_disco_armchair")).toBe(false);
  expect(isWallFurniture("decor_disco_ball")).toBe(true);
  expect(isWallFurniture("furniture_set_curtains_0")).toBe(true);
});
test("theme furniture and matching surfaces can be bought and placed",async()=>{
  const t=convexTest(schema,modules);
  const userId=await t.run(ctx=>ctx.db.insert("users",{name:"Decorator",coins:1000}));
  const user=t.withIdentity({subject:userId});
  for(const theme of ["forest","seaside","strawberry","midnight"]) {
    const itemId=`furniture_${theme}_armchair`;
    await user.mutation(api.shop.buyItem,{itemId});
    await user.mutation(api.decor.placeItem,{itemId});
    await user.mutation(api.shop.buyItem,{itemId:`wallpaper_theme_${theme}`});
    await user.mutation(api.shop.buyItem,{itemId:`floor_theme_${theme}`});
    await user.mutation(api.decor.setWallpaper,{itemId:`wallpaper_theme_${theme}`});
    await user.mutation(api.decor.setFloor,{itemId:`floor_theme_${theme}`});
    const room=await user.query(api.decor.getMyRoom);
    expect(room.placedItemIds).toContain(itemId);
    expect(room.wallpaperId).toBe(`wallpaper_theme_${theme}`);
    expect(room.floorId).toBe(`floor_theme_${theme}`);
  }
});
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
  expect((await a.query(api.decor.getMyRoom)).placements).toEqual([{itemId:"furniture_cat_tree",x:40,y:60,flipped:true,area:"room"}]);
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
  expect((await a.query(api.decor.getMyRoom)).placements[0].x).toBe(20);
});

test("home upgrades charge once, are shared, expand garden capacity and stop at max level",async()=>{
  const t=convexTest(schema,modules);
  const [ownerId,partnerId]=await t.run(async ctx=>{
    const owner=await ctx.db.insert("users",{name:"Owner",coins:3000});
    const partner=await ctx.db.insert("users",{name:"Partner",partnerId:owner,coins:0});
    await ctx.db.patch(owner,{partnerId:partner});
    for(const suffix of ["bench","arch","fountain"]) await ctx.db.insert("inventoryItems",{ownerId:owner,itemId:`furniture_garden_${suffix}`,purchasedAt:0});
    return [owner,partner];
  });
  const owner=t.withIdentity({subject:ownerId});const partner=t.withIdentity({subject:partnerId});
  expect((await owner.query(api.decor.getMyRoom)).level).toBe(1);
  for(const suffix of ["bench","arch"]) await owner.mutation(api.decor.placeItem,{itemId:`furniture_garden_${suffix}`,area:"garden"});
  await expect(owner.mutation(api.decor.placeItem,{itemId:"furniture_garden_fountain",area:"garden"})).rejects.toThrow("Upgrade");
  await owner.mutation(api.decor.upgradeHome,{expectedLevel:1});
  expect((await owner.query(api.users.getMyProfile)).coins).toBe(2920);
  expect((await partner.query(api.decor.getMyRoom)).level).toBe(2);
  await expect(owner.mutation(api.decor.upgradeHome,{expectedLevel:1})).rejects.toThrow();
  expect((await owner.query(api.users.getMyProfile)).coins).toBe(2920);
  await expect(partner.mutation(api.decor.upgradeHome,{expectedLevel:2})).rejects.toThrow("coins");
  await partner.mutation(api.decor.placeItem,{itemId:"furniture_garden_fountain",area:"garden"});
  await partner.mutation(api.decor.moveItem,{itemId:"furniture_garden_fountain",x:60,y:44,flipped:true});
  expect((await owner.query(api.decor.getMyRoom)).placements.find(p=>p.itemId==="furniture_garden_fountain")).toMatchObject({area:"garden",x:60,y:44});
  await expect(t.mutation(api.decor.upgradeHome,{expectedLevel:2})).rejects.toThrow();
  await owner.mutation(api.decor.upgradeHome,{expectedLevel:2});
  await owner.mutation(api.decor.upgradeHome,{expectedLevel:3});
  expect((await owner.query(api.users.getMyProfile)).coins).toBe(2390);
  await owner.mutation(api.decor.upgradeHome,{expectedLevel:4});
  await owner.mutation(api.decor.upgradeHome,{expectedLevel:5});
  expect((await owner.query(api.users.getMyProfile)).coins).toBe(840);
  await expect(owner.mutation(api.decor.upgradeHome,{expectedLevel:6})).rejects.toThrow();
  expect((await partner.query(api.decor.getMyRoom)).level).toBe(6);
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
