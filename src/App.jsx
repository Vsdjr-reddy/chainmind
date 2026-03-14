// ChainMind v9 — built on working v6 base
// Added: Project selector, Employee sidebar, Provider selector, org workflow mode
// All v6 features preserved intact

// ── Bundled Data ──────────────────────────────────────────────────────────────
const EMPLOYEES = [
  { id:"EMP001", name:"Aarav Sharma",  role:"AI Engineer",        skills:["Python","LLMs","LangChain","ML"],           experience:4, workload:40, color:"#7C3AED" },
  { id:"EMP002", name:"Riya Patel",    role:"Data Scientist",     skills:["Python","Data Analysis","ML","Pandas"],     experience:3, workload:35, color:"#0EA5E9" },
  { id:"EMP003", name:"Vikram Singh",  role:"Backend Developer",  skills:["Node.js","APIs","Databases"],               experience:5, workload:50, color:"#10B981" },
  { id:"EMP004", name:"Sneha Reddy",   role:"Frontend Developer", skills:["React","UI/UX","JavaScript"],               experience:2, workload:30, color:"#F59E0B" },
  { id:"EMP005", name:"Karthik Rao",   role:"DevOps Engineer",    skills:["Docker","Kubernetes","AWS","CI/CD"],        experience:4, workload:45, color:"#6366F1" },
  { id:"EMP006", name:"Meera Nair",    role:"AI Researcher",      skills:["LLMs","NLP","RAG","Deep Learning"],         experience:6, workload:55, color:"#EC4899" },
];

const PROJECTS = [
  { id:"PRJ001", name:"AI Sales Assistant",         desc:"AI assistant that generates sales proposals automatically", skills:["LLM","NLP","APIs"],              deadline:30, priority:"High"   },
  { id:"PRJ002", name:"Healthcare Diagnosis Model", desc:"Predict early disease risk using ML models",               skills:["ML","Data Analysis","Python"],    deadline:45, priority:"High"   },
  { id:"PRJ003", name:"Customer Support Chatbot",   desc:"AI chatbot for customer support queries",                  skills:["LLM","RAG","APIs"],               deadline:25, priority:"Medium" },
  { id:"PRJ004", name:"Smart Inventory System",     desc:"Automated inventory demand prediction system",             skills:["Python","ML","Data Engineering"],  deadline:40, priority:"Medium" },
];

const HISTORY_DATA = [
  { id:"H001", name:"Fraud Detection AI",           teamSize:4, days:28, score:0.92 },
  { id:"H002", name:"AI Resume Screening",          teamSize:3, days:22, score:0.89 },
  { id:"H003", name:"Retail Recommendation Engine", teamSize:5, days:35, score:0.94 },
];

const PROVIDERS = [
  { key:"openrouter", label:"OpenRouter",       color:"#7C3AED", desc:"Multi-model router — active" },
  { key:"anthropic",  label:"Anthropic Claude", color:"#D97706", desc:"Claude 3.5 Sonnet"           },
  { key:"openai",     label:"OpenAI",           color:"#10B981", desc:"GPT-4o"                      },
  { key:"gemini",     label:"Google Gemini",    color:"#0EA5E9", desc:"Gemini 1.5 Pro"              },
  { key:"mistral",    label:"Mistral AI",       color:"#EC4899", desc:"Mistral Large"               },
  { key:"cohere",     label:"Cohere",           color:"#6366F1", desc:"Command R+"                  },
];

import { useState, useEffect, useRef, useCallback } from "react";
import {
  runPlanner, runResearch, runExecution,
  runVerification, runMemory, runReport,
  parseConfidenceScore, shouldTriggerGate, parseMemoryEntries,
} from "./api";

const AGENTS = {
  planner:      { label:"Planner",      avatar:"🧠", color:"#a78bfa", glow:"#7C3AED", bg:"rgba(124,58,237,0.08)" },
  research:     { label:"Research",     avatar:"🔍", color:"#38bdf8", glow:"#0EA5E9", bg:"rgba(14,165,233,0.08)" },
  execution:    { label:"Execution",    avatar:"⚙️", color:"#34d399", glow:"#10B981", bg:"rgba(16,185,129,0.08)" },
  verification: { label:"Verification", avatar:"🛡",  color:"#fbbf24", glow:"#F59E0B", bg:"rgba(245,158,11,0.08)" },
  memory:       { label:"Memory",       avatar:"💾", color:"#818cf8", glow:"#6366F1", bg:"rgba(99,102,241,0.08)" },
  report:       { label:"Report",       avatar:"📋", color:"#f472b6", glow:"#EC4899", bg:"rgba(236,72,153,0.08)" },
};

const MODEL_TIERS = {
  slm:     { label:"SLM",      desc:"Gemini Flash", color:"#34d399", costPer1k:0.00004 },
  mid:     { label:"MID",      desc:"Claude Haiku", color:"#fbbf24", costPer1k:0.00030 },
  frontier:{ label:"FRONTIER", desc:"Claude Opus",  color:"#f472b6", costPer1k:0.01500 },
};

const SAMPLE_GOALS = [
  "Analyse and assign tasks for the AI Sales Assistant project to the best team members based on skills and workload.",
  "Decompose the Healthcare Diagnosis Model project and recommend optimal team assignments.",
  "Plan and assign the Customer Support Chatbot project across our engineering team.",
  "Break down the Smart Inventory System project and assign sub-tasks by employee expertise.",
];

const WORKFLOW = [
  { agent:"planner",      task:"Decompose goal into executable sub-tasks", model:"frontier", expectedTokens:400 },
  { agent:"research",     task:"Search web & gather relevant information", model:"mid",      expectedTokens:600 },
  { agent:"execution",    task:"Extract & structure key data points",      model:"slm",      expectedTokens:350 },
  { agent:"verification", task:"Fact-check outputs & score confidence",    model:"mid",      expectedTokens:450 },
  { agent:"memory",       task:"Extract & store knowledge from workflow",  model:"slm",      expectedTokens:300 },
  { agent:"report",       task:"Synthesize final structured report",       model:"frontier", expectedTokens:700 },
];

// ── ParticleCanvas (unchanged from v6) ───────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c=ref.current, ctx=c.getContext("2d"); let raf;
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const pts=Array.from({length:55},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.4+.4,col:["#7C3AED","#0EA5E9","#10B981","#6366F1"][Math.floor(Math.random()*4)]}));
    const loop=()=>{ctx.clearRect(0,0,c.width,c.height);pts.forEach(p=>{p.x=(p.x+p.vx+c.width)%c.width;p.y=(p.y+p.vy+c.height)%c.height;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col+"55";ctx.fill();});for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<130){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(99,102,241,${.07*(1-d/130)})`;ctx.lineWidth=.5;ctx.stroke();}}raf=requestAnimationFrame(loop);};
    loop();return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ── Typewriter / StreamText (unchanged from v6) ───────────────────────────────
function Typewriter({text,speed=14,color="#94a3b8"}){
  const [out,setOut]=useState("");
  useEffect(()=>{setOut("");let i=0;const t=setInterval(()=>{setOut(text.slice(0,++i));if(i>=text.length)clearInterval(t);},speed);return()=>clearInterval(t);},[text,speed]);
  return <span style={{color,fontFamily:"'DM Mono',monospace"}}>{out}<span style={{animation:"blink .7s infinite",opacity:out.length===text.length?0:1}}>▋</span></span>;
}

function StreamText({text,speed=6}){
  const [out,setOut]=useState("");
  useEffect(()=>{if(!text){setOut("");return;}setOut("");let i=0;const t=setInterval(()=>{setOut(text.slice(0,i+=3));if(i>=text.length)clearInterval(t);},speed);return()=>clearInterval(t);},[text]);
  return <span style={{whiteSpace:"pre-wrap"}}>{out}<span style={{animation:out.length<(text?.length||0)?"blink .5s infinite":"none",opacity:out.length<(text?.length||0)?1:0}}>▋</span></span>;
}

// ── DataFlowOverlay (unchanged from v6) ──────────────────────────────────────
function DataFlowOverlay({containerRef,activeAgent,phase,agentCardRefs,traceRef,memRef}){
  const svgRef=useRef(null),animRef=useRef([]);
  useEffect(()=>{
    const svg=svgRef.current,container=containerRef.current;
    if(phase!=="running"||!container||!svg)return;
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    animRef.current.forEach(id=>cancelAnimationFrame(id));animRef.current=[];
    if(!activeAgent)return;
    const color=AGENTS[activeAgent]?.color||"#7C3AED";
    const containerRect=container.getBoundingClientRect();
    const rel=(el)=>{if(!el)return null;const r=el.getBoundingClientRect();return{x:r.left-containerRect.left,y:r.top-containerRect.top,w:r.width,h:r.height,cx:r.left-containerRect.left+r.width/2,cy:r.top-containerRect.top+r.height/2};};
    const cardEl=agentCardRefs?.current?.[activeAgent];
    const traceEl=traceRef?.current;
    const memEl=memRef?.current;
    if(!cardEl||!traceEl)return;
    const cardR=rel(cardEl),traceR=rel(traceEl),memR=memEl?rel(memEl):null;
    if(!cardR||!traceR)return;
    const makeBezierPath=(x1,y1,x2,y2)=>{const mx=(x1+x2)/2,arc=Math.min(50,Math.abs(y2-y1)*0.4+20);return `M${x1},${y1} C${mx},${y1-arc} ${mx},${y2-arc} ${x2},${y2}`;};
    const addGuidePath=(d,col,op=0.09)=>{const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",d);p.setAttribute("stroke",col);p.setAttribute("stroke-width","1.5");p.setAttribute("fill","none");p.setAttribute("opacity",op);p.setAttribute("stroke-dasharray","5 7");p.style.filter=`drop-shadow(0 0 4px ${col}66)`;svg.appendChild(p);return p;};
    const d1=makeBezierPath(cardR.x+cardR.w,cardR.cy,traceR.x,traceR.cy);
    addGuidePath(d1,color,0.14);
    let d2=null;
    if(memR){d2=makeBezierPath(traceR.x+traceR.w,traceR.cy,memR.x,memR.cy);addGuidePath(d2,color,0.1);}
    const feedbackColor="#6366F1";
    let dFeedback=null;
    if(memR){
      const fx1=memR.x,fy1=memR.cy+memR.h*0.3,fx2=traceR.x+traceR.w,fy2=traceR.cy+traceR.h*0.3,fmx=(fx1+fx2)/2,fArc=55;
      dFeedback=`M${fx1},${fy1} C${fmx},${fy1+fArc} ${fmx},${fy2+fArc} ${fx2},${fy2}`;
      addGuidePath(dFeedback,feedbackColor,0.07);
      const labelEl=document.createElementNS("http://www.w3.org/2000/svg","text");
      labelEl.setAttribute("x",fmx);labelEl.setAttribute("y",fy1+fArc+14);labelEl.setAttribute("text-anchor","middle");labelEl.setAttribute("fill",feedbackColor);labelEl.setAttribute("font-size","8");labelEl.setAttribute("opacity","0.4");labelEl.setAttribute("font-family","monospace");labelEl.textContent="memory→trace";
      svg.appendChild(labelEl);
    }
    const spawnAlongPath=(pathEl,col,delayMs=0)=>{
      const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");
      const halo=document.createElementNS("http://www.w3.org/2000/svg","circle");
      dot.setAttribute("r","3.5");dot.setAttribute("fill",col);dot.setAttribute("opacity","0");dot.style.filter=`drop-shadow(0 0 6px ${col}) drop-shadow(0 0 12px ${col}88)`;
      halo.setAttribute("r","7");halo.setAttribute("fill","none");halo.setAttribute("stroke",col);halo.setAttribute("stroke-width","0.8");halo.setAttribute("opacity","0");halo.style.filter="blur(1.5px)";
      svg.appendChild(halo);svg.appendChild(dot);
      const len=pathEl.getTotalLength();let start=null;const dur=1000+Math.random()*350;
      const tick=(ts)=>{if(!start)start=ts+delayMs;const e=ts-start;if(e<0){animRef.current.push(requestAnimationFrame(tick));return;}const t=Math.min(e/dur,1),ease=t<.5?2*t*t:-1+(4-2*t)*t;const pt=pathEl.getPointAtLength(ease*len);const alpha=t<.12?t/.12:t>.85?(1-t)/.15:1;[dot,halo].forEach(c=>{c.setAttribute("cx",pt.x);c.setAttribute("cy",pt.y);c.setAttribute("opacity",alpha);});if(t<1)animRef.current.push(requestAnimationFrame(tick));else{[dot,halo].forEach(c=>{if(svg.contains(c))svg.removeChild(c);});}};
      animRef.current.push(requestAnimationFrame(tick));
    };
    const makeSVGPath=(d)=>{const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",d);p.setAttribute("fill","none");p.setAttribute("opacity","0");svg.appendChild(p);return p;};
    const animPath1=makeSVGPath(d1);
    const animPath2=d2?makeSVGPath(d2):null;
    let running=true;
    const animPathFeedback=dFeedback?makeSVGPath(dFeedback):null;
    const burst=()=>{
      if(!running)return;
      for(let i=0;i<3;i++)spawnAlongPath(animPath1,color,i*230);
      if(animPath2)for(let i=0;i<2;i++)spawnAlongPath(animPath2,color,i*310+120);
      if(animPathFeedback)spawnAlongPath(animPathFeedback,feedbackColor,800);
      setTimeout(()=>{if(running)burst();},1500);
    };
    burst();
    return()=>{running=false;animRef.current.forEach(id=>cancelAnimationFrame(id));animRef.current=[];while(svg.firstChild)svg.removeChild(svg.firstChild);};
  },[activeAgent,phase,containerRef,agentCardRefs,traceRef,memRef]);
  return <svg ref={svgRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:5,overflow:"visible"}}/>;
}

// ── MiniPreview (unchanged from v6) ──────────────────────────────────────────
function MiniPreview(){
  const [activeIdx,setActiveIdx]=useState(0),[doneSet,setDoneSet]=useState(new Set()),[progress,setProgress]=useState(0),[log,setLog]=useState([]),[particleT,setParticleT]=useState(0);
  const agentList=Object.entries(AGENTS);
  const FAKE_THOUGHTS={
    planner:     ["Decomposing goal into 4 parallel sub-tasks…","Routing task plan to Research agent"],
    research:    ["Querying Tavily web search API…","Found 12 relevant sources — filtering top 5"],
    execution:   ["Extracting structured data points…","Normalising 8 key findings"],
    verification:["Cross-checking 3 factual claims…","Confidence score: 91/100 — flagging for gate"],
    memory:      ["Storing domain insights to long-term store…","Experience store updated (+3 entries)"],
    report:      ["Synthesising final structured report…","✓ Report complete — 840 tokens"],
  };
  useEffect(()=>{
    let idx=0,progTick=0;setDoneSet(new Set());setActiveIdx(0);setProgress(0);setLog([]);
    const runNext=()=>{
      if(idx>=agentList.length){setTimeout(()=>{idx=0;progTick=0;setDoneSet(new Set());setActiveIdx(0);setProgress(0);setLog([]);runNext();},2200);return;}
      setActiveIdx(idx);setProgress(0);progTick=0;
      const agKey=agentList[idx][0];
      const thoughts=FAKE_THOUGHTS[agKey]||["Processing…","Complete"];
      let tIdx=0;
      const addThought=()=>{if(tIdx<thoughts.length){setLog(p=>[...p.slice(-5),{agent:agKey,msg:thoughts[tIdx],ts:Date.now()}]);tIdx++;}};
      addThought();
      const dur=1100+Math.random()*600,interval=40,steps=dur/interval;
      const t=setInterval(()=>{progTick++;setProgress(Math.min(100,Math.round(progTick/steps*100)));if(progTick===Math.floor(steps*0.5))addThought();if(progTick>=steps){clearInterval(t);setDoneSet(prev=>new Set([...prev,agKey]));idx++;setTimeout(runNext,180);}},interval);
    };
    runNext();
  },[]);
  useEffect(()=>{let f=0;const t=setInterval(()=>{f=(f+1.8)%100;setParticleT(f);},16);return()=>clearInterval(t);},[]);
  return (
    <div style={{background:"rgba(5,5,18,.92)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"18px 20px",backdropFilter:"blur(28px)",boxShadow:"0 0 60px rgba(124,58,237,.15)",width:"100%",maxWidth:560}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#10B981",boxShadow:"0 0 8px #10B981",animation:"breathe 1s infinite"}}/>
        <span style={{color:"#1e4a38",fontSize:9,fontFamily:"monospace",letterSpacing:2}}>LIVE ORCHESTRATION PREVIEW</span>
        <div style={{marginLeft:"auto",display:"flex",gap:10}}>
          <span style={{color:"#1a2a3a",fontSize:9,fontFamily:"monospace"}}>{doneSet.size}/6 agents</span>
          <span style={{color:"#1a3025",fontSize:9,fontFamily:"monospace"}}>⚡ cost-aware routing</span>
        </div>
      </div>
      <div style={{position:"relative",paddingBottom:6}}>
        <div style={{position:"absolute",top:22,left:0,width:"100%",height:4,pointerEvents:"none"}}>
          {agentList.slice(0,-1).map(([key,a],i)=>{
            const isDone=doneSet.has(key),isActive=i===activeIdx;
            const segW=100/agentList.length,barLeft=`${segW*i+segW*0.78}%`,barWidth=`${segW*0.44}%`;
            const particleProgress=isDone?(particleT/100):(progress/100);
            const particleLeft=`calc(${segW*i+segW*0.78}% + ${segW*0.44}% * ${particleProgress.toFixed(4)})`;
            return(
              <div key={key}>
                <div style={{position:"absolute",top:1,left:barLeft,width:barWidth,height:2,background:isDone?a.color+"55":"#1a1a30",borderRadius:1,transition:"background .4s"}}/>
                {isActive&&<div style={{position:"absolute",top:1,left:barLeft,width:`calc(${barWidth} * ${(progress/100).toFixed(4)})`,height:2,background:a.color,borderRadius:1,transition:"width .04s linear",boxShadow:`0 0 6px ${a.color}`}}/>}
                {(isActive||isDone)&&<div style={{position:"absolute",top:-2,left:particleLeft,transform:"translateX(-50%)",width:7,height:7,borderRadius:"50%",background:a.color,boxShadow:`0 0 8px ${a.color}, 0 0 16px ${a.color}66`,transition:isDone?"left .016s linear":"none",pointerEvents:"none"}}/>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:0,alignItems:"flex-start"}}>
          {agentList.map(([key,a],i)=>{
            const isDone=doneSet.has(key),isActive=i===activeIdx;
            return(
              <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:42,height:42,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,position:"relative",overflow:"hidden",background:isActive?a.bg:isDone?a.bg.replace(".08",".05"):"rgba(8,8,20,.75)",border:`1.5px solid ${isActive?a.color:isDone?a.color+"55":"#151525"}`,boxShadow:isActive?`0 0 22px ${a.glow}55,0 0 44px ${a.glow}22`:"none",transition:"all .35s cubic-bezier(.4,0,.2,1)",animation:isActive?"float 2s ease-in-out infinite":"none"}}>
                  {a.avatar}
                  {isActive&&<div style={{position:"absolute",bottom:0,left:0,height:2,background:a.color,width:`${progress}%`,transition:"width .04s linear",boxShadow:`0 0 8px ${a.color}`}}/>}
                  {isActive&&<div style={{position:"absolute",inset:0,background:`linear-gradient(105deg,transparent 35%,${a.color}14 50%,transparent 65%)`,backgroundSize:"200% 100%",animation:"shimmer 1.4s linear infinite"}}/>}
                  {isDone&&!isActive&&<div style={{position:"absolute",inset:0,background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:a.color,animation:"fadeIn .25s ease"}}>✓</div>}
                </div>
                <div style={{fontSize:8,fontFamily:"monospace",color:isActive?a.color:isDone?a.color+"88":"#1e2535",textAlign:"center",transition:"color .3s",letterSpacing:.5}}>{a.label.slice(0,5).toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{marginTop:12,background:"rgba(3,3,12,.7)",borderRadius:10,padding:"10px 12px",height:72,overflow:"hidden",position:"relative",border:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(3,3,12,.0) 0%,rgba(3,3,12,.85) 100%)",zIndex:1,borderRadius:10,pointerEvents:"none"}}/>
        {log.length===0&&<div style={{color:"#1a1a30",fontSize:9,fontFamily:"monospace",paddingTop:4}}>Initialising agents…</div>}
        {[...log].reverse().slice(0,4).map((entry,i)=>{const a=AGENTS[entry.agent];return(
          <div key={i} style={{display:"flex",gap:7,alignItems:"center",marginBottom:5,opacity:Math.max(0.1,1-i*0.28),animation:i===0?"fadeSlideIn .25s ease":"none"}}>
            <span style={{fontSize:9}}>{a.avatar}</span>
            <span style={{color:a.color,fontSize:8,fontFamily:"monospace",fontWeight:600,width:48,flexShrink:0}}>{a.label.slice(0,6).toUpperCase()}</span>
            <span style={{color:"#334155",fontSize:9,fontFamily:"monospace"}}>{entry.msg}</span>
          </div>
        );})}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        {[{label:"AGENTS",val:`${doneSet.size}/6`,color:"#818cf8"},{label:"MODEL ROUTING",val:"3-tier",color:"#34d399"},{label:"GATE",val:"active",color:"#fbbf24"},{label:"MEMORY",val:"live",color:"#a78bfa"}].map(m=>(
          <div key={m.label} style={{flex:1,textAlign:"center"}}>
            <div style={{color:m.color,fontSize:11,fontWeight:700,fontFamily:"monospace"}}>{m.val}</div>
            <div style={{color:"#1a2030",fontSize:7,fontFamily:"monospace",letterSpacing:1,marginTop:2}}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ConfidenceGauge (unchanged from v6) ──────────────────────────────────────
function ConfidenceGauge({score}){
  const r=38,cx=50,cy=54,strokeW=7,circumference=Math.PI*r,pct=Math.min(100,Math.max(0,score))/100,dash=pct*circumference,color=score>=80?"#34d399":score>=60?"#fbbf24":"#f472b6";
  const [animated,setAnimated]=useState(0);
  useEffect(()=>{let frame=0,total=40;const t=setInterval(()=>{frame++;setAnimated(Math.round((frame/total)*score));if(frame>=total)clearInterval(t);},30);return()=>clearInterval(t);},[score]);
  return (
    <div style={{textAlign:"center"}}>
      <svg width="100" height="60" style={{overflow:"visible"}}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#1a1a30" strokeWidth={strokeW} strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} style={{filter:`drop-shadow(0 0 6px ${color})`,transition:"stroke-dasharray 1s ease"}}/>
        <line x1={cx} y1={cy} x2={cx+(r-4)*Math.cos(Math.PI-pct*Math.PI)} y2={cy-(r-4)*Math.sin(pct*Math.PI)} stroke={color} strokeWidth={2} strokeLinecap="round" style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
        <circle cx={cx} cy={cy} r={4} fill={color} style={{filter:`drop-shadow(0 0 6px ${color})`}}/>
        <text x={cx} y={cy-10} textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="monospace">{animated}</text>
        <text x={cx} y={cy+2} textAnchor="middle" fill="#334155" fontSize="8" fontFamily="monospace">CONFIDENCE</text>
        <text x={cx-r+2} y={cy+12} fill="#334155" fontSize="8" fontFamily="monospace">0</text>
        <text x={cx+r-8} y={cy+12} fill="#334155" fontSize="8" fontFamily="monospace">100</text>
      </svg>
      <div style={{fontSize:9,fontFamily:"monospace",color,marginTop:2,letterSpacing:1}}>{score>=80?"APPROVED":"NEEDS REVIEW"}</div>
    </div>
  );
}

// ── SkeletonCard (unchanged from v6) ─────────────────────────────────────────
function SkeletonCard({index,agent}){
  const a=AGENTS[agent];
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),index*60);return()=>clearTimeout(t);},[index]);
  return (
    <div style={{position:"relative",borderRadius:14,overflow:"hidden",padding:"13px 15px",background:"rgba(8,8,20,0.6)",border:"1px solid rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(10px)",transition:"all .4s cubic-bezier(.4,0,.2,1)"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.02) 50%,transparent 70%)",backgroundSize:"200% 100%",animation:"shimmer 2.5s linear infinite",pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,opacity:0.3}}>{a.avatar}</div>
        <div style={{flex:1}}>
          <div style={{height:10,width:"58%",background:"rgba(255,255,255,0.05)",borderRadius:4,marginBottom:6}}/>
          <div style={{height:8,width:"32%",background:"rgba(255,255,255,0.03)",borderRadius:3}}/>
        </div>
        <div style={{width:9,height:9,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.08)"}}/>
      </div>
      <div style={{height:8,width:"82%",background:"rgba(255,255,255,0.04)",borderRadius:3,marginBottom:4}}/>
      <div style={{height:8,width:"52%",background:"rgba(255,255,255,0.03)",borderRadius:3}}/>
    </div>
  );
}

// ── AgentCard (unchanged from v6) ────────────────────────────────────────────
function AgentCard({agent,status,task,model,isActive,progress,index,realOutput,tokenCount,onHover}){
  const a=AGENTS[agent],tier=MODEL_TIERS[model];
  const [vis,setVis]=useState(false),[expanded,setExpanded]=useState(false),[displayTokens,setDisplayTokens]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),index*70);return()=>clearTimeout(t);},[index]);
  useEffect(()=>{if(!isActive||!tokenCount){setDisplayTokens(tokenCount||0);return;}let n=0;const t=setInterval(()=>{n+=Math.ceil(tokenCount/30);setDisplayTokens(Math.min(n,tokenCount));if(n>=tokenCount)clearInterval(t);},50);return()=>clearInterval(t);},[isActive,tokenCount]);
  return (
    <div onMouseEnter={()=>onHover&&onHover(agent)} onMouseLeave={()=>onHover&&onHover(null)}
      style={{position:"relative",borderRadius:14,overflow:"hidden",padding:"13px 15px",background:isActive?a.bg:status==="done"?a.bg.replace(".08",".04"):"rgba(8,8,20,0.85)",border:`1px solid ${isActive?a.color:status==="done"?a.color+"44":"rgba(255,255,255,0.05)"}`,boxShadow:isActive?`0 0 32px ${a.glow}35,0 0 64px ${a.glow}12`:status==="done"?`0 0 10px ${a.glow}18`:"none",transition:"all .4s cubic-bezier(.4,0,.2,1)",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(14px)",backdropFilter:"blur(20px)"}}>
      {isActive&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${a.color},transparent)`,animation:"scanline 1.6s linear infinite"}}/>}
      {isActive&&<div style={{position:"absolute",bottom:0,left:0,height:2,background:`linear-gradient(90deg,${a.color},${a.glow})`,width:`${progress}%`,transition:"width .1s linear",boxShadow:`0 0 10px ${a.color}`}}/>}
      {isActive&&<div style={{position:"absolute",inset:0,background:`linear-gradient(105deg,transparent 40%,${a.color}07 50%,transparent 60%)`,backgroundSize:"200% 100%",animation:"shimmer 2.2s linear infinite",pointerEvents:"none"}}/>}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
        <div style={{width:34,height:34,borderRadius:10,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",background:isActive?`${a.glow}28`:`${a.glow}12`,border:`1px solid ${isActive?a.color:a.color+"44"}`,boxShadow:isActive?`0 0 18px ${a.glow}55`:"none",transition:"all .3s",animation:isActive?"float 2.5s ease-in-out infinite":"none"}}>{a.avatar}</div>
        <div style={{flex:1}}>
          <div style={{color:"#f1f5f9",fontWeight:700,fontSize:12}}>{a.label} Agent</div>
          <div style={{display:"flex",gap:5,marginTop:2}}>
            <span style={{fontSize:9,fontFamily:"monospace",letterSpacing:1,color:tier.color,background:`${tier.color}20`,padding:"1px 5px",borderRadius:3}}>{tier.label}</span>
            <span style={{fontSize:9,color:"#2a3040",fontFamily:"monospace"}}>{tier.desc}</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          {status==="done"&&<span style={{color:"#34d399",fontSize:16,filter:"drop-shadow(0 0 6px #10B981)"}}>✓</span>}
          {status==="active"&&<div style={{width:9,height:9,borderRadius:"50%",background:a.color,boxShadow:`0 0 12px ${a.color}`,animation:"breathe 1.2s ease-in-out infinite"}}/>}
          {status==="pending"&&<div style={{width:9,height:9,borderRadius:"50%",border:"1.5px solid #1e2035"}}/>}
          {status==="gate"&&<span style={{color:"#fbbf24",fontSize:14,animation:"pulse 1s infinite"}}>⚠</span>}
          {status==="error"&&<span style={{color:"#f472b6",fontSize:14}}>✕</span>}
          {(isActive||status==="done")&&tokenCount>0&&<div style={{fontSize:9,fontFamily:"monospace",color:tier.color,background:`${tier.color}15`,padding:"1px 5px",borderRadius:4}}>↑{displayTokens}t</div>}
        </div>
      </div>
      <div style={{color:isActive?"#94a3b8":"#3a4060",fontSize:11,fontFamily:"'DM Mono',monospace",lineHeight:1.5}}>{isActive?<Typewriter text={task} speed={22} color="#94a3b8"/>:task}</div>
      {status==="done"&&realOutput&&(
        <div style={{marginTop:7}}>
          <button onClick={()=>setExpanded(!expanded)} style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:6,padding:"4px 9px",fontSize:9,color:"#34d399",fontFamily:"monospace",cursor:"pointer",width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
            <span>✓ View output</span><span>{expanded?"▲":"▼"}</span>
          </button>
          {expanded&&<div style={{marginTop:5,background:"rgba(3,3,12,.8)",borderRadius:7,padding:9,fontSize:10,fontFamily:"monospace",color:"#64748b",lineHeight:1.7,maxHeight:100,overflowY:"auto",border:"1px solid rgba(255,255,255,0.04)",animation:"fadeSlideIn .3s ease"}}>{realOutput.substring(0,350)}{realOutput.length>350?"…":""}</div>}
        </div>
      )}
      {status==="error"&&<div style={{marginTop:7,padding:"4px 8px",background:"rgba(244,114,182,0.05)",borderRadius:5,border:"1px solid rgba(244,114,182,0.12)",fontSize:9,color:"#f472b6",fontFamily:"monospace"}}>✕ Check console</div>}
    </div>
  );
}

// ── ThoughtTrace (unchanged from v6) ─────────────────────────────────────────
function ThoughtTrace({entries,isRunning,hoveredAgent}){
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[entries]);
  return (
    <div style={{background:"rgba(3,3,14,0.92)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:16,height:340,overflowY:"auto",backdropFilter:"blur(20px)",fontFamily:"'DM Mono',monospace",fontSize:11}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:isRunning?"#7C3AED":"#1a1a30",boxShadow:isRunning?"0 0 8px #7C3AED":"none",animation:isRunning?"breathe 1s infinite":"none"}}/>
        <span style={{color:"#1e2a3a",fontSize:10,letterSpacing:2}}>THOUGHT TRACE</span>
        {isRunning&&<span style={{marginLeft:"auto",color:"#7C3AED",fontSize:9,animation:"blink 1s infinite"}}>● LIVE</span>}
      </div>
      {entries.length===0&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80%",gap:12,paddingTop:20}}>
          <div style={{fontSize:28,opacity:0.15,animation:"float 3s ease-in-out infinite"}}>🧠</div>
          <div style={{color:"#1a2030",fontSize:10,fontFamily:"monospace",textAlign:"center",lineHeight:1.8}}>Thought trace will appear here<br/>as each agent reasons through your goal</div>
          <div style={{display:"flex",gap:6,marginTop:4}}>{["planner","research","execution","verification","memory","report"].map(k=>(<div key={k} style={{width:6,height:6,borderRadius:"50%",background:AGENTS[k].color,opacity:0.12}}/>))}</div>
        </div>
      )}
      {entries.map((e,i)=>{
        const a=AGENTS[e.agent],isLast=i===entries.length-1,isHighlighted=hoveredAgent===e.agent;
        return (
          <div key={i} style={{marginBottom:11,opacity:hoveredAgent?(isHighlighted?1:0.15):isLast?1:.42,animation:isLast?"fadeSlideIn .3s ease":"none",transition:"opacity .2s ease,background .2s ease",background:isHighlighted?"rgba(255,255,255,0.03)":"transparent",borderRadius:isHighlighted?8:0,padding:isHighlighted?"6px 8px":0,margin:isHighlighted?"0 -8px 11px -8px":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              <span style={{fontSize:11}}>{a?.avatar}</span>
              <span style={{color:a?.color,fontWeight:600,fontSize:10,letterSpacing:.5}}>{a?.label?.toUpperCase()}</span>
              {e.model&&<span style={{color:MODEL_TIERS[e.model]?.color,fontSize:9,background:`${MODEL_TIERS[e.model]?.color}18`,padding:"1px 5px",borderRadius:3}}>{e.model.toUpperCase()}</span>}
              <span style={{color:"#1a2030",fontSize:9,marginLeft:"auto"}}>{new Date(e.ts).toLocaleTimeString()}</span>
            </div>
            <div style={{color:"#94a3b8",paddingLeft:18,borderLeft:`2px solid ${a?.color||"#333"}${isHighlighted?"88":"28"}`,lineHeight:1.6,transition:"border-color .2s"}}>
              {isLast&&isRunning?<Typewriter text={e.msg} speed={10} color="#94a3b8"/>:e.msg}
            </div>
          </div>
        );
      })}
      <div ref={endRef}/>
      {isRunning&&<span style={{color:"#7C3AED",animation:"blink .7s infinite"}}>█</span>}
    </div>
  );
}

// ── Per-agent tool map (unchanged from v6) ────────────────────────────────────
const AGENT_TOOLS = {
  planner:      { call:[],               passive:["or"] },
  research:     { call:["web","arxiv"],  passive:["or"] },
  execution:    { call:["sql"],          passive:["web","or"] },
  verification: { call:["or"],           passive:["web","sql"] },
  memory:       { call:["drive"],        passive:["sql","or"] },
  report:       { call:["or"],           passive:["drive","web"] },
};

// ── MCPPanel (unchanged from v6) ─────────────────────────────────────────────
function MCPPanel({active,pulsing,activeAgent}){
  const tools=[
    {id:"web",   name:"tavily",     icon:"🌐", color:"#38bdf8"},
    {id:"arxiv", name:"arxiv",      icon:"📄", color:"#a78bfa"},
    {id:"drive", name:"gdrive",     icon:"△",  color:"#34d399"},
    {id:"sql",   name:"sql_db",     icon:"⊟",  color:"#fbbf24"},
    {id:"github",name:"github",     icon:"⑂",  color:"#f472b6"},
    {id:"or",    name:"openrouter", icon:"⊳",  color:"#38bdf8"},
  ];
  const getState=(id)=>{if(pulsing.includes(id))return"calling";if(active.includes(id))return"active";return"off";};
  const stateStyles={
    calling:{bg:"rgba(14,165,233,0.18)",border:"#0EA5E9",shadow:"0 0 24px rgba(14,165,233,0.5), 0 0 48px rgba(14,165,233,0.2)",scale:"scale(1.08)",filter:"drop-shadow(0 0 8px #0EA5E9)",dotAnim:"breathe 0.5s infinite"},
    active: {bg:"rgba(14,165,233,0.07)",border:"#0EA5E9",shadow:"0 0 10px rgba(14,165,233,0.2)",scale:"scale(1.02)",filter:"drop-shadow(0 0 4px #0EA5E966)",dotAnim:"breathe 1.8s infinite"},
    off:    {bg:"rgba(8,8,20,0.7)",border:"rgba(255,255,255,0.04)",shadow:"none",scale:"scale(1)",filter:"none",dotAnim:null},
  };
  return (
    <div style={{background:"rgba(3,3,14,0.92)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:14,backdropFilter:"blur(20px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:9,letterSpacing:1.5,color:"#38bdf8",background:"rgba(14,165,233,0.1)",padding:"2px 7px",borderRadius:4,border:"1px solid rgba(14,165,233,0.18)"}}>MCP</span>
        <span style={{color:"#475569",fontSize:11,fontWeight:600}}>Interoperability Layer</span>
        {pulsing.length>0&&<span style={{marginLeft:"auto",fontSize:8,fontFamily:"monospace",color:"#38bdf8",animation:"blink 0.8s infinite",letterSpacing:1}}>● CALLING</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
        {tools.map(t=>{
          const state=getState(t.id),s=stateStyles[state],toolColor=state==="calling"?t.color:state==="active"?t.color:"#2a3040";
          return(
            <div key={t.id} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:9,padding:"9px 6px",textAlign:"center",boxShadow:s.shadow,transition:"all .3s cubic-bezier(.4,0,.2,1)",transform:s.scale,position:"relative",overflow:"hidden"}}>
              {state==="calling"&&<div style={{position:"absolute",inset:-1,borderRadius:9,border:`1px solid ${t.color}`,animation:"ripple 1s ease-out infinite",pointerEvents:"none"}}/>}
              <div style={{fontSize:16,marginBottom:3,filter:s.filter,transition:"filter .3s"}}>{t.icon}</div>
              <div style={{color:toolColor,fontSize:8,fontFamily:"monospace",transition:"color .3s",fontWeight:state==="calling"?"700":"400"}}>{t.name}</div>
              {state!=="off"&&<div style={{width:3,height:3,borderRadius:"50%",background:t.color,margin:"3px auto 0",boxShadow:`0 0 6px ${t.color}`,animation:s.dotAnim}}/>}
              {state==="calling"&&<div style={{position:"absolute",top:3,right:4,fontSize:7,fontFamily:"monospace",color:t.color,fontWeight:700,letterSpacing:.5}}>LIVE</div>}
            </div>
          );
        })}
      </div>
      {activeAgent&&AGENT_TOOLS[activeAgent]&&AGENT_TOOLS[activeAgent].call.length>0&&(
        <div style={{marginTop:9,padding:"6px 9px",borderRadius:7,background:"rgba(14,165,233,0.05)",border:"1px solid rgba(14,165,233,0.1)"}}>
          <span style={{color:"#1e3a4a",fontSize:8,fontFamily:"monospace"}}>
            {activeAgent==="research"?"🔍 Research agent: querying Tavily for live web data + arXiv for academic sources":
             activeAgent==="execution"?"⚙️ Execution agent: writing structured output to sql_db":
             activeAgent==="memory"?"💾 Memory agent: persisting insights to Google Drive store":
             activeAgent==="verification"?"🛡 Verification agent: cross-referencing via OpenRouter":
             activeAgent==="report"?"📋 Report agent: synthesising via OpenRouter Frontier":
             "🧠 Planner agent: routing task plan via OpenRouter"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── RightPanel (unchanged from v6) ───────────────────────────────────────────
function RightPanel({entries,activeModel,stats,tokenCounts,isRunning,memRef,agentTokens}){
  const [tab,setTab]=useState("memory");
  const tiers=["Short-Term","Long-Term","Experience Store"],cols=["#818cf8","#a78bfa","#c084fc"];
  const total=Object.values(stats).reduce((a,b)=>a+b,0);
  const totalCost=Object.entries(tokenCounts).reduce((s,[tier,tok])=>s+(tok*(MODEL_TIERS[tier]?.costPer1k||0)/1000),0);
  const frontierCost=Object.values(tokenCounts).reduce((a,b)=>a+b,0)*MODEL_TIERS.frontier.costPer1k/1000;
  const saved=Math.max(0,frontierCost-totalCost),savePct=frontierCost>0?Math.round((saved/frontierCost)*100):0;
  const isHyperEfficient=savePct>=80;
  const agentCostData=WORKFLOW.map(w=>{const tok=agentTokens?.[w.agent]||0,tier=MODEL_TIERS[w.model],actual=tok*tier.costPer1k/1000,frontier=tok*MODEL_TIERS.frontier.costPer1k/1000;return{agent:w.agent,label:AGENTS[w.agent].label,color:AGENTS[w.agent].color,tier:w.model,actual,frontier,tok};});
  const maxFrontier=Math.max(...agentCostData.map(d=>d.frontier),0.001);
  return (
    <div ref={memRef} style={{background:"rgba(3,3,14,0.92)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,backdropFilter:"blur(20px)",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        {[{id:"memory",label:"⊜ Memory",color:"#818cf8"},{id:"routing",label:"⟳ Routing",color:"#f472b6"},{id:"cost",label:"📊 Cost",color:"#34d399"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0",background:tab===t.id?`${t.color}10`:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?t.color:"transparent"}`,color:tab===t.id?t.color:"#334155",fontSize:10,fontFamily:"monospace",fontWeight:600,cursor:"pointer",transition:"all .2s",letterSpacing:.5}}>{t.label}</button>
        ))}
      </div>
      <div style={{padding:14}}>
        {tab==="memory"&&(
          <div>
            {entries.length>0&&<div style={{color:"#2a3a4a",fontSize:9,fontFamily:"monospace",marginBottom:10}}>{entries.length} entries stored</div>}
            {tiers.map((tier,ti)=>{const te=entries.filter(e=>e.tier===ti);return(
              <div key={ti} style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <div style={{width:5,height:5,borderRadius:1,background:cols[ti],opacity:.7}}/>
                  <span style={{color:"#1e2a3a",fontSize:9,letterSpacing:1.5,fontFamily:"monospace"}}>{tier.toUpperCase()}</span>
                  <span style={{color:"#141420",fontSize:9,marginLeft:"auto",fontFamily:"monospace"}}>{te.length}</span>
                </div>
                {te.length===0?<div style={{color:"#141420",fontSize:9,fontFamily:"monospace",paddingLeft:10,fontStyle:"italic"}}>nothing stored yet…</div>
                 :te.map((e,i)=><div key={i} style={{background:`${cols[ti]}08`,borderRadius:5,padding:"5px 9px",marginBottom:3,border:`1px solid ${cols[ti]}18`,fontSize:9,fontFamily:"monospace",color:"#94a3b8",animation:"fadeSlideIn .4s ease"}}><span style={{color:cols[ti]}}>▸ </span>{e.text}</div>)}
              </div>
            );})}
          </div>
        )}
        {tab==="routing"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:9,padding:"8px",textAlign:"center"}}>
                <div style={{color:"#34d399",fontSize:15,fontWeight:800,fontFamily:"monospace"}}>${totalCost.toFixed(4)}</div>
                <div style={{color:"#1e3a2a",fontSize:8,fontFamily:"monospace",letterSpacing:1,marginTop:1}}>ACTUAL</div>
              </div>
              <div style={{background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.12)",borderRadius:9,padding:"8px",textAlign:"center"}}>
                <div style={{color:"#a78bfa",fontSize:15,fontWeight:800,fontFamily:"monospace"}}>{savePct}%</div>
                <div style={{color:"#2a1a4a",fontSize:8,fontFamily:"monospace",letterSpacing:1,marginTop:1}}>SAVED</div>
              </div>
            </div>
            {isHyperEfficient&&(
              <div style={{marginBottom:10,padding:"7px 10px",borderRadius:8,background:"linear-gradient(135deg,rgba(52,211,153,0.08),rgba(99,102,241,0.08))",border:"1px solid rgba(52,211,153,0.3)",display:"flex",alignItems:"center",gap:7,boxShadow:"0 0 16px rgba(52,211,153,0.1)",animation:"fadeSlideIn .4s ease"}}>
                <span style={{animation:"float 2s ease-in-out infinite"}}>⚡</span>
                <div style={{flex:1}}><div style={{color:"#34d399",fontSize:9,fontWeight:700,fontFamily:"monospace",letterSpacing:.5}}>HYPER-EFFICIENT</div><div style={{color:"#1e3a2a",fontSize:8,fontFamily:"monospace"}}>{savePct}% cheaper vs all-Frontier</div></div>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 8px #34d399",animation:"breathe 1s infinite"}}/>
              </div>
            )}
            {Object.entries(MODEL_TIERS).map(([key,tier])=>{const on=activeModel===key,count=stats[key]||0,pct=total>0?Math.round(count/total*100):0,tokens=tokenCounts[key]||0,cost=tokens*tier.costPer1k/1000;return(
              <div key={key} style={{marginBottom:6,padding:"6px 8px",borderRadius:8,background:on?`${tier.color}10`:"transparent",border:`1px solid ${on?tier.color+"44":"transparent"}`,transition:"all .3s",boxShadow:on?`0 0 12px ${tier.color}12`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:count>0?4:0}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:tier.color,boxShadow:on?`0 0 8px ${tier.color}`:"none",animation:on?"breathe 1s infinite":"none"}}/>
                  <span style={{color:tier.color,fontSize:9,fontWeight:700,fontFamily:"monospace",width:52}}>{tier.label}</span>
                  <span style={{color:"#2a3040",fontSize:8,fontFamily:"monospace",flex:1}}>{tier.desc}</span>
                  <span style={{color:"#3a4555",fontSize:9,fontFamily:"monospace"}}>{count}x</span>
                  {tokens>0&&<span style={{color:"#2a3540",fontSize:8,fontFamily:"monospace"}}>${cost.toFixed(5)}</span>}
                </div>
                {count>0&&<div style={{height:2,background:"#0a0a18",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${tier.color}70,${tier.color})`,borderRadius:1,transition:"width .5s ease",boxShadow:`0 0 5px ${tier.color}`}}/></div>}
              </div>
            );})}
            {isRunning&&<div style={{marginTop:6,fontSize:8,color:"#1a3025",fontFamily:"monospace",textAlign:"right",animation:"blink 1.5s infinite"}}>● tracking live</div>}
          </div>
        )}
        {tab==="cost"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
              {[{label:"ACTUAL",val:`$${totalCost.toFixed(4)}`,color:"#34d399"},{label:"ALL-FRONTIER",val:`$${frontierCost.toFixed(4)}`,color:"#f472b6"},{label:"SAVED",val:`${savePct}%`,color:"#fbbf24"}].map(c=>(
                <div key={c.label} style={{background:`${c.color}08`,border:`1px solid ${c.color}18`,borderRadius:8,padding:"7px 6px",textAlign:"center"}}>
                  <div style={{color:c.color,fontSize:13,fontWeight:800,fontFamily:"monospace",lineHeight:1}}>{c.val}</div>
                  <div style={{color:"#1e2a3a",fontSize:7,fontFamily:"monospace",letterSpacing:.8,marginTop:2}}>{c.label}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:8,display:"flex",justifyContent:"flex-end",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#34d399"}}/><span style={{color:"#334155",fontSize:8,fontFamily:"monospace"}}>actual</span></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#f472b688"}}/><span style={{color:"#334155",fontSize:8,fontFamily:"monospace"}}>all-frontier</span></div>
            </div>
            {agentCostData.map((d,i)=>{
              const hasData=d.tok>0,actualPct=maxFrontier>0?(d.actual/maxFrontier*100):0,frontierPct=maxFrontier>0?(d.frontier/maxFrontier*100):0,saving=d.frontier>0?Math.round((1-d.actual/d.frontier)*100):0;
              return(
                <div key={i} style={{marginBottom:8,animation:`fadeSlideIn .4s ease ${i*0.06}s both`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:d.color,fontSize:9,fontFamily:"monospace",fontWeight:700}}>{d.label}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {hasData&&saving>0&&<span style={{color:"#34d399",fontSize:8,fontFamily:"monospace",background:"rgba(52,211,153,0.1)",padding:"1px 5px",borderRadius:3}}>-{saving}%</span>}
                      <span style={{color:"#334155",fontSize:8,fontFamily:"monospace"}}>{d.tok>0?`${d.tok}tok`:""}</span>
                    </div>
                  </div>
                  <div style={{position:"relative",height:14,background:"rgba(10,10,24,0.8)",borderRadius:3,border:"1px solid rgba(255,255,255,0.03)",marginBottom:2}}>
                    <div style={{position:"absolute",left:0,width:`${frontierPct}%`,height:"100%",background:"rgba(244,114,182,0.15)",borderRadius:3,border:"1px solid rgba(244,114,182,0.15)"}}/>
                    {hasData&&<div style={{position:"absolute",left:0,width:`${actualPct}%`,height:"100%",background:`linear-gradient(90deg,${d.color}70,${d.color}cc)`,borderRadius:3,boxShadow:`0 0 6px ${d.color}44`,transition:"width .6s ease",minWidth:hasData?4:0,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>{actualPct>15&&<span style={{color:"#fff",fontSize:7,fontFamily:"monospace",fontWeight:700}}>${d.actual.toFixed(5)}</span>}</div>}
                    {!hasData&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",paddingLeft:6}}><span style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace"}}>waiting…</span></div>}
                  </div>
                </div>
              );
            })}
            {savePct>0&&(
              <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:"linear-gradient(135deg,rgba(52,211,153,0.06),rgba(99,102,241,0.06))",border:"1px solid rgba(52,211,153,0.2)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>⚡</span>
                <div><div style={{color:"#34d399",fontSize:9,fontWeight:700,fontFamily:"monospace"}}>ROUTING SAVED ${saved.toFixed(5)}</div><div style={{color:"#1e3a2a",fontSize:8,fontFamily:"monospace"}}>vs running all 6 agents on Frontier models</div></div>
              </div>
            )}
            {isRunning&&<div style={{marginTop:8,fontSize:8,color:"#1a3025",fontFamily:"monospace",textAlign:"right",animation:"blink 1.5s infinite"}}>● accumulating live</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TimelineView (unchanged from v6) ─────────────────────────────────────────
function TimelineView({timings,totalMs,agentTokens}){
  if(!timings.length)return null;
  const totalSec=(totalMs/1000).toFixed(1);
  const slowest=timings.reduce((a,b)=>b.duration>a.duration?b:a,timings[0]);
  return(
    <div style={{background:"rgba(3,3,14,0.95)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px 18px",backdropFilter:"blur(20px)",marginTop:14,boxShadow:"0 4px 32px rgba(0,0,0,0.4)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 8px #34d399",animation:"breathe 1.4s infinite"}}/>
          <span style={{color:"#94a3b8",fontSize:10,fontFamily:"monospace",letterSpacing:2,fontWeight:700}}>EXECUTION TIMELINE</span>
        </div>
        <div style={{display:"flex",gap:16}}>
          <div style={{textAlign:"right"}}><div style={{color:"#f1f5f9",fontSize:15,fontFamily:"monospace",fontWeight:800,lineHeight:1}}>{totalSec}s</div><div style={{color:"#334155",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>TOTAL</div></div>
          <div style={{textAlign:"right"}}><div style={{color:"#fbbf24",fontSize:15,fontFamily:"monospace",fontWeight:800,lineHeight:1}}>{(slowest.duration/1000).toFixed(1)}s</div><div style={{color:"#334155",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>SLOWEST</div></div>
          <div style={{textAlign:"right"}}><div style={{color:"#a78bfa",fontSize:15,fontFamily:"monospace",fontWeight:800,lineHeight:1}}>~{((totalMs*0.45)/1000).toFixed(1)}s</div><div style={{color:"#334155",fontSize:8,fontFamily:"monospace",letterSpacing:1}}>IF PARALLEL</div></div>
        </div>
      </div>
      <div style={{paddingLeft:72,marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          {[0,25,50,75,100].map(pct=>(<div key={pct} style={{fontSize:7,color:"#1e2a3a",fontFamily:"monospace",transform:"translateX(-50%)",userSelect:"none"}}>{pct===0?"0s":pct===100?totalSec+"s":((totalMs/1000*pct/100).toFixed(1))+"s"}</div>))}
        </div>
        <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)"}}/>
      </div>
      {timings.map((t,i)=>{
        const a=AGENTS[t.agent],left=totalMs>0?(t.start/totalMs*100):0,width=totalMs>0?Math.max(1.5,(t.duration/totalMs*100)):1.5,dur=(t.duration/1000).toFixed(2),isSlowest=t.agent===slowest.agent,tokens=agentTokens?.[t.agent];
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7,animation:`fadeSlideIn .4s ease ${i*0.07}s both`}}>
            <div style={{width:62,flexShrink:0,textAlign:"right"}}><span style={{color:a.color,fontSize:9,fontFamily:"monospace",fontWeight:700}}>{a.label}</span></div>
            <div style={{flex:1,height:20,background:"rgba(10,10,24,0.8)",borderRadius:4,position:"relative",border:"1px solid rgba(255,255,255,0.03)"}}>
              {[25,50,75].map(pct=>(<div key={pct} style={{position:"absolute",left:`${pct}%`,top:0,bottom:0,width:1,background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>))}
              <div style={{position:"absolute",left:`${left}%`,width:`${width}%`,height:"100%",background:`linear-gradient(90deg,${a.color}66,${a.color}cc)`,borderRadius:3,boxShadow:`0 0 ${isSlowest?16:7}px ${a.color}${isSlowest?99:44}`,border:`1px solid ${a.color}44`,display:"flex",alignItems:"center",justifyContent:"center",minWidth:8,overflow:"hidden"}}>
                {width>8&&<span style={{color:"#fff",fontSize:7,fontFamily:"monospace",fontWeight:700,paddingLeft:4,whiteSpace:"nowrap"}}>{dur}s</span>}
              </div>
              {isSlowest&&<div style={{position:"absolute",left:`${Math.min(left+width+0.5,72)}%`,top:"50%",transform:"translateY(-50%)",background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:3,padding:"1px 5px",fontSize:7,fontFamily:"monospace",color:"#fbbf24",whiteSpace:"nowrap",letterSpacing:.5}}>BOTTLENECK</div>}
            </div>
            <div style={{width:56,flexShrink:0}}><div style={{color:"#475569",fontSize:9,fontFamily:"monospace"}}>{dur}s</div>{tokens&&<div style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace"}}>{tokens}tok</div>}</div>
          </div>
        );
      })}
      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.04)",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:8,color:"#1e2a3a",fontFamily:"monospace",letterSpacing:1}}>SEQUENTIAL · {timings.length} AGENTS</span>
        <span style={{fontSize:8,color:"#1e2a3a",fontFamily:"monospace"}}>async parallelism → ~55% faster</span>
      </div>
    </div>
  );
}

// ── GoalHistory (unchanged from v6) ──────────────────────────────────────────
function GoalHistory({history,onSelect}){
  const [open,setOpen]=useState(false);if(!history.length)return null;
  return (
    <div style={{position:"relative",marginBottom:8}}>
      <button onClick={()=>setOpen(!open)} style={{background:"rgba(8,8,20,.85)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"6px 14px",color:"#475569",fontSize:11,fontFamily:"monospace",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#7C3AED55";e.currentTarget.style.color="#94a3b8";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.color="#475569";}}>
        🕐 Recent goals <span style={{fontSize:9}}>{open?"▲":"▼"}</span>
      </button>
      {open&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"rgba(8,8,22,.98)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:8,zIndex:100,backdropFilter:"blur(24px)",animation:"fadeSlideIn .2s ease",minWidth:420}}>
        {history.map((h,i)=><button key={i} onClick={()=>{onSelect(h);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"8px 12px",color:"#475569",fontSize:11,fontFamily:"monospace",cursor:"pointer",borderRadius:6,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,.08)";e.currentTarget.style.color="#94a3b8";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#475569";}}>{h.substring(0,62)}…</button>)}
      </div>}
    </div>
  );
}

// ── ApprovalGate (unchanged from v6) ─────────────────────────────────────────
function ApprovalGate({verificationOutput,score,onApprove,onReject,onSteer}){
  const [steer,setSteer]=useState(""),[show,setShow]=useState(false),[vis,setVis]=useState(false),[blink,setBlink]=useState(true),[closing,setClosing]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),40);},[]);
  useEffect(()=>{const t=setInterval(()=>setBlink(b=>!b),530);return()=>clearInterval(t);},[]);
  const closeWith=(fn)=>{setClosing(true);setVis(false);setTimeout(()=>fn(),320);};
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:closing?"rgba(0,0,8,0)":"rgba(0,0,8,.88)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease",transition:closing?"background .28s ease":"none",pointerEvents:closing?"none":"auto"}}>
      <div style={{background:"linear-gradient(135deg,#080818,#0c0820)",border:"1px solid #F59E0B99",borderRadius:20,padding:34,maxWidth:580,width:"92%",boxShadow:"0 0 70px rgba(245,158,11,.22)",transform:vis&&!closing?"scale(1) translateY(0)":closing?"scale(.96) translateY(8px)":"scale(.94) translateY(18px)",transition:closing?"all .28s cubic-bezier(.4,0,.2,1)":"all .35s cubic-bezier(.4,0,.2,1)",opacity:closing?0:1}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 0 22px rgba(245,158,11,.28)",animation:"breathe 1.5s infinite"}}>⚠</div>
          <div style={{flex:1}}><div style={{color:"#fbbf24",fontWeight:700,fontSize:15}}>Conditional Approval Gate</div><div style={{color:"#713f12",fontSize:10,fontFamily:"monospace",letterSpacing:1,marginTop:2}}>HIGH-RISK OPERATION · HUMAN REVIEW REQUIRED</div></div>
          <ConfidenceGauge score={score}/>
        </div>
        <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.18)",borderRadius:12,padding:13,marginBottom:14,maxHeight:130,overflowY:"auto"}}>
          <div style={{color:"#713f12",fontSize:9,fontFamily:"monospace",letterSpacing:1,marginBottom:7}}>VERIFICATION AGENT OUTPUT:</div>
          <div style={{color:"#e2e8f0",fontSize:11,fontFamily:"'DM Mono',monospace",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{verificationOutput}</div>
        </div>
        {show&&(
          <div style={{marginBottom:14,animation:"fadeSlideIn .3s ease"}}>
            <div style={{background:"#020208",border:"1px solid rgba(124,58,237,0.4)",borderRadius:10,overflow:"hidden"}}>
              <div style={{background:"rgba(124,58,237,0.08)",borderBottom:"1px solid rgba(124,58,237,0.2)",padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#f472b6",opacity:.7}}/><div style={{width:8,height:8,borderRadius:"50%",background:"#fbbf24",opacity:.7}}/><div style={{width:8,height:8,borderRadius:"50%",background:"#34d399",opacity:.7}}/>
                <span style={{marginLeft:8,color:"#334155",fontSize:9,fontFamily:"monospace"}}>chainmind — steering terminal</span>
              </div>
              <div style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:12}}>
                <div style={{color:"#334155",marginBottom:4,fontSize:10}}><span style={{color:"#34d399"}}>chainmind</span><span style={{color:"#475569"}}>@</span><span style={{color:"#38bdf8"}}>gate</span><span style={{color:"#475569"}}>:~$ </span><span style={{color:"#64748b"}}>steer --mode=constrained</span></div>
                <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                  <span style={{color:"#a78bfa",flexShrink:0,lineHeight:"20px"}}>❯</span>
                  <textarea value={steer} onChange={e=>setSteer(e.target.value)} placeholder="e.g. ignore claim #2, focus only on peer-reviewed sources..." rows={3} autoFocus style={{flex:1,background:"transparent",border:"none",color:"#e2e8f0",fontFamily:"'DM Mono',monospace",fontSize:12,resize:"none",outline:"none",lineHeight:1.6,caretColor:"#a78bfa"}}/>
                </div>
                {!steer&&<div style={{color:"#334155",fontSize:10,marginTop:4,display:"flex",alignItems:"center",gap:4}}><span style={{opacity:blink?1:0,color:"#a78bfa"}}>▌</span><span style={{color:"#2a2a40"}}>type instruction and press Submit</span></div>}
              </div>
            </div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
          {[{label:"✓ Approve",color:"#34d399",glow:"#10B981",fn:()=>closeWith(onApprove)},{label:"↻ Steer",color:"#a78bfa",glow:"#7C3AED",fn:()=>setShow(!show)},{label:"✕ Reject",color:"#f472b6",glow:"#EC4899",fn:()=>closeWith(onReject)}].map(b=>(
            <button key={b.label} onClick={b.fn} style={{background:`${b.glow}12`,border:`1px solid ${b.glow}55`,borderRadius:9,color:b.color,padding:"10px 0",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${b.glow}22`;e.currentTarget.style.boxShadow=`0 0 14px ${b.glow}38`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${b.glow}12`;e.currentTarget.style.boxShadow="none";}}>{b.label}</button>
          ))}
        </div>
        {show&&steer&&<button onClick={()=>closeWith(()=>onSteer(steer))} style={{width:"100%",marginTop:9,background:"rgba(124,58,237,.14)",border:"1px solid rgba(124,58,237,.45)",borderRadius:9,color:"#a78bfa",padding:"10px 0",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}}>Submit Steering Instructions →</button>}
      </div>
    </div>
  );
}

// ── FinalReport (unchanged from v6) ──────────────────────────────────────────
function FinalReport({reportText,elapsed,tokenCounts,timings,agentTokens}){
  const [copied,setCopied]=useState(false);const totalMs=timings.reduce((s,t)=>s+t.duration,0);
  const copy=()=>{navigator.clipboard.writeText(reportText);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const download=()=>{const blob=new Blob([reportText],{type:"text/markdown"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="chainmind-report.md";a.click();URL.revokeObjectURL(url);};
  return (
    <div style={{background:"linear-gradient(135deg,rgba(236,72,153,.05),rgba(99,102,241,.05))",border:"1px solid rgba(236,72,153,.28)",borderRadius:16,padding:22,boxShadow:"0 0 50px rgba(236,72,153,.1)",animation:"fadeSlideIn .5s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{width:38,height:38,borderRadius:11,background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.38)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📋</div>
        <div><div style={{color:"#f472b6",fontWeight:700,fontSize:14}}>Synthesized Report</div><div style={{color:"#3a4555",fontSize:10,fontFamily:"monospace"}}>ChainMind · {elapsed}s · 6 agents</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:7}}>
          <button onClick={copy} style={{background:"rgba(236,72,153,.08)",border:"1px solid rgba(236,72,153,.25)",borderRadius:7,padding:"5px 12px",color:"#f472b6",fontSize:10,fontFamily:"monospace",cursor:"pointer"}}>{copied?"✓ Copied":"⎘ Copy"}</button>
          <button onClick={download} style={{background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.25)",borderRadius:7,padding:"5px 12px",color:"#818cf8",fontSize:10,fontFamily:"monospace",cursor:"pointer"}}>↓ Export .md</button>
        </div>
      </div>
      {(()=>{
        const lines=reportText.split("\n").map(l=>l.trim()).filter(Boolean);
        const isJunk=(l)=>l.startsWith("#")||l.startsWith("---")||l.startsWith("*")||l.startsWith("-")||l.startsWith(">")||/^[A-Z\s]{5,}:/.test(l)||/^\d+\./.test(l)||l.length<40||l.length>220;
        const candidates=lines.filter(l=>!isJunk(l));
        const keyLine=candidates.find(l=>/\d/.test(l)||/[A-Z][a-z]{3,}/.test(l))||candidates[0]||"";
        return(
          <>
            {keyLine&&(
              <div style={{marginBottom:14,padding:"14px 16px",borderRadius:12,background:"linear-gradient(135deg,rgba(236,72,153,0.08),rgba(124,58,237,0.08))",border:"1px solid rgba(236,72,153,0.3)",boxShadow:"0 0 24px rgba(236,72,153,0.08)",animation:"fadeSlideIn .5s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:3,height:3,borderRadius:"50%",background:"#f472b6",boxShadow:"0 0 6px #f472b6",animation:"breathe 1.5s infinite"}}/>
                  <span style={{color:"#f472b6",fontSize:9,fontFamily:"monospace",letterSpacing:2,fontWeight:700}}>KEY FINDING</span>
                </div>
                <div style={{color:"#f1f5f9",fontSize:13,fontWeight:600,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{keyLine}</div>
              </div>
            )}
            <div style={{background:"rgba(3,3,12,.8)",borderRadius:10,padding:18,fontFamily:"'DM Mono',monospace",fontSize:12,lineHeight:1.9,color:"#94a3b8",maxHeight:400,overflowY:"auto"}}><StreamText text={reportText} speed={6}/></div>
          </>
        );
      })()}
      <TimelineView timings={timings} totalMs={totalMs} agentTokens={agentTokens}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// v9 NEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── ProviderSelector (v9 new) ─────────────────────────────────────────────────
function ProviderSelector(){
  const [selected,setSelected]=useState("openrouter");
  const [open,setOpen]=useState(false);
  const cur=PROVIDERS.find(p=>p.key===selected);
  return(
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(8,8,26,0.9)",border:`1px solid ${cur.color}44`,borderRadius:8,padding:"6px 12px",cursor:"pointer",transition:"all .2s",boxShadow:`0 0 12px ${cur.color}18`}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:cur.color,boxShadow:`0 0 6px ${cur.color}`,animation:"breathe 1.4s infinite"}}/>
        <div>
          <div style={{color:cur.color,fontSize:10,fontWeight:700,fontFamily:"monospace",lineHeight:1}}>{cur.label}</div>
          <div style={{color:"#334155",fontSize:8,fontFamily:"monospace",lineHeight:1.4}}>{cur.desc}</div>
        </div>
        <div style={{background:`${cur.color}18`,border:`1px solid ${cur.color}44`,borderRadius:4,padding:"1px 6px",fontSize:7,color:cur.color,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>CONNECTED</div>
        <span style={{color:"#334155",fontSize:9}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"rgba(8,8,22,.98)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:6,zIndex:200,minWidth:220,backdropFilter:"blur(24px)",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"fadeSlideIn .15s ease"}}>
          <div style={{color:"#334155",fontSize:8,fontFamily:"monospace",letterSpacing:2,padding:"4px 10px 8px"}}>SELECT PROVIDER</div>
          {PROVIDERS.map(p=>(
            <button key={p.key} onClick={()=>{setSelected(p.key);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",background:selected===p.key?`${p.color}12`:"transparent",border:`1px solid ${selected===p.key?p.color+"44":"transparent"}`,borderRadius:7,padding:"7px 10px",cursor:"pointer",transition:"all .15s",marginBottom:2}} onMouseEnter={e=>{e.currentTarget.style.background=`${p.color}10`;e.currentTarget.style.borderColor=`${p.color}33`;}} onMouseLeave={e=>{e.currentTarget.style.background=selected===p.key?`${p.color}12`:"transparent";e.currentTarget.style.borderColor=selected===p.key?`${p.color}44`:"transparent";}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0,boxShadow:selected===p.key?`0 0 6px ${p.color}`:"none"}}/>
              <div style={{flex:1}}><div style={{color:p.key===selected?p.color:"#94a3b8",fontSize:10,fontFamily:"monospace",fontWeight:700,lineHeight:1}}>{p.label}</div><div style={{color:"#334155",fontSize:8,fontFamily:"monospace",lineHeight:1.4}}>{p.desc}</div></div>
              {selected===p.key&&<span style={{color:p.color,fontSize:10}}>✓</span>}
            </button>
          ))}
          <div style={{marginTop:6,padding:"6px 10px",borderTop:"1px solid rgba(255,255,255,0.04)",color:"#1e2a3a",fontSize:7,fontFamily:"monospace",lineHeight:1.5}}>Routing via OpenRouter · provider-agnostic architecture</div>
        </div>
      )}
    </div>
  );
}

// ── ProjectSelector (v9 new) ──────────────────────────────────────────────────
function ProjectSelector({onSelect,selectedId}){
  const [tab,setTab]=useState("project");
  const [customGoal,setCustomGoal]=useState("");
  const [focused,setFocused]=useState(false);
  const priorityColor=(p)=>p==="High"?"#f87171":p==="Medium"?"#fbbf24":"#34d399";
  return(
    <div style={{width:"100%",maxWidth:700}}>
      <div style={{display:"flex",gap:4,marginBottom:12,background:"rgba(8,8,26,0.9)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:4}}>
        {[{id:"project",label:"📋 Select Project"},{id:"custom",label:"✏️ Custom Goal"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 0",background:tab===t.id?"rgba(124,58,237,0.15)":"transparent",border:tab===t.id?"1px solid rgba(124,58,237,0.4)":"1px solid transparent",borderRadius:7,color:tab===t.id?"#a78bfa":"#334155",fontSize:11,fontFamily:"monospace",fontWeight:600,cursor:"pointer",transition:"all .2s"}}>{t.label}</button>
        ))}
      </div>
      {tab==="project"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {PROJECTS.map(p=>{
            const isSelected=selectedId===p.id;
            return(
              <button key={p.id} onClick={()=>onSelect(p)} style={{textAlign:"left",background:isSelected?"rgba(124,58,237,0.12)":"rgba(8,8,26,0.9)",border:`1px solid ${isSelected?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.05)"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all .2s",boxShadow:isSelected?"0 0 20px rgba(124,58,237,0.15)":"none"}} onMouseEnter={e=>{if(!isSelected){e.currentTarget.style.borderColor="rgba(124,58,237,0.3)";e.currentTarget.style.background="rgba(124,58,237,0.06)";}}} onMouseLeave={e=>{if(!isSelected){e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.background="rgba(8,8,26,0.9)";}}} >
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{color:isSelected?"#a78bfa":"#475569",fontSize:9,fontFamily:"monospace",fontWeight:700}}>{p.id}</span>
                  <span style={{background:`${priorityColor(p.priority)}18`,border:`1px solid ${priorityColor(p.priority)}44`,borderRadius:4,padding:"1px 6px",fontSize:7,color:priorityColor(p.priority),fontFamily:"monospace",fontWeight:700}}>{p.priority}</span>
                </div>
                <div style={{color:isSelected?"#f1f5f9":"#94a3b8",fontSize:11,fontWeight:700,marginBottom:4,fontFamily:"monospace"}}>{p.name}</div>
                <div style={{color:"#334155",fontSize:9,fontFamily:"monospace",lineHeight:1.5,marginBottom:6}}>{p.desc}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:4}}>
                  {p.skills.map(s=>(<span key={s} style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:3,padding:"1px 5px",fontSize:7,color:"#818cf8",fontFamily:"monospace"}}>{s}</span>))}
                </div>
                <div style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace"}}>⏱ {p.deadline} days deadline</div>
              </button>
            );
          })}
        </div>
      )}
      {tab==="custom"&&(
        <div style={{position:"relative",borderRadius:14,overflow:"hidden",border:`1px solid ${focused?"#7C3AED88":"rgba(255,255,255,0.05)"}`,boxShadow:focused?"0 0 32px rgba(124,58,237,.18)":"none",transition:"all .3s",backdropFilter:"blur(20px)"}}>
          <textarea value={customGoal} onChange={e=>{setCustomGoal(e.target.value);onSelect({id:"custom",name:"Custom Goal",desc:e.target.value,skills:[],deadline:0,priority:"Medium"});}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="Describe your project goal… e.g. 'Build a recommendation engine for our e-commerce platform'" rows={4} style={{width:"100%",background:"rgba(6,6,18,.97)",border:"none",padding:"16px 18px",color:"#e2e8f0",fontFamily:"'DM Mono',monospace",fontSize:13,lineHeight:1.7,resize:"none",outline:"none",boxSizing:"border-box"}}/>
        </div>
      )}
    </div>
  );
}

// ── EmployeeSidebar (v9 new) ──────────────────────────────────────────────────
function EmployeeSidebar({open,onClose,assignments}){
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:299,background:"rgba(0,0,0,0.3)"}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:320,zIndex:300,background:"rgba(6,6,18,0.98)",borderLeft:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(24px)",transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",boxShadow:open?"-8px 0 40px rgba(0,0,0,0.5)":"none"}}>
        <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div><div style={{color:"#f1f5f9",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>👥 Team</div><div style={{color:"#334155",fontSize:9,fontFamily:"monospace",letterSpacing:1,marginTop:2}}>{EMPLOYEES.length} MEMBERS</div></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,width:28,height:28,color:"#475569",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"10px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",flexShrink:0}}>
          <div style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace",letterSpacing:2,marginBottom:6}}>PAST PROJECTS</div>
          {HISTORY_DATA.map(h=>(
            <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,padding:"5px 8px",borderRadius:6,background:"rgba(0,0,0,0.3)"}}>
              <div style={{flex:1}}><div style={{color:"#475569",fontSize:9,fontFamily:"monospace",fontWeight:700}}>{h.name}</div><div style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace"}}>{h.days} days · {h.teamSize} members</div></div>
              <div style={{color:h.score>=0.92?"#34d399":"#fbbf24",fontSize:10,fontFamily:"monospace",fontWeight:700}}>{Math.round(h.score*100)}%</div>
            </div>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 18px"}}>
          <div style={{color:"#1e2a3a",fontSize:8,fontFamily:"monospace",letterSpacing:2,marginBottom:8}}>EMPLOYEES</div>
          {EMPLOYEES.map(emp=>{
            const assigned=assignments?.[emp.id];
            const workloadColor=emp.workload>=55?"#f87171":emp.workload>=45?"#fbbf24":"#34d399";
            return(
              <div key={emp.id} style={{marginBottom:10,padding:"11px 12px",borderRadius:10,background:assigned?"rgba(124,58,237,0.08)":"rgba(8,8,26,0.8)",border:`1px solid ${assigned?emp.color+"55":"rgba(255,255,255,0.05)"}`,transition:"all .3s",boxShadow:assigned?`0 0 14px ${emp.color}22`:"none",animation:assigned?"fadeSlideIn .4s ease":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <div style={{width:28,height:28,borderRadius:8,background:`${emp.color}18`,border:`1px solid ${emp.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:emp.color,flexShrink:0,fontFamily:"monospace"}}>{emp.name.split(" ").map(n=>n[0]).join("")}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{color:assigned?emp.color:"#94a3b8",fontSize:10,fontWeight:700,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{emp.name}</div><div style={{color:"#334155",fontSize:8,fontFamily:"monospace"}}>{emp.role}</div></div>
                  <div style={{color:workloadColor,fontSize:9,fontFamily:"monospace",fontWeight:700,flexShrink:0}}>{emp.workload}%</div>
                </div>
                <div style={{height:3,background:"#0a0a18",borderRadius:2,marginBottom:7,overflow:"hidden"}}><div style={{height:"100%",width:`${emp.workload}%`,background:`linear-gradient(90deg,${workloadColor}88,${workloadColor})`,borderRadius:2,transition:"width .6s ease"}}/></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:assigned?6:0}}>
                  {emp.skills.map(s=>(<span key={s} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:3,padding:"1px 5px",fontSize:7,color:"#334155",fontFamily:"monospace"}}>{s}</span>))}
                </div>
                {assigned&&<div style={{marginTop:4,padding:"4px 8px",borderRadius:5,background:`${emp.color}12`,border:`1px solid ${emp.color}33`,fontSize:8,color:emp.color,fontFamily:"monospace",lineHeight:1.4,animation:"fadeSlideIn .3s ease"}}>▸ {assigned}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Landing (v9: updated with ProjectSelector, ProviderSelector, sidebar toggle) ──
function Landing({onStart,apiConfigured,history,selectedProject,onSelectProject,onToggleSidebar,assignments}){
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",marginBottom:36,animation:"fadeSlideIn .6s ease",width:"100%",maxWidth:700}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,rgba(124,58,237,.28),rgba(14,165,233,.28))",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 0 48px rgba(124,58,237,.38)",animation:"float 3s ease-in-out infinite",backdropFilter:"blur(20px)"}}>⛓</div>
            <div style={{textAlign:"left"}}>
              <div style={{color:"#f1f5f9",fontWeight:800,fontSize:28,letterSpacing:"-1px"}}>ChainMind</div>
              <div style={{color:"#1e2a3a",fontSize:11,fontFamily:"monospace",letterSpacing:2}}>MULTI-AGENT ORCHESTRATION FRAMEWORK</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={onToggleSidebar} style={{display:"flex",alignItems:"center",gap:7,background:"rgba(8,8,26,0.9)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#475569",fontSize:11,fontFamily:"monospace",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#7C3AED55";e.currentTarget.style.color="#94a3b8";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.color="#475569";}}>
              👥 Team <span style={{background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:10,padding:"1px 6px",color:"#a78bfa",fontSize:9,marginLeft:2}}>{EMPLOYEES.length}</span>
            </button>
            <ProviderSelector/>
          </div>
        </div>
        <div style={{fontSize:38,fontWeight:800,color:"#f1f5f9",letterSpacing:"-2px",lineHeight:1.08,marginBottom:14}}>
          The only agent system<br/>that <span style={{background:"linear-gradient(135deg,#fbbf24,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>stops and asks you</span><br/>before it's too late.
        </div>
        <div style={{color:"#2a3a4a",fontSize:13,fontFamily:"'DM Mono',monospace",maxWidth:500,margin:"0 auto",lineHeight:1.9}}>
          Every other pipeline is a black box. ChainMind has a<br/>
          <span style={{color:"#fbbf24"}}>Conditional Approval Gate</span> — a hard stop where a human<br/>
          reviews confidence scores, steers the output, or kills the run.
        </div>
      </div>
      <div style={{marginBottom:36,animation:"fadeSlideIn .7s ease",width:"100%",maxWidth:700,display:"flex",justifyContent:"center"}}><MiniPreview/></div>
      {!apiConfigured&&<div style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.25)",borderRadius:10,padding:"10px 16px",marginBottom:18,maxWidth:700,width:"100%",fontSize:11,fontFamily:"monospace",color:"#fbbf24"}}>⚠ Add VITE_OPENROUTER_KEY to .env to enable real AI responses</div>}
      {apiConfigured&&<div style={{background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.25)",borderRadius:10,padding:"9px 16px",marginBottom:18,maxWidth:700,width:"100%",fontSize:11,fontFamily:"monospace",color:"#34d399"}}>✓ OpenRouter connected · Real AI enabled</div>}
      <div style={{width:"100%",maxWidth:700,animation:"fadeSlideIn .8s ease"}}>
        <GoalHistory history={history} onSelect={goal=>onSelectProject({id:"custom",name:"Custom Goal",desc:goal,skills:[],deadline:0,priority:"Medium"})}/>
        <ProjectSelector onSelect={onSelectProject} selectedId={selectedProject?.id}/>
        <div style={{marginTop:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {SAMPLE_GOALS.slice(0,2).map((sg,i)=>(
              <button key={i} onClick={()=>onSelectProject({id:"custom",name:"Custom Goal",desc:sg,skills:[],deadline:0,priority:"Medium"})} style={{background:"rgba(8,8,20,.85)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:8,padding:"5px 12px",color:"#2a3a4a",fontSize:10,fontFamily:"monospace",cursor:"pointer",backdropFilter:"blur(8px)",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#7C3AED55";e.currentTarget.style.color="#94a3b8";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.04)";e.currentTarget.style.color="#2a3a4a";}}>
                {sg.substring(0,42)}…
              </button>
            ))}
          </div>
          {selectedProject&&(
            <button onClick={onStart} style={{background:"linear-gradient(135deg,#7C3AED,#0EA5E9)",border:"none",borderRadius:9,color:"#fff",padding:"10px 24px",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:"0 0 22px rgba(124,58,237,.48)",animation:"fadeIn .2s ease",whiteSpace:"nowrap",flexShrink:0}}>▶ Execute</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP — v9
// ═══════════════════════════════════════════════════════════════════════════════
export default function ChainMind(){
  // ── All v6 state ──────────────────────────────────────────────────────────
  const [goal,setGoal]=useState("");
  const [phase,setPhase]=useState("idle");
  const [steps,setSteps]=useState([]);
  const [curIdx,setCurIdx]=useState(-1);
  const [progress,setProgress]=useState(0);
  const [trace,setTrace]=useState([]);
  const [mem,setMem]=useState([]);
  const [mcp,setMcp]=useState([]);
  const [mcpPulsing,setMcpPulsing]=useState([]);
  const [activeModel,setActiveModel]=useState(null);
  const [mStats,setMStats]=useState({slm:0,mid:0,frontier:0});
  const [gate,setGate]=useState(null);
  const [guard,setGuard]=useState(null);
  const [elapsed,setElapsed]=useState(0);
  const [reportText,setReportText]=useState("");
  const [outputs,setOutputs]=useState({});
  const [error,setError]=useState(null);
  const [tokenCounts,setTokenCounts]=useState({slm:0,mid:0,frontier:0});
  const [agentTokens,setAgentTokens]=useState({});
  const [timings,setTimings]=useState([]);
  const [history,setHistory]=useState([]);
  const [hoveredAgent,setHoveredAgent]=useState(null);

  // ── v9 new state ──────────────────────────────────────────────────────────
  const [selectedProject,setSelectedProject]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [assignments,setAssignments]=useState({});

  const t0=useRef(null),live=useRef(false),steerRef=useRef(null);
  const gridRef=useRef(null),agentCardRefs=useRef({}),traceRef=useRef(null),memRef=useRef(null);
  const apiConfigured=!!import.meta.env.VITE_OPENROUTER_KEY;

  // ── Build effective goal from selected project (v9) ───────────────────────
  function buildGoal(project){
    if(!project||project.id==="custom") return project?.desc||"";
    const empSummary=EMPLOYEES.map(e=>`${e.name} (${e.role}, Skills: ${e.skills.join(", ")}, Workload: ${e.workload}%, Experience: ${e.experience}yr)`).join("\n");
    const histSummary=HISTORY_DATA.map(h=>`${h.name}: ${h.teamSize} members, ${h.days} days, success score ${h.score}`).join("\n");
    return `PROJECT: ${project.name}\nDESCRIPTION: ${project.desc}\nREQUIRED SKILLS: ${project.skills.join(", ")}\nDEADLINE: ${project.deadline} days\nPRIORITY: ${project.priority}\n\nTEAM MEMBERS:\n${empSummary}\n\nPAST PROJECT HISTORY:\n${histSummary}\n\nAnalyse the project requirements, decompose into sub-tasks, and assign each sub-task to the most appropriate team member based on their skills and current workload.`;
  }

  // ── Parse employee assignments from final report (v9) ────────────────────
  function parseAssignments(reportTxt){
    const result={};
    EMPLOYEES.forEach(emp=>{
      const firstName=emp.name.split(" ")[0];
      const lines=reportTxt.split("\n").filter(l=>l.includes(firstName)||l.includes(emp.name));
      if(lines.length>0){
        const task=lines[0].replace(emp.name,"").replace(firstName,"").replace(/^[:\-–\s*#]+/,"").substring(0,80).trim();
        if(task.length>10) result[emp.id]=task;
      }
    });
    return result;
  }

  const log=useCallback((agent,msg,model=null)=>{setTrace(p=>[...p,{agent,msg,model,ts:Date.now()}]);},[]);
  const setStepStatus=useCallback((idx,status)=>{setSteps(p=>p.map((s,i)=>i===idx?{...s,status}:s));},[]);
  const startProgressTick=useCallback((expectedMs)=>{setProgress(0);let tick=0,total=expectedMs/60;const t=setInterval(()=>{tick++;setProgress(Math.min(90,Math.round((tick/total)*100)));if(tick>=total)clearInterval(t);},60);return t;},[]);

  const runPipeline=useCallback(async(currentGoal,steerNote=null)=>{
    const out={...outputs};steerRef.current=steerNote;
    const runAgent=async(idx)=>{
      if(!live.current)return;
      const step=WORKFLOW[idx],agentStart=Date.now();
      setCurIdx(idx);setActiveModel(step.model);setMStats(p=>({...p,[step.model]:(p[step.model]||0)+1}));setStepStatus(idx,"active");log(step.agent,`Starting: ${step.task}`,step.model);
      const agTools=AGENT_TOOLS[step.agent]||{call:[],passive:[]};
      setMcpPulsing(agTools.call);
      setMcp(p=>[...new Set([...p,...agTools.call,...agTools.passive])]);
      setTimeout(()=>setMcpPulsing([]),1800);
      const ticker=startProgressTick([2500,4000,2000,3000,1500,4000][idx]);
      try{
        let result="";
        if(idx===0){result=await runPlanner(currentGoal);out.planner=result;}
        else if(idx===1){result=await runResearch(currentGoal,out.planner||"");out.research=result;}
        else if(idx===2){result=await runExecution(currentGoal,out.planner||"",out.research||"");out.execution=result;}
        else if(idx===3){result=await runVerification(currentGoal,out.research||"",out.execution||"");out.verification=result;}
        else if(idx===4){const allPrev=JSON.stringify({planner:out.planner,research:out.research,execution:out.execution,verification:out.verification});result=await runMemory(currentGoal,allPrev);out.memory=result;setMem(parseMemoryEntries(result));}
        else if(idx===5){
          result=await runReport(currentGoal,out.planner||"",out.research||"",out.execution||"",out.verification||"",steerRef.current);
          out.report=result;setReportText(result);
          // v9: parse assignments and auto-open sidebar
          const parsed=parseAssignments(result);
          setAssignments(parsed);
          if(Object.keys(parsed).length>0) setTimeout(()=>setSidebarOpen(true),800);
        }
        clearInterval(ticker);setProgress(100);setOutputs({...out});
        const estTokens=Math.round(result.length/4)+step.expectedTokens;
        setTokenCounts(p=>({...p,[step.model]:(p[step.model]||0)+estTokens}));
        setAgentTokens(p=>({...p,[step.agent]:estTokens}));
        const duration=Date.now()-agentStart;
        setTimings(p=>[...p,{agent:step.agent,start:agentStart-t0.current,duration}]);
        if(idx===0)setMem(p=>[...p,{tier:0,text:`Active task: ${currentGoal.substring(0,50)}…`}]);
        if(idx===1)setMem(p=>[...p,{tier:1,text:"Domain knowledge retrieved via Tavily search"}]);
        log(step.agent,`✓ Completed (${Math.round(duration/1000)}s)`,step.model);
        setTimeout(()=>setProgress(0),300);
        if(idx===3){
          const score=parseConfidenceScore(result);
          const forceGate=true; // always show gate in demo
          if(forceGate||shouldTriggerGate(result)){
            setStepStatus(idx,"gate");
            log("verification",`⚠ Confidence ${score}/100 — Gate triggered — human review required`,"mid");
            setGate({idx,verificationOutput:result,score});
            setPhase("gate");
            return "gate";
          }
        }
        setStepStatus(idx,"done");return"ok";
      }catch(err){
        clearInterval(ticker);setProgress(0);setStepStatus(idx,"error");
        log(step.agent,`✕ Error: ${err.message}`,step.model);
        setError(`Agent ${step.agent} failed: ${err.message}`);
        return"error";
      }
    };
    const startIdx=gate?gate.idx+1:0;
    for(let i=startIdx;i<WORKFLOW.length;i++){
      if(!live.current)break;
      const result=await runAgent(i);
      if(result==="gate"||result==="error")return;
      await new Promise(r=>setTimeout(r,250));
    }
    if(live.current){setPhase("done");setCurIdx(-1);setElapsed(Math.round((Date.now()-t0.current)/1000));log("report","✓ Workflow complete — final report synthesized","frontier");}
  },[outputs,gate,log,setStepStatus,startProgressTick]);

  const startRun=useCallback(()=>{
    if(!selectedProject)return;
    const effectiveGoal=buildGoal(selectedProject);
    if(!effectiveGoal.trim())return;
    live.current=true;t0.current=Date.now();
    setGoal(effectiveGoal);
    setAssignments({});setSidebarOpen(false);
    setSteps(WORKFLOW.map(s=>({...s,status:"pending"})));
    setPhase("running");setTrace([]);setMem([]);setMcp([]);setMcpPulsing([]);
    setMStats({slm:0,mid:0,frontier:0});setActiveModel(null);setCurIdx(-1);setProgress(0);
    setGuard(null);setError(null);setOutputs({});setReportText("");
    setTokenCounts({slm:0,mid:0,frontier:0});setAgentTokens({});setTimings([]);
    const displayGoal=selectedProject.id==="custom"?selectedProject.desc:selectedProject.name;
    setHistory(p=>[displayGoal,...p.filter(h=>h!==displayGoal)].slice(0,5));
    log("planner","ChainMind initialised — goal received","frontier");
    log("planner",`Decomposing: "${displayGoal.substring(0,60)}…"`,"frontier");
    runPipeline(effectiveGoal);
  },[selectedProject,log,runPipeline]);

  const handleApprove=useCallback(()=>{const g=gate;setGate(null);setPhase("running");setStepStatus(g.idx,"done");log("verification","✓ Approved — continuing","mid");runPipeline(goal,steerRef.current);},[gate,goal,log,setStepStatus,runPipeline]);
  const handleReject=useCallback(()=>{live.current=false;setGate(null);setPhase("done");setStepStatus(gate.idx,"done");setElapsed(Math.round((Date.now()-t0.current)/1000));log("verification","✕ Rejected — terminated","mid");setReportText("Workflow terminated at Verification Gate.\n\nThe Verification Agent flagged low-confidence claims not approved for synthesis.");},[gate,log,setStepStatus]);
  const handleSteer=useCallback((note)=>{const g=gate;steerRef.current=note;setGate(null);setPhase("running");setStepStatus(g.idx,"done");log("planner",`↻ Steering: "${note.substring(0,60)}…"`,"frontier");log("verification","Re-running with steering constraints","mid");runPipeline(goal,note);},[gate,goal,log,setStepStatus,runPipeline]);

  const reset=()=>{
    live.current=false;
    setPhase("idle");setSteps([]);setCurIdx(-1);setTrace([]);setMem([]);setMcp([]);
    setMStats({slm:0,mid:0,frontier:0});setGate(null);setGuard(null);setProgress(0);
    setGoal("");setOutputs({});setReportText("");setError(null);setMcpPulsing([]);
    setTokenCounts({slm:0,mid:0,frontier:0});setAgentTokens({});setTimings([]);
    setAssignments({});setSidebarOpen(false);
  };

  useEffect(()=>{
    const h=(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"&&phase==="idle"&&selectedProject)startRun();};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[phase,selectedProject,startRun]);

  const totalCost=Object.entries(tokenCounts).reduce((s,[tier,tok])=>s+(tok*(MODEL_TIERS[tier]?.costPer1k||0)/1000),0);
  const activeAgentKey=curIdx>=0?WORKFLOW[curIdx]?.agent:null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#04040e;overflow-x:hidden;}
        *{scrollbar-width:thin;scrollbar-color:transparent transparent;}
        *:hover{scrollbar-color:#3730a3 transparent;}
        ::-webkit-scrollbar{width:2px;height:2px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:transparent;border-radius:2px;}
        *:hover::-webkit-scrollbar-thumb{background:#3730a3;}
        textarea{caret-color:#7C3AED;}
        @keyframes fadeIn      {from{opacity:0}to{opacity:1}}
        @keyframes fadeSlideIn {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink       {0%,100%{opacity:1}50%{opacity:0}}
        @keyframes breathe     {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.65;transform:scale(.96)}}
        @keyframes pulse       {0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes scanline    {0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes shimmer     {0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes float       {0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes ripple      {0%{opacity:0.8;transform:scale(1)}100%{opacity:0;transform:scale(1.4)}}
      `}</style>

      <div style={{minHeight:"100vh",background:"#04040e",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
        <ParticleCanvas/>

        {/* Employee Sidebar — always rendered so slide animation works */}
        <EmployeeSidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} assignments={assignments}/>

        {/* LANDING */}
        {phase==="idle"&&(
          <Landing
            onStart={startRun}
            apiConfigured={apiConfigured}
            history={history}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onToggleSidebar={()=>setSidebarOpen(o=>!o)}
            assignments={assignments}
          />
        )}

        {/* RUNNING / DONE */}
        {phase!=="idle"&&(
          <div style={{position:"relative",zIndex:1}}>
            {/* Header */}
            <div style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 26px",display:"flex",alignItems:"center",gap:12,background:"rgba(3,3,12,.82)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 0 rgba(255,255,255,0.04),0 4px 24px rgba(0,0,0,.4)"}}>
              <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,rgba(124,58,237,.35),rgba(14,165,233,.35))",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,backdropFilter:"blur(20px)"}}>⛓</div>
              <div style={{fontWeight:800,fontSize:15,letterSpacing:"-.5px"}}>ChainMind</div>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 12px",borderRadius:20,background:phase==="done"?"rgba(52,211,153,.08)":phase==="gate"?"rgba(245,158,11,.08)":error?"rgba(244,114,182,.08)":"rgba(124,58,237,.08)",border:`1px solid ${phase==="done"?"rgba(52,211,153,.2)":phase==="gate"?"rgba(245,158,11,.2)":error?"rgba(244,114,182,.2)":"rgba(124,58,237,.2)"}`}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:phase==="done"?"#34d399":phase==="gate"?"#fbbf24":error?"#f472b6":"#a78bfa",animation:phase==="running"?"breathe 1s infinite":"none"}}/>
                <span style={{color:phase==="done"?"#34d399":phase==="gate"?"#fbbf24":error?"#f472b6":"#a78bfa",fontSize:11,fontFamily:"monospace",fontWeight:600}}>{phase==="running"?"Calling AI agents…":phase==="gate"?"Gate — Input Required":error?"Error":`Done · ${elapsed}s`}</span>
              </div>
              {(phase==="running"||phase==="done")&&(
                <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:20,background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.15)"}}>
                  <span style={{color:"#34d399",fontSize:11,fontFamily:"monospace",fontWeight:700}}>💰 ${totalCost.toFixed(4)}</span>
                  {phase==="running"&&<span style={{color:"#1a3a2a",fontSize:9,animation:"blink 1s infinite"}}>●</span>}
                </div>
              )}
              {/* v9: show project name in header */}
              <div style={{color:"#1e2a3a",fontSize:10,fontFamily:"monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {selectedProject&&selectedProject.id!=="custom"
                  ?<><span style={{color:"#475569"}}>{selectedProject.id}</span><span style={{color:"#1e2a3a"}}> · {selectedProject.name}</span></>
                  :`"${goal.substring(0,60)}…"`
                }
              </div>
              {/* v9: Team button in header */}
              <button onClick={()=>setSidebarOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:7,color:"#a78bfa",padding:"5px 12px",cursor:"pointer",fontFamily:"monospace",fontSize:10,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(124,58,237,0.08)";}}>
                👥 Team <span style={{background:"rgba(124,58,237,0.2)",borderRadius:10,padding:"1px 6px",fontSize:8,marginLeft:2}}>{EMPLOYEES.length}</span>
              </button>
              <ProviderSelector/>
              <button onClick={reset} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:7,color:"#3a4555",padding:"5px 12px",cursor:"pointer",fontFamily:"monospace",fontSize:10,transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#94a3b8"} onMouseLeave={e=>e.currentTarget.style.color="#3a4555"}>↺ Reset</button>
            </div>

            <div style={{padding:"20px 26px"}}>
              {guard&&<div style={{background:"rgba(236,72,153,.05)",border:"1px solid rgba(236,72,153,.2)",borderRadius:9,padding:"9px 14px",marginBottom:16,color:"#f472b6",fontSize:11,fontFamily:"monospace",animation:"fadeSlideIn .3s ease"}}>{guard}</div>}
              {error&&<div style={{background:"rgba(244,114,182,.05)",border:"1px solid rgba(244,114,182,.2)",borderRadius:9,padding:"9px 14px",marginBottom:16,color:"#f472b6",fontSize:11,fontFamily:"monospace",animation:"fadeSlideIn .3s ease"}}>✕ {error}</div>}

              <div ref={gridRef} style={{display:"grid",gridTemplateColumns:"1fr 1.1fr 1fr",gap:16,position:"relative"}}>
                <DataFlowOverlay containerRef={gridRef} activeAgent={activeAgentKey} phase={phase} agentCardRefs={agentCardRefs} traceRef={traceRef} memRef={memRef}/>

                {/* LEFT — Agent pipeline */}
                <div style={{position:"relative",zIndex:2}}>
                  <div style={{color:"#1a2030",fontSize:10,letterSpacing:2,marginBottom:9,fontFamily:"monospace"}}>AGENT PIPELINE</div>
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {steps.length===0
                      ?WORKFLOW.map((_,i)=><SkeletonCard key={i} index={i} agent={WORKFLOW[i].agent}/>)
                      :steps.map((s,i)=>s.status==="pending"&&curIdx===-1
                        ?<SkeletonCard key={i} index={i} agent={s.agent}/>
                        :<div key={i} ref={el=>agentCardRefs.current[s.agent]=el}><AgentCard index={i} agent={s.agent} status={s.status} task={s.task} model={s.model} isActive={i===curIdx} progress={i===curIdx?progress:0} realOutput={outputs[s.agent]} tokenCount={agentTokens[s.agent]||0} onHover={setHoveredAgent}/></div>
                      )
                    }
                  </div>
                </div>

                {/* MIDDLE — Thought trace + MCP */}
                <div style={{display:"flex",flexDirection:"column",gap:13,position:"relative",zIndex:2}}>
                  <div>
                    <div style={{color:"#1a2030",fontSize:10,letterSpacing:2,marginBottom:9,fontFamily:"monospace"}}>VISUAL WORKFLOW INTERFACE</div>
                    <div ref={traceRef}><ThoughtTrace entries={trace} isRunning={phase==="running"} hoveredAgent={hoveredAgent}/></div>
                  </div>
                  <MCPPanel active={mcp} pulsing={mcpPulsing} activeAgent={activeAgentKey}/>
                </div>

                {/* RIGHT — Memory + Routing */}
                <div style={{display:"flex",flexDirection:"column",gap:13,position:"relative",zIndex:2}}>
                  <div style={{color:"#1a2030",fontSize:10,letterSpacing:2,marginBottom:9,fontFamily:"monospace"}}>MEMORY + ROUTING</div>
                  <RightPanel entries={mem} activeModel={activeModel} stats={mStats} tokenCounts={tokenCounts} isRunning={phase==="running"} memRef={memRef} agentTokens={agentTokens}/>
                </div>
              </div>

              {phase==="done"&&reportText&&(
                <div style={{marginTop:20}}>
                  <div style={{color:"#1a2030",fontSize:10,letterSpacing:2,marginBottom:9,fontFamily:"monospace"}}>SYNTHESIZED OUTPUT</div>
                  <FinalReport reportText={reportText} elapsed={elapsed} tokenCounts={tokenCounts} timings={timings} agentTokens={agentTokens}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gate overlay */}
        {phase==="gate"&&gate&&(
          <ApprovalGate verificationOutput={gate.verificationOutput} score={gate.score} onApprove={handleApprove} onReject={handleReject} onSteer={handleSteer}/>
        )}
      </div>
    </>
  );
}