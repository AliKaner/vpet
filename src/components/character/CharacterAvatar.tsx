import { useId } from "react";
import type { Character } from "../../../convex/lib/character";
const hair={chestnut:["#b97e58","#694135"],black:["#686177","#292637"],blonde:["#f7dc98","#bd8d53"],pink:["#f6b3cc","#b86692"],blue:["#a8d6ed","#5a80b0"]};
const eyes={brown:"#83513d",green:"#62917b",blue:"#6599bc",hazel:"#b39755",violet:"#a17bbb"};
const skins={peach:["#ffe4cf","#edba9d"],warm:["#edc29b","#c98d6b"],tan:["#cd9975","#aa7257"],deep:["#a77760","#704a40"]};
const clothes:Record<string,string>={cloth_hoodie:"#b6a3cf",cloth_raincoat:"#eac778",cloth_pajamas:"#a7bfd4",cloth_overalls:"#6a9eae",cloth_sweater:"#c3879e",cloth_vest:"#9aaa7c"};
export function CharacterAvatar({character:c,small=false}:{character:Character;small?:boolean}) {
  const id=useId().replace(/:/g,"");const outfit=c.clothingId??"";const skin=skins[c.skinTone??"peach"];
  const ink="#58424b";const long=c.hairStyle==="long";const curly=c.hairStyle==="curly";
  return <svg className={`character-doll ${small?"small":""}`} viewBox="0 0 120 174" role="img" aria-label={`${c.hairColor} ${c.hairStyle} hair, ${c.eyeColor} eyes, customized outfit`}>
    <defs><linearGradient id={`${id}-hair`} x2=".8" y2="1"><stop stopColor={hair[c.hairColor][0]}/><stop offset="1" stopColor={hair[c.hairColor][1]}/></linearGradient><linearGradient id={`${id}-skin`} x2=".3" y2="1"><stop stopColor={skin[0]}/><stop offset="1" stopColor={skin[1]}/></linearGradient></defs>
    <ellipse cx="60" cy="162" rx="29" ry="7" fill="#62485418"/>
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d={long?"M30 38Q25 9 60 10Q95 9 91 46L99 111Q76 128 60 110Q35 126 23 111Z":"M28 38Q26 10 60 10Q95 10 92 43L94 78Q65 94 26 77Z"} fill={`url(#${id}-hair)`}/>
      {c.hairStyle==="bun"&&<ellipse cx="77" cy="15" rx="16" ry="13" fill={`url(#${id}-hair)`}/>}
      {curly&&<path d="M29 54Q15 47 24 36Q14 23 31 18Q27 4 45 9Q54-2 65 8Q84 0 89 18Q105 18 98 33Q107 44 93 55Z" fill={`url(#${id}-hair)`}/>}
      <path d="M43 126 42 151Q47 155 54 152L58 130H63L66 152Q73 156 78 151L76 126Z" fill="#73819e"/>
      <path d="M42 148Q48 153 55 149L55 159Q42 164 35 158Q35 152 42 148ZM66 149Q74 153 79 148Q87 152 85 158Q78 163 65 159Z" fill="#f0dbc4"/>
      <path d="M36 157q8 3 18 0M66 157q10 3 18 0" fill="none" stroke="#bb927b"/>
      <path d="M40 89Q31 89 26 107L22 124Q21 132 27 134Q33 135 35 126L41 110H79L85 126Q87 135 93 134Q99 131 97 124L93 106Q88 90 79 89Z" fill={`url(#${id}-skin)`}/>
      <path d="M47 84h26v16H47Z" fill={`url(#${id}-skin)`}/>
      <path d={c.gender==="feminine"?"M42 89 32 108l9 5-5 27Q60 150 84 140L79 113l9-5-10-19Q60 99 42 89Z":"M42 89 32 108l9 5v22Q59 143 79 135v-22l9-5-10-19Q60 99 42 89Z"} fill={clothes[outfit]??"#aac4ae"}/>
      <path d="M48 91q12 10 24 0M42 131q18 6 36 0" fill="none" stroke="#fff" opacity=".45"/>
      {outfit==="cloth_hoodie"&&<><path d="M42 89q0 15 18 15t18-15M50 103v13m20-13v13" fill="none"/><path d="M48 121q12-5 24 0v9H48Z" fill="#a190bb"/></>}
      {outfit==="cloth_overalls"&&<><path d="M46 91v24h28V91M42 139v-26h36v26" fill="#60899a"/><circle cx="48" cy="112" r="2" fill="#f4d798"/><circle cx="72" cy="112" r="2" fill="#f4d798"/><path d="M53 119h14v9H53Z" fill="none" stroke="#b8d6dd"/></>}
      {outfit==="cloth_raincoat"&&<><path d="M60 101v35" fill="none"/>{[108,119,130].map(y=><circle key={y} cx="64" cy={y} r="1.5" fill="#a2824c" stroke="none"/>)}</>}
      {outfit==="cloth_pajamas"&&<path d="m48 108 2 4 4-2m12 11 2 4 4-2M54 131l2 4 4-2" fill="none" stroke="#fff2b8"/>}
      <ellipse cx="31" cy="58" rx="6" ry="9" fill={`url(#${id}-skin)`}/><ellipse cx="89" cy="58" rx="6" ry="9" fill={`url(#${id}-skin)`}/>
      <path d="M31 40Q33 19 60 20Q88 20 89 42L87 64Q82 85 60 87Q38 85 33 65Z" fill={`url(#${id}-skin)`}/>
      <path d={c.hairStyle==="short"?"M29 49Q25 10 60 12Q94 10 92 50L81 43 80 30Q61 47 49 35L39 50 38 32Z":c.hairStyle==="bob"?"M29 63Q22 18 49 12Q89 3 93 43L90 67 81 62V35Q60 46 40 32L40 64Z":"M29 52Q23 17 48 12Q84 3 94 38L87 58 81 38Q55 50 41 31L36 53Z"} fill={`url(#${id}-hair)`}/>
      <path d="M39 25Q54 12 74 22" fill="none" stroke={hair[c.hairColor][0]} strokeWidth="3" opacity=".75"/>
      <path d="M42 49q5-3 10 0M68 49q5-3 10 0" fill="none" stroke={hair[c.hairColor][1]}/>
      {[47,73].map(x=><g key={x}><ellipse cx={x} cy="59" rx="6" ry="8" fill="#fff9ef" stroke="none"/><ellipse cx={x+.5} cy="60" rx="4.3" ry="6.8" fill={eyes[c.eyeColor]} stroke="none"/><ellipse cx={x+1} cy="61" rx="2.2" ry="4.6" fill="#3c3540" stroke="none"/><circle cx={x-1} cy="56" r="2.1" fill="white" stroke="none"/><path d={`M${x-6} 56q6-5 12 0`} fill="none" strokeWidth="1.8"/></g>)}
      <ellipse cx="39" cy="69" rx="6" ry="3" fill="#df8e98" opacity=".4" stroke="none"/><ellipse cx="81" cy="69" rx="6" ry="3" fill="#df8e98" opacity=".4" stroke="none"/>
      <path d="m59 64-1 4h3M54 75q6 5 12-1" fill="none" stroke="#b4746c"/>
      {c.accessory==="glasses"&&<g fill="none" stroke="#866c6f"><circle cx="47" cy="59" r="10"/><circle cx="73" cy="59" r="10"/><path d="M57 58h6M31 56l6 1m46 0 6-1"/></g>}
      {c.accessory==="freckles"&&[37,42,77,82].map(x=><circle key={x} cx={x} cy={x%2?69:71} r=".9" fill="#a86e59" stroke="none"/>)}
      {outfit==="cloth_scarf"&&<path d="M38 84q22 9 44 0v9q-9 4-18 4l2 23-10 1-2-24q-10-1-16-4Z" fill="#db9ba6"/>}
      {outfit==="cloth_cap"&&<path d="M28 29Q28 5 60 7Q89 7 92 30Q63 21 28 29Zm3 0Q48 40 66 31Q46 25 31 29Z" fill="#8eb7c7"/>}
      {outfit==="cloth_crown"&&<path d="m39 16-2-14 13 9L60 0l10 11 13-9-2 14Z" fill="#efcf80"/>}
      {outfit==="cloth_bow"&&<><path d="M78 23Q65 7 65 24Q65 36 78 26Q94 34 94 19Q94 6 78 23Z" fill="#e6a2bb"/><circle cx="79" cy="24" r="4" fill="#f7c8d8"/></>}
    </g>
  </svg>;
}
