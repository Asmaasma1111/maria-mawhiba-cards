/* Loads the real app modules in node with minimal shims, so the tests exercise
   the shipped code rather than a copy of it. */
const fs = require('fs');
const path = __dirname + '/../';
const mem = {};
global.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
global.location = { search: '' };
global.window = global;
global.fetch = (url) => Promise.resolve({
  json: () => Promise.resolve(JSON.parse(fs.readFileSync(path + url, 'utf8')))
});
global.MW = global.MW || {};
global.MW.Icons = { inner: n => '', icon: n => '' };   // the blend wraps this; drawing is not tested here
for (const f of ['generator.js','icons-blend.js','store.js','bank.js','scheduler.js']) require(path + f);
module.exports = { MW: global.MW };
