/* bank.js — يبني بنك الأسئلة من المحتوى المنسوخ. لا يعدّل أيّ ملف محتوى. */
(function (g) {
  'use strict';
  var MW = g.MW = g.MW || {};
  var data = null, skills = null, byTopic = {}, byId = {}, dress = null;

  function load() {
    if (data && skills) return Promise.resolve(true);
    return Promise.all([
      fetch('content/exams.json').then(function (r) { return r.json(); }),
      fetch('skills.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      data = res[0]; skills = res[1];
      var held = skills.heldBackExam;
      data.exams.forEach(function (ex) {
        ex.blocks.forEach(function (b) {
          b.questions.forEach(function (q) {
            var item = {};
            for (var k in q) item[k] = q[k];
            item.domain = b.domain;
            /* النص يُلصق بسؤاله حتى يظهر معه دائماً */
            if (b.passage) item.passage = b.passage;
            item.examId = ex.id;
            byId[item.id] = item;
            if (ex.id === held) return;
            (byTopic[item.topic] || (byTopic[item.topic] = [])).push(item);
          });
        });
        if (ex.id === held) dress = ex;
      });
      return true;
    });
  }

  function skillList() { return skills.skills; }
  function skillById(id) {
    for (var i = 0; i < skills.skills.length; i++) if (skills.skills[i].id === id) return skills.skills[i];
    return null;
  }
  function domains() { return skills.domains; }
  function question(id) { return byId[id]; }
  function dressExam() { return dress; }
  function blockPlan() {
    /* نفس خطة الأقسام في exams.json: ١٢ قسماً */
    return data.exams[0].blocks.map(function (b) {
      return { id: b.id, title: b.title, domain: b.domain,
               count: b.questions.length, seconds: b.seconds, topic: b.questions[0].topic };
    });
  }

  /* أسئلة مؤلّفة لمهارة، مرتّبة بالأقدم رؤيةً أولاً، مع تبادل الصورة والكلمة */
  function authoredFor(skillId, state, avoidDays) {
    var sk = skillById(skillId);
    var seen = (state.skills[skillId] && state.skills[skillId].seen) || {};
    var today = MW.Store.today();
    var all = [];
    sk.topics.forEach(function (t) { all = all.concat(byTopic[t] || []); });
    function age(q) {
      var d = seen[q.id];
      return d ? MW.Store.daysBetween(d, today) : 9999;
    }
    var fresh = all.filter(function (q) { return age(q) >= (avoidDays === undefined ? 10 : avoidDays); });
    var exhausted = false;
    if (!fresh.length) { fresh = all.slice(); exhausted = true; }
    fresh.sort(function (a, b) { return age(b) - age(a); });
    return { items: fresh, exhausted: exhausted, pictureIds: sk.pictureIds || [] };
  }

  /* السؤال التالي لمهارة: مولَّد إن أمكن، وإلا مؤلّف. يتبادل الصورة والكلمة. */
  function nextQuestion(skillId, state, opts) {
    opts = opts || {};
    var sk = skillById(skillId);
    var st = state.skills[skillId] || {};
    var level = opts.level || st.level || 1;
    var canGen = MW.Gen && MW.Gen.skills.indexOf(skillId) !== -1;

    /* المهارات المولَّدة: نخلط المولَّد بالمؤلّف حتى لا يغيب نمط الكتاب */
    if (canGen && (opts.forceGen || Math.random() < 0.65)) {
      var q = MW.Gen.make(skillId, level, Math.floor(Math.random() * 1e9));
      if (q) { q.domain = sk.domain; return { q: q, generated: true, exhausted: false }; }
    }
    var pool = authoredFor(skillId, state, opts.avoidDays);
    if (!pool.items.length) {
      if (canGen) {
        var q2 = MW.Gen.make(skillId, level, Math.floor(Math.random() * 1e9));
        if (q2) { q2.domain = sk.domain; return { q: q2, generated: true, exhausted: false }; }
      }
      return null;
    }
    /* تبادل: إن كان آخر عنصر كلمة، فضّلي صورة، والعكس */
    var pics = pool.pictureIds;
    if (pics.length && sk.topics.length > 1) {
      var lastWasPic = st.lastWasPicture;
      var want = pool.items.filter(function (x) {
        return lastWasPic ? pics.indexOf(x.id) === -1 : pics.indexOf(x.id) !== -1;
      });
      if (want.length) pool.items = want;
    }
    var chosen = pool.items[0];
    return { q: chosen, generated: false, exhausted: pool.exhausted,
             isPicture: pics.indexOf(chosen.id) !== -1 };
  }

  MW.Bank = { load: load, skillList: skillList, skillById: skillById, domains: domains,
              question: question, dressExam: dressExam, blockPlan: blockPlan,
              authoredFor: authoredFor, nextQuestion: nextQuestion,
              topicPool: function (t) { return byTopic[t] || []; } };
})(window);
