// Extra approaches for DSA Top 75. Each problem's own `solution` is the recommended approach; here are
// the alternatives: `brute` (shown first) and `extra` (shown after it), plus `pick`, which says why the
// recommended approach is the one to use in an interview. Every code sample is checked against the
// problem's tests by scripts/verify-interview.mjs.
export const A = (title, idea, code, complexity) => ({ title, idea, code, complexity });

export const DSA_APPROACHES = {
  'dsa-01': {
    brute: A('Check every pair', 'Try every pair of positions i < j and return the first pair that adds up to the target.',
      'def pair_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]', 'O(n²) time, O(1) space'),
    extra: [A('Sort, then two pointers', 'Sort the indices by value, then move a left and a right pointer towards each other until the values add up to the target.',
      'def pair_sum(nums, target):\n    order = sorted(range(len(nums)), key=lambda i: nums[i])\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        s = nums[order[lo]] + nums[order[hi]]\n        if s == target:\n            return sorted([order[lo], order[hi]])\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1', 'O(n log n) time, O(n) space')],
    pick: 'The dictionary solution looks at every number once, so it is O(n), and it is short enough to write without mistakes.'
  },
  'dsa-02': {
    brute: A('Compare every pair', 'Compare each number with every number after it.',
      'def has_duplicate(nums):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] == nums[j]:\n                return True\n    return False', 'O(n²) time, O(1) space'),
    extra: [A('Sort and check neighbours', 'After sorting, equal values sit next to each other, so check each neighbouring pair.',
      'def has_duplicate(nums):\n    nums = sorted(nums)\n    return any(a == b for a, b in zip(nums, nums[1:]))', 'O(n log n) time, O(n) space'),
      A('Set with early exit', 'Add numbers to a set one by one and stop as soon as a number is already there.',
      'def has_duplicate(nums):\n    seen = set()\n    for x in nums:\n        if x in seen:\n            return True\n        seen.add(x)\n    return False', 'O(n) time, O(n) space')],
    pick: 'Comparing set size with list size is O(n) and a single line; mention the early-exit version if they ask about very long lists.'
  },
  'dsa-03': {
    brute: A('Sort both strings', 'Two anagrams have exactly the same letters, so their sorted letters are identical.',
      'def is_anagram(s, t):\n    return sorted(s) == sorted(t)', 'O(n log n) time, O(n) space'),
    extra: [A('Count with a dictionary', 'Add 1 for each letter of s and subtract 1 for each letter of t; every count must end at zero.',
      'def is_anagram(s, t):\n    if len(s) != len(t):\n        return False\n    count = {}\n    for a, b in zip(s, t):\n        count[a] = count.get(a, 0) + 1\n        count[b] = count.get(b, 0) - 1\n    return all(v == 0 for v in count.values())', 'O(n) time, O(1) space for a fixed alphabet')],
    pick: '`Counter` comparison is O(n) and very readable; the manual dictionary shows the same idea if they ask you not to use libraries.'
  },
  'dsa-04': {
    brute: A('Compare with each group', 'For every word, look through the groups made so far and join the first group whose word has the same sorted letters.',
      'def group_anagrams(words):\n    groups = []\n    for w in words:\n        for g in groups:\n            if sorted(g[0]) == sorted(w):\n                g.append(w)\n                break\n        else:\n            groups.append([w])\n    return groups', 'O(n² · k log k) time'),
    extra: [A('Letter-count key', 'Instead of sorting, count the 26 letters of each word and use that tuple of counts as the dictionary key.',
      "from collections import defaultdict\n\ndef group_anagrams(words):\n    groups = defaultdict(list)\n    for w in words:\n        counts = [0] * 26\n        for ch in w:\n            counts[ord(ch) - ord('a')] += 1\n        groups[tuple(counts)].append(w)\n    return list(groups.values())", 'O(n · k) time')],
    pick: 'Sorted-letters keys are the clearest; the letter-count key is the follow-up answer when words are long.'
  },
  'dsa-05': {
    brute: A('Sort by count', 'Count each value, sort the values by count from high to low and take the first k.',
      'def top_k_frequent(nums, k):\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    return sorted(count, key=count.get, reverse=True)[:k]', 'O(n log n) time'),
    extra: [A('Bucket sort', 'Make a list of buckets where bucket f holds values that appear f times, then read buckets from the highest frequency down.',
      'def top_k_frequent(nums, k):\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    buckets = [[] for _ in range(len(nums) + 1)]\n    for x, f in count.items():\n        buckets[f].append(x)\n    out = []\n    for f in range(len(buckets) - 1, 0, -1):\n        out.extend(buckets[f])\n        if len(out) >= k:\n            return out[:k]', 'O(n) time, O(n) space')],
    pick: '`Counter.most_common` is concise and fast enough; offer bucket sort when they ask for better than O(n log n).'
  },
  'dsa-06': {
    brute: A('Multiply the others each time', 'For every position, multiply all the other numbers in a nested loop.',
      'def product_except_self(nums):\n    out = []\n    for i in range(len(nums)):\n        p = 1\n        for j, x in enumerate(nums):\n            if j != i:\n                p *= x\n        out.append(p)\n    return out', 'O(n²) time'),
    extra: [A('Total product divided (with zero handling)', 'Multiply everything except zeros. With two or more zeros every answer is 0; with one zero only that position is non-zero.',
      'def product_except_self(nums):\n    zeros = nums.count(0)\n    total = 1\n    for x in nums:\n        if x != 0:\n            total *= x\n    if zeros > 1:\n        return [0] * len(nums)\n    if zeros == 1:\n        return [total if x == 0 else 0 for x in nums]\n    return [total // x for x in nums]', 'O(n) time, but uses division (often not allowed)')],
    pick: 'Prefix and suffix products are O(n), need no division and handle zeros naturally, which is exactly what interviewers check.'
  },
  'dsa-07': {
    brute: A('Sort, then scan', 'Sort the unique values and count how long each run of +1 steps lasts.',
      'def longest_consecutive(nums):\n    vals = sorted(set(nums))\n    best = run = 0\n    for i, x in enumerate(vals):\n        run = run + 1 if i and x == vals[i - 1] + 1 else 1\n        best = max(best, run)\n    return best', 'O(n log n) time'),
    pick: 'The set solution starts counting only at the beginning of each run, so every number is visited a constant number of times: O(n).'
  },
  'dsa-08': {
    brute: A('Try every buy and sell day', 'Check every pair of days (buy, later sell) and keep the best profit.',
      'def max_profit(prices):\n    best = 0\n    for i in range(len(prices)):\n        for j in range(i + 1, len(prices)):\n            best = max(best, prices[j] - prices[i])\n    return best', 'O(n²) time'),
    extra: [A('Best run of daily changes', 'Profit from buying on day i and selling on day j equals the sum of daily changes between them, so find the best positive run of changes (Kadane).',
      'def max_profit(prices):\n    best = cur = 0\n    for a, b in zip(prices, prices[1:]):\n        cur = max(0, cur + b - a)\n        best = max(best, cur)\n    return best', 'O(n) time, O(1) space')],
    pick: 'Tracking the lowest price so far is one pass, O(1) space, and easy to explain.'
  },
  'dsa-09': {
    brute: A('Count everything', 'Count each value and return the one with the highest count.',
      'from collections import Counter\n\ndef majority_element(nums):\n    return Counter(nums).most_common(1)[0][0]', 'O(n) time, O(n) space'),
    extra: [A('Sort and take the middle', 'A value that fills more than half of the list must cover the middle position after sorting.',
      'def majority_element(nums):\n    return sorted(nums)[len(nums) // 2]', 'O(n log n) time')],
    pick: 'Boyer-Moore voting is O(n) time and O(1) space, the best possible, and it is a well-known interview favourite.'
  },
  'dsa-10': {
    brute: A('Check every candidate', 'Put the numbers in a set and test 0, 1, 2, ... until one is missing.',
      'def missing_number(nums):\n    seen = set(nums)\n    for x in range(len(nums) + 1):\n        if x not in seen:\n            return x', 'O(n) time, O(n) space'),
    extra: [A('XOR trick', 'x ^ x = 0, so XOR-ing every index 0..n with every value cancels all pairs and leaves the missing number.',
      'def missing_number(nums):\n    result = len(nums)\n    for i, x in enumerate(nums):\n        result ^= i ^ x\n    return result', 'O(n) time, O(1) space')],
    pick: 'The sum formula is O(n) time, O(1) space and the easiest to explain; XOR is a nice alternative that cannot overflow in other languages.'
  },
  'dsa-11': {
    brute: A('Clean, then compare with the reverse', 'Keep only letters and digits in lowercase, then compare the string with its reverse.',
      "def is_palindrome(s):\n    clean = ''.join(ch.lower() for ch in s if ch.isalnum())\n    return clean == clean[::-1]", 'O(n) time, O(n) space'),
    pick: 'Two pointers check the string in place with O(1) extra space, which is the point of the question.'
  },
  'dsa-12': {
    brute: A('Check every pair', 'Ignore the sorting and test every pair.',
      'def pair_sum_sorted(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]', 'O(n²) time'),
    extra: [A('Binary search for the partner', 'For each number, binary-search the rest of the sorted list for `target - number`.',
      'from bisect import bisect_left\n\ndef pair_sum_sorted(nums, target):\n    for i, x in enumerate(nums):\n        j = bisect_left(nums, target - x, i + 1)\n        if j < len(nums) and nums[j] == target - x:\n            return [i, j]', 'O(n log n) time, O(1) space')],
    pick: 'Two pointers use the sorted order to finish in one O(n) pass with O(1) space.'
  },
  'dsa-13': {
    brute: A('Try every triplet', 'Three nested loops; store each zero-sum triplet sorted in a set to remove duplicates.',
      'def three_sum(nums):\n    found = set()\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            for k in range(j + 1, n):\n                if nums[i] + nums[j] + nums[k] == 0:\n                    found.add(tuple(sorted((nums[i], nums[j], nums[k]))))\n    return [list(t) for t in found]', 'O(n³) time'),
    extra: [A('Fix one, hash the rest', 'For each first value, solve pair-sum on the rest with a set, collecting sorted triplets in a set.',
      'def three_sum(nums):\n    found = set()\n    for i in range(len(nums)):\n        seen = set()\n        for x in nums[i + 1:]:\n            if -nums[i] - x in seen:\n                found.add(tuple(sorted((nums[i], x, -nums[i] - x))))\n            seen.add(x)\n    return [list(t) for t in found]', 'O(n²) time, O(n) space')],
    pick: 'Sort + two pointers is O(n²) with O(1) extra space and handles duplicates by skipping, without a set of tuples.'
  },
  'dsa-14': {
    brute: A('Every pair of lines', 'Compute the water for every pair of lines.',
      'def max_area(heights):\n    best = 0\n    for i in range(len(heights)):\n        for j in range(i + 1, len(heights)):\n            best = max(best, (j - i) * min(heights[i], heights[j]))\n    return best', 'O(n²) time'),
    pick: 'Two pointers prove that only moving the shorter line can help, giving O(n). Explain that argument; it is what the interviewer wants to hear.'
  },
  'dsa-15': {
    brute: A('Look left and right from every bar', 'For each bar, find the tallest bar on its left and on its right; water above it is the smaller of those minus its height.',
      'def trap(heights):\n    water = 0\n    for i in range(len(heights)):\n        left = max(heights[:i + 1])\n        right = max(heights[i:])\n        water += min(left, right) - heights[i]\n    return water', 'O(n²) time'),
    extra: [A('Prefix and suffix maximums', 'Precompute the tallest bar to the left and to the right of every position in two arrays, then add up the water in one more pass.',
      'def trap(heights):\n    n = len(heights)\n    if n == 0:\n        return 0\n    left, right = [0] * n, [0] * n\n    left[0], right[-1] = heights[0], heights[-1]\n    for i in range(1, n):\n        left[i] = max(left[i - 1], heights[i])\n    for i in range(n - 2, -1, -1):\n        right[i] = max(right[i + 1], heights[i])\n    return sum(min(left[i], right[i]) - heights[i] for i in range(n))', 'O(n) time, O(n) space')],
    pick: 'Two pointers keep the O(n) time of the prefix arrays but use O(1) space. Start by explaining the prefix-array version, then improve it.'
  },
  'dsa-16': {
    brute: A('Set, then sort', 'Remove duplicates with a set and sort again.',
      'def dedupe_sorted(nums):\n    return sorted(set(nums))', 'O(n log n) time'),
    extra: [A('dict.fromkeys', 'Dictionaries keep insertion order and unique keys, so their keys are the values in order without repeats.',
      'def dedupe_sorted(nums):\n    return list(dict.fromkeys(nums))', 'O(n) time')],
    pick: 'Comparing with the last kept value uses the fact that the list is already sorted: one pass, O(n), no extra structures.'
  },
  'dsa-17': {
    brute: A('Check every substring', 'For every start, extend the substring while characters stay unique.',
      'def longest_unique_substring(s):\n    best = 0\n    for i in range(len(s)):\n        seen = set()\n        for ch in s[i:]:\n            if ch in seen:\n                break\n            seen.add(ch)\n        best = max(best, len(seen))\n    return best', 'O(n²) time'),
    extra: [A('Sliding window with a set', 'Grow the window to the right; while the new character is already inside, remove characters from the left.',
      'def longest_unique_substring(s):\n    window, left, best = set(), 0, 0\n    for ch in s:\n        while ch in window:\n            window.remove(s[left])\n            left += 1\n        window.add(ch)\n        best = max(best, len(window))\n    return best', 'O(n) time')],
    pick: 'Remembering each character\'s last index lets the window jump in one step; it is O(n) and a classic sliding-window answer.'
  },
  'dsa-18': {
    brute: A('Check every substring', 'For each substring, it works if its length minus its most common letter count is at most k.',
      'from collections import Counter\n\ndef character_replacement(s, k):\n    best = 0\n    for i in range(len(s)):\n        count = Counter()\n        for j in range(i, len(s)):\n            count[s[j]] += 1\n            if (j - i + 1) - max(count.values()) <= k:\n                best = max(best, j - i + 1)\n    return best', 'O(n² · 26) time'),
    pick: 'The sliding window reuses counts as it moves, giving O(n). The key insight, window length − top count ≤ k, is the heart of the answer.'
  },
  'dsa-19': {
    brute: A('Check every substring', 'Test every substring and keep the shortest one that contains all characters of t.',
      "from collections import Counter\n\ndef min_window(s, t):\n    need = Counter(t)\n    best = ''\n    for i in range(len(s)):\n        have = Counter()\n        for j in range(i, len(s)):\n            have[s[j]] += 1\n            if all(have[c] >= n for c, n in need.items()):\n                if not best or j - i + 1 < len(best):\n                    best = s[i:j + 1]\n                break\n    return best", 'O(n² · m) time'),
    pick: 'Expand-then-shrink with a `missing` counter is O(n) and is the standard hard sliding-window pattern.'
  },
  'dsa-20': {
    brute: A('Max of every window', 'Slice each window and take its max.',
      'def max_sliding_window(nums, k):\n    return [max(nums[i:i + k]) for i in range(len(nums) - k + 1)]', 'O(n · k) time'),
    extra: [A('Max-heap with lazy removal', 'Push (−value, index) into a heap; before reading the top, pop entries whose index has left the window.',
      'import heapq\n\ndef max_sliding_window(nums, k):\n    heap, out = [], []\n    for i, x in enumerate(nums):\n        heapq.heappush(heap, (-x, i))\n        while heap[0][1] <= i - k:\n            heapq.heappop(heap)\n        if i >= k - 1:\n            out.append(-heap[0][0])\n    return out', 'O(n log n) time')],
    pick: 'The monotonic deque gives O(n) because each index enters and leaves once; mention the heap as the simpler O(n log n) step towards it.'
  },
  'dsa-21': {
    brute: A('Sort every window', 'Compare the sorted letters of each window of the right length with the sorted pattern.',
      'def check_inclusion(pattern, s):\n    k, target = len(pattern), sorted(pattern)\n    return any(sorted(s[i:i + k]) == target for i in range(len(s) - k + 1))', 'O(n · k log k) time'),
    pick: 'A sliding count updates in O(1) per step instead of re-sorting, giving O(n).'
  },
  'dsa-22': {
    brute: A('Remove pairs until nothing changes', 'Keep deleting "()", "[]" and "{}" from the string. A balanced string becomes empty.',
      "def valid_brackets(s):\n    prev = None\n    while prev != s:\n        prev = s\n        s = s.replace('()', '').replace('[]', '').replace('{}', '')\n    return s == ''", 'O(n²) time'),
    pick: 'The stack checks each character once, O(n), and shows you understand why brackets are a last-in-first-out problem.'
  },
  'dsa-23': {
    extra: [A('Operator table', 'Store the four operations in a dictionary of functions so the loop has no if/elif chain.',
      "import operator\n\ndef eval_rpn(tokens):\n    ops = {'+': operator.add, '-': operator.sub, '*': operator.mul, '/': lambda a, b: int(a / b)}\n    stack = []\n    for t in tokens:\n        if t in ops:\n            b, a = stack.pop(), stack.pop()\n            stack.append(ops[t](a, b))\n        else:\n            stack.append(int(t))\n    return stack[0]", 'O(n) time')],
    pick: 'Both are the same stack algorithm; the if/elif version is the clearest to write on a whiteboard, the table is tidier in real code.'
  },
  'dsa-24': {
    brute: A('Scan forward from each day', 'For every day, walk forward until a warmer day appears.',
      'def daily_temperatures(temps):\n    out = [0] * len(temps)\n    for i in range(len(temps)):\n        for j in range(i + 1, len(temps)):\n            if temps[j] > temps[i]:\n                out[i] = j - i\n                break\n    return out', 'O(n²) time'),
    pick: 'The monotonic stack resolves each day exactly once: O(n). It is the go-to pattern for "next greater element" questions.'
  },
  'dsa-25': {
    brute: A('Generate all, keep the valid ones', 'Build every string of 2n brackets and keep those that never go below zero and end at zero.',
      "from itertools import product\n\ndef generate_parentheses(n):\n    out = []\n    for combo in product('()', repeat=2 * n):\n        bal = 0\n        for ch in combo:\n            bal += 1 if ch == '(' else -1\n            if bal < 0:\n                break\n        if bal == 0:\n            out.append(''.join(combo))\n    return out", 'O(2²ⁿ · n) time'),
    pick: 'Backtracking only builds valid prefixes, so it never wastes time on impossible strings.'
  },
  'dsa-26': {
    brute: A('Expand from every bar', 'For each bar, extend left and right while bars are at least as tall; its rectangle is height × width.',
      'def largest_rectangle(heights):\n    best = 0\n    for i, h in enumerate(heights):\n        l = i\n        while l > 0 and heights[l - 1] >= h:\n            l -= 1\n        r = i\n        while r < len(heights) - 1 and heights[r + 1] >= h:\n            r += 1\n        best = max(best, h * (r - l + 1))\n    return best', 'O(n²) time'),
    pick: 'The increasing stack finds every bar\'s left and right limits in one pass: O(n).'
  },
  'dsa-27': {
    extra: [A('Normalise with a list comprehension', 'Split, drop empty parts and ".", then handle ".." by popping as you rebuild.',
      "def simplify_path(path):\n    out = []\n    for part in [p for p in path.split('/') if p not in ('', '.')]:\n        if part == '..':\n            out = out[:-1]\n        else:\n            out.append(part)\n    return '/' + '/'.join(out)", 'O(n) time')],
    pick: 'Both are a stack of folder names; the explicit loop version makes each rule obvious.'
  },
  'dsa-28': {
    brute: A('Linear scan', 'Check every element from the start.',
      'def binary_search(nums, target):\n    for i, x in enumerate(nums):\n        if x == target:\n            return i\n    return -1', 'O(n) time'),
    extra: [A('bisect module', "Python's `bisect_left` finds where the target would go in O(log n); check it is really there.",
      'from bisect import bisect_left\n\ndef binary_search(nums, target):\n    i = bisect_left(nums, target)\n    return i if i < len(nums) and nums[i] == target else -1', 'O(log n) time')],
    pick: 'Writing the loop yourself shows you understand the boundaries; mention `bisect` as the production shortcut.'
  },
  'dsa-29': {
    brute: A('Linear search', 'Ignore the rotation and look at every element.',
      'def search_rotated(nums, target):\n    return nums.index(target) if target in nums else -1', 'O(n) time'),
    extra: [A('Find the rotation point, then binary search', 'First binary-search the smallest value (the rotation point), then binary-search the half that can contain the target.',
      'from bisect import bisect_left\n\ndef search_rotated(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    pivot = lo\n    part, offset = (nums[pivot:], pivot) if nums[pivot] <= target <= nums[-1] else (nums[:pivot], 0)\n    i = bisect_left(part, target)\n    return offset + i if i < len(part) and part[i] == target else -1', 'O(log n) time')],
    pick: 'One binary search that checks which half is sorted is O(log n) and needs no second phase.'
  },
  'dsa-30': {
    brute: A('Built-in min', 'Just take the smallest value.',
      'def find_min_rotated(nums):\n    return min(nums)', 'O(n) time'),
    extra: [A('Find the drop', 'In a rotated list the minimum is right after the only place where a value is smaller than the one before it.',
      'def find_min_rotated(nums):\n    for i in range(1, len(nums)):\n        if nums[i] < nums[i - 1]:\n            return nums[i]\n    return nums[0]', 'O(n) time')],
    pick: 'Binary search against the last element is O(log n), which is what "rotated sorted" questions are testing.'
  },
  'dsa-31': {
    brute: A('Check every row', 'Look for the target in each row.',
      'def search_matrix(matrix, target):\n    return any(target in row for row in matrix)', 'O(m · n) time'),
    extra: [A('Staircase search', 'Start at the top-right: move left if the value is too big, down if too small.',
      'def search_matrix(matrix, target):\n    r, c = 0, len(matrix[0]) - 1\n    while r < len(matrix) and c >= 0:\n        v = matrix[r][c]\n        if v == target:\n            return True\n        if v > target:\n            c -= 1\n        else:\n            r += 1\n    return False', 'O(m + n) time')],
    pick: 'Treating the grid as one sorted list gives O(log(m·n)); the staircase is the answer when rows are sorted but not linked end to end.'
  },
  'dsa-32': {
    brute: A('Try every speed', 'Try k = 1, 2, 3, ... until the piles fit in the hours.',
      'def min_eating_speed(piles, hours):\n    k = 1\n    while sum((p + k - 1) // k for p in piles) > hours:\n        k += 1\n    return k', 'O(max(pile) · n) time'),
    pick: 'Binary search on the answer turns the speed search into O(n log max(pile)). Spotting "if k works, bigger k works" is the key.'
  },
  'dsa-33': {
    brute: A('Count up', 'Increase m until (m + 1)² is bigger than x.',
      'def int_sqrt(x):\n    m = 0\n    while (m + 1) * (m + 1) <= x:\n        m += 1\n    return m', 'O(√x) time'),
    extra: [A("Newton's method", 'Repeatedly replace the guess r with the average of r and x / r (in integers); it converges very fast.',
      'def int_sqrt(x):\n    r = x\n    while r * r > x:\n        r = (r + x // r) // 2\n    return r', 'O(log x) iterations, very fast in practice')],
    pick: 'Binary search is easy to prove correct and O(log x); Newton\'s method is a bonus if they ask for faster convergence.'
  },
  'dsa-34': {
    brute: A('Copy values and rebuild', 'Read all values into a Python list, then build a new linked list from the reversed list.',
      'def reverse_list(head):\n    vals = []\n    while head:\n        vals.append(head.val)\n        head = head.next\n    dummy = tail = ListNode()\n    for v in reversed(vals):\n        tail.next = ListNode(v)\n        tail = tail.next\n    return dummy.next', 'O(n) time, O(n) space'),
    extra: [A('Recursion', 'Reverse the rest of the list, then make the next node point back at the current one.',
      'def reverse_list(head):\n    if not head or not head.next:\n        return head\n    new_head = reverse_list(head.next)\n    head.next.next = head\n    head.next = None\n    return new_head', 'O(n) time, O(n) call stack')],
    pick: 'The iterative pointer flip is O(n) time and O(1) space and is exactly what interviewers expect.'
  },
  'dsa-35': {
    brute: A('Collect, sort, rebuild', 'Put all values from both lists in a Python list, sort it and build a new list.',
      'def merge_two_lists(a, b):\n    vals = []\n    for node in (a, b):\n        while node:\n            vals.append(node.val)\n            node = node.next\n    dummy = tail = ListNode()\n    for v in sorted(vals):\n        tail.next = ListNode(v)\n        tail = tail.next\n    return dummy.next', 'O((n + m) log(n + m)) time'),
    extra: [A('Recursion', 'The smaller head comes first, followed by the merge of the rest.',
      'def merge_two_lists(a, b):\n    if not a or not b:\n        return a or b\n    if a.val <= b.val:\n        a.next = merge_two_lists(a.next, b)\n        return a\n    b.next = merge_two_lists(a, b.next)\n    return b', 'O(n + m) time, O(n + m) call stack')],
    pick: 'The dummy-node loop is O(n + m) time, O(1) extra space and reuses the existing nodes.'
  },
  'dsa-36': {
    brute: A('Remember visited nodes', 'Walk the list storing each node in a set; meeting a node twice means a cycle.',
      'def has_cycle(head):\n    seen = set()\n    while head:\n        if id(head) in seen:\n            return True\n        seen.add(id(head))\n        head = head.next\n    return False', 'O(n) time, O(n) space'),
    pick: "Floyd's fast/slow pointers detect the cycle with O(1) extra memory, which is the reason this question is asked."
  },
  'dsa-37': {
    brute: A('Count, then remove', 'First count the length, then walk to the node before the one to remove.',
      'def remove_nth_from_end(head, n):\n    length, node = 0, head\n    while node:\n        length += 1\n        node = node.next\n    dummy = ListNode(0, head)\n    node = dummy\n    for _ in range(length - n):\n        node = node.next\n    node.next = node.next.next\n    return dummy.next', 'O(n) time, two passes'),
    pick: 'The two-pointer gap does it in a single pass, which is usually the follow-up question.'
  },
  'dsa-38': {
    brute: A('Count, then walk half', 'Count the nodes, then walk length // 2 steps.',
      'def middle_node(head):\n    length, node = 0, head\n    while node:\n        length += 1\n        node = node.next\n    for _ in range(length // 2):\n        head = head.next\n    return head', 'O(n) time, two passes'),
    pick: 'Fast and slow pointers find the middle in one pass and the same trick helps in many linked-list problems.'
  },
  'dsa-39': {
    brute: A('Convert to integers', 'Turn both lists into numbers, add them, and turn the sum back into a reversed digit list.',
      'def add_two_numbers(a, b):\n    def to_int(node):\n        digits = []\n        while node:\n            digits.append(str(node.val))\n            node = node.next\n        return int(\'\'.join(reversed(digits)))\n    total = to_int(a) + to_int(b)\n    dummy = tail = ListNode()\n    for ch in reversed(str(total)):\n        tail.next = ListNode(int(ch))\n        tail = tail.next\n    return dummy.next', 'O(n + m) time, needs big integers'),
    pick: 'Digit-by-digit addition with a carry works in any language, even when the numbers are far too big for normal integers.'
  },
  'dsa-40': {
    extra: [A('Breadth-first, count levels', 'Process the tree level by level with a queue; the number of levels is the depth.',
      'from collections import deque\n\ndef max_depth(root):\n    if not root:\n        return 0\n    q, depth = deque([root]), 0\n    while q:\n        depth += 1\n        for _ in range(len(q)):\n            node = q.popleft()\n            if node.left: q.append(node.left)\n            if node.right: q.append(node.right)\n    return depth', 'O(n) time'),
      A('Iterative DFS with a stack', 'Push (node, depth) pairs on a stack and track the deepest depth seen.',
      'def max_depth(root):\n    best, stack = 0, [(root, 1)] if root else []\n    while stack:\n        node, d = stack.pop()\n        best = max(best, d)\n        if node.left: stack.append((node.left, d + 1))\n        if node.right: stack.append((node.right, d + 1))\n    return best', 'O(n) time')],
    pick: 'The two-line recursion is the clearest answer; the iterative versions avoid recursion limits on very deep trees.'
  },
  'dsa-41': {
    extra: [A('Iterative with a queue', 'Visit nodes breadth-first and swap the children of each one.',
      'from collections import deque\n\ndef invert_tree(root):\n    q = deque([root] if root else [])\n    while q:\n        node = q.popleft()\n        node.left, node.right = node.right, node.left\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n    return root', 'O(n) time')],
    pick: 'The recursive one-liner is short and obviously correct; the queue version shows you can do it without recursion.'
  },
  'dsa-42': {
    extra: [A('Iterative with a stack of pairs', 'Push matching pairs of nodes and compare them one by one.',
      'def is_same_tree(p, q):\n    stack = [(p, q)]\n    while stack:\n        a, b = stack.pop()\n        if not a and not b:\n            continue\n        if not a or not b or a.val != b.val:\n            return False\n        stack.append((a.left, b.left))\n        stack.append((a.right, b.right))\n    return True', 'O(n) time')],
    pick: 'Recursion mirrors the definition of "same tree" directly and is the expected answer.'
  },
  'dsa-43': {
    extra: [A('DFS with a depth index', 'Walk the tree depth-first and append each value to the list for its depth.',
      'def level_order(root):\n    out = []\n    def dfs(node, depth):\n        if not node:\n            return\n        if depth == len(out):\n            out.append([])\n        out[depth].append(node.val)\n        dfs(node.left, depth + 1)\n        dfs(node.right, depth + 1)\n    dfs(root, 0)\n    return out', 'O(n) time')],
    pick: 'A queue processes levels naturally, so BFS is the most direct way to explain level-order.'
  },
  'dsa-44': {
    brute: A('In-order list must be increasing', 'Collect the values with an in-order walk; a valid BST gives a strictly increasing list.',
      'def is_valid_bst(root):\n    vals = []\n    def walk(node):\n        if node:\n            walk(node.left)\n            vals.append(node.val)\n            walk(node.right)\n    walk(root)\n    return all(a < b for a, b in zip(vals, vals[1:]))', 'O(n) time, O(n) space'),
    pick: 'Passing down allowed ranges checks each node once and can stop at the first bad node, without building a list.'
  },
  'dsa-45': {
    brute: A('Full in-order list', 'Collect all values in sorted order and take index k − 1.',
      'def kth_smallest(root, k):\n    vals = []\n    def walk(node):\n        if node:\n            walk(node.left)\n            vals.append(node.val)\n            walk(node.right)\n    walk(root)\n    return vals[k - 1]', 'O(n) time and space'),
    pick: 'The iterative in-order stops as soon as it reaches the k-th value: O(h + k).'
  },
  'dsa-46': {
    extra: [A('Recursive version', 'Same rule written recursively: go left if both are smaller, right if both are larger, otherwise this node is the answer.',
      'def lowest_common_ancestor(root, p, q):\n    if p < root.val and q < root.val:\n        return lowest_common_ancestor(root.left, p, q)\n    if p > root.val and q > root.val:\n        return lowest_common_ancestor(root.right, p, q)\n    return root.val', 'O(h) time, O(h) call stack')],
    pick: 'The loop uses the BST ordering with O(1) extra space.'
  },
  'dsa-47': {
    brute: A('Heights for every node', 'For each node, compute the height of its left and right subtrees separately and keep the largest sum.',
      'def diameter(root):\n    def height(n):\n        return 0 if not n else 1 + max(height(n.left), height(n.right))\n    if not root:\n        return 0\n    through = height(root.left) + height(root.right)\n    return max(through, diameter(root.left), diameter(root.right))', 'O(n²) time in the worst case'),
    pick: 'Computing heights bottom-up once and updating the best on the way gives O(n).'
  },
  'dsa-48': {
    extra: [A('DFS, right child first', 'Visit the right side first; the first node seen at each new depth is the one visible from the right.',
      'def right_side_view(root):\n    out = []\n    def dfs(node, depth):\n        if not node:\n            return\n        if depth == len(out):\n            out.append(node.val)\n        dfs(node.right, depth + 1)\n        dfs(node.left, depth + 1)\n    dfs(root, 0)\n    return out', 'O(n) time')],
    pick: 'Level-order makes "last node of each level" easy to see; the DFS version is shorter if you are comfortable with recursion.'
  },
  'dsa-49': {
    brute: A('Sort descending', 'Sort from largest to smallest and take position k − 1.',
      'def kth_largest(nums, k):\n    return sorted(nums, reverse=True)[k - 1]', 'O(n log n) time'),
    extra: [A('heapq.nlargest', 'The standard library returns the k largest values; the last one is the answer.',
      'import heapq\n\ndef kth_largest(nums, k):\n    return heapq.nlargest(k, nums)[-1]', 'O(n log k) time')],
    pick: 'A size-k min-heap is O(n log k) and shows you understand heaps; quickselect (average O(n)) is the advanced follow-up.'
  },
  'dsa-50': {
    brute: A('Sort every round', 'Sort the stones each round and smash the two largest.',
      'def last_stone_weight(stones):\n    stones = list(stones)\n    while len(stones) > 1:\n        stones.sort()\n        y, x = stones.pop(), stones.pop()\n        if y != x:\n            stones.append(y - x)\n    return stones[0] if stones else 0', 'O(n² log n) time'),
    pick: 'A max-heap gives the two heaviest stones in O(log n) each round: O(n log n) overall.'
  },
  'dsa-51': {
    brute: A('Sort by distance', 'Sort all points by squared distance and take the first k.',
      'def k_closest(points, k):\n    return sorted(points, key=lambda p: p[0] ** 2 + p[1] ** 2)[:k]', 'O(n log n) time'),
    pick: '`heapq.nsmallest` is O(n log k), better when k is small compared with the number of points.'
  },
  'dsa-52': {
    brute: A('Simulate the CPU', 'Each time unit, run the most frequent task that is not cooling down (max-heap), and park used tasks in a cooldown queue.',
      'import heapq\nfrom collections import Counter, deque\n\ndef least_interval(tasks, n):\n    heap = [-c for c in Counter(tasks).values()]\n    heapq.heapify(heap)\n    cooling, time = deque(), 0\n    while heap or cooling:\n        time += 1\n        if heap:\n            left = heapq.heappop(heap) + 1\n            if left:\n                cooling.append((left, time + n))\n        if cooling and cooling[0][1] == time:\n            heapq.heappush(heap, cooling.popleft()[0])\n    return time', 'O(T log k) time for T time units'),
    pick: 'The counting formula is O(n) and elegant; explain the simulation first if the formula is not obvious to you, then derive the formula.'
  },
  'dsa-53': {
    extra: [A('Backtracking', 'At each index decide to take or skip the number and recurse.',
      'def subsets(nums):\n    out = []\n    def build(i, path):\n        if i == len(nums):\n            out.append(path)\n            return\n        build(i + 1, path)\n        build(i + 1, path + [nums[i]])\n    build(0, [])\n    return out', 'O(n · 2ⁿ) time'),
      A('Bit masks', 'Each number from 0 to 2ⁿ − 1 is a pattern of take/skip bits.',
      'def subsets(nums):\n    n = len(nums)\n    return [[nums[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]', 'O(n · 2ⁿ) time')],
    pick: 'All three are O(n · 2ⁿ); the iterative doubling is the shortest, backtracking is the pattern you reuse for harder problems.'
  },
  'dsa-54': {
    extra: [A('itertools.permutations', 'The standard library generates every ordering.',
      'from itertools import permutations as perms\n\ndef permutations(nums):\n    return [list(p) for p in perms(nums)]', 'O(n · n!) time'),
      A('Swap in place', 'Fix each position in turn by swapping every later element into it, then recurse and swap back.',
      'def permutations(nums):\n    out = []\n    def go(i):\n        if i == len(nums):\n            out.append(nums[:])\n            return\n        for j in range(i, len(nums)):\n            nums[i], nums[j] = nums[j], nums[i]\n            go(i + 1)\n            nums[i], nums[j] = nums[j], nums[i]\n    go(0)\n    return out', 'O(n · n!) time, O(n) extra')],
    pick: 'Interviewers want to see the backtracking yourself; mention `itertools` only as the production shortcut.'
  },
  'dsa-55': {
    extra: [A('Dynamic programming over amounts', 'combos[a] holds every combination that adds up to a; build it amount by amount, coin by coin so orders are not repeated.',
      'def combination_sum(candidates, target):\n    combos = [[] for _ in range(target + 1)]\n    combos[0] = [[]]\n    for c in candidates:\n        for a in range(c, target + 1):\n            combos[a] += [comb + [c] for comb in combos[a - c]]\n    return combos[target]', 'Depends on the number of combinations')],
    pick: 'Backtracking with a start index is the standard way to list combinations without duplicates and is easy to explain.'
  },
  'dsa-56': {
    extra: [A('Visited set instead of changing the board', 'Keep the cells on the current path in a set, so the board is never modified.',
      'def word_exists(board, word):\n    rows, cols = len(board), len(board[0])\n    path = set()\n    def dfs(r, c, i):\n        if i == len(word):\n            return True\n        if not (0 <= r < rows and 0 <= c < cols) or (r, c) in path or board[r][c] != word[i]:\n            return False\n        path.add((r, c))\n        found = any(dfs(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))\n        path.remove((r, c))\n        return found\n    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))', 'O(m·n·4^L) time')],
    pick: 'Marking cells in place avoids the extra set; both are the same backtracking search.'
  },
  'dsa-57': {
    extra: [A('Backtracking', 'Pick one letter for the current digit and recurse on the next digit.',
      "def letter_combinations(digits):\n    keys = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}\n    out = []\n    def build(i, path):\n        if i == len(digits):\n            out.append(path)\n            return\n        for ch in keys[digits[i]]:\n            build(i + 1, path + ch)\n    if digits:\n        build(0, '')\n    return out", 'O(4ⁿ · n) time'),
      A('itertools.product', 'The cartesian product of the letter groups is exactly every combination.',
      "from itertools import product\n\ndef letter_combinations(digits):\n    keys = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}\n    if not digits:\n        return []\n    return [''.join(p) for p in product(*(keys[d] for d in digits))]", 'O(4ⁿ · n) time')],
    pick: 'The iterative build-up is short and clear; backtracking is the pattern interviewers like to see.'
  },
  'dsa-58': {
    extra: [A('Breadth-first flood fill', 'Same idea, but sink each island with a queue instead of recursion (no recursion limit).',
      "from collections import deque\n\ndef num_islands(grid):\n    rows, cols = len(grid), len(grid[0])\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == '1':\n                count += 1\n                grid[r][c] = '0'\n                q = deque([(r, c)])\n                while q:\n                    x, y = q.popleft()\n                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):\n                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1':\n                            grid[nx][ny] = '0'\n                            q.append((nx, ny))\n    return count", 'O(m·n) time'),
      A('Union-Find', 'Start with every land cell as its own island and union neighbours; the number of separate groups is the answer.',
      "def num_islands(grid):\n    parent = {}\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    for r, row in enumerate(grid):\n        for c, v in enumerate(row):\n            if v == '1':\n                parent[(r, c)] = (r, c)\n    groups = len(parent)\n    for (r, c) in list(parent):\n        for nb in ((r + 1, c), (r, c + 1)):\n            if nb in parent:\n                a, b = find((r, c)), find(nb)\n                if a != b:\n                    parent[a] = b\n                    groups -= 1\n    return groups", 'about O(m·n) time')],
    pick: 'DFS flood fill is the shortest to write; BFS avoids deep recursion; Union-Find shines when cells are added over time.'
  },
  'dsa-59': {
    extra: [A('DFS cycle detection', 'Colour nodes: 0 = unvisited, 1 = on the current path, 2 = done. Reaching a node coloured 1 means a cycle.',
      'def can_finish(n, prereqs):\n    after = [[] for _ in range(n)]\n    for a, b in prereqs:\n        after[b].append(a)\n    state = [0] * n\n    def dfs(c):\n        if state[c] == 1:\n            return False\n        if state[c] == 2:\n            return True\n        state[c] = 1\n        if not all(dfs(nxt) for nxt in after[c]):\n            return False\n        state[c] = 2\n        return True\n    return all(dfs(c) for c in range(n))', 'O(V + E) time')],
    pick: "Kahn's algorithm is iterative and also gives a valid course order, which is a common follow-up."
  },
  'dsa-60': {
    brute: A('Repeat full-grid passes', 'Each minute, scan the whole grid and rot every fresh orange next to a rotten one, until nothing changes.',
      'def oranges_rotting(grid):\n    rows, cols = len(grid), len(grid[0])\n    minutes = 0\n    while True:\n        to_rot = [(r, c) for r in range(rows) for c in range(cols) if grid[r][c] == 1 and any(\n            0 <= r + dr < rows and 0 <= c + dc < cols and grid[r + dr][c + dc] == 2\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))]\n        if not to_rot:\n            break\n        for r, c in to_rot:\n            grid[r][c] = 2\n        minutes += 1\n    return -1 if any(1 in row for row in grid) else minutes', 'O((m·n)²) time'),
    pick: 'Multi-source BFS touches each cell once: O(m·n), with each BFS level being exactly one minute.'
  },
  'dsa-61': {
    extra: [A('DFS over an adjacency list', 'Build neighbours for each node and start a DFS from every unvisited node; each start is a new component.',
      'def count_components(n, edges):\n    adj = [[] for _ in range(n)]\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    seen, count = set(), 0\n    for start in range(n):\n        if start in seen:\n            continue\n        count += 1\n        stack = [start]\n        while stack:\n            node = stack.pop()\n            if node not in seen:\n                seen.add(node)\n                stack.extend(adj[node])\n    return count', 'O(V + E) time')],
    pick: 'Union-Find is compact and handles edges arriving one at a time; DFS is equally good for a fixed graph.'
  },
  'dsa-62': {
    extra: [A('Breadth-first with a queue', 'Same fill, iteratively, so a very large region cannot hit the recursion limit.',
      'from collections import deque\n\ndef flood_fill(image, sr, sc, color):\n    old = image[sr][sc]\n    if old == color:\n        return image\n    q = deque([(sr, sc)])\n    image[sr][sc] = color\n    while q:\n        r, c = q.popleft()\n        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):\n            if 0 <= nr < len(image) and 0 <= nc < len(image[0]) and image[nr][nc] == old:\n                image[nr][nc] = color\n                q.append((nr, nc))\n    return image', 'O(m·n) time')],
    pick: 'Recursive DFS is the shortest; mention the queue version for big images.'
  },
  'dsa-63': {
    extra: [A('Pattern buckets', 'Group words by patterns like "h*t". Words in the same bucket are one letter apart, so neighbours are found without trying 26 letters.',
      "from collections import defaultdict, deque\n\ndef ladder_length(begin, end, words):\n    if end not in words:\n        return 0\n    buckets = defaultdict(list)\n    for w in words + [begin]:\n        for i in range(len(w)):\n            buckets[w[:i] + '*' + w[i + 1:]].append(w)\n    q, seen = deque([(begin, 1)]), {begin}\n    while q:\n        w, steps = q.popleft()\n        if w == end:\n            return steps\n        for i in range(len(w)):\n            for nxt in buckets[w[:i] + '*' + w[i + 1:]]:\n                if nxt not in seen:\n                    seen.add(nxt)\n                    q.append((nxt, steps + 1))\n    return 0", 'O(N · L²) time')],
    pick: 'Plain BFS trying each letter is the easiest to get right; pattern buckets are faster when the word list is large.'
  },
  'dsa-64': {
    brute: A('Plain recursion', 'ways(n) = ways(n − 1) + ways(n − 2), written directly. Correct but recomputes the same values again and again.',
      'def climb_stairs(n):\n    if n <= 1:\n        return 1\n    return climb_stairs(n - 1) + climb_stairs(n - 2)', 'O(2ⁿ) time'),
    extra: [A('Memoised recursion', 'Same recursion, but remember each answer so it is computed only once.',
      'from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef climb_stairs(n):\n    return 1 if n <= 1 else climb_stairs(n - 1) + climb_stairs(n - 2)', 'O(n) time, O(n) space')],
    pick: 'The two-variable loop is O(n) time and O(1) space. Show the recursion first, then memoise, then reduce to two variables: that progression impresses interviewers.'
  },
  'dsa-65': {
    brute: A('Recursion with memo', 'best(i) = max(take house i + best(i + 2), skip to best(i + 1)).',
      'from functools import lru_cache\n\ndef rob(money):\n    @lru_cache(maxsize=None)\n    def best(i):\n        if i >= len(money):\n            return 0\n        return max(money[i] + best(i + 2), best(i + 1))\n    return best(0)', 'O(n) time, O(n) space'),
    extra: [A('DP array', 'dp[i] is the best total using the first i houses: dp[i] = max(dp[i − 1], dp[i − 2] + money[i − 1]).',
      'def rob(money):\n    dp = [0] * (len(money) + 1)\n    for i in range(1, len(money) + 1):\n        dp[i] = max(dp[i - 1], money[i - 1] + (dp[i - 2] if i >= 2 else 0))\n    return dp[-1]', 'O(n) time, O(n) space')],
    pick: 'Keeping only the last two values gives O(1) space; derive it from the DP array to show your thinking.'
  },
  'dsa-66': {
    brute: A('Recursion with memo', 'fewest(a) = 1 + min over coins of fewest(a − coin).',
      "from functools import lru_cache\n\ndef coin_change(coins, amount):\n    @lru_cache(maxsize=None)\n    def fewest(a):\n        if a == 0:\n            return 0\n        best = float('inf')\n        for c in coins:\n            if c <= a:\n                best = min(best, fewest(a - c) + 1)\n        return best\n    ans = fewest(amount)\n    return ans if ans != float('inf') else -1", 'O(amount · coins) time, may hit recursion limits'),
    extra: [A('BFS over amounts', 'Each coin is an edge; the fewest coins is the shortest path from 0 to the amount.',
      'from collections import deque\n\ndef coin_change(coins, amount):\n    if amount == 0:\n        return 0\n    seen, q = {0}, deque([(0, 0)])\n    while q:\n        total, steps = q.popleft()\n        for c in coins:\n            nxt = total + c\n            if nxt == amount:\n                return steps + 1\n            if nxt < amount and nxt not in seen:\n                seen.add(nxt)\n                q.append((nxt, steps + 1))\n    return -1', 'O(amount · coins) time')],
    pick: 'Bottom-up DP is iterative, O(amount · coins), and the textbook answer.'
  },
  'dsa-67': {
    brute: A('O(n²) dynamic programming', 'lis[i] = 1 + the best lis[j] for earlier j with a smaller value.',
      'def longest_increasing(nums):\n    lis = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                lis[i] = max(lis[i], lis[j] + 1)\n    return max(lis, default=0)', 'O(n²) time'),
    pick: 'The "tails" binary-search method is O(n log n). Explain the O(n²) DP first; it makes the faster idea easier to justify.'
  },
  'dsa-68': {
    extra: [A('Memoised recursion', 'can(i) is True if some word starts at i and the rest from its end can also be split.',
      'from functools import lru_cache\n\ndef word_break(s, words):\n    words = set(words)\n    @lru_cache(maxsize=None)\n    def can(i):\n        if i == len(s):\n            return True\n        return any(s[i:j] in words and can(j) for j in range(i + 1, len(s) + 1))\n    return can(0)', 'O(n²) time')],
    pick: 'The bottom-up `ok` array is iterative and easy to trace by hand in an interview.'
  },
  'dsa-69': {
    extra: [A('Combinatorics', 'Every path is (rows − 1) downs and (cols − 1) rights in some order: choose where the downs go.',
      'from math import comb\n\ndef unique_paths(rows, cols):\n    return comb(rows + cols - 2, rows - 1)', 'O(min(rows, cols)) time'),
      A('Recursion with memo', 'paths(r, c) = paths(r − 1, c) + paths(r, c − 1), with the edges having one path.',
      'from functools import lru_cache\n\ndef unique_paths(rows, cols):\n    @lru_cache(maxsize=None)\n    def paths(r, c):\n        if r == 1 or c == 1:\n            return 1\n        return paths(r - 1, c) + paths(r, c - 1)\n    return paths(rows, cols)', 'O(rows · cols) time')],
    pick: 'The one-row DP shows dynamic programming clearly; the maths formula is a great bonus once the DP is explained.'
  },
  'dsa-70': {
    brute: A('Recursion with memo', 'lcs(i, j) compares a[i] and b[j]: if equal, 1 + lcs(i + 1, j + 1), else the max of skipping one character.',
      'from functools import lru_cache\n\ndef longest_common_subsequence(a, b):\n    @lru_cache(maxsize=None)\n    def lcs(i, j):\n        if i == len(a) or j == len(b):\n            return 0\n        if a[i] == b[j]:\n            return 1 + lcs(i + 1, j + 1)\n        return max(lcs(i + 1, j), lcs(i, j + 1))\n    return lcs(0, 0)', 'O(n · m) time and space'),
    extra: [A('Full 2-D table', 'dp[i][j] is the answer for the first i letters of a and the first j letters of b.',
      'def longest_common_subsequence(a, b):\n    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]\n    for i in range(1, len(a) + 1):\n        for j in range(1, len(b) + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[-1][-1]', 'O(n · m) time and space')],
    pick: 'The rolling-row version keeps O(n · m) time with only O(m) memory; draw the full table first to explain it.'
  },
  'dsa-71': {
    brute: A('Every subarray', 'Try every start and extend to every end, keeping a running sum.',
      "def max_subarray(nums):\n    best = float('-inf')\n    for i in range(len(nums)):\n        s = 0\n        for x in nums[i:]:\n            s += x\n            best = max(best, s)\n    return best", 'O(n²) time'),
    extra: [A('Prefix sums', 'The best sum ending at i is prefix[i] minus the smallest prefix before it.',
      'def max_subarray(nums):\n    best, prefix, lowest = nums[0], 0, 0\n    for x in nums:\n        prefix += x\n        best = max(best, prefix - lowest)\n        lowest = min(lowest, prefix)\n    return best', 'O(n) time')],
    pick: "Kadane's algorithm is O(n), O(1) space and the standard answer."
  },
  'dsa-72': {
    brute: A('Recursion with memo', 'ways(i) = ways(i + 1) if s[i] is 1–9, plus ways(i + 2) if s[i:i+2] is 10–26.',
      "from functools import lru_cache\n\ndef num_decodings(s):\n    @lru_cache(maxsize=None)\n    def ways(i):\n        if i == len(s):\n            return 1\n        if s[i] == '0':\n            return 0\n        total = ways(i + 1)\n        if i + 1 < len(s) and 10 <= int(s[i:i + 2]) <= 26:\n            total += ways(i + 2)\n        return total\n    return ways(0)", 'O(n) time, O(n) space'),
    pick: 'The two-variable loop is O(n) time and O(1) space; the memoised recursion is the natural first step.'
  },
  'dsa-73': {
    brute: A('Merge until nothing overlaps', 'Repeatedly look for any two overlapping intervals and merge them, until no pair overlaps.',
      'def merge_intervals(intervals):\n    out = [list(iv) for iv in intervals]\n    merged = True\n    while merged:\n        merged = False\n        for i in range(len(out)):\n            for j in range(i + 1, len(out)):\n                a, b = out[i], out[j]\n                if a[0] <= b[1] and b[0] <= a[1]:\n                    out[i] = [min(a[0], b[0]), max(a[1], b[1])]\n                    out.pop(j)\n                    merged = True\n                    break\n            if merged:\n                break\n    return sorted(out)', 'O(n³) time'),
    pick: 'Sorting first means only neighbours can overlap, so one pass merges everything: O(n log n).'
  },
  'dsa-74': {
    extra: [A('Append, sort and merge', 'Add the new interval and reuse the merge-intervals algorithm.',
      'def insert_interval(intervals, new):\n    out = []\n    for s, e in sorted(intervals + [new]):\n        if out and s <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], e)\n        else:\n            out.append([s, e])\n    return out', 'O(n log n) time')],
    pick: 'Using the existing sorted order keeps it O(n); the sort-and-merge version is a safe fallback if you are short on time.'
  },
  'dsa-75': {
    brute: A('Longest compatible chain (DP)', 'Sort by start; dp[i] is the most intervals you can keep ending with interval i. Remove the rest.',
      'def erase_overlap(intervals):\n    iv = sorted(intervals)\n    if not iv:\n        return 0\n    dp = [1] * len(iv)\n    for i in range(len(iv)):\n        for j in range(i):\n            if iv[j][1] <= iv[i][0]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return len(iv) - max(dp)', 'O(n²) time'),
    extra: [A('Sort by start, keep the smaller end', 'Sort by start; on an overlap, remove the interval that ends later.',
      "def erase_overlap(intervals):\n    removed, end = 0, float('-inf')\n    for s, e in sorted(intervals):\n        if s >= end:\n            end = e\n        else:\n            removed += 1\n            end = min(end, e)\n    return removed", 'O(n log n) time')],
    pick: 'Greedy by end time is O(n log n) and provably optimal: always keep the interval that frees up the timeline first.'
  }
};

// Names for each problem's recommended (own) solution.
export const DSA_MAIN = {
  'dsa-01': 'Hash map, one pass', 'dsa-02': 'Set size check', 'dsa-03': 'Counter comparison', 'dsa-04': 'Sorted-letters key',
  'dsa-05': 'Counter.most_common', 'dsa-06': 'Prefix and suffix products', 'dsa-07': 'Set, count from run starts', 'dsa-08': 'Track the lowest price',
  'dsa-09': 'Boyer-Moore voting', 'dsa-10': 'Sum formula', 'dsa-11': 'Two pointers in place', 'dsa-12': 'Two pointers',
  'dsa-13': 'Sort + two pointers', 'dsa-14': 'Two pointers, move the shorter line', 'dsa-15': 'Two pointers with running maximums', 'dsa-16': 'Compare with the last kept value',
  'dsa-17': 'Sliding window with last-seen index', 'dsa-18': 'Sliding window with top count', 'dsa-19': 'Expand and shrink window', 'dsa-20': 'Monotonic deque',
  'dsa-21': 'Sliding letter count', 'dsa-22': 'Stack', 'dsa-23': 'Stack with if/elif', 'dsa-24': 'Monotonic stack',
  'dsa-25': 'Backtracking with counts', 'dsa-26': 'Increasing stack', 'dsa-27': 'Stack of folders', 'dsa-28': 'Binary search loop',
  'dsa-29': 'One-pass binary search', 'dsa-30': 'Binary search against the end', 'dsa-31': 'Binary search as one list', 'dsa-32': 'Binary search on the answer',
  'dsa-33': 'Binary search', 'dsa-34': 'Iterative pointer flip', 'dsa-35': 'Dummy node merge', 'dsa-36': 'Fast and slow pointers',
  'dsa-37': 'Two pointers with a gap', 'dsa-38': 'Fast and slow pointers', 'dsa-39': 'Digit-by-digit addition', 'dsa-40': 'Recursion',
  'dsa-41': 'Recursion', 'dsa-42': 'Recursion', 'dsa-43': 'BFS with a queue', 'dsa-44': 'Allowed range (lo, hi)',
  'dsa-45': 'Iterative in-order, stop early', 'dsa-46': 'Walk down using BST order', 'dsa-47': 'Heights bottom-up', 'dsa-48': 'Level order, right first',
  'dsa-49': 'Size-k min-heap', 'dsa-50': 'Max-heap', 'dsa-51': 'heapq.nsmallest', 'dsa-52': 'Counting formula',
  'dsa-53': 'Iterative doubling', 'dsa-54': 'Backtracking', 'dsa-55': 'Backtracking with a start index', 'dsa-56': 'DFS marking cells',
  'dsa-57': 'Iterative build-up', 'dsa-58': 'DFS flood fill', 'dsa-59': "Kahn's topological sort", 'dsa-60': 'Multi-source BFS',
  'dsa-61': 'Union-Find', 'dsa-62': 'Recursive DFS', 'dsa-63': 'BFS, try every letter', 'dsa-64': 'Two variables (bottom-up)',
  'dsa-65': 'Two variables (take / skip)', 'dsa-66': 'Bottom-up DP', 'dsa-67': 'Tails + binary search', 'dsa-68': 'Bottom-up DP',
  'dsa-69': 'One-row DP', 'dsa-70': 'Rolling-row DP', 'dsa-71': "Kadane's algorithm", 'dsa-72': 'Two-variable DP',
  'dsa-73': 'Sort, then merge in one pass', 'dsa-74': 'Split into before / overlap / after', 'dsa-75': 'Greedy by end time'
};
