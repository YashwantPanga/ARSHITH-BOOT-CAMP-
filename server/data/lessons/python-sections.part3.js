// Python Programming - detailed step-by-step sections for modules 11-15 (see python-sections.part1.js).
const py = (s) => ({ language: 'python', ...s });

export default {
  'py-mod-11': [
    py({
      heading: 'Classes and objects',
      text: 'A class is a blueprint; an object is one thing built from it. The class Student describes what every student has (a name, marks) and can do; each actual student is an object of that class.',
      syntax: 'class ClassName:\n    ...\n\nobj = ClassName()',
      code: 'class Student:\n    pass\n\ns1 = Student()\ns1.name = "Priya"\ns2 = Student()\ns2.name = "Rahul"\nprint(s1.name, s2.name)\nprint(type(s1))'
    }),
    py({
      heading: 'The __init__ method',
      text: '__init__ runs automatically when an object is created. It sets up the object\'s starting data (attributes). self means "this object".',
      code: 'class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\na = Student("Aarav", 87)\nb = Student("Diya", 95)\nprint(a.name, a.marks)\nprint(b.name, b.marks)'
    }),
    py({
      heading: 'Methods',
      text: 'Methods are functions defined inside a class. They work on the object\'s own data through self.',
      code: 'class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount\n\n    def withdraw(self, amount):\n        if amount > self.balance:\n            print("Not enough money")\n            return\n        self.balance -= amount\n\nacc = BankAccount("Priya", 1000)\nacc.deposit(500)\nacc.withdraw(2000)\nacc.withdraw(300)\nprint(acc.owner, acc.balance)'
    }),
    py({
      heading: '__str__: a readable description',
      text: 'print(obj) normally shows something like <__main__.Student object at 0x...>. Define __str__ to return a friendly text instead.',
      code: 'class Product:\n    def __init__(self, name, price):\n        self.name = name\n        self.price = price\n\n    def __str__(self):\n        return f"{self.name} (Rs {self.price})"\n\np = Product("Ergo Chair", 329)\nprint(p)\nprint(f"Added to cart: {p}")'
    }),
    py({
      heading: 'Class attributes vs instance attributes',
      text: 'Instance attributes (self.x) belong to one object. Class attributes are written in the class body and shared by all objects - for example a counter or a fixed rate.',
      code: 'class Employee:\n    company = "Arshith Group"   # shared by all\n    count = 0\n\n    def __init__(self, name):\n        self.name = name          # one per object\n        Employee.count += 1\n\ne1 = Employee("Kabir")\ne2 = Employee("Meera")\nprint(e1.name, e1.company)\nprint(e2.name, e2.company)\nprint("Employees created:", Employee.count)'
    }),
    py({
      heading: 'Inheritance',
      text: 'A class can inherit from another: the child class gets all the parent\'s attributes and methods and can add or change some. It avoids copying code between similar classes.',
      syntax: 'class Child(Parent):\n    ...',
      code: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):\n    def speak(self):\n        return "Woof"\n\nclass Cat(Animal):\n    def speak(self):\n        return "Meow"\n\nfor pet in [Dog("Bruno"), Cat("Kitty")]:\n    print(pet.name, "says", pet.speak())'
    }),
    py({
      heading: 'super(): building on the parent',
      text: 'super() calls the parent\'s version of a method. In __init__ it lets the parent set up its part before the child adds its own attributes.',
      code: 'class Person:\n    def __init__(self, name):\n        self.name = name\n\nclass Teacher(Person):\n    def __init__(self, name, subject):\n        super().__init__(name)\n        self.subject = subject\n\nt = Teacher("Ananya", "SQL")\nprint(t.name, "teaches", t.subject)\nprint(isinstance(t, Person))'
    }),
    py({
      heading: 'Encapsulation: protecting data',
      text: 'An attribute that starts with _ is a signal: "internal, do not change it from outside". A @property lets outside code read a value like an attribute while the class controls how it is set.',
      code: 'class Thermostat:\n    def __init__(self):\n        self._celsius = 20\n\n    @property\n    def celsius(self):\n        return self._celsius\n\n    @celsius.setter\n    def celsius(self, value):\n        if not 10 <= value <= 30:\n            raise ValueError("choose 10-30")\n        self._celsius = value\n\nt = Thermostat()\nt.celsius = 24\nprint(t.celsius)\ntry:\n    t.celsius = 50\nexcept ValueError as e:\n    print("Rejected:", e)'
    })
  ],

  'py-mod-12': [
    py({
      heading: 'What are regular expressions?',
      text: 'A regular expression (regex) is a pattern for finding text: "a 10-digit number", "a word ending in ing", "an email address". Python\'s re module searches text with these patterns.',
      code: 'import re\ntext = "Call 98765 43210 or 91234 56789"\nprint(re.findall(r"\\d{5} \\d{5}", text))',
      note: 'Write patterns as raw strings r"..." so backslashes are kept exactly as typed.'
    }),
    py({
      heading: 'Basic pattern characters',
      text: 'Most characters match themselves. A few have special meanings:',
      table: {
        headers: ['Pattern', 'Matches'],
        rows: [
          ['\\d', 'a digit 0-9'],
          ['\\w', 'a letter, digit or _'],
          ['\\s', 'a space, tab or newline'],
          ['.', 'any character except newline'],
          ['[abc]', 'a, b or c'],
          ['[^0-9]', 'anything except a digit'],
          ['^ / $', 'start / end of the text']
        ]
      },
      code: 'import re\nprint(re.findall(r"\\d", "Room 4B, floor 12"))\nprint(re.findall(r"[A-Z]\\w+", "Aarav met Diya in Pune"))'
    }),
    py({
      heading: 'Repetition: * + ? {n}',
      text: 'Quantifiers say how many times the part before them repeats.',
      table: {
        headers: ['Quantifier', 'Means'],
        rows: [['*', '0 or more'], ['+', '1 or more'], ['?', '0 or 1 (optional)'], ['{3}', 'exactly 3'], ['{2,4}', '2 to 4']]
      },
      code: 'import re\nprint(re.findall(r"\\d+", "Order 1001 has 3 items worth 1548"))\nprint(re.findall(r"colou?r", "color and colour"))\nprint(re.findall(r"\\b\\w{4}\\b", "SQL and Java are easy to read"))'
    }),
    py({
      heading: 're.search and re.match',
      text: 're.search finds the first match anywhere in the text and returns a match object (or None). re.match only checks the very beginning. .group() gives the matched text.',
      code: 'import re\nm = re.search(r"\\d{6}", "Hyderabad 500081, Telangana")\nif m:\n    print("PIN code:", m.group(), "at position", m.start())\n\nprint(re.match(r"\\d+", "abc123"))     # None: does not start with digits'
    }),
    py({
      heading: 'Groups: pulling out parts',
      text: 'Brackets ( ) in a pattern make a group. After a match, each group gives one part - like splitting an email into user and domain.',
      code: 'import re\nm = re.search(r"([\\w.]+)@([\\w.]+)", "Contact: priya.das@gmail.com")\nprint(m.group(0))\nprint("user:", m.group(1))\nprint("domain:", m.group(2))\n\nfor name, marks in re.findall(r"(\\w+)=(\\d+)", "aarav=87, diya=95"):\n    print(name, int(marks))'
    }),
    py({
      heading: 're.sub: find and replace',
      text: 're.sub replaces every match of a pattern - for example hiding phone numbers or cleaning messy spaces.',
      code: 'import re\ntext = "Call 9876543210 now"\nprint(re.sub(r"\\d{6}(\\d{4})", r"XXXXXX\\1", text))\nprint(re.sub(r"\\s+", " ", "too    many     spaces"))'
    }),
    py({
      heading: 'Validating input',
      text: 're.fullmatch checks that the whole text matches a pattern - ideal for validating an email, a phone number or a password rule.',
      code: 'import re\nEMAIL = r"[\\w.+-]+@[\\w-]+\\.[\\w.]+"\nPHONE = r"[6-9]\\d{9}"\nfor value in ["a@b.com", "wrong@", "9876543210", "12345"]:\n    kind = "email" if re.fullmatch(EMAIL, value) else "phone" if re.fullmatch(PHONE, value) else "invalid"\n    print(value, "->", kind)'
    }),
    py({
      heading: 'Compiling and flags',
      text: 're.compile() prepares a pattern once for repeated use. Flags change behaviour: re.IGNORECASE ignores upper/lower case, re.MULTILINE makes ^ and $ work on each line.',
      code: 'import re\nerror_line = re.compile(r"^error:.*$", re.IGNORECASE | re.MULTILINE)\nlog = "INFO: start\\nERROR: disk full\\nWARNING: slow\\nError: retry failed"\nfor line in error_line.findall(log):\n    print(line)'
    })
  ],

  'py-mod-13': [
    py({
      heading: 'How the web works',
      text: 'When you open a web page, your browser (the client) sends an HTTP request to a server, and the server sends back a response: a status code, headers and the content (HTML, JSON, an image). Python programs can send the same requests.',
      table: {
        headers: ['Status', 'Meaning'],
        rows: [['200', 'OK'], ['301 / 302', 'moved - go to another address'], ['404', 'not found'], ['500', 'server error']]
      }
    }),
    py({
      heading: 'Reading a web page with urllib',
      text: 'urllib.request is built into Python. urlopen() fetches a URL; read() gives the bytes, decode() turns them into text.',
      syntax: 'from urllib.request import urlopen\nwith urlopen("https://example.com") as response:\n    print(response.status)\n    html = response.read().decode("utf-8")',
      code: 'from urllib.request import urlopen\n\nwith urlopen("https://example.com") as response:\n    print("Status:", response.status)\n    html = response.read().decode("utf-8")\nprint(html[:200])',
      run: false,
      output: 'Status: 200\n<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title> ...',
      note: 'This example needs the internet, so run it on your own computer. Browsers block most such requests from the Practice Lab.'
    }),
    py({
      heading: 'The requests library',
      text: 'requests (install with pip install requests) is the most popular way to make HTTP calls. It handles encodings, JSON and errors more conveniently than urllib.',
      code: 'import requests\n\nr = requests.get("https://api.github.com/users/python", timeout=10)\nprint(r.status_code)\ndata = r.json()\nprint(data["name"], "-", data["public_repos"], "repositories")',
      run: false,
      output: '200\nPython - 30 repositories   (the number changes over time)',
      note: 'Always pass a timeout so your program does not wait forever.'
    }),
    py({
      heading: 'Parsing HTML: finding links',
      text: 'Web scraping means pulling data out of a page\'s HTML. Python\'s built-in html.parser can walk through the tags; here it collects every link from a piece of HTML.',
      code: 'from html.parser import HTMLParser\n\nhtml = """<html><body>\n<h1>Courses</h1>\n<a href="/python">Python</a>\n<a href="/sql">SQL</a>\n<a href="https://example.com">Partner</a>\n</body></html>"""\n\nclass LinkFinder(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.links = []\n    def handle_starttag(self, tag, attrs):\n        if tag == "a":\n            self.links.append(dict(attrs)["href"])\n\nfinder = LinkFinder()\nfinder.feed(html)\nprint(finder.links)'
    }),
    py({
      heading: 'BeautifulSoup',
      text: 'BeautifulSoup (pip install beautifulsoup4) makes scraping much easier: find tags by name, class or id and read their text.',
      code: 'from bs4 import BeautifulSoup\n\nhtml = "<ul><li class=\'c\'>Python</li><li class=\'c\'>SQL</li></ul>"\nsoup = BeautifulSoup(html, "html.parser")\nfor li in soup.find_all("li", class_="c"):\n    print(li.get_text())',
      run: false,
      output: 'Python\nSQL',
      note: 'Scrape responsibly: follow the site\'s terms and robots.txt, do not overload servers, and never copy copyrighted content for reuse.'
    }),
    py({
      heading: 'Sockets: the layer under HTTP',
      text: 'A socket is a two-way connection between two programs over a network. HTTP is just text sent over a socket. This example opens a socket to a web server and sends a request by hand.',
      code: 'import socket\n\ns = socket.create_connection(("example.com", 80), timeout=10)\ns.sendall(b"GET / HTTP/1.1\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n")\nreply = s.recv(200).decode()\ns.close()\nprint(reply)',
      run: false,
      output: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=UTF-8\n...'
    }),
    py({
      heading: 'URLs and query strings',
      text: 'urllib.parse splits a URL into its parts and builds query strings safely (spaces and special characters are encoded for you).',
      code: 'from urllib.parse import urlparse, urlencode, parse_qs\n\nurl = "https://shop.example.com/search?q=standing+desk&page=2"\nparts = urlparse(url)\nprint(parts.scheme, parts.netloc, parts.path)\nprint(parse_qs(parts.query))\nprint("https://shop.example.com/search?" + urlencode({"q": "ergo chair", "page": 1}))'
    })
  ],

  'py-mod-14': [
    py({
      heading: 'Web services and APIs',
      text: 'A web service (API) is a website for programs: instead of HTML pages it returns data, usually as JSON. A weather app, a payment gateway and a maps app all talk to APIs. You send a request to an endpoint URL and read the data in the response.',
      table: {
        headers: ['HTTP method', 'Used to'],
        rows: [['GET', 'read data'], ['POST', 'create something'], ['PUT / PATCH', 'change something'], ['DELETE', 'delete something']]
      }
    }),
    py({
      heading: 'JSON text to Python: json.loads',
      text: 'An API response is JSON text. json.loads() turns it into Python dictionaries and lists that you can use directly.',
      code: 'import json\nresponse_text = \'{"city": "Hyderabad", "temp_c": 31.5, "forecast": ["sunny", "cloudy"]}\'\ndata = json.loads(response_text)\nprint(data["city"], data["temp_c"])\nprint("Tomorrow:", data["forecast"][1])\nprint(type(data))'
    }),
    py({
      heading: 'Python to JSON text: json.dumps',
      text: 'json.dumps() turns Python data into JSON text - what you send when you POST data to an API. indent makes it readable.',
      code: 'import json\norder = {"customer": "Priya", "items": [{"sku": "NB-01", "qty": 2}], "paid": True, "coupon": None}\nprint(json.dumps(order))\nprint(json.dumps(order, indent=2))',
      note: 'Python True/None become JSON true/null.'
    }),
    py({
      heading: 'Working with nested JSON',
      text: 'Real API responses are nested: dictionaries inside lists inside dictionaries. Go step by step with [ ] and loops, and use .get() for fields that may be missing.',
      code: 'import json\ntext = \'\'\'{"results": [\n  {"name": "Aarav", "skills": ["Python", "SQL"], "city": "Hyderabad"},\n  {"name": "Diya", "skills": ["React"]}\n]}\'\'\'\nfor person in json.loads(text)["results"]:\n    print(person["name"], "|", ", ".join(person["skills"]), "|", person.get("city", "unknown"))'
    }),
    py({
      heading: 'XML with ElementTree',
      text: 'Some older services use XML instead of JSON. xml.etree.ElementTree reads it: find() gets one element, findall() a list, .text the text inside, .get() an attribute.',
      code: 'import xml.etree.ElementTree as ET\nxml = """<library>\n  <book id="1"><title>Python Basics</title><year>2021</year></book>\n  <book id="2"><title>SQL Guide</title><year>2023</year></book>\n</library>"""\nroot = ET.fromstring(xml)\nfor book in root.findall("book"):\n    print(book.get("id"), book.find("title").text, book.find("year").text)'
    }),
    py({
      heading: 'Calling a REST API',
      text: 'With requests you send GET to read and POST to create. Check the status code before using the data; raise_for_status() raises an error for 4xx/5xx responses.',
      code: 'import requests\n\nr = requests.get("https://jsonplaceholder.typicode.com/todos/1", timeout=10)\nr.raise_for_status()\ntodo = r.json()\nprint(todo["title"], "| done:", todo["completed"])\n\nnew = requests.post("https://jsonplaceholder.typicode.com/posts",\n                    json={"title": "Hello", "body": "From Python", "userId": 1}, timeout=10)\nprint(new.status_code, new.json()["id"])',
      run: false,
      output: 'delectus aut autem | done: False\n201 101'
    }),
    py({
      heading: 'API keys and limits',
      text: 'Most APIs need a key to identify you, sent in a header or the URL. Keep keys secret: store them in environment variables, never in code you share. APIs also limit how many calls you may make, so cache results and handle 429 (too many requests).',
      code: 'import os\napi_key = os.environ.get("WEATHER_API_KEY", "not-set")\nheaders = {"Authorization": f"Bearer {api_key}"}\nprint("Header ready:", "Authorization" in headers)\nprint("Key loaded from the environment:", api_key != "not-set")'
    })
  ],

  'py-mod-15': [
    py({
      heading: 'SQLite from Python',
      text: 'Python includes sqlite3, so a program can store data in a real SQL database with no server. connect() opens (or creates) a database; ":memory:" makes a temporary one in memory.',
      syntax: 'import sqlite3\nconn = sqlite3.connect("shop.db")\ncur = conn.cursor()\ncur.execute("SQL")\nconn.commit()\nconn.close()',
      code: 'import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, marks INTEGER)")\nconn.execute("INSERT INTO students (name, marks) VALUES (\'Aarav\', 87)")\nconn.commit()\nprint(conn.execute("SELECT * FROM students").fetchall())\nconn.close()'
    }),
    py({
      heading: 'Inserting with parameters',
      text: 'Pass values with ? placeholders - never by building the SQL string yourself. This prevents SQL injection and handles quotes in names correctly. executemany() inserts a whole list at once.',
      code: 'import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE students (name TEXT, city TEXT, marks INTEGER)")\nrows = [("Aarav", "Hyderabad", 87), ("Diya", "Pune", 95), ("D\'Souza", "Goa", 72)]\nconn.executemany("INSERT INTO students VALUES (?, ?, ?)", rows)\nconn.commit()\nfor row in conn.execute("SELECT * FROM students WHERE marks > ?", (80,)):\n    print(row)'
    }),
    py({
      heading: 'Reading query results',
      text: 'fetchone() gives one row, fetchall() a list of rows; or loop over the cursor directly. Each row is a tuple. Setting row_factory = sqlite3.Row lets you read columns by name.',
      code: 'import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.row_factory = sqlite3.Row\nconn.executescript("""\nCREATE TABLE products (name TEXT, category TEXT, price REAL);\nINSERT INTO products VALUES (\'Laptop\', \'Electronics\', 1299), (\'Desk\', \'Furniture\', 499), (\'Chair\', \'Furniture\', 329);\n""")\nfor r in conn.execute("SELECT category, COUNT(*) AS n, AVG(price) AS avg FROM products GROUP BY category"):\n    print(r["category"], r["n"], round(r["avg"], 1))\nprint(conn.execute("SELECT MAX(price) FROM products").fetchone()[0])'
    }),
    py({
      heading: 'Updating and deleting',
      text: 'UPDATE and DELETE work like INSERT. cursor.rowcount tells how many rows changed. Remember conn.commit(), or the change is lost when the connection closes.',
      code: 'import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE stock (item TEXT, qty INTEGER)")\nconn.executemany("INSERT INTO stock VALUES (?, ?)", [("pen", 50), ("book", 0), ("bag", 12)])\ncur = conn.execute("UPDATE stock SET qty = qty - 5 WHERE item = ?", ("pen",))\nprint("updated", cur.rowcount)\ncur = conn.execute("DELETE FROM stock WHERE qty = 0")\nprint("deleted", cur.rowcount)\nconn.commit()\nprint(conn.execute("SELECT * FROM stock").fetchall())'
    }),
    py({
      heading: 'A line chart with matplotlib',
      text: 'matplotlib draws charts. plot() draws a line through points; title(), xlabel() and ylabel() label it. In the Practice Lab the chart appears under the output.',
      code: 'import matplotlib.pyplot as plt\nmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]\nsales = [120, 135, 160, 150, 190, 220]\nplt.figure(figsize=(6, 3.2))\nplt.plot(months, sales, marker="o", color="#013A2B")\nplt.title("Monthly sales")\nplt.xlabel("Month")\nplt.ylabel("Units sold")\nplt.grid(alpha=0.3)\nplt.show()\nprint("Best month:", months[sales.index(max(sales))])'
    }),
    py({
      heading: 'A bar chart from database data',
      text: 'A typical workflow: query the database, then chart the result. Here a GROUP BY result becomes a bar chart.',
      code: 'import sqlite3\nimport matplotlib.pyplot as plt\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE orders (city TEXT, amount REAL)")\nconn.executemany("INSERT INTO orders VALUES (?, ?)", [("Hyderabad", 1548), ("Mumbai", 499), ("Hyderabad", 249), ("Delhi", 1338), ("Pune", 329)])\nrows = conn.execute("SELECT city, SUM(amount) FROM orders GROUP BY city ORDER BY 2 DESC").fetchall()\ncities = [r[0] for r in rows]\ntotals = [r[1] for r in rows]\nplt.figure(figsize=(6, 3.2))\nplt.bar(cities, totals, color="#426557")\nplt.title("Revenue by city")\nplt.ylabel("Rs")\nplt.show()\nprint(rows)'
    }),
    py({
      heading: 'Saving a chart to a file',
      text: 'savefig() writes the chart to an image file (PNG, JPG, PDF) that you can put in a report or a presentation.',
      code: 'import matplotlib.pyplot as plt\nfrom pathlib import Path\nplt.figure(figsize=(4, 4))\nplt.pie([45, 30, 25], labels=["Python", "SQL", "Web"], autopct="%1.0f%%")\nplt.title("Course enrolments")\nplt.savefig("enrolments.png", dpi=100, bbox_inches="tight")\nprint("Saved:", Path("enrolments.png").exists())'
    })
  ]
};
