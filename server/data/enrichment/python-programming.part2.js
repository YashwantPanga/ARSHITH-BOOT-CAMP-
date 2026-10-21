// Additional learning content for Python Programming, modules 6–10.
const PY_DOCS = 'Python Software Foundation';

export default {
  'py-mod-6': {
    skills: ['Design small functions with clear inputs and outputs', 'Use default and keyword arguments', 'Explain local vs global scope'],
    prerequisites: ['Loops and conditions (Modules 04–05)'],
    intuition: {
      analogy: 'A function is like a vending machine: you put specific things in (arguments), something happens inside that you do not need to watch, and you get one thing back (the return value). Printing inside the machine is like the machine shouting the result — useful to hear, but you cannot put a shout in your bag.',
      whyItMatters: 'Functions remove copy-pasted code, make programs testable piece by piece, and let you name an idea (calculate_gst) so the main program reads like a description of the task.'
    },
    workflow: {
      title: 'Lifecycle of a function call',
      nodes: [
        { id: 'call', label: 'Call site', detail: 'price_with_tax(1000, rate=0.18)', input: 'Argument values', output: 'Jump into the function' },
        { id: 'bind', label: 'Bind parameters', detail: 'Arguments are matched to parameters; defaults fill gaps.', input: 'Arguments', output: 'Local names amount=1000, rate=0.18' },
        { id: 'body', label: 'Execute body', detail: 'Local variables live only during this call.', input: 'Local names', output: 'Computed value' },
        { id: 'ret', label: 'return', detail: 'Sends one object back; without return the result is None.', input: 'Computed value', output: 'Return value' },
        { id: 'use', label: 'Caller uses result', detail: 'total = price_with_tax(...)', input: 'Return value', output: 'Stored or printed result' }
      ],
      edges: [{ from: 'call', to: 'bind' }, { from: 'bind', to: 'body' }, { from: 'body', to: 'ret' }, { from: 'ret', to: 'use' }],
      explanation: 'Each call gets a fresh local scope. When the function returns, its local variables disappear; only the returned object survives.'
    },
    workedExample: {
      title: 'Return values, defaults and keyword arguments',
      language: 'python',
      code: 'def price_with_tax(amount, rate=0.18, round_to=2):\n    """Return amount plus tax, rounded."""\n    return round(amount * (1 + rate), round_to)\n\nprint(price_with_tax(1000))\nprint(price_with_tax(1000, 0.05))\nprint(price_with_tax(999.99, round_to=0))\n\ndef shout(msg):\n    print(msg.upper())\n\nresult = shout("hi")\nprint(result)',
      lineByLine: [
        { line: 1, explanation: 'rate and round_to have defaults, so callers may omit them.' },
        { line: 3, explanation: 'return hands the value back to the caller.' },
        { line: 5, explanation: '1000 * 1.18 = 1180.0.' },
        { line: 7, explanation: 'Keyword argument round_to=0 skips the rate parameter: 999.99 * 1.18 = 1179.9882, rounded to 1180.0.' },
        { line: 12, explanation: 'shout() prints but returns nothing, so result is None.' }
      ],
      expectedOutput: '1180.0\n1050.0\n1180.0\nHI\nNone',
      edgeCases: ['Never use a mutable default such as def add(item, bag=[]) — the same list is shared across calls. Use bag=None and create the list inside.', 'Assigning to a global name inside a function creates a new local name unless you declare global (usually a design smell).']
    },
    caseStudy: {
      title: 'Refactoring a fee calculator',
      problem: 'A 120-line script repeats the same discount and tax logic for three course types, and a bug fix had to be made in three places.',
      data: 'Course base fees and discount rules per course type.',
      steps: ['Extract apply_discount(fee, percent) and add_tax(amount, rate) as small functions.', 'Write a final_fee(course_type) function that calls them.', 'Test each function with two or three known inputs.'],
      result: 'The script shrinks to about 40 lines; the next rule change is a one-line edit with matching tests.',
      limitations: 'Functions alone do not organise related data; Module 11 introduces classes for that.'
    },
    exercises: [
      {
        id: 'py6-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'return vs print',
        objective: 'Distinguish returning a value from printing it.',
        problem: 'def double(n):\n    print(n * 2)\n\nx = double(4)\n\nWhat is the value of x?',
        options: ['8', '"8"', 'None', '4'],
        hints: ['Look for a return statement.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['double prints 8 but has no return statement.', 'A function without return returns None, so x is None.'],
        explanation: 'Printing is a side effect for humans; returning is how code receives a value.',
        mistakes: ['Assuming the printed value is also returned.'],
        challenge: 'Change double so that x becomes 8 and nothing is printed.'
      },
      {
        id: 'py6-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Scope puzzle',
        objective: 'Understand local and global names.',
        problem: 'count = 10\n\ndef bump():\n    count = 1\n    return count + 1\n\nprint(bump(), count)\n\nWhat is printed?',
        hints: ['The assignment inside bump creates a local variable.'],
        check: { type: 'text', accept: ['2 10'] },
        solution: ['Inside bump, count = 1 is a new local name; it hides the global.', 'bump() returns 2.', 'The global count is still 10.'],
        explanation: 'Assignment inside a function makes the name local for the whole function body.',
        mistakes: ['Expecting the global to change to 1.'],
        challenge: 'What happens if you remove `count = 1` and write `count += 1` instead? (UnboundLocalError.)'
      },
      {
        id: 'py6-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Write a reusable grade function',
        objective: 'Design a function with a default argument and use its return value.',
        problem: 'Write percent(score, total=50) that returns the percentage rounded to 1 decimal. Then print the results for the calls below so the output is exactly:\n84.0\n72.5\n100.0',
        starterCode: 'def percent(score, total=50):\n    # return the percentage rounded to 1 decimal place\n    pass\n\nprint(percent(42))\nprint(percent(29, 40))\nprint(percent(total=20, score=20))\n',
        hints: ['score / total * 100', 'round(value, 1)'],
        check: { type: 'output', expectedOutput: '84.0\n72.5\n100.0' },
        solutionCode: 'def percent(score, total=50):\n    return round(score / total * 100, 1)\n\nprint(percent(42))\nprint(percent(29, 40))\nprint(percent(total=20, score=20))',
        solution: ['42 / 50 * 100 = 84.0.', '29 / 40 * 100 = 72.5.', 'Keyword arguments can be given in any order: 20 / 20 * 100 = 100.0.'],
        explanation: 'The default total=50 is only used when the caller does not pass total.',
        mistakes: ['Printing inside the function and returning nothing, which makes print(percent(...)) show None.'],
        challenge: 'Make the function raise ValueError when total is 0 or score is negative.'
      }
    ],
    knowledgeCheck: [
      { id: 'py6-k1', question: 'Which call is invalid for def f(a, b=2)?', options: ['f(1)', 'f(1, 3)', 'f(b=3, a=1)', 'f(b=3)'], answer: 3, explanation: 'a has no default, so it must be supplied.' },
      { id: 'py6-k2', question: 'What does math.sqrt(16) return?', options: ['4', '4.0', '"4"', '16'], answer: 1, explanation: 'math.sqrt always returns a float.' },
      { id: 'py6-k3', question: 'Why avoid def add(x, items=[])?', options: ['Lists cannot be defaults', 'The same list object is reused between calls', 'It is slower', 'It raises SyntaxError'], answer: 1, explanation: 'Default values are evaluated once, when the function is defined.' }
    ],
    cheatSheet: ['def name(param, opt=default): return value', 'f(x, key=value) — keyword arguments', '*args, **kwargs — variable arguments', 'import math; math.sqrt(), math.pi'],
    references: [
      { title: 'Defining Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', publisher: PY_DOCS },
      { title: 'More on Defining Functions (default and keyword arguments)', url: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions', publisher: PY_DOCS },
      { title: 'math — Mathematical functions', url: 'https://docs.python.org/3/library/math.html', publisher: PY_DOCS }
    ],
    next: 'Module 07 introduces lists, dictionaries and tuples — the data your functions will most often receive and return.'
  },

  'py-mod-7': {
    skills: ['Pick list, tuple, dict or set for a task', 'Count and group items with dictionaries', 'Avoid aliasing bugs with copies'],
    prerequisites: ['Loops and functions (Modules 05–06)'],
    intuition: {
      analogy: 'A list is a numbered queue, a tuple is a sealed envelope whose contents cannot change, a dictionary is a phone book (look up by name, not by position), and a set is a guest list where each name appears once.',
      whyItMatters: 'Choosing the right structure makes code simpler and faster: finding a key in a dict is effectively instant, while searching a long list checks every item.'
    },
    workflow: {
      title: 'Choosing a collection type',
      nodes: [
        { id: 'q1', label: 'Look up by key?', detail: 'Do you find items by a name/ID rather than position?', input: 'Your data', output: 'yes / no' },
        { id: 'dict', label: 'dict', detail: 'Key → value mapping, e.g. {"roll_17": 88}.', input: 'Keyed data', output: 'Fast lookups' },
        { id: 'q2', label: 'Duplicates matter?', detail: 'Do you only care whether an item is present?', input: 'Positional data', output: 'yes / no' },
        { id: 'set', label: 'set', detail: 'Unique items, fast membership tests.', input: 'Items', output: 'Unique collection' },
        { id: 'q3', label: 'Will it change?', detail: 'Do you need to add, remove or edit items?', input: 'Ordered data', output: 'yes / no' },
        { id: 'list', label: 'list', detail: 'Ordered, mutable sequence.', input: 'Items', output: 'Editable sequence' },
        { id: 'tuple', label: 'tuple', detail: 'Ordered, immutable; can be a dict key.', input: 'Fixed record', output: 'Read-only sequence' }
      ],
      edges: [
        { from: 'q1', to: 'dict', label: 'yes' }, { from: 'q1', to: 'q2', label: 'no' },
        { from: 'q2', to: 'set', label: 'only presence' }, { from: 'q2', to: 'q3', label: 'order/duplicates' },
        { from: 'q3', to: 'list', label: 'yes' }, { from: 'q3', to: 'tuple', label: 'no' }
      ],
      explanation: 'Answer the questions from left to right. Most real programs combine them — for example a dict whose values are lists.'
    },
    workedExample: {
      title: 'Counting and grouping with a dictionary',
      language: 'python',
      code: 'orders = [("Asha", "Python"), ("Ravi", "SQL"), ("Meena", "Python"), ("Ravi", "Web")]\n\ncount_by_course = {}\nfor student, course in orders:\n    count_by_course[course] = count_by_course.get(course, 0) + 1\nprint(count_by_course)\n\ncourses_by_student = {}\nfor student, course in orders:\n    courses_by_student.setdefault(student, []).append(course)\nprint(courses_by_student["Ravi"])\nprint(sorted(set(c for _, c in orders)))',
      lineByLine: [
        { line: 1, explanation: 'A list of (student, course) tuples.' },
        { line: 5, explanation: 'dict.get(key, 0) returns 0 for unseen keys, so counting needs no if.' },
        { line: 10, explanation: 'setdefault creates an empty list the first time a student appears, then appends.' },
        { line: 12, explanation: 'A set removes duplicates; sorted returns a list in alphabetical order.' }
      ],
      expectedOutput: "{'Python': 2, 'SQL': 1, 'Web': 1}\n['SQL', 'Web']\n['Python', 'SQL', 'Web']",
      edgeCases: ['b = a does not copy a list; use a.copy() or list(a). For nested lists use copy.deepcopy.', 'Dictionary keys must be hashable: tuples are allowed, lists are not.']
    },
    caseStudy: {
      title: 'Library book returns',
      problem: 'A college library exports a list of (member_id, book_title) returns and needs the number of books per member and the set of distinct titles.',
      data: 'A few thousand tuples exported from the library system.',
      steps: ['Count per member with dict.get(...) + 1.', 'Collect distinct titles in a set.', 'Sort the counts with sorted(d.items(), key=lambda kv: kv[1], reverse=True) for a leaderboard.'],
      result: 'A single pass produces both the leaderboard and the distinct-title count.',
      limitations: 'For multi-column analysis (dates, fines) pandas or SQL GROUP BY is a better tool.'
    },
    exercises: [
      {
        id: 'py7-e1', type: 'Predict the output', difficulty: 'Beginner',
        title: 'Slicing a list',
        objective: 'Apply start:stop:step slicing.',
        problem: 'nums = [10, 20, 30, 40, 50, 60]\nprint(nums[1:5:2])\n\nWhat is printed?',
        hints: ['Start at index 1, stop before index 5, take every 2nd element.'],
        check: { type: 'text', accept: ['[20, 40]'] },
        solution: ['Index 1 is 20; index 3 is 40; index 5 is excluded.', 'Result: [20, 40]'],
        explanation: 'Slices never include the stop index.',
        mistakes: ['Including 60 or starting at 10.'],
        challenge: 'What does nums[::-2] print? ([60, 40, 20])'
      },
      {
        id: 'py7-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Aliasing',
        objective: 'Recognise shared references.',
        problem: 'a = [[0, 0], [0, 0]]\nb = a.copy()\nb[0][0] = 9\n\nWhat is a?',
        options: ['[[0, 0], [0, 0]]', '[[9, 0], [0, 0]]', '[[9, 0], [9, 0]]', 'An error'],
        hints: ['copy() is shallow: the inner lists are shared.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['a.copy() creates a new outer list but the inner lists are the same objects.', 'b[0] is a[0], so changing b[0][0] changes a too.'],
        explanation: 'Use copy.deepcopy(a) to copy nested structures.',
        mistakes: ['Assuming copy() duplicates everything.'],
        challenge: 'Create a 3×3 grid of zeros correctly with a list comprehension (not [[0]*3]*3).'
      },
      {
        id: 'py7-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Word frequency',
        objective: 'Count items with a dictionary and sort the result.',
        problem: 'Count each word (case-insensitive) in the sentence and print the words with their counts, most frequent first, ties in alphabetical order. Expected:\nthe 3\ndata 2\nis 1\nnew 1\noil 1',
        starterCode: 'text = "The data is the new oil the DATA"\n\n# build a dict of counts, then print "word count" lines\n',
        hints: ['Use text.lower().split().', 'Sort with key=lambda kv: (-kv[1], kv[0]).'],
        check: { type: 'output', expectedOutput: 'the 3\ndata 2\nis 1\nnew 1\noil 1' },
        solutionCode: 'text = "The data is the new oil the DATA"\n\ncounts = {}\nfor word in text.lower().split():\n    counts[word] = counts.get(word, 0) + 1\n\nfor word, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):\n    print(word, n)',
        solution: ['Normalise case so "The" and "the" count together.', 'Count with dict.get.', 'Sort by negative count (descending), then by word (ascending).'],
        explanation: 'A tuple key sorts by its first element, then uses the second to break ties.',
        mistakes: ['Forgetting to lower-case, which counts "The" and "the" separately.'],
        challenge: 'Solve it again with collections.Counter and its most_common() method.'
      }
    ],
    knowledgeCheck: [
      { id: 'py7-k1', question: 'Which type can be used as a dictionary key?', options: ['list', 'dict', 'tuple of ints', 'set'], answer: 2, explanation: 'Keys must be hashable (immutable); tuples of immutable items are.' },
      { id: 'py7-k2', question: 'What does {1, 2, 2, 3} evaluate to?', options: ['{1, 2, 2, 3}', '{1, 2, 3}', '[1, 2, 3]', 'An error'], answer: 1, explanation: 'Sets keep one copy of each value.' },
      { id: 'py7-k3', question: 'What does d.get("x", 0) return if "x" is missing?', options: ['KeyError', 'None', '0', '"x"'], answer: 2, explanation: 'get returns the default instead of raising KeyError.' }
    ],
    cheatSheet: ['lst.append(x), lst.pop(), lst.sort(), sorted(lst, key=…)', 'd.get(k, default), d.items(), d.setdefault(k, [])', 'set operations: a | b, a & b, a - b', 'copy.deepcopy(nested)'],
    references: [
      { title: 'Data Structures', url: 'https://docs.python.org/3/tutorial/datastructures.html', publisher: PY_DOCS },
      { title: 'Sorting Techniques (key functions)', url: 'https://docs.python.org/3/howto/sorting.html', publisher: PY_DOCS },
      { title: 'copy — Shallow and deep copy operations', url: 'https://docs.python.org/3/library/copy.html', publisher: PY_DOCS }
    ],
    next: 'Module 08 treats strings as sequences, so the slicing and looping skills here carry straight over.'
  },

  'py-mod-8': {
    skills: ['Slice and search strings', 'Clean messy text with strip, split, replace and join', 'Format output with f-strings'],
    prerequisites: ['Lists and slicing (Module 07)'],
    intuition: {
      analogy: 'A string is a row of letter tiles glued to a board: you can read any tile or any run of tiles, but you cannot change one tile in place — you build a new board with the change.',
      whyItMatters: 'Names, emails, log lines, CSV rows and web pages all arrive as text. Most data work starts with cleaning strings.'
    },
    workflow: {
      title: 'Cleaning a raw text field',
      nodes: [
        { id: 'raw', label: 'Raw text', detail: '"  Priya.SHARMA@Example.COM \\n"', input: 'User or file input', output: 'Messy str' },
        { id: 'strip', label: '.strip()', detail: 'Remove surrounding spaces and newlines.', input: 'Messy str', output: 'Trimmed str' },
        { id: 'lower', label: '.lower()', detail: 'Normalise case for comparison.', input: 'Trimmed str', output: 'Lower-case str' },
        { id: 'split', label: '.split("@")', detail: 'Break into parts on a separator.', input: 'Clean str', output: 'List of parts' },
        { id: 'valid', label: 'Validate', detail: 'Exactly two parts and a dot in the domain?', input: 'Parts', output: 'Valid / invalid' }
      ],
      edges: [{ from: 'raw', to: 'strip' }, { from: 'strip', to: 'lower' }, { from: 'lower', to: 'split' }, { from: 'split', to: 'valid' }],
      explanation: 'Every method returns a new string, so steps can be chained: raw.strip().lower().split("@").'
    },
    workedExample: {
      title: 'Parsing a log line',
      language: 'python',
      code: 'line = "2026-03-14 09:42:07 ERROR payment failed for order=A1029 amount=499.00"\ndate, time, level, rest = line.split(" ", 3)\nprint(date[:4], level)\norder = rest[rest.find("order=") + 6:].split()[0]\nprint("Order:", order)\namount = float(rest.split("amount=")[1])\nprint(f"Amount: {amount:,.2f} | {level.title():>8}|")',
      lineByLine: [
        { line: 2, explanation: 'split(" ", 3) splits at most 3 times, keeping the message intact in rest.' },
        { line: 3, explanation: 'date[:4] slices the year.' },
        { line: 4, explanation: 'find returns the index of "order="; slicing after it and splitting on spaces isolates A1029.' },
        { line: 7, explanation: ':,.2f adds thousands separators and two decimals; :>8 right-aligns in 8 characters.' }
      ],
      expectedOutput: '2026 ERROR\nOrder: A1029\nAmount: 499.00 |    Error|',
      edgeCases: ['find returns -1 when the text is missing — check before slicing.', 's[0] = "X" raises TypeError because strings are immutable; build a new string instead.']
    },
    caseStudy: {
      title: 'Normalising phone numbers',
      problem: 'A contact list stores numbers as "+91 98765-43210", "098765 43210" and "9876543210".',
      data: 'Free-text phone numbers typed by users.',
      steps: ['Keep only digits with "".join(ch for ch in s if ch.isdigit()).', 'Take the last 10 digits for Indian mobile numbers.', 'Reject results that are shorter than 10 digits.'],
      result: 'All three variants become 9876543210, so duplicates can be detected.',
      limitations: 'International formats vary; production systems use a library such as phonenumbers. Module 12 shows regular expressions for pattern-based validation.'
    },
    exercises: [
      {
        id: 'py8-e1', type: 'Predict the output', difficulty: 'Beginner',
        title: 'Negative slicing',
        objective: 'Read negative indices and steps.',
        problem: 's = "PYTHON"\nprint(s[-3:], s[::-1])\n\nWhat is printed?',
        hints: ['-3 starts three characters from the end.', '[::-1] reverses.'],
        check: { type: 'text', accept: ['HON NOHTYP'] },
        solution: ['s[-3:] is "HON".', 's[::-1] is "NOHTYP".'],
        explanation: 'Negative indices count from the end; a negative step walks backwards.',
        mistakes: ['Answering "THO" for s[-3:].'],
        challenge: 'Write an expression that checks whether a word is a palindrome.'
      },
      {
        id: 'py8-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Join correctly',
        objective: 'Use str.join with the right types.',
        problem: 'Which expression produces "1-2-3"?',
        options: ['"-".join([1, 2, 3])', '"-".join(["1", "2", "3"])', '["1","2","3"].join("-")', '"1" + "-" * 3'],
        hints: ['join is a method of the separator string.', 'All items must already be strings.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Option A raises TypeError: join needs strings.', 'Option B is correct.', 'Lists have no join method.', 'Option D gives "1---".'],
        explanation: 'Use "-".join(map(str, numbers)) to join numbers.',
        mistakes: ['Calling join on the list, as in JavaScript.'],
        challenge: 'Join the numbers 1 to 10 with commas in a single expression.'
      },
      {
        id: 'py8-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Clean a list of names',
        objective: 'Chain string methods and format output.',
        problem: 'Clean each name (trim spaces, title-case) and print them numbered, exactly:\n1. Asha Rao\n2. Vikram Singh\n3. Neha Iyer',
        starterCode: 'raw = ["  asha RAO", "VIKRAM singh  ", " neha iyer "]\n\n# clean and print with numbers\n',
        hints: ['name.strip().title()', 'enumerate(raw, start=1)'],
        check: { type: 'output', expectedOutput: '1. Asha Rao\n2. Vikram Singh\n3. Neha Iyer' },
        solutionCode: 'raw = ["  asha RAO", "VIKRAM singh  ", " neha iyer "]\n\nfor i, name in enumerate(raw, start=1):\n    print(f"{i}. {name.strip().title()}")',
        solution: ['strip removes the spaces; title capitalises each word.', 'enumerate supplies the numbering.'],
        explanation: 'String methods return new strings, so they can be chained in one expression.',
        mistakes: ['Using capitalize(), which only capitalises the first word.'],
        challenge: 'Also print each person\'s initials, e.g. "AR".'
      }
    ],
    knowledgeCheck: [
      { id: 'py8-k1', question: 'What is len("naïve")?', options: ['5', '6', '4', 'Depends on the OS'], answer: 0, explanation: 'Python strings count Unicode characters (code points), not bytes.' },
      { id: 'py8-k2', question: '"a,b,,c".split(",") returns…', options: ["['a', 'b', 'c']", "['a', 'b', '', 'c']", "['a,b,,c']", 'An error'], answer: 1, explanation: 'An explicit separator keeps empty fields between consecutive commas.' },
      { id: 'py8-k3', question: 'Which call returns -1 when the substring is absent?', options: ['s.index("x")', 's.find("x")', 's.count("x")', 's.split("x")'], answer: 1, explanation: 'find returns -1; index raises ValueError.' }
    ],
    cheatSheet: ['s[start:stop:step], s[::-1]', 's.strip(), s.lower(), s.title(), s.replace(a, b)', 's.split(sep, maxsplit), sep.join(items)', 'f"{x:>8}", f"{n:,.2f}", f"{n:05d}"'],
    references: [
      { title: 'Text Sequence Type — str (string methods)', url: 'https://docs.python.org/3/library/stdtypes.html#string-methods', publisher: PY_DOCS },
      { title: 'Format Specification Mini-Language', url: 'https://docs.python.org/3/library/string.html#format-specification-mini-language', publisher: PY_DOCS },
      { title: 'Unicode HOWTO', url: 'https://docs.python.org/3/howto/unicode.html', publisher: PY_DOCS }
    ],
    next: 'Module 09 reads and writes these strings to files so data survives after the program ends.'
  },

  'py-mod-9': {
    skills: ['Read and write text files safely with `with`', 'Process large files line by line', 'Read and write CSV data'],
    prerequisites: ['Strings (Module 08)', 'Exceptions (Module 04)'],
    intuition: {
      analogy: 'RAM is a whiteboard — fast, but wiped when the power goes off. A file is a notebook in a drawer. Opening a file is taking the notebook out; `with` guarantees you put it back even if something goes wrong.',
      whyItMatters: 'Reports, logs, exports and configuration all live in files. Correct encoding and closing prevent corrupted data and lost writes.'
    },
    workflow: {
      title: 'Reading a CSV file safely',
      nodes: [
        { id: 'open', label: 'open(path, encoding="utf-8")', detail: 'Ask the OS for a file handle.', input: 'Path on disk', output: 'File object' },
        { id: 'err', label: 'FileNotFoundError', detail: 'Handle a missing or misspelled path.', input: 'Bad path', output: 'Message to the user' },
        { id: 'reader', label: 'csv.DictReader', detail: 'Parses each line into a dict keyed by the header row.', input: 'File object', output: 'One dict per row' },
        { id: 'proc', label: 'Process rows', detail: 'Convert types, filter, accumulate.', input: 'Row dicts', output: 'Results' },
        { id: 'close', label: 'with-block exit', detail: 'File is closed automatically, even after an exception.', input: 'Open handle', output: 'Released handle' }
      ],
      edges: [
        { from: 'open', to: 'reader', label: 'exists' }, { from: 'open', to: 'err', label: 'missing' },
        { from: 'reader', to: 'proc' }, { from: 'proc', to: 'close' }
      ],
      explanation: 'The with statement wraps the whole read; the file stays open only as long as needed.'
    },
    workedExample: {
      title: 'Write, then read back a CSV file',
      language: 'python',
      code: 'import csv, os, tempfile\n\npath = os.path.join(tempfile.gettempdir(), "marks.csv")\nrows = [{"name": "Asha", "marks": "88"}, {"name": "Ravi", "marks": "64"}, {"name": "Meena", "marks": "91"}]\n\nwith open(path, "w", newline="", encoding="utf-8") as f:\n    writer = csv.DictWriter(f, fieldnames=["name", "marks"])\n    writer.writeheader()\n    writer.writerows(rows)\n\nwith open(path, encoding="utf-8") as f:\n    data = list(csv.DictReader(f))\n\nprint(len(data), "rows")\nprint("Top:", max(data, key=lambda r: int(r["marks"]))["name"])\nos.remove(path)',
      lineByLine: [
        { line: 3, explanation: 'Build a path in the system temp folder so the example works on any OS.' },
        { line: 6, explanation: 'newline="" is required by the csv module to avoid blank lines on Windows.' },
        { line: 12, explanation: 'DictReader yields one dict per data row, using the header as keys. Values are strings.' },
        { line: 15, explanation: 'Convert marks to int inside the key function to compare numerically.' },
        { line: 16, explanation: 'Clean up the temporary file.' }
      ],
      expectedOutput: '3 rows\nTop: Meena',
      edgeCases: ['Opening with "w" truncates an existing file immediately — use "a" to append.', 'Reading a huge file with f.read() loads it all into memory; iterate with `for line in f:` instead.']
    },
    caseStudy: {
      title: 'Summarising a month of attendance logs',
      problem: 'Each day a biometric system writes attendance.csv with columns date, emp_id, status. HR wants the number of absences per employee for the month.',
      data: '30 CSV files of a few hundred rows each.',
      steps: ['Loop over the files with pathlib.Path("logs").glob("*.csv").', 'Read each with csv.DictReader inside a with block.', 'Count rows where status == "A" per emp_id in a dict.', 'Write the summary to absences.csv with DictWriter.'],
      result: 'A report that took an afternoon in a spreadsheet is produced in under a second and is repeatable next month.',
      limitations: 'Files with inconsistent headers need validation; for joins with other data a database (Module 15) is more robust.'
    },
    exercises: [
      {
        id: 'py9-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Choose the mode',
        objective: 'Pick the correct file mode.',
        problem: 'You want to add a new line to the end of an existing log.txt without deleting what is already there. Which mode?',
        options: ['"r"', '"w"', '"a"', '"x"'],
        hints: ['"w" truncates; "x" fails if the file exists.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['"a" (append) positions writes at the end and creates the file if needed.'],
        explanation: '"r" is read-only, "w" empties the file first, "x" is exclusive creation.',
        mistakes: ['Using "w" and losing the old log.'],
        challenge: 'Which mode would you use to read and write a binary image? ("rb"/"wb")'
      },
      {
        id: 'py9-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Why use with?',
        objective: 'Explain context managers.',
        problem: 'In one or two words: what does `with open(...) as f:` guarantee happens to the file when the block ends, even after an exception?',
        hints: ['Think of what you would otherwise call f.____().'],
        check: { type: 'text', keywords: ['close'] },
        solution: ['The file is closed automatically.', 'The context manager calls f.close() in its __exit__ method.'],
        explanation: 'Closing flushes buffered writes to disk and releases the OS handle.',
        mistakes: ['Thinking the file is saved but left open.'],
        challenge: 'Rewrite a with-block using try/finally to see what it does for you.'
      },
      {
        id: 'py9-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Count lines and words',
        objective: 'Read a file line by line and accumulate statistics.',
        problem: 'The starter code writes a small file. Read it back and print exactly:\nLines: 3\nWords: 9\nLongest: practising',
        starterCode: 'import os, tempfile\npath = os.path.join(tempfile.gettempdir(), "notes.txt")\nwith open(path, "w", encoding="utf-8") as f:\n    f.write("learn python daily\\nkeep practising code\\nship small projects\\n")\n\n# read the file and print the three statistics\n',
        hints: ['Iterate with `for line in f:` and split each line.', 'max(words, key=len) finds the longest word.'],
        check: { type: 'output', expectedOutput: 'Lines: 3\nWords: 9\nLongest: practising' },
        solutionCode: 'import os, tempfile\npath = os.path.join(tempfile.gettempdir(), "notes.txt")\nwith open(path, "w", encoding="utf-8") as f:\n    f.write("learn python daily\\nkeep practising code\\nship small projects\\n")\n\nlines = 0\nwords = []\nwith open(path, encoding="utf-8") as f:\n    for line in f:\n        lines += 1\n        words.extend(line.split())\nprint("Lines:", lines)\nprint("Words:", len(words))\nprint("Longest:", max(words, key=len))\nos.remove(path)',
        solution: ['Count each line as it is read.', 'Collect words with extend(line.split()).', 'Use max with key=len.'],
        explanation: 'split() without arguments also removes the trailing newline.',
        mistakes: ['Using f.read().split("\\n"), which produces an extra empty string after the last newline.'],
        challenge: 'Write the statistics to stats.txt instead of printing them.'
      }
    ],
    knowledgeCheck: [
      { id: 'py9-k1', question: 'Which encoding should you specify for text files to be portable?', options: ['ascii', 'utf-8', 'latin-1', 'None'], answer: 1, explanation: 'UTF-8 can represent every Unicode character and is the web standard.' },
      { id: 'py9-k2', question: 'What does csv.DictReader return for each row?', options: ['A list', 'A tuple', 'A dict keyed by header names', 'A string'], answer: 2, explanation: 'Values are strings and must be converted.' },
      { id: 'py9-k3', question: 'What happens to an existing file opened with mode "w"?', options: ['Appended to', 'Truncated to empty', 'Opened read-only', 'An error'], answer: 1, explanation: 'Write mode truncates immediately on open.' }
    ],
    cheatSheet: ['with open(p, "r"|"w"|"a", encoding="utf-8") as f:', 'for line in f: … (memory-friendly)', 'csv.DictReader(f), csv.DictWriter(f, fieldnames=…)', 'pathlib.Path("dir").glob("*.csv")'],
    references: [
      { title: 'Reading and Writing Files', url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files', publisher: PY_DOCS },
      { title: 'csv — CSV File Reading and Writing', url: 'https://docs.python.org/3/library/csv.html', publisher: PY_DOCS },
      { title: 'pathlib — Object-oriented filesystem paths', url: 'https://docs.python.org/3/library/pathlib.html', publisher: PY_DOCS }
    ],
    next: 'Module 10 goes deeper into exceptions so file and network failures are handled deliberately.'
  },

  'py-mod-10': {
    skills: ['Read a traceback from the bottom up', 'Use try/except/else/finally correctly', 'Raise custom exceptions and debug with print/logging/pdb'],
    prerequisites: ['Basic try/except (Module 04)', 'Functions (Module 06)'],
    intuition: {
      analogy: 'A traceback is a breadcrumb trail: the last line tells you what went wrong, and the lines above show the path of function calls that led there — like retracing your steps to find where you dropped your keys.',
      whyItMatters: 'Professional developers spend more time reading and fixing code than writing it. A systematic debugging method saves hours and prevents "fixes" that hide the real problem.'
    },
    workflow: {
      title: 'try / except / else / finally execution paths',
      nodes: [
        { id: 'try', label: 'try block', detail: 'Code that might fail.', input: 'Normal flow', output: 'Success or exception' },
        { id: 'except', label: 'except SomeError', detail: 'Runs only if a matching exception was raised.', input: 'Exception', output: 'Handled error' },
        { id: 'else', label: 'else block', detail: 'Runs only if the try block raised nothing.', input: 'Success', output: 'Follow-up work' },
        { id: 'finally', label: 'finally block', detail: 'Always runs: cleanup such as closing connections.', input: 'Any path', output: 'Cleanup done' },
        { id: 'up', label: 'Propagate', detail: 'Unmatched exceptions continue up the call stack after finally.', input: 'Unhandled exception', output: 'Caller or traceback' }
      ],
      edges: [
        { from: 'try', to: 'except', label: 'matching error' }, { from: 'try', to: 'else', label: 'no error' },
        { from: 'except', to: 'finally' }, { from: 'else', to: 'finally' }, { from: 'try', to: 'finally', label: 'other error' },
        { from: 'finally', to: 'up', label: 'if unhandled' }
      ],
      explanation: 'Keep the try block small so you only catch errors from the line you expect to fail; put follow-up work in else and cleanup in finally.'
    },
    workedExample: {
      title: 'Tracing every path',
      language: 'python',
      code: 'class InsufficientFunds(Exception):\n    pass\n\ndef withdraw(balance, amount):\n    if amount > balance:\n        raise InsufficientFunds(f"need {amount - balance} more")\n    return balance - amount\n\nfor amt in [200, 900, "x"]:\n    try:\n        left = withdraw(500, amt)\n    except InsufficientFunds as e:\n        print("declined:", e)\n    except TypeError:\n        print("invalid amount")\n    else:\n        print("ok, left", left)\n    finally:\n        print("-- logged", amt)',
      lineByLine: [
        { line: 1, explanation: 'A custom exception class names a business rule failure.' },
        { line: 6, explanation: 'raise stops the function and sends the exception to the caller.' },
        { line: 12, explanation: '`as e` gives access to the message.' },
        { line: 14, explanation: '"x" > 500 raises TypeError when comparing str with int.' },
        { line: 18, explanation: 'finally runs for every amount, whatever happened.' }
      ],
      expectedOutput: 'ok, left 300\n-- logged 200\ndeclined: need 400 more\n-- logged 900\ninvalid amount\n-- logged x',
      edgeCases: ['`except Exception: pass` silently hides bugs — at minimum log the error.', 'A return inside finally overrides any exception or earlier return — avoid it.']
    },
    caseStudy: {
      title: 'Debugging a wrong invoice total',
      problem: 'A billing script occasionally reports totals that are too small; there is no crash.',
      data: 'An invoice with 12 line items read from CSV.',
      steps: ['Reproduce with the smallest failing invoice.', 'Add logging.debug for each line item\'s parsed quantity and price.', 'Notice one quantity is "1,000" which int() rejected and a bare except replaced with 0.', 'Replace the bare except with ValueError handling that reports the row number.'],
      result: 'The root cause (a swallowed exception) is fixed rather than masked, and bad rows are now reported.',
      limitations: 'Logging only helps if the log is read; production systems ship logs to a monitoring tool with alerts.'
    },
    exercises: [
      {
        id: 'py10-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Read the traceback',
        objective: 'Find the actual error in a traceback.',
        problem: 'Traceback (most recent call last):\n  File "app.py", line 12, in <module>\n    report(data)\n  File "app.py", line 7, in report\n    avg = total / count\nZeroDivisionError: division by zero\n\nOn which line is the failing operation?',
        options: ['Line 12', 'Line 7', 'The first line', 'It cannot be determined'],
        hints: ['Read from the bottom: the last frame is where the error was raised.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['The most recent call is listed last: line 7 in report.', 'Line 12 is only where report was called.'],
        explanation: 'Tracebacks list calls oldest-first; the bottom frame is the failure point.',
        mistakes: ['Fixing the call site on line 12 instead of guarding count == 0.'],
        challenge: 'Fix report so it returns 0 for an empty dataset.'
      },
      {
        id: 'py10-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Which blocks run?',
        objective: 'Trace else and finally.',
        problem: 'try:\n    x = int("7")\nexcept ValueError:\n    print("A")\nelse:\n    print("B")\nfinally:\n    print("C")\n\nWhat is printed (letters separated by spaces)?',
        hints: ['int("7") succeeds.'],
        check: { type: 'text', accept: ['B C', 'BC', 'B, C'] },
        solution: ['No exception → except is skipped.', 'else runs → B.', 'finally always runs → C.'],
        explanation: 'else is for code that should run only when the try succeeded.',
        mistakes: ['Printing A as well, or forgetting finally.'],
        challenge: 'What prints if the string is "seven"? (A C)'
      },
      {
        id: 'py10-e3', type: 'Python coding', difficulty: 'Advanced', language: 'python',
        title: 'Validate with a custom exception',
        objective: 'Define, raise and handle a custom exception.',
        problem: 'Create InvalidAge(Exception). check_age(a) must raise InvalidAge for ages outside 0–120 and return the age otherwise. Expected output:\n25 accepted\n-3 rejected: age must be 0-120\n130 rejected: age must be 0-120',
        starterCode: 'class InvalidAge(Exception):\n    pass\n\ndef check_age(a):\n    # raise InvalidAge("age must be 0-120") when invalid\n    pass\n\nfor a in [25, -3, 130]:\n    # call check_age and print the result\n    pass\n',
        hints: ['if not 0 <= a <= 120: raise InvalidAge("age must be 0-120")', 'except InvalidAge as e: print(a, "rejected:", e)'],
        check: { type: 'output', expectedOutput: '25 accepted\n-3 rejected: age must be 0-120\n130 rejected: age must be 0-120' },
        solutionCode: 'class InvalidAge(Exception):\n    pass\n\ndef check_age(a):\n    if not 0 <= a <= 120:\n        raise InvalidAge("age must be 0-120")\n    return a\n\nfor a in [25, -3, 130]:\n    try:\n        check_age(a)\n    except InvalidAge as e:\n        print(a, "rejected:", e)\n    else:\n        print(a, "accepted")',
        solution: ['Raise the custom exception with a message.', 'Handle it per value so the loop continues.', 'Use else for the success message.'],
        explanation: 'str(e) is the message passed to the exception constructor.',
        mistakes: ['Returning an error string instead of raising — callers can then ignore it silently.'],
        challenge: 'Add an InvalidAge subclass TooOld and catch it separately to print a different message.'
      }
    ],
    knowledgeCheck: [
      { id: 'py10-k1', question: 'Which error is a semantic (logic) error?', options: ['Missing colon', 'NameError', 'Using + instead of * in a formula', 'IndentationError'], answer: 2, explanation: 'The program runs but produces wrong results.' },
      { id: 'py10-k2', question: 'What does `raise` with no arguments inside an except block do?', options: ['Nothing', 'Re-raises the current exception', 'Raises Exception()', 'Exits Python'], answer: 1, explanation: 'It re-raises the exception being handled, preserving its traceback.' },
      { id: 'py10-k3', question: 'Which module offers an interactive debugger?', options: ['debug', 'pdb', 'trace', 'inspect'], answer: 1, explanation: 'Call breakpoint() to enter pdb at that line.' }
    ],
    cheatSheet: ['try / except E as e / else / finally', 'raise CustomError("msg") from err', 'breakpoint() → pdb: n(ext), s(tep), p var, c(ontinue)', 'logging.basicConfig(level=logging.DEBUG)'],
    references: [
      { title: 'Errors and Exceptions — Handling and Raising', url: 'https://docs.python.org/3/tutorial/errors.html#handling-exceptions', publisher: PY_DOCS },
      { title: 'pdb — The Python Debugger', url: 'https://docs.python.org/3/library/pdb.html', publisher: PY_DOCS },
      { title: 'Logging HOWTO', url: 'https://docs.python.org/3/howto/logging.html', publisher: PY_DOCS }
    ],
    next: 'Module 11 organises data and behaviour together with classes, including custom exception hierarchies.'
  }
};
