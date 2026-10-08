/* session.js — شاشة ماريا: زرّ واحد، ثم بطاقات، ثم نجوم. */
(function (g) {
  'use strict';
  var MW = g.MW, S = MW.Store, Bank = MW.Bank, Sched = MW.Sched;
  var AR_L = ['أ','ب','ج','د'];
  var state, sess = null, tick = null;

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function show(id) {
    ['v-home','v-card','v-done'].forEach(function (v) { $('#' + v).hidden = (v !== id); });
    window.scrollTo(0, 0);
  }

  /* ---------- الرئيسية ---------- */
  function renderHome() {
    state = S.load();
    var today = S.today();
    var ph = Sched.phase(state, today);
    var st = S.stars();

    $('#starsToday').textContent = S.arD(st.today);
    var target = state.settings.starTarget || 50;
    var inCycle = st.total - (st.cycleStart || 0);
    $('#starfill').style.width = Math.min(100, Math.round(inCycle / target * 100)) + '%';
    $('#prizeline').textContent = state.settings.prizeName
      ? S.arD(inCycle) + ' من ' + S.arD(target) + ' نحو: ' + state.settings.prizeName
      : S.arD(inCycle) + ' من ' + S.arD(target) + ' نجمة';

    /* الشارات: المهارة تُحتسب عند بلوغ الصندوق ٤ */
    var doms = Bank.domains();
    var list = Bank.skillList();
    $('#badges').innerHTML = Object.keys(doms).map(function (k) {
      var inDom = list.filter(function (s0) { return s0.domain === k; });
      var got = inDom.filter(function (s0) { return (state.skills[s0.id] || {}).box >= 4; }).length;
      var pct = inDom.length ? got / inDom.length : 0;
      var nm = doms[k].split(' ')[0] + (doms[k].indexOf('الرياضي') > -1 ? ' الرياضي' : '');
      return '<div class="badge' + (pct >= 1 ? ' full' : '') + '">' +
        '<div class="fillbg" style="transform:scaleY(' + pct.toFixed(2) + ')"></div>' +
        '<span>' + esc(shortName(doms[k])) + '<br>' + S.arD(got) + '/' + S.arD(inDom.length) + '</span></div>';
    }).join('');

    var btn = $('#start'), rest = $('#restmsg');
    if (ph.rest) {
      btn.hidden = true; rest.hidden = false;
      rest.textContent = ph.daysLeft === 0
        ? 'اليوم اختبارك. بالتوفيق يا ماريا.'
        : 'غداً اختبارك. اليوم راحة — لا بطاقات.';
    } else {
      btn.hidden = false; rest.hidden = true;
      var p = Sched.plan(state, today, state.settings.cardsPerSession || 8);
      btn.disabled = p.cards.length === 0;
      btn.textContent = p.cards.length === 0 ? 'أنهيتِ اليوم' : 'تدرّبي اليوم';
    }
    show('v-home');
  }
  function shortName(d) {
    if (d.indexOf('اللغوي') > -1) return 'لغوي';
    if (d.indexOf('الرياضي') > -1) return 'رياضي';
    if (d.indexOf('العلمي') > -1) return 'علمي';
    return 'مرونة';
  }

  /* ---------- بدء الجلسة ---------- */
  function startSession() {
    state = S.load();
    var today = S.today();
    var plan = Sched.plan(state, today, state.settings.cardsPerSession || 8);
    if (!plan.cards.length) return;
    sess = { queue: plan.cards.slice(), i: 0, stars: 0, today: today,
             endAt: Date.now() + (state.settings.minutesPerSession || 7) * 60000,
             retries: [], done: 0, total: plan.cards.length };
    nextCard();
  }

  function sessionShouldEnd() {
    if (!sess) return true;
    if (sess.queue.length === 0) return true;
    if (Date.now() >= sess.endAt && sess.done > 0) return true;
    return false;
  }

  function nextCard() {
    if (tick) { clearInterval(tick); tick = null; }
    if (sessionShouldEnd()) {
      /* قبل النهاية: أعيدي المهارات التي أخطأت فيها حتى تنتهي على نجاح */
      if (sess && sess.retries.length) { var r = sess.retries.shift(); return renderCard(r, true); }
      return finish();
    }
    var item = sess.queue.shift();
    renderCard(item, false);
  }

  function renderCard(item, isRetry) {
    var sk = item.sk;
    var rec = S.skill(sk.id);
    var learn = item.kind === 'learn' || (rec.wrongStreak >= 2 && !isRetry);
    renderPips();
    if (learn) return renderLearn(sk, item);
    renderPractice(sk, isRetry);
  }

  function renderPips() {
    var n = sess.total, d = sess.done;
    var out = '';
    for (var i = 0; i < n; i++) out += '<span class="pip' + (i < d ? ' done' : (i === d ? ' now' : '')) + '"></span>';
    $('#pips').innerHTML = out;
  }

  /* ---------- بطاقة التعلّم ---------- */
  function renderLearn(sk, item) {
    var ex = Bank.question(sk.workedExample);
    $('#tdot').hidden = true;
    $('#cardbody').innerHTML =
      '<div class="card learn">' +
      '<p class="kicker">مهارة جديدة</p>' +
      '<h1 style="font-size:25px;margin:0 0 14px">' + esc(sk.name) + '</h1>' +
      '<p class="trickbig">' + esc(sk.trickLine) + '</p>' +
      '<div class="example"><p class="lab">مثال</p>' +
      '<p style="font-size:21px;margin:0 0 8px">' + esc(ex.prompt) + '</p>' +
      (ex.stimulus ? MW.Shapes.stimulus(ex.stimulus) : '') +
      '<p style="margin:0">الإجابة: <span class="ans">' + exAnswer(ex) + '</span></p>' +
      '<p style="margin:6px 0 0;color:var(--ink-2);font-size:17px">' + esc(ex.explain) + '</p>' +
      '</div>' +
      '<div class="rowbtns"><button class="btn go" id="learnGo">جرّبي سؤالاً</button></div>' +
      '</div>';
    $('#learnGo').onclick = function () { renderPractice(sk, false, true); };
    show('v-card');
  }
  function exAnswer(ex) {
    if (ex.optionShapes) return MW.Shapes.svg(ex.optionShapes[ex.answer], 'shape') .replace('class="shape', 'style="width:46px;height:46px;display:inline-block;vertical-align:middle" class="shape');
    return esc(ex.options[ex.answer]);
  }

  /* ---------- بطاقة التدريب ---------- */
  function renderPractice(sk, isRetry, afterLearn) {
    var level = afterLearn || isRetry ? 1 : (S.skill(sk.id).level || 1);
    var got = Bank.nextQuestion(sk.id, state, { level: level });
    if (!got) { sess.done++; return nextCard(); }
    var q = got.q;
    if (got.exhausted && !got.generated) {
      state.repeats.push({ skill: sk.id, date: sess.today });
      if (state.repeats.length > 80) state.repeats = state.repeats.slice(-80);
      S.save();
    }
    var isShapes = !!q.optionShapes;
    var n = (q.optionShapes || q.options).length;
    var opts = '<div class="opts ' + (isShapes ? 'shapes' : 'texts') + '">';
    for (var i = 0; i < n; i++) {
      opts += '<button class="opt" data-i="' + i + '">' +
        '<span class="l">' + AR_L[i] + '</span><span class="b">' +
        (isShapes ? MW.Shapes.svg(q.optionShapes[i]) : esc(q.options[i])) +
        '</span></button>';
    }
    opts += '</div>';

    $('#tdot').hidden = false;
    $('#cardbody').innerHTML =
      '<div class="card">' +
      (q.passage ? '<section class="passage"><h3>' + esc(q.passage.title) + '</h3><p>' +
                   esc(q.passage.text) + '</p></section>' : '') +
      '<p class="prompt">' + esc(q.prompt) + '</p>' +
      (q.stimulus ? MW.Shapes.stimulus(q.stimulus) : '') +
      opts +
      '<div id="fb"></div>' +
      '<div class="rowbtns" id="actions"><button class="btn soft" id="skip" hidden>تجاوزي؟</button></div>' +
      '</div>';

    var started = Date.now(), target = (sk.targetSeconds || 75) * 1000, answered = false;
    $('#tfill').style.height = '0%';
    $('#tdot').classList.remove('over');
    tick = setInterval(function () {
      var el = Date.now() - started;
      $('#tfill').style.height = Math.min(100, el / target * 100) + '%';
      if (el >= target) { $('#tdot').classList.add('over'); $('#skip').hidden = false; }
    }, 1000);

    function settle(choice) {
      if (answered) return;
      answered = true;
      clearInterval(tick); tick = null;
      var ms = Date.now() - started;
      var slow = ms > target;
      var ok = choice === q.answer;

      Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b, idx) {
        b.disabled = true;
        if (idx === q.answer) b.classList.add('right');
        else if (idx === choice) b.classList.add('wrongpick');
        else b.classList.add('dim');
      });

      Sched.markSeen(sk.id, q.id, sess.today, got.isPicture);
      Sched.grade(state, sk.id, ok, slow, sess.today, !!isRetry);
      if (ok) { sess.stars++; S.addStar(); }
      if (!ok && !isRetry) sess.retries.push({ sk: sk, kind: 'practice' });

      $('#fb').innerHTML = '<div class="feedback ' + (ok ? 'good' : 'soft') + '">' +
        '<p class="why">' + (ok ? 'أحسنتِ. ' : '') + esc(q.explain) + '</p>' +
        '<p class="trick">' + esc(sk.trickLine) + '</p></div>';
      $('#actions').innerHTML = '<button class="btn go" id="cont">تابعي</button>';
      $('#cont').onclick = function () { sess.done++; nextCard(); };
    }

    Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b) {
      b.onclick = function () { settle(+b.getAttribute('data-i')); };
    });
    $('#skip').onclick = function () { settle(-1); };
    show('v-card');
  }

  /* ---------- النهاية ---------- */
  function finish() {
    if (tick) { clearInterval(tick); tick = null; }
    var st = S.stars();
    $('#doneStars').textContent = S.arD(sess ? sess.stars : 0);
    var target = state.settings.starTarget || 50;
    var inCycle = st.total - (state.stars.cycleStart || 0);
    var cel = $('#celebrate');
    if (inCycle >= target) {
      cel.hidden = false;
      cel.innerHTML = '🎉 وصلتِ إلى ' + S.arD(target) + ' نجمة!' +
        (state.settings.prizeName ? '<br>' + esc(state.settings.prizeName) : '');
      state.stars.cycleStart = st.total;
      S.save();
    } else cel.hidden = true;
    sess = null;
    show('v-done');
  }

  /* ---------- الضغط المطوّل للوحة وليّ الأمر ---------- */
  function wireGear() {
    var t = null, el = $('#gear');
    function down() { t = setTimeout(function () { location.href = 'parent.html'; }, 2000); }
    function up() { if (t) { clearTimeout(t); t = null; } }
    el.addEventListener('pointerdown', down);
    ['pointerup','pointerleave','pointercancel'].forEach(function (e) { el.addEventListener(e, up); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireGear();
    $('#start').onclick = startSession;
    $('#doneHome').onclick = renderHome;
    Bank.load().then(function () { renderHome(); })
      .catch(function (e) {
        document.body.innerHTML = '<div class="wrap"><p>تعذّر تحميل الأسئلة. افتحي الصفحة عبر الإنترنت مرة واحدة أولاً.</p></div>';
      });
  });
})(window);
