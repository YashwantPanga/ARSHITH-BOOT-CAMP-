// Web Development - detailed step-by-step sections for modules 6-10 (see web-sections.part1.js).
const html = (s) => ({ language: 'html', ...s });
const js = (s) => ({ language: 'javascript', ...s });
const text = (s) => ({ language: 'text', run: false, ...s });

export default {
  'web-mod-6': [
    html({
      heading: 'What is responsive design?',
      text: 'A responsive page adapts to every screen - phone, tablet, laptop, TV. More than half of all web visits are on phones, so a page must be readable there without zooming or scrolling sideways. The tools: the viewport meta tag, flexible units, flexbox/grid and media queries.',
      code: '<style>\n  .fluid { width: 100%; max-width: 500px; background: #E7F0EC; padding: 12px; }\n</style>\n<div class="fluid">I am 100% wide, but never wider than 500px. Resize the page to see.</div>'
    }),
    text({
      heading: 'The viewport meta tag',
      text: 'Without this line in <head>, phones pretend to be a 980px-wide screen and shrink the page into tiny text. Put it in every page.',
      code: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    }),
    html({
      heading: 'Media queries',
      text: 'A media query applies CSS only when a condition is true - most often a minimum or maximum screen width. The break points where the layout changes are called breakpoints.',
      syntax: '@media (min-width: 768px) {\n  /* rules for screens 768px and wider */\n}',
      code: '<style>\n  .banner { padding: 16px; color: white; background: #B45309; }\n  .banner::after { content: " - small screen"; }\n  @media (min-width: 500px) {\n    .banner { background: #013A2B; }\n    .banner::after { content: " - wide screen (500px+)"; }\n  }\n</style>\n<div class="banner">This box changes colour</div>',
      note: 'Click Try it and make the preview narrower and wider to watch the colour change.'
    }),
    html({
      heading: 'Mobile first',
      text: 'Write the basic CSS for small screens first, then add min-width media queries for bigger screens. Phones get the simple layout and download less CSS; bigger screens get the extras.',
      code: '<style>\n  .grid { display: grid; grid-template-columns: 1fr; gap: 8px; }\n  @media (min-width: 480px) { .grid { grid-template-columns: 1fr 1fr; } }\n  @media (min-width: 760px) { .grid { grid-template-columns: repeat(4, 1fr); } }\n  .grid div { background: #013A2B; color: white; padding: 14px; border-radius: 8px; }\n</style>\n<div class="grid"><div>A</div><div>B</div><div>C</div><div>D</div></div>'
    }),
    html({
      heading: 'Auto-fitting grids without media queries',
      text: 'repeat(auto-fit, minmax(150px, 1fr)) creates as many columns as fit, each at least 150px wide. It is responsive with a single line.',
      code: '<style>\n  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }\n  .cards div { background: #F1F5F3; border: 1px solid #C8D8D0; padding: 14px; border-radius: 10px; }\n</style>\n<div class="cards"><div>Python</div><div>SQL</div><div>Web</div><div>AI</div><div>Git</div></div>'
    }),
    html({
      heading: 'Responsive images',
      text: 'max-width: 100% stops images from overflowing small screens; height: auto keeps the shape. object-fit: cover fills a fixed box without stretching.',
      code: '<style>\n  img { max-width: 100%; height: auto; border-radius: 10px; }\n  .thumb { width: 160px; height: 100px; object-fit: cover; }\n</style>\n<img src="https://picsum.photos/id/1025/600/300" alt="A dog in a blanket">\n<img class="thumb" src="https://picsum.photos/id/1025/600/300" alt="Cropped thumbnail of the dog">'
    }),
    html({
      heading: 'Fluid text with clamp()',
      text: 'clamp(min, preferred, max) lets a size grow with the screen but stay within limits - great for headings.',
      code: '<style>\n  h1 { font-size: clamp(1.4rem, 5vw, 3rem); color: #013A2B; }\n</style>\n<h1>This heading scales with the screen</h1>'
    }),
    html({
      heading: 'A responsive navigation bar',
      text: 'On wide screens the links sit in a row; on narrow screens they stack. Real sites often switch to a "hamburger" menu with JavaScript (module 8).',
      code: '<style>\n  nav { display: flex; flex-direction: column; gap: 6px; background: #013A2B; padding: 10px; }\n  nav a { color: white; text-decoration: none; }\n  @media (min-width: 520px) { nav { flex-direction: row; justify-content: flex-end; gap: 18px; } }\n</style>\n<nav><a href="#">Home</a><a href="#">Courses</a><a href="#">About</a><a href="#">Contact</a></nav>'
    })
  ],

  'web-mod-7': [
    js({
      heading: 'What is JavaScript?',
      text: 'JavaScript is the programming language of the web. It runs in every browser and makes pages interactive: reacting to clicks, checking forms, loading data without reloading. With Node.js it also runs on servers. console.log() prints a value - in the browser it appears in the developer tools Console.',
      code: 'console.log("Hello from JavaScript!");\nconsole.log(2 + 3);\nconsole.log("Today is", new Date(2025, 0, 1).toDateString());'
    }),
    js({
      heading: 'Variables: let and const',
      text: 'const creates a variable that cannot be reassigned; let creates one that can change. Use const by default and let only when the value must change. Avoid the old var.',
      code: 'const course = "Web Development";\nlet completedModules = 6;\ncompletedModules = completedModules + 1;\nconsole.log(course, "-", completedModules, "modules done");\n\ntry {\n  course = "SQL";\n} catch (e) {\n  console.log("Error:", e.message);\n}'
    }),
    js({
      heading: 'Data types',
      text: 'JavaScript has numbers (whole and decimal are the same type), strings, booleans, null (empty on purpose), undefined (no value yet), objects and arrays. typeof shows the type.',
      code: 'console.log(typeof 42, typeof 3.5);\nconsole.log(typeof "text");\nconsole.log(typeof true);\nconsole.log(typeof undefined, typeof null);\nconsole.log(typeof { a: 1 }, Array.isArray([1, 2]));'
    }),
    js({
      heading: 'Strings and template literals',
      text: 'Strings use quotes. Template literals use backticks and can contain ${expressions} - the JavaScript version of Python\'s f-strings.',
      code: 'const name = "Diya";\nconst marks = 92;\nconsole.log(`${name} scored ${marks} marks (${marks >= 40 ? "pass" : "fail"})`);\nconsole.log(name.toUpperCase(), name.length, name.includes("iy"));\nconsole.log("a,b,c".split(","));'
    }),
    js({
      heading: 'Operators and comparison',
      text: 'Arithmetic works as expected. For comparison always use === and !== (strict): they check value and type. == converts types first and gives surprising results.',
      code: 'console.log(7 + 2, 7 - 2, 7 * 2, 7 / 2, 7 % 2, 2 ** 3);\nconsole.log(5 === 5, 5 === "5");\nconsole.log(5 == "5", 0 == "");   // surprising: avoid ==\nconsole.log(true && false, true || false, !true);'
    }),
    js({
      heading: 'if / else and the ternary operator',
      text: 'if runs code when a condition is true, else otherwise; else if adds more choices. The ternary operator condition ? a : b picks one of two values.',
      code: 'const marks = 78;\nlet grade;\nif (marks >= 90) {\n  grade = "A";\n} else if (marks >= 75) {\n  grade = "B";\n} else {\n  grade = "C";\n}\nconsole.log("Grade", grade);\nconsole.log(marks >= 40 ? "Passed" : "Failed");'
    }),
    js({
      heading: 'Loops',
      text: 'for repeats with a counter; for...of goes through the items of an array; while repeats while a condition is true.',
      code: 'for (let i = 1; i <= 3; i++) {\n  console.log("Round", i);\n}\nconst fruits = ["apple", "mango", "banana"];\nfor (const f of fruits) {\n  console.log("I like", f);\n}\nlet n = 10;\nwhile (n > 0) {\n  n -= 4;\n}\nconsole.log("n ended at", n);'
    }),
    js({
      heading: 'Functions',
      text: 'A function is reusable code. Write it with the function keyword or as an arrow function (=>). return sends the result back.',
      code: 'function area(length, width) {\n  return length * width;\n}\nconst withTax = (price, rate = 0.18) => Math.round(price * (1 + rate));\n\nconsole.log(area(4, 5));\nconsole.log(withTax(1000));\nconsole.log(withTax(1000, 0.05));'
    }),
    js({
      heading: 'Arrays',
      text: 'An array is an ordered list. Index from 0, length gives the size, push/pop add and remove at the end.',
      code: 'const cart = ["pen", "book"];\ncart.push("bag");\nconsole.log(cart, cart.length, cart[0]);\nconst last = cart.pop();\nconsole.log("removed", last, "->", cart);\nconsole.log(cart.includes("pen"), cart.indexOf("book"));'
    }),
    js({
      heading: 'Objects',
      text: 'An object groups related values as key: value pairs - the JavaScript version of a Python dictionary. Read values with dot notation or brackets.',
      code: 'const student = { name: "Priya", age: 21, skills: ["HTML", "CSS"] };\nconsole.log(student.name, student["age"]);\nstudent.city = "Kolkata";\nstudent.skills.push("JavaScript");\nconsole.log(student);\nfor (const [key, value] of Object.entries(student)) {\n  console.log(key, "=>", value);\n}'
    })
  ],

  'web-mod-8': [
    html({
      heading: 'What is the DOM?',
      text: 'When the browser loads HTML, it builds the DOM (Document Object Model): a tree of objects, one for every element. JavaScript reads and changes this tree, and the page updates immediately.',
      code: '<h2 id="title">Original title</h2>\n<script>\n  const h = document.getElementById("title");\n  h.textContent = "Changed by JavaScript";\n</script>'
    }),
    html({
      heading: 'Selecting elements',
      text: 'document.querySelector() finds the first element matching a CSS selector; querySelectorAll() finds all of them. getElementById() finds one element by its id.',
      code: '<ul>\n  <li class="lang">HTML</li>\n  <li class="lang">CSS</li>\n  <li class="lang">JavaScript</li>\n</ul>\n<p id="out"></p>\n<script>\n  const items = document.querySelectorAll(".lang");\n  document.querySelector("#out").textContent = "Found " + items.length + " items; the first is " + items[0].textContent;\n</script>'
    }),
    html({
      heading: 'Changing text, HTML and attributes',
      text: 'textContent sets plain text (safe). innerHTML sets HTML (never put user input in it). setAttribute and properties like src change attributes.',
      code: '<p id="msg"></p>\n<img id="pic" alt="random photo" width="200">\n<script>\n  document.getElementById("msg").innerHTML = "Hello <strong>student</strong>!";\n  const img = document.getElementById("pic");\n  img.src = "https://picsum.photos/id/1035/200/120";\n  img.setAttribute("title", "Loaded by JavaScript");\n</script>'
    }),
    html({
      heading: 'Changing styles and classes',
      text: 'element.style changes one CSS property. Better: define CSS classes and use classList.add / remove / toggle to switch them.',
      code: '<style> .dark { background: #013A2B; color: white; } .box { padding: 14px; border-radius: 10px; } </style>\n<div id="box" class="box">Click the button to switch theme</div>\n<button onclick="document.getElementById(\'box\').classList.toggle(\'dark\')">Toggle theme</button>'
    }),
    html({
      heading: 'Events: reacting to the user',
      text: 'addEventListener(event, function) runs a function when something happens: "click", "input", "submit", "keydown", "mouseover". The function receives an event object with details.',
      syntax: 'element.addEventListener("click", (event) => {\n  // runs on every click\n});',
      code: '<button id="btn">Clicked 0 times</button>\n<script>\n  let count = 0;\n  const btn = document.getElementById("btn");\n  btn.addEventListener("click", () => {\n    count++;\n    btn.textContent = `Clicked ${count} times`;\n  });\n</script>'
    }),
    html({
      heading: 'Reading input as the user types',
      text: 'The "input" event fires on every keystroke. Read the field\'s current text with .value.',
      code: '<input id="name" placeholder="Type your name">\n<p id="greeting">Hello, stranger!</p>\n<script>\n  document.getElementById("name").addEventListener("input", (e) => {\n    const v = e.target.value.trim();\n    document.getElementById("greeting").textContent = v ? `Hello, ${v}!` : "Hello, stranger!";\n  });\n</script>'
    }),
    html({
      heading: 'Creating and removing elements',
      text: 'document.createElement() makes a new element; append() adds it to the page; remove() deletes an element. This is how to-do lists and chat windows grow.',
      code: '<input id="task" placeholder="New task"> <button id="add">Add</button>\n<ul id="list"></ul>\n<script>\n  document.getElementById("add").addEventListener("click", () => {\n    const input = document.getElementById("task");\n    if (!input.value.trim()) return;\n    const li = document.createElement("li");\n    li.textContent = input.value + " ";\n    const del = document.createElement("button");\n    del.textContent = "x";\n    del.onclick = () => li.remove();\n    li.append(del);\n    document.getElementById("list").append(li);\n    input.value = "";\n  });\n</script>'
    }),
    html({
      heading: 'Forms: submit and preventDefault',
      text: 'A form\'s "submit" event fires when it is sent. event.preventDefault() stops the page from reloading, so JavaScript can check and use the data.',
      code: '<form id="f">\n  <input name="email" placeholder="Email">\n  <button>Subscribe</button>\n</form>\n<p id="result"></p>\n<script>\n  document.getElementById("f").addEventListener("submit", (e) => {\n    e.preventDefault();\n    const email = e.target.email.value;\n    document.getElementById("result").textContent = email.includes("@") ? `Subscribed: ${email}` : "Please enter a valid email";\n  });\n</script>'
    }),
    html({
      heading: 'Event delegation',
      text: 'Instead of adding a listener to every button, add one to their parent and check event.target. It also works for items added later.',
      code: '<div id="menu">\n  <button data-size="S">Small</button>\n  <button data-size="M">Medium</button>\n  <button data-size="L">Large</button>\n</div>\n<p id="chosen">Choose a size</p>\n<script>\n  document.getElementById("menu").addEventListener("click", (e) => {\n    if (e.target.matches("button")) {\n      document.getElementById("chosen").textContent = "Size: " + e.target.dataset.size;\n    }\n  });\n</script>'
    })
  ],

  'web-mod-9': [
    js({
      heading: 'map, filter and reduce',
      text: 'These array methods replace most loops. map transforms every item, filter keeps items that pass a test, reduce combines all items into one value.',
      code: 'const prices = [499, 1299, 249, 39];\nconst withTax = prices.map(p => Math.round(p * 1.18));\nconst expensive = prices.filter(p => p > 300);\nconst total = prices.reduce((sum, p) => sum + p, 0);\nconsole.log(withTax);\nconsole.log(expensive);\nconsole.log(total);'
    }),
    js({
      heading: 'find, some, every and sort',
      text: 'find returns the first matching item; some / every check if any / all items pass; sort orders an array (give it a compare function for numbers).',
      code: 'const students = [\n  { name: "Aarav", marks: 87 },\n  { name: "Diya", marks: 95 },\n  { name: "Kabir", marks: 58 }\n];\nconsole.log(students.find(s => s.marks > 90).name);\nconsole.log(students.some(s => s.marks < 60), students.every(s => s.marks >= 40));\nconst ranked = [...students].sort((a, b) => b.marks - a.marks);\nconsole.log(ranked.map(s => s.name));'
    }),
    js({
      heading: 'Destructuring and spread',
      text: 'Destructuring pulls values out of arrays and objects into variables in one line. The spread operator ... copies or merges arrays and objects.',
      code: 'const user = { name: "Priya", city: "Pune", age: 21 };\nconst { name, city } = user;\nconsole.log(name, city);\n\nconst [first, ...rest] = [10, 20, 30];\nconsole.log(first, rest);\n\nconst updated = { ...user, age: 22, course: "React" };\nconsole.log(updated);\nconsole.log([...[1, 2], ...[3, 4]]);'
    }),
    js({
      heading: 'Classes',
      text: 'Classes create objects with shared methods, just like Python classes. constructor sets up the data; extends inherits.',
      code: 'class Account {\n  constructor(owner, balance = 0) {\n    this.owner = owner;\n    this.balance = balance;\n  }\n  deposit(amount) {\n    this.balance += amount;\n    return this;\n  }\n}\nclass Savings extends Account {\n  addInterest(rate) {\n    return this.deposit(Math.round(this.balance * rate));\n  }\n}\nconst acc = new Savings("Diya", 1000);\nacc.deposit(500).addInterest(0.1);\nconsole.log(acc.owner, acc.balance);'
    }),
    js({
      heading: 'Closures',
      text: 'A function remembers the variables of the place where it was created, even after that place has finished. This is a closure - used for counters, private data and event handlers.',
      code: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst clicks = makeCounter();\nclicks();\nclicks();\nconsole.log("clicks:", clicks());\nconst other = makeCounter();\nconsole.log("other:", other());'
    }),
    js({
      heading: 'Asynchronous code and setTimeout',
      text: 'JavaScript does not wait for slow tasks (timers, network requests). It starts them, carries on, and runs a callback when they finish. That is why "later" prints last here.',
      code: 'console.log("first");\nsetTimeout(() => console.log("later (after 100 ms)"), 100);\nconsole.log("second");'
    }),
    js({
      heading: 'Promises and async / await',
      text: 'A Promise represents a result that will arrive later. async / await lets you write code that waits for it as if it were normal top-to-bottom code. Use try / catch for errors.',
      code: 'const wait = (ms, value) => new Promise(resolve => setTimeout(() => resolve(value), ms));\n\nasync function loadDashboard() {\n  console.log("loading...");\n  const user = await wait(50, { name: "Priya" });\n  const courses = await wait(50, ["SQL", "React"]);\n  console.log(`${user.name} has ${courses.length} courses`);\n}\nloadDashboard();'
    }),
    js({
      heading: 'fetch: calling an API',
      text: 'fetch() requests data from a URL and returns a Promise. await the response, check response.ok, then read the JSON.',
      code: 'async function getTodo() {\n  try {\n    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");\n    if (!response.ok) throw new Error("HTTP " + response.status);\n    const todo = await response.json();\n    console.log(todo.title, "| completed:", todo.completed);\n  } catch (err) {\n    console.log("Could not load:", err.message);\n  }\n}\ngetTodo();',
      run: false,
      output: 'delectus aut autem | completed: false'
    }),
    js({
      heading: 'Modules: import and export',
      text: 'Big programs are split into files. A file exports what others may use; other files import it. Browsers load modules with <script type="module">.',
      code: '// math.js\nexport const add = (a, b) => a + b;\nexport default function square(x) { return x * x; }\n\n// app.js\nimport square, { add } from "./math.js";\nconsole.log(add(2, 3), square(4));',
      run: false,
      output: '5 16'
    })
  ],

  'web-mod-10': [
    text({
      heading: 'What is Git?',
      text: 'Git is a version control system: it records snapshots (commits) of your project, so you can see what changed, go back to any earlier version and work with others without overwriting each other\'s work. GitHub is a website that stores Git projects (repositories) online.',
      code: 'git --version          # check that Git is installed\ngit config --global user.name  "Your Name"\ngit config --global user.email "you@example.com"'
    }),
    text({
      heading: 'Starting a repository',
      text: 'git init turns a folder into a repository. git status shows which files are new or changed - run it often.',
      code: 'mkdir my-portfolio\ncd my-portfolio\ngit init\ngit status',
      output: 'Initialized empty Git repository in .../my-portfolio/.git/\nOn branch main\nNo commits yet\nnothing to commit'
    }),
    text({
      heading: 'add and commit',
      text: 'Saving work is two steps: git add puts changes in the staging area (what goes into the next snapshot), and git commit saves the snapshot with a message describing the change.',
      code: 'git add index.html style.css     # stage two files\ngit add .                        # or: stage everything\ngit commit -m "Add home page and styles"',
      note: 'Write messages that say what and why: "Fix mobile menu overlap", not "update".'
    }),
    text({
      heading: 'History: log and diff',
      text: 'git log lists the commits; git diff shows exactly which lines changed and are not yet staged.',
      code: 'git log --oneline\ngit diff\ngit diff --staged      # changes already added',
      output: 'a3f9c21 Add contact form\n7b2e110 Add home page and styles'
    }),
    text({
      heading: 'Branches',
      text: 'A branch is a separate line of work. Create one for each feature, so the main branch always works. git switch moves between branches.',
      code: 'git switch -c feature/contact-form   # create and switch\n# ... edit files, add, commit ...\ngit switch main\ngit merge feature/contact-form       # bring the work into main\ngit branch -d feature/contact-form   # delete the finished branch'
    }),
    text({
      heading: 'Merge conflicts',
      text: 'If two branches changed the same lines, Git cannot choose and marks a conflict in the file. Edit the file to keep the right version, delete the markers, then add and commit.',
      code: '<<<<<<< HEAD\n<h1>Welcome to my site</h1>\n=======\n<h1>Hello, I am Priya</h1>\n>>>>>>> feature/new-title',
      note: 'Everything between <<<<<<< and ======= is your branch; between ======= and >>>>>>> the other branch.'
    }),
    text({
      heading: 'GitHub: push, pull and clone',
      text: 'Connect your repository to GitHub (a remote called origin), then push to upload commits and pull to download others\' commits. clone copies an existing repository to your computer.',
      code: 'git remote add origin https://github.com/your-name/my-portfolio.git\ngit push -u origin main      # first upload\ngit pull                     # get the latest changes\ngit clone https://github.com/someone/project.git'
    }),
    text({
      heading: 'Pull requests and .gitignore',
      text: 'On teams, you push a branch and open a pull request on GitHub: others review the changes before they are merged into main. A .gitignore file lists files Git must never store - secrets, dependencies and build output.',
      code: '# .gitignore\nnode_modules/\n.env\ndist/\n*.log',
      note: 'Never commit passwords or API keys. If you do by mistake, change the key immediately - deleting the commit is not enough.'
    })
  ]
};
