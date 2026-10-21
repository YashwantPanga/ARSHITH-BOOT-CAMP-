// Additional learning content for Python Programming, modules 1–5.
// Original module text, code and quizzes stay in db.json untouched; this is rendered alongside it.

const PY_DOCS = 'Python Software Foundation';

export default {
  'py-mod-1': {
    skills: ['Run Python code interactively and from a .py file', 'Read a traceback and locate the failing line', 'Write correctly indented blocks and comments'],
    prerequisites: ['Basic computer use: creating folders and files', 'No prior programming experience is required'],
    intuition: {
      analogy: 'Think of the Python interpreter as a very literal assistant reading a recipe aloud. It reads one instruction, carries it out, then moves to the next. If a line is written in a way it cannot understand, it stops and tells you which line confused it.',
      whyItMatters: 'Every later module — data structures, files, web APIs, databases — is built from the same loop: write instructions, let the interpreter execute them, read the output or the error. Being comfortable with that loop early makes debugging much less stressful.'
    },
    workflow: {
      title: 'How a Python program runs',
      caption: 'From the text you type to the output you see.',
      nodes: [
        { id: 'src', label: 'Source code (.py)', detail: 'Plain-text instructions you write in an editor.', input: 'Your typed instructions', output: 'A text file such as hello.py' },
        { id: 'parse', label: 'Parser', detail: 'Checks the syntax (indentation, brackets, keywords).', input: 'Text of the program', output: 'A syntax tree, or a SyntaxError' },
        { id: 'bytecode', label: 'Bytecode compiler', detail: 'CPython turns the tree into compact bytecode instructions.', input: 'Syntax tree', output: 'Bytecode (cached in __pycache__ for imported modules)' },
        { id: 'pvm', label: 'Python Virtual Machine', detail: 'Executes the bytecode one instruction at a time.', input: 'Bytecode', output: 'Effects: calculations, files, network calls' },
        { id: 'out', label: 'Output / Traceback', detail: 'Printed results, or an error message with the failing line.', input: 'Results of execution', output: 'Text in the terminal' }
      ],
      edges: [
        { from: 'src', to: 'parse', label: 'read' },
        { from: 'parse', to: 'bytecode', label: 'valid syntax' },
        { from: 'bytecode', to: 'pvm', label: 'execute' },
        { from: 'pvm', to: 'out', label: 'print / raise' }
      ],
      explanation: 'When you run python hello.py, CPython first parses the whole file. A syntax problem is reported before any line runs. If parsing succeeds, the code is compiled to bytecode and executed by the virtual machine; runtime errors (such as dividing by zero) appear only when the failing line is reached.'
    },
    workedExample: {
      title: 'Your first complete script',
      language: 'python',
      code: '# greet.py – prints a short report\nname = "Asha"\ncourse = "Python Programming"\nmodules = 15\n\nprint("Learner:", name)\nprint("Course:", course)\nprint("Modules to finish:", modules)\nprint("Halfway point is module", modules // 2 + 1)',
      lineByLine: [
        { line: 1, explanation: 'A comment. Python ignores everything after #; it documents intent for humans.' },
        { line: 2, explanation: 'Creates the name `name` and binds it to the string "Asha".' },
        { line: 4, explanation: 'Binds `modules` to the integer 15.' },
        { line: 6, explanation: 'print() accepts several values and separates them with a single space.' },
        { line: 9, explanation: '15 // 2 is floor division (7), plus 1 gives 8.' }
      ],
      expectedOutput: 'Learner: Asha\nCourse: Python Programming\nModules to finish: 15\nHalfway point is module 8',
      edgeCases: ['Mixing tabs and spaces for indentation causes TabError in Python 3 — configure your editor to insert 4 spaces.', 'print "hi" (without parentheses) is Python 2 syntax and raises SyntaxError in Python 3.']
    },
    caseStudy: {
      title: 'Automating a daily attendance message',
      problem: 'A tutor types the same welcome message to a WhatsApp group every morning, changing only the date and the topic.',
      data: 'Inputs: today\'s topic (text) and the number of learners present (a whole number).',
      steps: [
        'Store the topic and the count in variables so they can change without editing the message text.',
        'Use print() with several arguments to build the message.',
        'Save the script as morning.py and run it with `python morning.py` each morning, then copy the output.'
      ],
      result: 'The message is consistent every day and typing mistakes in the fixed part disappear. Changing two variables is all the daily work that remains.',
      limitations: 'The script still needs to be run by hand and the result pasted manually; later modules on files and web services show how to read the topic from a file or send it automatically.'
    },
    exercises: [
      {
        id: 'py1-e1', type: 'Predict the output', difficulty: 'Beginner',
        title: 'What does print() show?',
        objective: 'Understand how print() separates multiple arguments.',
        problem: 'Without running it, decide exactly what this line prints:\n\nprint("Total:", 3 + 4, "items")',
        instructions: ['Evaluate the expression first, then join the three values the way print() does.'],
        hints: ['3 + 4 is evaluated before printing.', 'print() puts one space between each argument by default.'],
        check: { type: 'text', accept: ['Total: 7 items'] },
        solution: ['3 + 4 is evaluated to 7.', 'print receives three values: "Total:", 7 and "items".', 'They are joined with single spaces: Total: 7 items'],
        explanation: 'print(*values, sep=" ") converts each value to text and inserts sep between them.',
        mistakes: ['Writing "Total:7items" — the default separator is a space.', 'Expecting "3 + 4" to be printed literally; it is not in quotes, so it is calculated.'],
        challenge: 'Change the call so the output is Total:7:items using the sep parameter.'
      },
      {
        id: 'py1-e2', type: 'Debugging', difficulty: 'Beginner',
        title: 'Find the error type',
        objective: 'Recognise indentation errors from their traceback.',
        problem: 'This script fails before printing anything:\n\nif 5 > 2:\nprint("Five is greater")\n\nWhich exception does Python raise?',
        options: ['NameError', 'IndentationError', 'TypeError', 'ZeroDivisionError'],
        hints: ['Look at the line after the colon.', 'A block that follows if must be indented.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['A colon at the end of `if 5 > 2:` opens a block.', 'The next line is not indented, so the parser cannot find the block body.', 'Python reports IndentationError: expected an indented block.'],
        explanation: 'Indentation is part of Python\'s grammar. IndentationError is a subclass of SyntaxError, so it is raised during parsing — that is why nothing is printed.',
        mistakes: ['Thinking the error only appears when the line is reached; syntax errors stop the whole file from running.'],
        challenge: 'Add an else: branch that prints "Two is greater" and indent both blocks with 4 spaces.'
      },
      {
        id: 'py1-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Print a course banner',
        objective: 'Combine variables, arithmetic and print() in a script.',
        problem: 'Complete the script so it prints exactly two lines:\nPython Programming has 15 modules\nAt 3 modules per week it takes 5 weeks',
        instructions: ['Use the variables provided; do not type the numbers 15, 3 or 5 into the print statements.', 'Use floor division // to compute the weeks.'],
        starterCode: 'course = "Python Programming"\nmodules = 15\nper_week = 3\n\n# your code here\n',
        hints: ['print(course, "has", modules, "modules") produces the first line.', 'weeks = modules // per_week'],
        check: { type: 'output', expectedOutput: 'Python Programming has 15 modules\nAt 3 modules per week it takes 5 weeks' },
        solutionCode: 'course = "Python Programming"\nmodules = 15\nper_week = 3\n\nweeks = modules // per_week\nprint(course, "has", modules, "modules")\nprint("At", per_week, "modules per week it takes", weeks, "weeks")',
        solution: ['Compute weeks with floor division so the result is a whole number (5, not 5.0).', 'Pass each piece as a separate argument to print so spaces are added for you.'],
        explanation: '15 / 3 would give 5.0 (a float); // keeps it as the integer 5, which matches the expected text.',
        mistakes: ['Using / and printing 5.0 weeks.', 'Adding extra spaces inside the strings, which produces double spaces.'],
        challenge: 'Handle 16 modules: print how many weeks are needed if a partial week still counts as a week (hint: -(-a // b)).'
      }
    ],
    knowledgeCheck: [
      { id: 'py1-k1', question: 'Which command runs a script saved as report.py from a terminal?', options: ['run report.py', 'python report.py', 'print report.py', 'import report.py'], answer: 1, explanation: 'The python executable takes the script path as its argument.' },
      { id: 'py1-k2', question: 'When is a SyntaxError reported?', options: ['Only when the faulty line is reached', 'Before any line of the file runs', 'After the program finishes', 'Never; Python ignores it'], answer: 1, explanation: 'The whole file is parsed before execution, so syntax problems stop the program up front.' },
      { id: 'py1-k3', question: 'Which of these is a valid identifier?', options: ['2nd_place', 'class', 'total_score', 'my-name'], answer: 2, explanation: 'Identifiers cannot start with a digit, be a keyword, or contain hyphens.' }
    ],
    cheatSheet: ['python file.py — run a script', 'python — start the interactive prompt (>>>)', 'print(a, b, sep=", ", end="\\n")', '# comment', 'Indent blocks with 4 spaces'],
    references: [
      { title: 'The Python Tutorial — Using the Python Interpreter', url: 'https://docs.python.org/3/tutorial/interpreter.html', publisher: PY_DOCS },
      { title: 'The Python Tutorial — An Informal Introduction to Python', url: 'https://docs.python.org/3/tutorial/introduction.html', publisher: PY_DOCS },
      { title: 'Lexical analysis — Identifiers and keywords', url: 'https://docs.python.org/3/reference/lexical_analysis.html#identifiers', publisher: PY_DOCS }
    ],
    next: 'Module 02 builds on this by explaining what a variable really is and how Python decides the type of each value.'
  },

  'py-mod-2': {
    skills: ['Choose an appropriate built-in type for a value', 'Convert between str, int and float safely', 'Explain how assignment binds names to objects'],
    prerequisites: ['Running a script (Module 01)'],
    intuition: {
      analogy: 'A variable is a name tag, not a box. `x = 10` sticks the tag "x" onto the object 10. `y = x` sticks a second tag onto the same object — nothing is copied.',
      whyItMatters: 'Many beginner bugs come from type confusion: "5" + 5 fails, input() always returns text, and two names can point to the same list. Understanding names and types prevents these.'
    },
    workflow: {
      title: 'What happens during x = int(input())',
      nodes: [
        { id: 'kbd', label: 'Keyboard input', detail: 'The user types characters and presses Enter.', input: 'Keystrokes', output: 'Characters, e.g. "42"' },
        { id: 'input', label: 'input()', detail: 'Always returns a str, without the trailing newline.', input: 'Characters', output: 'str object "42"' },
        { id: 'conv', label: 'int() conversion', detail: 'Parses the text as a whole number; raises ValueError if it cannot.', input: 'str "42"', output: 'int object 42' },
        { id: 'bind', label: 'Name binding', detail: 'The name x now refers to the int object.', input: 'int object', output: 'x → 42' },
        { id: 'err', label: 'ValueError', detail: 'Raised for text such as "4.5" or "forty".', input: 'Unparseable str', output: 'Traceback' }
      ],
      edges: [
        { from: 'kbd', to: 'input' }, { from: 'input', to: 'conv' },
        { from: 'conv', to: 'bind', label: 'valid' }, { from: 'conv', to: 'err', label: 'invalid' }
      ],
      explanation: 'Type conversion is a separate step from reading input. Keeping that in mind explains why arithmetic on input() fails until the value is converted.'
    },
    workedExample: {
      title: 'Inspecting types and conversions',
      language: 'python',
      code: 'price = "499"\nqty = 3\nprint(type(price).__name__, type(qty).__name__)\ntotal = int(price) * qty\nprint("Total:", total)\nprint("As text:", str(total) + " INR")\nprint(float("2.50") * 2)',
      lineByLine: [
        { line: 1, explanation: 'Quotes make "499" a str, even though it looks like a number.' },
        { line: 3, explanation: 'type(x).__name__ gives the type\'s short name: str and int.' },
        { line: 4, explanation: 'int("499") converts the text to 499 before multiplying.' },
        { line: 6, explanation: 'Concatenation needs two strings, so the int is converted back with str().' },
        { line: 7, explanation: 'float("2.50") is 2.5; doubling gives 5.0 (floats keep the .0).' }
      ],
      expectedOutput: 'str int\nTotal: 1497\nAs text: 1497 INR\n5.0',
      edgeCases: ['int("3.7") raises ValueError — convert with int(float("3.7")) if truncation is intended.', 'bool("False") is True because any non-empty string is truthy.']
    },
    caseStudy: {
      title: 'Cleaning numbers from a sign-up form',
      problem: 'A coaching centre collects age and fee as text from a web form. Some entries contain spaces ("  21 ") or decimals ("1500.00").',
      data: 'Raw strings: age = "  21 ", fee = "1500.00".',
      steps: ['Strip surrounding whitespace with .strip().', 'Convert age with int() and fee with float().', 'Store the converted values in clearly named variables (age_years, fee_inr).'],
      result: 'Arithmetic such as fee_inr * 0.9 for a 10% discount now works, and invalid entries raise ValueError instead of silently producing wrong totals.',
      limitations: 'Validation of impossible values (age 400) and error messages for users are covered with try/except in Module 04.'
    },
    exercises: [
      {
        id: 'py2-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which expression fails?',
        objective: 'Predict TypeError when mixing str and int.',
        problem: 'Which expression raises a TypeError?',
        options: ['"5" * 3', '"5" + "3"', '"5" + 3', 'int("5") + 3'],
        hints: ['Repetition of a string by an int is allowed.', 'Only one option mixes + with a str and an int.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['"5" * 3 repeats the string: "555".', '"5" + "3" concatenates: "53".', '"5" + 3 tries to add a str and an int — TypeError.', 'int("5") + 3 is 8.'],
        explanation: 'Python does not convert types implicitly for +; you must convert explicitly with int() or str().',
        mistakes: ['Assuming Python behaves like JavaScript, where "5" + 3 gives "53".'],
        challenge: 'Rewrite the failing expression two ways: one that gives 8 and one that gives "53".'
      },
      {
        id: 'py2-e2', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Evaluate the expression',
        objective: 'Apply int and float conversion rules.',
        problem: 'What is the value of int(7.9) + int("2") * 2 ?',
        hints: ['int(7.9) truncates toward zero.', 'Multiplication happens before addition.'],
        check: { type: 'numeric', answer: 11, tolerance: 0 },
        solution: ['int(7.9) → 7 (the fractional part is discarded, not rounded).', 'int("2") * 2 → 4.', '7 + 4 = 11.'],
        explanation: 'int() on a float truncates toward zero; use round() if you want rounding.',
        mistakes: ['Rounding 7.9 up to 8 and answering 12.'],
        challenge: 'What does int(-7.9) return? (Answer: -7, because truncation is toward zero.)'
      },
      {
        id: 'py2-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Convert and total a receipt',
        objective: 'Convert text values to numbers and format a result.',
        problem: 'Three item prices arrive as strings. Print the total with two decimal places, exactly:\nTotal: 1049.50',
        starterCode: 'prices = ["499.00", "350.5", "200"]\n\n# convert each price to float, add them up, and print the total\n',
        hints: ['Loop over the list or use sum() with a generator: sum(float(p) for p in prices).', 'Format with an f-string: f"Total: {total:.2f}"'],
        check: { type: 'output', expectedOutput: 'Total: 1049.50' },
        solutionCode: 'prices = ["499.00", "350.5", "200"]\n\ntotal = sum(float(p) for p in prices)\nprint(f"Total: {total:.2f}")',
        solution: ['Convert each string with float().', 'Add them with sum().', 'Use the :.2f format specifier so the result shows two decimals.'],
        explanation: 'Without :.2f Python prints 1049.5 — numerically equal but not the receipt format we wanted.',
        mistakes: ['Calling sum(prices) directly, which raises TypeError because the items are strings.', 'Using int(), which fails on "499.00".'],
        challenge: 'Add 18% GST and print both the subtotal and the grand total on separate lines.'
      }
    ],
    knowledgeCheck: [
      { id: 'py2-k1', question: 'What type does input() return?', options: ['int', 'str', 'Whatever the user typed', 'float'], answer: 1, explanation: 'input() always returns a string; convert it yourself.' },
      { id: 'py2-k2', question: 'After a = [1, 2]; b = a; b.append(3), what is a?', options: ['[1, 2]', '[1, 2, 3]', 'An error', '[3]'], answer: 1, explanation: 'a and b are two names for the same list object.' },
      { id: 'py2-k3', question: 'Which name follows PEP 8 style for a variable?', options: ['TotalMarks', 'total_marks', 'TOTALMARKS', 'total-marks'], answer: 1, explanation: 'Variables use lowercase_with_underscores; hyphens are not even allowed.' }
    ],
    cheatSheet: ['type(x) — inspect a value\'s type', 'int(), float(), str(), bool() — explicit conversion', 'f"{value:.2f}" — two decimal places', 'a, b = b, a — swap values'],
    references: [
      { title: 'The Python Tutorial — Numbers, Text and Lists', url: 'https://docs.python.org/3/tutorial/introduction.html#using-python-as-a-calculator', publisher: PY_DOCS },
      { title: 'Built-in Types', url: 'https://docs.python.org/3/library/stdtypes.html', publisher: PY_DOCS },
      { title: 'PEP 8 — Style Guide for Python Code (Naming Conventions)', url: 'https://peps.python.org/pep-0008/#naming-conventions', publisher: PY_DOCS }
    ],
    next: 'Module 03 explains how operators combine these values and in which order Python evaluates them.'
  },

  'py-mod-3': {
    skills: ['Predict results of /, // and % on positive and negative numbers', 'Apply operator precedence without guessing', 'Use chained comparisons and augmented assignment'],
    prerequisites: ['Variables and numeric types (Module 02)'],
    intuition: {
      analogy: 'Operator precedence is like the rule "multiplication before addition" from school maths, extended to comparisons and logic. When in doubt, parentheses make your intent explicit — just as you would write them on paper.',
      whyItMatters: 'Silent precedence mistakes produce wrong numbers rather than errors, which are much harder to notice. Knowing the table — and using parentheses — keeps calculations trustworthy.'
    },
    workflow: {
      title: 'How Python evaluates 2 + 3 * 4 ** 2 > 40 and True',
      nodes: [
        { id: 'pow', label: '** (exponent)', detail: '4 ** 2 → 16', input: '4, 2', output: '16' },
        { id: 'mul', label: '* / // % (multiplicative)', detail: '3 * 16 → 48', input: '3, 16', output: '48' },
        { id: 'add', label: '+ - (additive)', detail: '2 + 48 → 50', input: '2, 48', output: '50' },
        { id: 'cmp', label: '> == < (comparison)', detail: '50 > 40 → True', input: '50, 40', output: 'True' },
        { id: 'log', label: 'not / and / or', detail: 'True and True → True', input: 'True, True', output: 'True' }
      ],
      edges: [{ from: 'pow', to: 'mul' }, { from: 'mul', to: 'add' }, { from: 'add', to: 'cmp' }, { from: 'cmp', to: 'log' }],
      explanation: 'Each stage takes the results of the higher-precedence stage before it. Arithmetic finishes before comparisons, and comparisons finish before logical operators.'
    },
    workedExample: {
      title: 'Division operators side by side',
      language: 'python',
      code: 'minutes = 135\nprint(minutes / 60)\nprint(minutes // 60, "h", minutes % 60, "min")\nprint(-7 // 2, -7 % 2)\nprint(2 ** 3 ** 2)\nscore = 72\nprint(60 <= score < 75)',
      lineByLine: [
        { line: 2, explanation: '/ always returns a float: 2.25.' },
        { line: 3, explanation: '// gives whole hours (2) and % gives the remainder (15).' },
        { line: 4, explanation: 'Floor division rounds toward negative infinity: -7 // 2 is -4, and -7 % 2 is 1 so that (-4)*2 + 1 == -7.' },
        { line: 5, explanation: '** is right-associative: 3 ** 2 = 9 first, then 2 ** 9 = 512.' },
        { line: 7, explanation: 'Chained comparison: equivalent to 60 <= score and score < 75.' }
      ],
      expectedOutput: '2.25\n2 h 15 min\n-4 1\n512\nTrue',
      edgeCases: ['0.1 + 0.2 == 0.3 is False because of binary floating point; compare with math.isclose().', 'x = x + 1 and x += 1 behave the same for ints, but += mutates lists in place.']
    },
    caseStudy: {
      title: 'Splitting a delivery time into hours and minutes',
      problem: 'A logistics dashboard receives durations in total minutes (e.g. 437) but drivers want "7 h 17 min".',
      data: 'An integer number of minutes per trip.',
      steps: ['Use // 60 for the hours.', 'Use % 60 for the remaining minutes.', 'Format both into a single string.'],
      result: '437 minutes becomes 7 h 17 min. The same divmod pattern converts seconds to minutes or paise to rupees.',
      limitations: 'Negative durations (data errors) would floor toward negative infinity; validate that minutes >= 0 first.'
    },
    exercises: [
      {
        id: 'py3-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Precedence check',
        objective: 'Apply precedence rules correctly.',
        problem: 'What is the value of 10 - 4 / 2 * 3 ?',
        hints: ['/ and * have the same precedence and are evaluated left to right.', '4 / 2 = 2.0, then 2.0 * 3.'],
        check: { type: 'numeric', answer: 4, tolerance: 0 },
        solution: ['4 / 2 → 2.0', '2.0 * 3 → 6.0', '10 - 6.0 → 4.0'],
        explanation: 'The result is 4.0 (a float, because / was used). Numerically it equals 4.',
        mistakes: ['Evaluating 10 - 4 first and getting 9.'],
        challenge: 'Add parentheses so the expression evaluates to 9.0.'
      },
      {
        id: 'py3-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Floor division with negatives',
        objective: 'Understand how // and % behave with negative operands.',
        problem: 'What does print(-17 // 5, -17 % 5) display?',
        hints: ['// rounds down (toward negative infinity).', 'The remainder satisfies (a // b) * b + (a % b) == a.'],
        check: { type: 'text', accept: ['-4 3'] },
        solution: ['-17 / 5 = -3.4, floored to -4.', '(-4) * 5 = -20, and -17 - (-20) = 3.', 'Output: -4 3'],
        explanation: 'Python keeps the remainder with the same sign as the divisor, unlike C or Java.',
        mistakes: ['Answering -3 -2 (truncation behaviour from other languages).'],
        challenge: 'Use divmod(-17, 5) and confirm it returns the same pair.'
      },
      {
        id: 'py3-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Seconds to a clock string',
        objective: 'Combine // and % to convert units.',
        problem: 'Convert 3725 seconds into hours, minutes and seconds. Print exactly:\n1:02:05',
        starterCode: 'total = 3725\n\n# compute hours, minutes, seconds and print them as H:MM:SS\n',
        hints: ['hours = total // 3600', 'minutes = (total % 3600) // 60 and seconds = total % 60', 'f"{minutes:02d}" pads with a leading zero.'],
        check: { type: 'output', expectedOutput: '1:02:05' },
        solutionCode: 'total = 3725\n\nhours = total // 3600\nminutes = (total % 3600) // 60\nseconds = total % 60\nprint(f"{hours}:{minutes:02d}:{seconds:02d}")',
        solution: ['3725 // 3600 = 1 hour, leaving 125 seconds.', '125 // 60 = 2 minutes; 3725 % 60 = 5 seconds.', 'Pad minutes and seconds to two digits.'],
        explanation: 'Each unit is taken with // and the rest is carried forward with %.',
        mistakes: ['Forgetting the zero padding and printing 1:2:5.', 'Using / and getting floats such as 1.03.'],
        challenge: 'Extend the program to days for totals larger than 86400 seconds.'
      }
    ],
    knowledgeCheck: [
      { id: 'py3-k1', question: 'What is 2 ** 2 ** 3?', options: ['64', '256', '12', '4096'], answer: 1, explanation: '** is right-associative: 2 ** (2 ** 3) = 2 ** 8 = 256.' },
      { id: 'py3-k2', question: 'Which expression is True?', options: ['1 < 3 < 2', '"b" > "a"', 'not True', '5 == 5.1'], answer: 1, explanation: 'Strings compare by Unicode code point; "b" comes after "a".' },
      { id: 'py3-k3', question: 'After x = 7; x %= 4, what is x?', options: ['1', '3', '1.75', '28'], answer: 1, explanation: '7 % 4 is 3.' }
    ],
    cheatSheet: ['/ true division → float', '// floor division, % remainder, divmod(a, b)', '** exponent (right-associative)', 'a < b < c chained comparison', 'math.isclose(a, b) for floats'],
    references: [
      { title: 'Expressions — Operator precedence', url: 'https://docs.python.org/3/reference/expressions.html#operator-precedence', publisher: PY_DOCS },
      { title: 'Floating-Point Arithmetic: Issues and Limitations', url: 'https://docs.python.org/3/tutorial/floatingpoint.html', publisher: PY_DOCS },
      { title: 'Numeric Types — int, float, complex', url: 'https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex', publisher: PY_DOCS }
    ],
    next: 'Module 04 uses comparison and logical operators to make decisions with if/elif/else and to handle errors.'
  },

  'py-mod-4': {
    skills: ['Write if/elif/else chains that cover every case', 'Use short-circuit evaluation deliberately', 'Catch specific exceptions with try/except'],
    prerequisites: ['Comparison and logical operators (Module 03)'],
    intuition: {
      analogy: 'An if/elif chain is a set of doors checked in order: Python walks through the first door whose condition is true and ignores the rest. try/except is a safety net under a tightrope — you still walk the rope, but a fall is caught and handled.',
      whyItMatters: 'Real input is messy. Programs must choose between actions (grades, discounts, access rights) and keep running when a user types "abc" where a number was expected.'
    },
    workflow: {
      title: 'Validating a marks entry',
      nodes: [
        { id: 'in', label: 'Read text', detail: 'raw = input("Marks: ")', input: 'Keyboard text', output: 'str' },
        { id: 'try', label: 'try: int(raw)', detail: 'Attempt the conversion.', input: 'str', output: 'int or exception' },
        { id: 'exc', label: 'except ValueError', detail: 'Explain the problem and stop or ask again.', input: 'ValueError', output: 'Friendly message' },
        { id: 'range', label: '0 ≤ marks ≤ 100 ?', detail: 'Reject impossible values.', input: 'int', output: 'valid / invalid' },
        { id: 'grade', label: 'if / elif / else', detail: 'Map marks to a grade band.', input: 'Valid marks', output: 'Grade letter' }
      ],
      edges: [
        { from: 'in', to: 'try' }, { from: 'try', to: 'exc', label: 'fails' }, { from: 'try', to: 'range', label: 'ok' },
        { from: 'range', to: 'grade', label: 'in range' }, { from: 'range', to: 'exc', label: 'out of range' }
      ],
      explanation: 'Conversion errors and business-rule violations are both handled before the grading logic runs, so the grade chain only ever sees valid data.'
    },
    workedExample: {
      title: 'Grade bands with validation',
      language: 'python',
      code: 'def grade(marks):\n    if not 0 <= marks <= 100:\n        return "invalid"\n    if marks >= 90:\n        return "A"\n    elif marks >= 75:\n        return "B"\n    elif marks >= 50:\n        return "C"\n    else:\n        return "F"\n\nfor raw in ["95", "75", "49", "120", "abc"]:\n    try:\n        print(raw, "->", grade(int(raw)))\n    except ValueError:\n        print(raw, "-> not a number")',
      lineByLine: [
        { line: 2, explanation: 'Guard clause: reject out-of-range values first.' },
        { line: 4, explanation: 'Conditions are checked top-down; the first true branch wins, so the order of thresholds matters.' },
        { line: 13, explanation: 'Loop over sample inputs to test every branch.' },
        { line: 15, explanation: 'int("abc") raises ValueError, which jumps to the except block.' }
      ],
      expectedOutput: '95 -> A\n75 -> B\n49 -> F\n120 -> invalid\nabc -> not a number',
      edgeCases: ['A bare `except:` also catches KeyboardInterrupt and hides real bugs — always name the exception.', 'Checking `marks >= 50` before `marks >= 90` would give every passing student a C.']
    },
    caseStudy: {
      title: 'Shipping-fee rules for an online store',
      problem: 'Orders above ₹999 ship free, members always ship free, otherwise the fee is ₹49; invalid totals must be rejected.',
      data: 'Order total (text from a form) and a boolean is_member.',
      steps: ['Convert the total inside try/except ValueError.', 'Use `if is_member or total > 999:` — short-circuiting means total is not even compared for members.', 'Return the fee and log rejected inputs.'],
      result: 'The rule fits in four readable lines and invalid input produces a clear message instead of a crash.',
      limitations: 'Hard-coded thresholds should eventually come from configuration so business teams can change them.'
    },
    exercises: [
      {
        id: 'py4-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which branch runs?',
        objective: 'Trace an if/elif chain.',
        problem: 'temp = 30\nif temp > 35: print("hot")\nelif temp > 25: print("warm")\nelif temp > 15: print("mild")\nelse: print("cold")\n\nWhat is printed?',
        options: ['hot', 'warm', 'warm and mild', 'cold'],
        hints: ['Only the first true condition runs.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['30 > 35 is False.', '30 > 25 is True → prints warm.', 'The remaining branches are skipped even though 30 > 15 is also true.'],
        explanation: 'elif branches are mutually exclusive with the ones above them.',
        mistakes: ['Thinking every true condition prints.'],
        challenge: 'Rewrite the chain so that it checks the coldest band first and still gives the same results.'
      },
      {
        id: 'py4-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Name the exception',
        objective: 'Choose the correct exception to catch.',
        problem: 'Which built-in exception should you catch when converting user input with int() and the text is "12a"? Type the exception name.',
        hints: ['The type is correct (str) but the value cannot be parsed.'],
        check: { type: 'text', accept: ['ValueError'] },
        solution: ['int() receives a str, so it is not a TypeError.', 'The content "12a" is not a valid integer literal, so Python raises ValueError.'],
        explanation: 'TypeError means the wrong type was passed (e.g. int([1])); ValueError means the right type with an unacceptable value.',
        mistakes: ['Catching Exception, which also hides unrelated bugs.'],
        challenge: 'Write a loop that keeps asking until a valid integer is entered.'
      },
      {
        id: 'py4-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Safe division report',
        objective: 'Handle more than one exception type.',
        problem: 'For each (a, b) pair, print the quotient rounded to 2 decimals, "cannot divide by zero" for ZeroDivisionError, or "bad input" for ValueError. Expected output:\n2.5\ncannot divide by zero\nbad input',
        starterCode: 'pairs = [("5", "2"), ("3", "0"), ("x", "4")]\n\nfor a, b in pairs:\n    # convert, divide and handle errors here\n    pass\n',
        hints: ['Put both int() calls and the division inside the try block.', 'Use two except clauses: except ZeroDivisionError and except ValueError.'],
        check: { type: 'output', expectedOutput: '2.5\ncannot divide by zero\nbad input' },
        solutionCode: 'pairs = [("5", "2"), ("3", "0"), ("x", "4")]\n\nfor a, b in pairs:\n    try:\n        print(round(int(a) / int(b), 2))\n    except ZeroDivisionError:\n        print("cannot divide by zero")\n    except ValueError:\n        print("bad input")',
        solution: ['Each iteration has its own try block, so one failure does not stop the loop.', 'Specific except clauses produce specific messages.'],
        explanation: 'Placing the try inside the loop isolates failures per item — a common pattern for batch processing.',
        mistakes: ['Putting the loop inside the try, which stops at the first error.'],
        challenge: 'Collect the errors in a list and print a summary count at the end.'
      }
    ],
    knowledgeCheck: [
      { id: 'py4-k1', question: 'Which value is truthy?', options: ['0', '""', '[]', '"0"'], answer: 3, explanation: 'A non-empty string is truthy even if it contains "0".' },
      { id: 'py4-k2', question: 'In `x is not None and x > 5`, what happens when x is None?', options: ['TypeError', 'The second comparison is skipped', 'It returns None', 'It prints a warning'], answer: 1, explanation: 'and short-circuits: if the left side is False the right side is not evaluated.' },
      { id: 'py4-k3', question: 'When does an else block attached to try run?', options: ['Always', 'Only when an exception occurred', 'Only when no exception occurred', 'Never'], answer: 2, explanation: 'try/else runs when the try block completed without raising.' }
    ],
    cheatSheet: ['if / elif / else — first true branch wins', 'and / or short-circuit', 'try / except SpecificError / else / finally', 'raise ValueError("message")'],
    references: [
      { title: 'More Control Flow Tools — if Statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements', publisher: PY_DOCS },
      { title: 'Errors and Exceptions', url: 'https://docs.python.org/3/tutorial/errors.html', publisher: PY_DOCS },
      { title: 'Built-in Exceptions', url: 'https://docs.python.org/3/library/exceptions.html', publisher: PY_DOCS }
    ],
    next: 'Module 05 repeats work with loops, using the same conditions to decide when to stop.'
  },

  'py-mod-5': {
    skills: ['Choose between for and while loops', 'Use accumulator, counter and search patterns', 'Avoid infinite loops and off-by-one errors with range()'],
    prerequisites: ['Conditions (Module 04)'],
    intuition: {
      analogy: 'A for loop is like a teacher calling every name on a register — the list decides how many turns there are. A while loop is like stirring a pot until the sauce thickens — you keep going while a condition holds, and you must make sure it eventually stops.',
      whyItMatters: 'Totals, averages, searches and data cleaning all repeat the same step over many items. Loops are how a few lines of code process thousands of records.'
    },
    workflow: {
      title: 'Anatomy of an accumulator loop',
      nodes: [
        { id: 'init', label: 'Initialise', detail: 'total = 0, count = 0 before the loop.', input: 'Nothing', output: 'Starting values' },
        { id: 'next', label: 'Next item?', detail: 'for takes the next element; stops when the iterable is exhausted.', input: 'Iterable', output: 'item or stop' },
        { id: 'body', label: 'Loop body', detail: 'Update total += item; count += 1; optionally continue/break.', input: 'item', output: 'Updated accumulators' },
        { id: 'after', label: 'After the loop', detail: 'Use the accumulated values, e.g. average = total / count.', input: 'Final accumulators', output: 'Result' }
      ],
      edges: [
        { from: 'init', to: 'next' }, { from: 'next', to: 'body', label: 'item' },
        { from: 'body', to: 'next', label: 'repeat' }, { from: 'next', to: 'after', label: 'exhausted / break' }
      ],
      explanation: 'The loop alternates between fetching the next item and updating the accumulators. Code after the loop sees the final values; initialising inside the loop would reset them every time.'
    },
    workedExample: {
      title: 'Totals, maximum and search in one pass',
      language: 'python',
      code: 'scores = [62, 88, 45, 91, 70]\ntotal = 0\nbest = None\nfor s in scores:\n    total += s\n    if best is None or s > best:\n        best = s\nprint("Average:", total / len(scores))\nprint("Best:", best)\n\nfor i, s in enumerate(scores, start=1):\n    if s < 50:\n        print("First fail at position", i)\n        break',
      lineByLine: [
        { line: 3, explanation: 'best starts as None so the first score always replaces it.' },
        { line: 5, explanation: 'Accumulate the running total.' },
        { line: 8, explanation: '356 / 5 = 71.2.' },
        { line: 11, explanation: 'enumerate gives positions starting at 1 alongside each value.' },
        { line: 14, explanation: 'break stops searching as soon as the first failing score is found.' }
      ],
      expectedOutput: 'Average: 71.2\nBest: 91\nFirst fail at position 3',
      edgeCases: ['range(1, 5) produces 1, 2, 3, 4 — the stop value is excluded.', 'Modifying a list while looping over it skips elements; loop over a copy or build a new list.']
    },
    caseStudy: {
      title: 'Daily steps tracker',
      problem: 'A fitness app stores the step count for each day of a week and wants the weekly total, the days above 8,000 steps and the first day under 3,000.',
      data: 'steps = [7200, 10450, 2900, 8800, 6100, 12000, 5000]',
      steps: ['Accumulate the total with a for loop.', 'Use a counter for days above 8,000.', 'Use enumerate and break to find the first low day.'],
      result: 'Total 52,450 steps, 3 active days, first low day: day 3. One pass over the data is enough.',
      limitations: 'For very large datasets, libraries such as pandas (AI course, Module 04) perform these aggregations faster.'
    },
    exercises: [
      {
        id: 'py5-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Count the iterations',
        objective: 'Understand range() boundaries.',
        problem: 'How many times does the body of `for i in range(3, 20, 4):` run?',
        hints: ['List the values: start at 3 and add 4 while the value is below 20.'],
        check: { type: 'numeric', answer: 5, tolerance: 0 },
        solution: ['The values are 3, 7, 11, 15, 19.', '23 would exceed the stop value 20, so there are 5 iterations.'],
        explanation: 'range(start, stop, step) never includes stop.',
        mistakes: ['Counting 23 or assuming stop is inclusive.'],
        challenge: 'Write a range that produces 10, 8, 6, 4, 2 (hint: negative step).'
      },
      {
        id: 'py5-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'continue versus break',
        objective: 'Trace loop control statements.',
        problem: 'What does this print (on one line, separated by spaces)?\n\nout = []\nfor n in range(1, 8):\n    if n % 2 == 0:\n        continue\n    if n > 5:\n        break\n    out.append(n)\nprint(*out)',
        hints: ['continue skips even numbers.', 'break ends the loop at the first odd number above 5.'],
        check: { type: 'text', accept: ['1 3 5'] },
        solution: ['n=1 → appended; 2 skipped; 3 appended; 4 skipped; 5 appended; 6 skipped; 7 > 5 → break.', 'print(*out) prints 1 3 5.'],
        explanation: 'continue jumps to the next iteration; break leaves the loop completely.',
        mistakes: ['Including 7, or thinking continue also stops the loop.'],
        challenge: 'Rewrite it with a list comprehension that produces the same list.'
      },
      {
        id: 'py5-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Weekly steps report',
        objective: 'Apply accumulator, counter and search patterns.',
        problem: 'Using the steps list, print exactly:\nTotal: 52450\nActive days: 3\nFirst low day: 3',
        starterCode: 'steps = [7200, 10450, 2900, 8800, 6100, 12000, 5000]\n\n# total, number of days above 8000, first day (1-based) below 3000\n',
        hints: ['Active days are those with more than 8000 steps.', 'Use enumerate(steps, start=1) for the 1-based day number and break when found.'],
        check: { type: 'output', expectedOutput: 'Total: 52450\nActive days: 3\nFirst low day: 3' },
        solutionCode: 'steps = [7200, 10450, 2900, 8800, 6100, 12000, 5000]\n\ntotal = 0\nactive = 0\nfor s in steps:\n    total += s\n    if s > 8000:\n        active += 1\nprint("Total:", total)\nprint("Active days:", active)\n\nfor day, s in enumerate(steps, start=1):\n    if s < 3000:\n        print("First low day:", day)\n        break',
        solution: ['Accumulate the total and count active days in one loop.', 'Search for the first low day with enumerate and break.'],
        explanation: 'Days 2, 4 and 6 exceed 8000 steps; day 3 has 2900 steps.',
        mistakes: ['Using >= 8000 (still 3 here, but read requirements carefully).', 'Reporting a 0-based day index.'],
        challenge: 'Also print the average steps rounded to the nearest whole number.'
      }
    ],
    knowledgeCheck: [
      { id: 'py5-k1', question: 'Which loop is best when you do not know in advance how many repetitions are needed?', options: ['for over a list', 'while with a condition', 'range()', 'enumerate()'], answer: 1, explanation: 'while repeats until its condition becomes false.' },
      { id: 'py5-k2', question: 'What does list(range(5)) produce?', options: ['[1, 2, 3, 4, 5]', '[0, 1, 2, 3, 4]', '[0, 1, 2, 3, 4, 5]', '[5]'], answer: 1, explanation: 'range starts at 0 by default and excludes the stop value.' },
      { id: 'py5-k3', question: 'What runs the else block of a for loop?', options: ['The loop ended without break', 'The loop was empty only', 'An exception occurred', 'break was used'], answer: 0, explanation: 'for/else runs when the loop finishes normally, i.e. not via break.' }
    ],
    cheatSheet: ['for x in iterable: … / while condition: …', 'range(start, stop, step) — stop excluded', 'enumerate(seq, start=1), zip(a, b)', 'break / continue / for-else'],
    references: [
      { title: 'More Control Flow Tools — for Statements and range()', url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements', publisher: PY_DOCS },
      { title: 'break and continue Statements, and else Clauses on Loops', url: 'https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements', publisher: PY_DOCS },
      { title: 'Built-in Functions — enumerate()', url: 'https://docs.python.org/3/library/functions.html#enumerate', publisher: PY_DOCS }
    ],
    next: 'Module 06 packages loops and conditions into reusable functions.'
  }
};
