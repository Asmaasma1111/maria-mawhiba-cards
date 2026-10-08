/* icons.js — رسوم أشياء مألوفة، مرسومة بخطوط بسيطة كي تُعرف من النظرة الأولى.
   كلها SVG أصلية: لا صور، ولا أيقونات منسوخة، وتعمل بلا إنترنت.
   تُستعمل في أسئلة العلاقات المصوّرة والتصنيف. */

(function (global) {
  'use strict';

  var I = 'var(--ink)', S = 'var(--navy-soft)', W = '#fff';

  function t(n, a, inner) {
    var s = '<' + n;
    for (var k in a) if (a[k] !== null && a[k] !== undefined) s += ' ' + k + '="' + a[k] + '"';
    return inner === undefined ? s + '/>' : s + '>' + inner + '</' + n + '>';
  }
  function p(d, fill, w) {
    return t('path', { d: d, fill: fill || 'none', stroke: I, 'stroke-width': w || 4,
                       'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
  function c(cx, cy, r, fill, w) {
    return t('circle', { cx: cx, cy: cy, r: r, fill: fill || 'none', stroke: I,
                         'stroke-width': w || 4 });
  }
  function r(x, y, w, h, rx, fill, sw) {
    return t('rect', { x: x, y: y, width: w, height: h, rx: rx || 3, fill: fill || 'none',
                       stroke: I, 'stroke-width': sw || 4 });
  }
  function ln(x1, y1, x2, y2, w) {
    return t('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: I, 'stroke-width': w || 4,
                       'stroke-linecap': 'round' });
  }

  var ICONS = {

    /* ---------- الجسم ---------- */
    ear: p('M62 20c-16-8-32 2-32 20 0 14 6 20 6 32 0 8 6 12 12 12s10-5 10-11c0-7-6-8-6-14 0-8 10-8 10-20 0-10-4-15-10-19z', W) +
         p('M46 40c4-5 12-3 12 5 0 6-6 7-6 13', null, 3.5),
    eye: p('M12 50c12-16 26-24 38-24s26 8 38 24c-12 16-26 24-38 24s-26-8-38-24z', W) + c(50, 50, 13, S) + c(50, 50, 5, I, 0),
    nose: p('M50 16v30c0 8-10 12-10 20 0 7 5 12 12 12h6c6 0 10-3 10-8', W) +
          p('M40 62c4 4 12 5 18 2', null, 3.5),
    hand: p('M32 60V34a6 6 0 0 1 12 0v18M44 52V26a6 6 0 0 1 12 0v26M56 52V32a6 6 0 0 1 12 0v24M68 56v-14a6 6 0 0 1 12 0v30c0 14-10 24-24 24H48c-12 0-16-8-22-16l-8-12a6 6 0 0 1 10-7l8 9', W),
    foot: p('M32 44c-6 12-8 22-8 30 0 10 6 16 16 16s16-6 16-16c0-8-2-18-8-30z', S) +
          c(28, 30, 7, S) + c(42, 22, 6, S) + c(54, 22, 5.5, S) + c(64, 26, 5, S) + c(72, 34, 4.5, S),

    /* ---------- ما يُلبَس ---------- */
    headphones: p('M20 62V50a30 30 0 0 1 60 0v12', null, 4.5) +
                r(10, 58, 18, 28, 8, S) + r(72, 58, 18, 28, 8, S),
    glasses: c(28, 54, 18, W) + c(72, 54, 18, W) + p('M46 52c3-4 5-4 8 0', null, 4) +
             ln(10, 46, 4, 40) + ln(90, 46, 96, 40),
    glove: p('M30 84V44a6 6 0 0 1 12 0v6V26a6 6 0 0 1 12 0v24V30a6 6 0 0 1 12 0v20V40a6 6 0 0 1 12 0v34c0 8-6 14-14 14H44c-8 0-14-6-14-14z', W) +
           ln(30, 74, 78, 74, 3),
    shoe: p('M14 68V44a4 4 0 0 1 4-4h14c4 0 6 3 8 6l8 12c4 5 10 8 18 9l14 2c6 1 10 5 10 11v4H18a4 4 0 0 1-4-4z', W) +
          ln(24, 40, 24, 62, 3) + ln(34, 46, 34, 62, 3),

    /* ---------- أدوات ---------- */
    hammer: p('M20 16h44v20H20z', S) + p('M20 20c-8 4-10 12-4 16l4-4', S) +
            p('M38 36h12v50a6 6 0 0 1-12 0z', W) + ln(38, 46, 50, 46, 3),
    nail: p('M28 22h44l-16 12v46l-6 10-6-10V34z', S),
    screwdriver: p('M18 82l14-14 10 10-14 14-12 4z', S) + p('M40 70l30-30 12 12-30 30z', W) +
                 p('M70 40l8-8a8 8 0 0 1 12 12l-8 8z', S),
    screw: c(50, 22, 14, S) + ln(42, 22, 58, 22, 4) +
           p('M40 36h20v34l-10 16-10-16z', W) +
           p('M40 44l20 6M40 56l20 6M42 68l16 6', null, 3),
    saw: p('M14 44h56l16 16H30z', S) + p('M70 44l14-10 8 8-12 14', W) +
         p('M30 60l8 8 8-8 8 8 8-8 8 8 8-8', null, 3),

    /* ---------- البيت ---------- */
    fridge: r(28, 10, 44, 80, 5, W) + ln(28, 42, 72, 42) + ln(62, 24, 62, 36, 4) + ln(62, 50, 62, 62, 4),
    washer: r(16, 12, 68, 76, 6, W) + c(50, 56, 22, S) + c(50, 56, 11, W) + ln(16, 30, 84, 30) + c(70, 21, 4, I, 0),
    shirt: p('M30 18l-16 10 8 16 8-5v43h40V39l8 5 8-16-16-10-10 6h-20z', W),
    apple: p('M50 30c-14-10-34-2-34 20 0 20 14 38 24 38 4 0 6-2 10-2s6 2 10 2c10 0 24-18 24-38 0-22-20-30-34-20z', S) +
           p('M50 30V16', null, 4) + p('M50 20c6-8 14-8 18-6-2 8-10 10-18 6z', W),
    cup: p('M24 30h44v34c0 12-8 20-22 20s-22-8-22-20z', W) + p('M68 40h8a10 10 0 0 1 0 20h-8', null, 4),
    plate: t('ellipse', { cx: 50, cy: 56, rx: 38, ry: 16, fill: W, stroke: I, 'stroke-width': 4 }) +
           t('ellipse', { cx: 50, cy: 54, rx: 24, ry: 9, fill: 'none', stroke: I, 'stroke-width': 3 }),
    key: c(28, 50, 16, W) + c(28, 50, 6, I, 0) + p('M44 50h40v10M70 50v10', null, 4.5),
    lock: r(22, 44, 56, 42, 6, W) + p('M34 44V32a16 16 0 0 1 32 0v12', null, 4.5) + c(50, 62, 6, I, 0) + ln(50, 66, 50, 74, 4),
    book: p('M16 20h28c4 0 6 2 6 6v56c0-4-2-6-6-6H16z', W) +
          p('M84 20H56c-4 0-6 2-6 6v56c0-4 2-6 6-6h28z', W) + ln(50, 26, 50, 82, 3),

    /* ---------- الطبيعة ---------- */
    tree: p('M50 12l22 30H60l16 24H24l16-24H28z', S) + p('M50 66v22M50 76l-10-8M50 80l10-8', null, 4),
    leaf: p('M78 18C40 18 20 38 20 62c0 10 6 18 14 18 24 0 44-22 44-62z', S) + p('M30 76C46 60 58 44 66 30', null, 3.5),
    sun: c(50, 50, 20, S) + (function () {
      var o = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        o += ln((50 + 28 * Math.cos(a)).toFixed(1), (50 + 28 * Math.sin(a)).toFixed(1),
                (50 + 38 * Math.cos(a)).toFixed(1), (50 + 38 * Math.sin(a)).toFixed(1), 4);
      }
      return o;
    })(),
    moon: p('M62 14a38 38 0 1 0 24 56A34 34 0 0 1 62 14z', S),
    cloud: p('M28 72a18 18 0 0 1 0-36 24 24 0 0 1 46-6 16 16 0 0 1-2 42z', W),

    /* ---------- الحيوانات ---------- */
    cat: p('M26 40l-4-20 18 10a34 34 0 0 1 20 0l18-10-4 20a30 30 0 1 1-48 0z', S) +
         c(38, 52, 3.5, I, 0) + c(62, 52, 3.5, I, 0) + p('M50 62l-5 4M50 62l5 4M50 62v-3', null, 3.5) +
         ln(18, 58, 34, 60, 2.5) + ln(66, 60, 82, 58, 2.5),
    dog: p('M30 34c0-10 6-16 20-16s20 6 20 16v6a26 26 0 0 1-40 22z', S) +
         p('M30 30c-10 0-14 8-14 18s6 14 12 12M70 30c10 0 14 8 14 18s-6 14-12 12', S) +
         c(40, 44, 3.5, I, 0) + c(60, 44, 3.5, I, 0) +
         t('ellipse', { cx: 50, cy: 58, rx: 7, ry: 5, fill: I }) + p('M50 63v6', null, 3),
    lion: (function () {
      var o = '';
      for (var i = 0; i < 10; i++) {
        var a = i * Math.PI / 5;
        o += c((50 + 26 * Math.cos(a)).toFixed(1), (50 + 26 * Math.sin(a)).toFixed(1), 11, S);
      }
      return o;
    })() + c(38, 32, 7, S) + c(62, 32, 7, S) + c(50, 50, 24, W) +
      c(42, 46, 3.5, I, 0) + c(58, 46, 3.5, I, 0) +
      t('ellipse', { cx: 50, cy: 58, rx: 6, ry: 4, fill: I }) +
      p('M50 62v5M50 67l-7 4M50 67l7 4', null, 3),
    fish: p('M78 50c-14-16-34-20-52-12l-8 12 8 12c18 8 38 4 52-12z', S) +
          p('M78 50l14-12v24z', W) + c(34, 46, 3.5, I, 0) + p('M46 38c6 8 6 16 0 24', null, 3),
    bird: p('M64 26a16 16 0 0 0-16 16c0 4-14 4-22 14-6 8-6 20 4 26 12 8 30 6 40-4 8-8 10-20 6-30z', S) +
          p('M88 34l-14 4 12 8z', I) + c(66, 36, 3.5, I, 0) +
          p('M40 56c8 8 20 10 30 4', null, 3.5) +
          p('M22 74l-14 12 18-2z', S) + p('M60 78l4 14M48 80l0 14', null, 3.5),

    /* ---------- الانتقال ---------- */
    car: p('M12 66V52l10-20h56l10 20v14z', W) + ln(30, 32, 30, 52, 3) + ln(70, 32, 70, 52, 3) +
         c(28, 70, 9, S) + c(72, 70, 9, S),
    plane: p('M50 10c5 0 8 6 8 16v10l30 20v10l-30-8v14l10 8v8l-18-5-18 5v-8l10-8V58l-30 8V56l30-20V26c0-10 3-16 8-16z', S),
    train: p('M22 18h56v44a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10z', W) + r(32, 28, 36, 20, 3, S) +
           c(34, 82, 7, S) + c(66, 82, 7, S) + ln(14, 72, 86, 72, 3),
    ladder: ln(26, 10, 26, 90, 5) + ln(74, 10, 74, 90, 5) +
            ln(26, 26, 74, 26) + ln(26, 44, 74, 44) + ln(26, 62, 74, 62) + ln(26, 80, 74, 80),
    elevator: r(16, 10, 68, 80, 4, W) + ln(50, 10, 50, 90, 4) +
              p('M32 44l6-8 6 8M56 56l6 8 6-8', null, 3.5)
  };

  function icon(name, cls) {
    var body = ICONS[name];
    if (!body) return '';
    return t('svg', { viewBox: '0 0 100 100', class: 'shape icon ' + (cls || ''),
                      'aria-hidden': 'true', focusable: 'false' }, body);
  }

  global.MW.Icons = { icon: icon, inner: function (n) { return ICONS[n] || ''; },
                      names: Object.keys(ICONS) };
})(window);
