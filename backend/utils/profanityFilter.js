// Hardcoded base list (English + Filipino)
const BASE_WORDS = [
  'fuck', 'fucker', 'fucking', 'fuk', 'f*ck',
  'shit', 'sh*t', 'shitty',
  'bitch', 'b*tch', 'bitches',
  'asshole', 'ass', 'a**',
  'bastard', 'damn', 'crap',
  'dick', 'cock', 'pussy',
  'whore', 'slut', 'hoe',
  'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'idiot', 'moron', 'stupid',
  'kill yourself', 'kys', 'die',
  'hate you', 'i hate you',
  'ugly', 'loser', 'worthless', 'useless',
  // Filipino
  'putang ina', 'putangina', 'puta', 'p*ta',
  'gago', 'gaga', 'gagong',
  'bobo', 'boba', 'tanga', 'tangina',
  'ulol', 'ulul',
  'leche', 'letse',
  'pakyu', 'pak yu', 'pakyo',
  'tarantado', 'tarantadong',
  'hayop', 'hayup',
  'inutil', 'walang kwenta',
  'bwisit', 'bwiset',
  'lintik', 'kupal', 'kupalmuks',
  'hindot', 'kantot',
  'pakshet',
  'siraulo', 'sira ulo',
];

// DB-sourced custom words — refreshed on each check via loadCustomWords()
let _customWords = [];

const _buildPattern = (word) =>
  word
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/a/gi, '[a@4]')
    .replace(/e/gi, '[e3]')
    .replace(/i/gi, '[i1!]')
    .replace(/o/gi, '[o0]')
    .replace(/s/gi, '[s$5]')
    .replace(/ /g, '[\\s_-]*');

const _toPattern = (word) => new RegExp(_buildPattern(word), 'gi');

let _basePatterns = BASE_WORDS.map(_toPattern);
let _customPatterns = [];

/** Call this once at startup and after any add/delete to sync DB words */
async function loadCustomWords() {
  try {
    const FilteredWord = require('../models/FilteredWord');
    const docs = await FilteredWord.find().lean();
    _customWords = docs.map(d => d.word);
    _customPatterns = _customWords.map(_toPattern);
  } catch (e) {
    // DB may not be ready yet on first boot — silently skip
  }
}

function _allPatterns() {
  return [..._basePatterns, ..._customPatterns];
}

function containsProfanity(text) {
  return _allPatterns().some(p => { p.lastIndex = 0; return p.test(text); });
}

/**
 * Replaces every bad word match with #### (same length awareness not needed — flat replacement).
 * Returns the censored string.
 */
function censorText(text) {
  let result = text;
  _allPatterns().forEach(p => {
    p.lastIndex = 0;
    result = result.replace(p, (match) => '####');
  });
  return result;
}

function getCustomWords() {
  return _customWords;
}

function getBaseWords() {
  return BASE_WORDS;
}

module.exports = { containsProfanity, censorText, loadCustomWords, getCustomWords, getBaseWords };
