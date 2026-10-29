// Extra approaches for Programming Essentials (format: see dsa.js).
import { A } from './dsa.js';

export const PE_APPROACHES = {
  'pe-01': {
    brute: A('String concatenation', 'Add letters to a result string one by one. Simple, but every `+=` can copy the whole string.',
      "def weave(a, b):\n    out = ''\n    for i in range(max(len(a), len(b))):\n        if i < len(a):\n            out += a[i]\n        if i < len(b):\n            out += b[i]\n    return out", 'O((n + m)²) worst case'),
    extra: [A('zip_longest (Pythonic)', '`itertools.zip_longest` pairs letters and fills the shorter word with empty strings.',
      "from itertools import zip_longest\n\ndef weave(a, b):\n    return ''.join(x + y for x, y in zip_longest(a, b, fillvalue=''))", 'O(n + m) time'),
      A('Recursion', 'The answer is the first letter of a, then the first of b, then weave the rest.',
      'def weave(a, b):\n    if not a: return b\n    if not b: return a\n    return a[0] + b[0] + weave(a[1:], b[1:])', 'O((n + m)²) because of slicing'),
      A('Two pointers with a generator', 'A generator yields letters from each word in turn; `join` collects them.',
      "def weave(a, b):\n    def letters():\n        i = j = 0\n        while i < len(a) or j < len(b):\n            if i < len(a):\n                yield a[i]; i += 1\n            if j < len(b):\n                yield b[j]; j += 1\n    return ''.join(letters())", 'O(n + m) time, O(1) extra')],
    pick: 'The index loop with a list and `join` is O(n + m), works in any language and needs no imports or edge-case tricks.'
  },
  'pe-02': {
    brute: A('Sort and compare', 'Sort both strings; the first position where they differ (or the last letter of t) is the extra letter.',
      'def extra_letter(s, t):\n    s, t = sorted(s), sorted(t)\n    for a, b in zip(s, t):\n        if a != b:\n            return b\n    return t[-1]', 'O(n log n) time'),
    extra: [A('Counter difference', 'Subtracting the letter counts of s from t leaves exactly one letter.',
      'from collections import Counter\n\ndef extra_letter(s, t):\n    return next(iter(Counter(t) - Counter(s)))', 'O(n) time, O(1) space for letters'),
      A('XOR of all letters', 'Every letter of s cancels its copy in t; XOR leaves the extra one.',
      'def extra_letter(s, t):\n    x = 0\n    for ch in s + t:\n        x ^= ord(ch)\n    return chr(x)', 'O(n) time, O(1) space')],
    pick: 'Summing letter codes is O(n), O(1) space and easy to explain; XOR is the same idea without any risk of overflow in other languages.'
  },
  'pe-03': {
    extra: [A('Compare character by character', 'At each start position compare letters one at a time and stop at the first mismatch.',
      'def find_first(text, word):\n    if not word:\n        return 0\n    for i in range(len(text) - len(word) + 1):\n        j = 0\n        while j < len(word) and text[i + j] == word[j]:\n            j += 1\n        if j == len(word):\n            return i\n    return -1', 'O(n · m) worst case, usually faster')],
    pick: 'Slice comparison is the clearest; mention KMP (O(n + m)) if they ask how to avoid the worst case.'
  },
  'pe-04': {
    extra: [A('Doubled-string trick', 'If s is made of a repeated block, it appears inside (s + s) with the first and last characters removed.',
      'def is_repeated_block(s):\n    return s in (s + s)[1:-1]', 'O(n) average with fast substring search')],
    pick: 'Trying block sizes that divide the length is easy to explain; the doubled-string trick is a famous one-liner to mention afterwards.'
  },
  'pe-05': {
    brute: A('Build a new list', 'Collect the non-zero numbers, then add the right number of zeros.',
      'def zeros_to_end(nums):\n    kept = [x for x in nums if x != 0]\n    return kept + [0] * (len(nums) - len(kept))', 'O(n) time, O(n) extra space'),
    extra: [A('Swap with a write pointer', 'Swap each non-zero number into the write position; zeros drift to the end.',
      'def zeros_to_end(nums):\n    w = 0\n    for i in range(len(nums)):\n        if nums[i] != 0:\n            nums[w], nums[i] = nums[i], nums[w]\n            w += 1\n    return nums', 'O(n) time, in place')],
    pick: 'The write-pointer version changes the list in place with O(1) extra space, which is what "move zeroes" questions ask for.'
  },
  'pe-06': {
    brute: A('Convert to a number', 'Join the digits into an integer, add one, split back into digits.',
      "def plus_one(digits):\n    return [int(ch) for ch in str(int(''.join(map(str, digits))) + 1)]", 'O(n) time, needs big integers'),
    pick: 'Adding from the right with a carry works for any length and in any language.'
  },
  'pe-07': {
    brute: A('Multiply everything', 'Compute the real product and check its sign. Fine in Python, but the number can become enormous.',
      'from math import prod\n\ndef product_sign(nums):\n    p = prod(nums)\n    return (p > 0) - (p < 0)', 'O(n) time, huge numbers'),
    extra: [A('Count the negatives', 'If any zero, return 0; otherwise the sign depends on whether the number of negatives is odd.',
      'def product_sign(nums):\n    if 0 in nums:\n        return 0\n    return -1 if sum(x < 0 for x in nums) % 2 else 1', 'O(n) time')],
    pick: 'Flipping a sign variable is O(n), O(1) space and never builds a huge number.'
  },
  'pe-08': {
    extra: [A('Compare with sorted copies', 'The list is steady if it equals its sorted version or its reverse-sorted version.',
      'def is_monotonic(nums):\n    return nums == sorted(nums) or nums == sorted(nums, reverse=True)', 'O(n log n) time'),
      A('all() on neighbours', 'Check every neighbouring pair goes the same way.',
      'def is_monotonic(nums):\n    pairs = list(zip(nums, nums[1:]))\n    return all(a <= b for a, b in pairs) or all(a >= b for a, b in pairs)', 'O(n) time')],
    pick: 'Tracking both directions in one loop is O(n), single pass and easy to reason about.'
  },
  'pe-09': {
    extra: [A('Scan from the end', 'Skip trailing spaces from the right, then count letters until the next space.',
      "def last_word_length(s):\n    i = len(s) - 1\n    while i >= 0 and s[i] == ' ':\n        i -= 1\n    length = 0\n    while i >= 0 and s[i] != ' ':\n        length += 1\n        i -= 1\n    return length", 'O(n) time, O(1) space')],
    pick: '`split()` is the clearest; the backward scan is the answer if they ask for O(1) extra space.'
  },
  'pe-10': {
    extra: [A('Translation table', '`str.maketrans` maps every uppercase letter to its lowercase twin in one table.',
      "import string\n\ndef to_lower(s):\n    return s.translate(str.maketrans(string.ascii_uppercase, string.ascii_lowercase))", 'O(n) time')],
    pick: 'Using character codes shows you understand how letters are stored, which is the point of the exercise.'
  },
  'pe-11': {
    brute: A('Loop with a counter', 'Go through the characters and add one for each vowel.',
      "def count_vowels(s):\n    count = 0\n    for ch in s:\n        if ch in 'aeiouAEIOU':\n            count += 1\n    return count", 'O(n) time'),
    extra: [A('Counter', 'Count every character, then add up the vowel counts.',
      "from collections import Counter\n\ndef count_vowels(s):\n    c = Counter(s.lower())\n    return sum(c[v] for v in 'aeiou')", 'O(n) time')],
    pick: '`sum` over a generator is short, readable and O(n).'
  },
  'pe-12': {
    extra: [A('Loop with a flag', 'Walk the characters, uppercasing a letter when it follows a space (or starts the string) and lowercasing the rest.',
      "def title_words(s):\n    out, start = [], True\n    for ch in s:\n        out.append(ch.upper() if start else ch.lower())\n        start = ch == ' '\n    return ''.join(out)", 'O(n) time')],
    pick: 'Split, fix each word, join: it reads exactly like the problem statement.'
  },
  'pe-13': {
    brute: A('Count inside the key', 'Use `nums.count(x)` in the sort key. Correct but counts again for every element.',
      'def frequency_sort(nums):\n    return sorted(nums, key=lambda x: (nums.count(x), -x))', 'O(n² log n) time'),
    pick: 'Counting once with `Counter` and sorting with a tuple key is O(n log n).'
  },
  'pe-14': {
    extra: [A('Match statement (Python 3.10+)', 'The same stack, with `match` making each rule stand out.',
      "def score_keeper(ops):\n    scores = []\n    for op in ops:\n        match op:\n            case '+':\n                scores.append(scores[-1] + scores[-2])\n            case 'D':\n                scores.append(2 * scores[-1])\n            case 'C':\n                scores.pop()\n            case _:\n                scores.append(int(op))\n    return sum(scores)", 'O(n) time')],
    pick: 'Both use a stack; if/elif works in every Python version.'
  },
  'pe-15': {
    brute: A('Simulate the moves', 'Track x and y and update them for each move.',
      "def returns_home(moves):\n    x = y = 0\n    for m in moves:\n        if m == 'U': y += 1\n        elif m == 'D': y -= 1\n        elif m == 'L': x -= 1\n        else: x += 1\n    return x == 0 and y == 0", 'O(n) time'),
    pick: 'Counting letters is a one-liner and makes the reasoning (ups cancel downs) explicit.'
  },
  'pe-16': {
    extra: [A('Track sums per line', 'Give A +1 and B −1; keep running totals for each row, column and diagonal. A total of ±3 is a win.',
      "def tic_tac_toe(moves):\n    rows, cols, diag, anti = [0] * 3, [0] * 3, 0, 0\n    for i, (r, c) in enumerate(moves):\n        v = 1 if i % 2 == 0 else -1\n        rows[r] += v; cols[c] += v\n        if r == c: diag += v\n        if r + c == 2: anti += v\n        if 3 in (abs(rows[r]), abs(cols[c]), abs(diag), abs(anti)):\n            return 'A' if v == 1 else 'B'\n    return 'Draw' if len(moves) == 9 else 'Pending'", 'O(moves) time')],
    pick: 'Filling the board and checking 8 lines is the easiest to get right; running totals scale to an n×n board.'
  },
  'pe-17': {
    brute: A('Run it four times', 'Repeat the instructions four times; a bounded robot is always back at the start after four rounds.',
      "def is_bounded(instructions):\n    x = y = 0\n    dx, dy = 0, 1\n    for ch in instructions * 4:\n        if ch == 'G':\n            x, y = x + dx, y + dy\n        elif ch == 'L':\n            dx, dy = -dy, dx\n        else:\n            dx, dy = dy, -dx\n    return (x, y) == (0, 0)", 'O(n) time'),
    pick: 'One pass plus the direction check is the insight interviewers look for; the four-round version is a good way to discover it.'
  },
  'pe-18': {
    extra: [A('Change dictionary', 'Keep a dictionary of notes held; for each bill try the change combinations in the best order.',
      'def can_give_change(bills):\n    held = {5: 0, 10: 0}\n    for b in bills:\n        if b == 5:\n            held[5] += 1\n        elif b == 10:\n            if not held[5]: return False\n            held[5] -= 1; held[10] += 1\n        elif held[10] and held[5]:\n            held[10] -= 1; held[5] -= 1\n        elif held[5] >= 3:\n            held[5] -= 3\n        else:\n            return False\n    return True', 'O(n) time')],
    pick: 'Two counters and the greedy rule (give 10 + 5 before 5 + 5 + 5) are all you need.'
  },
  'pe-19': {
    brute: A('Nested loops', 'Add up each row with an inner loop and keep the largest total.',
      'def richest_wealth(accounts):\n    best = 0\n    for row in accounts:\n        total = 0\n        for money in row:\n            total += money\n        best = max(best, total)\n    return best', 'O(rows · cols) time'),
    pick: '`max(sum(row) ...)` does the same in one readable line.'
  },
  'pe-20': {
    brute: A('Check every cell', 'Add a cell when it lies on either diagonal (r == c or r + c == n − 1); the centre is added once automatically.',
      'def diagonal_sum(mat):\n    n = len(mat)\n    return sum(mat[r][c] for r in range(n) for c in range(n) if r == c or r + c == n - 1)', 'O(n²) time'),
    pick: 'Visiting just the diagonal cells is O(n); subtract the centre once when n is odd.'
  },
  'pe-21': {
    extra: [A('Four boundaries', 'Keep top, bottom, left and right limits; walk right, down, left and up, shrinking a limit after each side.',
      'def spiral(matrix):\n    out = []\n    top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1\n    while top <= bottom and left <= right:\n        out += matrix[top][left:right + 1]; top += 1\n        out += [matrix[r][right] for r in range(top, bottom + 1)]; right -= 1\n        if top <= bottom:\n            out += matrix[bottom][left:right + 1][::-1]; bottom -= 1\n        if left <= right:\n            out += [matrix[r][left] for r in range(bottom, top - 1, -1)]; left += 1\n    return out', 'O(rows · cols) time, O(1) extra')],
    pick: 'Take-the-top-row-and-rotate is the shortest Python answer and easy to explain. If they ask for O(1) extra space or another language, describe the four-boundary loop.'
  },
  'pe-22': {
    extra: [A('Use the first row and column as markers', 'Store the "this row/column has a zero" flags inside the matrix itself, with two booleans for the first row and column.',
      'def set_zeroes(matrix):\n    R, C = len(matrix), len(matrix[0])\n    first_row = any(v == 0 for v in matrix[0])\n    first_col = any(matrix[r][0] == 0 for r in range(R))\n    for r in range(1, R):\n        for c in range(1, C):\n            if matrix[r][c] == 0:\n                matrix[r][0] = matrix[0][c] = 0\n    for r in range(1, R):\n        for c in range(1, C):\n            if matrix[r][0] == 0 or matrix[0][c] == 0:\n                matrix[r][c] = 0\n    if first_row:\n        matrix[0] = [0] * C\n    if first_col:\n        for r in range(R):\n            matrix[r][0] = 0\n    return matrix', 'O(rows · cols) time, O(1) extra')],
    pick: 'Recording rows and columns in sets is clear and safe; the in-place marker trick is the O(1)-space follow-up.'
  },
  'pe-23': {
    brute: A('Nested loops', 'Build each new row from one column of the original.',
      'def transpose(matrix):\n    rows, cols = len(matrix), len(matrix[0])\n    return [[matrix[r][c] for r in range(rows)] for c in range(cols)]', 'O(rows · cols) time'),
    pick: '`zip(*matrix)` is the idiomatic Python answer; the comprehension shows what it does underneath.'
  },
  'pe-24': {
    brute: A('Loop and count', 'Check every number in the range.',
      'def count_odds(low, high):\n    return sum(1 for x in range(low, high + 1) if x % 2)', 'O(high − low) time'),
    pick: 'The formula is O(1), which matters when the range has a million numbers.'
  },
  'pe-25': {
    brute: A('Sort and slice', 'Sort, drop the first and last, then average the rest.',
      'def trimmed_average(salaries):\n    s = sorted(salaries)[1:-1]\n    return sum(s) / len(s)', 'O(n log n) time'),
    pick: 'Sum minus min minus max needs no sorting: O(n).'
  },
  'pe-26': {
    brute: A('Try every trio', 'Check every combination of three sides.',
      'from itertools import combinations\n\ndef largest_perimeter(sides):\n    best = 0\n    for a, b, c in combinations(sides, 3):\n        x, y, z = sorted((a, b, c))\n        if x + y > z:\n            best = max(best, a + b + c)\n    return best', 'O(n³) time'),
    pick: 'After sorting, only neighbouring trios can be best, so one scan is enough: O(n log n).'
  },
  'pe-27': {
    brute: A('Compare slopes with division', 'Compute each slope as a fraction and compare. Needs special handling for vertical lines, so `Fraction` and a marker are used.',
      "from fractions import Fraction\n\ndef on_one_line(points):\n    (x0, y0) = points[0]\n    def slope(p):\n        dx, dy = p[0] - x0, p[1] - y0\n        return 'vertical' if dx == 0 else Fraction(dy, dx)\n    first = slope(points[1])\n    return all(slope(p) == first for p in points[2:])", 'O(n) time'),
    pick: 'Cross-multiplying avoids division entirely, so vertical lines and rounding are not a problem.'
  },
  'pe-28': {
    extra: [A('Built-in conversion', 'Convert to integers in base 2, add, convert back. Short, but interviewers usually forbid it.',
      "def add_binary(a, b):\n    return bin(int(a, 2) + int(b, 2))[2:]", 'O(n + m) time')],
    pick: 'Column-by-column addition with a carry is what the question tests and works for any length.'
  },
  'pe-29': {
    extra: [A('Python big integers', 'Python integers are unlimited, so `int(a) * int(b)` works here, though the question asks you not to.',
      'def multiply_strings(a, b):\n    return str(int(a) * int(b))', 'fast, but not allowed in the interview')],
    pick: 'Grade-school multiplication into a result array is O(n · m) and shows real understanding.'
  },
  'pe-30': {
    brute: A('Multiply n times', 'Multiply x by itself |n| times.',
      'def power(x, n):\n    result = 1.0\n    for _ in range(abs(n)):\n        result *= x\n    return round(result if n >= 0 else 1 / result, 5)', 'O(n) time'),
    extra: [A('Recursive halving', 'x^n = (x^(n/2))², with one extra x when n is odd.',
      'def power(x, n):\n    def go(x, n):\n        if n == 0:\n            return 1.0\n        half = go(x, n // 2)\n        return half * half * (x if n % 2 else 1)\n    return round(go(x, n) if n >= 0 else 1 / go(x, -n), 5)', 'O(log n) time')],
    pick: 'Iterative fast power is O(log n) without recursion; explain the halving idea with the recursive version first.'
  },
  'pe-31': {
    extra: [A('Collect bits, then int(..., 2)', 'Build the binary string and let Python convert it.',
      "def binary_list_value(head):\n    bits = ''\n    while head:\n        bits += str(head.val)\n        head = head.next\n    return int(bits, 2)", 'O(n) time'),
      A('Bit shifting', 'Shift the value left by one and OR in the next bit.',
      'def binary_list_value(head):\n    value = 0\n    while head:\n        value = (value << 1) | head.val\n        head = head.next\n    return value', 'O(n) time')],
    pick: 'value × 2 + bit explains exactly how binary works and needs no string conversion.'
  },
  'pe-32': {
    extra: [A('Recursion', 'Clean the rest of the list first, then decide whether to keep the current node.',
      'def remove_value(head, val):\n    if not head:\n        return None\n    head.next = remove_value(head.next, val)\n    return head.next if head.val == val else head', 'O(n) time, O(n) call stack')],
    pick: 'The dummy-node loop handles removing the head without special cases and uses O(1) extra space.'
  },
  'pe-33': {
    extra: [A('Reverse the second half', 'Find the middle with fast/slow pointers, reverse the second half and compare it with the first half.',
      'def is_palindrome_list(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    prev = None\n    while slow:\n        slow.next, prev, slow = prev, slow, slow.next\n    while prev:\n        if prev.val != head.val:\n            return False\n        prev, head = prev.next, head.next\n    return True', 'O(n) time, O(1) extra space')],
    pick: 'Copying to a list is the clearest; reversing the second half is the O(1)-space follow-up.'
  },
  'pe-34': {
    extra: [A('Recursion', 'Swap the first two nodes and attach the swapped rest of the list.',
      'def swap_pairs(head):\n    if not head or not head.next:\n        return head\n    second = head.next\n    head.next = swap_pairs(second.next)\n    second.next = head\n    return second', 'O(n) time, O(n) call stack')],
    pick: 'The iterative version with a dummy node is O(1) space; the recursive one is shorter to explain.'
  },
  'pe-35': {
    extra: [A('Recursion', 'In-order is left subtree, node, right subtree, written directly.',
      'def inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)', 'O(n) time (list joining adds overhead)')],
    pick: 'Interviewers often ask for the iterative version because it shows you understand the call stack.'
  },
  'pe-36': {
    extra: [A('Iterative with a queue', 'Compare mirrored pairs of nodes from a queue.',
      'from collections import deque\n\ndef is_symmetric(root):\n    if not root:\n        return True\n    q = deque([(root.left, root.right)])\n    while q:\n        a, b = q.popleft()\n        if not a and not b:\n            continue\n        if not a or not b or a.val != b.val:\n            return False\n        q.append((a.left, b.right))\n        q.append((a.right, b.left))\n    return True', 'O(n) time')],
    pick: 'The recursive mirror check matches the definition; the queue version avoids recursion.'
  },
  'pe-37': {
    extra: [A('Iterative with a stack', 'Push (node, remaining) pairs and check leaves as you pop them.',
      'def has_path_sum(root, target):\n    stack = [(root, target)] if root else []\n    while stack:\n        node, rest = stack.pop()\n        rest -= node.val\n        if not node.left and not node.right and rest == 0:\n            return True\n        for child in (node.left, node.right):\n            if child:\n                stack.append((child, rest))\n    return False', 'O(n) time')],
    pick: 'The recursion is three clear cases; the stack version is the same idea without recursion.'
  },
  'pe-38': {
    extra: [A('Recursion', 'Depth is 1 + the smaller child depth, but a missing child does not count as a leaf.',
      'def min_depth(root):\n    if not root:\n        return 0\n    if not root.left or not root.right:\n        return 1 + min_depth(root.left or root.right)\n    return 1 + min(min_depth(root.left), min_depth(root.right))', 'O(n) time')],
    pick: 'BFS stops at the first leaf, so it can finish early on wide trees.'
  },
  'pe-39': {
    extra: [A('Iterative with a stack', 'Push (node, is_left) pairs and add values of left leaves.',
      'def left_leaves_sum(root):\n    total, stack = 0, [(root, False)] if root else []\n    while stack:\n        node, is_left = stack.pop()\n        if not node.left and not node.right and is_left:\n            total += node.val\n        if node.left: stack.append((node.left, True))\n        if node.right: stack.append((node.right, False))\n    return total', 'O(n) time')],
    pick: 'Passing `is_left` down in the recursion keeps it to one short function.'
  },
  'pe-40': {
    extra: [A('Breadth-first count', 'Count nodes as you take them from a queue.',
      'from collections import deque\n\ndef count_nodes(root):\n    q, count = deque([root] if root else []), 0\n    while q:\n        node = q.popleft()\n        count += 1\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n    return count', 'O(n) time')],
    pick: 'The one-line recursion is clearest; for complete trees there is an O(log² n) trick worth mentioning.'
  },
  'pe-41': {
    brute: A('Scan for the minimum', 'Keep a plain stack and compute min(stack) when asked. Simple, but "min" is O(n).',
      "def min_stack(commands):\n    stack, out = [], []\n    for cmd in commands:\n        if cmd[0] == 'push': stack.append(cmd[1])\n        elif cmd[0] == 'pop': stack.pop()\n        elif cmd[0] == 'top': out.append(stack[-1])\n        else: out.append(min(stack))\n    return out", 'O(n) per min'),
    extra: [A('Second stack of minimums', 'Keep a separate stack that only grows when a new value is ≤ the current minimum.',
      "def min_stack(commands):\n    stack, mins, out = [], [], []\n    for cmd in commands:\n        if cmd[0] == 'push':\n            stack.append(cmd[1])\n            if not mins or cmd[1] <= mins[-1]:\n                mins.append(cmd[1])\n        elif cmd[0] == 'pop':\n            if stack.pop() == mins[-1]:\n                mins.pop()\n        elif cmd[0] == 'top':\n            out.append(stack[-1])\n        else:\n            out.append(mins[-1])\n    return out", 'O(1) per command')],
    pick: 'Storing (value, minimum so far) pairs makes every command O(1) and is the simplest correct design.'
  },
  'pe-42': {
    brute: A('Move everything on every push', 'Keep the queue order in one stack by moving all items to the helper stack and back on each push.',
      "def two_stack_queue(commands):\n    main, helper, out = [], [], []\n    for cmd in commands:\n        if cmd[0] == 'push':\n            while main: helper.append(main.pop())\n            main.append(cmd[1])\n            while helper: main.append(helper.pop())\n        elif cmd[0] == 'pop': out.append(main.pop())\n        elif cmd[0] == 'peek': out.append(main[-1])\n        else: out.append(not main)\n    return out", 'O(n) per push'),
    pick: 'The lazy inbox/outbox version moves each item at most once: amortised O(1).'
  },
  'pe-43': {
    brute: A('Count with a scan', 'For each request, count earlier requests within 3000 ms.',
      'def recent_counter(times):\n    return [sum(1 for s in times[:i + 1] if s >= t - 3000) for i, t in enumerate(times)]', 'O(n²) time'),
    extra: [A('Binary search', 'Times are increasing, so binary-search the first time ≥ t − 3000.',
      'from bisect import bisect_left\n\ndef recent_counter(times):\n    return [i + 1 - bisect_left(times, t - 3000, 0, i + 1) for i, t in enumerate(times)]', 'O(n log n) time')],
    pick: 'A queue that drops old times is amortised O(1) per request and also works when times arrive one by one.'
  },
  'pe-44': {
    brute: A('List ordered by use', 'Keep keys in a list from least to most recent; moving a key costs O(n).',
      "def lru_cache(capacity, commands):\n    store, order, out = {}, [], []\n    for cmd in commands:\n        key = cmd[1]\n        if cmd[0] == 'get':\n            if key in store:\n                order.remove(key); order.append(key)\n                out.append(store[key])\n            else:\n                out.append(-1)\n        else:\n            if key in store:\n                order.remove(key)\n            store[key] = cmd[2]\n            order.append(key)\n            if len(order) > capacity:\n                del store[order.pop(0)]\n    return out", 'O(n) per command'),
    extra: [A('Plain dict (insertion order)', 'Python dicts keep insertion order: delete and re-insert a key to mark it recent, and evict the first key.',
      "def lru_cache(capacity, commands):\n    cache, out = {}, []\n    for cmd in commands:\n        key = cmd[1]\n        if cmd[0] == 'get':\n            if key in cache:\n                cache[key] = cache.pop(key)\n                out.append(cache[key])\n            else:\n                out.append(-1)\n        else:\n            cache.pop(key, None)\n            cache[key] = cmd[2]\n            if len(cache) > capacity:\n                del cache[next(iter(cache))]\n    return out", 'O(1) per command')],
    pick: '`OrderedDict` makes the intent explicit; in an interview, also explain the hash map + doubly linked list design behind it.'
  },
  'pe-45': {
    extra: [A('List of counters', 'Index a list by car type instead of a dictionary.',
      'def parking_lot(big, medium, small, cars):\n    free = [0, big, medium, small]\n    out = []\n    for car in cars:\n        ok = free[car] > 0\n        free[car] -= ok\n        out.append(ok)\n    return out', 'O(1) per car')],
    pick: 'A dictionary keyed by type reads clearly and extends easily to new slot types.'
  },
  'pe-46': {
    extra: [A('Replace the subtractive pairs', 'Rewrite IV, IX, XL, XC, CD and CM as additive groups, then just add every symbol.',
      "def roman_to_int(s):\n    for a, b in (('IV', 'IIII'), ('IX', 'VIIII'), ('XL', 'XXXX'), ('XC', 'LXXXX'), ('CD', 'CCCC'), ('CM', 'DCCCC')):\n        s = s.replace(a, b)\n    val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}\n    return sum(val[ch] for ch in s)", 'O(n) time')],
    pick: 'Subtracting when a smaller symbol comes before a bigger one handles every case in a single pass.'
  },
  'pe-47': {
    extra: [A('Digit tables', 'Look up thousands, hundreds, tens and ones in four small tables.',
      "def int_to_roman(num):\n    M = ['', 'M', 'MM', 'MMM']\n    C = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM']\n    X = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC']\n    I = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']\n    return M[num // 1000] + C[num % 1000 // 100] + X[num % 100 // 10] + I[num % 10]", 'O(1) time')],
    pick: 'The greedy value table is easy to explain and to extend; the digit tables are a fast alternative.'
  },
  'pe-48': {
    extra: [A('Regular expression', 'Match optional spaces, a sign and digits at the start, then clamp.',
      "import re\n\ndef parse_int(s):\n    m = re.match(r'\\s*([+-]?\\d+)', s)\n    if not m:\n        return 0\n    return max(-2**31, min(2**31 - 1, int(m.group(1))))", 'O(n) time')],
    pick: 'The step-by-step parser is what interviewers expect, because it shows how you handle each edge case.'
  },
  'pe-49': {
    extra: [A('itertools.groupby', '`groupby` splits the string into runs of the same character.',
      "from itertools import groupby\n\ndef compress(s):\n    return ''.join(ch + (str(n) if (n := len(list(g))) > 1 else '') for ch, g in groupby(s))", 'O(n) time')],
    pick: 'The two-pointer run scan is language-independent; `groupby` is a nice Pythonic alternative.'
  },
  'pe-50': {
    brute: A('if / elif chain', 'Check divisible by 15 first, then 3, then 5.',
      "def fizz_buzz(n):\n    out = []\n    for i in range(1, n + 1):\n        if i % 15 == 0: out.append('FizzBuzz')\n        elif i % 3 == 0: out.append('Fizz')\n        elif i % 5 == 0: out.append('Buzz')\n        else: out.append(str(i))\n    return out", 'O(n) time'),
    extra: [A('Rules table', 'Keep (divisor, word) pairs in a list so new rules are one line.',
      "def fizz_buzz(n):\n    rules = [(3, 'Fizz'), (5, 'Buzz')]\n    return [''.join(w for d, w in rules if i % d == 0) or str(i) for i in range(1, n + 1)]", 'O(n · rules) time')],
    pick: 'Building the word from parts avoids the special 15 case and scales to new rules, which is what interviewers look for.'
  }
};

export const PE_MAIN = {
  'pe-01': 'Index loop with join', 'pe-02': 'Sum of letter codes', 'pe-03': 'Slice comparison', 'pe-04': 'Try block sizes that divide the length',
  'pe-05': 'Write pointer, then fill zeros', 'pe-06': 'Carry from the right', 'pe-07': 'Flip a sign', 'pe-08': 'Track both directions',
  'pe-09': 'split()', 'pe-10': 'Character codes', 'pe-11': 'sum() with a generator', 'pe-12': 'Split, fix, join',
  'pe-13': 'Counter + tuple sort key', 'pe-14': 'Stack with if/elif', 'pe-15': 'Count the letters', 'pe-16': 'Fill the board, check 8 lines',
  'pe-17': 'One pass + direction check', 'pe-18': 'Greedy with two counters', 'pe-19': 'max of row sums', 'pe-20': 'Both diagonals, subtract centre',
  'pe-21': 'Take top row, rotate', 'pe-22': 'Record rows and columns', 'pe-23': 'zip(*matrix)', 'pe-24': 'Counting formula',
  'pe-25': 'Sum minus min and max', 'pe-26': 'Sort, check neighbours', 'pe-27': 'Cross-multiplied slopes', 'pe-28': 'Column addition with carry',
  'pe-29': 'Grade-school multiplication', 'pe-30': 'Iterative fast power', 'pe-31': 'Double and add', 'pe-32': 'Dummy node',
  'pe-33': 'Copy values, compare reversed', 'pe-34': 'Iterative with a dummy node', 'pe-35': 'Iterative with a stack', 'pe-36': 'Recursive mirror check',
  'pe-37': 'Recursion, subtract as you go', 'pe-38': 'BFS, first leaf', 'pe-39': 'Recursion with is_left', 'pe-40': 'Recursion',
  'pe-41': 'Stack of (value, min) pairs', 'pe-42': 'Inbox and outbox stacks', 'pe-43': 'Sliding queue', 'pe-44': 'OrderedDict',
  'pe-45': 'Dictionary of free slots', 'pe-46': 'Subtract before bigger', 'pe-47': 'Greedy value table', 'pe-48': 'Step-by-step parser',
  'pe-49': 'Run scan with two pointers', 'pe-50': 'Build the word from parts'
};
