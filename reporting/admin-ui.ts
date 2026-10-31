export const adminHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SNS private inbox</title><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script><main>
<h1>SNS private inbox</h1><p>Reports are unverified claims. Confirm public evidence before creating a sanitized issue.</p><p id="message" role="status" tabindex="-1"></p>
<details><summary>Service health</summary><p id="health-state" role="status"></p><p>Hourly cleanup needs attention when no valid success is recorded in the last two hours.</p><dl id="health-summary"></dl><details><summary>Health diagnostic JSON</summary><pre id="health"></pre></details></details>
<label for="status">Filter</label><select id="status"><option value="">All</option><option>new</option><option>reviewing</option><option>closed</option></select><button id="reload">Reload</button>
<div class="inbox-layout"><aside aria-label="Reports"><p id="list-state" role="status"></p><ul id="list"></ul><button id="previous">Previous</button><button id="next">Next</button></aside>
<section id="detail" hidden><h2 id="title" tabindex="-1"></h2><a id="source" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Open public posting deliberately</a>
<h3>Report contents</h3><dl id="report-summary"></dl><details><summary>Full diagnostic JSON</summary><pre id="payload"></pre></details><details><summary>Optional contact</summary><p id="contact"></p></details>
<h3>Possible duplicates</h3><ul id="duplicates"></ul><details><summary>Duplicate diagnostic JSON</summary><pre id="duplicates-json"></pre></details>
<div id="review-recovery" hidden><p>Reload the latest report before editing again. This replaces the other review fields with the latest saved values and keeps your unsaved private note. Review all fields before saving.</p><button id="refresh-detail" type="button">Reload latest report; keep note</button></div>
<form id="review"><label>Status<select name="status"><option>new</option><option>reviewing</option><option>closed</option><option>spam</option></select></label><label>Resolution<select name="resolution"><option value="">Unresolved</option><option>confirmed</option><option>not-reproduced</option><option>expected-behavior</option><option>duplicate</option><option>insufficient-evidence</option></select></label><label>Severity<select name="severity"><option>normal</option><option>low</option><option>high</option><option>critical</option></select></label><label>Duplicate primary ID<input name="duplicateOf" maxlength="100"></label><label>Sanitized GitHub issue URL<input name="issueUrl" type="url" maxlength="300"></label><label>Fixed version<input name="fixedVersion" maxlength="300"></label><label>Private review note<textarea name="note" maxlength="2000"></textarea></label><button>Save review</button></form>
<h3>Review history</h3><ol id="events"></ol><details><summary>History diagnostic JSON</summary><pre id="events-json"></pre></details>
<fieldset><legend>Remove private data</legend><label>Type the report ID to confirm<input id="confirmation"></label><p>These actions remove private information. Type the exact receipt ID before continuing.</p><button disabled id="redact" type="button">Redact contents and contact</button><button disabled id="delete" type="button">Delete report</button></fieldset></section></div></main></html>`;
export const adminCss = `:root{font:16px/1.5 system-ui;color:#29232e;background:#fff8f2}main{max-width:850px;margin:auto;padding:24px}button,input,select,textarea{font:inherit;padding:10px;margin:5px;max-width:100%;box-sizing:border-box}label{display:block;margin:12px 0}textarea,input{display:block;width:95%}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:12px}button{min-height:44px;cursor:pointer}*:focus-visible{outline:3px solid #a43d27;outline-offset:2px}li{margin:10px 0}section{border-top:2px solid #c94f32;margin-top:24px}
:root{--sns-paper:#FFF8F2;--sns-ink:#29232E;--sns-accent:#C94F32;--sns-border:#DABFB0;--sns-muted:#665861}*{box-sizing:border-box}main{max-width:1280px}h1{letter-spacing:-.04em}button,input,select,textarea{border:1px solid #8f7f88;border-radius:8px;margin:0;min-height:44px}button{background:#F5E8DF;color:#29232E;padding:10px 16px}button:disabled{opacity:.5;cursor:not-allowed}a{color:#B4432A}.inbox-layout{display:grid;grid-template-columns:minmax(240px,1fr) minmax(0,2fr);gap:24px;margin-top:24px}.inbox-layout>*{min-width:0}#list{list-style:none;padding:0}#list button{width:100%;text-align:left;background:white;padding:16px}#detail{margin:0;padding:24px;background:white;border:1px solid #DABFB0;border-radius:16px}#review{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}input,textarea,select{width:100%}#review button{background:#C94F32;color:white}#review label:last-of-type{grid-column:1/-1}pre{background:#FFF8F2;border-radius:8px;font-size:13px}summary{cursor:pointer;padding:12px 0}fieldset{border:1px solid #963B2F;border-radius:12px;margin-top:24px}#delete,#redact{color:#963B2F;margin:8px 8px 0 0}#message:empty{display:none}#message:not(:empty){padding:12px;border-left:3px solid #C94F32}#reload,#previous,#next{margin:8px}#title:focus{outline:none}@media(max-width:760px){main{padding:16px}.inbox-layout{grid-template-columns:1fr}#review{grid-template-columns:1fr}#detail{padding:16px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
pre{font-size:14px}dt{font-weight:650}dd{margin:0 0 12px;white-space:pre-wrap}main{overflow-wrap:anywhere}#events,#duplicates{padding-left:24px}#events>li{padding-bottom:12px;border-bottom:1px solid var(--sns-border)}#review-recovery{padding:16px;background:#fff8f2;border:1px solid #735221;border-radius:8px}summary{min-height:44px}#source{display:inline-block;min-height:44px;padding:10px 0}[hidden]{display:none!important}@media(forced-colors:active){button,input,select,textarea,fieldset,#detail,#review-recovery{border-color:CanvasText}}
`;
export const adminJs = `
const get=id=>document.getElementById(id);let offset=0,next=null,current,detailRequest=0;
get('confirmation').addEventListener('input', () => { for (const id of ['delete','redact']) get(id).disabled = !current || get('confirmation').value !== current.id; });
function message(text){get('message').textContent=text;get('message').focus()}
function actionError(error){get('review-recovery').hidden=error.status!==409;message(error.message)}
async function api(path,body){const response=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json','X-SNS-Admin':'1'},body:JSON.stringify(body)}:{});const data=await response.json();if(!response.ok){const error=Error(data.error||'Request failed');error.status=response.status;throw error}return data}
function fact(container,label,value){const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=value;container.append(term,description)}
async function loadHealth(){
  get('health-state').textContent='Loading service health…';get('health').textContent='';get('health-summary').replaceChildren();
  try{
    const data=await api('/api/health'),cleanup=data.health?.find(item=>item.name==='cleanup');
    get('health').textContent=JSON.stringify(data,null,2);
    const succeededAt=Date.parse(cleanup?.succeeded_at);
    const warning=!Number.isFinite(succeededAt) || Date.now()-succeededAt>2*60*60*1000 || (cleanup.failed_at && Date.parse(cleanup.failed_at)>=succeededAt);
    get('health-state').textContent=warning?'Cleanup needs attention. Check the latest success and failure below.':'Service health loaded.';
    fact(get('health-summary'),'Cleanup last succeeded',cleanup?.succeeded_at||'No success recorded');
    fact(get('health-summary'),'Cleanup last failed',cleanup?.failed_at||'No failure recorded');
    fact(get('health-summary'),'Reports deleted by last successful cleanup',cleanup?.deleted_count??'Not recorded');
    fact(get('health-summary'),'Reports expiring within seven days',data.expiring?.count??'Not available');
    for(const row of data.counts||[])fact(get('health-summary'),'Reports: '+row.status,row.count);
  }catch{get('health-state').textContent='Service health could not be loaded. Use Reload to retry.'}
}
async function loadReports(){try{get('list-state').textContent='Loading reports…';const data=await api('/api/reports?offset='+offset+'&status='+encodeURIComponent(get('status').value));next=data.nextOffset;get('list').replaceChildren();for(const report of data.reports){const li=document.createElement('li'),button=document.createElement('button');button.textContent=(report.title||'Untitled vacancy')+' — Status: '+report.status+' · Severity: '+(report.severity||'normal')+' — '+report.received_at;button.onclick=()=>open(report.id);li.append(button);get('list').append(li)}get('list-state').textContent=data.reports.length ? 'Showing '+(offset+1)+'–'+(offset+data.reports.length) : 'No reports match this filter.';get('previous').disabled=offset===0;get('next').disabled=next===null}catch(error){get('list-state').textContent='Reports could not be loaded. Use Reload to retry.';message(error.message)}}
function load(){return Promise.all([loadReports(),loadHealth()])}
function renderHistory(events){
  get('events').replaceChildren();
  for(const event of events){
    const item=document.createElement('li'),heading=document.createElement('p');heading.textContent=event.event_type+' · '+event.occurred_at+' · '+event.actor;item.append(heading);
    if(event.detail){
      let detail;try{detail=JSON.parse(event.detail)}catch{detail=null}
      if(detail && typeof detail==='object'){
        const fields=document.createElement('dl');
        for(const [key,label] of Object.entries({status:'Status',resolution:'Resolution',severity:'Severity',duplicateOf:'Duplicate primary',issueUrl:'Issue',fixedVersion:'Fixed version',note:'Private note'}))if(detail[key])fact(fields,label,detail[key]);
        item.append(fields);
      }else{const text=document.createElement('p');text.textContent=event.detail;item.append(text)}
    }
    get('events').append(item);
  }
  if(!events.length){const item=document.createElement('li');item.textContent='No review history yet.';get('events').append(item)}
  get('events-json').textContent=JSON.stringify(events,null,2);
}
async function open(id,keepNote=false){
  const request=++detailRequest;
  try{
    const data=await api('/api/reports/'+encodeURIComponent(id)),payload=JSON.parse(data.report.payload_json);
    if(request!==detailRequest)return false;
    const note=keepNote && current?.id===id ? get('review').elements.note.value : '';
    current=data.report;get('detail').hidden=false;get('title').textContent=(current.title||'Report')+' · '+current.id;
    get('payload').textContent=JSON.stringify(payload,null,2);get('report-summary').replaceChildren();
    for(const [label,value] of [['Category',current.category],['Status',current.status],['Severity',current.severity],['Received',current.received_at],['Expires',current.expires_at],['Explanation',payload.explanation],['Expected outcome',payload.expectedOutcome],['Relevant passage',payload.relevantPassage]])if(value)fact(get('report-summary'),label,value);
    get('source').hidden=!/^https?:/.test(current.posting_url);if(!get('source').hidden)get('source').href=current.posting_url;
    get('contact').textContent=data.contact?.email||'No contact supplied';
    get('duplicates').replaceChildren();
    for(const candidate of data.duplicateCandidates){const item=document.createElement('li');item.textContent=(candidate.title||'Untitled vacancy')+' · ID: '+candidate.id+' · Status: '+candidate.status;get('duplicates').append(item)}
    if(!data.duplicateCandidates.length){const item=document.createElement('li');item.textContent='No possible duplicates found.';get('duplicates').append(item)}
    get('duplicates-json').textContent=JSON.stringify(data.duplicateCandidates,null,2);renderHistory(data.events);
    for(const [name,column] of Object.entries({status:'status',resolution:'resolution',severity:'severity',duplicateOf:'duplicate_of',issueUrl:'issue_url',fixedVersion:'fixed_version'}))get('review').elements[name].value=current[column]||'';
    get('review').elements.note.value=note;get('confirmation').value='';for(const action of ['delete','redact'])get(action).disabled=true;
    get('review-recovery').hidden=true;get('title').focus();return true;
  }catch(error){if(request===detailRequest)message(error.message);return false}
}
get('refresh-detail').onclick=async()=>{if(current && await open(current.id,true))message('Latest report loaded. Your private note was kept; other review fields now show the latest saved values. Review them before saving.')};
get('review').onsubmit=async event=>{event.preventDefault();try{const body=Object.fromEntries(new FormData(event.target));body.revision=current.revision;const result=await api('/api/reports/'+current.id+'/update',body);message('Review saved.');if(result.deleted)get('detail').hidden=true;else await open(current.id);await load()}catch(error){actionError(error)}};
for(const action of ['delete','redact'])get(action).onclick=async()=>{try{await api('/api/reports/'+current.id+'/'+action,{revision:current.revision,confirm:get('confirmation').value});get('detail').hidden=true;message(action==='delete'?'Report deleted.':'Report redacted.');await load()}catch(error){actionError(error)}};
get('reload').onclick=load;get('status').onchange=()=>{offset=0;load()};get('next').onclick=()=>{if(next!==null){offset=next;load()}};get('previous').onclick=()=>{offset=Math.max(0,offset-25);load()};load();
`;
