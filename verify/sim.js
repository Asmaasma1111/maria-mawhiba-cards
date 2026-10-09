/* One simulated day of cards, driving the real plan() / grade() / markSeen(). */
const { MW } = require('./harness.js');
const S = MW.Store, Bank = MW.Bank, Sched = MW.Sched;
function runDay(today, opts = {}) {
  S.setOverride(today);
  const state = S.load();
  const plan = Sched.plan(state, today, state.settings.cardsPerSession || 8);
  if (plan.rest) return { rest: true, cards: [] };
  const log = [], retries = [];
  for (const item of plan.cards) {
    const sk = item.sk, rec = S.skill(sk.id);
    const wasLearn = item.kind === 'learn' || rec.wrongStreak >= 2;
    const got = Bank.nextQuestion(sk.id, state, { level: rec.level || 1, bank: 'revision' });
    if (!got) continue;
    const correct = opts.force !== undefined ? opts.force : (Math.random() < (opts.rate ?? 0.7));
    const slow = opts.slow ? true : (Math.random() < 0.15);
    Sched.markSeen(sk.id, got.q.id, today, got.isPicture);
    Sched.grade(state, sk.id, correct, slow, today, false);
    log.push({ skill: sk.id, learn: wasLearn, ok: correct, slow, gen: got.generated,
               qid: got.q.id, pic: !!got.isPicture });
    if (!correct) retries.push(sk);
  }
  for (const sk of retries) {                 /* same-session retry, easier, stays in box 1 */
    const got = Bank.nextQuestion(sk.id, state, { level: 1, bank: 'revision' });
    if (!got) continue;
    Sched.markSeen(sk.id, got.q.id, today, got.isPicture);
    Sched.grade(state, sk.id, true, false, today, true);
    log.push({ skill: sk.id, retry: true, ok: true, qid: got.q.id });
  }
  return { rest: false, cards: log, finalWeek: plan.finalWeek };
}
module.exports = { runDay, S, Bank, Sched, MW };
