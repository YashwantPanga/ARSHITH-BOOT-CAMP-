// Python Programming - detailed step-by-step sections for modules 1-5. Each section explains one
// idea, shows the syntax, gives an example that runs in the Practice Lab, and ends with a tip.
// The printed output of every example is generated into results.json.
const py = (s) => ({ language: 'python', ...s });

export default {
  'py-mod-1': [
    py({
      heading: 'What is Python?',
      text: 'Python is a programming language: a way to give a computer step-by-step instructions in words that look almost like English. It is used for websites, data analysis, artificial intelligence, automation scripts and teaching. It is popular because it is easy to read and has a huge library of ready-made tools.',
      bulletPoints: [
        'Python reads your program from top to bottom and runs one line at a time.',
        'It is free and runs on Windows, macOS and Linux.',
        'Companies such as Google, Netflix and Instagram use Python every day.'
      ],
      note: 'You do not need to install anything for this course: press "Try it" on any example to run it in your browser.'
    }),
    py({
      heading: 'Your first program: print()',
      text: 'print() shows text on the screen. Put the text inside quotes. Each print() starts a new line.',
      syntax: 'print("text to show")',
      code: 'print("Hello, World!")\nprint("I am learning Python.")',
      note: 'You can use single quotes or double quotes: print(\'Hi\') and print("Hi") are the same.'
    }),
    py({
      heading: 'Printing several values',
      text: 'Give print() several values separated by commas; it puts a space between them. Numbers do not need quotes.',
      code: 'print("My age is", 21)\nprint("2 + 3 =", 2 + 3)\nprint("Python", "is", "fun", sep="-")',
      note: 'sep="-" changes the separator from a space to a dash.'
    }),
    py({
      heading: 'Python as a calculator',
      text: 'Python can calculate directly. It follows the usual maths rules: multiplication and division before addition and subtraction, and brackets first.',
      code: 'print(10 + 5)\nprint(10 - 5)\nprint(10 * 5)\nprint(10 / 4)\nprint((2 + 3) * 4)',
      note: '/ always gives a decimal number (2.5). Module 3 shows // and % for whole-number division.'
    }),
    py({
      heading: 'Comments',
      text: 'A comment starts with # and is ignored by Python. Comments explain the code to people - including you, a month later.',
      syntax: '# this is a comment',
      code: '# Calculate the total price of 3 notebooks\nprice = 45      # price of one notebook\nprint(price * 3)'
    }),
    py({
      heading: 'Indentation matters',
      text: 'Python uses indentation (spaces at the start of a line) to show which lines belong together. Lines inside an if or a loop are indented by 4 spaces. Wrong indentation is an error, not just bad style.',
      code: 'marks = 75\nif marks >= 40:\n    print("Passed")       # indented: belongs to the if\n    print("Well done!")\nprint("Result checked")   # not indented: always runs',
      note: 'In the editors on this site, the Tab key inserts 4 spaces for you.'
    }),
    py({
      heading: 'Reading error messages',
      text: 'When something is wrong, Python stops and shows an error (a traceback). The last line tells you the kind of error and what happened; the line number shows where. Errors are normal - they tell you exactly what to fix.',
      table: {
        headers: ['Error', 'Usually means'],
        rows: [
          ['SyntaxError', 'Missing bracket, quote or colon'],
          ['NameError', 'A name is misspelt or not defined yet'],
          ['TypeError', 'Mixing types, e.g. adding text and a number'],
          ['IndentationError', 'Spaces at the start of a line are wrong']
        ]
      },
      code: 'try:\n    print(totl)          # misspelt name\nexcept NameError as e:\n    print("Python says:", e)',
      note: 'This example catches the error so you can read the message; module 4 explains try/except.'
    }),
    py({
      heading: 'Getting input from the user',
      text: 'input() shows a question, waits for the user to type and press Enter, and returns what they typed as text. In the Practice Lab, open the "Input" box and type the answers there before pressing Run.',
      syntax: 'answer = input("Question? ")',
      code: 'name = "Priya"            # in a real program: name = input("Your name? ")\nprint("Hello,", name + "!")',
      note: 'input() always returns text. To use it as a number, convert it: age = int(input("Age? ")) - see module 2.'
    })
  ],

  'py-mod-2': [
    py({
      heading: 'Variables',
      text: 'A variable is a name that stores a value, like a labelled box. You create it by assigning a value with =. Later you use the name to get the value back.',
      syntax: 'variable_name = value',
      code: 'student = "Aarav"\nmarks = 87\nprint(student, "scored", marks)',
      note: '= means "store this value", not "is equal to". Comparing uses == (module 3).'
    }),
    py({
      heading: 'Changing a variable',
      text: 'A variable can be given a new value at any time. The old value is replaced.',
      code: 'score = 10\nprint(score)\nscore = 25\nprint(score)\nscore = score + 5      # use the old value to make the new one\nprint(score)'
    }),
    py({
      heading: 'Naming rules',
      text: 'Names may contain letters, digits and underscores, but must not start with a digit, and must not be a Python keyword such as if or for. Names are case sensitive: Age and age are different variables.',
      table: {
        headers: ['Valid', 'Invalid', 'Why'],
        rows: [
          ['total_marks', '2total', 'starts with a digit'],
          ['first_name', 'first-name', '- is not allowed'],
          ['_count', 'for', 'for is a keyword'],
          ['studentName', 'student name', 'no spaces']
        ]
      },
      note: 'Python style is snake_case: small letters with underscores (total_marks).'
    }),
    py({
      heading: 'Data types',
      text: 'Every value has a type. The basic types are int (whole number), float (decimal number), str (text) and bool (True or False). type() tells you the type of a value.',
      code: 'print(type(42))\nprint(type(3.14))\nprint(type("hello"))\nprint(type(True))',
      table: {
        headers: ['Type', 'Example', 'Used for'],
        rows: [
          ['int', '42, -7, 0', 'counting, ages, quantities'],
          ['float', '3.14, 99.5', 'prices, measurements'],
          ['str', '"Hyderabad"', 'names and any text'],
          ['bool', 'True, False', 'yes / no answers']
        ]
      }
    }),
    py({
      heading: 'Converting between types',
      text: 'int(), float() and str() convert a value to another type. This is needed because input() always gives text, and you cannot add text and a number directly.',
      code: 'age_text = "21"\nage = int(age_text)\nprint(age + 1)\n\nprice = float("49.50")\nprint(price * 2)\n\nprint("Total: " + str(99))',
      note: 'int("hello") is an error: the text must look like a number.'
    }),
    py({
      heading: 'Expressions and statements',
      text: 'An expression is anything that produces a value: 2 + 3, marks * 2, "a" + "b". A statement is a complete instruction, such as an assignment or a print(). Expressions can use variables.',
      code: 'length = 8\nwidth = 5\narea = length * width          # expression on the right\nperimeter = 2 * (length + width)\nprint("Area:", area)\nprint("Perimeter:", perimeter)'
    }),
    py({
      heading: 'Several assignments at once',
      text: 'Python can assign several variables in one line, and swap two values without a temporary variable.',
      code: 'x, y, z = 1, 2, 3\nprint(x, y, z)\n\na = b = 0              # same value to both\nprint(a, b)\n\nx, y = y, x            # swap\nprint(x, y)'
    }),
    py({
      heading: 'f-strings: putting values into text',
      text: 'An f-string (a string with f before the quote) lets you put variables and expressions inside {} in the text. It is the easiest way to build messages.',
      syntax: 'f"text {variable} more text"',
      code: 'name = "Diya"\nmarks = 92.456\nprint(f"{name} scored {marks} marks")\nprint(f"Rounded: {marks:.1f}")\nprint(f"Next year she will be {20 + 1}")',
      note: ':.1f inside the braces shows one decimal place.'
    })
  ],

  'py-mod-3': [
    py({
      heading: 'Arithmetic operators',
      text: 'Python has seven arithmetic operators. The first four work like in school maths; the last three are very useful in programs.',
      table: {
        headers: ['Operator', 'Meaning', 'Example', 'Result'],
        rows: [
          ['+', 'add', '7 + 2', '9'],
          ['-', 'subtract', '7 - 2', '5'],
          ['*', 'multiply', '7 * 2', '14'],
          ['/', 'divide (decimal)', '7 / 2', '3.5'],
          ['//', 'divide, whole part', '7 // 2', '3'],
          ['%', 'remainder', '7 % 2', '1'],
          ['**', 'power', '7 ** 2', '49']
        ]
      },
      code: 'print(7 + 2, 7 - 2, 7 * 2)\nprint(7 / 2, 7 // 2, 7 % 2)\nprint(2 ** 10)'
    }),
    py({
      heading: 'Using // and %',
      text: '// and % are very useful together: // tells how many whole times something fits, % what is left over. A common use: is a number even? (n % 2 == 0)',
      code: 'minutes = 135\nhours = minutes // 60\nleft = minutes % 60\nprint(f"{minutes} minutes = {hours} h {left} min")\n\nprint("Is 14 even?", 14 % 2 == 0)'
    }),
    py({
      heading: 'Comparison operators',
      text: 'Comparisons give True or False. They are used in if statements and loops.',
      table: {
        headers: ['Operator', 'Meaning'],
        rows: [['==', 'equal to'], ['!=', 'not equal to'], ['>', 'greater than'], ['<', 'less than'], ['>=', 'greater or equal'], ['<=', 'less or equal']]
      },
      code: 'marks = 72\nprint(marks >= 40)\nprint(marks == 100)\nprint(marks != 100)\nprint("apple" < "banana")   # text compares alphabetically'
    }),
    py({
      heading: 'Logical operators: and, or, not',
      text: 'and is True only when both sides are True; or when at least one side is; not reverses a value.',
      code: 'age = 20\nhas_id = True\nprint(age >= 18 and has_id)\nprint(age < 13 or age > 60)\nprint(not has_id)'
    }),
    py({
      heading: 'Assignment operators',
      text: 'x += 5 is a short way to write x = x + 5. The same works for -=, *=, /=, //= and %=.',
      code: 'balance = 1000\nbalance += 250     # deposit\nbalance -= 100     # withdrawal\nbalance *= 2\nprint(balance)'
    }),
    py({
      heading: 'Operator precedence',
      text: 'When an expression has several operators, Python works them out in a fixed order: brackets, then **, then * / // %, then + -, then comparisons, then not, and, or. Use brackets whenever the order is not obvious.',
      code: 'print(2 + 3 * 4)        # 3 * 4 first\nprint((2 + 3) * 4)\nprint(2 ** 3 ** 2)      # ** goes right to left: 3 ** 2 first\nprint(10 - 4 - 3)       # left to right',
      note: 'Brackets cost nothing and make code easier to read - use them.'
    }),
    py({
      heading: 'Operators on text',
      text: '+ joins strings and * repeats them. in checks whether one string is part of another.',
      code: 'first = "Arshith"\nprint(first + " Bootcamp")\nprint("-" * 20)\nprint("boot" in "bootcamp")\nprint(len(first))'
    }),
    py({
      heading: 'Rounding and maths functions',
      text: 'round() rounds a number, abs() removes the minus sign, and the math module has more functions such as sqrt (square root) and ceil (round up).',
      code: 'import math\nprint(round(3.14159, 2))\nprint(abs(-8))\nprint(math.sqrt(144))\nprint(math.ceil(4.1), math.floor(4.9))\nprint(math.pi)'
    })
  ],

  'py-mod-4': [
    py({
      heading: 'The if statement',
      text: 'if runs a block of code only when a condition is True. The line ends with a colon, and the block is indented.',
      syntax: 'if condition:\n    code to run when True',
      code: 'temperature = 38\nif temperature > 35:\n    print("It is very hot today.")\nprint("Done")'
    }),
    py({
      heading: 'if ... else',
      text: 'else gives a second block that runs when the condition is False - exactly one of the two blocks runs.',
      syntax: 'if condition:\n    ...\nelse:\n    ...',
      code: 'marks = 35\nif marks >= 40:\n    print("Passed")\nelse:\n    print("Failed - try again")'
    }),
    py({
      heading: 'elif: more than two choices',
      text: 'elif (else if) checks another condition when the earlier ones were False. Python checks from top to bottom and runs only the first block whose condition is True.',
      code: 'marks = 78\nif marks >= 90:\n    grade = "A"\nelif marks >= 75:\n    grade = "B"\nelif marks >= 50:\n    grade = "C"\nelse:\n    grade = "D"\nprint("Grade:", grade)',
      note: 'Order matters: put the strictest condition first.'
    }),
    py({
      heading: 'Combining conditions',
      text: 'Use and, or and not to check several things at once. Python also allows chained comparisons like 18 <= age <= 60.',
      code: 'age = 25\nhas_ticket = True\nif age >= 18 and has_ticket:\n    print("Welcome to the show")\n\nif 18 <= age <= 60:\n    print("Working age")'
    }),
    py({
      heading: 'Nested if',
      text: 'An if can be placed inside another if. Each level is indented further.',
      code: 'logged_in = True\nis_admin = False\nif logged_in:\n    if is_admin:\n        print("Admin dashboard")\n    else:\n        print("Student dashboard")\nelse:\n    print("Please log in")'
    }),
    py({
      heading: 'One-line conditional expression',
      text: 'For a simple choice between two values, Python has a short form: value_if_true if condition else value_if_false.',
      code: 'marks = 55\nresult = "Pass" if marks >= 40 else "Fail"\nprint(result)'
    }),
    py({
      heading: 'try and except: handling errors',
      text: 'Some errors cannot be avoided in advance - a user may type letters where a number is expected. Put the risky code in try; if an error happens, Python jumps to except instead of stopping the program.',
      syntax: 'try:\n    risky code\nexcept ErrorType:\n    what to do instead',
      code: 'text = "abc"     # imagine the user typed this\ntry:\n    number = int(text)\n    print("Double:", number * 2)\nexcept ValueError:\n    print("Please enter a number, not", repr(text))',
      note: 'Catch specific errors (ValueError, ZeroDivisionError). A bare except: hides real bugs. Module 10 covers errors in depth.'
    }),
    py({
      heading: 'Truthy and falsy values',
      text: 'In an if, Python treats some values as False: 0, 0.0, an empty string "", an empty list [] and None. Everything else counts as True. This makes short checks possible.',
      code: 'name = ""\nif name:\n    print("Hello", name)\nelse:\n    print("Name is empty")\n\nitems = [3, 5]\nif items:\n    print("The cart has", len(items), "items")'
    })
  ],

  'py-mod-5': [
    py({
      heading: 'Why loops?',
      text: 'A loop repeats code. Instead of writing print() ten times, you write it once inside a loop. Python has two loops: while (repeat while a condition is True) and for (repeat once for each item).',
      code: 'for i in range(3):\n    print("Hello", i)'
    }),
    py({
      heading: 'The while loop',
      text: 'while repeats its block as long as the condition is True. Something inside the loop must change, otherwise it never stops (an infinite loop).',
      syntax: 'while condition:\n    code',
      code: 'count = 1\nwhile count <= 5:\n    print("Count:", count)\n    count += 1\nprint("Finished")',
      note: 'If a loop never stops in the Practice Lab, press the Stop button.'
    }),
    py({
      heading: 'The for loop and range()',
      text: 'for takes each value of a sequence in turn. range(n) gives 0, 1, ... n-1; range(start, stop) and range(start, stop, step) give other sequences. The stop value is never included.',
      syntax: 'for variable in range(start, stop, step):\n    code',
      code: 'for n in range(1, 6):\n    print(n, "squared is", n * n)\n\nprint(list(range(0, 20, 5)))\nprint(list(range(5, 0, -1)))'
    }),
    py({
      heading: 'Looping over a list or a string',
      text: 'for works on any sequence: lists, strings, and more. enumerate() also gives the position of each item.',
      code: 'fruits = ["apple", "banana", "mango"]\nfor fruit in fruits:\n    print("I like", fruit)\n\nfor i, fruit in enumerate(fruits, start=1):\n    print(i, fruit)\n\nfor letter in "SQL":\n    print(letter)'
    }),
    py({
      heading: 'break and continue',
      text: 'break stops the loop immediately. continue skips the rest of this round and goes on with the next one.',
      code: 'for n in range(1, 10):\n    if n == 6:\n        break          # stop completely at 6\n    if n % 2 == 0:\n        continue       # skip even numbers\n    print(n)'
    }),
    py({
      heading: 'Counting and totals',
      text: 'A very common pattern: start a variable at 0 before the loop, then add to it inside the loop. This gives counts, sums, and with them averages.',
      code: 'marks = [72, 88, 95, 64, 51]\ntotal = 0\npassed = 0\nfor m in marks:\n    total += m\n    if m >= 60:\n        passed += 1\nprint("Total:", total)\nprint("Average:", total / len(marks))\nprint("Passed:", passed)',
      note: 'Python also has built-ins for this: sum(marks), len(marks), max(marks), min(marks).'
    }),
    py({
      heading: 'Finding the largest value',
      text: 'Another classic pattern: remember the best value seen so far and update it when a bigger one appears.',
      code: 'prices = [499, 1299, 249, 329]\nlargest = prices[0]\nfor p in prices:\n    if p > largest:\n        largest = p\nprint("Most expensive:", largest)\nprint("Check with max():", max(prices))'
    }),
    py({
      heading: 'Nested loops',
      text: 'A loop inside a loop runs the inner loop completely for every round of the outer loop. It is how you go over rows and columns, like a multiplication table.',
      code: 'for row in range(1, 4):\n    line = ""\n    for col in range(1, 4):\n        line += f"{row * col:4}"\n    print(line)'
    }),
    py({
      heading: 'else on a loop',
      text: 'A loop can have an else block. It runs when the loop finished normally - not when it was stopped by break. It is handy for "searched everything and did not find it".',
      code: 'names = ["Aarav", "Diya", "Kabir"]\nwanted = "Meera"\nfor n in names:\n    if n == wanted:\n        print("Found", wanted)\n        break\nelse:\n    print(wanted, "is not in the list")'
    })
  ]
};
