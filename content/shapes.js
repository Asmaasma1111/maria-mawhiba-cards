/* shapes.js — راسم الأشكال. يحوّل عنصر شكل من exams.json إلى SVG مباشر.
   لا صور خارجية ولا مكتبات. */

(function (global) {
  'use strict';

  var uid = 0;
  var BOX = 100;      // مربّع الرسم
  var C = BOX / 2;

  function poly(pts) {
    return pts.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ');
  }
  function ring(n, r, startDeg) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (startDeg + i * 360 / n) * Math.PI / 180;
      pts.push([C + r * Math.cos(a), C + r * Math.sin(a)]);
    }
    return pts;
  }
  function star(points, ro, ri, startDeg) {
    var pts = [];
    for (var i = 0; i < points * 2; i++) {
      var r = (i % 2 === 0) ? ro : ri;
      var a = (startDeg + i * 180 / points) * Math.PI / 180;
      pts.push([C + r * Math.cos(a), C + r * Math.sin(a)]);
    }
    return pts;
  }

  /* هندسة كل شكل: يرجع اسم الوسم وخصائصه دون لون */
  function geom(name) {
    switch (name) {
      case 'circle':
        return { tag: 'circle', attrs: { cx: C, cy: C, r: 34 } };
      case 'square':
        return { tag: 'rect', attrs: { x: 16, y: 16, width: 68, height: 68, rx: 4 } };
      case 'triangle':
        return { tag: 'polygon', attrs: { points: poly([[50, 13], [87, 81], [13, 81]]) } };
      case 'diamond':
        return { tag: 'polygon', attrs: { points: poly([[50, 11], [87, 50], [50, 89], [13, 50]]) } };
      case 'hexagon':
        return { tag: 'polygon', attrs: { points: poly(ring(6, 37, -90)) } };
      case 'star':
        return { tag: 'polygon', attrs: { points: poly(star(5, 38, 16, -90)) } };
      case 'arrow':
        /* rotate = 0 يعني السهم متّجه للأعلى، والدوران باتجاه عقارب الساعة */
        return { tag: 'polygon', attrs: { points: poly([
          [50, 10], [80, 44], [63, 44], [63, 89], [37, 89], [37, 44], [20, 44]
        ]) } };
      default:
        return null;
    }
  }

  /* تعبئات نمطية (مخطّط، منقّط، مظلّل) — تتكرّر كثيراً في أسئلة المصفوفات الحقيقية */
  function patternDefs(kind, id) {
    if (kind === 'striped') {
      return tag('pattern', { id: id, width: 9, height: 9, patternUnits: 'userSpaceOnUse' },
        tag('rect', { width: 9, height: 9, fill: '#fff' }) +
        tag('line', { x1: 2.5, y1: 0, x2: 2.5, y2: 9, stroke: 'var(--ink)', 'stroke-width': 3.4 }));
    }
    if (kind === 'hatched') {
      return tag('pattern', { id: id, width: 10, height: 10, patternUnits: 'userSpaceOnUse',
                              patternTransform: 'rotate(45)' },
        tag('rect', { width: 10, height: 10, fill: '#fff' }) +
        tag('line', { x1: 3, y1: 0, x2: 3, y2: 10, stroke: 'var(--ink)', 'stroke-width': 3 }));
    }
    /* dotted */
    return tag('pattern', { id: id, width: 9, height: 9, patternUnits: 'userSpaceOnUse' },
      tag('rect', { width: 9, height: 9, fill: '#fff' }) +
      tag('circle', { cx: 4.5, cy: 4.5, r: 2, fill: 'var(--ink)' }));
  }

  function tag(name, attrs, inner) {
    var s = '<' + name;
    for (var k in attrs) {
      if (attrs[k] !== null && attrs[k] !== undefined) s += ' ' + k + '="' + attrs[k] + '"';
    }
    return inner === undefined ? s + '/>' : s + '>' + inner + '</' + name + '>';
  }

  function el(g, extra) {
    var a = {};
    for (var k in g.attrs) a[k] = g.attrs[k];
    for (var j in extra) a[j] = extra[j];
    return tag(g.tag, a);
  }

  /* ترتيب النقاط: نفضّل شبكة أعرض من ارتفاعها وبصفوف كاملة إن أمكن */
  function dotGrid(n) {
    if (n <= 0) return { cols: 0, rows: 0 };
    var best = null;
    for (var cols = 1; cols <= 6; cols++) {
      if (n % cols !== 0) continue;
      var rows = n / cols;
      if (rows > cols) continue;                 // لا نريدها أطول من عرضها
      var score = Math.abs(cols - rows) + cols * 0.05;
      if (!best || score < best.score) best = { cols: cols, rows: rows, score: score };
    }
    if (best) return best;
    var c = Math.ceil(Math.sqrt(n));
    return { cols: c, rows: Math.ceil(n / c) };
  }

  function dotsSVG(n, scale) {
    scale = scale || 1;
    var g = dotGrid(n);
    if (!g.cols) return '';
    var span = 80 * scale;
    var cw = span / g.cols, ch = span / g.rows;
    /* سقف لحجم النقطة حتى لا تبدو النقطة الواحدة كأنها دائرة كبيرة */
    var r = Math.max(2.2, Math.min(10, Math.min(cw, ch) * 0.30));
    var x0 = C - span / 2, y0 = C - span / 2;
    var out = '', left = n;
    for (var row = 0; row < g.rows; row++) {
      var inRow = Math.min(g.cols, left);
      left -= inRow;
      var rowWidth = inRow * cw;
      var rx0 = C - rowWidth / 2;                 // توسيط الصف الأخير الناقص
      for (var col = 0; col < inRow; col++) {
        out += tag('circle', {
          cx: (rx0 + cw * (col + 0.5)).toFixed(2),
          cy: (y0 + ch * (row + 0.5)).toFixed(2),
          r: r.toFixed(2),
          fill: 'var(--ink)'
        });
      }
    }
    return out;
  }

  /* يرسم عنصراً واحداً داخل مربّع 100×100 ويرجع محتوى الـ SVG */
  function itemInner(item) {
    if (!item || typeof item !== 'object') return '';

    if (item.blank) {
      return tag('rect', {
        x: 8, y: 8, width: 84, height: 84, rx: 10,
        fill: 'none', stroke: 'var(--muted-line)', 'stroke-width': 3,
        'stroke-dasharray': '8 7'
      }) + tag('text', {
        x: C, y: C + 15, 'text-anchor': 'middle',
        'font-size': 44, fill: 'var(--muted-line)', 'font-family': 'inherit'
      }, '؟');
    }

    /* صورة شيء مألوف: جزء من السؤال نفسه، لا زينة */
    /* فاصل العلاقة :: بين الزوجين */
    if (item.text) {
      return tag('text', { x: C, y: C + 13, 'text-anchor': 'middle', 'font-size': 36,
                           fill: 'var(--muted-line)', 'font-family': 'inherit' }, item.text);
    }

    if (item.icon) {
      return (global.MW.Icons ? global.MW.Icons.inner(item.icon) : '');
    }

    var out = '';
    var g = item.shape ? geom(item.shape) : null;
    var rot = (typeof item.rotate === 'number') ? item.rotate : 0;

    if (g) {
      var fill = item.fill || 'empty';
      if (fill === 'striped' || fill === 'dotted' || fill === 'hatched') {
        var pid = 'pat' + (++uid);
        out += patternDefs(fill, pid);
        out += el(g, { fill: 'url(#' + pid + ')', stroke: 'var(--ink)', 'stroke-width': 4,
                       'stroke-linejoin': 'round' });
      } else if (fill === 'solid') {
        out += el(g, { fill: 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': 3,
                       'stroke-linejoin': 'round' });
      } else if (fill === 'half') {
        var id = 'clip' + (++uid);
        out += tag('clipPath', { id: id }, tag('rect', { x: C, y: 0, width: C, height: BOX }));
        out += el(g, { fill: 'var(--ink)', stroke: 'none', 'clip-path': 'url(#' + id + ')' });
        out += el(g, { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 5,
                       'stroke-linejoin': 'round' });
      } else {
        out += el(g, { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 5,
                       'stroke-linejoin': 'round' });
      }
    }

    if (typeof item.dots === 'number') {
      out += dotsSVG(item.dots, g ? 0.55 : 1);
    }

    /* نقطة علامة تدور مع الشكل — نمط شائع في مصفوفات الدوران */
    if (typeof item.markerAngle === 'number') {
      var mr = (item.markerRadius || 0.62) * 34;
      var ma = (item.markerAngle - 90) * Math.PI / 180;
      out += tag('circle', { cx: (C + mr * Math.cos(ma)).toFixed(2),
                             cy: (C + mr * Math.sin(ma)).toFixed(2),
                             r: 6, fill: 'var(--ink)' });
    }

    if (!g && typeof item.dots !== 'number') {
      /* عنصر غير معروف: نعرض نصّه حتى لا يختفي شيء من البيانات */
      out += tag('text', { x: C, y: C + 8, 'text-anchor': 'middle', 'font-size': 18,
                           fill: 'var(--ink)' }, String(item.shape || item.text || '؟'));
    }

    if (rot) out = tag('g', { transform: 'rotate(' + rot + ' ' + C + ' ' + C + ')' }, out);
    return out;
  }

  function svg(item, cls) {
    return tag('svg', {
      viewBox: '0 0 ' + BOX + ' ' + BOX,
      class: cls || 'shape',
      'aria-hidden': 'true',
      focusable: 'false'
    }, itemInner(item));
  }

  /* صفّ أو مصفوفة من المثيرات */
  function stimulus(st, cls) {
    if (!st) return '';
    var extra = cls ? ' ' + cls : '';
    if (st.kind === 'diagram') {
      return (global.MW.Diagrams ? global.MW.Diagrams.render(st, cls) : '');
    }
    if (st.kind === 'matrix' && Array.isArray(st.rows)) {
      var cols = st.rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
      var html = '<div class="stim matrix' + extra + '" style="--cols:' + cols + '">';
      st.rows.forEach(function (row) {
        row.forEach(function (cell) {
          html += '<div class="cell' + (cell && cell.blank ? ' blank' : '') + '">' + svg(cell) + '</div>';
        });
      });
      return html + '</div>';
    }
    var items = st.items || [];
    var h = '<div class="stim row' + extra + '">';
    items.forEach(function (cell) {
      var extraCls = cell && cell.blank ? ' blank' : (cell && cell.text ? ' sep' : '');
      h += '<div class="cell' + extraCls + '">' + svg(cell) + '</div>';
    });
    return h + '</div>';
  }

  global.MW.Shapes = { svg: svg, stimulus: stimulus, dotGrid: dotGrid, inner: itemInner };
})(window);
