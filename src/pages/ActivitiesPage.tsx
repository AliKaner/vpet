import { useEffect,useState } from "react";
import { useMutation,useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { SPECIES_CONFIG, type SpeciesId } from "../../convex/lib/species";
type State=FunctionReturnType<typeof api.activities.getState>;
type Action="daily"|"startShift"|"claimShift"|"memory";
export function ActivitiesPage() {
  const state=useQuery(api.activities.getState);
  const daily=useMutation(api.activities.claimDaily),startShift=useMutation(api.activities.startShift),claimShift=useMutation(api.activities.claimShift),memory=useMutation(api.activities.startMemory),flip=useMutation(api.activities.flipMemory);
  const startSimon=useMutation(api.activities.startSimon),tapSimon=useMutation(api.activities.submitSimonTap);
  const startQuiz=useMutation(api.activities.startQuiz),answerQuiz=useMutation(api.activities.submitQuizAnswer);
  if(!state) return <p role="status">Opening the town square…</p>;
  return <ActivitiesView state={state} act={action=>({daily,startShift,claimShift,memory}[action])({})} flip={index=>flip({gameId:state.gameId,turn:state.turn,index})}
    startSimon={()=>startSimon({})} tapSimon={index=>tapSimon({roundId:state.simonRoundId,step:state.simonStep,index})}
    startQuiz={()=>startQuiz({})} answerQuiz={choiceIndex=>answerQuiz({roundId:state.quizRoundId,choiceIndex})}/>;
}
const faces=["🐱","🐶","🐦","🐰","🌸","⭐"];
const paws=["🐾","🐾","🐾","🐾"];
export function ActivitiesView({state:stored,act,flip,startSimon,tapSimon,startQuiz,answerQuiz}:{
  state:State;act:(action:Action)=>Promise<number|null>;flip:(index:number)=>Promise<number>;
  startSimon:()=>Promise<null>;tapSimon:(index:number)=>Promise<{correct:boolean;done:boolean;reward:number}>;
  startQuiz:()=>Promise<null>;answerQuiz:(choiceIndex:number)=>Promise<number>;
}) {
  const [now,setNow]=useState(stored.serverNow),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  const [simonMessage,setSimonMessage]=useState(""),[watching,setWatching]=useState(false),[revealIndex,setRevealIndex]=useState(-1);
  const [quizMessage,setQuizMessage]=useState("");
  useEffect(()=>{const local=Date.now();const timer=setInterval(()=>setNow(stored.serverNow+Date.now()-local),200);return()=>clearInterval(timer);},[stored.serverNow]);
  // A query need not rerun at midnight: re-enable daily actions while the page stays open.
  const newDay=new Date(now).toISOString().slice(0,10)>new Date(stored.serverNow).toISOString().slice(0,10);
  const state=newDay?{...stored,dailyClaimed:false,memoryWins:0,shiftsPaid:0,simonWins:0,quizWins:0}:stored;
  async function run(task:()=>Promise<number|null>) {
    setBusy(true);setError("");setMessage("");
    try {const reward=await task();if(reward) setMessage(`+${reward} coins added to your wallet!`);}
    catch(err) {setError(err instanceof ConvexError?String(err.data):"Couldn't save that action. Please try again.");}
    finally {setBusy(false);}
  }
  useEffect(()=>{
    if(!state.simonActive || !state.simonSequence || state.simonStep>0) return;
    setWatching(true);setSimonMessage("Watch closely…");
    let i=0;
    const iv=setInterval(()=>{
      if(i>=state.simonSequence!.length) {clearInterval(iv);setRevealIndex(-1);setWatching(false);setSimonMessage("Your turn - repeat the pattern!");return;}
      setRevealIndex(state.simonSequence![i]);i++;
    },550);
    return ()=>clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[state.simonRoundId,state.simonActive]);
  async function tapPaw(index:number) {
    if(watching||busy||!state.simonActive) return;
    setBusy(true);setSimonMessage("");
    try {
      const result=await tapSimon(index);
      if(!result.correct) setSimonMessage("Not quite - try a new pattern!");
      else if(result.done) setSimonMessage(result.reward?`+${result.reward} coins! Great memory.`:"Nailed it! (Today's rewards are used up.)");
      else setSimonMessage("Keep going…");
    } catch(err) {setSimonMessage(err instanceof ConvexError?String(err.data):"Couldn't save that tap.");}
    finally {setBusy(false);}
  }
  async function answer(index:number) {
    if(busy||!state.quizOptions) return;
    setBusy(true);setQuizMessage("");
    try {
      const reward=await answerQuiz(index);
      setQuizMessage(reward?`Correct! +${reward} coins.`:"Not quite - give it another go!");
    } catch(err) {setQuizMessage(err instanceof ConvexError?String(err.data):"Couldn't save that answer.");}
    finally {setBusy(false);}
  }
  const seconds=Math.min(120,Math.max(0,Math.ceil(((state.shiftReadyAt??now)-now)/1000)));
  const expired=state.expiresAt<=now;
  const quizSpecies=state.quizSpecies?SPECIES_CONFIG[state.quizSpecies as SpeciesId]:undefined;
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
    <section className="activity-card memory-game"><div><span className="activity-eyebrow">PATTERN PAWS</span><h2>Watch, then repeat</h2><p>Watch the paw sequence, then tap it back in order. Each win earns 25 coins.</p><strong>{state.simonWins}/4 rewards today</strong></div>
      <div className="memory-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {paws.map((paw,index)=><button key={index} type="button" className={`memory-card ${revealIndex===index?"revealed":""}`} disabled={busy||watching||!state.simonActive} aria-label={`Paw ${index+1}`} onClick={()=>void tapPaw(index)}>{paw}</button>)}
      </div>
      {!state.simonActive && <button disabled={busy||state.simonWins>=4} onClick={()=>void run(async()=>{await startSimon();return null;})}>{state.simonWins>=4?"All rewards earned today":"Start round"}</button>}
      {simonMessage && <p className="text-xs text-cocoa-soft">{simonMessage}</p>}
    </section>
    <section className="activity-card memory-game"><div><span className="activity-eyebrow">SPECIES QUIZ</span><h2>What does your pet love?</h2><p>Guess which action this species enjoys most. Each correct answer earns 15 coins.</p><strong>{state.quizWins}/6 rewards today</strong></div>
      {quizSpecies ? <>
        <p className="font-bold text-cocoa">{quizSpecies.emoji} What does a {quizSpecies.label.toLowerCase()} love to do?</p>
        <div className="activity-errands">
          {state.quizOptions?.map((icon,index)=><button key={index} type="button" disabled={busy} className="memory-card" style={{aspectRatio:"auto",padding:"14px"}} onClick={()=>void answer(index)}>{icon}</button>)}
        </div>
      </> : <button disabled={busy||state.quizWins>=6} onClick={()=>void run(async()=>{await startQuiz();return null;})}>{state.quizWins>=6?"All rewards earned today":"Ask a question"}</button>}
      {quizMessage && <p className="text-xs text-cocoa-soft">{quizMessage}</p>}
    </section>
    {message&&<p className="activity-reward" role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
    <p className="text-xs text-cocoa-soft">Daily gifts and reward limits reset at 00:00 UTC.</p>
  </div>;
}
