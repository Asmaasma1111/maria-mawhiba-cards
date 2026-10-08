/* Every question, authored and generated: four distinct options, valid answer
   index after shuffling, and for generated items the stated rule re-derived. */
const { MW } = require('./harness.js');
const fs = require('fs');
const G = MW.Gen;
const AR = '٠١٢٣٤٥٦٧٨٩';
const num = s => parseInt([...String(s)].map(c => { const i = AR.indexOf(c); return i < 0 ? c : i; }).join(''), 10);
let out = [];

const d = JSON.parse(fs.readFileSync(__dirname + '/../content/exams.json', 'utf8'));
let an = 0, ab = 0;
for (const e of d.exams) for (const b of e.blocks) for (const q of b.questions) {
  an++;
  const o = q.optionShapes || q.options;
  if (new Set(o.map(x => JSON.stringify(x))).size !== 4) { ab++; out.push('  dup options ' + q.id); }
  if (!(q.answer >= 0 && q.answer < 4)) { ab++; out.push('  bad answer ' + q.id); }
  if (!q.explain) { ab++; out.push('  no explain ' + q.id); }
}
let gn = 0, gb = 0;
for (const s of G.skills) for (let l = 1; l <= 3; l++) for (let seed = 1; seed <= 500; seed++) {
  const q = G.make(s, l, seed);
  if (!q) { gb++; continue; }
  const o = q.optionShapes || q.options;
  if (new Set(o.map(x => JSON.stringify(x))).size !== 4 || !(q.answer >= 0 && q.answer < 4)) gb++;
  gn++;
}
let seqChecked = 0, seqBad = 0;
for (let l = 1; l <= 3; l++) for (let seed = 1; seed <= 500; seed++) {
  const q = G.make('numseq', l, seed); if (!q) continue;
  const terms = q.prompt.split('،').map(s => s.trim()).filter(s => !s.includes('.')).map(num);
  const ans = num(q.options[q.answer]); const e = q.explain; let exp = null;
  if (/يتضاعف/.test(e)) exp = terms[3] * 2;
  else if (/^كل مرة ‎\+/.test(e)) exp = terms[3] + num(e.match(/\+([٠-٩]+)/)[1]);
  else if (/^ضرب في ([٠-٩]+) كل مرة/.test(e)) exp = terms[3] * num(e.match(/ضرب في ([٠-٩]+)/)[1]);
  else if (/مربّعات/.test(e)) { const r = Math.round(Math.sqrt(terms[3])); exp = (r + 1) * (r + 1); }
  else if (/مجموع العددين قبله/.test(e)) exp = terms[2] + terms[3];
  else continue;
  seqChecked++; if (exp !== ans) { seqBad++; out.push('  numseq rule mismatch seed ' + seed); }
}
let matChecked = 0, matBad = 0;
for (let seed = 1; seed <= 600; seed++) {
  const q = G.make('patterns', 1, seed); if (!q) continue;
  const grid = q.stimulus.rows.map(r => r.map(c => c.blank ? null : c.dots));
  const ans = q.optionShapes[q.answer].dots, e = q.explain; let f;
  if (/×/.test(e)) { const m = e.match(/× ([٠-٩]+)\./); const b = m ? num(m[1]) : 1; f = (a, c) => b * a * c; }
  else { const m = e.match(/\+ ([٠-٩]+)\.$/); const ad = m ? num(m[1]) : 0; f = (a, c) => a + c + ad; }
  let ok = true;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const want = f(i + 1, j + 1);
    if (grid[i][j] === null) { if (want !== ans) ok = false; } else if (grid[i][j] !== want) ok = false;
  }
  matChecked++; if (!ok) { matBad++; out.push('  matrix rule mismatch seed ' + seed); }
}
console.log('QUESTION INTEGRITY');
console.log('  authored questions:   ' + an + '  problems: ' + ab);
console.log('  generated questions:  ' + gn + '  problems: ' + gb);
console.log('  number sequences re-derived from their stated rule: ' + seqChecked + '  mismatches: ' + seqBad);
console.log('  matrices re-derived across all nine cells:          ' + matChecked + '  mismatches: ' + matBad);
console.log('  generator integrity failures logged: ' + G.failures.length);
out.forEach(x => console.log(x));
if (ab || gb || seqBad || matBad) process.exitCode = 1;
