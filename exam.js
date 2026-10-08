/* exam.js — الاختبارات. قسم واحد على الشاشة، وعند انتهاء وقته يُغلق ولا يُفتح. */
(function (g) {
  'use strict';
  var MW = g.MW, S = MW.Store, Bank = MW.Bank, Sched = MW.Sched;
  var AR_L = ['أ','ب','ج','د'];
  var E = null, timer = null, last = 0;

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function mmss(ms) {
    if (ms < 0) ms = 0;
    var t = Math.ceil(ms / 1000), m = Math.floor(t / 60), s = t % 60;
    return S.arD((m < 10 ? '0' : '') + m) + ':' + S.arD((s < 10 ? '0' : '') + s);
  }
  function skillOfTopic(topic) {
    var l = Bank.skillList();
    for (var i = 0; i < l.length; i++) if (l[i].topics.indexOf(topic) !== -1) return l[i];
    return null;
  }

  /* ---------- التجميع ---------- */
  function assemble(kind, state) {
    if (kind === 'dress') {
      var ex = Bank.dressExam();
      return ex.blocks.map(function (b) {
        return { title: b.title, seconds: b.seconds, domain: b.domain,
                 questions: b.questions.map(function (q) {
                   var c = {}; for (var k in q) c[k] = q[k];
                   c.domain = b.domain;
                   if (b.passage) c.passage = b.passage;
                   return c; }) };
      });
    }
    var plan = Bank.blockPlan();
    if (kind === 'short') {
      /* قسم واحد من أربعة أسئلة في خمس دقائق، مجالات مختلطة */
      var picks = [], used = {};
      var doms = Object.keys(Bank.domains());
      doms.forEach(function (d) {
        var cands = plan.filter(function (b) { return b.domain === d; });
        if (!cands.length) return;
        var b = cands[Math.floor(Math.random() * cands.length)];
        var sk = skillOfTopic(b.topic);
        if (!sk || used[sk.id]) return;
        used[sk.id] = 1;
        var got = Bank.nextQuestion(sk.id, state, { avoidDays: 0 });
        if (got) { got.q.domain = sk.domain; got.q._skill = sk.id; picks.push(got.q); }
      });
      while (picks.length < 4) {
        var sk2 = Bank.skillList()[Math.floor(Math.random() * Bank.skillList().length)];
        var g2 = Bank.nextQuestion(sk2.id, state, { avoidDays: 0 });
        if (g2) { g2.q.domain = sk2.domain; g2.q._skill = sk2.id; picks.push(g2.q); }
      }
      return [{ title: 'اختبار قصير', seconds: 300, domain: 'mixed', questions: picks.slice(0, 4) }];
    }
    /* كامل: نفس خطة الأقسام */
    return plan.map(function (b) {
      var sk = skillOfTopic(b.topic);
      var qs = [];
      var pool = sk ? Bank.authoredFor(sk.id, state, 0).items.slice() : [];
      for (var i = 0; i < b.count; i++) {
        var q = null;
        if (sk && MW.Gen.skills.indexOf(sk.id) !== -1 && Math.random() < 0.5) {
          q = MW.Gen.make(sk.id, (state.skills[sk.id] || {}).level || 1, Math.floor(Math.random() * 1e9));
        }
        if (!q && pool.length) q = pool.shift();
        if (!q && sk) { var gq = Bank.nextQuestion(sk.id, state, { avoidDays: 0 }); q = gq && gq.q; }
        if (!q) continue;
        var c2 = {}; for (var k2 in q) c2[k2] = q[k2];
        c2.domain = b.domain; c2._skill = sk ? sk.id : null;
        qs.push(c2);
      }
      return { title: b.title, seconds: b.seconds, domain: b.domain, questions: qs };
    });
  }

  /* ---------- التشغيل ---------- */
  function start(kind) {
    var state = S.load();
    if (kind === 'dress' && state.dressDone) {
      alert('البروفة النهائية تُجرى مرة واحدة فقط، وقد أُجريت.');
      return;
    }
    var blocks = assemble(kind, state);
    E = { kind: kind, blocks: blocks, bi: 0, qi: 0, answers: {}, flags: {},
          used: blocks.map(function () { return 0; }),
          rem: blocks.map(function (b) { return b.seconds * 1000; }),
          closed: blocks.map(function () { return false; }),
          startedAt: S.today(), total: blocks.reduce(function (n, b) { return n + b.questions.length; }, 0) };
    last = Date.now();
    timer = setInterval(tickFn, 250);
    renderBlock();
  }

  function tickFn() {
    if (!E) return;
    var now = Date.now(), dt = now - last; last = now;
    E.rem[E.bi] -= dt; E.used[E.bi] += dt;
    if (E.rem[E.bi] <= 0) { E.rem[E.bi] = 0; closeBlock('timeout'); return; }
    var el = $('#extime'); if (el) el.textContent = mmss(E.rem[E.bi]);
    var bar = $('#exbar');
    if (bar) bar.style.width = Math.max(0, E.rem[E.bi] / (E.blocks[E.bi].seconds * 1000) * 100) + '%';
    if (E.rem[E.bi] <= 60000) { var f = $('#exface'); if (f) f.classList.add('late'); }
  }

  function closeBlock(why) {
    if (!E || E.closed[E.bi]) return;
    E.closed[E.bi] = true;
    E.used[E.bi] = Math.min(E.used[E.bi], E.blocks[E.bi].seconds * 1000);
    if (E.bi < E.blocks.length - 1) {
      E.bi++; E.qi = 0; last = Date.now();
      renderBlock(why === 'timeout');
    } else finishExam();
  }

  function renderBlock(announce) {
    var b = E.blocks[E.bi];
    $('#exroot').innerHTML =
      '<div class="cardtop" style="justify-content:space-between">' +
      '<div><div style="font-weight:700">' + esc(b.title) + '</div>' +
      '<div class="muted" style="font-size:15px">القسم ' + S.arD(E.bi + 1) + ' من ' + S.arD(E.blocks.length) + '</div></div>' +
      '<div id="exface" style="text-align:center"><div id="extime" style="font-size:26px;font-weight:700">' +
      mmss(E.rem[E.bi]) + '</div>' +
      '<div style="height:5px;background:var(--line);border-radius:3px;width:120px;overflow:hidden">' +
      '<span id="exbar" style="display:block;height:100%;background:var(--green-deep);width:100%"></span></div></div>' +
      '</div>' +
      (announce ? '<div class="wrap" style="padding-bottom:0"><div class="warn">انتهى وقت القسم السابق وأُغلق.</div></div>' : '') +
      '<div class="wrap"><div id="exstrip" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"></div>' +
      '<div id="exq"></div>' +
      '<div class="rowbtns"><button class="btn" id="exprev">السابق</button>' +
      '<button class="btn" id="exflag">علّمي</button>' +
      '<button class="btn" id="exnext">التالي</button>' +
      '<button class="btn go" id="exend" style="flex:none">أنهي القسم</button></div></div>';
    $('#exprev').onclick = function () { if (E.qi > 0) { E.qi--; renderQ(); } };
    $('#exnext').onclick = function () { if (E.qi < b.questions.length - 1) { E.qi++; renderQ(); } };
    $('#exflag').onclick = function () {
      var q = b.questions[E.qi]; E.flags[q.id] = !E.flags[q.id]; renderQ();
    };
    $('#exend').onclick = function () {
      if (confirm('إغلاق هذا القسم؟ لا يمكن العودة إليه.')) closeBlock('manual');
    };
    renderQ();
  }

  function renderQ() {
    var b = E.blocks[E.bi], q = b.questions[E.qi];
    if (!q) return;
    $('#exstrip').innerHTML = b.questions.map(function (qq, i) {
      var on = E.answers[qq.id] !== undefined;
      return '<button class="btn sm" data-i="' + i + '" style="min-width:46px;' +
        (i === E.qi ? 'border-color:var(--pink-deep);' : '') +
        (on ? 'background:var(--green-soft);' : '') + '">' + S.arD(i + 1) +
        (E.flags[qq.id] ? ' ⚑' : '') + '</button>';
    }).join('');
    Array.prototype.forEach.call($('#exstrip').querySelectorAll('button'), function (x) {
      x.onclick = function () { E.qi = +x.getAttribute('data-i'); renderQ(); };
    });
    var isShapes = !!q.optionShapes, n = (q.optionShapes || q.options).length, opts = '';
    for (var i = 0; i < n; i++) {
      opts += '<button class="opt' + (E.answers[q.id] === i ? ' right' : '') + '" data-o="' + i + '">' +
        '<span class="l">' + AR_L[i] + '</span><span class="b">' +
        (isShapes ? MW.Shapes.svg(q.optionShapes[i]) : esc(q.options[i])) + '</span></button>';
    }
    $('#exq').innerHTML = '<div class="card">' +
      (q.passage ? '<section class="passage"><h3>' + esc(q.passage.title) + '</h3><p>' +
                   esc(q.passage.text) + '</p></section>' : '') +
      '<p class="prompt">' + esc(q.prompt) + '</p>' +
      (q.stimulus ? MW.Shapes.stimulus(q.stimulus) : '') +
      '<div class="opts ' + (isShapes ? 'shapes' : 'texts') + '">' + opts + '</div></div>';
    Array.prototype.forEach.call($('#exq').querySelectorAll('.opt'), function (x) {
      x.onclick = function () { E.answers[q.id] = +x.getAttribute('data-o'); renderQ(); };
    });
  }

  /* ---------- النتيجة ---------- */
  function finishExam() {
    clearInterval(timer); timer = null;
    var state = S.load(), today = S.today();
    var score = 0, total = 0, byDom = {}, rows = [], wrongSkills = {};
    E.blocks.forEach(function (b, bi) {
      var bs = 0, un = 0;
      b.questions.forEach(function (q) {
        total++;
        var a = E.answers[q.id];
        var ok = a !== undefined && a === q.answer;
        if (a === undefined) un++;
        if (ok) { score++; bs++; }
        var d = q.domain || b.domain;
        byDom[d] = byDom[d] || { s: 0, t: 0 };
        byDom[d].t++; if (ok) byDom[d].s++;
        if (!ok && q._skill) wrongSkills[q._skill] = 1;
        if (!ok && !q._skill && q.topic) {
          var sk = skillOfTopic(q.topic); if (sk) wrongSkills[sk.id] = 1;
        }
      });
      rows.push({ title: b.title, score: bs, count: b.questions.length,
                  used: Math.round(E.used[bi]), seconds: b.seconds, unanswered: un });
    });
    var added = Sched.afterExam(state, Object.keys(wrongSkills), today);
    if (E.kind === 'dress') { state.dressDone = true; }
    state.exams.push({ date: today, kind: E.kind, score: score, total: total,
                       byDomain: byDom, blocks: rows });
    S.save();

    var doms = Bank.domains();
    $('#exroot').innerHTML = '<div class="wrap"><h1>النتيجة</h1>' +
      '<div class="panel" style="text-align:center">' +
      '<div style="font-size:58px;font-weight:700;color:var(--pink-deep)">' + S.arD(score) + '</div>' +
      '<div style="font-size:21px" class="muted">من ' + S.arD(total) + '</div></div>' +
      '<div class="panel"><h2>المجالات الأربعة</h2>' +
      Object.keys(doms).map(function (k) {
        var d = byDom[k] || { s: 0, t: 0 };
        var pct = d.t ? Math.round(d.s / d.t * 100) : 0;
        return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between">' +
          '<span>' + esc(doms[k]) + '</span><b>' + S.arD(d.s) + ' / ' + S.arD(d.t) + '</b></div>' +
          '<div style="height:10px;background:var(--line);border-radius:6px;overflow:hidden">' +
          '<span style="display:block;height:100%;background:var(--green-deep);width:' + pct + '%"></span></div></div>';
      }).join('') + '</div>' +
      '<div class="panel"><h2>الأقسام</h2><div class="scroll-x"><table><thead><tr>' +
      '<th>القسم</th><th>الدرجة</th><th>الزمن</th><th>بلا إجابة</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + esc(r.title) + '</td><td>' + S.arD(r.score) + '/' + S.arD(r.count) + '</td>' +
          '<td>' + mmss(r.used) + '</td><td><b>' + S.arD(r.unanswered) + '</b></td></tr>';
      }).join('') + '</tbody></table></div></div>' +
      '<div class="panel"><p style="margin:0">أُضيفت <b>' + S.arD(added) + '</b> مهارة إلى بطاقاتها لمراجعتها غداً.</p></div>' +
      '<div class="rowbtns"><a class="btn go" href="parent.html" style="text-decoration:none;text-align:center;line-height:44px">رجوع</a></div></div>';
    E = null;
  }

  /* خطّاف فحص مخفي: يُفرغ وقت القسم الحالي للتحقّق من إغلاقه عند الصفر */
  MW.Exam = { start: start,
              _drain: function () { if (E) E.rem[E.bi] = 1; },
              _state: function () { return E && { bi: E.bi, blocks: E.blocks.length,
                                                  closed: E.closed.slice(),
                                                  counts: E.blocks.map(function (b) { return b.questions.length; }) }; } };
})(window);
