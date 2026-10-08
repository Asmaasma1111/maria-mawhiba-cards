/* diagrams.js — رسوم الاستدلال المكاني والميكانيكي، كلها SVG مرسومة من البيانات.
   تمتدّ على مخطط exams.json بلا كسره: stimulus.kind = "diagram" مع اسم الرسم وخياراته.
   قاعدة ثابتة: الرسم يعرض المعطيات ولا يكشف الإجابة أبداً. */

(function (global) {
  'use strict';

  var INK = 'var(--ink)';
  var GUIDE = 'var(--muted-line)';
  var SOFT = 'var(--navy-soft)';

  function t(name, attrs, inner) {
    var s = '<' + name;
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) s += ' ' + k + '="' + attrs[k] + '"';
    return inner === undefined ? s + '/>' : s + '>' + inner + '</' + name + '>';
  }
  function line(x1, y1, x2, y2, w, dash) {
    return t('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: INK,
                       'stroke-width': w || 3, 'stroke-linecap': 'round',
                       'stroke-dasharray': dash || null });
  }
  function label(x, y, s, size, fill) {
    return t('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': size || 15,
                       fill: fill || INK, 'font-family': 'inherit' }, s);
  }
  function qmark(x, y, r) {
    r = r || 17;
    return t('circle', { cx: x, cy: y, r: r, fill: '#fff', stroke: GUIDE,
                         'stroke-width': 2.5, 'stroke-dasharray': '6 5' }) +
           label(x, y + r * 0.36, '؟', r * 1.15, GUIDE);
  }
  /* رأس سهم عند (x,y) باتجاه زاوية deg */
  function head(x, y, deg, size) {
    size = size || 9;
    return t('polygon', {
      points: [[0, 0], [-size, size * 0.55], [-size, -size * 0.55]]
        .map(function (p) { return p.join(','); }).join(' '),
      fill: INK,
      transform: 'translate(' + x + ' ' + y + ') rotate(' + deg + ')'
    });
  }
  function arrow(x1, y1, x2, y2, w) {
    var deg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return line(x1, y1, x2, y2, w || 3) + head(x2, y2, deg);
  }
  /* سهم دائري يبيّن اتجاه الدوران */
  function spinArrow(cx, cy, r, dir) {
    if (dir === '?') return qmark(cx, cy, 15);
    var cw = dir === 'cw';
    var a0 = cw ? -120 : -60, a1 = cw ? 60 : -300;
    var rad = function (a) { return [cx + r * Math.cos(a * Math.PI / 180),
                                     cy + r * Math.sin(a * Math.PI / 180)]; };
    var p0 = rad(a0), p1 = rad(a1);
    var sweep = cw ? 1 : 0;
    var path = t('path', { d: 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
                              ' A' + r + ' ' + r + ' 0 0 ' + sweep + ' ' +
                              p1[0].toFixed(1) + ' ' + p1[1].toFixed(1),
                           fill: 'none', stroke: INK, 'stroke-width': 3,
                           'stroke-linecap': 'round' });
    return path + head(p1[0], p1[1], a1 + (cw ? 90 : -90));
  }

  var D = {};

  /* ---------- تروس متلاصقة ---------- */
  D.gears = function (o) {
    var sizes = o.sizes || [1, 1];
    var spins = o.spins || [];
    var base = 34, gap = 4;
    var xs = [], x = 300;                    /* من اليمين لليسار */
    sizes.forEach(function (s, i) {
      var r = base * s;
      if (i === 0) { x -= r; } else { x -= (base * sizes[i - 1] + r - gap); }
      xs.push({ x: x, r: r });
    });
    var g = '';
    xs.forEach(function (p, i) {
      var teeth = Math.round(10 * sizes[i]);
      var body = t('circle', { cx: p.x, cy: 85, r: p.r * 0.78, fill: SOFT,
                               stroke: INK, 'stroke-width': 3 });
      var tt = '';
      for (var k = 0; k < teeth; k++) {
        var a = (k * 360 / teeth) * Math.PI / 180;
        var w = p.r * 0.20, h = p.r * 0.24;
        tt += t('rect', { x: -w / 2, y: -h, width: w, height: h * 2, rx: 1.5,
                          fill: SOFT, stroke: INK, 'stroke-width': 2.5,
                          transform: 'translate(' + (p.x + Math.cos(a) * p.r * 0.82).toFixed(1) +
                                     ' ' + (85 + Math.sin(a) * p.r * 0.82).toFixed(1) +
                                     ') rotate(' + (k * 360 / teeth) + ')' });
      }
      g += tt + body + t('circle', { cx: p.x, cy: 85, r: 5, fill: INK });
      if (spins[i]) g += spinArrow(p.x, 85, p.r * 0.48, spins[i]);
      g += label(p.x, 85 + p.r + 22, o.names ? o.names[i] : '', 14, GUIDE);
    });
    return g;
  };

  /* ---------- عتلة / رافعة ---------- */
  D.lever = function (o) {
    var fx = o.fulcrum === '?' ? null : (o.fulcrum || 0.5);
    var x0 = 40, x1 = 290, y = 88;
    var g = line(x0, y, x1, y, 7);                                  /* الذراع */
    /* الحمل على اليمين */
    g += t('rect', { x: x1 - 46, y: y - 40, width: 44, height: 34, rx: 6,
                     fill: SOFT, stroke: INK, 'stroke-width': 3 });
    g += label(x1 - 24, y - 17, o.loadLabel || 'حمل', 14);
    /* القوة على اليسار */
    g += arrow(x0 + 14, y - 46, x0 + 14, y - 12, 3);
    g += label(x0 + 14, y - 54, o.forceLabel || 'قوة', 14);
    if (fx === null) {
      g += qmark(x0 + (x1 - x0) * 0.5, y + 30, 18);
      g += label((x0 + x1) / 2, y + 66, 'أين نقطة الارتكاز؟', 14, GUIDE);
    } else {
      var px = x0 + (x1 - x0) * fx;
      g += t('polygon', { points: (px - 20) + ',' + (y + 34) + ' ' + (px + 20) + ',' +
                                  (y + 34) + ' ' + px + ',' + (y + 3),
                          fill: SOFT, stroke: INK, 'stroke-width': 3,
                          'stroke-linejoin': 'round' });
    }
    g += line(20, y + 34, 300, y + 34, 3);
    return g;
  };

  /* ---------- ميزان بكفّتين ---------- */
  D.balance = function (o) {
    var cx = 160, beamY = 40, panY = 96;
    var g = line(cx, beamY, cx, 146, 5) + line(112, 146, 208, 146, 5);
    g += line(52, beamY, 268, beamY, 5);
    g += t('circle', { cx: cx, cy: beamY, r: 7, fill: INK });
    [[52, o.left || [], o.leftLabel], [268, o.right || [], o.rightLabel]].forEach(function (side) {
      var x = side[0], items = side[1];
      g += line(x, beamY, x, panY - 12, 2.5);
      g += t('path', { d: 'M' + (x - 36) + ' ' + (panY - 12) + ' Q' + x + ' ' + (panY + 12) +
                          ' ' + (x + 36) + ' ' + (panY - 12),
                       fill: '#fff', stroke: INK, 'stroke-width': 3 });
      var n = items.length;
      var per = n > 3 ? 3 : n;                      /* صفّان على الأكثر */
      var r = n > 3 ? 8 : 10;
      items.forEach(function (it, i) {
        var row = Math.floor(i / per), col = i % per;
        var rowN = Math.min(per, n - row * per);
        g += t('circle', {
          cx: (x - (rowN - 1) * (r * 2.2) / 2 + col * r * 2.2).toFixed(1),
          cy: (panY - 16 - r - row * (r * 2.2)).toFixed(1),
          r: r, fill: it === 'b' ? SOFT : '#fff', stroke: INK, 'stroke-width': 2.5
        });
      });
      if (side[2]) g += label(x, panY + 34, side[2], 14, GUIDE);
    });
    return g;
  };

  /* ---------- بكرة: ثابتة أو مجموعة بكرات متحرّكة ---------- */
  D.pulley = function (o) {
    var cx = 160, r = 22, g = line(60, 18, 260, 18, 5);

    if (o.system === 'block') {
      /* بكرة ثابتة أعلى، وبكرة متحرّكة معلّقة بالحمل: قوة أقلّ ومسافة أطول */
      var fx = cx + 52, mx = cx - 30;
      g += line(fx, 18, fx, 40 - r + 22, 2.5);
      g += t('circle', { cx: fx, cy: 44, r: r, fill: SOFT, stroke: INK, 'stroke-width': 3 });
      g += t('circle', { cx: fx, cy: 44, r: 4, fill: INK });
      g += t('circle', { cx: mx, cy: 104, r: r, fill: SOFT, stroke: INK, 'stroke-width': 3 });
      g += t('circle', { cx: mx, cy: 104, r: 4, fill: INK });
      /* الحبل: من العارضة لأسفل حول المتحرّكة ثم لأعلى فوق الثابتة ثم لأسفل */
      g += line(mx - r, 18, mx - r, 104, 2.5);
      g += t('path', { d: 'M' + (mx - r) + ' 104 A' + r + ' ' + r + ' 0 0 0 ' + (mx + r) + ' 104',
                       fill: 'none', stroke: INK, 'stroke-width': 2.5 });
      g += line(mx + r, 104, mx + r, 44, 2.5);
      g += line(fx - r, 44, fx - r, 44, 2.5);
      g += t('path', { d: 'M' + (mx + r) + ' 44 L' + (fx - r) + ' 44', fill: 'none',
                       stroke: INK, 'stroke-width': 2.5 });
      g += t('path', { d: 'M' + (fx - r) + ' 44 A' + r + ' ' + r + ' 0 0 1 ' + (fx + r) + ' 44',
                       fill: 'none', stroke: INK, 'stroke-width': 2.5 });
      g += line(fx + r, 44, fx + r, 118, 2.5);
      g += arrow(fx + r, 96, fx + r, 130, 3);
      g += label(fx + r + 30, 116, 'سحب', 13, GUIDE);
      /* الحمل معلّق بالبكرة المتحرّكة */
      g += line(mx, 126, mx, 134, 3);
      g += t('rect', { x: mx - 34, y: 134, width: 68, height: 34, rx: 6,
                       fill: '#fff', stroke: INK, 'stroke-width': 3 });
      g += label(mx, 156, o.loadLabel || 'حمل', 14);
      return g;
    }

    /* بكرة ثابتة واحدة */
    g += line(cx, 18, cx, 44 - r, 2.5);
    g += t('circle', { cx: cx, cy: 46, r: r, fill: SOFT, stroke: INK, 'stroke-width': 3 });
    g += t('circle', { cx: cx, cy: 46, r: 4, fill: INK });
    g += line(cx - r, 46, cx - r, 120, 2.5);
    g += line(cx + r, 46, cx + r, 112, 2.5);
    g += t('rect', { x: cx - r - 30, y: 120, width: 60, height: 36, rx: 6,
                     fill: '#fff', stroke: INK, 'stroke-width': 3 });
    g += label(cx - r, 143, o.loadLabel || 'حمل', 14);
    g += arrow(cx + r, 92, cx + r, 134, 3);
    g += label(cx + r + 30, 120, 'سحب', 13, GUIDE);
    return g;
  };

  /* ---------- مستوى مائل ---------- */
  D.incline = function () {
    var g = t('polygon', { points: '30,140 280,140 280,44', fill: SOFT,
                           stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    g += t('circle', { cx: 150, cy: 106, r: 22, fill: '#fff', stroke: INK, 'stroke-width': 3 });
    g += label(150, 111, 'برميل', 12);
    g += arrow(112, 132, 176, 82, 3);
    g += t('rect', { x: 236, y: 14, width: 62, height: 30, rx: 5, fill: '#fff',
                     stroke: INK, 'stroke-width': 3 });
    g += label(267, 34, 'شاحنة', 12);
    return g;
  };

  /* ---------- أرجوحة ---------- */
  D.seesaw = function (o) {
    var cx = 160, y = 92, half = 128;
    var lx = o.leftAt === undefined ? 0.85 : o.leftAt;
    var rx = o.rightAt === undefined ? 0.85 : o.rightAt;
    /* تميل نحو الأثقل: الرسم يعرض الحال قبل الاتزان، لا بعده */
    var tilt = o.leftBig ? 9 : (o.rightBig ? -9 : 0);
    var g = t('polygon', { points: (cx - 24) + ',140 ' + (cx + 24) + ',140 ' + cx + ',' + (y + 8),
                           fill: SOFT, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    var inner = line(cx - half, y, cx + half, y, 7);
    function kid(off, big) {
      var r = big ? 18 : 12;
      return t('circle', { cx: cx + off, cy: y - r - 7, r: r, fill: big ? SOFT : '#fff',
                           stroke: INK, 'stroke-width': 3 }) +
             label(cx + off, y - r - 2, big ? '٢' : '١', big ? 17 : 13, INK);
    }
    inner += kid(-half * lx, o.leftBig) + kid(half * rx, o.rightBig);
    g += t('g', { transform: 'rotate(' + tilt + ' ' + cx + ' ' + y + ')' }, inner);
    g += line(cx - 145, 140, cx + 145, 140, 3);
    g += label(cx, 162, o.caption || '', 13, GUIDE);
    return g;
  };

  /* ---------- مكعّب متساوي القياس، قابل للتقسيم ---------- */
  function isoCube(cx, cy, s, n, opts) {
    opts = opts || {};
    var dx = s * 0.5, dy = s * 0.28;
    var A = [cx - s / 2, cy - s / 2];            /* أعلى يسار الوجه الأمامي */
    var g = '';
    var front = [[A[0], A[1]], [A[0] + s, A[1]], [A[0] + s, A[1] + s], [A[0], A[1] + s]];
    var topF = [[A[0], A[1]], [A[0] + dx, A[1] - dy], [A[0] + s + dx, A[1] - dy], [A[0] + s, A[1]]];
    var side = [[A[0] + s, A[1]], [A[0] + s + dx, A[1] - dy],
                [A[0] + s + dx, A[1] + s - dy], [A[0] + s, A[1] + s]];
    function poly(pts, fill) {
      return t('polygon', { points: pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '),
                            fill: fill, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    }
    g += poly(topF, opts.painted ? SOFT : '#fff');
    g += poly(side, opts.painted ? SOFT : '#fbfcfe');
    g += poly(front, opts.painted ? SOFT : '#fff');
    if (n > 1) {
      for (var i = 1; i < n; i++) {
        var f = i / n;
        g += line(A[0] + s * f, A[1], A[0] + s * f, A[1] + s, 1.6);            /* أمامي رأسي */
        g += line(A[0], A[1] + s * f, A[0] + s, A[1] + s * f, 1.6);            /* أمامي أفقي */
        g += line(A[0] + s * f, A[1], A[0] + s * f + dx, A[1] - dy, 1.6);      /* علوي */
        g += line(A[0] + dx * f, A[1] - dy * f, A[0] + s + dx * f, A[1] - dy * f, 1.6);
        g += line(A[0] + s + dx * f, A[1] - dy * f, A[0] + s + dx * f, A[1] + s - dy * f, 1.6);
        g += line(A[0] + s, A[1] + s * f, A[0] + s + dx, A[1] + s * f - dy, 1.6);
      }
    }
    return g;
  }

  D.cube = function (o) {
    var g = isoCube(160, 88, o.size || 96, o.divide || 1, { painted: o.painted });
    if (o.edgeLabel) {
      g += line(112, 152, 208, 152, 2, '5 5');
      g += label(160, 168, o.edgeLabel, 14, GUIDE);
    }
    return g;
  };

  /* ---------- صندوق متساوي القياس عام (عرض × عمق × ارتفاع) ---------- */
  function isoBox(x0, y0, W, D, H, u, div) {
    /* x0,y0 = الركن الأمامي السفلي الأيسر. المحاور: يمين (u,0)، عمق (0.5u,-0.28u)، أعلى (0,-u) */
    var rx = u, dx = u * 0.5, dy = u * 0.28;
    function P(a, b, c) { return [x0 + a * rx + b * dx, y0 - b * dy - c * u]; }
    function poly(pts, fill) {
      return t('polygon', {
        points: pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '),
        fill: fill, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    }
    var g = '';
    g += poly([P(0, D, H), P(W, D, H), P(W, 0, H), P(0, 0, H)], '#fff');           /* أعلى */
    g += poly([P(W, 0, 0), P(W, D, 0), P(W, D, H), P(W, 0, H)], '#f2f6fc');        /* جانب */
    g += poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H)], '#fff');           /* أمام */
    if (div) {
      for (var i = 1; i < W; i++) {
        g += line(P(i, 0, 0)[0], P(i, 0, 0)[1], P(i, 0, H)[0], P(i, 0, H)[1], 1.4);
        g += line(P(i, 0, H)[0], P(i, 0, H)[1], P(i, D, H)[0], P(i, D, H)[1], 1.4);
      }
      for (var j = 1; j < D; j++) {
        g += line(P(0, j, H)[0], P(0, j, H)[1], P(W, j, H)[0], P(W, j, H)[1], 1.4);
        g += line(P(W, j, 0)[0], P(W, j, 0)[1], P(W, j, H)[0], P(W, j, H)[1], 1.4);
      }
    }
    return g;
  }

  /* ---------- برج من طبقات مكعّبات ---------- */
  D.cubeTower = function (o) {
    var layers = o.layers || [4, 3, 2, 1];      /* عرض ضلع كل طابق بالمكعّبات */
    var u = o.unit || 21;
    var g = '', y = 158;
    layers.forEach(function (w) {
      var x0 = 160 - (w * u + w * u * 0.5) / 2;
      g += isoBox(x0, y, w, w, 1, u, true);
      y -= u;                                    /* الطابق التالي فوقه */
    });
    return g;
  };

  /* ---------- طيّ الورقة وثقبها ---------- */
  D.fold = function (o) {
    var folds = o.folds || 1;
    var panels = [], x = 286, step = 92;
    var g = '';
    function paper(px, w, h, extra) {
      return t('rect', { x: px - w / 2, y: 88 - h / 2, width: w, height: h, rx: 3,
                         fill: '#fff', stroke: INK, 'stroke-width': 3 }) + (extra || '');
    }
    /* ١ الورقة كاملة */
    g += paper(x, 68, 76) + label(x, 148, 'الورقة', 13, GUIDE);
    /* سهم الطيّ */
    g += arrow(x - 46, 88, x - 74, 88, 2.5);
    x -= step;
    /* ٢ بعد الطيّ */
    var w2 = folds >= 2 ? 34 : 34, h2 = folds >= 2 ? 38 : 76;
    g += paper(x, w2, h2);
    g += line(x + w2 / 2, 88 - h2 / 2, x + w2 / 2, 88 + h2 / 2, 3, '5 4');
    g += label(x, 148, folds >= 2 ? 'طيّتان' : 'طيّة واحدة', 13, GUIDE);
    g += arrow(x - 34, 88, x - 62, 88, 2.5);
    x -= step;
    /* ٣ بعد الثقب */
    g += paper(x, w2, h2);
    g += t('circle', { cx: x, cy: 88, r: 6, fill: INK });
    g += label(x, 148, 'ثقب', 13, GUIDE);
    g += arrow(x - 34, 88, x - 62, 88, 2.5);
    x -= step;
    /* ٤ عند الفتح */
    g += t('rect', { x: x - 34, y: 50, width: 68, height: 76, rx: 3, fill: '#fff',
                     stroke: GUIDE, 'stroke-width': 3, 'stroke-dasharray': '7 6' });
    g += label(x, 94, '؟', 30, GUIDE);
    g += label(x, 148, 'عند الفتح', 13, GUIDE);
    return g;
  };

  /* ---------- وردة الاتجاهات ---------- */
  D.compass = function (o) {
    var cx = 160, cy = 88, r = 54;
    var g = t('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: GUIDE, 'stroke-width': 2.5 });
    [['شمال', 0, -1], ['جنوب', 0, 1], ['شرق', 1, 0], ['غرب', -1, 0]].forEach(function (d) {
      g += label(cx + d[1] * (r + 26), cy + d[2] * (r + 20) + 5, d[0], 14, GUIDE);
      g += line(cx + d[1] * r * 0.86, cy + d[2] * r * 0.86, cx + d[1] * r, cy + d[2] * r, 2, null);
    });
    var dirs = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
    var f = dirs[o.facing || 'N'];
    g += arrow(cx, cy, cx + f[0] * r * 0.86, cy + f[1] * r * 0.86, 4);
    g += t('circle', { cx: cx, cy: cy, r: 5, fill: INK });
    if (o.turns) {
      g += label(cx, cy + r + 52, o.turns, 14, GUIDE);
    }
    return g;
  };

  /* ---------- مسار على شبكة ---------- */
  D.gridPath = function (o) {
    var steps = o.steps || [];
    var u = 26, cols = 4, rows = 3;
    var dirs = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
    /* نحسب امتداد المسار أولاً حتى نضعه في وسط الشبكة */
    var px = 0, py = 0, minX = 0, maxX = 0, minY = 0, maxY = 0;
    steps.forEach(function (st) {
      var d = dirs[st.dir];
      px += d[0] * st.n; py += d[1] * st.n;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    });
    var ox = 160 - ((minX + maxX) / 2) * u;
    var oy = 100 - ((minY + maxY) / 2) * u;
    var g = '';
    for (var i = -cols; i <= cols; i++) {
      g += line(ox + i * u, oy - rows * u, ox + i * u, oy + rows * u, 1, '2 6');
    }
    for (var j = -rows; j <= rows; j++) {
      g += line(ox - cols * u, oy + j * u, ox + cols * u, oy + j * u, 1, '2 6');
    }
    px = ox; py = oy;
    g += t('circle', { cx: px, cy: py, r: 6, fill: INK });
    g += label(px, py + 26, 'البداية', 12, GUIDE);
    steps.forEach(function (st) {
      var d = dirs[st.dir];
      var nx = px + d[0] * u * st.n, ny = py + d[1] * u * st.n;
      g += arrow(px, py, nx, ny, 3);
      px = nx; py = ny;
    });
    g += qmark(px, py, 14);
    g += label(ox + cols * u - 6, oy - rows * u - 8, 'شمال ↑', 12, GUIDE);
    return g;
  };

  /* ---------- أسطوانة ومساقطها ---------- */
  D.cylinder = function () {
    var cx = 160, g = '';
    g += t('ellipse', { cx: cx, cy: 46, rx: 42, ry: 15, fill: SOFT, stroke: INK, 'stroke-width': 3 });
    g += line(cx - 42, 46, cx - 42, 122, 3);
    g += line(cx + 42, 46, cx + 42, 122, 3);
    g += t('path', { d: 'M' + (cx - 42) + ' 122 A42 15 0 0 0 ' + (cx + 42) + ' 122',
                     fill: 'none', stroke: INK, 'stroke-width': 3 });
    g += arrow(cx, 8, cx, 28, 2.5);
    g += label(cx + 92, 24, 'من الأعلى', 13, GUIDE);
    g += arrow(cx + 96, 84, cx + 58, 84, 2.5);
    g += label(cx + 128, 88, 'من الجانب', 13, GUIDE);
    return g;
  };

  /* ---------- حجر نرد ---------- */
  D.dice = function (o) {
    var cx = 160, cy = 88, sz = 84;
    var g = isoCube(cx, cy, sz, 1, {});
    var pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
                 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
                 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
                 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    /* الوجه العلوي متوازي أضلاع: نحوّل إحداثيات الشبكة إليه بدل افتراض مستطيل */
    var dx = sz * 0.5, dy = sz * 0.28;
    var A = [cx - sz / 2, cy - sz / 2];
    function onTop(u, v) {            /* u على الحافة الأمامية، v إلى العمق */
      return [A[0] + u * sz + v * dx, A[1] - v * dy];
    }
    (pips[o.top || 1] || []).forEach(function (p) {
      var q = onTop(0.5 + p[0] * 0.26, 0.5 + p[1] * 0.26);
      g += t('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 4.5, fill: INK });
    });
    g += label(cx, cy + sz + 34, 'الوجه السفليّ: ؟', 14, GUIDE);
    return g;
  };

  /* ---------- معادلات الأشكال: ▲+▲+▲ = ■ ---------- */
  D.shapeEquation = function (o) {
    var rows = o.rows || [];
    var g = '', y = 34, rowH = o.rowH || 46;
    var Shapes = global.MW.Shapes;
    function glyph(it, x, yy, sz) {
      sz = sz || 26;
      if (typeof it === 'string' || typeof it === 'number') {
        return label(x, yy + 8, String(it), 24);
      }
      return t('g', { transform: 'translate(' + (x - sz / 2) + ' ' + (yy - sz / 2) +
                                 ') scale(' + (sz / 100) + ')' }, Shapes.svg ? '' : '') +
             t('svg', { x: x - sz / 2, y: yy - sz / 2, width: sz, height: sz,
                        viewBox: '0 0 100 100', overflow: 'visible' },
               Shapes.inner ? Shapes.inner(it) : '');
    }
    rows.forEach(function (row) {
      /* من اليمين إلى اليسار */
      var x = 292;
      row.left.forEach(function (it, i) {
        if (i) { g += label(x - 8, y + 8, '+', 22, GUIDE); x -= 24; }
        g += glyph(it, x - 16, y); x -= 40;
      });
      g += label(x - 4, y + 8, '=', 22, INK); x -= 30;
      g += glyph(row.right, x - 16, y);
      y += rowH;
    });
    if (o.ask) g += label(160, y + 12, o.ask, 15, GUIDE);
    return g;
  };

  /* ---------- عجلة أعداد مقسّمة إلى قطاعات ---------- */
  D.numberWheel = function (o) {
    var vals = o.values || [];
    var n = vals.length, cx = 160, cy = 92, r = 66;
    var g = t('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: INK, 'stroke-width': 3 });
    for (var i = 0; i < n; i++) {
      var a = (i * 360 / n - 90) * Math.PI / 180;
      g += line(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a), 2.5);
    }
    vals.forEach(function (v, i) {
      var a = ((i + 0.5) * 360 / n - 90) * Math.PI / 180;
      var x = cx + r * 0.6 * Math.cos(a), yy = cy + r * 0.6 * Math.sin(a) + 8;
      g += label(x, yy, String(v), 22, v === '?' ? GUIDE : INK);
    });
    return g;
  };

  /* ---------- تروس بعدد أسنان معلوم (نِسَب الدوران) ---------- */
  D.gearRatio = function (o) {
    var gs = o.gears || [];
    var g = '', x = 268;
    gs.forEach(function (gr, i) {
      var r = 20 + gr.teeth * 1.6;
      if (i) x -= r + 6;
      var teeth = Math.min(24, gr.teeth);
      for (var k = 0; k < teeth; k++) {
        var a = k * 360 / teeth;
        var rad = a * Math.PI / 180;
        g += t('rect', { x: -3.5, y: -5, width: 7, height: 10, rx: 1.5, fill: SOFT,
                         stroke: INK, 'stroke-width': 2,
                         transform: 'translate(' + (x + Math.cos(rad) * r * 0.9).toFixed(1) + ' ' +
                                    (92 + Math.sin(rad) * r * 0.9).toFixed(1) + ') rotate(' + a + ')' });
      }
      g += t('circle', { cx: x, cy: 92, r: r * 0.82, fill: SOFT, stroke: INK, 'stroke-width': 3 });
      g += label(x, 90, String(gr.teeth), 15, INK);
      g += label(x, 106, 'سنّاً', 11, GUIDE);
      if (gr.mark) g += t('circle', { cx: x, cy: 92 - r * 0.55, r: 5, fill: '#fff',
                                      stroke: INK, 'stroke-width': 2.5 });
      if (gr.label) g += label(x, 92 + r + 20, gr.label, 13, GUIDE);
      x -= r + 6;
    });
    return g;
  };

  /* ---------- حالات المادة داخل إناء ---------- */
  D.matterStates = function (o) {
    var states = o.states || ['solid', 'liquid', 'gas'];
    var g = '', x = 262, w = 62, h = 74;
    states.forEach(function (st) {
      g += t('path', { d: 'M' + (x - w / 2) + ' 30 L' + (x - w / 2) + ' ' + (30 + h) +
                          ' L' + (x + w / 2) + ' ' + (30 + h) + ' L' + (x + w / 2) + ' 30',
                       fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' });
      var conf = { solid: { cols: 5, rows: 5, top: 60, jit: 0 },
                   liquid: { cols: 4, rows: 3, top: 66, jit: 3 },
                   gas: { cols: 3, rows: 4, top: 34, jit: 7 } }[st] || { cols: 4, rows: 3, top: 60, jit: 2 };
      var seed = 1;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; }
      for (var r0 = 0; r0 < conf.rows; r0++) {
        for (var c0 = 0; c0 < conf.cols; c0++) {
          var px = x - w / 2 + 10 + c0 * ((w - 20) / Math.max(1, conf.cols - 1)) + rnd() * conf.jit * 2;
          var py = conf.top + r0 * ((30 + h - 8 - conf.top) / Math.max(1, conf.rows - 1)) + rnd() * conf.jit * 2;
          /* نُبقي الجزيئات داخل الإناء مهما بلغ التشتيت */
          px = Math.max(x - w / 2 + 7, Math.min(x + w / 2 - 7, px));
          py = Math.max(38, Math.min(30 + h - 7, py));
          g += t('circle', { cx: px.toFixed(1), cy: py.toFixed(1), r: 4, fill: SOFT,
                             stroke: INK, 'stroke-width': 1.6 });
        }
      }
      x -= w + 26;
    });
    return g;
  };

  function render(st, cls) {
    var fn = D[st.draw];
    if (!fn) return '';
    var vb = st.viewBox || '0 0 320 180';
    return '<div class="stim diagram' + (cls ? ' ' + cls : '') + '">' +
      t('svg', { viewBox: vb, class: 'diagram-svg', role: 'img',
                 'aria-label': st.alt || '' }, fn(st.opts || {})) +
      '</div>';
  }

  global.MW.Diagrams = { render: render, types: Object.keys(D) };
})(window);
