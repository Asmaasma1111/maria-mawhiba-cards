/* parent.js — إعدادات، اختبارات، سجلّ، جدول مهارات، نسخ احتياطي. */
(function (g) {
  'use strict';
  var MW = g.MW, S = MW.Store, Bank = MW.Bank, Sched = MW.Sched;
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function mins(ms) { return S.arD(Math.round(ms / 60000)) + ' د'; }
  var state;

  function fillSettings() {
    var st = state.settings;
    $('#testDate').value = st.testDate || '';
    $('#cards').value = st.cardsPerSession || 8;
    $('#mins').value = st.minutesPerSession || 7;
    $('#starT').value = st.starTarget || 50;
    $('#prize').value = st.prizeName || '';
    $('#ovr').value = S.getOverride() || '';
  }

  function renderHistory() {
    var ex = state.exams || [];
    var doms = Bank.domains();
    if (!ex.length) { $('#history').innerHTML = '<p class="muted">لا اختبارات بعد.</p>'; $('#chart').innerHTML = ''; return; }
    $('#history').innerHTML = '<table><thead><tr><th>التاريخ</th><th>الدرجة</th>' +
      Object.keys(doms).map(function (k) { return '<th>' + esc(doms[k].split(' ')[0]) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + ex.slice().reverse().map(function (a) {
        return '<tr><td>' + esc(S.arDate(a.date)) + '</td><td><b>' + S.arD(a.score) + '</b>/' + S.arD(a.total) + '</td>' +
          Object.keys(doms).map(function (k) {
            var d = (a.byDomain || {})[k] || { s: 0, t: 0 };
            return '<td>' + S.arD(d.s) + '/' + S.arD(d.t) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    $('#chart').innerHTML = lineChart(ex);
  }

  /* منحنى مرسوم بـ SVG، الزمن من اليمين إلى اليسار */
  function lineChart(ex) {
    var W = 680, H = 200, mT = 18, mB = 34, mR = 46, mL = 18;
    var pw = W - mR - mL, ph = H - mT - mB;
    var maxY = 64, n = ex.length;
    var step = n > 1 ? pw / (n - 1) : 0;
    var x = function (i) { return W - mR - (n > 1 ? i * step : pw / 2); };
    var y = function (v) { return mT + ph - (v / maxY) * ph; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="الدرجات عبر الوقت">';
    [0, 16, 32, 48, 64].forEach(function (v) {
      s += '<line x1="' + mL + '" y1="' + y(v) + '" x2="' + (W - mR) + '" y2="' + y(v) +
           '" stroke="#ece3ea" stroke-width="1"/>' +
           '<text x="' + (W - mR + 8) + '" y="' + (y(v) + 4) + '" font-size="12" fill="#7b6f87">' + S.arD(v) + '</text>';
    });
    if (n > 1) s += '<polyline points="' + ex.map(function (a, i) {
      return x(i) + ',' + y(Math.round(a.score / a.total * 64)); }).join(' ') +
      '" fill="none" stroke="#cf5a8c" stroke-width="3" stroke-linejoin="round"/>';
    ex.forEach(function (a, i) {
      var v = Math.round(a.score / a.total * 64);
      s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="5" fill="#fff" stroke="#cf5a8c" stroke-width="3"/>' +
           '<text x="' + x(i) + '" y="' + (y(v) - 11) + '" font-size="12" font-weight="700" fill="#cf5a8c" text-anchor="middle">' +
           S.arD(a.score) + '</text>';
    });
    return s + '</svg>';
  }

  function renderSkills() {
    var list = Bank.skillList(), doms = Bank.domains(), today = S.today();
    var rows = list.map(function (sk) {
      var r = state.skills[sk.id] || { box: 0, level: 1, hist: [] };
      var h = (r.hist || []).slice(-5);
      return { sk: sk, r: r, w: Sched.weakness(r), h: h };
    }).sort(function (a, b) { return b.w - a.w; });

    $('#skillsTable').innerHTML = '<table><thead><tr><th>المهارة</th><th>المجال</th><th>الصندوق</th>' +
      '<th>المستوى</th><th>آخر ٥</th><th>مستحقّة</th></tr></thead><tbody>' +
      rows.map(function (x) {
        var marks = x.h.map(function (e) { return e.ok ? '●' : '○'; }).join(' ') || '—';
        var due = x.r.box === 0 ? 'لم تبدأ'
                : (S.daysBetween(x.r.due, today) >= 0 ? 'الآن' : S.arDate(x.r.due));
        return '<tr><td>' + esc(x.sk.name) + '</td><td>' + esc(doms[x.sk.domain].split(' ')[0]) + '</td>' +
          '<td>' + (x.r.box ? S.arD(x.r.box) : '—') + '</td>' +
          '<td>' + (x.sk.source === 'both' ? S.arD(x.r.level || 1) : '—') + '</td>' +
          '<td style="letter-spacing:3px;color:var(--green-deep)">' + marks + '</td>' +
          '<td>' + esc(due) + '</td></tr>';
      }).join('') + '</tbody></table>';

    /* تحذيرات إعادة الأسئلة المؤلّفة */
    var rep = {};
    (state.repeats || []).forEach(function (x) { rep[x.skill] = (rep[x.skill] || 0) + 1; });
    var keys = Object.keys(rep);
    $('#warnings').innerHTML = keys.length
      ? keys.map(function (k) {
          var sk = Bank.skillById(k);
          return '<div class="warn">نفدت الأسئلة الجديدة في «' + esc(sk ? sk.name : k) +
                 '» وأُعيد استعمال أسئلة سابقة (' + S.arD(rep[k]) + ' مرة).</div>'; }).join('')
      : '';
  }

  function render() {
    state = S.load();
    fillSettings(); renderHistory(); renderSkills();
    $('#dressNote').textContent = state.dressDone
      ? 'البروفة النهائية أُجريت بالفعل.'
      : 'البروفة النهائية هي النموذج المحفوظ، وتُجرى مرة واحدة فقط.';
    $('#exDress').disabled = !!state.dressDone;
  }

  document.addEventListener('DOMContentLoaded', function () {
    Bank.load().then(function () {
      render();
      $('#saveSet').onclick = function () {
        state.settings.testDate = $('#testDate').value || '';
        state.settings.cardsPerSession = Math.max(4, Math.min(20, +$('#cards').value || 8));
        state.settings.minutesPerSession = Math.max(3, Math.min(30, +$('#mins').value || 7));
        state.settings.starTarget = Math.max(10, Math.min(300, +$('#starT').value || 50));
        state.settings.prizeName = $('#prize').value.trim();
        S.save(); fillSettings();
        $('#setMsg').textContent = 'حُفظت.';
      };
      $('#exShort').onclick = function () { location.href = 'exam.html?kind=short'; };
      $('#exFull').onclick = function () { location.href = 'exam.html?kind=full'; };
      $('#exDress').onclick = function () {
        if (confirm('البروفة النهائية تُجرى مرة واحدة فقط. هل نبدأ؟')) location.href = 'exam.html?kind=dress';
      };
      $('#bkp').onclick = function () {
        var blob = new Blob([S.backup()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'maria-mawhiba-' + S.today() + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        $('#bkMsg').textContent = 'نُزّلت النسخة.';
      };
      $('#rst').onchange = function () {
        var f = this.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try { S.restore(String(fr.result)); $('#bkMsg').textContent = 'استُعيدت النسخة.'; render(); }
          catch (e) { $('#bkMsg').textContent = 'تعذّرت الاستعادة: ' + e.message; }
        };
        fr.readAsText(f, 'utf-8');
      };
      $('#rset').onclick = function () {
        if (!confirm('مسح كل تقدّم ماريا؟')) return;
        if (!confirm('متأكّدة تماماً؟ لا يمكن التراجع.')) return;
        S.reset(); render(); $('#bkMsg').textContent = 'مُسح كل شيء.';
      };
      $('#ovrSet').onclick = function () { S.setOverride($('#ovr').value || null); render(); };
      $('#ovrClr').onclick = function () { S.setOverride(null); $('#ovr').value = ''; render(); };
    });
  });
})(window);
