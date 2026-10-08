/* store.js — الحالة والتخزين المحلي. كل قراءة وكتابة داخل try/catch. */
(function (g) {
  'use strict';
  var KEY = 'maria.mawhiba.v1';
  var AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  function arD(v) { return String(v).replace(/[0-9]/g, function (c) { return AR[+c]; }); }

  /* تاريخ اليوم، مع إمكان تجاوزه للاختبار: ?today=2026-11-01 */
  var override = null;
  try {
    var p = new URLSearchParams(location.search).get('today');
    if (p) { override = p; localStorage.setItem('maria.dateOverride', p); }
    else { override = localStorage.getItem('maria.dateOverride'); }
  } catch (e) {}
  function setOverride(d) {
    override = d || null;
    try { d ? localStorage.setItem('maria.dateOverride', d) : localStorage.removeItem('maria.dateOverride'); }
    catch (e) {}
  }
  function todayStr() {
    if (override) return override;
    var n = new Date();
    return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function addDays(ds, k) {
    var p2 = ds.split('-').map(Number);
    var d = new Date(p2[0], p2[1] - 1, p2[2] + k);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function daysBetween(a, b) {
    var pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function arDate(ds) {
    try {
      var p3 = ds.split('-').map(Number);
      return new Intl.DateTimeFormat('ar-u-ca-gregory-nu-arab',
        { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(p3[0], p3[1] - 1, p3[2]));
    } catch (e) { return ds; }
  }

  function blank() {
    return {
      v: 1,
      settings: { testDate: '', cardsPerSession: 8, minutesPerSession: 7,
                  starTarget: 50, prizeName: '' },
      skills: {},                 /* id -> {box, level, due, intro, hist[], seen{}, wrongStreak, lastUp} */
      stars: { total: 0, today: 0, todayDate: '', cycleStart: 0 },
      exams: [],
      dressDone: false,
      repeats: []                 /* {skill, date} عند إعادة سؤال مؤلّف */
    };
  }

  var state = null;
  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : blank();
    } catch (e) { state = blank(); }
    if (!state || state.v !== 1) state = blank();
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }
  function reset() { state = blank(); save(); }

  function skill(id) {
    var s = load();
    if (!s.skills[id]) {
      s.skills[id] = { box: 0, level: 1, due: '', intro: '', hist: [], seen: {},
                       wrongStreak: 0, lastUp: '', streakRight: 0 };
    }
    return s.skills[id];
  }

  /* نجوم اليوم تُصفَّر مع تغيّر التاريخ */
  function stars() {
    var s = load();
    if (s.stars.todayDate !== todayStr()) { s.stars.todayDate = todayStr(); s.stars.today = 0; save(); }
    return s.stars;
  }
  function addStar() {
    var st = stars();
    st.today++; st.total++;
    save();
    return st;
  }

  function backup() {
    return JSON.stringify({ app: 'maria-mawhiba-cards', exported: todayStr(), data: load() }, null, 2);
  }
  function restore(text) {
    var o = JSON.parse(text);
    var d = o && o.data ? o.data : o;
    if (!d || !d.settings || !d.skills) throw new Error('ملف غير صالح.');
    state = d; state.v = 1; save();
  }

  g.MW = g.MW || {};
  g.MW.Store = { load: load, save: save, reset: reset, skill: skill, stars: stars,
                 addStar: addStar, backup: backup, restore: restore,
                 today: todayStr, addDays: addDays, daysBetween: daysBetween,
                 arDate: arDate, arD: arD, setOverride: setOverride,
                 getOverride: function () { return override; } };
})(window);
