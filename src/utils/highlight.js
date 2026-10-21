// Tiny dependency-free syntax highlighter for the languages used in the courses.
// Returns an array of { t: tokenType | null, v: text } so React can render spans without innerHTML.

const PY_KW = 'False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|self|print|len|range|int|str|float|list|dict|set|tuple|bool|type|isinstance|enumerate|zip|map|filter|sorted|sum|min|max|open|input';
const JS_KW = 'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|null|undefined|true|false|console|document|window';
const SQL_KW = 'SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|AS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|UNION|ALL|IN|IS|NULL|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX|INDEX|VIEW|WITH|DEFAULT|UNIQUE|CHECK|CONSTRAINT|INT|INTEGER|VARCHAR|TEXT|DATE|DECIMAL|NUMERIC|BOOLEAN|BIGINT|SERIAL|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|BEGIN|COMMIT|ROLLBACK|TRANSACTION|IF|SCHEMA|RETURNING|ASC|DESC|CAST|COALESCE|TRUE|FALSE';

const RULES = {
  python: [
    ['com', /#[^\n]*/y],
    ['str', /("""[\s\S]*?"""|'''[\s\S]*?'''|[rbfu]{0,2}"(?:\\.|[^"\\\n])*"|[rbfu]{0,2}'(?:\\.|[^'\\\n])*')/yi],
    ['kw', new RegExp(`\\b(?:${PY_KW})\\b`, 'y')],
    ['num', /\b\d+(?:\.\d+)?\b/y],
    ['fn', /\b[A-Za-z_]\w*(?=\()/y],
  ],
  javascript: [
    ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['str', /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
    ['kw', new RegExp(`\\b(?:${JS_KW})\\b`, 'y')],
    ['num', /\b\d+(?:\.\d+)?\b/y],
    ['fn', /\b[A-Za-z_$][\w$]*(?=\()/y],
  ],
  sql: [
    ['com', /--[^\n]*|\/\*[\s\S]*?\*\//y],
    ['str', /'(?:''|[^'])*'/y],
    ['kw', new RegExp(`\\b(?:${SQL_KW})\\b`, 'yi')],
    ['num', /\b\d+(?:\.\d+)?\b/y],
    ['fn', /\b[A-Za-z_]\w*(?=\()/y],
  ],
  css: [
    ['com', /\/\*[\s\S]*?\*\//y],
    ['str', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y],
    ['attr', /--?[A-Za-z][\w-]*(?=\s*:)/y],
    ['num', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|fr|deg)?\b/y],
    ['kw', /@[\w-]+|!important/y],
    ['fn', /\b[a-z-]+(?=\()/y],
  ],
  html: [
    ['com', /<!--[\s\S]*?-->/y],
    ['tag', /<\/?[A-Za-z][\w-]*|\/?>/y],
    ['attr', /\b[A-Za-z-:@]+(?==)/y],
    ['str', /"[^"]*"|'[^']*'/y],
  ],
};
RULES.js = RULES.javascript;
RULES.py = RULES.python;

export function detectLanguage(code = '', hint = '', courseId = '') {
  const h = String(hint || '').toLowerCase();
  if (h) {
    if (/py/.test(h)) return 'python';
    if (/sql|postgres|mysql/.test(h)) return 'sql';
    if (/html|jsx/.test(h)) return 'html';
    if (/css/.test(h)) return 'css';
    if (/js|javascript|node|ts/.test(h)) return 'javascript';
    if (/bash|shell|sh|cmd|text|plain/.test(h)) return 'text';
  }
  const c = String(code);
  if (/^\s*(<!doctype|<html|<div|<section|<head|<body|<main|<form|<ul|<nav|<header|<button|<p\b|<h[1-6])/im.test(c)) return 'html';
  if (/\b(SELECT|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|WITH\s+\w+\s+AS)\b/i.test(c) && !/\bdef\s|import\s+\w+|print\(/.test(c)) return 'sql';
  if (/^\s*([.#:]?[\w-]+[^{;\n]*\{[\s\S]*?:[\s\S]*?;[\s\S]*?\}|:root\s*\{|@media)/m.test(c) && !/function|=>|const |let /.test(c)) return 'css';
  if (/\b(const|let|var|function)\b|=>|console\.log|document\.|addEventListener/.test(c) && !/\bdef\s|^\s*import\s+\w+\s*$|print\(/m.test(c)) return 'javascript';
  if (/^\s*(\$|npm |pip |git |cd |mkdir )/m.test(c)) return 'text';
  if (courseId === 'sql-mastery') return 'sql';
  if (courseId === 'web-development') return 'javascript';
  return 'python';
}

export function tokenize(code = '', lang = 'python') {
  const rules = RULES[lang];
  const src = String(code);
  if (!rules) return [{ t: null, v: src }];
  const out = [];
  let i = 0;
  let plain = '';
  while (i < src.length) {
    let matched = false;
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m.index === i && m[0].length) {
        if (plain) { out.push({ t: null, v: plain }); plain = ''; }
        out.push({ t: type, v: m[0] });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Skip whole identifiers so keywords are never matched inside longer words.
      const word = /[A-Za-z_$][\w$]*/y;
      word.lastIndex = i;
      const w = word.exec(src);
      if (w && w.index === i) { plain += w[0]; i += w[0].length; }
      else { plain += src[i]; i += 1; }
    }
  }
  if (plain) out.push({ t: null, v: plain });
  return out;
}

/** Split tokens into lines (tokens that span lines are split too) – used for line numbers. */
export function tokenLines(code, lang) {
  const lines = [[]];
  for (const tok of tokenize(code, lang)) {
    const parts = tok.v.split('\n');
    parts.forEach((p, k) => {
      if (k > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ t: tok.t, v: p });
    });
  }
  return lines;
}

export const LANG_LABEL = { python: 'Python', javascript: 'JavaScript', sql: 'SQL', css: 'CSS', html: 'HTML', text: 'Shell' };
export const isRunnable = (lang) => ['python', 'javascript', 'sql', 'css', 'html'].includes(lang);
