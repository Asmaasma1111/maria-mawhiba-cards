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
    ['v-home','v-testconfirm','v-card','v-done'].forEach(function (v) {
      $('#' + v).hidden = (v !== id);
    });
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

    var btn = $('#goRevision'), choices = $('#choices'), rest = $('#restmsg');
    if (ph.rest) {
      choices.hidden = true; rest.hidden = false;
      rest.textContent = ph.daysLeft === 0
        ? 'اليوم اختبارك. بالتوفيق يا ماريا.'
        : 'غداً اختبارك. اليوم راحة — لا بطاقات.';
    } else {
      choices.hidden = false; rest.hidden = true;
      var p = Sched.plan(state, today, state.settings.cardsPerSession || 8);
      btn.disabled = p.cards.length === 0;
      btn.querySelector('.bigs').textContent = p.cards.length === 0
        ? 'أنهيتِ بطاقات اليوم. عودي غداً.'
        : 'بطاقات بلا وقت. خمّني، ثم اكشفي الإجابة.';
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
    renderPips();
    /* بطاقة واحدة فقط: سؤال، ثم تخمين، ثم كشف. لا مثال محلول قبل التفكير. */
    renderPractice(sk, isRetry, item.kind === 'learn');
  }

  function renderPips() {
    var n = sess.total, d = sess.done;
    var out = '';
    /* أسماء مقيّدة بالنقطة نفسها حتى لا تصطدم بأصناف التخطيط العامة */
    for (var i = 0; i < n; i++) {
      out += '<span class="pip' + (i < d ? ' pip--done' : (i === d ? ' pip--now' : '')) + '"></span>';
    }
    $('#pips').innerHTML = out;
  }

  /* ---------- بطاقة التدريب ---------- */
  function renderPractice(sk, isRetry, isNew) {
    var level = isNew || isRetry ? 1 : (S.skill(sk.id).level || 1);
    var got = Bank.nextQuestion(sk.id, state, { level: level, bank: 'revision' });
    if (!got) { sess.done++; return nextCard(); }
    var q = got.q;
    if (got.exhausted && !got.generated) {
      state.repeats.push({ skill: sk.id, date: sess.today });
      if (state.repeats.length > 80) state.repeats = state.repeats.slice(-80);
      S.save();
    }
    var isShapes = !!q.optionShapes;
    var hasOptions = !!(q.optionShapes || q.options);
    var n = hasOptions ? (q.optionShapes || q.options).length : 0;
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
      (isNew ? '<p class="newskill">مهارة جديدة · ' + esc(sk.name) + '</p>' : '') +
      (q.passage ? '<section class="passage"><h3>' + esc(q.passage.title) + '</h3><p>' +
                   esc(q.passage.text) + '</p></section>' : '') +
      '<p class="prompt">' + esc(q.prompt) + '</p>' +
      (q.stimulus ? MW.Shapes.stimulus(q.stimulus) : '') +
      opts +
      (hasOptions ? '' : '<p class="sayaloud">قولي إجابتك بصوتك، ثم اكشفي.</p>') +
      '<div id="fb"></div>' +
      '<div class="rowbtns" id="actions">' +
      '<button class="btn reveal" id="reveal"' + (hasOptions ? ' disabled' : '') + '>أظهري الإجابة</button>' +
      '<button class="btn soft" id="skip" hidden>تجاوزي؟</button>' +
      '</div>' +
      '</div>';

    var started = Date.now(), target = (sk.targetSeconds || 75) * 1000;
    var answered = false, guess = null;
    $('#tfill').style.height = '0%';
    $('#tdot').classList.remove('over');
    tick = setInterval(function () {
      var el = Date.now() - started;
      $('#tfill').style.height = Math.min(100, el / target * 100) + '%';
      if (el >= target) { $('#tdot').classList.add('over'); $('#skip').hidden = false; }
    }, 1000);

    /* التخمين: نُبرز اختيارها فقط، بلا أيّ إشارة إلى الصواب */
    function pick(i) {
      if (answered) return;
      guess = i;
      Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b, idx) {
        b.classList.toggle('picked', idx === i);
      });
      $('#reveal').disabled = false;
    }

    function settle(skipped) {
      if (answered) return;
      if (!skipped && hasOptions && guess === null) return;   /* لا كشف قبل التخمين */
      answered = true;
      clearInterval(tick); tick = null;
      var ms = Date.now() - started;
      var slow = ms > target;
      var choice = skipped ? -1 : (hasOptions ? guess : -2);
      var ok = hasOptions ? (choice === q.answer) : null;

      Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b, idx) {
        b.disabled = true;
        b.classList.remove('picked');
        if (idx === q.answer) b.classList.add('right');
        else if (idx === choice) b.classList.add('wrongpick');
        else b.classList.add('dim');
      });

      Sched.markSeen(sk.id, q.id, sess.today, got.isPicture);
      var counted = ok === null ? true : ok;          /* بلا خيارات: تُحتسب صحيحة */
      Sched.grade(state, sk.id, counted && !skipped, slow, sess.today, !!isRetry);
      if (counted && !skipped) { sess.stars++; S.addStar(); }
      if ((!counted || skipped) && !isRetry) sess.retries.push({ sk: sk, kind: 'practice' });

      var head = skipped ? 'تجاوزتِ هذا السؤال.'
               : ok === null ? 'هذه هي الإجابة.'
               : (ok ? 'أحسنتِ، إجابتك صحيحة.' : 'إجابتك ليست الصحيحة.');
      var correctText = hasOptions
        ? (isShapes ? 'الإجابة الصحيحة هي ' + AR_L[q.answer]
                    : 'الإجابة الصحيحة: ' + esc(q.options[q.answer]))
        : '';
      $('#fb').innerHTML = '<div class="feedback ' + (ok === false || skipped ? 'soft' : 'good') + '">' +
        '<p class="why">' + head + '</p>' +
        (correctText ? '<p class="correct">' + correctText + '</p>' : '') +
        '<p class="trick">' + esc(q.explain) + '</p>' +
        '<p class="trick">' + esc(sk.trickLine) + '</p></div>';
      $('#actions').innerHTML = '<button class="btn go" id="cont">تابعي</button>';
      $('#cont').onclick = function () { sess.done++; nextCard(); };
    }

    Array.prototype.forEach.call(document.querySelectorAll('.opt'), function (b) {
      b.onclick = function () { pick(+b.getAttribute('data-i')); };
    });
    $('#reveal').onclick = function () { settle(false); };
    $('#skip').onclick = function () { settle(true); };
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
    $('#goRevision').onclick = startSession;
    $('#goTest').onclick = function () { show('v-testconfirm'); };
    $('#examStart').onclick = function () { location.href = 'exam.html?kind=full'; };
    $('#examBack').onclick = renderHome;
    $('#doneHome').onclick = renderHome;
    Bank.load().then(function () { renderHome(); })
      .catch(function (e) {
        document.body.innerHTML = '<div class="wrap"><p>تعذّر تحميل الأسئلة. افتحي الصفحة عبر الإنترنت مرة واحدة أولاً.</p></div>';
      });
  });
})(window);
