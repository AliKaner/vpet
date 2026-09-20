/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect,test,vi,afterEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules=import.meta.glob("./**/*.ts");
afterEach(()=>vi.useRealTimers());
async function setup() {
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-09-20T10:00:00Z"));
  const t=convexTest(schema,modules);
  const id=await t.run(ctx=>ctx.db.insert("users",{name:"Player",coins:0}));
  const other=await t.run(ctx=>ctx.db.insert("users",{name:"Other",coins:0}));
  return {t,id,user:t.withIdentity({subject:id}),other:t.withIdentity({subject:other})};
}
test("daily gift pays once, resets by UTC day and stays private",async()=>{
  const {t,user,other}=await setup();
  await expect(t.mutation(api.activities.claimDaily)).rejects.toThrow("Sign in");
  await user.mutation(api.activities.claimDaily);
  await expect(user.mutation(api.activities.claimDaily)).rejects.toThrow("already");
  expect((await user.query(api.activities.getState)).coins).toBe(15);
  expect((await other.query(api.activities.getState)).coins).toBe(0);
  vi.setSystemTime(new Date("2026-09-21T00:00:00Z"));
  expect((await user.query(api.activities.getState)).dailyClaimed).toBe(false);
  await user.mutation(api.activities.claimDaily);
  expect((await user.query(api.activities.getState)).coins).toBe(30);
});
test("cafe shift checks server time, blocks duplicate pay and caps daily rewards",async()=>{
  const {user}=await setup();
  for(let i=0;i<3;i++) {
    await user.mutation(api.activities.startShift);
    await expect(user.mutation(api.activities.startShift)).rejects.toThrow("current shift");
    await expect(user.mutation(api.activities.claimShift)).rejects.toThrow("not ready");
    vi.setSystemTime(Date.now()+120001);
    await user.mutation(api.activities.claimShift);
    await expect(user.mutation(api.activities.claimShift)).rejects.toThrow("not ready");
  }
  expect((await user.query(api.activities.getState)).coins).toBe(75);
  await expect(user.mutation(api.activities.startShift)).rejects.toThrow("three shifts");
});
test("memory board conceals cards, rejects stale/foreign moves and pays exactly once per win",async()=>{
  const {t,id,user,other}=await setup();
  for(let game=0;game<5;game++) {
    await user.mutation(api.activities.startMemory);
    const state=await user.query(api.activities.getState);
    expect(state.cards).toEqual(Array(12).fill(null));
    await expect(user.mutation(api.activities.startMemory)).rejects.toThrow("current board");
    const args={gameId:state.gameId,turn:0,index:0};
    await expect(other.mutation(api.activities.flipMemory,args)).rejects.toThrow();
    for(const index of [-1,12,NaN,1.5]) await expect(user.mutation(api.activities.flipMemory,{...args,index})).rejects.toThrow();
    const board=await t.run(async ctx=>(await ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",id)).unique())!.board);
    let turn=0;
    for(let value=0;value<6;value++) {
      const pair=board.flatMap((v,i)=>v===value?[i]:[]);
      await user.mutation(api.activities.flipMemory,{gameId:state.gameId,turn:turn++,index:pair[0]});
      await expect(user.mutation(api.activities.flipMemory,{gameId:state.gameId,turn:turn-1,index:pair[1]})).rejects.toThrow();
      await user.mutation(api.activities.flipMemory,{gameId:state.gameId,turn:turn++,index:pair[1]});
    }
    await expect(user.mutation(api.activities.flipMemory,{gameId:state.gameId,turn,index:0})).rejects.toThrow();
    expect((await user.query(api.activities.getState)).coins).toBe(30*(game+1));
  }
  await expect(user.mutation(api.activities.startMemory)).rejects.toThrow("five rewards");
});
test("mismatches wait before flipping and expired boards can restart",async()=>{
  const {t,id,user}=await setup();await user.mutation(api.activities.startMemory);
  const p=await t.run(ctx=>ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",id)).unique());
  const mismatch=p!.board.findIndex(v=>v!==p!.board[0]);
  await user.mutation(api.activities.flipMemory,{gameId:1,turn:0,index:0});
  await user.mutation(api.activities.flipMemory,{gameId:1,turn:1,index:mismatch});
  await expect(user.mutation(api.activities.flipMemory,{gameId:1,turn:2,index:1})).rejects.toThrow("Wait");
  vi.setSystemTime(Date.now()+851);
  await user.mutation(api.activities.flipMemory,{gameId:1,turn:2,index:0});
  expect((await user.query(api.activities.getState)).cards.filter(v=>v!==null)).toHaveLength(1);
  vi.setSystemTime(Date.now()+15*60000);
  await expect(user.mutation(api.activities.flipMemory,{gameId:1,turn:3,index:1})).rejects.toThrow("changed");
  await user.mutation(api.activities.startMemory);
  expect((await user.query(api.activities.getState)).gameId).toBe(2);
});
test("pattern paws reveals the sequence, rejects wrong taps/stale rounds and caps daily wins",async()=>{
  const {t,id,user,other}=await setup();
  for(let round=0;round<4;round++) {
    await user.mutation(api.activities.startSimon);
    const state=await user.query(api.activities.getState);
    expect(state.simonSequence).toHaveLength(5);
    const sequence=state.simonSequence!;
    await expect(other.mutation(api.activities.submitSimonTap,{roundId:state.simonRoundId,step:0,index:sequence[0]})).rejects.toThrow();
    await expect(user.mutation(api.activities.submitSimonTap,{roundId:state.simonRoundId,step:1,index:sequence[0]})).rejects.toThrow("changed");
    for(let step=0;step<5;step++) {
      const result=await user.mutation(api.activities.submitSimonTap,{roundId:state.simonRoundId,step,index:sequence[step]});
      expect(result.correct).toBe(true);
      expect(result.done).toBe(step===4);
    }
    expect((await user.query(api.activities.getState)).coins).toBe(25*(round+1));
  }
  await expect(user.mutation(api.activities.startSimon)).rejects.toThrow("rewards earned");
  // A wrong tap ends the round with no reward, without touching the daily cap.
  const finalP=await t.run(ctx=>ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",id)).unique());
  expect(finalP!.simonWins).toBe(4);
});
test("species quiz keeps the answer secret server-side, pays once per correct guess and caps daily wins",async()=>{
  const {t,id,user}=await setup();
  await user.mutation(api.activities.startQuiz);
  const state=await user.query(api.activities.getState);
  expect(state.quizOptions).toHaveLength(4);
  expect(state.quizSpecies).not.toBeNull();
  const p=await t.run(ctx=>ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",id)).unique());
  const wrongIndex=(p!.quizAnswerIndex!+1)%4;
  await expect(user.mutation(api.activities.submitQuizAnswer,{roundId:state.quizRoundId,choiceIndex:wrongIndex})).resolves.toBe(0);
  expect((await user.query(api.activities.getState)).coins).toBe(0);
  await expect(user.mutation(api.activities.submitQuizAnswer,{roundId:state.quizRoundId,choiceIndex:0})).rejects.toThrow("changed");
  for(let round=0;round<6;round++) {
    await user.mutation(api.activities.startQuiz);
    const round_=await user.query(api.activities.getState);
    const answerIndex=(await t.run(ctx=>ctx.db.query("activities").withIndex("by_owner",q=>q.eq("ownerId",id)).unique()))!.quizAnswerIndex!;
    await user.mutation(api.activities.submitQuizAnswer,{roundId:round_.quizRoundId,choiceIndex:answerIndex});
  }
  expect((await user.query(api.activities.getState)).coins).toBe(15*6);
  await expect(user.mutation(api.activities.startQuiz)).rejects.toThrow("rewards earned");
});
