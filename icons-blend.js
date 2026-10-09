/* icons-blend.js — النهج المختلط: صور OpenMoji الملوّنة (مفتوحة المصدر، CC BY-SA 4.0)
   للأشياء الحيّة والطعام ووسائل النقل، ورسومي أنا للأشكال والمصفوفات والمخطّطات.
   قاعدة ثابتة: أسلوب واحد داخل السؤال الواحد، حتى لا يصير اختلاف الأسلوب دليلاً على الإجابة. */
(function (g) {
  'use strict';
  var MW = g.MW = g.MW || {};
  var map = {}, switchIds = {};

  /* «om:1F408» تُرسم من الملفّ المحلّي؛ كل ما عداها يبقى رسماً أصلياً */
  if (MW.Icons) {
    var orig = MW.Icons.inner;
    MW.Icons.inner = function (name) {
      if (typeof name === 'string' && name.indexOf('om:') === 0) {
        var hx = name.slice(3).replace(/[^0-9A-Fa-f-]/g, '');
        return '<image href="assets/openmoji/' + hx + '.svg" x="0" y="0" width="100" height="100"/>';
      }
      return orig(name);
    };
  }

  function deep(o) { return JSON.parse(JSON.stringify(o)); }
  function swap(node) {
    if (Array.isArray(node)) { node.forEach(swap); return; }
    if (!node || typeof node !== 'object') return;
    if (typeof node.icon === 'string' && map[node.icon]) node.icon = 'om:' + map[node.icon];
    for (var k in node) if (k !== 'icon') swap(node[k]);
  }

  MW.Blend = {
    setup: function (doc) { map = (doc && doc.map) || {}; switchIds = {};
      ((doc && doc.questions) || []).forEach(function (id) { switchIds[id] = 1; }); },
    /* يُطبَّق على نسخة في الذاكرة فقط؛ ملف المحتوى لا يُمسّ */
    apply: function (q) {
      if (!switchIds[q.id]) return q;
      var c = deep(q); swap(c.stimulus); swap(c.optionShapes); return c;
    }
  };
})(window);
