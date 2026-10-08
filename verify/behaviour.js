/* The fifteen scheduling behaviours the brief names, checked against scheduler.js. */
const { runDay, S, Bank, Sched } = require('./sim.js');
Bank.load().then(() => {
  const pass = [], fail = [];
  const t = (n, c, d='') => (c ? pass : fail).push(n + (d ? ' — ' + d : ''));

  S.reset(); S.load().settings.testDate = '2026-12-10'; S.save();
  let day = '2026-10-08', counts = [];
  for (let i = 0; i < 10; i++) { counts.push(runDay(day, { rate: 0.7 }).cards.length); day = S.addDays(day, 1); }
  t('scheduling runs across 10 days', counts.every(n => n > 0), 'cards/day ' + counts.join(','));

  S.reset(); S.setOverride('2026-10-08');
  let r = S.skill('numseq'); r.box = 3; r.due = '2026-10-08'; S.save();
  Sched.grade(S.load(), 'numseq', true, true, '2026-10-08', false);
  r = S.skill('numseq');
  t('slow-correct keeps the box', r.box === 3, 'box=' + r.box);
  t('slow-correct is due in 2 days', r.due === '2026-10-10', 'due=' + r.due);

  S.reset(); S.setOverride('2026-10-08');
  r = S.skill('mech'); r.box = 4; S.save();
  Sched.grade(S.load(), 'mech', false, false, '2026-10-08', false);
  const w = Object.assign({}, S.skill('mech'));
  Sched.grade(S.load(), 'mech', true, false, '2026-10-08', true);
  t('wrong drops to box 1', w.box === 1, 'box=' + w.box);
  t('wrong is due tomorrow', w.due === '2026-10-09');
  t('a right retry stays in box 1', S.skill('mech').box === 1, 'box=' + S.skill('mech').box);

  S.reset(); S.setOverride('2026-10-08');
  Sched.grade(S.load(), 'odd', false, false, '2026-10-08', false);
  Sched.grade(S.load(), 'odd', false, false, '2026-10-09', false);
  t('two wrongs bring the learn card back', S.skill('odd').wrongStreak >= 2);

  S.reset(); S.setOverride('2026-10-08');
  Sched.grade(S.load(), 'spatial', true, false, '2026-10-08', false);
  const b1 = S.skill('spatial').box;
  Sched.grade(S.load(), 'spatial', true, false, '2026-10-08', false);
  t('at most one box up per day', S.skill('spatial').box === b1, 'box ' + b1);

  S.reset(); S.setOverride('2026-10-08');
  Sched.grade(S.load(), 'numseq', true, false, '2026-10-08', false);
  Sched.grade(S.load(), 'numseq', true, false, '2026-10-09', false);
  t('two correct raise the level', S.skill('numseq').level === 2, 'level=' + S.skill('numseq').level);
  Sched.grade(S.load(), 'numseq', false, false, '2026-10-10', false);
  t('a wrong lowers the level', S.skill('numseq').level === 1);

  S.reset(); S.load().settings.testDate = '2026-10-13'; S.save();
  S.setOverride('2026-10-08');
  const p = Sched.plan(S.load(), '2026-10-08', 8);
  t('final week introduces nothing new', p.cards.every(c => c.kind !== 'learn'));
  t('final week is flagged', p.finalWeek === true);
  S.setOverride('2026-10-12');
  t('the day before the test is a rest day', Sched.plan(S.load(), '2026-10-12', 8).rest === true);
  S.setOverride('2026-10-11');
  t('two days before is not a rest day', Sched.plan(S.load(), '2026-10-11', 8).rest === false);

  S.reset(); S.setOverride('2026-10-08');
  const n = Sched.afterExam(S.load(), ['mech','odd','reading'], '2026-10-08');
  t('an exam pushes wrong skills into the cards', n === 3 && S.skill('mech').due === '2026-10-09');

  console.log('SCHEDULING BEHAVIOUR');
  pass.forEach(x => console.log('  PASS  ' + x));
  fail.forEach(x => console.log('  FAIL  ' + x));
  console.log('  ' + pass.length + ' passed, ' + fail.length + ' failed');
  if (fail.length) process.exitCode = 1;
});
