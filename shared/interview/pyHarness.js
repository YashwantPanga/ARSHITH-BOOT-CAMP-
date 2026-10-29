// Builds the Python program that checks a learner's DSA answer: helper classes, the learner's code,
// then a runner that calls their function on each test and prints one JSON result line.
// Used by the browser (Pyodide) and by scripts/verify-interview.mjs (local Python).

export const RESULT_MARK = '__ARB_RESULT__';

const HELPERS = `
import json as _json, copy as _copy

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_linked(vals):
    dummy = tail = ListNode()
    for v in vals:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def _to_cycle(spec):
    vals, pos = spec
    head = _to_linked(vals)
    if pos >= 0 and head:
        nodes, n = [], head
        while n:
            nodes.append(n)
            n = n.next
        nodes[-1].next = nodes[pos]
    return head

def _from_linked(node):
    out = []
    while node is not None and len(out) < 10000:
        out.append(node.val)
        node = node.next
    return out

def _to_tree(vals):
    if not vals or vals[0] is None:
        return None
    root = TreeNode(vals[0])
    q, i = [root], 1
    while q and i < len(vals):
        node = q.pop(0)
        if i < len(vals) and vals[i] is not None:
            node.left = TreeNode(vals[i]); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] is not None:
            node.right = TreeNode(vals[i]); q.append(node.right)
        i += 1
    return root

def _from_tree(root):
    out, q = [], [root]
    while q:
        node = q.pop(0)
        if node is None:
            out.append(None)
        else:
            out.append(node.val)
            q.append(node.left)
            q.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out

def _plain(v):
    if isinstance(v, tuple):
        v = list(v)
    if isinstance(v, list):
        return [_plain(x) for x in v]
    return v

def _norm(v, mode):
    v = _plain(v)
    if mode in ('unordered', 'nested') and isinstance(v, list):
        if mode == 'nested':
            v = [sorted(x, key=repr) if isinstance(x, list) else x for x in v]
        v = sorted(v, key=repr)
    return v
`;

const RUNNER = `
def _arb_run(_fn_name, _tests, _kinds, _returns, _compare, _limit):
    _fn = globals().get(_fn_name)
    if not callable(_fn):
        print(${JSON.stringify(RESULT_MARK)} + _json.dumps({"error": "Define a function named " + _fn_name + "(...)"}))
        return
    _conv = {"linked": _to_linked, "tree": _to_tree, "cycle": _to_cycle}
    _results = []
    for _i, (_args, _expected) in enumerate(_tests[:_limit]):
        _call = [_conv[_kinds[_j]](_copy.deepcopy(_a)) if _j < len(_kinds) and _kinds[_j] else _copy.deepcopy(_a) for _j, _a in enumerate(_args)]
        try:
            _got = _fn(*_call)
            if _returns == "linked":
                _got = _from_linked(_got)
            elif _returns == "tree":
                _got = _from_tree(_got)
            _ok = _norm(_got, _compare) == _norm(_expected, _compare)
            try:
                _json.dumps(_got)
            except Exception:
                _got = repr(_got)
            _results.append({"ok": _ok, "got": _got})
        except Exception as _e:
            _results.append({"ok": False, "error": type(_e).__name__ + ": " + str(_e)})
    print(${JSON.stringify(RESULT_MARK)} + _json.dumps({"results": _results}))
`;

/** Python source that runs `code` against the first `limit` tests of `problem`. */
export function buildPythonCheck(problem, code, limit = Infinity) {
  const n = Math.min(problem.tests.length, limit);
  const cfg = JSON.stringify({ tests: problem.tests, kinds: problem.kinds || [], returns: problem.returns || null, compare: problem.compare || 'exact' });
  return `${HELPERS}\n${code}\n${RUNNER}\n_cfg = _json.loads(${JSON.stringify(cfg)})\n_arb_run(${JSON.stringify(problem.fn)}, _cfg["tests"], _cfg["kinds"], _cfg["returns"], _cfg["compare"], ${n})\n`;
}

/** Splits program output into the learner's own printed text and the parsed result line. */
export function parsePythonCheck(output) {
  const at = output.lastIndexOf(RESULT_MARK);
  if (at < 0) return { printed: output, result: null };
  const line = output.slice(at + RESULT_MARK.length).split('\n')[0];
  let result = null;
  try { result = JSON.parse(line); } catch { result = null; }
  return { printed: output.slice(0, at).replace(/\s+$/, ''), result };
}

/** Python-style text for a JSON value, for showing examples (`True`, `None`, 'text'). */
export function pyRepr(v) {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(', ')}]`;
  return String(v);
}

/** Starter code shown in the editor. */
export function pythonStarter(problem) {
  const notes = [];
  if ((problem.kinds || []).some(k => k === 'linked' || k === 'cycle') || problem.returns === 'linked') notes.push('# ListNode has .val and .next');
  if ((problem.kinds || []).includes('tree') || problem.returns === 'tree') notes.push('# TreeNode has .val, .left and .right');
  return `${notes.length ? notes.join('\n') + '\n' : ''}def ${problem.fn}(${problem.params}):\n    # Write your solution here\n    pass\n`;
}
