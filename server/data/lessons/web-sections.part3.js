// Web Development - detailed step-by-step sections for modules 11-15 (see web-sections.part1.js).
// React examples load React from a CDN inside the live preview (pinned versions).
const html = (s) => ({ language: 'html', ...s });
const js = (s) => ({ language: 'javascript', ...s });
const text = (s) => ({ language: 'text', run: false, ...s });

const REACT = '<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>\n<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>\n<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>\n<div id="root"></div>\n<script type="text/babel">\n';
const react = (body) => `${REACT}${body}\n</script>`;

export default {
  'web-mod-11': [
    html({
      heading: 'What is React?',
      text: 'React is a JavaScript library for building user interfaces from small, reusable pieces called components. You describe what the screen should look like for the current data; when the data changes, React updates only the parts of the page that changed. Facebook, Instagram, Netflix and this website use React.',
      code: react('function App() {\n  return <h2>Hello from React!</h2>;\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);'),
      note: 'In real projects you create a React app with Vite (npm create vite@latest). These lessons load React directly in the page so you can try it instantly.'
    }),
    html({
      heading: 'JSX',
      text: 'JSX lets you write HTML-like tags inside JavaScript. A few differences: class becomes className, every tag must be closed (<img />), and {curly braces} put JavaScript values into the markup.',
      code: react('const name = "Priya";\nconst modules = 15;\nfunction App() {\n  return (\n    <div className="card">\n      <h3>Welcome, {name}!</h3>\n      <p>You have {modules - 6} modules left.</p>\n      <p>{modules > 10 ? "Long course" : "Short course"}</p>\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    html({
      heading: 'Components',
      text: 'A component is a function that returns JSX. Its name starts with a capital letter, and you use it like a tag. Build a page by combining small components.',
      code: react('function Header() {\n  return <h3 style={{ color: "#013A2B" }}>Arshith Bootcamp</h3>;\n}\nfunction Footer() {\n  return <small>© 2026 Arshith Group</small>;\n}\nfunction App() {\n  return (\n    <div>\n      <Header />\n      <p>Page content goes here.</p>\n      <Footer />\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    html({
      heading: 'Props: passing data to components',
      text: 'Props are like function arguments for components. The parent passes them as attributes; the child receives them as an object.',
      code: react('function CourseCard({ title, modules, price }) {\n  return (\n    <div style={{ border: "1px solid #ccc", borderRadius: 10, padding: 10, marginBottom: 8 }}>\n      <b>{title}</b> - {modules} modules - {price === 0 ? "Free" : "Rs " + price}\n    </div>\n  );\n}\nfunction App() {\n  return (\n    <div>\n      <CourseCard title="Python" modules={15} price={0} />\n      <CourseCard title="SQL" modules={15} price={99} />\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    html({
      heading: 'Rendering lists with map and key',
      text: 'To show a list, map an array to JSX elements. Each item needs a unique key so React can track it when the list changes.',
      code: react('const courses = [\n  { id: 1, title: "Python" },\n  { id: 2, title: "SQL" },\n  { id: 3, title: "Web Development" }\n];\nfunction App() {\n  return (\n    <ul>\n      {courses.map(c => <li key={c.id}>{c.title}</li>)}\n    </ul>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    html({
      heading: 'Conditional rendering',
      text: 'Show different JSX depending on the data: use the ternary operator, or && to show something only when a condition is true.',
      code: react('function Status({ loggedIn, unread }) {\n  return (\n    <div>\n      {loggedIn ? <p>Welcome back!</p> : <p>Please log in.</p>}\n      {unread > 0 && <p>You have {unread} new messages.</p>}\n    </div>\n  );\n}\nfunction App() {\n  return (\n    <div>\n      <Status loggedIn={true} unread={3} />\n      <hr />\n      <Status loggedIn={false} unread={0} />\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    html({
      heading: 'Handling events',
      text: 'Event handlers are passed as props in camelCase: onClick, onChange, onSubmit. Pass the function itself, not a call to it.',
      code: react('function App() {\n  const sayHello = () => alert("Hello!");\n  return (\n    <div>\n      <button onClick={sayHello}>Say hello</button>\n      <input onChange={e => console.log(e.target.value)} placeholder="Type (see console)" />\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);'),
      note: 'onClick={sayHello} is right; onClick={sayHello()} would run it immediately while rendering.'
    })
  ],

  'web-mod-12': [
    html({
      heading: 'State with useState',
      text: 'State is data that changes over time inside a component. useState returns the current value and a function to change it. Calling that function makes React re-render the component with the new value.',
      syntax: 'const [value, setValue] = useState(initialValue);',
      code: react('function Counter() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>+1</button>\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<Counter />);'),
      note: 'Never change state directly (count = count + 1). Always use the setter.'
    }),
    html({
      heading: 'Controlled forms',
      text: 'In a controlled input, the value comes from state and onChange updates the state. React then always knows the current input, so you can validate it or show it live.',
      code: react('function SignUp() {\n  const [email, setEmail] = React.useState("");\n  const valid = email.includes("@");\n  return (\n    <form onSubmit={e => { e.preventDefault(); alert("Signed up: " + email); }}>\n      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />\n      <button disabled={!valid}>Sign up</button>\n      <p>{email && !valid ? "Enter a valid email" : ""}</p>\n    </form>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<SignUp />);')
    }),
    html({
      heading: 'State with arrays: a to-do list',
      text: 'To change an array in state, build a new array (with spread, filter or map) and pass it to the setter.',
      code: react('function Todos() {\n  const [items, setItems] = React.useState(["Learn JSX"]);\n  const [text, setText] = React.useState("");\n  const add = () => { if (text.trim()) { setItems([...items, text]); setText(""); } };\n  return (\n    <div>\n      <input value={text} onChange={e => setText(e.target.value)} />\n      <button onClick={add}>Add</button>\n      <ul>{items.map((t, i) => (\n        <li key={i}>{t} <button onClick={() => setItems(items.filter((_, j) => j !== i))}>x</button></li>\n      ))}</ul>\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<Todos />);')
    }),
    html({
      heading: 'Side effects with useEffect',
      text: 'useEffect runs code after rendering: loading data, starting timers, changing the page title. The dependency array says when to run it again: [] means only once, [x] means whenever x changes. Return a function to clean up.',
      syntax: 'useEffect(() => {\n  // do something\n  return () => { /* clean up */ };\n}, [dependencies]);',
      code: react('function Clock() {\n  const [seconds, setSeconds] = React.useState(0);\n  React.useEffect(() => {\n    const id = setInterval(() => setSeconds(s => s + 1), 1000);\n    return () => clearInterval(id);   // clean up when the component goes away\n  }, []);\n  return <p>Page open for {seconds} seconds</p>;\n}\nReactDOM.createRoot(document.getElementById("root")).render(<Clock />);')
    }),
    html({
      heading: 'Loading data with useEffect',
      text: 'A common pattern: state for the data, loading and error; fetch inside useEffect; show something different for each case.',
      code: react('function Users() {\n  const [users, setUsers] = React.useState([]);\n  const [loading, setLoading] = React.useState(true);\n  React.useEffect(() => {\n    // a real app would call fetch("/api/users"); this example simulates it\n    setTimeout(() => { setUsers(["Aarav", "Diya", "Kabir"]); setLoading(false); }, 800);\n  }, []);\n  if (loading) return <p>Loading...</p>;\n  return <ul>{users.map(u => <li key={u}>{u}</li>)}</ul>;\n}\nReactDOM.createRoot(document.getElementById("root")).render(<Users />);')
    }),
    html({
      heading: 'Lifting state up',
      text: 'When two components need the same data, keep the state in their closest common parent and pass it down as props, together with functions to change it.',
      code: react('function Picker({ value, onChange }) {\n  return ["Python", "SQL", "Web"].map(c => (\n    <button key={c} onClick={() => onChange(c)} style={{ fontWeight: value === c ? "bold" : "normal" }}>{c}</button>\n  ));\n}\nfunction Summary({ value }) {\n  return <p>You picked: {value}</p>;\n}\nfunction App() {\n  const [course, setCourse] = React.useState("SQL");\n  return <div><Picker value={course} onChange={setCourse} /><Summary value={course} /></div>;\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);')
    }),
    js({
      heading: 'React Router: pages in a React app',
      text: 'React Router (npm install react-router-dom) shows different components for different URLs without reloading the page. <Link> changes the URL; useParams reads parts of it.',
      code: 'import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";\n\nfunction Course() {\n  const { id } = useParams();\n  return <h2>Course: {id}</h2>;\n}\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <nav><Link to="/">Home</Link> | <Link to="/course/sql">SQL</Link></nav>\n      <Routes>\n        <Route path="/" element={<h2>Home</h2>} />\n        <Route path="/course/:id" element={<Course />} />\n        <Route path="*" element={<h2>Page not found</h2>} />\n      </Routes>\n    </BrowserRouter>\n  );\n}',
      run: false,
      output: 'At /           -> Home\nAt /course/sql -> Course: sql\nAt /abc        -> Page not found'
    })
  ],

  'web-mod-13': [
    js({
      heading: 'What is Node.js?',
      text: 'Node.js runs JavaScript outside the browser - on your computer or a server. It is used to build web servers and APIs, command-line tools and build tools. The same language on the front end and the back end makes full-stack work easier.',
      code: 'console.log("Running on Node", process.version);\nconsole.log("Platform:", typeof process.platform);\nconsole.log(2 ** 10);'
    }),
    text({
      heading: 'npm and package.json',
      text: 'npm installs packages (libraries) into node_modules and records them in package.json. npm run runs the scripts defined there.',
      code: 'npm init -y              # create package.json\nnpm install express      # add a dependency\nnpm install -D nodemon   # add a development tool\nnpm run dev              # run the "dev" script'
    }),
    js({
      heading: 'Built-in modules: files and paths',
      text: 'Node has built-in modules such as fs (files), path and os. require() (or import) loads them.',
      code: 'const fs = require("fs");\nconst path = require("path");\nconst os = require("os");\n\nconst file = path.join(os.tmpdir(), "hello-node.txt");\nfs.writeFileSync(file, "Hello from Node\\n");\nconsole.log(fs.readFileSync(file, "utf8").trim());\nconsole.log("extension:", path.extname(file));\nfs.unlinkSync(file);'
    }),
    js({
      heading: 'A web server with the http module',
      text: 'Node can be a web server on its own: http.createServer() calls your function for every request, and you write the response.',
      code: 'const http = require("http");\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Hello from my server! You asked for " + req.url);\n});\n\nserver.listen(3000, () => console.log("Open http://localhost:3000"));',
      run: false,
      output: 'Open http://localhost:3000\n(browser at /about shows: Hello from my server! You asked for /about)'
    }),
    js({
      heading: 'Express: a first app',
      text: 'Express (npm install express) is the most popular Node web framework. You define routes: an HTTP method plus a path, and a function that sends the response.',
      code: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.send("Welcome to the API");\n});\n\napp.get("/api/courses", (req, res) => {\n  res.json([{ id: 1, title: "Python" }, { id: 2, title: "SQL" }]);\n});\n\napp.listen(3000, () => console.log("Server on http://localhost:3000"));',
      run: false,
      output: 'GET /             -> Welcome to the API\nGET /api/courses  -> [{"id":1,"title":"Python"},{"id":2,"title":"SQL"}]'
    }),
    js({
      heading: 'Route parameters and query strings',
      text: ':id in a path is a parameter, read from req.params. ?key=value parts are in req.query. Send 404 when something does not exist.',
      code: 'const courses = [{ id: 1, title: "Python", level: "beginner" }, { id: 2, title: "SQL", level: "beginner" }];\n\napp.get("/api/courses/:id", (req, res) => {\n  const course = courses.find(c => c.id === Number(req.params.id));\n  if (!course) return res.status(404).json({ message: "Course not found" });\n  res.json(course);\n});\n\napp.get("/api/search", (req, res) => {\n  const q = (req.query.q || "").toLowerCase();\n  res.json(courses.filter(c => c.title.toLowerCase().includes(q)));\n});',
      run: false,
      output: 'GET /api/courses/2      -> {"id":2,"title":"SQL","level":"beginner"}\nGET /api/courses/9      -> 404 {"message":"Course not found"}\nGET /api/search?q=py    -> [{"id":1,"title":"Python","level":"beginner"}]'
    }),
    js({
      heading: 'POST requests and middleware',
      text: 'Middleware are functions that run before your routes - for example express.json() reads JSON request bodies, and a logger prints every request. A POST route reads req.body, validates it and creates the item.',
      code: 'app.use(express.json());                       // parse JSON bodies\napp.use((req, res, next) => {                 // tiny logger\n  console.log(req.method, req.url);\n  next();\n});\n\napp.post("/api/courses", (req, res) => {\n  const { title } = req.body;\n  if (!title) return res.status(400).json({ message: "title is required" });\n  const course = { id: courses.length + 1, title };\n  courses.push(course);\n  res.status(201).json(course);\n});',
      run: false,
      output: 'POST /api/courses {"title":"React"} -> 201 {"id":3,"title":"React"}\nPOST /api/courses {}                -> 400 {"message":"title is required"}'
    }),
    js({
      heading: 'REST API design',
      text: 'A REST API uses URLs for things (nouns) and HTTP methods for actions, and answers with clear status codes.',
      code: 'GET    /api/courses       list courses           200\nGET    /api/courses/7     one course             200 / 404\nPOST   /api/courses       create a course        201 / 400\nPUT    /api/courses/7     replace a course       200 / 404\nDELETE /api/courses/7     delete a course        204 / 404',
      run: false,
      note: 'Keep URLs plural and lowercase, never put verbs in them (/api/getCourses), and always return JSON with a helpful message on errors.'
    })
  ],

  'web-mod-14': [
    js({
      heading: 'Connecting to a database',
      text: 'A back end stores data in a database. From Node you use a driver or an ORM: pg for PostgreSQL, mysql2 for MySQL, better-sqlite3 for SQLite, mongoose for MongoDB. Always use placeholders for values (SQL injection - see the SQL course, module 14).',
      code: 'const { Pool } = require("pg");\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });\n\napp.get("/api/courses/:id", async (req, res) => {\n  const { rows } = await pool.query("SELECT * FROM courses WHERE id = $1", [req.params.id]);\n  if (!rows.length) return res.status(404).json({ message: "Not found" });\n  res.json(rows[0]);\n});',
      run: false
    }),
    js({
      heading: 'Never store plain passwords: hashing',
      text: 'Passwords are stored as a hash - a one-way scrambled value with a random salt. At login you hash what the user typed and compare. Even if the database leaks, the passwords are not readable. Real apps use bcrypt or argon2; this example uses Node\'s built-in scrypt.',
      code: 'const crypto = require("crypto");\n\nfunction hashPassword(password) {\n  const salt = crypto.randomBytes(16).toString("hex");\n  const hash = crypto.scryptSync(password, salt, 32).toString("hex");\n  return `${salt}:${hash}`;\n}\nfunction checkPassword(password, stored) {\n  const [salt, hash] = stored.split(":");\n  return crypto.scryptSync(password, salt, 32).toString("hex") === hash;\n}\n\nconst stored = hashPassword("camp@2026");\nconsole.log("stored looks like:", stored.slice(0, 20) + "...");\nconsole.log("right password:", checkPassword("camp@2026", stored));\nconsole.log("wrong password:", checkPassword("guess123", stored));'
    }),
    js({
      heading: 'Login sessions with tokens (JWT)',
      text: 'After login, the server gives the browser a signed token (a JWT). The browser sends it with every request; the server checks the signature to know who is asking. Nobody can change the token without the server\'s secret. This example builds the signature by hand to show the idea; real apps use the jsonwebtoken package.',
      code: 'const crypto = require("crypto");\nconst SECRET = "server-secret";\nconst b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");\nconst sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");\n\nconst payload = b64({ sub: "priya@mail.com", role: "student" });\nconst token = payload + "." + sign(payload);\nconsole.log("token:", token.slice(0, 40) + "...");\n\nconst [p, s] = token.split(".");\nconsole.log("valid:", sign(p) === s);\nconst forged = b64({ sub: "priya@mail.com", role: "admin" });\nconsole.log("forged valid:", sign(forged) === s);'
    }),
    js({
      heading: 'Protecting routes',
      text: 'An authentication middleware checks the token before private routes run, and answers 401 when it is missing or invalid.',
      code: 'const jwt = require("jsonwebtoken");\n\nfunction requireLogin(req, res, next) {\n  const token = (req.headers.authorization || "").replace("Bearer ", "");\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(401).json({ message: "Please log in" });\n  }\n}\n\napp.get("/api/me", requireLogin, (req, res) => res.json(req.user));',
      run: false
    }),
    js({
      heading: 'Configuration and secrets: .env',
      text: 'Passwords, API keys and database addresses go in environment variables, usually loaded from a .env file that is listed in .gitignore. The code reads them from process.env.',
      code: '// .env (never committed)\n// DATABASE_URL=postgres://user:pass@host/db\n// JWT_SECRET=a-long-random-value\n\nconst port = process.env.PORT || 3000;\nconst secret = process.env.JWT_SECRET;\nconsole.log("port:", port);\nconsole.log("secret set:", Boolean(secret));'
    }),
    js({
      heading: 'CORS',
      text: 'Browsers block a page on one address from calling an API on another address unless the API allows it - this is CORS (Cross-Origin Resource Sharing). In Express, the cors package sets the allowed origins.',
      code: 'const cors = require("cors");\napp.use(cors({ origin: "https://arshithbootcamp.com" }));',
      run: false
    }),
    text({
      heading: 'Deployment',
      text: 'Deploying means putting your site on a server so everyone can use it. Static front ends (HTML, React builds) can go to Netlify, Vercel or GitHub Pages. Full-stack apps run on a VPS (like Hostinger) or platforms like Render and Railway.',
      code: '# A typical VPS deployment of a Node app\ngit pull                      # get the latest code\nnpm ci                        # install exact dependencies\nnpm run build                 # build the front end\npm2 restart my-app            # restart the server process\n# Nginx forwards https://yourdomain.com to the Node app; certbot adds HTTPS',
      note: 'Always use HTTPS, keep secrets in environment variables, and take a database backup before every big update.'
    })
  ],

  'web-mod-15': [
    {
      heading: 'Planning a project',
      text: 'Good projects start on paper. Write down who the users are, what they need to do, and the smallest version that is useful (the MVP). Then list the pages, the data and the API routes before writing code.',
      table: {
        headers: ['Step', 'Output'],
        rows: [
          ['1. Problem', 'One sentence: who, what, why'],
          ['2. Features', 'Must-have list for version 1'],
          ['3. Pages', 'Simple sketches (wireframes)'],
          ['4. Data', 'Tables / collections and their fields'],
          ['5. API', 'Routes with methods and responses'],
          ['6. Tasks', 'Small steps, each finished in a day or less']
        ]
      }
    },
    text({
      heading: 'Project structure',
      text: 'Keep a clear folder structure so anyone (including you later) can find things.',
      code: 'course-tracker/\n├── client/              React front end\n│   ├── src/components/\n│   ├── src/pages/\n│   └── package.json\n├── server/              Express API\n│   ├── routes/\n│   ├── models/\n│   └── index.js\n├── .gitignore\n├── .env.example         names of the settings, no real secrets\n└── README.md'
    }),
    text({
      heading: 'A good README',
      text: 'The README is the first thing recruiters and teammates read on GitHub. Explain what the project does, show a screenshot, list the tech stack and how to run it.',
      code: '# Course Tracker\n\nTrack your learning progress across courses.\n\n![Screenshot](docs/screenshot.png)\n\n## Features\n- Sign up and log in\n- Add courses and mark modules done\n- Progress chart\n\n## Tech\nReact, Express, PostgreSQL\n\n## Run locally\nnpm install\ncp .env.example .env\nnpm run dev\n\n## Live demo\nhttps://course-tracker.example.com'
    }),
    html({
      heading: 'A portfolio page',
      text: 'Your portfolio is a simple site that introduces you and links to your best projects. Keep it fast, clear and mobile friendly.',
      code: '<style>\n  body { margin: 0; }\n  .hero { background: #013A2B; color: #FBF8F1; padding: 24px; }\n  .projects { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 16px; }\n  .p { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }\n  .p a { color: #013A2B; font-weight: bold; }\n</style>\n<section class="hero">\n  <h1>Priya Das</h1>\n  <p>Full-stack developer - React, Node.js, SQL</p>\n</section>\n<section class="projects">\n  <div class="p"><h3>Course Tracker</h3><p>React + Express + PostgreSQL</p><a href="#">Live</a> · <a href="#">Code</a></div>\n  <div class="p"><h3>Weather App</h3><p>JavaScript + public API</p><a href="#">Live</a> · <a href="#">Code</a></div>\n  <div class="p"><h3>Shop Dashboard</h3><p>SQL reports + charts</p><a href="#">Live</a> · <a href="#">Code</a></div>\n</section>'
    }),
    {
      heading: 'Quality checklist before you publish',
      text: 'Check these before sharing a project link with anyone.',
      bulletPoints: [
        'Works on a phone (developer tools device toolbar) and in two browsers.',
        'No errors in the browser console.',
        'Every image has alt text, every input a label; the page works with the keyboard.',
        'Forms are validated on the server, not only in the browser.',
        'No secrets in the code or in the Git history.',
        'Lighthouse (in Chrome developer tools) scores above 90 for performance and accessibility.',
        'The README explains the project and has a live link.'
      ]
    },
    {
      heading: 'Capstone project ideas',
      text: 'Pick one project and finish it well rather than starting five. Each idea below uses everything from this course.',
      table: {
        headers: ['Project', 'Uses'],
        rows: [
          ['Course tracker', 'auth, CRUD API, progress charts'],
          ['Expense manager', 'forms, database, monthly reports'],
          ['Job board', 'search and filters, roles (employer / candidate)'],
          ['Recipe sharing site', 'image upload, comments, likes'],
          ['Event booking', 'dates, seat limits, email confirmation']
        ]
      },
      note: 'Open "Projects" on the course page for the official capstone briefs, and submit your GitHub repository there.'
    },
    {
      heading: 'Getting your first job',
      text: 'Recruiters look for proof that you can build things. Make that proof easy to find.',
      bulletPoints: [
        '2-3 complete, deployed projects with clean code and good READMEs.',
        'An active GitHub profile with regular commits.',
        'A one-page resume that links to your portfolio, GitHub and LinkedIn.',
        'Share your Arshith Bootcamp certificate on LinkedIn - the verify link proves it is real.',
        'Practise explaining one project end to end: the problem, your decisions and what you would improve.'
      ]
    }
  ]
};
