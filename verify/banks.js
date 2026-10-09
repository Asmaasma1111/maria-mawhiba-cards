/* Fails if the two banks overlap — in the tags, or in what the app actually serves. */
const { MW } = require('./harness.js');
const fs = require('fs');
const S = MW.Store, Bank = MW.Bank;
const fail = [];

Bank.load().then(() => {
  const banks = JSON.parse(fs.readFileSync(__dirname + '/../banks.json', 'utf8'));
  const exams = JSON.parse(fs.readFileSync(__dirname + '/../content/exams.json', 'utf8'));
  const skills = JSON.parse(fs.readFileSync(__dirname + '/../skills.json', 'utf8'));
  const held = skills.heldBackExam;

  // 1. the tag map itself
  const rev = new Set(), tst = new Set();
  for (const [id, b] of Object.entries(banks.tags)) {
    if (b === 'revision') rev.add(id);
    else if (b === 'test') tst.add(id);
    else fail.push(`question ${id} has an unknown bank "${b}"`);
  }
  const both = [...rev].filter(id => tst.has(id));
  if (both.length) fail.push(`${both.length} question(s) in BOTH banks: ${both.slice(0,5)}`);

  // 2. every deck question tagged exactly once; the dress rehearsal in neither
  let deck = 0, untagged = [], dressTagged = [];
  for (const e of exams.exams) for (const b of e.blocks) for (const q of b.questions) {
    if (e.id === held) { if (banks.tags[q.id]) dressTagged.push(q.id); continue; }
    deck++;
    if (!banks.tags[q.id]) untagged.push(q.id);
  }
  if (untagged.length) fail.push(`${untagged.length} deck question(s) untagged: ${untagged.slice(0,5)}`);
  if (dressTagged.length) fail.push(`${dressTagged.length} dress-rehearsal question(s) wrongly tagged`);

  // 3. what revision actually serves must never be a test question
  S.reset(); S.setOverride('2026-10-09');
  const state = S.load();
  let served = 0, leaked = [];
  for (const sk of Bank.skillList()) {
    for (let i = 0; i < 40; i++) {
      const got = Bank.nextQuestion(sk.id, state, { bank: 'revision' });
      if (!got) break;
      served++;
      if (!got.generated && tst.has(got.q.id)) leaked.push(got.q.id);
      S.skill(sk.id).seen[got.q.id] = '2026-10-09';   // force it on to the next item
    }
  }
  if (leaked.length) fail.push(`revision served ${leaked.length} TEST question(s): ${leaked.slice(0,5)}`);

  // 4. what a full exam serves must never be a revision question
  S.reset(); S.setOverride('2026-10-09');
  const st2 = S.load();
  let examAuthored = 0, examLeaked = [];
  for (let run = 0; run < 5; run++) {
    for (const sk of Bank.skillList()) {
      const pool = Bank.authoredFor(sk.id, st2, 0, 'test').items;
      for (const q of pool) {
        examAuthored++;
        if (rev.has(q.id)) examLeaked.push(q.id);
      }
    }
  }
  if (examLeaked.length) fail.push(`the test bank exposed ${examLeaked.length} REVISION question(s)`);

  console.log('BANK SEPARATION');
  console.log(`  revision bank: ${rev.size}   test bank: ${tst.size}   deck total: ${deck}`);
  console.log(`  dress rehearsal held out: ${64 - dressTagged.length} of 64`);
  console.log(`  revision questions served in simulation: ${served}  leaked from test bank: ${leaked.length}`);
  console.log(`  test-bank authored questions inspected: ${examAuthored}  leaked from revision: ${examLeaked.length}`);
  if (fail.length) { console.log('  FAIL'); fail.forEach(f => console.log('    ' + f)); process.exitCode = 1; }
  else console.log('  PASS — the two banks do not overlap, in the data or in what the app serves');
});
