/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { test,expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { BASE_TILES,roomGeometry,tilePrice } from "./lib/roomTiles";
const modules=import.meta.glob("./**/*.ts");
async function setup() {
  const t=convexTest(schema,modules);
  const [a,b,c]=await t.run(async ctx=>{
    const a=await ctx.db.insert("users",{name:"Builder",coins:1000});
    const b=await ctx.db.insert("users",{name:"Partner",coins:1000,partnerId:a});
    const c=await ctx.db.insert("users",{name:"Visitor",coins:0});
    await ctx.db.patch(a,{partnerId:b});
    await ctx.db.insert("inventoryItems",{ownerId:a,itemId:"furniture_sofa",purchasedAt:0});
    return [a,b,c];
  });
  return {t,a:t.withIdentity({subject:a}),b:t.withIdentity({subject:b}),c:t.withIdentity({subject:c})};
}
test("tiles extend the shared floor, charge the buyer and reject stale or disconnected purchases",async()=>{
  const {t,a,b,c}=await setup();
  const args={x:4,y:1,expectedPurchases:0};
  await expect(t.mutation(api.decor.buyTile,args)).rejects.toThrow();
  await expect(c.mutation(api.decor.buyTile,args)).rejects.toThrow("coins");
  for(const coords of [{x:9,y:9},{x:NaN,y:0},{x:1.5,y:0},{x:0,y:0}]) await expect(a.mutation(api.decor.buyTile,{...args,...coords})).rejects.toThrow();
  expect((await a.query(api.users.getMyProfile)).coins).toBe(1000);
  await a.mutation(api.decor.buyTile,args);
  expect((await a.query(api.users.getMyProfile)).coins).toBe(900);
  expect((await b.query(api.decor.getMyRoom)).tiles).toContainEqual({x:4,y:1});
  await expect(b.mutation(api.decor.buyTile,args)).rejects.toThrow("changed");
  await b.mutation(api.decor.buyTile,{x:5,y:1,expectedPurchases:1});
  expect((await b.query(api.users.getMyProfile)).coins).toBe(1000-tilePrice(1));
  expect((await c.query(api.decor.getMyRoom)).tiles).toHaveLength(16);
  expect(tilePrice(30)).toBeGreaterThan(800000);
});
test("legacy furniture stays in place and can move onto a bought tile, never empty ground",async()=>{
  const {a,b}=await setup();
  await a.mutation(api.decor.placeItem,{itemId:"furniture_sofa"});
  const before=(await a.query(api.decor.getMyRoom)).placements;
  await a.mutation(api.decor.buyTile,{x:4,y:1,expectedPurchases:0});
  expect((await a.query(api.decor.getMyRoom)).placements).toEqual(before);
  await b.mutation(api.decor.moveItem,{itemId:"furniture_sofa",x:112.5,y:37.5,flipped:true,grid:true});
  expect((await a.query(api.decor.getMyRoom)).placements[0]).toMatchObject({tileX:4.5,tileY:1.5,flipped:true});
  await expect(a.mutation(api.decor.moveItem,{itemId:"furniture_sofa",x:137.5,y:37.5,flipped:false,grid:true})).rejects.toThrow("Buy this floor");
});
test("garden and house purchases persist separate ground and protect occupied grass",async()=>{
  const {a}=await setup();
  await a.mutation(api.decor.placeItem,{itemId:"furniture_sofa",area:"garden"});
  const initial=await a.query(api.decor.getMyRoom);
  const furniture=initial.placements[0],x=Math.floor(furniture.tileX!),y=Math.floor(furniture.tileY!);
  await expect(a.mutation(api.decor.buyTile,{x,y,area:"room",expectedPurchases:0})).rejects.toThrow("Move the garden");
  expect((await a.query(api.users.getMyProfile)).coins).toBe(1000);
  await expect(a.mutation(api.decor.moveItem,{itemId:"furniture_sofa",x:37.5,y:37.5,flipped:false,grid:true})).rejects.toThrow("Buy this floor");
  await a.mutation(api.decor.buyTile,{x:-1,y:0,area:"garden",expectedPurchases:0});
  const grown=await a.query(api.decor.getMyRoom);
  expect(grown.gardenTiles).toContainEqual({x:-1,y:0});
  expect(grown.tiles).toEqual(initial.tiles);
  expect(grown.placements).toEqual(initial.placements);
  await a.mutation(api.decor.moveItem,{itemId:"furniture_sofa",x:-12.5,y:12.5,flipped:false,grid:true});
  await a.mutation(api.decor.buyTile,{x,y,area:"room",expectedPurchases:1});
  const converted=await a.query(api.decor.getMyRoom);
  expect(converted.tiles).toContainEqual({x,y});
  expect(converted.gardenTiles).not.toContainEqual({x,y});
  expect(converted.gardenPurchases).toBe(1);
  await expect(a.mutation(api.decor.buyTile,{x:-1,y:0,area:"garden",expectedPurchases:2})).rejects.toThrow();
  expect((await a.query(api.users.getMyProfile)).coins).toBe(760);
});

test("camera fits irregular floors and round-trips coordinates at a shared scale",()=>{
  const base=roomGeometry(BASE_TILES);
  expect(base.project(0,0)).toEqual({left:50,top:42});
  const tiles=[...BASE_TILES,{x:4,y:1},{x:5,y:1},{x:-1,y:0}],g=roomGeometry(tiles);
  expect(g.scale).toBeLessThan(base.scale);
  for(const tile of tiles) {
    const point=g.project(tile.x+.5,tile.y+.5),inverse=g.invert(point.left,point.top);
    expect(point.left).toBeGreaterThan(0);expect(point.left).toBeLessThan(100);expect(point.top).toBeLessThan(94);
    expect(inverse.x).toBeCloseTo(tile.x+.5);expect(inverse.y).toBeCloseTo(tile.y+.5);
  }
});
