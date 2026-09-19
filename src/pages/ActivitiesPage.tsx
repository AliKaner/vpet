import { useEffect,useState } from "react";
import { useMutation,useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
type State=FunctionReturnType<typeof api.activities.getState>;
type Action="daily"|"startShift"|"claimShift"|"memory";
export function ActivitiesPage() {
  const state=useQuery(api.activities.getState);
  const daily=useMutation(api.activities.claimDaily),startShift=useMutation(api.activities.startShift),claimShift=useMutation(api.activities.claimShift),memory=useMutation(api.activities.startMemory),flip=useMutation(api.activities.flipMemory);
  if(!state) return <p role="status">Opening the town square…</p>;
  return <ActivitiesView state={state} act={action=>({daily,startShift,claimShift,memory}[action])({})} flip={index=>flip({gameId:state.gameId,turn:state.turn,index})}/>;
}
const faces=["🐱","🐶","🐦","🐰","🌸","⭐"];
export function ActivitiesView({state:stored,act,flip}:{state:State;act:(action:Action)=>Promise<number|null>;flip:(index:number)=>Promise<number>}) {
  const [now,setNow]=useState(stored.serverNow),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  useEffect(()=>{const local=Date.now();const timer=setInterval(()=>setNow(stored.serverNow+Date.now()-local),200);return()=>clearInterval(timer);},[stored.serverNow]);
  // A query need not rerun at midnight: re-enable daily actions while the page stays open.
  const newDay=new Date(now).toISOString().slice(0,10)>new Date(stored.serverNow).toISOString().slice(0,10);
  const state=newDay?{...stored,dailyClaimed:false,memoryWins:0,shiftsPaid:0}:stored;
  async function run(task:()=>Promise<number|null>) {
    setBusy(true);setError("");setMessage("");
    try {const reward=await task();if(reward) setMessage(`+${reward} coins added to your wallet!`);}
    catch(err) {setError(err instanceof ConvexError?String(err.data):"Couldn't save that action. Please try again.");}
    finally {setBusy(false);}
  }
  const seconds=Math.min(120,Math.max(0,Math.ceil(((state.shiftReadyAt??now)-now)/1000)));
  const expired=state.expiresAt<=now;
  return <div className="activities-page">
    <header><span className="activity-eyebrow">A LITTLE ADVENTURE</span><h1>Town Square</h1><p>Play, lend a hand and earn something for your home.</p><Link to="/shop">🪙 {state.coins} coins · Visit Shop →</Link></header>
    <div className="activity-errands">
      <section className="activity-card"><span className="activity-illustration" aria-hidden>🎁</span><h2>Daily gift</h2><p>A little welcome-back treat. Available once per day.</p><strong>15 coins</strong><button disabled={busy||state.dailyClaimed} onClick={()=>void run(()=>act("daily"))}>{state.dailyClaimed?"Collected today":"Collect gift"}</button></section>
      <section className="activity-card"><span className="activity-illustration" aria-hidden>☕</span><h2>Cafe helper</h2><p>Help at the cafe for two minutes. You can decorate while your shift runs.</p><strong>25 coins · {state.shiftsPaid}/3 shifts today</strong>{state.shiftReadyAt!==null?<button disabled={busy||seconds>0} onClick={()=>void run(()=>act("claimShift"))}>{seconds>0?`Shift ends in ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`:"Collect shift pay"}</button>:<button disabled={busy||state.shiftsPaid>=3} onClick={()=>void run(()=>act("startShift"))}>{state.shiftsPaid>=3?"Back tomorrow":"Start shift"}</button>}</section>
    </div>
    <section className="activity-card memory-game"><div><span className="activity-eyebrow">PET PAIRS</span><h2>A little memory magic</h2><p>Find all six matching pairs. Each completed board earns 30 coins.</p><strong>{state.memoryWins}/5 rewards today · 15 minutes per board</strong></div>
      {state.cards.length>0 && <div className="memory-grid">{state.cards.map((value,index)=>{
        const matched=state.matched.includes(index);const visible=value!==null&&(matched||state.resetAt===0||now<state.resetAt);
        return <button key={index} type="button" className={`memory-card ${matched?"matched":visible?"revealed":""}`} disabled={busy||matched||visible||!state.active||expired||state.resetAt>now} aria-label={matched?`Matched ${faces[value??0]}`:visible?`Card ${index+1}: ${faces[value??0]}`:`Reveal card ${index+1}`} onClick={()=>void run(()=>flip(index))}>{visible?faces[value!]:"🐾"}</button>;
      })}</div>}
      {(!state.active||expired) && <button disabled={busy||state.memoryWins>=5} onClick={()=>void run(()=>act("memory"))}>{state.memoryWins>=5?"All rewards earned today":expired&&state.active?"Board expired · Start again":state.cards.length?"Play another board":"Start playing"}</button>}
      {state.active&&!expired && <p className="text-xs text-cocoa-soft">Your board is saved if you leave this page.</p>}
    </section>
    {message&&<p className="activity-reward" role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
    <p className="text-xs text-cocoa-soft">Daily gifts and reward limits reset at 00:00 UTC.</p>
  </div>;
}
