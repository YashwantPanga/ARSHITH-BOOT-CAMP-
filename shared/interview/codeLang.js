// Language of a model-answer code snippet. Items may say it outright (`lang`); otherwise it is
// worked out from the snippet itself. Used for the label on the code box and by the snippet checker.
export function codeLang(item) {
  if (item?.lang) return item.lang;
  const c = String(item?.code || '');
  if (/^\s*(--|(SELECT|WITH|CREATE|INSERT|UPDATE|DELETE|BEGIN|EXPLAIN|PRAGMA)\b)/i.test(c)) return 'sql';
  if (/\bpublic\s+(static\s+)?(class|void|int|String)\b|System\.out\.|^\s*\/\/ Java/m.test(c)) return 'java';
  if (/^\s*(\$ |git |docker |#!\/bin\/(ba)?sh)/m.test(c)) return 'shell';
  if (/^\s*(def |class \w+(\(|:)|import \w|from \w+ import |print\()/m.test(c)) return 'python';
  if (/\b(const|let|function)\b|=>|console\.log/.test(c)) return 'javascript';
  return 'text';
}

export const LANG_LABEL = {
  sql: 'SQL', python: 'Python', javascript: 'JavaScript', java: 'Java', shell: 'Terminal',
  html: 'HTML', css: 'CSS', jsx: 'React (JSX)', 'python-unix': 'Python (Linux or macOS)',
  yaml: 'YAML', nginx: 'Nginx config', dockerfile: 'Dockerfile', text: 'Example'
};
