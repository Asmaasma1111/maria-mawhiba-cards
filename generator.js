/* generator.js — أسئلة تُحسب بالكود، لا تُكتب باليد.
   لكل مهارة ثلاثة مستويات: ١ سهل (ثالث)، ٢ متوسط، ٣ صعب (خامس).
   الإجابة الصحيحة محسوبة دائماً، والمشتّتات محسوبة أيضاً ثم يُتحقّق من تمايزها. */

(function (global) {
  'use strict';

  var AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  function arD(v) { return String(v).replace(/[0-9]/g, function (c) { return AR[+c]; }); }

  /* مولّد عشوائي ببذرة: نفس البذرة تعطي نفس السؤال دائماً (مهمّ للاختبار) */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function rint(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }

  /* يخلط الخيارات ويُرجع موضع الصحيحة بعد الخلط */
  function shuffleOptions(r, opts, correctIdx) {
    var idx = opts.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return { options: idx.map(function (i) { return opts[i]; }),
             answer: idx.indexOf(correctIdx) };
  }

  /* يبني أربعة أعداد متمايزة حول الإجابة */
  function numberOptions(r, correct, spread) {
    var set = [correct], guard = 0;
    while (set.length < 4 && guard++ < 200) {
      var d = pick(r, spread);
      var v = correct + d;
      if (v > 0 && set.indexOf(v) === -1) set.push(v);
    }
    while (set.length < 4) { var v2 = correct + set.length * 3; if (set.indexOf(v2) === -1) set.push(v2); }
    return set;
  }

  /* ================= ١ · المتتابعات العددية ================= */
  function numseq(r, level) {
    var start, rule, explain, seq = [], i;
    if (level === 1) {
      var k = rint(r, 2, 5);
      if (r() < 0.5) { start = rint(r, 1, 9); rule = function (x) { return x + k; };
                       explain = 'كل مرة ‎+' + arD(k); }
      else { start = rint(r, 2, 6); rule = function (x) { return x * 2; };
             explain = 'يتضاعف كل مرة.'; }
    } else if (level === 2) {
      var m = pick(r, [2, 3]);
      var t = r();
      if (t < 0.4) { start = rint(r, 1, 5); rule = function (x) { return x * m; };
                     explain = 'ضرب في ' + arD(m) + ' كل مرة.'; }
      else if (t < 0.7) { start = rint(r, 1, 6); var step = 0;
                          rule = function (x) { step++; return x + step; };
                          explain = 'الزيادة تكبر: ‎+١ ثم ‎+٢ ثم ‎+٣.'; }
      else { var a = rint(r, 3, 7), b = rint(r, 1, 2); start = rint(r, 2, 6); var odd = true;
             rule = function (x) { odd = !odd; return odd ? x - b : x + a; };
             explain = 'مرة ‎+' + arD(a) + ' ومرة ‎−' + arD(b) + '.'; }
    } else {
      var t3 = r();
      if (t3 < 0.35) { var m3 = pick(r, [2, 3]), c3 = rint(r, 1, 3); start = rint(r, 1, 4);
                       rule = function (x) { return x * m3 + c3; };
                       explain = 'ضرب في ' + arD(m3) + ' ثم ‎+' + arD(c3) + '.'; }
      else if (t3 < 0.7) { var n = rint(r, 1, 3); i = n - 1;
                           rule = function () { i++; return i * i; };
                           start = n * n; explain = 'مربّعات الأعداد.'; }
      else { var p = rint(r, 1, 3), q = p + rint(r, 1, 3); start = p;
             var prev = p, cur = q, first = true;
             rule = function () { if (first) { first = false; return cur; }
                                  var nx = prev + cur; prev = cur; cur = nx; return nx; };
             explain = 'كل عدد مجموع العددين قبله.'; }
    }
    seq = [start];
    for (i = 0; i < 4; i++) seq.push(rule(seq[seq.length - 1]));
    var shown = seq.slice(0, 4), correct = seq[4];
    if (!isFinite(correct) || correct <= 0 || correct > 9999) return null;
    var opts = numberOptions(r, correct, [1, -1, 2, -2, 3, -3, 5, -5, 10]);
    var s = shuffleOptions(r, opts, 0);
    return { topic: 'المتتابعات العددية', type: 'text',
             prompt: shown.map(arD).join(' ، ') + ' ، ......',
             options: s.options.map(arD), answer: s.answer, explain: explain };
  }

  /* ================= ٢ · متتابعات الأشكال ================= */
  var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star'];
  function shapeseq(r, level) {
    var items = [], correct, dist = [], i;
    if (level === 1) {
      if (r() < 0.5) {                       /* تبادل ممتلئ / فارغ */
        var sh = pick(r, SHAPES);
        for (i = 0; i < 3; i++) items.push({ shape: sh, fill: i % 2 ? 'empty' : 'solid' });
        correct = { shape: sh, fill: 'empty' };
        dist = [{ shape: sh, fill: 'solid' },
                { shape: pick(r, SHAPES.filter(function (x) { return x !== sh; })), fill: 'empty' },
                { shape: sh, fill: 'half' }];
        var exp1 = 'تبادل بين ممتلئ وفارغ.';
      } else {                               /* دوران ٩٠ */
        for (i = 0; i < 3; i++) items.push({ shape: 'arrow', rotate: (i * 90) % 360 });
        correct = { shape: 'arrow', rotate: 270 };
        dist = [{ shape: 'arrow', rotate: 0 }, { shape: 'arrow', rotate: 45 },
                { shape: 'arrow', rotate: 90 }];
        var exp1 = 'دوران ٩٠ درجة في كل خطوة.';
      }
      return finishShape(r, items, correct, dist, exp1);
    }
    if (level === 2) {
      if (r() < 0.5) {                       /* دوران ٤٥ */
        var st = pick(r, [0, 45, 90]);
        for (i = 0; i < 3; i++) items.push({ shape: 'arrow', rotate: (st + i * 45) % 360 });
        correct = { shape: 'arrow', rotate: (st + 135) % 360 };
        dist = [{ shape: 'arrow', rotate: (st + 90) % 360 },
                { shape: 'arrow', rotate: (st + 180) % 360 },
                { shape: 'arrow', rotate: (st + 225) % 360 }];
        return finishShape(r, items, correct, dist, 'دوران ٤٥ درجة في كل خطوة.');
      }
      var three = [];                        /* دورة من ثلاثة أشكال */
      while (three.length < 3) { var c = pick(r, SHAPES); if (three.indexOf(c) === -1) three.push(c); }
      for (i = 0; i < 3; i++) items.push({ shape: three[i % 3], fill: 'empty' });
      correct = { shape: three[0], fill: 'empty' };
      dist = [{ shape: three[1], fill: 'empty' }, { shape: three[2], fill: 'empty' },
              { shape: three[0], fill: 'solid' }];
      return finishShape(r, items, correct, dist, 'الأشكال الثلاثة تتكرّر بالترتيب.');
    }
    /* المستوى ٣: صفتان تتغيّران معاً */
    var sh3 = pick(r, SHAPES), fills = ['solid', 'empty', 'half'];
    for (i = 0; i < 3; i++) items.push({ shape: sh3, fill: fills[i % 3], rotate: (i * 90) % 360 });
    correct = { shape: sh3, fill: fills[0], rotate: 270 };
    dist = [{ shape: sh3, fill: fills[1], rotate: 270 },
            { shape: sh3, fill: fills[0], rotate: 180 },
            { shape: sh3, fill: fills[2], rotate: 0 }];
    return finishShape(r, items, correct, dist, 'الدوران واللون يتغيّران معاً.');
  }
  function finishShape(r, items, correct, dist, explain) {
    var opts = [correct].concat(dist);
    if (!distinctShapes(opts)) return null;
    var s = shuffleOptions(r, opts, 0);
    return { topic: 'متتابعات الأشكال', type: 'figural', prompt: 'ما الشكل التالي؟',
             stimulus: { kind: 'row', items: items.concat([{ blank: true }]) },
             optionShapes: s.options, answer: s.answer, explain: explain };
  }
  function distinctShapes(list) {
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var k = JSON.stringify(list[i]);
      if (seen[k]) return false;
      seen[k] = 1;
    }
    return true;
  }

  /* ================= ٣ · الاستدلال المكاني ================= */
  var DIRS = ['الشمال', 'الشرق', 'الجنوب', 'الغرب'];
  function spatial(r, level) {
    var kinds = level === 1 ? ['cube', 'compass']
              : level === 2 ? ['unpainted', 'compass2', 'fold']
              :               ['unpainted', 'tower', 'fold3'];
    var kind = pick(r, kinds), n, correct, opts, s;

    if (kind === 'cube') {
      n = pick(r, [2, 3]);
      correct = n * n * n;
      opts = numberOptions(r, correct, [n * n, -n, n, -n * n, 2 * n, -2]);
      s = shuffleOptions(r, opts, 0);
      return { topic: 'الاستدلال المكاني', type: 'text',
               prompt: 'مكعّب ضلعه ' + arD(n) + ' سم. من كم مكعّباً صغيراً ضلعه ١ سم يتكوّن؟',
               stimulus: { kind: 'diagram', draw: 'cube',
                           opts: { size: 96, divide: n, edgeLabel: arD(n) + ' سم' },
                           viewBox: '0 0 320 190' },
               options: s.options.map(arD), answer: s.answer,
               explain: arD(n) + ' × ' + arD(n) + ' × ' + arD(n) + ' = ' + arD(correct) + '.' };
    }
    if (kind === 'unpainted') {
      n = level === 2 ? 3 : pick(r, [4, 5]);
      correct = Math.pow(n - 2, 3);
      opts = numberOptions(r, correct, [1, -1, 2, 4, 6, 8, -2]);
      s = shuffleOptions(r, opts, 0);
      return { topic: 'الاستدلال المكاني', type: 'text',
               prompt: 'مكعّب ' + arD(n) + '×' + arD(n) + '×' + arD(n) +
                       ' لُوّن سطحه كلّه. كم مكعّباً صغيراً لم يُلوَّن منه وجه؟',
               stimulus: { kind: 'diagram', draw: 'cube',
                           opts: { size: 96, divide: n, painted: true }, viewBox: '0 0 320 180' },
               options: s.options.map(arD), answer: s.answer,
               explain: 'الداخل مكعّب ' + arD(n - 2) + ' → ' + arD(n - 2) + '³ = ' + arD(correct) + '.' };
    }
    if (kind === 'tower') {
      n = pick(r, [3, 4]);
      var layers = [], tot = 0;
      for (var k = n; k >= 1; k--) { layers.push(k); tot += k * k; }
      correct = tot;
      opts = numberOptions(r, correct, [1, -1, n, -n, n * n, -n * n, 2]);
      s = shuffleOptions(r, opts, 0);
      return { topic: 'الاستدلال المكاني', type: 'text',
               prompt: 'برج من ' + (n === 3 ? 'ثلاث' : 'أربع') +
                       ' طبقات، كل طبقة مربّعة. كم مكعّباً فيه كلّه؟',
               stimulus: { kind: 'diagram', draw: 'cubeTower', opts: { layers: layers },
                           viewBox: '0 0 320 190' },
               options: s.options.map(arD), answer: s.answer,
               explain: layers.map(function (x) { return arD(x) + '²'; }).join(' + ') + ' = ' + arD(correct) + '.' };
    }
    if (kind === 'fold' || kind === 'fold3') {
      var f = kind === 'fold' ? 2 : 3;
      correct = Math.pow(2, f);
      opts = numberOptions(r, correct, [1, -1, 2, -2, 4, -4, 8]);
      s = shuffleOptions(r, opts, 0);
      return { topic: 'الاستدلال المكاني', type: 'text',
               prompt: 'ورقة طُويت ' + (f === 2 ? 'مرّتين' : 'ثلاث مرّات') +
                       ' ثم ثُقبت ثقباً واحداً. كم ثقباً يظهر عند فتحها؟',
               stimulus: { kind: 'diagram', draw: 'fold', opts: { folds: f }, viewBox: '0 0 320 175' },
               options: s.options.map(arD), answer: s.answer,
               explain: (f === 2 ? 'طيّتان' : 'ثلاث طيّات') + ' = ' + arD(correct) + ' طبقات.' };
    }
    /* البوصلة */
    var turns = kind === 'compass' ? 1 : 2;
    var startI = rint(r, 0, 3);
    var right = r() < 0.5;
    var endI = (startI + (right ? turns : -turns) + 8) % 4;
    var optsD = DIRS.slice();
    s = shuffleOptions(r, optsD, endI);
    return { topic: 'الاستدلال المكاني', type: 'text',
             prompt: 'تقف ماريا متّجهة نحو ' + DIRS[startI] + '، ثم استدارت إلى ' +
                     (right ? 'اليمين' : 'اليسار') + ' ' + (turns === 1 ? 'مرّة واحدة' : 'مرّتين') +
                     '. إلى أيّ جهة تنظر الآن؟',
             stimulus: { kind: 'diagram', draw: 'compass',
                         opts: { facing: ['N','E','S','W'][startI],
                                 turns: 'استدارة ' + (right ? 'يميناً' : 'يساراً') },
                         viewBox: '0 0 320 200' },
             options: s.options, answer: s.answer,
             explain: 'كل استدارة ربع دورة.' };
  }

  /* ================= ٤ · الاستدلال الميكانيكي (التروس) ================= */
  function mech(r, level) {
    var cw = r() < 0.5;
    if (level === 1 || level === 2) {
      var n = level === 1 ? 2 : 3;
      var sameDir = (n % 2 === 1);
      var optsM = ['مع عقارب الساعة', 'عكس عقارب الساعة', 'لا يدور', 'يدور مرّتين'];
      var correctText = (sameDir === cw) ? 'مع عقارب الساعة' : 'عكس عقارب الساعة';
      var ci = optsM.indexOf(correctText);
      var s = shuffleOptions(r, optsM, ci);
      var names = n === 2 ? ['الأول', 'الثاني'] : ['الأول', 'الثاني', 'الثالث'];
      var spins = [cw ? 'cw' : 'ccw']; for (var i = 1; i < n - 1; i++) spins.push(null);
      spins.push('?');
      /* أحجام متنوّعة حتى لا تتكرّر الصورة نفسها */
      var sizeSet = n === 2 ? pick(r, [[1, 1], [1.25, 0.8], [0.85, 1.2]])
                            : pick(r, [[1, 1, 1], [1.2, 0.85, 1.1], [0.9, 1.15, 0.9]]);
      return { topic: 'الاستدلال الميكانيكي', type: 'text',
               prompt: (n === 2 ? 'ترسان متلاصقان. إذا دار الأول '
                                : 'ثلاثة تروس متلاصقة في صفّ. إذا دار الأول ') +
                       (cw ? 'مع عقارب الساعة' : 'عكس عقارب الساعة') +
                       (n === 2 ? '، فالثاني يدور:' : '، فالثالث يدور:'),
               stimulus: { kind: 'diagram', draw: 'gears',
                           opts: { sizes: sizeSet, spins: spins, names: names },
                           viewBox: '0 0 320 165' },
               options: s.options, answer: s.answer,
               explain: n === 2 ? 'المتلاصقان يتعاكسان.' : 'التعاكس مرّتين يعيد الاتجاه.' };
    }
    /* المستوى ٣: نسبة الأسنان */
    var small = pick(r, [6, 8, 9]);
    var mult = pick(r, [2, 3, 4]);
    var big = small * mult;
    var correct = mult;
    var opts = numberOptions(r, correct, [1, -1, 2, -2, 3]);
    var s3 = shuffleOptions(r, opts, 0);
    return { topic: 'الاستدلال الميكانيكي', type: 'text',
             prompt: 'ترس كبير له ' + arD(big) + ' سنّاً متلاصق بترس صغير له ' + arD(small) +
                     ' سنّاً. إذا دار الكبير دورة كاملة، كم دورة يدور الصغير؟',
             stimulus: { kind: 'diagram', draw: 'gearRatio',
                         opts: { gears: [{ teeth: big, mark: true, label: 'الكبير' },
                                         { teeth: small, label: 'الصغير' }] },
                         viewBox: '0 0 320 150' },
             options: s3.options.map(arD), answer: s3.answer,
             explain: arD(big) + ' ÷ ' + arD(small) + ' = ' + arD(correct) + '.' };
  }

  /* ================= ٥ · المرونة العقلية: أنماط (المصفوفات) ================= */
  function patterns(r, level) {
    var rows = [], i, j;
    if (level === 1) {                       /* قاعدة بسيطة بالنقاط، والشرح يطابقها */
      var mode = r() < 0.5 ? 'mul' : 'add';
      var base = rint(r, 1, 2), add = rint(r, 0, 4);
      var cell = mode === 'mul' ? function (a, b) { return base * a * b; }
                                : function (a, b) { return a + b + add; };
      var explain1 = mode === 'mul'
        ? (base === 1 ? 'كل خانة = الصف × العمود.'
                      : 'كل خانة = الصف × العمود × ' + arD(base) + '.')
        : (add === 0 ? 'كل خانة = الصف + العمود.'
                     : 'كل خانة = الصف + العمود + ' + arD(add) + '.');
      var maxDot = 0;
      for (i = 1; i <= 3; i++) {
        var row = [];
        for (j = 1; j <= 3; j++) {
          var v0 = cell(i, j);
          if (v0 > maxDot) maxDot = v0;
          row.push({ dots: v0 });
        }
        rows.push(row);
      }
      var correct = cell(3, 3);
      if (maxDot > 18 || correct < 2) return null;
      rows[2][2] = { blank: true };
      /* مشتّتات قريبة من الإجابة وكلها ضمن ما يمكن رسمه */
      var cand = [correct];
      [1, -1, 2, -2, 3, -3].forEach(function (d) {
        var v1 = correct + d;
        if (v1 >= 1 && v1 <= 18 && cand.indexOf(v1) === -1 && cand.length < 4) cand.push(v1);
      });
      if (cand.length < 4) return null;
      var s1 = shuffleOptions(r, cand.map(function (v) { return { dots: v }; }), 0);
      if (!distinctShapes(s1.options)) return null;
      return { topic: 'المرونة العقلية: أنماط', type: 'figural', prompt: 'أكملي المصفوفة.',
               stimulus: { kind: 'matrix', rows: rows },
               optionShapes: s1.options, answer: s1.answer, explain: explain1 };
    }
    if (level === 2) {                       /* مربّع لاتيني: شكل × تعبئة */
      var three = [];
      while (three.length < 3) { var c = pick(r, SHAPES); if (three.indexOf(c) === -1) three.push(c); }
      var fills = ['solid', 'empty', 'striped'];
      for (i = 0; i < 3; i++) {
        var row2 = [];
        for (j = 0; j < 3; j++) row2.push({ shape: three[(i + j) % 3], fill: fills[(i + 2 * j) % 3] });
        rows.push(row2);
      }
      var right = rows[2][2];
      rows[2][2] = { blank: true };
      /* مشتّتات مبنية بتغيير صفة واحدة أو الاثنتين — لا تتطابق أبداً */
      var otherShapes = three.filter(function (x) { return x !== right.shape; });
      var otherFills = fills.filter(function (x) { return x !== right.fill; });
      var wrong = [{ shape: otherShapes[0], fill: right.fill },
                   { shape: right.shape, fill: otherFills[0] },
                   { shape: otherShapes[1], fill: otherFills[1] }];
      var optsP = [right].concat(wrong);
      if (!distinctShapes(optsP)) return null;
      var s2 = shuffleOptions(r, optsP, 0);
      return { topic: 'المرونة العقلية: أنماط', type: 'figural', prompt: 'أكملي المصفوفة.',
               stimulus: { kind: 'matrix', rows: rows },
               optionShapes: s2.options, answer: s2.answer,
               explain: 'كل شكل وكل تعبئة مرّة واحدة في الصف والعمود.' };
    }
    /* المستوى ٣: مصفوفة دوران */
    var sh = pick(r, ['hexagon', 'pentagon', 'square', 'triangle']);
    if (sh === 'pentagon') sh = 'hexagon';
    var step = pick(r, [45, 60, 90]);
    for (i = 0; i < 3; i++) {
      var row3 = [];
      for (j = 0; j < 3; j++) row3.push({ shape: sh, fill: 'empty', markerAngle: ((i + j) * step) % 360 });
      rows.push(row3);
    }
    var rightAngle = (4 * step) % 360;
    rows[2][2] = { blank: true };
    var optsR = [{ shape: sh, fill: 'empty', markerAngle: rightAngle },
                 { shape: sh, fill: 'empty', markerAngle: (rightAngle + step) % 360 },
                 { shape: sh, fill: 'empty', markerAngle: (rightAngle - step + 360) % 360 },
                 { shape: sh, fill: 'empty', markerAngle: (rightAngle + 2 * step) % 360 }];
    if (!distinctShapes(optsR)) return null;
    var s3b = shuffleOptions(r, optsR, 0);
    return { topic: 'المرونة العقلية: أنماط', type: 'figural', prompt: 'أكملي المصفوفة.',
             stimulus: { kind: 'matrix', rows: rows },
             optionShapes: s3b.options, answer: s3b.answer,
             explain: 'النقطة تدور ' + arD(step) + ' درجة في كل خطوة.' };
  }

  var FAMILIES = { numseq: numseq, shapeseq: shapeseq, spatial: spatial,
                   mech: mech, patterns: patterns };

  /* فحص السلامة: أربعة خيارات متمايزة، وموضع صحيح، ونص موجود */
  function check(q) {
    if (!q || !q.prompt || !q.explain) return 'missing prompt or explain';
    var opts = q.optionShapes || q.options;
    if (!opts || opts.length !== 4) return 'not four options';
    if (!distinctShapes(opts)) return 'options not distinct';
    if (!(q.answer >= 0 && q.answer < 4)) return 'answer out of range';
    return null;
  }

  var failures = [];
  function make(skillId, level, seed) {
    var fn = FAMILIES[skillId];
    if (!fn) return null;
    for (var attempt = 0; attempt < 25; attempt++) {
      var q = null;
      try { q = fn(rng((seed || 1) * 7919 + attempt * 104729), level); } catch (e) { q = null; }
      if (!q) continue;
      var bad = check(q);
      if (bad) { failures.push({ skill: skillId, level: level, seed: seed, why: bad }); continue; }
      q.id = 'g-' + skillId + '-' + level + '-' + (seed || 0) + '-' + attempt;
      q.generated = true;
      q.level = level;
      return q;
    }
    failures.push({ skill: skillId, level: level, seed: seed, why: 'no valid question in 25 tries' });
    return null;
  }

  global.MW = global.MW || {};
  global.MW.Gen = { make: make, check: check, skills: Object.keys(FAMILIES),
                    failures: failures, arD: arD };
})(window);
