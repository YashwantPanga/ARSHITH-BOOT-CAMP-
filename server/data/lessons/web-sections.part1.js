// Web Development - detailed step-by-step sections for modules 1-5. HTML/CSS examples show a live
// preview on the lesson page; JavaScript examples show their console output (results.json).
const html = (s) => ({ language: 'html', ...s });
const text = (s) => ({ language: 'text', run: false, ...s });

export default {
  'web-mod-1': [
    {
      heading: 'How the web works',
      text: 'When you type an address into a browser, the browser (the client) asks a computer somewhere on the internet (the server) for a page. The server sends back files - HTML, CSS, JavaScript, images - and the browser turns them into the page you see. Every website works this way.',
      table: {
        headers: ['Step', 'What happens'],
        rows: [
          ['1', 'You enter arshithbootcamp.com'],
          ['2', 'DNS turns the name into the server\'s IP address (like a phone book)'],
          ['3', 'The browser sends an HTTP request to that server'],
          ['4', 'The server replies with HTML (status 200 OK)'],
          ['5', 'The browser reads the HTML and also downloads its CSS, JavaScript and images'],
          ['6', 'The page is drawn on screen; JavaScript makes it interactive']
        ]
      }
    },
    text({
      heading: 'URLs: the address of a page',
      text: 'A URL tells the browser exactly where a resource is. Each part has a job.',
      code: 'https://www.example.com:443/courses/sql?level=beginner#module-2\n\nhttps://          protocol (secure HTTP)\nwww.example.com   domain name\n:443              port (usually hidden)\n/courses/sql      path to the page\n?level=beginner   query string (extra data)\n#module-2         fragment (a spot on the page)'
    }),
    {
      heading: 'Front end and back end',
      text: 'The front end is everything that runs in the browser: HTML for structure, CSS for looks, JavaScript for behaviour. The back end runs on the server: it stores data in a database, checks logins and sends the right data to the front end. A full-stack developer works on both - this course covers both.',
      table: {
        headers: ['Layer', 'Languages / tools', 'Module'],
        rows: [
          ['Structure', 'HTML', '2, 3'],
          ['Style and layout', 'CSS', '4, 5, 6'],
          ['Behaviour', 'JavaScript', '7, 8, 9'],
          ['User interfaces', 'React', '11, 12'],
          ['Server and API', 'Node.js, Express', '13'],
          ['Data, login, hosting', 'Databases, authentication, deployment', '14']
        ]
      }
    },
    html({
      heading: 'Your first web page',
      text: 'An HTML file is plain text with tags in angle brackets. The browser reads the tags and shows formatted content. Below the example you see the live result - edit it with "Try it".',
      code: '<h1>Hello, Web!</h1>\n<p>This is my first web page.</p>\n<p>I am learning <strong>HTML</strong>, <em>CSS</em> and JavaScript.</p>'
    }),
    html({
      heading: 'HTML, CSS and JavaScript together',
      text: 'HTML gives the content, CSS makes it look good and JavaScript makes it react. Click the button in the preview.',
      code: '<style>\n  .card { padding: 16px; border-radius: 12px; background: #013A2B; color: #FBF8F1; max-width: 280px; }\n  button { margin-top: 8px; padding: 8px 14px; border: 0; border-radius: 8px; cursor: pointer; }\n</style>\n\n<div class="card">\n  <h2 id="title">Welcome</h2>\n  <button onclick="document.getElementById(\'title\').textContent = \'You clicked!\'">Click me</button>\n</div>'
    }),
    {
      heading: 'Browser developer tools',
      text: 'Every browser has built-in developer tools. Press F12 (or right-click a page and choose Inspect). You will use them every day.',
      bulletPoints: [
        'Elements: see and live-edit the HTML and CSS of any page.',
        'Console: see JavaScript errors and run JavaScript.',
        'Network: see every file the page downloads and how long it takes.',
        'Device toolbar: preview the page at phone and tablet sizes.'
      ],
      note: 'Try it now: open the developer tools on this page, click the Elements tab and hover over the code.'
    },
    text({
      heading: 'Tools you need',
      text: 'To build websites on your own computer you need a code editor and a browser. The most used editor is Visual Studio Code (free). The Live Server extension reloads the page every time you save.',
      code: 'my-website/\n├── index.html      the home page\n├── about.html      another page\n├── css/\n│   └── style.css   the styles\n├── js/\n│   └── app.js      the scripts\n└── images/\n    └── logo.png',
      note: 'Name the home page index.html - web servers open it automatically when someone visits the folder.'
    })
  ],

  'web-mod-2': [
    html({
      heading: 'The structure of an HTML document',
      text: 'Every page has the same skeleton. <!DOCTYPE html> says "this is HTML5". <head> holds information about the page (title, character set, CSS links); <body> holds everything visible.',
      syntax: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Page title</title>\n</head>\n<body>\n  visible content\n</body>\n</html>',
      code: '<!-- The body of a page: the skeleton around it is added automatically in this preview -->\n<h1>Arshith Bootcamp</h1>\n<p>Learn web development step by step.</p>',
      note: 'The <title> shows in the browser tab and in Google results.'
    }),
    html({
      heading: 'Elements, tags and attributes',
      text: 'An element is usually an opening tag, content and a closing tag: <p>Hello</p>. Attributes in the opening tag give extra information, written as name="value". Some elements, like <img> and <br>, have no closing tag.',
      code: '<p title="I am a tooltip">Hover over this paragraph.</p>\n<p>Line one<br>Line two (after a line break)</p>\n<hr>\n<p style="color: darkgreen;">An inline style attribute.</p>'
    }),
    html({
      heading: 'Headings and paragraphs',
      text: 'Headings go from <h1> (most important) to <h6>. Use one <h1> per page and keep the levels in order - search engines and screen readers rely on them. Paragraphs use <p>.',
      code: '<h1>Web Development</h1>\n<h2>Module 2: HTML</h2>\n<h3>Headings</h3>\n<p>Headings show the structure of the page.</p>\n<h3>Paragraphs</h3>\n<p>Each paragraph is a block of text.</p>'
    }),
    html({
      heading: 'Text formatting',
      text: 'Inline tags change the meaning or look of words inside a paragraph.',
      code: '<p><strong>Important</strong> text and <em>emphasised</em> text.</p>\n<p>Water is H<sub>2</sub>O and 10<sup>3</sup> is a thousand.</p>\n<p>Use <code>console.log()</code> to print in JavaScript.</p>\n<p><mark>Highlighted</mark>, <del>deleted</del> and <ins>inserted</ins> text.</p>',
      note: 'Use <strong> and <em> for meaning (important, emphasis), and CSS for pure decoration.'
    }),
    html({
      heading: 'Links',
      text: 'The <a> tag makes a link; href says where it goes. Links can open other sites, pages of your own site, a spot on the same page, an email or a phone call.',
      syntax: '<a href="address">link text</a>',
      code: '<p><a href="https://www.wikipedia.org" target="_blank" rel="noopener">Wikipedia (new tab)</a></p>\n<p><a href="#contact">Jump to contact</a></p>\n<p><a href="mailto:bootcamp@arshithgroup.com">Send an email</a></p>\n<p><a href="tel:+918217729744">Call us</a></p>\n<h3 id="contact">Contact</h3>',
      note: 'target="_blank" opens a new tab; add rel="noopener" for security.'
    }),
    html({
      heading: 'Images',
      text: '<img> shows a picture. src is the file address; alt is a text description for people who cannot see the image (and for Google). width and height reserve space so the page does not jump while loading.',
      syntax: '<img src="photo.jpg" alt="description" width="300" height="200">',
      code: '<img src="https://picsum.photos/id/1011/320/180" alt="A boat on a mountain lake" width="320" height="180">\n<p>Always describe the image in alt.</p>'
    }),
    html({
      heading: 'Lists',
      text: '<ul> is an unordered (bullet) list, <ol> an ordered (numbered) list; each item is an <li>. Lists can be nested.',
      code: '<h4>Ingredients</h4>\n<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript\n    <ul><li>DOM</li><li>Events</li></ul>\n  </li>\n</ul>\n<h4>Steps</h4>\n<ol>\n  <li>Plan the page</li>\n  <li>Write the HTML</li>\n  <li>Add the CSS</li>\n</ol>'
    }),
    html({
      heading: 'Tables',
      text: 'Tables show data in rows and columns: <table> holds rows <tr>; header cells are <th>, data cells <td>. Use tables for data, never for page layout.',
      code: '<table border="1" cellpadding="6" style="border-collapse: collapse;">\n  <caption>Course fees</caption>\n  <thead>\n    <tr><th>Course</th><th>Modules</th><th>Fee</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Python</td><td>15</td><td>Free / Rs 99</td></tr>\n    <tr><td>SQL</td><td>15</td><td>Rs 99</td></tr>\n  </tbody>\n</table>'
    }),
    html({
      heading: 'Semantic HTML5 elements',
      text: 'Semantic elements describe what a part of the page is: <header>, <nav>, <main>, <section>, <article>, <aside> and <footer>. They look like plain boxes, but help search engines, screen readers and other developers understand the page.',
      code: '<style>header, nav, main, footer { border: 1px dashed #426557; padding: 6px; margin: 4px 0; }</style>\n<header><strong>Arshith Bootcamp</strong></header>\n<nav><a href="#">Home</a> | <a href="#">Courses</a> | <a href="#">Contact</a></nav>\n<main>\n  <article>\n    <h2>Learn SQL</h2>\n    <p>15 modules with real examples.</p>\n  </article>\n</main>\n<footer>© 2026 Arshith Group</footer>',
      note: '<div> and <span> are the generic boxes with no meaning - use them only when no semantic element fits.'
    })
  ],

  'web-mod-3': [
    html({
      heading: 'The form element',
      text: 'A form collects data from the user. action is where the data is sent and method is how (GET puts it in the URL, POST sends it in the request body - use POST for passwords and personal data). Each field needs a name, which becomes the key of the data.',
      syntax: '<form action="/register" method="POST">\n  fields...\n  <button type="submit">Send</button>\n</form>',
      code: '<form onsubmit="event.preventDefault(); alert(\'Name: \' + this.fullname.value)">\n  <label for="fullname">Full name</label><br>\n  <input id="fullname" name="fullname" placeholder="Your name">\n  <button type="submit">Send</button>\n</form>',
      note: 'In the preview, the form shows the value instead of sending it anywhere.'
    }),
    html({
      heading: 'Labels',
      text: 'Every input needs a <label>. Connect them with for="id". Clicking the label then focuses the field, and screen readers read the label aloud.',
      code: '<label for="email">Email address</label><br>\n<input type="email" id="email" name="email"><br><br>\n<input type="checkbox" id="terms" name="terms">\n<label for="terms">I accept the terms (click this text)</label>'
    }),
    html({
      heading: 'Input types',
      text: 'The type attribute changes what the field accepts and which keyboard phones show.',
      code: '<style>label { display: block; margin-top: 6px; font-size: 14px; }</style>\n<label>Text <input type="text"></label>\n<label>Password <input type="password"></label>\n<label>Email <input type="email"></label>\n<label>Number <input type="number" min="1" max="10"></label>\n<label>Date <input type="date"></label>\n<label>Colour <input type="color" value="#013A2B"></label>\n<label>Range <input type="range" min="0" max="100"></label>\n<label>File <input type="file"></label>'
    }),
    html({
      heading: 'Choices: radio buttons, checkboxes and dropdowns',
      text: 'Radio buttons with the same name allow one choice; checkboxes allow several; <select> shows a dropdown list of <option>s.',
      code: '<p>Level:\n  <label><input type="radio" name="level" value="beginner" checked> Beginner</label>\n  <label><input type="radio" name="level" value="advanced"> Advanced</label>\n</p>\n<p>Interests:\n  <label><input type="checkbox" name="topics" value="sql"> SQL</label>\n  <label><input type="checkbox" name="topics" value="react"> React</label>\n</p>\n<label>City\n  <select name="city">\n    <option>Hyderabad</option>\n    <option>Mumbai</option>\n    <option>Pune</option>\n  </select>\n</label>\n<p><label>Message<br><textarea name="message" rows="3" cols="30"></textarea></label></p>'
    }),
    html({
      heading: 'Built-in validation',
      text: 'HTML can check input before the form is sent: required, minlength, maxlength, min, max and pattern. The browser shows a message when a rule fails. Press Register with empty fields to see it.',
      code: '<form onsubmit="event.preventDefault(); alert(\'All fields are valid!\')">\n  <p><input name="name" placeholder="Name (required)" required></p>\n  <p><input name="phone" placeholder="10-digit phone" pattern="[6-9][0-9]{9}" required></p>\n  <p><input type="password" placeholder="Password, 8+ characters" minlength="8" required></p>\n  <button>Register</button>\n</form>',
      note: 'Browser validation helps users, but anyone can bypass it. The server must always check the data again (module 13).'
    }),
    html({
      heading: 'Buttons',
      text: 'A <button> inside a form submits it by default. Use type="button" for buttons that only run JavaScript, and type="reset" to clear the form.',
      code: '<form onsubmit="event.preventDefault(); out.textContent = \'Submitted\'">\n  <input name="q" placeholder="Type something">\n  <button type="submit">Submit</button>\n  <button type="reset">Clear</button>\n  <button type="button" onclick="out.textContent = \'Just a click\'">Normal button</button>\n</form>\n<p id="out"></p>'
    }),
    html({
      heading: 'Audio and video',
      text: '<audio> and <video> play media without plugins. controls shows play/pause buttons; several <source> elements let the browser choose a format it supports.',
      code: '<video controls width="320" poster="https://picsum.photos/id/1015/320/180">\n  <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">\n  Your browser does not support video.\n</video>',
      note: 'Do not autoplay video with sound - browsers block it and users dislike it.'
    }),
    html({
      heading: 'Embedding other pages: iframe',
      text: '<iframe> shows another page inside yours - for example a YouTube video or a Google map. Give it a title for accessibility.',
      code: '<iframe width="320" height="180" src="https://www.youtube.com/embed/kqtD5dpn9C8" title="Python tutorial video" allowfullscreen style="border:0"></iframe>'
    })
  ],

  'web-mod-4': [
    html({
      heading: 'What CSS does',
      text: 'CSS (Cascading Style Sheets) controls how HTML looks: colours, fonts, spacing, sizes and layout. A CSS rule has a selector (which elements) and declarations (property: value;) inside braces.',
      syntax: 'selector {\n  property: value;\n  property: value;\n}',
      code: '<style>\n  h1 { color: #013A2B; font-family: Georgia, serif; }\n  p  { color: #426557; font-size: 18px; line-height: 1.6; }\n</style>\n<h1>Styled heading</h1>\n<p>This paragraph gets its colour, size and spacing from CSS.</p>'
    }),
    html({
      heading: 'Three ways to add CSS',
      text: 'Inline styles (style="...") affect one element; a <style> block affects one page; an external file (<link rel="stylesheet" href="style.css">) styles the whole site. Use external files in real projects.',
      syntax: '<link rel="stylesheet" href="css/style.css">   <!-- in <head> -->',
      code: '<style> .from-block { color: purple; } </style>\n<p style="color: crimson;">Inline style</p>\n<p class="from-block">Style from a &lt;style&gt; block</p>'
    }),
    html({
      heading: 'Selectors',
      text: 'Selectors choose which elements a rule applies to.',
      table: {
        headers: ['Selector', 'Selects'],
        rows: [
          ['p', 'every <p>'],
          ['.card', 'elements with class="card"'],
          ['#main', 'the element with id="main"'],
          ['nav a', 'every <a> inside a <nav>'],
          ['h1, h2', 'every h1 and every h2'],
          ['a:hover', 'a link while the mouse is over it'],
          ['input[type="email"]', 'email inputs only']
        ]
      },
      code: '<style>\n  .tag { background: #E7F0EC; padding: 2px 8px; border-radius: 99px; }\n  #special { font-weight: bold; color: #B45309; }\n  ul li { margin: 4px 0; }\n  a:hover { color: red; }\n</style>\n<ul>\n  <li><span class="tag">class selector</span></li>\n  <li id="special">id selector</li>\n  <li><a href="#">hover over me</a></li>\n</ul>'
    }),
    html({
      heading: 'Colours and backgrounds',
      text: 'Colours can be names (red), hex codes (#013A2B), rgb(1, 58, 43) or hsl(). rgba / hex with alpha add transparency. Backgrounds can be colours, gradients or images.',
      code: '<style>\n  .box { padding: 14px; margin: 6px 0; border-radius: 10px; color: white; }\n</style>\n<div class="box" style="background: #013A2B">hex #013A2B</div>\n<div class="box" style="background: rgb(66, 101, 87)">rgb(66, 101, 87)</div>\n<div class="box" style="background: rgba(1, 58, 43, 0.5); color: #013A2B">50% transparent</div>\n<div class="box" style="background: linear-gradient(90deg, #013A2B, #D9B44A)">gradient</div>'
    }),
    html({
      heading: 'The box model',
      text: 'Every element is a box made of four layers: content, padding (space inside the border), border, and margin (space outside). Setting box-sizing: border-box makes width include padding and border, which is much easier to work with.',
      code: '<style>\n  * { box-sizing: border-box; }\n  .box { width: 220px; padding: 20px; border: 6px solid #426557; margin: 16px; background: #F8F5EE; }\n</style>\n<div class="box">width 220px includes padding and border</div>',
      note: 'In the browser developer tools, the Computed tab draws the box model of the selected element.'
    }),
    html({
      heading: 'Text and fonts',
      text: 'font-family, font-size, font-weight, line-height, text-align, text-transform and letter-spacing control text. Load web fonts such as Google Fonts with a <link> in the head.',
      code: '<style>\n  .title { font-family: "Trebuchet MS", sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 1px; }\n  .lead { font-size: 18px; line-height: 1.7; text-align: justify; max-width: 360px; }\n  .caps { text-transform: uppercase; color: #426557; font-size: 12px; letter-spacing: 3px; }\n</style>\n<p class="caps">Module 4</p>\n<p class="title">Beautiful text</p>\n<p class="lead">Good line height and a limited line length make long text much easier to read on every screen.</p>'
    }),
    html({
      heading: 'Units: px, %, em, rem, vw',
      text: 'px is a fixed size. % is relative to the parent. em is relative to the element\'s font size, rem to the page\'s root font size (16px by default). vw / vh are percentages of the screen width / height. Use rem for font sizes and spacing so the page scales well.',
      code: '<style>\n  .a { width: 200px; } .b { width: 50%; } .c { width: 12rem; }\n  div { background: #E7F0EC; margin: 4px 0; padding: 4px; }\n</style>\n<div class="a">200px</div>\n<div class="b">50% of the parent</div>\n<div class="c">12rem (12 × 16px = 192px)</div>'
    }),
    html({
      heading: 'The cascade and specificity',
      text: 'When several rules set the same property, the more specific selector wins: inline style > #id > .class > element. If they are equally specific, the rule written last wins. That is the "cascading" in CSS.',
      code: '<style>\n  p { color: blue; }\n  .note { color: green; }\n  #first { color: red; }\n  p { color: orange; }   /* later, but less specific than .note */\n</style>\n<p id="first" class="note">id beats class: red</p>\n<p class="note">class beats element: green</p>\n<p>later element rule wins: orange</p>',
      note: 'Avoid !important - it makes styles hard to change later. Prefer clear class names.'
    }),
    html({
      heading: 'Pseudo-classes and transitions',
      text: 'Pseudo-classes style elements in a state: :hover, :focus, :first-child, :nth-child(). transition animates the change smoothly.',
      code: '<style>\n  .btn { padding: 10px 18px; border: 0; border-radius: 10px; background: #013A2B; color: white; transition: transform .2s, background .2s; cursor: pointer; }\n  .btn:hover { background: #426557; transform: translateY(-3px); }\n  input:focus { outline: 3px solid #D9B44A; }\n  li:nth-child(odd) { background: #F1F5F3; }\n</style>\n<button class="btn">Hover me</button>\n<p><input placeholder="Click into me"></p>\n<ul><li>one</li><li>two</li><li>three</li><li>four</li></ul>'
    })
  ],

  'web-mod-5': [
    html({
      heading: 'Block, inline and display',
      text: 'Block elements (div, p, h1) start on a new line and take the full width. Inline elements (span, a, strong) sit inside a line. The display property changes this, and display: flex and display: grid turn an element into a layout container.',
      code: '<style> span, div { border: 1px solid #426557; margin: 2px; padding: 2px; } </style>\n<div>div (block)</div><div>div (block)</div>\n<span>span (inline)</span><span>span (inline)</span>\n<span style="display:inline-block; width:120px">inline-block with width</span>'
    }),
    html({
      heading: 'Flexbox: a row of items',
      text: 'display: flex on a container lines its children up in a row (or a column). It is the easiest way to build navigation bars, card rows and to centre things.',
      syntax: '.container {\n  display: flex;\n  flex-direction: row | column;\n  gap: 12px;\n}',
      code: '<style>\n  .row { display: flex; gap: 10px; }\n  .row div { background: #013A2B; color: white; padding: 14px; border-radius: 8px; }\n</style>\n<div class="row">\n  <div>One</div><div>Two</div><div>Three</div>\n</div>'
    }),
    html({
      heading: 'justify-content and align-items',
      text: 'justify-content places items along the main direction (left/right in a row): flex-start, center, flex-end, space-between, space-around. align-items places them across it (top/bottom in a row).',
      code: '<style>\n  .bar { display: flex; justify-content: space-between; align-items: center; background: #F1F5F3; padding: 10px; height: 70px; }\n  .logo { font-weight: bold; }\n  .bar nav { display: flex; gap: 14px; }\n</style>\n<div class="bar">\n  <span class="logo">Arshith</span>\n  <nav><a href="#">Home</a><a href="#">Courses</a><a href="#">Login</a></nav>\n</div>'
    }),
    html({
      heading: 'Centring anything',
      text: 'With flexbox, centring horizontally and vertically takes three lines.',
      code: '<style>\n  .stage { display: flex; justify-content: center; align-items: center; height: 140px; background: #F8F5EE; border: 1px dashed #426557; }\n</style>\n<div class="stage"><button>Perfectly centred</button></div>'
    }),
    html({
      heading: 'flex-wrap and flexible sizes',
      text: 'flex-wrap: wrap lets items move to the next line when there is no room. flex: 1 makes items share the free space; flex: 1 1 150px means "grow and shrink, starting from 150px".',
      code: '<style>\n  .cards { display: flex; flex-wrap: wrap; gap: 10px; }\n  .card { flex: 1 1 140px; background: #E7F0EC; padding: 14px; border-radius: 10px; }\n</style>\n<div class="cards">\n  <div class="card">Python</div><div class="card">SQL</div>\n  <div class="card">Web</div><div class="card">AI</div>\n</div>',
      note: 'Make the preview narrower (or open it with Try it and resize) to watch the cards wrap.'
    }),
    html({
      heading: 'CSS Grid: rows and columns',
      text: 'display: grid places items into rows and columns. grid-template-columns sets the columns; fr means "a fraction of the free space".',
      syntax: '.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 12px;\n}',
      code: '<style>\n  .grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 8px; }\n  .grid div { background: #013A2B; color: white; padding: 12px; text-align: center; border-radius: 6px; }\n</style>\n<div class="grid">\n  <div>1fr</div><div>2fr (twice as wide)</div><div>1fr</div>\n  <div>4</div><div>5</div><div>6</div>\n</div>'
    }),
    html({
      heading: 'Spanning cells and grid areas',
      text: 'An item can span several columns or rows. grid-template-areas lets you draw the page layout with names - very readable for whole-page layouts.',
      code: '<style>\n  .page { display: grid; grid-template-columns: 120px 1fr; grid-template-areas: "head head" "side main" "foot foot"; gap: 6px; }\n  .page > * { padding: 10px; border-radius: 6px; background: #E7F0EC; }\n  header { grid-area: head; background: #013A2B; color: white; }\n  aside { grid-area: side; } main { grid-area: main; } footer { grid-area: foot; }\n</style>\n<div class="page">\n  <header>Header</header><aside>Sidebar</aside><main>Main content</main><footer>Footer</footer>\n</div>'
    }),
    html({
      heading: 'Flexbox or Grid?',
      text: 'Flexbox is for one direction - a row or a column of things (menus, toolbars, a row of buttons). Grid is for two directions - rows and columns at once (galleries, dashboards, page layouts). Real pages use both together.',
      code: '<style>\n  .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }\n  .item { display: flex; flex-direction: column; justify-content: space-between; height: 80px; background: #F1F5F3; padding: 8px; border-radius: 8px; }\n</style>\n<div class="gallery">\n  <div class="item"><b>Card 1</b><small>grid places it</small></div>\n  <div class="item"><b>Card 2</b><small>flex arranges inside</small></div>\n  <div class="item"><b>Card 3</b><small>both together</small></div>\n</div>'
    })
  ]
};
