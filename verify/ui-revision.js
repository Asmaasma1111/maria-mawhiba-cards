/* Plays a whole revision session as Maria, asserting at every step that nothing
   gives the answer away before she has guessed AND tapped "أظهري الإجابة". */
const BASE=process.env.BASE || 'http://localhost:8161/';
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
  await s('Page.navigate',{url:BASE}); await sleep(2200);
  await ev(`(async()=>{localStorage.clear();
    for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for(const k of await caches.keys()) await caches.delete(k);})()`);
  await s('Page.navigate',{url:BASE}); await sleep(2600);

  const home = await ev(`(async()=>({
     buttons:[...document.querySelectorAll('#choices .big')].map(b=>b.querySelector('.bigt').textContent.trim()),
     lines:[...document.querySelectorAll('#choices .bigs')].map(b=>b.textContent.trim())
  }))()`);
  console.log('START SCREEN');
  console.log('  buttons:', home.buttons.join('  |  '));
  home.lines.forEach(l=>console.log('    ' + l));

  await ev(`(async()=>{document.querySelector('#goRevision').click();await new Promise(r=>setTimeout(r,500));})()`);

  // snapshot of what a card gives away, at each of the three stages
  const probe = `(async()=>{
    const card=document.querySelector('#cardbody');
    const opts=[...document.querySelectorAll('.opt')];
    return {
      marksCorrect: opts.some(o=>o.classList.contains('right')),
      marksWrong:   opts.some(o=>o.classList.contains('wrongpick')),
      dimmed:       opts.some(o=>o.classList.contains('dim')),
      picked:       opts.filter(o=>o.classList.contains('picked')).length,
      feedback:     !!document.querySelector('.feedback'),
      revealExists: !!document.querySelector('#reveal'),
      revealDisabled: document.querySelector('#reveal') ? document.querySelector('#reveal').disabled : null,
      optsDisabled: opts.filter(o=>o.disabled).length,
      nOpts: opts.length,
      prompt: (document.querySelector('.prompt')||{}).textContent
    };})()`;

  let cards=0, violations=[];
  for (let i=0;i<10;i++){
    const onCard = await ev(`(async()=>!!document.querySelector('#cardbody .card') && document.querySelector('#v-card').hidden===false)()`);
    if(!onCard) break;
    cards++;

    const before = await ev(probe);
    if (before.marksCorrect||before.marksWrong||before.dimmed||before.feedback)
      violations.push(`card ${cards}: answer shown BEFORE any guess`);
    if (before.nOpts && before.revealDisabled !== true)
      violations.push(`card ${cards}: reveal button active before a guess`);

    // try to reveal without guessing — must do nothing
    await ev(`(async()=>{document.querySelector('#reveal').click();await new Promise(r=>setTimeout(r,250));})()`);
    const forced = await ev(probe);
    if (forced.feedback||forced.marksCorrect)
      violations.push(`card ${cards}: reveal worked WITHOUT a guess`);

    // guess
    await ev(`(async()=>{const o=document.querySelectorAll('.opt'); if(o.length) o[0].click();
                         await new Promise(r=>setTimeout(r,250));})()`);
    const after = await ev(probe);
    if (after.nOpts && after.picked !== 1) violations.push(`card ${cards}: guess not highlighted`);
    if (after.marksCorrect||after.marksWrong||after.dimmed||after.feedback)
      violations.push(`card ${cards}: answer shown after guess but BEFORE reveal`);
    if (after.nOpts && after.revealDisabled !== false)
      violations.push(`card ${cards}: reveal still disabled after a guess`);

    // reveal
    await ev(`(async()=>{document.querySelector('#reveal').click();await new Promise(r=>setTimeout(r,350));})()`);
    const revealed = await ev(probe);
    if (!revealed.feedback || !revealed.marksCorrect)
      violations.push(`card ${cards}: reveal did not show the answer`);
    if (revealed.optsDisabled !== revealed.nOpts)
      violations.push(`card ${cards}: options still clickable after reveal`);

    await ev(`(async()=>{const c=document.querySelector('#cont'); if(c) c.click();
                         await new Promise(r=>setTimeout(r,400));})()`);
  }
  const done = await ev(`(async()=>({done:!document.querySelector('#v-done').hidden,
    stars:(document.querySelector('#doneStars')||{}).textContent}))()`);
  console.log('\nREVISION SESSION');
  console.log('  cards played:', cards, ' reached the done screen:', done.done, ' stars:', done.stars);
  console.log('  violations:', violations.length);
  violations.forEach(v=>console.log('    ' + v));
  if (violations.length) process.exitCode = 1;
  ws.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
