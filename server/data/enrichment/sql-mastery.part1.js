// Additional learning content for SQL & Relational Databases, modules 1–5.
// SQL exercises run on the Practice Lab sample database (shared/sampleSchema.js, SQLite).
const PG = 'PostgreSQL Global Development Group';
const SQLITE = 'SQLite Consortium';

export default {
  'sql-mod-1': {
    skills: ['Explain tables, rows, columns and keys in plain language', 'Describe what happens when a query is sent to an RDBMS', 'Run a first SELECT against a real database'],
    prerequisites: ['Comfort with spreadsheets is helpful; no programming required'],
    intuition: {
      analogy: 'A relational database is a set of well-organised spreadsheets that know about each other. The orders sheet does not copy the customer\'s address; it stores the customer\'s ID and the database looks the address up when asked — like a library card number instead of rewriting your details on every loan slip.',
      whyItMatters: 'Almost every application — banking, e-commerce, college portals — stores its core data in a relational database. SQL is the common language to ask it questions, and it has stayed relevant for decades.'
    },
    workflow: {
      title: 'Life of a query inside an RDBMS',
      nodes: [
        { id: 'client', label: 'Client / application', detail: 'psql, a BI tool, or Python sends SQL text.', input: 'SQL text', output: 'Request over a connection' },
        { id: 'parser', label: 'Parser', detail: 'Checks syntax and resolves table/column names.', input: 'SQL text', output: 'Parse tree' },
        { id: 'planner', label: 'Planner / optimiser', detail: 'Chooses join order and whether to use indexes.', input: 'Parse tree + statistics', output: 'Execution plan' },
        { id: 'executor', label: 'Executor', detail: 'Runs the plan, reading pages from storage or cache.', input: 'Plan', output: 'Result rows' },
        { id: 'storage', label: 'Storage (tables, indexes)', detail: 'Data files on disk plus buffer cache in memory.', input: 'Page requests', output: 'Rows' },
        { id: 'result', label: 'Result set', detail: 'Rows and column names returned to the client.', input: 'Rows', output: 'Table of results' }
      ],
      edges: [
        { from: 'client', to: 'parser' }, { from: 'parser', to: 'planner' }, { from: 'planner', to: 'executor' },
        { from: 'executor', to: 'storage', label: 'read/write' }, { from: 'executor', to: 'result' }
      ],
      explanation: 'SQL is declarative: you describe the result, and the planner decides how to compute it. That is why the same query can become much faster after an index is added, without changing the SQL.'
    },
    workedExample: {
      title: 'Your first queries on the sample database',
      language: 'sql',
      code: 'SELECT dept_id, dept_name, location\nFROM departments\nORDER BY dept_id;',
      lineByLine: [
        { line: 1, explanation: 'SELECT lists the columns you want back.' },
        { line: 2, explanation: 'FROM names the table.' },
        { line: 3, explanation: 'ORDER BY makes the row order predictable; without it, order is not guaranteed.' }
      ],
      expectedOutput: 'dept_id | dept_name | location\n1 | Engineering | Hyderabad\n2 | Sales | Mumbai\n3 | Marketing | Bengaluru\n4 | Finance | Chennai',
      edgeCases: ['SQL keywords are case-insensitive, but string values are compared exactly (\'Sales\' is not \'sales\' in most databases).', 'Every statement should end with a semicolon when you send several at once.']
    },
    caseStudy: {
      title: 'Replacing a shared spreadsheet at a coaching centre',
      problem: 'Five staff edit one spreadsheet of students and payments. Copies diverge, a fee was recorded twice, and nobody can tell which version is correct.',
      data: 'About 2,000 students and 9,000 payment rows.',
      steps: ['Split the sheet into tables: students, courses and payments (payments reference student_id).', 'Load the data into PostgreSQL or SQLite.', 'Give staff SQL views or a small app instead of raw sheet access.', 'Answer "outstanding fees per course" with one GROUP BY query.'],
      result: 'One source of truth, no duplicate students, and reports that are recomputed from the data instead of copied by hand.',
      limitations: 'Moving to a database needs agreed column definitions and a little training; the next modules cover data types and constraints that enforce them.'
    },
    exercises: [
      {
        id: 'sql1-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Rows and columns',
        objective: 'Use relational vocabulary correctly.',
        problem: 'In the employees table, what is one employee such as Aarav Sharma, with all their details?',
        options: ['A column', 'A row (record)', 'A schema', 'A primary key'],
        hints: ['Columns describe attributes such as salary; each entity is stored once across those columns.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Each employee is one row (also called a record or tuple).', 'Columns such as salary are attributes shared by all rows.'],
        explanation: 'A primary key is the column (emp_id) that uniquely identifies each row.',
        mistakes: ['Confusing a row with the primary key value.'],
        challenge: 'Which column in employees links each row to a department?'
      },
      {
        id: 'sql1-e2', type: 'SQL query writing', difficulty: 'Beginner', language: 'sql',
        title: 'List the products',
        objective: 'Write a basic SELECT with ORDER BY.',
        problem: 'Return the name and price of every product, most expensive first.',
        starterCode: '-- columns: product_id, name, category, price\nSELECT \nFROM products\n;',
        hints: ['SELECT name, price FROM products', 'ORDER BY price DESC'],
        check: { type: 'rows', ordered: true, rows: [['Laptop Pro 14', 1299], ['Standing Desk', 499], ['Ergo Chair', 329], ['Noise-Cancel Headphones', 249], ['Python Crash Course', 39]] },
        solutionCode: 'SELECT name, price\nFROM products\nORDER BY price DESC;',
        solution: ['Select only the two requested columns.', 'Sort descending by price.'],
        explanation: 'Selecting only the columns you need is clearer and transfers less data than SELECT *.',
        mistakes: ['Forgetting DESC and getting the cheapest first.'],
        challenge: 'Show only Electronics products.'
      },
      {
        id: 'sql1-e3', type: 'Architecture interpretation', difficulty: 'Intermediate',
        title: 'Which stage decides to use an index?',
        objective: 'Map responsibilities to RDBMS components.',
        problem: 'Using the workflow diagram above, which component decides whether a query reads a table fully or uses an index?',
        options: ['Parser', 'Planner / optimiser', 'Client', 'Result set'],
        hints: ['It weighs alternatives using table statistics.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['The parser only validates the SQL and resolves names.', 'The planner compares possible plans (sequential scan, index scan, join orders) and picks the cheapest estimate.'],
        explanation: 'EXPLAIN shows the plan the planner chose (Module 13).',
        mistakes: ['Thinking the developer chooses indexes inside the SELECT statement.'],
        challenge: 'Run EXPLAIN QUERY PLAN SELECT * FROM employees WHERE emp_id = 101; in the Practice Lab.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql1-k1', question: 'Which SQL sub-language does CREATE TABLE belong to?', options: ['DML', 'DDL', 'DCL', 'TCL'], answer: 1, explanation: 'Data Definition Language defines structure.' },
      { id: 'sql1-k2', question: 'Why is SQL called declarative?', options: ['It declares variables', 'You state what you want, not how to get it', 'It only declares tables', 'It has no loops at all'], answer: 1, explanation: 'The engine decides the access path.' },
      { id: 'sql1-k3', question: 'Which is an embedded, serverless database?', options: ['PostgreSQL', 'SQLite', 'Oracle', 'SQL Server'], answer: 1, explanation: 'SQLite runs inside your application process and stores data in a single file.' }
    ],
    cheatSheet: ['SELECT cols FROM table ORDER BY col;', 'DDL: CREATE/ALTER/DROP · DML: INSERT/UPDATE/DELETE · DQL: SELECT', 'DCL: GRANT/REVOKE · TCL: BEGIN/COMMIT/ROLLBACK'],
    references: [
      { title: 'PostgreSQL Tutorial — Getting Started and The SQL Language', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html', publisher: PG },
      { title: 'PostgreSQL — Overview of PostgreSQL Internals (path of a query)', url: 'https://www.postgresql.org/docs/current/query-path.html', publisher: PG },
      { title: 'About SQLite', url: 'https://www.sqlite.org/about.html', publisher: SQLITE }
    ],
    next: 'Module 02 explains the syntax rules and data types every column must declare.'
  },

  'sql-mod-2': {
    skills: ['Pick appropriate numeric, text and date types', 'Quote identifiers and literals correctly', 'Explain why DECIMAL is used for money'],
    prerequisites: ['Module 01'],
    intuition: {
      analogy: 'Data types are like the shape of slots in a sorting tray: a coin slot rejects a key. Declaring price NUMERIC(10,2) means the database rejects "abc" and stores 19.99 exactly.',
      whyItMatters: 'Wrong types cause subtle bugs: floating-point money that loses paise, dates stored as text that sort incorrectly, or phone numbers stored as integers that lose leading zeros.'
    },
    workflow: {
      title: 'Choosing a column type',
      nodes: [
        { id: 'q', label: 'What is the value?', detail: 'Describe the real-world quantity.', input: 'Requirement', output: 'Category' },
        { id: 'int', label: 'Whole count → INTEGER / BIGINT', detail: 'Quantities, IDs.', input: 'Counts', output: 'Exact integers' },
        { id: 'dec', label: 'Money/exact → NUMERIC(p,s)', detail: 'Prices, balances.', input: 'Exact decimals', output: 'No rounding error' },
        { id: 'flt', label: 'Measurement → REAL / DOUBLE', detail: 'Sensor readings, scientific data.', input: 'Approximate values', output: 'Fast, approximate' },
        { id: 'txt', label: 'Text → VARCHAR(n) / TEXT', detail: 'Names, codes, phone numbers.', input: 'Characters', output: 'Strings' },
        { id: 'time', label: 'Moments → DATE / TIMESTAMP', detail: 'Use timestamptz for events across time zones.', input: 'Dates/times', output: 'Sortable, comparable dates' }
      ],
      edges: [
        { from: 'q', to: 'int', label: 'count' }, { from: 'q', to: 'dec', label: 'money' }, { from: 'q', to: 'flt', label: 'measured' },
        { from: 'q', to: 'txt', label: 'label/code' }, { from: 'q', to: 'time', label: 'when' }
      ],
      explanation: 'Phone numbers and PIN codes are text even though they contain digits: you never do arithmetic on them and leading zeros matter.'
    },
    workedExample: {
      title: 'Literals, casting and type behaviour',
      language: 'sql',
      code: "SELECT 7 / 2 AS int_div,\n       7 / 2.0 AS real_div,\n       CAST('42' AS INTEGER) + 1 AS casted,\n       'It''s' AS escaped_quote,\n       typeof(0.1 + 0.2) AS sum_type;",
      lineByLine: [
        { line: 1, explanation: 'Integer division truncates in SQLite and PostgreSQL: 3.' },
        { line: 2, explanation: 'One decimal operand makes it a real division: 3.5.' },
        { line: 3, explanation: 'CAST converts text to a number before adding.' },
        { line: 4, explanation: 'A single quote inside a string literal is written twice.' },
        { line: 5, explanation: 'typeof is SQLite-specific; it shows 0.1 + 0.2 is a floating-point "real".' }
      ],
      expectedOutput: "int_div | real_div | casted | escaped_quote | sum_type\n3 | 3.5 | 43 | It's | real",
      edgeCases: ['Double quotes are for identifiers ("Order Date"), single quotes for string values — mixing them up is a frequent error in PostgreSQL.', 'SQLite uses flexible "type affinity"; PostgreSQL enforces declared types strictly.']
    },
    caseStudy: {
      title: 'Fixing lost paise in a wallet app',
      problem: 'Balances stored as FLOAT occasionally show values such as 99.99999 after many small top-ups.',
      data: 'A wallet table with balance FLOAT and millions of transactions.',
      steps: ['Add a new column balance_new NUMERIC(12,2).', 'Recompute balances from the transaction history using NUMERIC arithmetic.', 'Swap the columns in a migration and update application code to send strings/decimals, not floats.'],
      result: 'Balances are exact to the paisa and reconciliation reports match the bank statement.',
      limitations: 'NUMERIC arithmetic is slower than floating point; that is an acceptable trade-off for money.'
    },
    exercises: [
      {
        id: 'sql2-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Type for a mobile number',
        objective: 'Choose a type by meaning, not appearance.',
        problem: 'Which type is best for storing Indian mobile numbers such as 09876543210?',
        options: ['INTEGER', 'REAL', 'VARCHAR(15)', 'NUMERIC(10,0)'],
        hints: ['Would you ever add two phone numbers?', 'The leading zero must be kept.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Numeric types drop the leading zero and invite meaningless arithmetic.', 'VARCHAR keeps the value exactly as entered (validate the format separately).'],
        explanation: 'Store identifiers made of digits (PIN, phone, Aadhaar) as text.',
        mistakes: ['Choosing INTEGER because the value "looks numeric".'],
        challenge: 'Add a CHECK constraint that allows only digits and an optional leading +.'
      },
      {
        id: 'sql2-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Integer division',
        objective: 'Predict division results by operand type.',
        problem: 'In SQLite or PostgreSQL, what does SELECT 9 / 4; return?',
        hints: ['Both operands are integers.'],
        check: { type: 'numeric', answer: 2, tolerance: 0 },
        solution: ['Integer / integer performs integer division.', '9 / 4 = 2 (the .25 is discarded).'],
        explanation: 'Write 9 / 4.0 or CAST(9 AS NUMERIC) / 4 to get 2.25.',
        mistakes: ['Expecting 2.25 as in Python 3.'],
        challenge: 'Compute the average price of products with a guaranteed decimal result.'
      },
      {
        id: 'sql2-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Format salaries',
        objective: 'Use arithmetic, ROUND and column aliases.',
        problem: 'For employees in department 1, return first_name and the monthly salary (salary / 12) rounded to 2 decimals as monthly, ordered by first_name.',
        starterCode: 'SELECT first_name, \nFROM employees\nWHERE dept_id = 1\nORDER BY first_name;',
        hints: ['ROUND(salary / 12.0, 2) AS monthly'],
        check: { type: 'rows', ordered: true, rows: [['Aarav', 8166.67], ['Diya', 7250], ['Vihaan', 6583.33]] },
        solutionCode: 'SELECT first_name, ROUND(salary / 12.0, 2) AS monthly\nFROM employees\nWHERE dept_id = 1\nORDER BY first_name;',
        solution: ['Divide by 12.0 so the division is not truncated.', 'ROUND(…, 2) keeps two decimals.', 'AS gives the computed column a readable name.'],
        explanation: '98000 / 12 = 8166.666… → 8166.67; 87000 / 12 = 7250; 79000 / 12 = 6583.33.',
        mistakes: ['Forgetting the alias, which leaves an unreadable column name.'],
        challenge: 'Also show the annual salary formatted with a currency prefix using string concatenation (||).'
      }
    ],
    knowledgeCheck: [
      { id: 'sql2-k1', question: 'Which type stores money exactly?', options: ['FLOAT', 'REAL', 'NUMERIC(10,2)', 'TEXT'], answer: 2, explanation: 'NUMERIC/DECIMAL is exact.' },
      { id: 'sql2-k2', question: 'How do you write the string O\'Brien as a SQL literal?', options: ["'O\\'Brien'", "'O''Brien'", '"O\'Brien"', 'O`Brien'], answer: 1, explanation: 'Double the single quote inside the literal.' },
      { id: 'sql2-k3', question: 'Which type is best for an event that happened at a specific instant across time zones (PostgreSQL)?', options: ['DATE', 'TIME', 'TIMESTAMPTZ', 'VARCHAR'], answer: 2, explanation: 'timestamp with time zone stores an absolute instant.' }
    ],
    cheatSheet: ['INTEGER, BIGINT, NUMERIC(p,s), REAL', 'VARCHAR(n), TEXT, BOOLEAN, DATE, TIMESTAMPTZ', "'string' vs \"Identifier\"; '' escapes a quote", 'CAST(x AS type) or x::type (PostgreSQL)'],
    references: [
      { title: 'PostgreSQL — Data Types', url: 'https://www.postgresql.org/docs/current/datatype.html', publisher: PG },
      { title: 'PostgreSQL — Lexical Structure (identifiers and constants)', url: 'https://www.postgresql.org/docs/current/sql-syntax-lexical.html', publisher: PG },
      { title: 'Datatypes In SQLite', url: 'https://www.sqlite.org/datatype3.html', publisher: SQLITE }
    ],
    next: 'Module 03 uses these types to create tables with DDL.'
  },

  'sql-mod-3': {
    skills: ['Write CREATE TABLE statements with sensible types', 'Change a table safely with ALTER TABLE', 'Explain the risks of DROP and TRUNCATE'],
    prerequisites: ['Data types (Module 02)'],
    intuition: {
      analogy: 'DDL is the architect\'s blueprint; DML is the furniture moved in later. Changing the blueprint of an occupied building (ALTER TABLE on a large table) needs planning so residents are not locked out.',
      whyItMatters: 'Good table design makes queries simple and prevents bad data at the source; careless DROP or ALTER statements are among the most damaging mistakes in production.'
    },
    workflow: {
      title: 'Evolving a schema safely',
      nodes: [
        { id: 'design', label: 'Design', detail: 'Decide entities, columns, types and keys.', input: 'Requirements', output: 'Table plan' },
        { id: 'create', label: 'CREATE TABLE', detail: 'Create the structure in a migration script.', input: 'Table plan', output: 'Empty table' },
        { id: 'load', label: 'Load data', detail: 'INSERT or COPY the initial data.', input: 'Source data', output: 'Populated table' },
        { id: 'alter', label: 'ALTER TABLE', detail: 'Add columns with defaults; rename or retype carefully.', input: 'New requirement', output: 'Updated structure' },
        { id: 'verify', label: 'Verify & back up', detail: 'Check row counts and constraints before and after.', input: 'Changed schema', output: 'Confidence to deploy' }
      ],
      edges: [{ from: 'design', to: 'create' }, { from: 'create', to: 'load' }, { from: 'load', to: 'alter' }, { from: 'alter', to: 'verify' }, { from: 'verify', to: 'alter', label: 'next change' }],
      explanation: 'Schema changes are code: keep them in versioned migration files so every environment (dev, test, production) is changed the same way.'
    },
    workedExample: {
      title: 'Create, alter and inspect a table',
      language: 'sql',
      code: "CREATE TABLE courses (\n  course_id INTEGER PRIMARY KEY,\n  title     TEXT NOT NULL,\n  fee       NUMERIC(8,2) DEFAULT 0\n);\nINSERT INTO courses (title, fee) VALUES ('Python', 4999), ('SQL', 3999);\nALTER TABLE courses ADD COLUMN level TEXT DEFAULT 'Beginner';\nSELECT course_id, title, fee, level FROM courses ORDER BY course_id;",
      lineByLine: [
        { line: 2, explanation: 'INTEGER PRIMARY KEY auto-assigns ids in SQLite (SERIAL/IDENTITY in PostgreSQL).' },
        { line: 3, explanation: 'NOT NULL forbids missing titles.' },
        { line: 6, explanation: 'Only title and fee are given; course_id is generated.' },
        { line: 7, explanation: 'Adding a column with a DEFAULT fills existing rows.' }
      ],
      expectedOutput: 'course_id | title | fee | level\n1 | Python | 4999 | Beginner\n2 | SQL | 3999 | Beginner',
      edgeCases: ['DROP TABLE removes structure and data permanently (no undo outside a transaction/backup).', 'TRUNCATE empties a table quickly but bypasses row-level triggers in many databases.']
    },
    caseStudy: {
      title: 'Adding GST to an existing products table',
      problem: 'Finance asks for a gst_rate on every product without downtime on a table with millions of rows.',
      data: 'products(product_id, name, price) in PostgreSQL.',
      steps: ['ALTER TABLE products ADD COLUMN gst_rate NUMERIC(4,2) DEFAULT 18.00; — fast in modern PostgreSQL because the default is stored as metadata.', 'Update exceptions (books at 0%) in batches.', 'Add a CHECK (gst_rate BETWEEN 0 AND 28) once data is clean.'],
      result: 'The column appears immediately for all rows; exceptions are corrected without long locks.',
      limitations: 'Changing a column\'s type usually rewrites the table — schedule it or use a new column and backfill.'
    },
    exercises: [
      {
        id: 'sql3-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which statement removes everything?',
        objective: 'Distinguish DROP, TRUNCATE and DELETE.',
        problem: 'Which statement removes the table structure itself, not just its rows?',
        options: ['DELETE FROM t;', 'TRUNCATE TABLE t;', 'DROP TABLE t;', 'ALTER TABLE t DROP COLUMN c;'],
        hints: ['Only one statement makes the table name disappear.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['DELETE and TRUNCATE remove rows but keep the table.', 'DROP TABLE removes the table definition, its data and its indexes.'],
        explanation: 'Use DROP TABLE IF EXISTS in scripts that may run more than once.',
        mistakes: ['Running DROP when only stale rows needed deleting.'],
        challenge: 'Write a statement that removes only rows older than 2023.'
      },
      {
        id: 'sql3-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Create and populate a table',
        objective: 'Write CREATE TABLE and INSERT.',
        problem: 'Create a table batches (batch_id INTEGER PRIMARY KEY, name TEXT NOT NULL, seats INTEGER DEFAULT 30), insert "Morning" with 25 seats and "Evening" with the default, then select name and seats ordered by batch_id.',
        starterCode: 'CREATE TABLE batches (\n  -- columns here\n);\n\n-- inserts here\n\nSELECT name, seats FROM batches ORDER BY batch_id;',
        hints: ["INSERT INTO batches (name, seats) VALUES ('Morning', 25);", "INSERT INTO batches (name) VALUES ('Evening'); uses the default."],
        check: { type: 'rows', ordered: true, rows: [['Morning', 25], ['Evening', 30]] },
        solutionCode: "CREATE TABLE batches (\n  batch_id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  seats INTEGER DEFAULT 30\n);\nINSERT INTO batches (name, seats) VALUES ('Morning', 25);\nINSERT INTO batches (name) VALUES ('Evening');\nSELECT name, seats FROM batches ORDER BY batch_id;",
        solution: ['Declare the default in the column definition.', 'Omit seats in the second INSERT so the default applies.'],
        explanation: 'Listing column names in INSERT keeps the statement correct even if columns are added later.',
        mistakes: ['Inserting NULL explicitly, which does not trigger the DEFAULT.'],
        challenge: 'Add a CHECK so seats must be between 1 and 60, then try inserting 100.'
      },
      {
        id: 'sql3-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Add a column and fill it',
        objective: 'Use ALTER TABLE and UPDATE together.',
        problem: 'Add a column is_premium INTEGER DEFAULT 0 to products, set it to 1 for products priced above 400, then return name and is_premium for all products ordered by product_id.',
        starterCode: '-- ALTER TABLE ...\n-- UPDATE ...\nSELECT name, is_premium FROM products ORDER BY product_id;',
        hints: ['ALTER TABLE products ADD COLUMN is_premium INTEGER DEFAULT 0;', 'UPDATE products SET is_premium = 1 WHERE price > 400;'],
        check: { type: 'rows', ordered: true, rows: [['Laptop Pro 14', 1], ['Noise-Cancel Headphones', 0], ['Standing Desk', 1], ['Ergo Chair', 0], ['Python Crash Course', 0]] },
        solutionCode: 'ALTER TABLE products ADD COLUMN is_premium INTEGER DEFAULT 0;\nUPDATE products SET is_premium = 1 WHERE price > 400;\nSELECT name, is_premium FROM products ORDER BY product_id;',
        solution: ['The new column starts at 0 for every row.', 'The UPDATE flags the two products above 400 (1299 and 499).'],
        explanation: 'In SQLite booleans are stored as 0/1 integers; PostgreSQL has a real BOOLEAN type.',
        mistakes: ['Using >= 400, which is not what was asked (no product is exactly 400 here, but boundaries matter).'],
        challenge: 'In the Practice Lab, press "Reset data" and verify the column is gone — the sample DB is recreated.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql3-k1', question: 'What does CREATE TABLE IF NOT EXISTS do when the table already exists?', options: ['Fails', 'Replaces it', 'Does nothing', 'Deletes the rows'], answer: 2, explanation: 'It is a no-op, useful for re-runnable scripts.' },
      { id: 'sql3-k2', question: 'Which statement copies the result of a query into a new table?', options: ['CREATE TABLE … AS SELECT …', 'INSERT TABLE', 'COPY TABLE', 'ALTER TABLE … SELECT'], answer: 0, explanation: 'CTAS creates and fills the table in one step.' },
      { id: 'sql3-k3', question: 'Where should schema changes live in a real project?', options: ['Only in a DBA\'s memory', 'In versioned migration files', 'In the README', 'Nowhere'], answer: 1, explanation: 'Migrations make changes repeatable and reviewable.' }
    ],
    cheatSheet: ['CREATE TABLE t (col TYPE constraints, …);', 'ALTER TABLE t ADD COLUMN c TYPE DEFAULT v;', 'DROP TABLE IF EXISTS t;  TRUNCATE t;', 'CREATE TABLE new AS SELECT …;'],
    references: [
      { title: 'PostgreSQL — Data Definition', url: 'https://www.postgresql.org/docs/current/ddl.html', publisher: PG },
      { title: 'PostgreSQL — CREATE TABLE', url: 'https://www.postgresql.org/docs/current/sql-createtable.html', publisher: PG },
      { title: 'SQLite — ALTER TABLE', url: 'https://www.sqlite.org/lang_altertable.html', publisher: SQLITE }
    ],
    next: 'Module 04 adds constraints and keys so the database rejects invalid data.'
  },

  'sql-mod-4': {
    skills: ['Choose primary and foreign keys', 'Use CHECK, UNIQUE, NOT NULL and DEFAULT', 'Decide on ON DELETE behaviour'],
    prerequisites: ['CREATE TABLE (Module 03)'],
    intuition: {
      analogy: 'Constraints are the database\'s security guards. Application code is the receptionist who usually checks ID, but the guard at the door checks everyone — including scripts, admin tools and future apps.',
      whyItMatters: 'Data outlives applications. Rules enforced in the database cannot be bypassed by a bug in one program, so orphaned orders and negative stock simply cannot be stored.'
    },
    workflow: {
      title: 'What happens when a row is inserted',
      nodes: [
        { id: 'ins', label: 'INSERT / UPDATE', detail: 'New or changed row arrives.', input: 'Row values', output: 'Candidate row' },
        { id: 'nn', label: 'NOT NULL & DEFAULT', detail: 'Fill defaults, reject missing required values.', input: 'Candidate row', output: 'Complete row' },
        { id: 'chk', label: 'CHECK', detail: 'Evaluate domain rules, e.g. price > 0.', input: 'Complete row', output: 'Valid values' },
        { id: 'uniq', label: 'PRIMARY KEY / UNIQUE', detail: 'Look up the index for duplicates.', input: 'Key values', output: 'Unique row' },
        { id: 'fk', label: 'FOREIGN KEY', detail: 'Referenced parent row must exist.', input: 'Reference value', output: 'Consistent link' },
        { id: 'ok', label: 'Row stored', detail: 'Written within the transaction.', input: 'Valid row', output: 'Committed data' },
        { id: 'rej', label: 'Constraint violation', detail: 'Statement fails; nothing is written.', input: 'Invalid row', output: 'Error to client' }
      ],
      edges: [
        { from: 'ins', to: 'nn' }, { from: 'nn', to: 'chk' }, { from: 'chk', to: 'uniq' }, { from: 'uniq', to: 'fk' }, { from: 'fk', to: 'ok', label: 'all pass' },
        { from: 'fk', to: 'rej', label: 'any check fails' }
      ],
      explanation: 'The checks run one after another. If any of them fails - a missing value, a CHECK that is false, a duplicate key or a missing parent row - the whole statement is rejected and nothing is saved, which keeps the table consistent.'
    },
    workedExample: {
      title: 'Constraints in action',
      language: 'sql',
      code: "PRAGMA foreign_keys = ON;\nCREATE TABLE seats (\n  seat_no   TEXT PRIMARY KEY,\n  dept_id   INTEGER NOT NULL REFERENCES departments(dept_id),\n  capacity  INTEGER CHECK (capacity BETWEEN 1 AND 10)\n);\nINSERT INTO seats VALUES ('E-01', 1, 4);\nINSERT INTO seats VALUES ('S-01', 2, 6);\nSELECT s.seat_no, d.dept_name, s.capacity\nFROM seats s JOIN departments d ON d.dept_id = s.dept_id\nORDER BY s.seat_no;",
      lineByLine: [
        { line: 1, explanation: 'SQLite enforces foreign keys only when this pragma is on (PostgreSQL always enforces them).' },
        { line: 4, explanation: 'dept_id must match an existing department.' },
        { line: 5, explanation: 'CHECK rejects capacities outside 1–10.' },
        { line: 9, explanation: 'The FK makes this join safe: every seat has a department.' }
      ],
      expectedOutput: 'seat_no | dept_name | capacity\nE-01 | Engineering | 4\nS-01 | Sales | 6',
      edgeCases: ["INSERT INTO seats VALUES ('X-01', 9, 4) fails: department 9 does not exist.", "UNIQUE allows multiple NULLs in most databases because NULL is not equal to NULL."]
    },
    caseStudy: {
      title: 'Stopping duplicate student registrations',
      problem: 'A registration form sometimes double-submits, creating two students with the same email.',
      data: 'students(id, email, name) with 40,000 rows, some duplicated.',
      steps: ['Find duplicates with GROUP BY lower(email) HAVING COUNT(*) > 1.', 'Merge or delete the duplicates, re-pointing their enrolments.', 'Add a UNIQUE index on lower(email).', 'Handle the unique-violation error in the app with a friendly message.'],
      result: 'Double submissions now fail cleanly instead of silently creating a second account.',
      limitations: 'Cleaning existing data must happen before the constraint can be added.'
    },
    exercises: [
      {
        id: 'sql4-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which constraint?',
        objective: 'Match rules to constraint types.',
        problem: 'Every order must belong to an existing customer. Which constraint enforces this?',
        options: ['UNIQUE', 'CHECK', 'FOREIGN KEY', 'DEFAULT'],
        hints: ['The rule refers to another table.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['orders.customer_id REFERENCES customers(customer_id) guarantees the parent exists.'],
        explanation: 'CHECK can only look at values in the same row.',
        mistakes: ['Trying to express cross-table rules with CHECK.'],
        challenge: 'What ON DELETE action would you pick for orders when a customer is deleted, and why?'
      },
      {
        id: 'sql4-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Cascade behaviour',
        objective: 'Understand ON DELETE CASCADE.',
        problem: 'order_items.order_id references orders with ON DELETE CASCADE. You delete order 1001, which has 2 items. How many order_items rows are deleted automatically? (number)',
        hints: ['Look at order_items for order 1001 in the sample schema.'],
        check: { type: 'text', accept: ['2', 'two'] },
        solution: ['Order 1001 has items 1 and 2.', 'CASCADE deletes child rows together with the parent: 2 rows.'],
        explanation: 'RESTRICT/NO ACTION would instead block the delete while items exist.',
        mistakes: ['Assuming child rows remain as orphans.'],
        challenge: 'Which option sets the child column to NULL instead? (ON DELETE SET NULL)'
      },
      {
        id: 'sql4-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Find rows that would violate a new rule',
        objective: 'Audit data before adding a constraint.',
        problem: 'You plan to add CHECK (salary >= 60000) to employees. First list the employees that would violate it: first_name and salary, lowest salary first.',
        starterCode: 'SELECT first_name, salary\nFROM employees\nWHERE \nORDER BY salary;',
        hints: ['Violations are rows where the condition is false: salary < 60000.'],
        check: { type: 'rows', ordered: true, rows: [['Isha', 55000], ['Ananya', 58000]] },
        solutionCode: 'SELECT first_name, salary\nFROM employees\nWHERE salary < 60000\nORDER BY salary;',
        solution: ['Negate the rule to find violators.', 'Isha (55000) and Ananya (58000) would block the constraint.'],
        explanation: 'Adding a CHECK fails if any existing row violates it, so audit first.',
        mistakes: ['Writing salary <= 60000, which wrongly includes a value of exactly 60000.'],
        challenge: 'Write the ALTER TABLE … ADD CONSTRAINT statement in PostgreSQL syntax.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql4-k1', question: 'How many PRIMARY KEY constraints can a table have?', options: ['Any number', 'Exactly one (possibly multi-column)', 'Zero', 'One per column'], answer: 1, explanation: 'One primary key, which may span several columns.' },
      { id: 'sql4-k2', question: 'What is a natural key?', options: ['An auto-increment id', 'A real-world unique attribute such as ISBN', 'A foreign key', 'An index'], answer: 1, explanation: 'Surrogate keys are generated; natural keys come from the domain.' },
      { id: 'sql4-k3', question: 'Which option blocks deleting a parent that still has children?', options: ['CASCADE', 'SET NULL', 'RESTRICT', 'SET DEFAULT'], answer: 2, explanation: 'RESTRICT (or NO ACTION) prevents the delete.' }
    ],
    cheatSheet: ['col TYPE PRIMARY KEY | UNIQUE | NOT NULL | DEFAULT v | CHECK (expr)', 'REFERENCES parent(col) ON DELETE CASCADE | RESTRICT | SET NULL', 'ALTER TABLE t ADD CONSTRAINT name CHECK (…);', 'PRAGMA foreign_keys = ON; (SQLite)'],
    references: [
      { title: 'PostgreSQL — Constraints', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html', publisher: PG },
      { title: 'SQLite Foreign Key Support', url: 'https://www.sqlite.org/foreignkeys.html', publisher: SQLITE }
    ],
    next: 'Module 05 inserts, updates and deletes data within those rules.'
  },

  'sql-mod-5': {
    skills: ['Insert single and multiple rows', 'Update and delete safely with WHERE', 'Use an upsert for idempotent loads'],
    prerequisites: ['Tables and constraints (Modules 03–04)'],
    intuition: {
      analogy: 'UPDATE without WHERE is like announcing "everyone\'s marks are now 0" in an exam hall — it applies to every row. The WHERE clause is the list of names you meant to read out.',
      whyItMatters: 'Most data-loss incidents come from a missing or wrong WHERE clause. Safe habits — preview with SELECT, use transactions — protect real data.'
    },
    workflow: {
      title: 'A safe UPDATE routine',
      nodes: [
        { id: 'sel', label: 'Preview with SELECT', detail: 'Run the same WHERE as a SELECT and count the rows.', input: 'Planned change', output: 'Rows that will change' },
        { id: 'begin', label: 'BEGIN', detail: 'Start a transaction.', input: 'Approved plan', output: 'Open transaction' },
        { id: 'upd', label: 'UPDATE … WHERE …', detail: 'Apply the change; note the affected row count.', input: 'Transaction', output: 'Changed rows' },
        { id: 'check', label: 'Verify', detail: 'Does the count match the preview?', input: 'Affected count', output: 'Yes / no' },
        { id: 'commit', label: 'COMMIT', detail: 'Make it permanent.', input: 'Verified change', output: 'Saved data' },
        { id: 'rollback', label: 'ROLLBACK', detail: 'Undo everything since BEGIN.', input: 'Unexpected count', output: 'Original data' }
      ],
      edges: [
        { from: 'sel', to: 'begin' }, { from: 'begin', to: 'upd' }, { from: 'upd', to: 'check' },
        { from: 'check', to: 'commit', label: 'matches' }, { from: 'check', to: 'rollback', label: 'differs' }
      ],
      explanation: 'The preview-then-transaction habit turns a potential disaster into a recoverable mistake.'
    },
    workedExample: {
      title: 'Insert, update, delete and upsert',
      language: 'sql',
      code: "INSERT INTO products (product_id, name, category, price) VALUES\n  (6, 'USB-C Hub', 'Electronics', 59),\n  (7, 'Desk Lamp', 'Furniture', 35);\nUPDATE products SET price = price * 0.9 WHERE category = 'Furniture';\nDELETE FROM products WHERE product_id = 7;\nINSERT INTO products (product_id, name, category, price) VALUES (6, 'USB-C Hub', 'Electronics', 49)\n  ON CONFLICT(product_id) DO UPDATE SET price = excluded.price;\nSELECT product_id, name, ROUND(price, 2) AS price FROM products WHERE product_id IN (3, 4, 6) ORDER BY product_id;",
      lineByLine: [
        { line: 1, explanation: 'Multi-row INSERT in one statement.' },
        { line: 4, explanation: '10% discount only for Furniture: 499 → 449.1 and 329 → 296.1 (the new lamp too).' },
        { line: 5, explanation: 'Delete the lamp by its key.' },
        { line: 6, explanation: 'Upsert: id 6 exists, so the conflict clause updates its price to 49.' },
        { line: 7, explanation: '`excluded` refers to the row that failed to insert (SQLite and PostgreSQL).' }
      ],
      expectedOutput: 'product_id | name | price\n3 | Standing Desk | 449.1\n4 | Ergo Chair | 296.1\n6 | USB-C Hub | 49',
      edgeCases: ['DELETE without WHERE removes every row.', 'Soft deletes (setting deleted_at) keep history; remember to filter them out in queries.']
    },
    caseStudy: {
      title: 'Nightly price feed from a supplier',
      problem: 'A supplier sends a CSV of SKUs and prices each night. Some SKUs are new, some changed, and the job sometimes runs twice.',
      data: '20,000 rows per file; sku is unique.',
      steps: ['Load the CSV into a staging table.', 'INSERT … SELECT … FROM staging ON CONFLICT (sku) DO UPDATE SET price = excluded.price, updated_at = now().', 'Log the number of inserted and updated rows.'],
      result: 'Running the job twice has the same effect as running it once (idempotent), and no duplicate SKUs appear.',
      limitations: 'Products removed by the supplier need a separate rule (e.g. mark inactive if missing from the feed).'
    },
    exercises: [
      {
        id: 'sql5-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Spot the dangerous statement',
        objective: 'Recognise a missing WHERE.',
        problem: 'Which statement changes the status of every order?',
        options: ["UPDATE orders SET status = 'SHIPPED' WHERE order_id = 1002;", "UPDATE orders SET status = 'SHIPPED';", "SELECT * FROM orders WHERE status = 'SHIPPED';", "DELETE FROM orders WHERE status = 'CANCELLED';"],
        hints: ['Look for an UPDATE without a filter.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Without WHERE, UPDATE applies to all rows.'],
        explanation: 'Many teams enable a "safe updates" setting or code review rule for this reason.',
        mistakes: ['Assuming the database will ask for confirmation.'],
        challenge: 'Write the SELECT you would run first to preview the change in option A.'
      },
      {
        id: 'sql5-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Give a raise',
        objective: 'Write a targeted UPDATE and verify it.',
        problem: 'Give every Sales employee (dept_id 2) a 5% raise, then return first_name and salary for dept_id 2 ordered by emp_id.',
        starterCode: '-- UPDATE employees ...\nSELECT first_name, salary FROM employees WHERE dept_id = 2 ORDER BY emp_id;',
        hints: ['UPDATE employees SET salary = salary * 1.05 WHERE dept_id = 2;'],
        check: { type: 'rows', ordered: true, rows: [['Kabir', 67200], ['Ananya', 60900]] },
        solutionCode: 'UPDATE employees SET salary = salary * 1.05 WHERE dept_id = 2;\nSELECT first_name, salary FROM employees WHERE dept_id = 2 ORDER BY emp_id;',
        solution: ['64000 × 1.05 = 67200 and 58000 × 1.05 = 60900.', 'The WHERE limits the change to Sales.'],
        explanation: 'Expressions on the right of SET can refer to the current value of the column.',
        mistakes: ['Writing salary = 1.05, which sets every salary to 1.05.'],
        challenge: 'Cap the raise so nobody exceeds 66000 (hint: MIN(salary * 1.05, 66000) in SQLite).'
      },
      {
        id: 'sql5-e3', type: 'SQL query writing', difficulty: 'Advanced', language: 'sql',
        title: 'Soft-delete cancelled orders',
        objective: 'Implement soft deletes and filter them.',
        problem: 'Add a column deleted_at TEXT to orders, set it to \'2024-08-01\' for CANCELLED orders, then return the order_id of all orders that are not soft-deleted, ordered by order_id.',
        starterCode: '-- ALTER TABLE ...\n-- UPDATE ...\nSELECT order_id FROM orders WHERE  ORDER BY order_id;',
        hints: ['ALTER TABLE orders ADD COLUMN deleted_at TEXT;', 'Filter with WHERE deleted_at IS NULL'],
        check: { type: 'rows', ordered: true, rows: [[1001], [1002], [1003], [1005], [1006]] },
        solutionCode: "ALTER TABLE orders ADD COLUMN deleted_at TEXT;\nUPDATE orders SET deleted_at = '2024-08-01' WHERE status = 'CANCELLED';\nSELECT order_id FROM orders WHERE deleted_at IS NULL ORDER BY order_id;",
        solution: ['Only order 1004 is CANCELLED, so it gets a deleted_at value.', 'IS NULL (not = NULL) selects rows without a value.'],
        explanation: '= NULL is never true in SQL; NULL comparisons need IS NULL / IS NOT NULL.',
        mistakes: ['Writing WHERE deleted_at = NULL, which returns no rows.'],
        challenge: 'Create a view active_orders that hides soft-deleted rows.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql5-k1', question: 'What is an "upsert"?', options: ['Update then select', 'Insert, or update if the key exists', 'A bulk delete', 'An index'], answer: 1, explanation: 'INSERT … ON CONFLICT … DO UPDATE (or MERGE).' },
      { id: 'sql5-k2', question: 'Which clause returns the rows changed by an INSERT/UPDATE in PostgreSQL?', options: ['OUTPUT', 'RETURNING', 'RESULT', 'SHOW'], answer: 1, explanation: 'RETURNING is also supported by modern SQLite.' },
      { id: 'sql5-k3', question: 'Which statement undoes changes since BEGIN?', options: ['UNDO', 'ROLLBACK', 'REVERT', 'CANCEL'], answer: 1, explanation: 'ROLLBACK ends the transaction without saving.' }
    ],
    cheatSheet: ['INSERT INTO t (cols) VALUES (…), (…);', 'UPDATE t SET c = expr WHERE …;  DELETE FROM t WHERE …;', 'INSERT … ON CONFLICT (key) DO UPDATE SET c = excluded.c;', 'Preview with SELECT; wrap in BEGIN … COMMIT'],
    references: [
      { title: 'PostgreSQL — Data Manipulation', url: 'https://www.postgresql.org/docs/current/dml.html', publisher: PG },
      { title: 'PostgreSQL — INSERT (ON CONFLICT)', url: 'https://www.postgresql.org/docs/current/sql-insert.html', publisher: PG },
      { title: 'SQLite — UPSERT', url: 'https://www.sqlite.org/lang_upsert.html', publisher: SQLITE }
    ],
    next: 'Module 06 focuses on reading data with SELECT and the logical order in which a query is evaluated.'
  }
};
