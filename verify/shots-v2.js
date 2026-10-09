const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'..','docs','screenshots');
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
  async function shot(name){ await ev(`(async()=>{void document.body.offsetHeight;})()`); await sleep(500);
    const {data}=await s('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(data,'base64')); console.log('  saved',name+'.png'); }

  await s('Emulation.setDeviceMetricsOverride',{width:820,height:1180,deviceScaleFactor:2,mobile:false});
  await s('Page.navigate',{url:BASE}); await sleep(2200);
  await ev(`(async()=>{localStorage.clear();
    for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for(const k of await caches.keys()) await caches.delete(k);})()`);
  await s('Page.navigate',{url:BASE}); await sleep(2600);
  await shot('11-start-two-buttons');

  await ev(`(async()=>{document.querySelector('#goTest').click(); await new Promise(r=>setTimeout(r,400));})()`);
  await shot('12-test-confirm');

  await ev(`(async()=>{document.querySelector('#examBack').click(); await new Promise(r=>setTimeout(r,400));
    document.querySelector('#goRevision').click(); await new Promise(r=>setTimeout(r,600));})()`);
  await shot('13-revision-before-guess');

  await ev(`(async()=>{const o=document.querySelectorAll('.opt'); if(o.length)o[0].click();
    await new Promise(r=>setTimeout(r,350));})()`);
  await shot('14-revision-guessed-not-revealed');

  await ev(`(async()=>{document.querySelector('#reveal').click(); await new Promise(r=>setTimeout(r,450));})()`);
  await shot('15-revision-revealed');

  await s('Page.navigate',{url:BASE+'exam.html?kind=short'}); await sleep(2600);
  await ev(`(async()=>{const n=document.querySelectorAll('#exstrip button').length;
    for(let i=0;i<n;i++){document.querySelectorAll('#exstrip button')[i].click(); await new Promise(r=>setTimeout(r,200));
      const o=document.querySelectorAll('#exq .opt'); if(o.length)o[i%o.length].click(); await new Promise(r=>setTimeout(r,200));}
    MW.Exam._drain(); await new Promise(r=>setTimeout(r,1000));})()`);
  await sleep(900);
  await shot('16-test-results');
  await ev(`(async()=>{const r=document.querySelectorAll('.rev'); if(r.length) r[0].scrollIntoView({block:'center'});})()`);
  await shot('17-test-question-review');
  ws.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
