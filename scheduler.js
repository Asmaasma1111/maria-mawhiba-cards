/* scheduler.js — صناديق التكرار المتباعد وبناء جلسة اليوم. بلا أزرار تقييم. */
(function (g) {
  'use strict';
  var MW = g.MW = g.MW || {};
  var INTERVALS = [1, 2, 4, 7, 12];      /* صندوق ١..٥ */
  var MAX_BOX = 5;

  function S() { return MW.Store; }

  function isDue(rec, today) {
    return rec.box > 0 && rec.due && S().daysBetween(rec.due, today) >= 0;
  }
  function overdueBy(rec, today) {
    return rec.due ? S().daysBetween(rec.due, today) : -999;
  }
  /* الأضعف: صندوق أدنى، ثم نسبة خطأ أعلى في آخر خمس */
  function weakness(rec) {
    var last = (rec.hist || []).slice(-5);
    var wrong = last.filter(function (h) { return !h.ok; }).length;
    return (6 - rec.box) * 10 + wrong;
  }

  /* يوم الراحة قبل الاختبار، والأسبوع الأخير بلا مهارات جديدة */
  function phase(state, today) {
    var td = state.settings.testDate;
    if (!td) return { rest: false, finalWeek: false, daysLeft: null };
    var left = S().daysBetween(today, td);
    return { rest: left === 1 || left === 0, finalWeek: left > 1 && left <= 7, daysLeft: left };
  }

  /* كم مهارة جديدة اليوم: ١ أو ٢ عادة، وأكثر فقط إذا ضاق الوقت قبل المهلة */
  function newQuota(state, today, remainingNew, dueCount, maxCards) {
    var ph = phase(state, today);
    if (ph.finalWeek || ph.rest) return 0;
    if (!remainingNew) return 0;
    var td = state.settings.testDate;
    /* الجلسات الأولى تكون فارغة من المستحقّات، فنملؤها بمهارتين لا بواحدة */
    var room = Math.max(0, (maxCards || 8) - (dueCount || 0));
    var base = room >= 2 ? 2 : 1;
    if (!td) return Math.min(base, remainingNew);
    var deadline = S().addDays(td, -10);          /* كل مهارة تُقدَّم قبل الاختبار بعشرة أيام */
    var daysToDeadline = S().daysBetween(today, deadline);
    if (daysToDeadline <= 0) return remainingNew;  /* متأخّرون: قدّمي الباقي الآن */
    var need = Math.ceil(remainingNew / (daysToDeadline + 1));
    return Math.min(remainingNew, Math.max(base, need));
  }

  /* خطة الجلسة: مستحقّة أولاً (الأكثر تأخّراً ثم الأضعف)، ثم الجديدة */
  function plan(state, today, maxCards) {
    var ph = phase(state, today);
    if (ph.rest) return { rest: true, cards: [] };

    var list = MW.Bank.skillList();
    var due = [], fresh = [];
    list.forEach(function (sk) {
      var rec = state.skills[sk.id] || { box: 0 };
      if (rec.box === 0) fresh.push(sk);
      else if (isDue(rec, today)) due.push(sk);
    });

    due.sort(function (a, b) {
      var ra = state.skills[a.id], rb = state.skills[b.id];
      var d = overdueBy(rb, today) - overdueBy(ra, today);
      return d !== 0 ? d : weakness(rb) - weakness(ra);
    });

    if (ph.finalWeek) {
      /* الأسبوع الأخير: كل مهارة تُراجَع مرة على الأقل، والتي لم تُراجَع بعد تتقدّم */
      var winStart = S().addDays(state.settings.testDate, -7);
      var all = list.filter(function (sk) { return (state.skills[sk.id] || {}).box > 0; });
      function reviewedInWindow(sk) {
        var h = (state.skills[sk.id] || {}).hist || [];
        for (var i = h.length - 1; i >= 0; i--) {
          if (S().daysBetween(winStart, h[i].d) >= 0) return true;
        }
        return false;
      }
      var pending = all.filter(function (sk) { return !reviewedInWindow(sk); });
      var rest = all.filter(function (sk) { return reviewedInWindow(sk); });
      var byWeak = function (a, b) { return weakness(state.skills[b.id]) - weakness(state.skills[a.id]); };
      pending.sort(byWeak); rest.sort(byWeak);
      due = pending.concat(rest);      /* غير المراجَعة أولاً، ثم الأضعف */
      fresh = [];
    }

    var quota = newQuota(state, today, fresh.length, due.length, maxCards);
    var picked = [];
    var newOnes = fresh.slice(0, quota);

    /* المهارة الجديدة تأخذ مكانها حتى لو امتلأت الجلسة بالمستحقّات */
    var pool = due.map(function (sk) { return { sk: sk, kind: 'practice' }; });
    newOnes.forEach(function (sk, i) {
      var at = Math.min(i * 3, pool.length);
      pool.splice(at, 0, { sk: sk, kind: 'learn' });
    });

    /* لا قسمان متتاليان من المجال نفسه ما أمكن */
    var out = [], lastDomain = null, guard = 0;
    while (pool.length && out.length < maxCards && guard++ < 500) {
      var idx = 0;
      if (lastDomain !== null) {
        var alt = -1;
        for (var i2 = 0; i2 < pool.length; i2++) {
          if (pool[i2].sk.domain !== lastDomain) { alt = i2; break; }
        }
        if (alt !== -1) idx = alt;
      }
      var it = pool.splice(idx, 1)[0];
      out.push(it);
      lastDomain = it.sk.domain;
    }
    return { rest: false, cards: out, finalWeek: ph.finalWeek, daysLeft: ph.daysLeft };
  }

  /* النتيجة بعد كل بطاقة */
  function grade(state, skillId, ok, slow, today, isRetry) {
    var rec = S().skill(skillId);
    if (!rec.intro) rec.intro = today;
    rec.hist = rec.hist || [];

    if (ok && !slow && !isRetry) {
      if (rec.lastUp !== today && rec.box < MAX_BOX) rec.box = Math.min(MAX_BOX, Math.max(1, rec.box) + 1);
      else rec.box = Math.max(1, rec.box);
      rec.lastUp = today;
      rec.due = S().addDays(today, INTERVALS[rec.box - 1]);
      rec.wrongStreak = 0;
      rec.streakRight = (rec.streakRight || 0) + 1;
    } else if (ok && slow && !isRetry) {
      rec.box = Math.max(1, rec.box);
      rec.due = S().addDays(today, 2);           /* صحيحة لكن بطيئة: نفس الصندوق، بعد يومين */
      rec.wrongStreak = 0;
      rec.streakRight = (rec.streakRight || 0) + 1;
    } else if (!ok) {
      rec.box = 1;
      rec.due = S().addDays(today, 1);
      rec.wrongStreak = (rec.wrongStreak || 0) + 1;
      rec.streakRight = 0;
    } else {
      /* إعادة ناجحة داخل الجلسة: تبقى في الصندوق ١ */
      rec.box = 1;
      rec.due = S().addDays(today, 1);
    }

    /* المستوى للمهارات المولَّدة */
    if (MW.Gen && MW.Gen.skills.indexOf(skillId) !== -1 && !isRetry) {
      if (ok) { if (rec.streakRight >= 2) { rec.level = Math.min(3, (rec.level || 1) + 1); rec.streakRight = 0; } }
      else rec.level = Math.max(1, (rec.level || 1) - 1);
    }

    rec.hist.push({ d: today, ok: !!ok, slow: !!slow, retry: !!isRetry });
    if (rec.hist.length > 60) rec.hist = rec.hist.slice(-60);
    S().save();
    return rec;
  }

  function markSeen(skillId, qid, today, isPicture) {
    var rec = S().skill(skillId);
    rec.seen = rec.seen || {};
    rec.seen[qid] = today;
    rec.lastWasPicture = !!isPicture;
    S().save();
  }

  /* بعد اختبار: كل مهارة أخطأت فيها تصبح مستحقّة غداً ومستوى أقل */
  function afterExam(state, wrongSkillIds, today) {
    var n = 0;
    wrongSkillIds.forEach(function (id) {
      var rec = S().skill(id);
      rec.box = Math.max(1, 1);
      rec.due = S().addDays(today, 1);
      rec.level = Math.max(1, (rec.level || 1) - 1);
      if (!rec.intro) rec.intro = today;
      n++;
    });
    S().save();
    return n;
  }

  MW.Sched = { plan: plan, grade: grade, markSeen: markSeen, afterExam: afterExam,
               phase: phase, INTERVALS: INTERVALS, weakness: weakness, isDue: isDue };
})(window);
