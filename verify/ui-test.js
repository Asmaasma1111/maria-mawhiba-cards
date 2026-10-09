/* 1) a FULL revision session (all skills due, 8 cards) with the same assertions
   2) a test played to the end, asserting no feedback of any kind during it */
const BASE='http://localhost:8161/';
function cdp(ws){let id=0;const w=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&w.has(m.id)){w.get(m.id)(m);w.delete(m.id);}});
  return (m,p={})=>new Promise((res,rej)=>{const i=++id;w.set(i,x=>x.error?rej(new Error(m+': '+x.error.message)):res(x.result));ws.send(JSON.stringify({id:i,method:m,params:p}));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const t=(await (await fetch('http://127.0.0.1:9224/json/list')).json()).find(x=>x.type==='page');
  const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.addEventListener('open',r));
  const s=cdp(ws); await s('Page.enable'); await s('Runtime.enable');
  await s('Network.enable'); await s('Network.setCacheDisabled',{cacheDisabled:true});
  const ev=async e=>{const r=await s('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception)); return r.result.value;};
  await s('Emulation.setDeviceMetricsOverride',{width:820,height:1180,deviceScaleFactor:1,mobile:false});

  // ---------- full revision session ----------
  await s('Page.navigate',{url:BASE}); await sleep(2200);
  await ev(`(async()=>{localStorage.clear();
    for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for(const k of await caches.keys()) await caches.delete(k);})()`);
  await s('Page.navigate',{url:BASE}); await sleep(2600);
  // make every skill due so the session fills to 8 cards
  await ev(`(async()=>{const st=MW.Store.load(); const today=MW.Store.today();
    MW.Bank.skillList().forEach(sk=>{const r=MW.Store.skill(sk.id); r.box=2; r.due=today; r.intro=today;});
    MW.Store.save();})()`);
  await s('Page.navigate',{url:BASE}); await sleep(2600);
  await ev(`(async()=>{document.querySelector('#goRevision').click();await new Promise(r=>setTimeout(r,500));})()`);

  const probe=`(async()=>{const o=[...document.querySelectorAll('.opt')];return{
    marks:o.some(x=>x.classList.contains('right'))||o.some(x=>x.classList.contains('wrongpick'))||o.some(x=>x.classList.contains('dim')),
    fb:!!document.querySelector('.feedback'), picked:o.filter(x=>x.classList.contains('picked')).length,
    revDis:document.querySelector('#reveal')?document.querySelector('#reveal').disabled:null, n:o.length};})()`;
  let cards=0, bad=[];
  for(let i=0;i<14;i++){
    const on=await ev(`(async()=>document.querySelector('#v-card').hidden===false && !!document.querySelector('#cardbody .card'))()`);
    if(!on) break;
    cards++;
    let p=await ev(probe);
    if(p.marks||p.fb) bad.push(`card ${cards}: answer visible before guessing`);
    if(p.n && p.revDis!==true) bad.push(`card ${cards}: reveal enabled before guessing`);
    await ev(`(async()=>{const o=document.querySelectorAll('.opt'); if(o.length)o[1%o.length].click(); await new Promise(r=>setTimeout(r,220));})()`);
    p=await ev(probe);
    if(p.marks||p.fb) bad.push(`card ${cards}: answer visible after guess, before reveal`);
    await ev(`(async()=>{document.querySelector('#reveal').click(); await new Promise(r=>setTimeout(r,320));})()`);
    p=await ev(probe);
    if(!p.fb||!p.marks) bad.push(`card ${cards}: reveal showed nothing`);
    await ev(`(async()=>{const c=document.querySelector('#cont'); if(c)c.click(); await new Promise(r=>setTimeout(r,380));})()`);
  }
  console.log('FULL REVISION SESSION');
  console.log('  cards played:', cards, ' violations:', bad.length);
  bad.forEach(b=>console.log('    '+b));

  // ---------- a test, played to the end ----------
  await s('Page.navigate',{url:BASE+'exam.html?kind=short'}); await sleep(2600);
  const examBad=[];
  const examProbe=`(async()=>{const o=[...document.querySelectorAll('.opt')];const txt=document.body.innerText;return{
    marksRight:o.some(x=>x.classList.contains('right')),
    hasFeedback:!!document.querySelector('.feedback'),
    hasReveal:!!document.querySelector('#reveal'),
    showsCorrectWord: /الإجابة الصحيحة/.test(txt),
    nOpts:o.length, strip:document.querySelectorAll('#exstrip button').length};})()`;
  let st=await ev(examProbe);
  if(st.hasFeedback||st.hasReveal||st.showsCorrectWord) examBad.push('test shows feedback or a reveal button');
  // answer every question in the block, checking after each that nothing is revealed
  const n = st.strip;
  for(let i=0;i<n;i++){
    await ev(`(async()=>{document.querySelectorAll('#exstrip button')[${i}].click(); await new Promise(r=>setTimeout(r,220));
      const o=document.querySelectorAll('#exq .opt'); if(o.length)o[0].click(); await new Promise(r=>setTimeout(r,220));})()`);
    const p=await ev(examProbe);
    if(p.hasFeedback||p.hasReveal||p.showsCorrectWord) examBad.push(`after answering q${i+1}: feedback leaked during the test`);
  }
  // selecting marks the choice green in the exam UI, which is the "your answer" state, not correctness
  await ev(`(async()=>{MW.Exam._drain(); await new Promise(r=>setTimeout(r,900));})()`);
  await sleep(1200);
  const res=await ev(`(async()=>{const txt=document.body.innerText;return{
    isResults:/النتيجة/.test(txt), hasFacets:/المهارات/.test(txt), hasReview:/مراجعة الأسئلة/.test(txt),
    hasHers:/إجابتها/.test(txt), hasRight:/الصحيحة/.test(txt),
    saved:(JSON.parse(localStorage.getItem('maria.mawhiba.v1')||'{}').exams||[]).length,
    savedHasReview:((JSON.parse(localStorage.getItem('maria.mawhiba.v1')||'{}').exams||[]).slice(-1)[0]||{}).review?true:false,
    savedDate:((JSON.parse(localStorage.getItem('maria.mawhiba.v1')||'{}').exams||[]).slice(-1)[0]||{}).date};})()`);
  console.log('\nTEST');
  console.log('  questions answered with no feedback shown:', n, ' violations during:', examBad.length);
  examBad.forEach(b=>console.log('    '+b));
  console.log('  results screen — score:', res.isResults, ' per-facet:', res.hasFacets,
              ' question review:', res.hasReview, ' her answer + correct:', res.hasHers && res.hasRight);
  console.log('  saved results:', res.saved, ' with review:', res.savedHasReview, ' dated:', res.savedDate);
  if (bad.length||examBad.length||!res.isResults||!res.hasReview||!res.savedHasReview) process.exitCode=1;
  ws.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
