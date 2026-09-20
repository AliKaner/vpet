import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError,v } from "convex/values";
import { mutation,query,type MutationCtx,type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { CARE_ACTIONS_BY_SPECIES } from "./lib/careActions";
import { SPECIES_IDS,type SpeciesId } from "./lib/species";
const dayKey=()=>new Date(Date.now()).toISOString().slice(0,10);
const fresh=()=>({day:dayKey(),dailyClaimed:false,memoryWins:0,shiftsPaid:0,simonWins:0,quizWins:0});
const SIMON_LENGTH=5,SIMON_DAILY_WINS=4,SIMON_REWARD=25;
const QUIZ_DAILY_WINS=6,QUIZ_REWARD=15;
// The species' one cooldown-free action is always its "affection" action (pet,
// walk, chirp back, handle, play, exercise) - a stable, distinctive per-species
// icon to quiz on regardless of catalog ordering.
const affectionIcon=(species:SpeciesId)=>CARE_ACTIONS_BY_SPECIES[species].find(a=>a.cooldownMs===0)!.icon;
function shuffled<T>(items:T[]):T[] {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
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
const stateValidator=v.object({coins:v.number(),dailyClaimed:v.boolean(),memoryWins:v.number(),shiftsPaid:v.number(),shiftReadyAt:v.union(v.number(),v.null()),gameId:v.number(),cards:v.array(v.union(v.number(),v.null())),matched:v.array(v.number()),turn:v.number(),resetAt:v.number(),active:v.boolean(),expiresAt:v.number(),
  simonWins:v.number(),simonRoundId:v.number(),simonSequence:v.union(v.array(v.number()),v.null()),simonStep:v.number(),simonActive:v.boolean(),
  quizWins:v.number(),quizRoundId:v.number(),quizSpecies:v.union(v.string(),v.null()),quizOptions:v.union(v.array(v.string()),v.null()),
  serverNow:v.number()});
export const getState=query({args:{},returns:stateValidator,handler:async ctx=>{
  const user=await player(ctx);
  const p=await ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",user._id)).unique();
  const today=p?.day===dayKey()?p:fresh();
  return {coins:user.coins??0,dailyClaimed:today.dailyClaimed,memoryWins:today.memoryWins,shiftsPaid:today.shiftsPaid,
    shiftReadyAt:p?.shiftReadyAt??null,gameId:p?.gameId??0,cards:p?.board.map((value,i)=>p.matched.includes(i)||p.faceUp.includes(i)?value:null)??[],matched:p?.matched??[],turn:p?.turn??0,resetAt:p?.resetAt??0,active:p?.active??false,expiresAt:p?.expiresAt??0,
    simonWins:today.simonWins??0,simonRoundId:p?.simonRoundId??0,simonSequence:p?.simonActive?(p?.simonSequence??null):null,simonStep:p?.simonStep??0,simonActive:p?.simonActive??false,
    quizWins:today.quizWins??0,quizRoundId:p?.quizRoundId??0,quizSpecies:p?.quizOptions!==undefined?(p?.quizSpecies??null):null,quizOptions:p?.quizOptions??null,
    serverNow:Date.now()};
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
// Pattern Paws: watch a short sequence of paw taps, then repeat it back in order.
export const startSimon=mutation({args:{},returns:v.null(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if((p.simonWins??0)>=SIMON_DAILY_WINS) throw new ConvexError("All rewards earned. Come back tomorrow.");
  const sequence=Array.from({length:SIMON_LENGTH},()=>Math.floor(Math.random()*4));
  await ctx.db.patch(p._id,{simonSequence:sequence,simonStep:0,simonActive:true,simonRoundId:(p.simonRoundId??0)+1});
  return null;
}});
export const submitSimonTap=mutation({args:{roundId:v.number(),step:v.number(),index:v.number()},returns:v.object({correct:v.boolean(),done:v.boolean(),reward:v.number()}),handler:async(ctx,{roundId,step,index})=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(!p.simonActive || p.simonSequence===undefined || p.simonRoundId!==roundId || (p.simonStep??0)!==step) throw new ConvexError("This round changed. Try again.");
  if(!Number.isInteger(index) || index<0 || index>3) throw new ConvexError("Choose a paw.");
  if(p.simonSequence[step]!==index) {
    await ctx.db.patch(p._id,{simonActive:false});
    return {correct:false,done:true,reward:0};
  }
  const done=step+1>=p.simonSequence.length;
  if(!done) {await ctx.db.patch(p._id,{simonStep:step+1});return {correct:true,done:false,reward:0};}
  const wins=p.simonWins??0,rewarded=wins<SIMON_DAILY_WINS;
  await ctx.db.patch(p._id,{simonActive:false,simonWins:rewarded?wins+1:wins});
  if(rewarded) await ctx.db.patch(user._id,{coins:(user.coins??0)+SIMON_REWARD});
  return {correct:true,done:true,reward:rewarded?SIMON_REWARD:0};
}});
// Species Quiz: "what does this pet love to do" multiple choice, using each
// species' actual affection-action icon so it doubles as a gentle care-tip.
export const startQuiz=mutation({args:{},returns:v.null(),handler:async ctx=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if((p.quizWins??0)>=QUIZ_DAILY_WINS) throw new ConvexError("All rewards earned. Come back tomorrow.");
  const species=SPECIES_IDS[Math.floor(Math.random()*SPECIES_IDS.length)];
  const correctIcon=affectionIcon(species);
  const decoyPool=SPECIES_IDS.filter(s=>s!==species).map(affectionIcon).filter((icon,i,arr)=>icon!==correctIcon && arr.indexOf(icon)===i);
  const options=shuffled([correctIcon,...shuffled(decoyPool).slice(0,3)]);
  await ctx.db.patch(p._id,{quizSpecies:species,quizAnswerIndex:options.indexOf(correctIcon),quizOptions:options,quizRoundId:(p.quizRoundId??0)+1});
  return null;
}});
export const submitQuizAnswer=mutation({args:{roundId:v.number(),choiceIndex:v.number()},returns:v.number(),handler:async(ctx,{roundId,choiceIndex})=>{
  const user=await player(ctx);const p=await progress(ctx,user);
  if(p.quizOptions===undefined || p.quizRoundId!==roundId) throw new ConvexError("This question changed. Try again.");
  if(!Number.isInteger(choiceIndex) || choiceIndex<0 || choiceIndex>=p.quizOptions.length) throw new ConvexError("Choose an answer.");
  const correct=choiceIndex===p.quizAnswerIndex,wins=p.quizWins??0,rewarded=correct&&wins<QUIZ_DAILY_WINS;
  await ctx.db.patch(p._id,{quizSpecies:undefined,quizAnswerIndex:undefined,quizOptions:undefined,quizWins:rewarded?wins+1:wins});
  if(rewarded) await ctx.db.patch(user._id,{coins:(user.coins??0)+QUIZ_REWARD});
  return rewarded?QUIZ_REWARD:0;
}});
