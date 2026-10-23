// Converts LaTeX maths (as written in the course text) into readable plain text for the PDF,
// e.g. \frac{a}{b} -> (a)/(b), \binom{n}{k} -> C(n, k), \mu -> mu, x^{n-k} -> x^(n-k).
const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega', 'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega'];
export function latexToText(tex) {
  let t = String(tex);
  // one-argument wrappers whose content is kept as-is
  const unwrap = ['text', 'mathrm', 'mathbf', 'mathbb', 'mathcal', 'mathit', 'operatorname', 'boldsymbol', 'textbf', 'textit'];
  // commands with braces: repeat so nested ones resolve from the inside out
  for (let pass = 0; pass < 6; pass++) {
    const before = t;
    t = t.replace(/\\(?:d|t)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)')
      .replace(/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, 'C($1, $2)')
      .replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, 'root$1($2)')
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)')
      .replace(/\\(?:hat|widehat)\s*\{([^{}]*)\}/g, '$1_hat')
      .replace(/\\(?:bar|overline)\s*\{([^{}]*)\}/g, '$1_bar')
      .replace(/\\(?:tilde|widetilde)\s*\{([^{}]*)\}/g, '$1~')
      .replace(/\\vec\s*\{([^{}]*)\}/g, '$1')
      .replace(/\\underbrace\s*\{([^{}]*)\}\s*_\s*\{([^{}]*)\}/g, '$1')
      .replace(new RegExp(`\\\\(?:${unwrap.join('|')})\\s*\\{([^{}]*)\\}`, 'g'), '$1')
      .replace(/\^\s*\{([^{}]*)\}/g, (m, x) => (x.length > 1 ? `^(${x})` : `^${x}`))
      .replace(/_\s*\{([^{}]*)\}/g, (m, x) => (x.length > 1 ? `_(${x})` : `_${x}`));
    if (t === before) break;
  }
  const words = {
    cdot: '*', times: 'x', div: '/', pm: '+/-', neq: '!=', ne: '!=', leq: '<=', le: '<=', geq: '>=', ge: '>=', approx: '~=', sim: '~', propto: '~',
    infty: 'infinity', in: ' in ', notin: ' not in ', forall: 'for all ', exists: 'there exists ', partial: 'd', nabla: 'grad ', odot: ' (.) ',
    to: '->', rightarrow: '->', Rightarrow: '=>', leftarrow: '<-', mid: '|', setminus: '\\', subseteq: ' subset of ', subset: ' subset of ', cup: ' U ', cap: ' n ',
    sum: 'sum', prod: 'prod', int: 'integral', log: 'log', ln: 'ln', exp: 'exp', min: 'min', max: 'max', arg: 'arg', lim: 'lim',
    ldots: '...', cdots: '...', dots: '...', quad: '  ', qquad: '   ', left: '', right: '', big: '', Big: '', lvert: '|', rvert: '|', lVert: '||', rVert: '||', top: 'T'
  };
  t = t.replace(/\\([A-Za-z]+)/g, (m, w) => (GREEK.includes(w) ? w.replace(/^var/, '') : w in words ? words[w] : w));
  return t.replace(/\\[,;:! ]/g, ' ').replace(/\\\\/g, '; ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

// Is the text between two $ signs maths (as opposed to two prices, like "$300 to $500")?
// Maths: LaTeX markup, a plain number ($0.05$), or a short expression that does not start with a
// digit and has no space just inside the $ signs ($k$, $p < 0.05$).
export function isMathSpan(inner) {
  if (/[\\^_{}]/.test(inner)) return true;
  if (/^\d*\.?\d+$/.test(inner)) return true;
  return /[A-Za-z]/.test(inner) && !/^\s|\s$/.test(inner) && !/^\d/.test(inner) && inner.length <= 40;
}

/** Replaces $...$ / $$...$$ maths in prose with readable text; prices such as $300 are left alone. */
export function mathToText(str) {
  return String(str || '').replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (m, a, b) => (isMathSpan(a || b) ? latexToText(a || b) : m));
}
