// Python Programming - detailed step-by-step sections for modules 6-10 (see python-sections.part1.js).
const py = (s) => ({ language: 'python', ...s });

export default {
  'py-mod-6': [
    py({
      heading: 'What is a function?',
      text: 'A function is a named block of code that does one job. You define it once with def and call it as often as you like. Functions avoid repeating code and split a big program into small, understandable pieces.',
      syntax: 'def function_name():\n    code\n\nfunction_name()      # call it',
      code: 'def greet():\n    print("Welcome to Arshith Bootcamp!")\n\ngreet()\ngreet()'
    }),
    py({
      heading: 'Parameters and arguments',
      text: 'Parameters are names in the brackets of def; they receive the values (arguments) given in the call. This lets one function work with different data.',
      code: 'def greet(name, course):\n    print(f"Hello {name}, welcome to {course}!")\n\ngreet("Priya", "Python")\ngreet("Rahul", "SQL")'
    }),
    py({
      heading: 'return: sending a value back',
      text: 'return ends the function and gives a value back to the caller, which can store or use it. A function without return gives back None.',
      syntax: 'def name(params):\n    ...\n    return value',
      code: 'def area(length, width):\n    return length * width\n\nroom = area(4, 5)\nprint("Room area:", room)\nprint("Two rooms:", area(4, 5) + area(3, 3))',
      note: 'print() shows a value; return hands it back. Functions that calculate something should return it.'
    }),
    py({
      heading: 'Default values and keyword arguments',
      text: 'A parameter can have a default value, used when the caller leaves it out. Callers can also name the arguments (keyword arguments), which makes calls clearer and order-independent.',
      code: 'def price_with_tax(amount, tax=0.18):\n    return round(amount * (1 + tax), 2)\n\nprint(price_with_tax(100))            # uses 18%\nprint(price_with_tax(100, 0.05))      # 5%\nprint(price_with_tax(tax=0.12, amount=200))'
    }),
    py({
      heading: '*args and **kwargs',
      text: '*args collects any number of extra arguments into a tuple; **kwargs collects named extra arguments into a dictionary. They let a function accept a flexible number of inputs.',
      code: 'def total(*numbers):\n    return sum(numbers)\n\nprint(total(1, 2))\nprint(total(5, 10, 15, 20))\n\ndef profile(**details):\n    for key, value in details.items():\n        print(f"{key}: {value}")\n\nprofile(name="Diya", city="Pune", age=21)'
    }),
    py({
      heading: 'Scope: local and global variables',
      text: 'Variables created inside a function are local: they exist only while the function runs and are invisible outside. Variables created outside functions are global and can be read inside.',
      code: 'rate = 0.1              # global\n\ndef interest(amount):\n    result = amount * rate   # local\n    return result\n\nprint(interest(5000))\ntry:\n    print(result)\nexcept NameError:\n    print("result only exists inside the function")',
      note: 'Pass values in as parameters and return results, instead of changing global variables.'
    }),
    py({
      heading: 'Lambda: tiny one-line functions',
      text: 'lambda creates a small unnamed function in one line. It is mostly used as a quick argument to sorted(), map() or filter().',
      syntax: 'lambda parameters: expression',
      code: 'square = lambda x: x * x\nprint(square(7))\n\nstudents = [("Aarav", 87), ("Diya", 95), ("Kabir", 72)]\nprint(sorted(students, key=lambda s: s[1], reverse=True))'
    }),
    py({
      heading: 'Docstrings',
      text: 'A docstring is a text in triple quotes right under def. It explains what the function does; help() and code editors show it.',
      code: 'def bmi(weight_kg, height_m):\n    """Return the body mass index, rounded to 1 decimal."""\n    return round(weight_kg / height_m ** 2, 1)\n\nprint(bmi(68, 1.75))\nprint(bmi.__doc__)'
    }),
    py({
      heading: 'Modules: using other people\'s functions',
      text: 'A module is a file of ready-made functions. import brings it in. Python ships with many: math, random, datetime, statistics, json, and more.',
      syntax: 'import module\nfrom module import name',
      code: 'import math\nfrom statistics import mean, median\nfrom datetime import date\n\nprint(math.factorial(5))\nprint(mean([72, 88, 95]), median([72, 88, 95]))\nprint(date(2025, 1, 1).strftime("%A"))'
    })
  ],

  'py-mod-7': [
    py({
      heading: 'Lists',
      text: 'A list stores many values in order, inside square brackets. Lists can grow and shrink, and can hold any type. Each item has a position (index) starting at 0.',
      syntax: 'my_list = [item1, item2, item3]',
      code: 'marks = [72, 88, 95, 64]\nprint(marks)\nprint(marks[0])       # first item\nprint(marks[-1])      # last item\nprint(len(marks))'
    }),
    py({
      heading: 'Slicing a list',
      text: 'list[start:stop] gives a part of a list, from start up to (not including) stop. Leave a side empty to mean "from the beginning" or "to the end".',
      code: 'days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]\nprint(days[0:5])     # weekdays\nprint(days[5:])      # weekend\nprint(days[:3])\nprint(days[::2])     # every second day\nprint(days[::-1])    # reversed'
    }),
    py({
      heading: 'Changing a list',
      text: 'Lists have methods to add, insert and remove items, and you can change an item by its index.',
      table: {
        headers: ['Method', 'Does'],
        rows: [['append(x)', 'add x at the end'], ['insert(i, x)', 'add x at position i'], ['remove(x)', 'remove the first x'], ['pop()', 'remove and return the last item'], ['sort()', 'sort the list'], ['reverse()', 'reverse the order']]
      },
      code: 'cart = ["pen", "book"]\ncart.append("bag")\ncart.insert(0, "laptop")\ncart.remove("pen")\ncart[1] = "notebook"\nprint(cart)\nlast = cart.pop()\nprint("Removed:", last, "->", cart)\ncart.sort()\nprint(cart)'
    }),
    py({
      heading: 'List comprehensions',
      text: 'A list comprehension builds a new list from another in one line: [expression for item in list if condition]. It replaces a short loop with append().',
      code: 'numbers = [1, 2, 3, 4, 5, 6]\nsquares = [n * n for n in numbers]\nevens = [n for n in numbers if n % 2 == 0]\nprint(squares)\nprint(evens)\n\nnames = ["aarav", "diya"]\nprint([n.title() for n in names])'
    }),
    py({
      heading: 'Tuples',
      text: 'A tuple is like a list that cannot be changed after it is made. It uses round brackets. Use tuples for fixed groups of values, such as coordinates or a date.',
      code: 'point = (12.5, 7.0)\nx, y = point          # unpacking\nprint(x, y)\nrgb = (1, 58, 43)\nprint(rgb[0], len(rgb))\ntry:\n    rgb[0] = 255\nexcept TypeError as e:\n    print("Error:", e)'
    }),
    py({
      heading: 'Dictionaries',
      text: 'A dictionary stores key: value pairs, like a word and its meaning. You look values up by key instead of by position. Keys are usually strings and must be unique.',
      syntax: 'my_dict = {"key1": value1, "key2": value2}',
      code: 'student = {"name": "Priya", "age": 21, "city": "Kolkata"}\nprint(student["name"])\nstudent["age"] = 22          # change\nstudent["course"] = "SQL"    # add\nprint(student)\nprint(student.get("phone", "not given"))'
    }),
    py({
      heading: 'Looping over a dictionary',
      text: '.keys(), .values() and .items() give the keys, the values, or both. A classic use: counting how often each thing appears.',
      code: 'votes = ["red", "blue", "red", "green", "red", "blue"]\ncounts = {}\nfor colour in votes:\n    counts[colour] = counts.get(colour, 0) + 1\n\nfor colour, n in counts.items():\n    print(colour, n)\nprint("Winner:", max(counts, key=counts.get))'
    }),
    py({
      heading: 'Sets',
      text: 'A set stores unique values with no order. It removes duplicates automatically and makes membership tests and comparisons (common items, differences) easy.',
      code: 'emails = ["a@x.com", "b@x.com", "a@x.com"]\nunique = set(emails)\nprint(unique, len(unique))\n\npython_students = {"Aarav", "Diya", "Kabir"}\nsql_students = {"Diya", "Meera"}\nprint("Both:", python_students & sql_students)\nprint("Only Python:", python_students - sql_students)'
    }),
    py({
      heading: 'Choosing the right structure',
      text: 'Each structure fits a different job. Ask: does the order matter, will it change, and do I look things up by a name or by a position?',
      table: {
        headers: ['Structure', 'Brackets', 'Ordered', 'Changeable', 'Use for'],
        rows: [
          ['list', '[ ]', 'yes', 'yes', 'a sequence of items'],
          ['tuple', '( )', 'yes', 'no', 'fixed groups of values'],
          ['dict', '{k: v}', 'yes (insertion)', 'yes', 'look-up by key'],
          ['set', '{ }', 'no', 'yes', 'unique values, membership']
        ]
      },
      code: 'library = [\n    {"title": "Python Basics", "year": 2021},\n    {"title": "SQL Guide", "year": 2023},\n]\nfor book in library:\n    print(f"{book[\'title\']} ({book[\'year\']})")',
      note: 'A list of dictionaries (like rows of a table) is the most common way to hold records in Python.'
    })
  ],

  'py-mod-8': [
    py({
      heading: 'Strings and indexing',
      text: 'A string is a sequence of characters. Like lists, each character has an index starting at 0, and negative indexes count from the end.',
      code: 'word = "Python"\nprint(word[0], word[1], word[-1])\nprint(len(word))\nfor ch in word:\n    print(ch, end=" ")'
    }),
    py({
      heading: 'Slicing strings',
      text: 'text[start:stop] cuts out part of a string, exactly like list slicing.',
      code: 'email = "priya.das@gmail.com"\nprint(email[0:5])\nprint(email[:email.index("@")])      # before @\nprint(email[email.index("@") + 1:])  # after @\nprint(email[::-1])'
    }),
    py({
      heading: 'Strings cannot be changed',
      text: 'Strings are immutable: you cannot change one character in place. String methods always return a new string; store it if you want to keep it.',
      code: 'name = "arshith"\ntry:\n    name[0] = "A"\nexcept TypeError as e:\n    print("Error:", e)\nname = name.capitalize()     # make a new string\nprint(name)'
    }),
    py({
      heading: 'Useful string methods',
      text: 'These are the string methods you will use most. Remember: each one returns a new string and leaves the original unchanged.',
      table: {
        headers: ['Method', 'Example', 'Result'],
        rows: [
          ['upper() / lower()', '"Sql".upper()', 'SQL'],
          ['title()', '"priya das".title()', 'Priya Das'],
          ['strip()', '"  hi  ".strip()', 'hi'],
          ['replace(a, b)', '"a-b".replace("-", "+")', 'a+b'],
          ['startswith(x)', '"report.pdf".endswith(".pdf")', 'True'],
          ['count(x)', '"banana".count("a")', '3'],
          ['find(x)', '"banana".find("n")', '2 (-1 if not found)']
        ]
      },
      code: 'text = "  Learn Python at Arshith Bootcamp  "\nclean = text.strip()\nprint(clean.upper())\nprint(clean.replace("Python", "SQL"))\nprint(clean.count("a"), clean.find("Python"))\nprint(clean.startswith("Learn"))'
    }),
    py({
      heading: 'split() and join()',
      text: 'split() breaks a string into a list of words (or at any separator). join() does the opposite: it glues a list of strings together with a separator.',
      code: 'line = "Aarav,Engineering,98000"\nparts = line.split(",")\nprint(parts)\nname, dept, salary = parts\nprint(name, "earns", int(salary))\n\nwords = ["SQL", "is", "fun"]\nprint(" ".join(words))\nprint("-".join(words))'
    }),
    py({
      heading: 'Formatting numbers in f-strings',
      text: 'Inside {} you can add a format after a colon: number of decimals, thousands separators, width and alignment, percentages.',
      code: 'price = 1299.5\nrate = 0.183\nprint(f"Price: Rs {price:,.2f}")\nprint(f"Rate: {rate:.1%}")\nfor item, cost in [("Pen", 10), ("Laptop", 54999)]:\n    print(f"{item:<10}{cost:>8}")'
    }),
    py({
      heading: 'Checking what a string contains',
      text: 'Methods such as isdigit(), isalpha() and isspace() check the kind of characters; in checks for a piece of text. They are useful for validating user input.',
      code: 'for value in ["2024", "abc", "12a", "  "]:\n    print(repr(value), value.isdigit(), value.isalpha(), value.isspace())\nprint("@" in "user@mail.com")'
    }),
    py({
      heading: 'Parsing text: a real example',
      text: 'Text parsing means pulling useful data out of text. Here each log line is split into parts and counted per status code.',
      code: 'log = """GET /home 200\nGET /about 200\nPOST /login 401\nGET /missing 404\nGET /home 200"""\n\ncounts = {}\nfor line in log.splitlines():\n    method, path, status = line.split()\n    counts[status] = counts.get(status, 0) + 1\nprint(counts)\nprint("Errors:", sum(n for s, n in counts.items() if s.startswith("4")))'
    })
  ],

  'py-mod-9': [
    py({
      heading: 'Files: why and how',
      text: 'Variables disappear when a program ends. Files keep data permanently. To use a file you open it, read or write, and close it. The with statement closes the file for you automatically - always use it.',
      syntax: 'with open("file.txt", mode) as f:\n    ...',
      table: {
        headers: ['Mode', 'Meaning'],
        rows: [['"r"', 'read (default) - the file must exist'], ['"w"', 'write - creates the file, or empties it first'], ['"a"', 'append - add to the end'], ['"x"', 'create - error if the file exists']]
      },
      note: 'In the Practice Lab, files live in a temporary space inside your browser, so you can safely try every example.'
    }),
    py({
      heading: 'Writing a file',
      text: 'Open the file with "w" and use write(). write() does not add a new line by itself - add "\\n" yourself.',
      code: 'with open("notes.txt", "w") as f:\n    f.write("Line one\\n")\n    f.write("Line two\\n")\nprint("Saved.")\n\nwith open("notes.txt") as f:\n    print(f.read())'
    }),
    py({
      heading: 'Reading a file',
      text: 'read() gives the whole file as one string; readlines() gives a list of lines; looping over the file gives one line at a time, which also works for huge files.',
      code: 'with open("cities.txt", "w") as f:\n    f.write("Hyderabad\\nMumbai\\nPune\\n")\n\nwith open("cities.txt") as f:\n    for number, line in enumerate(f, start=1):\n        print(number, line.strip())',
      note: 'Each line ends with "\\n"; strip() removes it.'
    }),
    py({
      heading: 'Appending to a file',
      text: 'Mode "a" adds to the end without deleting what is already there - right for logs and diaries.',
      code: 'with open("log.txt", "w") as f:\n    f.write("started\\n")\nfor event in ["login", "upload", "logout"]:\n    with open("log.txt", "a") as f:\n        f.write(event + "\\n")\nwith open("log.txt") as f:\n    print(f.read())'
    }),
    py({
      heading: 'CSV files',
      text: 'CSV (comma-separated values) is the simplest table format; Excel can open it. The csv module reads and writes it correctly, even when values contain commas.',
      code: 'import csv\nrows = [["name", "marks"], ["Aarav", 87], ["Diya", 95], ["Kabir", 72]]\nwith open("marks.csv", "w", newline="") as f:\n    csv.writer(f).writerows(rows)\n\nwith open("marks.csv") as f:\n    for row in csv.DictReader(f):\n        print(row["name"], "->", int(row["marks"]) + 5)'
    }),
    py({
      heading: 'JSON files',
      text: 'JSON stores dictionaries and lists as text. It is the standard format for settings files and web APIs. json.dump() writes, json.load() reads it back as Python objects.',
      code: 'import json\nsettings = {"theme": "dark", "font_size": 14, "languages": ["Python", "SQL"]}\nwith open("settings.json", "w") as f:\n    json.dump(settings, f, indent=2)\n\nwith open("settings.json") as f:\n    loaded = json.load(f)\nprint(loaded["languages"])\nprint(open("settings.json").read())'
    }),
    py({
      heading: 'Paths and checking for files',
      text: 'The pathlib module works with file paths: check whether a file exists, get its name and extension, list a folder.',
      code: 'from pathlib import Path\np = Path("report.txt")\nprint(p.exists())\np.write_text("hello")\nprint(p.exists(), p.suffix, p.stem, p.stat().st_size, "bytes")\nfor f in sorted(Path(".").glob("*.txt")):\n    print("found", f.name)'
    }),
    py({
      heading: 'When a file is missing',
      text: 'Opening a file that does not exist raises FileNotFoundError. Handle it so the program can explain the problem instead of crashing.',
      code: 'try:\n    with open("does_not_exist.txt") as f:\n        print(f.read())\nexcept FileNotFoundError:\n    print("The file was not found - check the name and folder.")'
    })
  ],

  'py-mod-10': [
    py({
      heading: 'Two kinds of errors',
      text: 'Syntax errors are mistakes in how the code is written (a missing colon); Python finds them before running. Exceptions happen while the program runs (dividing by zero, a missing file). Exceptions can be caught and handled.',
      table: {
        headers: ['Exception', 'Example cause'],
        rows: [
          ['ZeroDivisionError', '10 / 0'],
          ['ValueError', 'int("abc")'],
          ['TypeError', '"5" + 5'],
          ['KeyError', 'student["phone"] when there is no such key'],
          ['IndexError', 'marks[10] in a list of 4'],
          ['FileNotFoundError', 'open("missing.txt")']
        ]
      }
    }),
    py({
      heading: 'try / except',
      text: 'Code that might fail goes in try. If an exception occurs, Python jumps to the matching except block; the program continues afterwards instead of crashing.',
      code: 'for value in ["10", "0", "abc"]:\n    try:\n        print(100 / int(value))\n    except ZeroDivisionError:\n        print("Cannot divide by zero")\n    except ValueError:\n        print(repr(value), "is not a number")'
    }),
    py({
      heading: 'else and finally',
      text: 'else runs only if no exception happened. finally always runs - error or not - and is used for clean-up such as closing connections.',
      syntax: 'try:\n    ...\nexcept SomeError:\n    ...\nelse:\n    ...   # no error\nfinally:\n    ...   # always',
      code: 'def divide(a, b):\n    try:\n        result = a / b\n    except ZeroDivisionError:\n        print("  error: division by zero")\n    else:\n        print("  result:", result)\n    finally:\n        print("  done with", a, "/", b)\n\ndivide(10, 2)\ndivide(5, 0)'
    }),
    py({
      heading: 'Getting the error message',
      text: 'except SomeError as e gives you the exception object; printing it shows Python\'s message. Exception catches almost all errors - use it carefully, and only at the top level of a program.',
      code: 'data = {"name": "Priya"}\ntry:\n    print(data["age"])\nexcept KeyError as e:\n    print("Missing key:", e)\n\ntry:\n    [1, 2, 3][10]\nexcept Exception as e:\n    print(type(e).__name__, "-", e)'
    }),
    py({
      heading: 'Raising your own exceptions',
      text: 'raise stops a function with an error when it gets bad input. This is better than returning a strange value that someone may not notice.',
      code: 'def set_age(age):\n    if age < 0:\n        raise ValueError("age cannot be negative")\n    return age\n\nprint(set_age(25))\ntry:\n    set_age(-3)\nexcept ValueError as e:\n    print("Rejected:", e)'
    }),
    py({
      heading: 'Custom exception classes',
      text: 'For your own program you can define an exception type by making a class that inherits from Exception. Callers can then catch exactly that problem.',
      code: 'class InsufficientFunds(Exception):\n    pass\n\ndef withdraw(balance, amount):\n    if amount > balance:\n        raise InsufficientFunds(f"need {amount}, have {balance}")\n    return balance - amount\n\ntry:\n    withdraw(500, 800)\nexcept InsufficientFunds as e:\n    print("Payment failed:", e)'
    }),
    py({
      heading: 'Reading a traceback',
      text: 'A traceback lists the function calls that led to the error, oldest first. Read it from the bottom: the last line is the error type and message, the line above shows the exact line of code.',
      code: 'import traceback\n\ndef average(values):\n    return sum(values) / len(values)\n\ntry:\n    average([])\nexcept ZeroDivisionError:\n    print(traceback.format_exc())',
      note: 'The cause here: an empty list has length 0. Bottom line first, then go up to find your own code.'
    }),
    py({
      heading: 'Debugging with print and assert',
      text: 'The simplest debugging tool is print(): show the values of variables at key points. assert checks something you believe must be true and stops with an error if it is not.',
      code: 'def apply_discount(price, percent):\n    assert 0 <= percent <= 100, "percent must be 0-100"\n    new_price = price * (1 - percent / 100)\n    print(f"DEBUG price={price} percent={percent} -> {new_price}")\n    return new_price\n\napply_discount(1000, 15)\ntry:\n    apply_discount(1000, 150)\nexcept AssertionError as e:\n    print("Bug caught:", e)'
    }),
    py({
      heading: 'Logging instead of print',
      text: 'In real programs, the logging module replaces debug prints. Each message has a level (DEBUG, INFO, WARNING, ERROR), and you choose which levels are shown without deleting lines.',
      code: 'import logging, sys\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", stream=sys.stdout)\n\nlogging.debug("not shown at INFO level")\nlogging.info("Program started")\nlogging.warning("Disk almost full")\nlogging.error("Could not connect to the database")'
    })
  ]
};
