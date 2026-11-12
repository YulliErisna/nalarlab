// Safe arithmetic expression parser for student formulas (no eval).
// Supports: numbers (decimal comma or dot), one variable, + − × ÷ ^, parentheses,
// implicit multiplication (3n, 2(n − 1), (n + 1)(n − 1)) and an optional "K =" prefix.

export class FormulaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormulaError';
  }
}

const SYMBOLS = { '×': '*', '·': '*', '∙': '*', '÷': '/', ':': '/', '−': '-', '–': '-', '—': '-' };

export function normalizeInput(input) {
  let text = String(input ?? '').trim();
  // Drop a leading "y =", "K(n) =", "U_n =" style prefix.
  const eq = text.indexOf('=');
  if (eq !== -1) {
    if (text.indexOf('=', eq + 1) !== -1) throw new FormulaError('Tuliskan satu rumus saja, dengan paling banyak satu tanda "=".');
    text = text.slice(eq + 1).trim();
  }
  text = text.replace(/[×·∙÷:−–—]/g, (ch) => SYMBOLS[ch]);
  text = text.replace(/²/g, '^2').replace(/³/g, '^3');
  return text;
}

export function tokenize(input, variable) {
  const text = normalizeInput(input);
  if (!text) throw new FormulaError('Rumus masih kosong. Tuliskan rumus, misalnya 4n + 8.');
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ' ') {
      i += 1;
      continue;
    }
    if (/[0-9]/.test(ch) || ((ch === ',' || ch === '.') && /[0-9]/.test(text[i + 1] || ''))) {
      let j = i;
      let seenSep = false;
      while (j < text.length) {
        const c = text[j];
        if (/[0-9]/.test(c)) {
          j += 1;
        } else if ((c === ',' || c === '.') && !seenSep && /[0-9]/.test(text[j + 1] || '')) {
          seenSep = true;
          j += 1;
        } else break;
      }
      tokens.push({ type: 'num', value: Number(text.slice(i, j).replace(',', '.')), pos: i });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      if (ch.toLowerCase() !== variable.toLowerCase()) {
        throw new FormulaError(`Huruf "${ch}" tidak dikenal. Pada misi ini gunakan variabel ${variable}.`);
      }
      tokens.push({ type: 'var', pos: i });
      i += 1;
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i });
      i += 1;
      continue;
    }
    throw new FormulaError(`Simbol "${ch}" tidak bisa dipakai. Gunakan angka, ${variable}, + − × ÷ dan tanda kurung.`);
  }
  return tokens;
}

/** Parse into an AST: {t:'num',v} | {t:'var'} | {t:'neg',a} | {t:'bin',op,a,b} */
export function parse(input, variable = 'n') {
  const tokens = tokenize(input, variable);
  let index = 0;
  const peek = () => tokens[index];
  const next = () => tokens[index++];
  const isOp = (tok, value) => tok && tok.type === 'op' && tok.value === value;

  function parseExpr() {
    let node = parseTerm();
    while (isOp(peek(), '+') || isOp(peek(), '-')) {
      const op = next().value;
      if (!peek()) throw new FormulaError(`Rumus berakhir dengan tanda "${op === '-' ? '−' : op}". Lengkapi bagian setelahnya.`);
      node = { t: 'bin', op, a: node, b: parseTerm() };
    }
    return node;
  }

  function startsFactor(tok) {
    return tok && (tok.type === 'var' || tok.type === 'num' || isOp(tok, '('));
  }

  function parseTerm() {
    let node = parseUnary();
    for (;;) {
      const tok = peek();
      if (isOp(tok, '*') || isOp(tok, '/')) {
        next();
        if (!peek()) throw new FormulaError('Rumus berakhir dengan tanda kali atau bagi.');
        node = { t: 'bin', op: tok.value, a: node, b: parseUnary() };
      } else if (startsFactor(tok)) {
        if (tok.type === 'num' && node.t !== 'num' && !(node.t === 'bin' && node.op === '^')) {
          // e.g. "n4" — ambiguous, ask for an explicit operator.
          throw new FormulaError('Tulis angka sebelum variabel (misalnya 4n), atau gunakan tanda kali.');
        }
        if (tok.type === 'num' && node.t === 'num') throw new FormulaError('Ada dua angka berdampingan tanpa operasi di antaranya.');
        node = { t: 'bin', op: '*', a: node, b: parseUnary() };
      } else break;
    }
    return node;
  }

  function parseUnary() {
    if (isOp(peek(), '-')) {
      next();
      return { t: 'neg', a: parseUnary() };
    }
    if (isOp(peek(), '+')) {
      next();
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    if (isOp(peek(), '^')) {
      next();
      return { t: 'bin', op: '^', a: base, b: parseUnary() };
    }
    return base;
  }

  function parsePrimary() {
    const tok = next();
    if (!tok) throw new FormulaError('Rumus belum lengkap.');
    if (tok.type === 'num') return { t: 'num', v: tok.value };
    if (tok.type === 'var') return { t: 'var' };
    if (isOp(tok, '(')) {
      if (isOp(peek(), ')')) throw new FormulaError('Tanda kurung masih kosong.');
      const inner = parseExpr();
      if (!isOp(next(), ')')) throw new FormulaError('Ada tanda kurung buka yang belum ditutup.');
      return inner;
    }
    if (isOp(tok, ')')) throw new FormulaError('Ada tanda kurung tutup tanpa pasangan.');
    throw new FormulaError(`Tanda "${tok.value === '-' ? '−' : tok.value}" muncul di tempat yang tidak tepat.`);
  }

  const ast = parseExpr();
  if (index < tokens.length) {
    const tok = tokens[index];
    if (isOp(tok, ')')) throw new FormulaError('Ada tanda kurung tutup tanpa pasangan.');
    throw new FormulaError('Bagian akhir rumus tidak bisa dibaca. Periksa kembali susunannya.');
  }
  return ast;
}

export function evaluate(ast, x) {
  switch (ast.t) {
    case 'num':
      return ast.v;
    case 'var':
      return x;
    case 'neg':
      return -evaluate(ast.a, x);
    case 'bin': {
      const a = evaluate(ast.a, x);
      const b = evaluate(ast.b, x);
      if (ast.op === '+') return a + b;
      if (ast.op === '-') return a - b;
      if (ast.op === '*') return a * b;
      if (ast.op === '/') return a / b;
      if (ast.op === '^') return a ** b;
      return NaN;
    }
    default:
      return NaN;
  }
}

/** Compile a formula string into a function, or throw FormulaError. */
export function compile(input, variable = 'n') {
  const ast = parse(input, variable);
  return { ast, fn: (x) => evaluate(ast, x) };
}

// ---------- Formatting ----------

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });

/** Indonesian number formatting with a typographic minus sign. */
export function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 1000) / 1000;
  const text = numberFormatter.format(Math.abs(rounded) < 1e-9 ? 0 : rounded);
  return text.replace('-', '−');
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, neg: 2.5 };

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/** Render an AST as typeset HTML (used for the live formula preview). */
export function astToHtml(ast, variable) {
  const v = `<var>${escapeHtml(variable)}</var>`;
  function prec(node) {
    if (node.t === 'bin') return PREC[node.op];
    if (node.t === 'neg') return PREC.neg;
    return 4;
  }
  function wrap(node, minPrec) {
    const s = render(node);
    return prec(node) < minPrec ? `(${s})` : s;
  }
  function render(node) {
    switch (node.t) {
      case 'num':
        return `<span class="mn">${formatNumber(node.v)}</span>`;
      case 'var':
        return v;
      case 'neg':
        return `−${wrap(node.a, PREC.neg)}`;
      case 'bin': {
        if (node.op === '^') return `${wrap(node.a, 4)}<sup>${render(node.b)}</sup>`;
        if (node.op === '*') {
          const left = wrap(node.a, 2);
          const right = wrap(node.b, 2.6);
          const implicit = node.a.t === 'num' && (node.b.t === 'var' || prec(node.b) < 2 || node.b.t === 'bin');
          return implicit ? `${left}${right}` : `${left} × ${right}`;
        }
        if (node.op === '/') return `${wrap(node.a, 2)} ÷ ${wrap(node.b, 2.6)}`;
        const right = wrap(node.b, node.op === '-' ? 1.5 : 1);
        return `${render(node.a)} ${node.op === '-' ? '−' : '+'} ${right}`;
      }
      default:
        return '';
    }
  }
  return render(ast);
}

/** Canonical HTML for y = m·v + c, e.g. "4n + 8", "30 − 1,5x", "15x". */
export function linearHtml(m, c, variable, { highlight = false } = {}) {
  const v = `<var>${escapeHtml(variable)}</var>`;
  const mark = (cls, inner) => (highlight ? `<mark class="hl hl-${cls}">${inner}</mark>` : inner);
  const coef = (abs) => (Math.abs(abs - 1) < 1e-9 ? '' : formatNumber(abs));
  const zero = (x) => Math.abs(x) < 1e-9;
  if (zero(m)) return mark('c', formatNumber(c));
  const slopeTerm = mark('m', `${coef(Math.abs(m))}${v}`);
  if (zero(c)) return m < 0 ? `−${slopeTerm}` : slopeTerm;
  if (m < 0 && c > 0) return `${mark('c', formatNumber(c))} − ${slopeTerm}`;
  const sign = c < 0 ? '−' : '+';
  return `${m < 0 ? '−' : ''}${slopeTerm} ${sign} ${mark('c', formatNumber(Math.abs(c)))}`;
}

/** Plain-text version of linearHtml (for aria labels and seeds). */
export function linearText(m, c, variable) {
  return linearHtml(m, c, variable).replace(/<[^>]+>/g, '');
}

/** Parse a numeric answer typed by a student ("7,5", "7.5", "−3"). */
export function parseNumber(text) {
  const cleaned = String(text ?? '')
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/\s/g, '');
  if (!cleaned) return null;
  // Allow thousands separators with dots only when followed by exactly 3 digits groups (e.g. 1.500).
  let normalized = cleaned;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(normalized)) normalized = normalized.replace(/\./g, '');
  normalized = normalized.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}
