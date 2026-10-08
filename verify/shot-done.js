const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'..','docs','screenshots');
function cdp(ws){let id=0;const w=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&w.has(m.id)){w.get(m.id)(m);w.delete(m.id);}});
  return (method,params={})=>new Promise((res,rej)=>{const i=++id;
    w.set(i,m=>m.error?rej(new Error(method+': '+m.error.message)):res(m.result));
    ws.send(JSON.stringify({id:i,method,params}));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const t=(await (await fetch('http://127.0.0.1:9222/json/list')).json()).find(x=>x.type==='page');
  const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.addEventListener('open',r));
  const send=cdp(ws); await send('Page.enable'); await send('Runtime.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride',{width:820,height:1180,deviceScaleFactor:2,mobile:false});
  // clear state, then reload as a navigation (not inside the evaluated script)
  await send('Page.navigate',{url:'http://localhost:8151/index.html'}); await sleep(1800);
  await send('Runtime.evaluate',{expression:`MW.Store.setOverride(null);localStorage.removeItem('maria.mawhiba.v1');localStorage.removeItem('maria.dateOverride');`,returnByValue:true});
  await send('Page.navigate',{url:'http://localhost:8151/index.html'}); await sleep(2200);
  // walk a session picking options at random, retrying until she earns at least one star
  let r, attempt = 0;
  do {
    attempt++;
    await send('Runtime.evaluate',{expression:`localStorage.removeItem('maria.mawhiba.v1')`,returnByValue:true});
    await send('Page.navigate',{url:'http://localhost:8151/index.html'}); await sleep(2200);
    r = await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
      document.querySelector('#start').click(); await new Promise(r=>setTimeout(r,400));
      for (let i=0;i<80;i++){
        const lg=document.querySelector('#learnGo'); if(lg){lg.click(); await new Promise(r=>setTimeout(r,200)); continue;}
        const c=document.querySelector('#cont'); if(c){c.click(); await new Promise(r=>setTimeout(r,200)); continue;}
        const os=[...document.querySelectorAll('#v-card:not([hidden]) .opt:not([disabled])')];
        if(os.length){ os[Math.floor(Math.random()*os.length)].click(); await new Promise(r=>setTimeout(r,200)); continue; }
        if(!document.querySelector('#v-done').hidden) break;
        break;
      }
      return {done:!document.querySelector('#v-done').hidden, stars:document.querySelector('#doneStars').textContent};
    })()`});
  } while (attempt < 8 && (!r.result.value.done || r.result.value.stars === '\u0660'));
  console.log('  session walked:', JSON.stringify(r.result.value));
  await sleep(700);
  const {data}=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(OUT,'10-done-screen.png'),Buffer.from(data,'base64'));
  console.log('  saved 10-done-screen.png');
  ws.close();
})().catch(e=>{console.error('FAILED:',e.message);process.exit(1);});
