// Reference design-fixture checks only; this does not exercise the unimplemented v2 runtime.
// Run from the repository root: node evaluation/laya-training/two-stage-contract-2026-10-10/verify-design.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const base = "evaluation/laya-training/";
const read = p => JSON.parse(fs.readFileSync(base+p,"utf8"));
const fixture = read("two-stage-contract-2026-10-10/screening-context-fixtures.json");
const vocab = {relevance:["relevant","irrelevant"],scope:["role","question","historical","company","other-role","none"],sponsorship:["available","unavailable","conditional","unclear"],timing:["now","future","now-and-future","unspecified"],cpt:["explicitly-accepted","explicitly-excluded","unclear"],opt:["explicitly-accepted","explicitly-excluded","unclear"]};
const coverage = Object.fromEntries(Object.keys(vocab).map(k=>[k,new Set()]));
assert.equal(new Set(fixture.records.map(r=>r.id)).size,fixture.records.length);
let wtwMatches=0;
const wtw=read("live-job-tests/wtw-202605435/request.json");
for(const r of fixture.records){
  for(const [k,values] of Object.entries(vocab)){assert(values.includes(r.gold[k]),r.id+":"+k);coverage[k].add(r.gold[k]);}
  if(r.gold.scope!=="role"){for(const k of ["sponsorship","cpt","opt"])assert.equal(r.gold[k],"unclear");assert.equal(r.gold.timing,"unspecified");}
  if(r.target.kind==="application-question")assert.equal(r.gold.scope,"question");
  for(const [side,delta] of [["previous",-1],["next",1]]){
    const n=r.context[side],s=r.context[side+"Status"];
    assert(["present","boundary","missing"].includes(s));
    if(s==="present"){assert(n);assert.equal(n.contextGroup,r.target.contextGroup);assert.equal(n.position,r.target.position+delta);}
    else assert.equal(n,null);
  }
  if(r.target.id.startsWith("wtw-")){
    const index=wtw.blocks.findIndex(b=>b.id===r.target.id);assert(index>=0);
    assert.equal(r.target.position,index);assert.equal(r.target.text,wtw.blocks[index].text);
    for(const [side,delta] of [["previous",-1],["next",1]]){assert.equal(r.context[side].id,wtw.blocks[index+delta].id);assert.equal(r.context[side].text,wtw.blocks[index+delta].text);}
    wtwMatches++;
  }
}
for(const [k,values]of Object.entries(vocab))assert.deepEqual([...coverage[k]].sort(),[...values].sort());
for(const r of fixture.reviewChallenges){assert(!r.gold || r.gold===null,"unresolved challenge must not invent gold");}
function derive(q,b,delta){
  const g=q.contextGroups.find(g=>g.id===b.contextGroup);
  const n=q.blocks.find(n=>n.contextGroup===b.contextGroup && n.position===b.position+delta);
  if(n)return {status:"present",position:n.position};
  const outside=delta<0?b.position===g.firstPosition:b.position===g.lastPosition;
  return {status:outside?(delta<0?g.start:g.end):"missing",position:null};
}
for(const c of fixture.contextDerivationCases){
 const q=c.group?{contextGroups:[c.group],blocks:c.receivedPositions.map(position=>({contextGroup:c.group.id,position}))}:{contextGroups:c.groups,blocks:c.received};
 const b=c.group?{contextGroup:c.group.id,position:c.targetPosition}:c.target;
 for(const[side,delta]of[["previous",-1],["next",1]]){const d=derive(q,b,delta);assert.equal(d.status,c.expected[side+"Status"]);assert.equal(d.position,c.expected[side+"Position"]);}
}
const transport=read("two-stage-contract-2026-10-10/transport-fixtures.json");
function check({request:q,result:r}){
 assert.equal(q.version,"laya-policy-v2");assert.equal(r.version,q.version);assert.equal(r.engine,"laya");
 assert(q.title && q.title.length<=500);
 assert.equal(new Set(q.blocks.map(b=>b.id)).size,q.blocks.length);
 assert.equal(new Set(q.contextGroups.map(g=>g.id)).size,q.contextGroups.length);
 for(const g of q.contextGroups){assert(q.blocks.some(b=>b.contextGroup===g.id));assert(Number.isInteger(g.firstPosition)&&Number.isInteger(g.lastPosition)&&g.firstPosition>=0&&g.firstPosition<=g.lastPosition);assert(["boundary","missing"].includes(g.start)&&["boundary","missing"].includes(g.end));}
 const positions=new Set();
 for(const b of q.blocks){const g=q.contextGroups.find(g=>g.id===b.contextGroup);assert(g);assert(Number.isInteger(b.position)&&b.position>=g.firstPosition&&b.position<=g.lastPosition);const p=b.contextGroup+":"+b.position;assert(!positions.has(p));positions.add(p);}
 assert.deepEqual(r.blocks.map(b=>b.id),q.blocks.map(b=>b.id));
 assert(r.model && r.model.length<=250);
 for(const k of ["questionsSha256","contextSha256","parametersSha256"])assert(/^[0-9a-f]{64}$/.test(r.configuration[k]));
 const context={complete:0,missing:0},screening={success:0,failed:0,unsupported:0},interpretation={interpreted:0,skipped:0,failed:0,unsupported:0};
 for(let i=0;i<r.blocks.length;i++){
   const b=r.blocks[i],s=b.screening,t=b.interpretation;
   const missing=[-1,1].some(delta=>derive(q,q.blocks[i],delta).status==="missing");
   context[missing?"missing":"complete"]++;
   assert(s.status in screening);screening[s.status]++;assert(t.status in interpretation);interpretation[t.status]++;
   assert(["relevant","uncertain","skip"].includes(b.route));
   if(s.status==="success"){assert(["relevant","irrelevant"].includes(s.choice));assert(Number.isFinite(s.probability)&&s.probability>=0&&s.probability<=1);assert(!missing);
     if(b.route==="skip"){assert.equal(s.choice,"irrelevant");assert.equal(t.status,"skipped");assert.equal(t.reason,"screened-irrelevant");}
     else {assert.notEqual(t.status,"skipped");if(b.route==="relevant")assert.equal(s.choice,"relevant");}
   }else{assert(!("choice" in s)&&!("probability" in s));assert.equal(b.route,"uncertain");assert.equal(t.status,s.status);assert.equal(t.reason,s.status==="failed"?"screening-failed":"screening-unsupported");if(missing){assert.equal(s.status,"unsupported");assert.equal(s.reason,"missing-context");}}
   if(t.status==="interpreted"){assert.equal(s.status,"success");assert.deepEqual(Object.keys(t.answers).sort(),Object.keys(vocab).filter(k=>k!=="relevance").sort());for(const[k,a]of Object.entries(t.answers)){assert(vocab[k].includes(a.choice));assert(Number.isFinite(a.probability)&&a.probability>=0&&a.probability<=1);}}
   else{assert(!("answers"in t)&&!("probability"in t)&&!("choice"in t));assert(t.reason);}
 }
 const status=context.missing||screening.failed||screening.unsupported||interpretation.failed||interpretation.unsupported?"partial":"complete";
 assert.deepEqual(r.processing,{status,inputCount:q.blocks.length,context,screening,interpretation});
}
for(const f of transport.valid)check(f);
for(const m of transport.invalidMutations){
 const f=structuredClone(transport.valid.find(f=>f.id===m.base));assert(f);
 const {request:q,result:r}=f;
 switch(m.id){
 case "missing-id":r.blocks.splice(1,1);break;
 case "duplicate-id":r.blocks[2].id="b2";break;
 case "unexpected-id":r.blocks[1].id="unknown";break;
 case "out-of-order":[r.blocks[0],r.blocks[1]]=[r.blocks[1],r.blocks[0]];break;
 case "answers-on-skip":r.blocks[0].interpretation.answers={};break;
 case "missing-answer":delete r.blocks[1].interpretation.answers.opt;break;
 case "invented-probability":r.blocks[0].screening.probability=1;break;
 case "invalid-probability":r.blocks[1].interpretation.answers.sponsorship.probability=1.1;break;
 case "skip-relevant":r.blocks[0].screening.choice="relevant";break;
 case "partial-marked-complete":r.processing.status="complete";break;
 case "bad-counts":r.processing.interpretation.skipped=0;break;
 case "bad-context-counts":r.processing.context.missing=0;break;
 case "missing-configuration-digest":delete r.configuration.contextSha256;break;
 case "bad-configuration-digest":r.configuration.parametersSha256="A".repeat(64);break;
 case "missing-context-group":q.contextGroups=q.contextGroups.filter(g=>g.id!=="application-0");break;
 case "unused-context-group":q.contextGroups.push({id:"unused",firstPosition:0,lastPosition:0,start:"boundary",end:"boundary"});break;
 case "duplicate-position":q.blocks[1].position=0;break;
 case "position-outside-group":q.blocks[1].position=2;break;
 default:throw new Error("unhandled mutation "+m.id);
 }
 assert.throws(()=>check(f),m.id);
}
const summary={screeningFixtures:fixture.records.length,labelCoverage:"all declared labels",reviewChallenges:fixture.reviewChallenges.length,contextDerivationCases:fixture.contextDerivationCases.length,exactWtwMatches:wtwMatches,validTransportFixtures:transport.valid.length,rejectedReferenceMutations:transport.invalidMutations.length};
console.log(JSON.stringify(summary));
