import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError,v } from "convex/values";
import { mutation,query,type MutationCtx,type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
const dayKey=()=>new Date(Date.now()).toISOString().slice(0,10);
const fresh=()=>({day:dayKey(),dailyClaimed:false,memoryWins:0,shiftsPaid:0});
async function player(ctx:QueryCtx) {
  const id=await getAuthUserId(ctx);const user=id ? await ctx.db.get(id):null;
  if(!user) throw new ConvexError("Sign in to earn coins.");
  return user;
}
async function progress(ctx:MutationCtx,user:Doc<"users">) {
  const existing=await ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",user._id)).unique();
  if(existing) {
    if(existing.day!==dayKey()) {const reset=fresh();await ctx.db.patch(existing._id,reset);return {...existing,...reset};}
    return existing;
  }
  const id=await ctx.db.insert("activities",{ownerId:user._id,...fresh(),gameId:0,board:[],matched:[],faceUp:[],turn:0,resetAt:0,active:false,expiresAt:0});
  return (await ctx.db.get(id))!;
}
const stateValidator=v.object({coins:v.number(),dailyClaimed:v.boolean(),memoryWins:v.number(),shiftsPaid:v.number(),shiftReadyAt:v.union(v.number(),v.null()),gameId:v.number(),cards:v.array(v.union(v.number(),v.null())),matched:v.array(v.number()),turn:v.number(),resetAt:v.number(),active:v.boolean(),expiresAt:v.number(),serverNow:v.number()});
export const getState=query({args:{},returns:stateValidator,handler:async ctx=>{
  const user=await player(ctx);
  const p=await ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",user._id)).unique();
  const today=p?.day===dayKey()?p:fresh();
  return {coins:user.coins??0,dailyClaimed:today.dailyClaimed,memoryWins:today.memoryWins,shiftsPaid:today.shiftsPaid,
    shiftReadyAt:p?.shiftReadyAt??null,gameId:p?.gameId??0,cards:p?.board.map((value,i)=>p.matched.includes(i)||p.faceUp.includes(i)?value:null)??[],matched:p?.matched??[],turn:p?.turn??0,resetAt:p?.resetAt??0,active:p?.active??false,expiresAt:p?.expiresAt??0,serverNow:Date.now()};
}});
export const claimDaily=mutation({args:{},returns:v.number(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(p.dailyClaimed) throw new ConvexError("Today's gift is already collected.");
  await ctx.db.patch(p._id,{dailyClaimed:true});await ctx.db.patch(user._id,{coins:(user.coins??0)+15});return 15;
}});
export const startShift=mutation({args:{},returns:v.null(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(p.shiftReadyAt!==undefined) throw new ConvexError("Finish your current shift first.");
  if(p.shiftsPaid>=3) throw new ConvexError("All three shifts are complete. Come back tomorrow.");
  await ctx.db.patch(p._id,{shiftReadyAt:Date.now()+120000});return null;
}});
export const claimShift=mutation({args:{},returns:v.number(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(p.shiftReadyAt===undefined || p.shiftReadyAt>Date.now()) throw new ConvexError("Your shift is not ready yet.");
  if(p.shiftsPaid>=3) throw new ConvexError("Today's shift rewards are complete.");
  await ctx.db.patch(p._id,{shiftReadyAt:undefined,shiftsPaid:p.shiftsPaid+1});await ctx.db.patch(user._id,{coins:(user.coins??0)+25});return 25;
}});
export const startMemory=mutation({args:{},returns:v.null(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(p.active && p.expiresAt>Date.now()) throw new ConvexError("Finish the current board first.");
  if(p.memoryWins>=5) throw new ConvexError("All five rewards earned. Come back tomorrow.");
  const board=[0,0,1,1,2,2,3,3,4,4,5,5];
  for(let i=board.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[board[i],board[j]]=[board[j],board[i]];}
  await ctx.db.patch(p._id,{board,matched:[],faceUp:[],turn:0,resetAt:0,active:true,gameId:p.gameId+1,expiresAt:Date.now()+15*60000});return null;
}});
export const flipMemory=mutation({args:{gameId:v.number(),turn:v.number(),index:v.number()},returns:v.number(),handler:async(ctx,args)=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(!p.active || p.expiresAt<=Date.now() || p.gameId!==args.gameId || p.turn!==args.turn) throw new ConvexError("This board changed. Try again.");
  if(!Number.isInteger(args.index) || args.index<0 || args.index>=12 || p.matched.includes(args.index)) throw new ConvexError("Choose a face-down card.");
  if(p.resetAt>Date.now()) throw new ConvexError("Wait for the cards to turn over.");
  const faceUp=p.faceUp.length===2?[]:[...p.faceUp];
  if(faceUp.includes(args.index)) throw new ConvexError("Choose another card.");
  faceUp.push(args.index);const matched=[...p.matched];let resetAt=0;
  if(faceUp.length===2) {if(p.board[faceUp[0]]===p.board[faceUp[1]]) {matched.push(...faceUp);faceUp.length=0;}else resetAt=Date.now()+850;}
  const complete=matched.length===12;
  if(complete && p.memoryWins>=5) throw new ConvexError("Today's rewards are complete.");
  await ctx.db.patch(p._id,{matched,faceUp,resetAt,turn:p.turn+1,active:!complete,memoryWins:p.memoryWins+(complete?1:0)});
  if(complete) await ctx.db.patch(user._id,{coins:(user.coins??0)+30});
  return complete?30:0;
}});
