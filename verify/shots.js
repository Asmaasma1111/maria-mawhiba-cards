/* Drives headless Chrome over CDP to capture the app in each state.
   No dependencies: Node's built-in WebSocket and fetch only. */
const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:8151';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const PORT = 9222;

function cdp(ws) {
  let id = 0; const waiting = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  });
  return (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    waiting.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  const send = cdp(ws);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });

  async function shot(name, { w, h, url, before, settle = 900 }) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 2, mobile: false });
    if (url) { await send('Page.navigate', { url: BASE + url }); await sleep(1800); }
    if (before) {
      const r = await send('Runtime.evaluate',
        { expression: `(async()=>{${before}})()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(name + ': ' + JSON.stringify(r.exceptionDetails.exception));
    }
    await sleep(settle);
    await send('Runtime.evaluate',{expression:'void document.body.offsetHeight'});
    await sleep(350);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(data, 'base64'));
    console.log('  saved', name + '.png', `(${w}x${h})`);
  }

  const P = { w: 820, h: 1180 }, L = { w: 1180, h: 820 };
  const clean = `localStorage.clear();
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);`;

  await shot('01-home-portrait', { ...P, url: '/index.html',
    before: clean + ` location.reload();`, settle: 2600 });

  await shot('02-learn-card', { ...P,
    before: `document.querySelector('#start').click(); await new Promise(r=>setTimeout(r,500));` });

  await shot('03-practice-card', { ...P,
    before: `const b=document.querySelector('#learnGo'); if(b) b.click(); await new Promise(r=>setTimeout(r,500));` });

  await shot('04-answer-feedback', { ...P,
    before: `document.querySelectorAll('.opt')[0].click(); await new Promise(r=>setTimeout(r,500));` });

  await shot('05-card-landscape', { ...L,
    before: `document.querySelector('#cont').click(); await new Promise(r=>setTimeout(r,500));
             const b=document.querySelector('#learnGo'); if(b) b.click(); await new Promise(r=>setTimeout(r,500));` });

  await shot('06-parent-portrait', { ...P, url: '/parent.html' });

  await shot('07-exam-block', { ...L, url: '/exam.html?kind=full', settle: 2200 });

  await shot('08-exam-results', { ...P,
    before: `document.querySelector('.opt').click();
             for (let i=0;i<12;i++){ MW.Exam._drain(); await new Promise(r=>setTimeout(r,450)); }
             await new Promise(r=>setTimeout(r,900));`, settle: 1200 });

  await shot('09-rest-day', { ...P, url: '/index.html',
    before: `const s=MW.Store.load(); s.settings.testDate='2026-10-09'; MW.Store.save();
             MW.Store.setOverride('2026-10-08'); location.reload();`, settle: 2600 });

  await shot('10-done-screen', { ...P, url: '/index.html',
    before: `MW.Store.setOverride(null); localStorage.removeItem('maria.mawhiba.v1');
             localStorage.removeItem('maria.dateOverride'); location.reload();
             await new Promise(r=>setTimeout(r,2000));
             document.querySelector('#start').click(); await new Promise(r=>setTimeout(r,400));
             for (let i=0;i<40;i++){
               const lg=document.querySelector('#learnGo'); if(lg){lg.click(); await new Promise(r=>setTimeout(r,250)); continue;}
               const o=document.querySelector('.opt:not([disabled])'); if(o){o.click(); await new Promise(r=>setTimeout(r,250)); continue;}
               const c=document.querySelector('#cont'); if(c){c.click(); await new Promise(r=>setTimeout(r,250)); continue;}
               break;
             }`, settle: 1200 });

  ws.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
