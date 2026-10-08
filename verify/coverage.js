/* Two months to the test at ~70% accuracy: introduction dates, practice counts,
   final-week sweep, picture/word alternation, and when authored items repeat. */
const { runDay, S, Bank } = require('./sim.js');
const START = process.env.START || '2026-10-08';
const TEST  = process.env.TEST  || '2026-12-08';
Bank.load().then(() => {
  S.reset(); S.load().settings.testDate = TEST; S.save();
  const st = {}, repeatWeek = {}, f7 = {};
  Bank.skillList().forEach(s => { st[s.id] = { intro: null, times: 0, last14: 0, qids: [], pics: 0, words: 0 }; f7[s.id] = 0; });
  const win14 = S.addDays(TEST, -14), win7 = S.addDays(TEST, -7);
  let day = START, i = 0, cards = 0, rest = 0, firstThree = [];
  while (S.daysBetween(day, TEST) > 0) {
    const r = runDay(day, { rate: 0.7 });
    if (r.rest) rest++;
    if (i < 3) firstThree.push(r.cards.length);
    for (const c of r.cards) {
      const s = st[c.skill];
      if (!s.intro) s.intro = day;
      s.times++; cards++;
      if (S.daysBetween(win14, day) >= 0) s.last14++;
      if (S.daysBetween(win7, day) >= 0) f7[c.skill]++;
      if (c.qid && !String(c.qid).startsWith('g-')) {
        if (s.qids.includes(c.qid) && !repeatWeek[c.skill]) repeatWeek[c.skill] = Math.floor(i / 7) + 1;
        s.qids.push(c.qid);
        const sk = Bank.skillById(c.skill);
        if (sk && (sk.pictureIds || []).includes(c.qid)) s.pics++; else s.words++;
      }
    }
    day = S.addDays(day, 1); i++;
  }
  const deadline = S.addDays(TEST, -10);
  const L = [];
  L.push('COVERAGE SIMULATION');
  L.push('  ' + START + ' to ' + TEST + ' — ' + i + ' days, ' + cards + ' cards, ' + rest + ' rest day');
  L.push('  first three sessions: ' + firstThree.join(', ') + ' cards');
  L.push('');
  L.push('skill        introduced   late?  practised  last 14d  final 7d  flag');
  L.push('-'.repeat(76));
  let flags = 0;
  for (const sk of Bank.skillList()) {
    const s = st[sk.id];
    const late = s.intro ? S.daysBetween(s.intro, deadline) < 0 : true;
    const few = s.times < 6;
    const miss = f7[sk.id] === 0;
    const flag = [late && 'INTRODUCED LATE', few && 'UNDER 6', miss && 'MISSED FINAL WEEK'].filter(Boolean).join(' + ');
    if (flag) flags++;
    L.push(sk.id.padEnd(12) + ' ' + (s.intro || 'never').padEnd(12) + ' ' + (late ? 'YES' : 'no').padEnd(6) +
           String(s.times).padStart(9) + String(s.last14).padStart(10) + String(f7[sk.id]).padStart(10) + '  ' + flag);
  }
  L.push('-'.repeat(76));
  L.push('  flagged skills: ' + flags);
  L.push('');
  L.push('  relations skill — picture items shown: ' + st.relations.pics + ', word items shown: ' + st.relations.words);
  L.push('');
  L.push('AUTHORED-ONLY SKILLS — week an item first repeats');
  Bank.skillList().filter(s => s.source === 'authored').forEach(s => {
    L.push('  ' + s.id.padEnd(12) + (repeatWeek[s.id] ? 'week ' + repeatWeek[s.id] : 'no repeat within the run'));
  });
  console.log(L.join('\n'));
  if (flags) process.exitCode = 1;
});
