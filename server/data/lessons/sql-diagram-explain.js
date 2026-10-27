// Longer explanations (and small examples) for every box of the SQL workflow diagrams. Shown in the
// card that opens when a learner clicks a box. { [moduleId]: { [nodeId]: { explain, example? } } }
export default {
  'sql-mod-1': {
    client: { explain: 'Everything starts with a program that wants data: the Practice Lab, a Python script, a website\'s backend or a reporting tool such as Power BI. It connects to the database and sends the SQL statement as plain text.\n\nThe client does not know where the data is stored or how to fetch it - it only describes what it wants.', example: "SELECT first_name, salary\nFROM employees\nWHERE dept_id = 1;" },
    parser: { explain: 'The parser reads the SQL text and checks the grammar: are the keywords in the right order, are brackets and quotes closed? Then it checks that every table and column name really exists.\n\nMost beginner errors stop here - a misspelt column gives "no such column", a missing comma gives "syntax error".', example: "SELECT frist_name FROM employees;\n-- Error: no such column: frist_name" },
    planner: { explain: 'For one query there are many ways to get the answer: read the whole table or use an index, join table A to B or B to A. The planner (optimiser) estimates the cost of each way using statistics about the tables and picks the cheapest plan.\n\nThis is why SQL is called declarative: you say what you want, the database decides how. You can see the chosen plan with EXPLAIN (module 13).', example: 'EXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 1;' },
    executor: { explain: 'The executor carries out the plan step by step: it reads rows, tests the WHERE condition, joins tables, groups and sorts, and builds the result rows one by one.' },
    storage: { explain: 'Tables and indexes are stored in data files on disk, organised in small blocks called pages. Pages that are used often are kept in memory (the buffer cache), which is much faster than disk.\n\nIndexes are separate structures that point to rows, so the executor can find rows without reading every page.' },
    result: { explain: 'The answer goes back to the client as a result set: column names plus rows. In the Practice Lab you see it as a table; in Python you get a list of tuples.\n\nA SELECT never changes the stored data - it only produces this result.' }
  },
  'sql-mod-2': {
    q: { explain: 'Before choosing a type, describe the real value: is it a count, an amount of money, a measurement, a piece of text or a moment in time? The answer decides the data type, and the right type stops bad data from getting in and makes sorting and maths correct.' },
    int: { explain: 'Whole numbers with no decimal part: ages, quantities, number of seats, and ID columns. INTEGER (INT) is enough for most values; BIGINT holds very large numbers such as IDs in huge tables; SMALLINT saves space for small ranges.', example: 'CREATE TABLE seats (seat_no INTEGER, capacity SMALLINT);' },
    dec: { explain: 'Money and anything that must be exact uses DECIMAL / NUMERIC(p, s): p digits in total, s of them after the decimal point. NUMERIC(10, 2) stores up to 99,999,999.99 exactly.\n\nNever use FLOAT for money: it can store 0.1 + 0.2 as 0.30000000000000004.', example: 'CREATE TABLE payments (amount NUMERIC(10, 2));' },
    flt: { explain: 'REAL / FLOAT / DOUBLE store approximate decimals very efficiently. They suit measurements where tiny rounding errors do not matter: temperatures, distances, sensor readings, scientific results.', example: 'CREATE TABLE readings (temperature REAL);' },
    txt: { explain: 'Text uses VARCHAR(n) (up to n characters), CHAR(n) (always exactly n, good for codes like \'IN\') or TEXT (long text). Phone numbers and PIN codes are text too: they are not used for maths and may start with 0 or contain +.', example: "CREATE TABLE contacts (name VARCHAR(60), phone VARCHAR(15), country CHAR(2));" },
    time: { explain: 'Dates and times use DATE (a day), TIME (a time of day) or TIMESTAMP / DATETIME (both). Real date types sort correctly and support date maths. For events from users in different countries, PostgreSQL\'s TIMESTAMPTZ stores the moment in UTC.\n\nSQLite has no separate date type; store dates as text in YYYY-MM-DD format.', example: "CREATE TABLE events (title TEXT, starts_on DATE);" }
  },
  'sql-mod-3': {
    design: { explain: 'Before writing any SQL, decide what the tables are (one per kind of thing: students, courses, enrolments), which columns each needs, their data types, and the primary and foreign keys that link them. A quick sketch on paper saves many ALTER TABLE statements later.' },
    create: { explain: 'CREATE TABLE builds the empty structure. In real projects these statements are saved in numbered script files called migrations (001_create_students.sql, 002_add_phone.sql), so every database - laptop, test, live - can be built the same way.', example: 'CREATE TABLE students (\n    student_id INTEGER PRIMARY KEY,\n    full_name  VARCHAR(60) NOT NULL\n);' },
    load: { explain: 'Next the table is filled with its first data: INSERT statements for small amounts, or bulk tools for big files - COPY in PostgreSQL, LOAD DATA INFILE in MySQL, or .import in the SQLite shell.', example: "INSERT INTO students (full_name) VALUES ('Priya Das'), ('Rahul Verma');" },
    alter: { explain: 'Needs change, and ALTER TABLE changes a table that already holds data. Adding a column is safe; give it a DEFAULT so existing rows get a sensible value. Renaming or changing types can break programs that use the old name, so do it carefully.', example: "ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active';" },
    verify: { explain: 'After a change, check it: count the rows before and after, look at a few rows, and make sure constraints still hold. Always have a backup before changing a real database, so a mistake can be undone.', example: 'SELECT COUNT(*) FROM students;\nPRAGMA table_info(students);' }
  },
  'sql-mod-4': {
    ins: { explain: 'Every INSERT and every UPDATE sends a new or changed row to the table. Before it is saved, the database runs it through all the constraints defined on the table, one after another.' },
    nn: { explain: 'First, columns that were not given a value get their DEFAULT. Then every NOT NULL column is checked: if one is still empty, the statement stops with "NOT NULL constraint failed".', example: "INSERT INTO members (member_id) VALUES (5);\n-- full_name is NOT NULL and has no default -> refused" },
    chk: { explain: 'CHECK rules are tested next. Each one is a condition such as price > 0 or age >= 18. If a condition is false, the row is refused with "CHECK constraint failed".', example: 'price DECIMAL(8,2) CHECK (price > 0)' },
    uniq: { explain: 'For PRIMARY KEY and UNIQUE columns the database looks in their index to see whether the value is already used. A duplicate gives "UNIQUE constraint failed". Because an index is used, this check is fast even with millions of rows.' },
    fk: { explain: 'For each FOREIGN KEY column, the value must exist in the parent table: an enrolment for batch 9 is refused if there is no batch 9. This keeps links between tables valid.', example: 'batch_id INTEGER REFERENCES batches(batch_id)' },
    ok: { explain: 'If every check passes, the row is written. If the statement is part of a transaction it becomes permanent at COMMIT (module 14).' },
    rej: { explain: 'If any check fails, the whole statement is cancelled and nothing is written - not even the rows of a multi-row INSERT that were fine. The error message names the rule that failed, so you know what to fix.' }
  },
  'sql-mod-5': {
    sel: { explain: 'Before changing data, write the WHERE as a SELECT and look at the rows it returns. If the SELECT shows exactly the rows you mean, the UPDATE will touch exactly those rows. Note how many there are.', example: 'SELECT emp_id, first_name, salary\nFROM employees\nWHERE dept_id = 3;' },
    begin: { explain: 'BEGIN starts a transaction. From now on, your changes are not final until you COMMIT, and ROLLBACK can undo them all. It is a safety net for risky changes.', example: 'BEGIN;' },
    upd: { explain: 'Run the UPDATE with the same WHERE you previewed. The database reports how many rows were changed (in the Practice Lab: "N row(s) affected").', example: 'UPDATE employees\nSET salary = ROUND(salary * 1.10)\nWHERE dept_id = 3;' },
    check: { explain: 'Compare: does the number of changed rows match the preview? Run the SELECT again and look at the new values. If something looks wrong, do not commit.' },
    commit: { explain: 'If everything is correct, COMMIT makes the change permanent and visible to everyone.', example: 'COMMIT;' },
    rollback: { explain: 'If the count or the values are wrong, ROLLBACK undoes everything since BEGIN, as if the UPDATE never happened. Fix the WHERE and try again.', example: 'ROLLBACK;' }
  },
  'sql-mod-6': {
    from: { explain: 'Although SELECT is written first, the database starts with FROM: it finds the table (and joins any other tables) to build the set of rows it will work with.' },
    where: { explain: 'WHERE then removes the rows that do not match the condition. Because this happens before SELECT, a column alias defined in SELECT cannot be used in WHERE.', example: "SELECT salary * 12 AS yearly FROM employees WHERE yearly > 900000;  -- error in most databases" },
    group: { explain: 'If there is a GROUP BY, the remaining rows are put into groups that share the same value, ready for COUNT, SUM, AVG and the other aggregates.' },
    having: { explain: 'HAVING keeps only the groups that match its condition. It can use aggregates like COUNT(*), because the groups now exist.' },
    select: { explain: 'Only now are the SELECT expressions calculated: the chosen columns, calculations, functions and aliases. DISTINCT is applied here too.' },
    order: { explain: 'Finally the result is sorted with ORDER BY, and LIMIT / OFFSET cut it to the rows you asked for. ORDER BY runs after SELECT, so it can use column aliases.', example: 'SELECT first_name, salary / 12 AS monthly\nFROM employees\nORDER BY monthly DESC\nLIMIT 3;' }
  },
  'sql-mod-7': {
    row: { explain: 'WHERE looks at the rows one at a time. For each row it takes the values of that row\'s columns and puts them into the condition.' },
    eval: { explain: 'The condition is worked out to TRUE, FALSE or UNKNOWN. UNKNOWN happens when NULL is involved: is NULL = 5? Nobody knows, so the answer is UNKNOWN - even NULL = NULL is UNKNOWN.', example: 'SELECT NULL = NULL AS result;   -- shows NULL (unknown)' },
    keep: { explain: 'Only rows where the whole condition is TRUE pass through to the result.' },
    drop: { explain: 'Rows where the condition is FALSE or UNKNOWN are left out. That is why WHERE manager_id = NULL returns nothing: the answer is always UNKNOWN. Use IS NULL instead.', example: 'SELECT first_name FROM employees WHERE manager_id IS NULL;' }
  },
  'sql-mod-8': {
    req: { explain: 'A list on a website shows one page at a time, for example 10 orders per page. When the user clicks "next", the application asks the database for the next page.' },
    off: { explain: 'With OFFSET, page N skips (N - 1) × page size rows. Simple to write, but the database still has to read and throw away all the skipped rows, so page 1000 is much slower than page 1.', example: 'SELECT * FROM orders ORDER BY order_id LIMIT 10 OFFSET 20;   -- page 3' },
    key: { explain: 'Keyset pagination remembers the last key shown (for example the last order_id) and asks for rows after it. An index jumps straight there, so every page is equally fast.', example: 'SELECT * FROM orders WHERE order_id > 1003 ORDER BY order_id LIMIT 3;' },
    order: { explain: 'Both methods need a fixed order. Add a unique column (such as the ID) at the end of ORDER BY, so rows with equal values are always in the same order and no row appears on two pages.' },
    limit: { explain: 'LIMIT returns one page of rows - never more than the page size. The application shows them and remembers the last key (or the page number) for the next click.', example: 'SELECT order_id, order_date FROM orders ORDER BY order_id LIMIT 3;' }
  },
  'sql-mod-9': {
    rows: { explain: 'Grouping starts from the rows that are left after FROM and WHERE. Rows removed by WHERE are not counted in any group.' },
    group: { explain: 'GROUP BY puts all rows with the same value of the grouping column into one group - for example all employees of department 1 together.', example: 'SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id;' },
    agg: { explain: 'Each aggregate function then turns its group into one value: COUNT(*) counts the rows, AVG(salary) averages, MAX(salary) finds the highest. One output row is produced per group.' },
    having: { explain: 'HAVING filters the groups using those aggregated values - for example only departments with at least 2 employees.', example: 'SELECT dept_id, COUNT(*) AS people\nFROM employees\nGROUP BY dept_id\nHAVING COUNT(*) >= 2;' },
    out: { explain: 'The summary rows are sorted with ORDER BY and returned - this is the shape of most reports and dashboard charts.' }
  },
  'sql-mod-10': {
    a: { explain: 'The left table is the one written in FROM. In a LEFT JOIN, every one of its rows is kept, even without a match.' },
    b: { explain: 'The right table is the one written after JOIN. In a self join, the same table plays both roles with two aliases - employees AS e and employees AS m.' },
    cond: { explain: 'ON says which rows belong together. It is almost always "foreign key = primary key", such as employees.dept_id = departments.dept_id.', example: 'FROM employees AS e\nJOIN departments AS d ON e.dept_id = d.dept_id' },
    inner: { explain: 'INNER JOIN returns only the pairs that match. Rows without a partner on the other side disappear from the result.', example: 'SELECT e.first_name, d.dept_name\nFROM employees AS e\nJOIN departments AS d ON e.dept_id = d.dept_id;' },
    left: { explain: 'LEFT JOIN keeps every row of the left table. Where the right table has no match, its columns are NULL. Use it when you must not lose rows, such as "all departments, even empty ones".', example: 'SELECT d.dept_name, e.first_name\nFROM departments AS d\nLEFT JOIN employees AS e ON e.dept_id = d.dept_id;' },
    full: { explain: 'FULL JOIN keeps every row from both tables, with NULLs on whichever side has no match. It is used to compare two lists and find what is missing on either side.' }
  },
  'sql-mod-11': {
    cte1: { explain: 'The first step is a normal query with a name. Here it works out the total spending of each customer.', example: 'WITH spend AS (\n    SELECT customer_id, SUM(total_amount) AS total\n    FROM orders\n    GROUP BY customer_id\n)' },
    cte2: { explain: 'A second step can use the first one by name - here it calculates the average of all the totals. Steps are separated by commas.', example: ', avg_spend AS (\n    SELECT AVG(total) AS avg_total FROM spend\n)' },
    main: { explain: 'The main SELECT uses the named steps like tables: it joins them and keeps the customers who spent more than the average. Each step can be tested on its own, which makes long queries much easier to get right.', example: 'SELECT s.customer_id, s.total\nFROM spend AS s, avg_spend AS a\nWHERE s.total > a.avg_total;' },
    set: { explain: 'If needed, the result can be combined with another query that has the same columns: UNION adds rows, EXCEPT removes rows that appear in the second query.' }
  },
  'sql-mod-12': {
    row: { explain: 'CASE is worked out separately for every row. Here the row being labelled has salary = 64000.' },
    w1: { explain: 'The first WHEN is tested: is 64000 >= 80000? No - so its THEN value is not used, and the next WHEN is tried.' },
    w2: { explain: 'The second WHEN: is 64000 >= 60000? Yes - so CASE returns this THEN value and stops. Later WHENs are not even looked at, which is why the order of the conditions matters.' },
    else: { explain: 'If no WHEN is true, the ELSE value is used. Without an ELSE, CASE returns NULL.' },
    res: { explain: 'The value CASE returned becomes the column value for this row - the same happens for every row.', example: "SELECT first_name, salary,\n       CASE WHEN salary >= 80000 THEN 'Senior'\n            WHEN salary >= 60000 THEN 'Mid'\n            ELSE 'Junior' END AS level\nFROM employees;" }
  },
  'sql-mod-13': {
    q: { explain: 'A query arrives that searches by one column, for example a login looking up an email address. The planner decides how to find the matching rows.', example: "SELECT * FROM employees WHERE email = 'meera@arb.io';" },
    scan: { explain: 'Without a useful index, the database reads every row of the table and tests the condition on each one (a full table scan). Fine for 8 rows, very slow for 8 million.' },
    idx: { explain: 'With an index, the database walks a sorted tree (a B-tree) from the top to the right leaf in a few steps, like finding a word in a dictionary by its first letters. The leaf says where the row is.', example: 'CREATE INDEX idx_employees_email ON employees (email);' },
    heap: { explain: 'Using the pointer from the index, the database reads just the page of the table that holds the matching row.' },
    res: { explain: 'Both ways return exactly the same rows - an index never changes the answer, only how fast it arrives. EXPLAIN QUERY PLAN shows which way was used.' }
  },
  'sql-mod-14': {
    begin: { explain: 'BEGIN starts the transaction. Everything until COMMIT or ROLLBACK is one unit of work.', example: 'BEGIN;' },
    debit: { explain: 'Take the money from the sender. A CHECK (balance >= 0) on the table stops the transfer if the sender does not have enough money - the UPDATE fails.', example: 'UPDATE accounts SET balance = balance - 300 WHERE id = 1;' },
    credit: { explain: 'Add the same amount to the receiver. Until COMMIT, other users still see the old balances, so nobody sees money "in the air" (isolation).', example: 'UPDATE accounts SET balance = balance + 300 WHERE id = 2;' },
    commit: { explain: 'COMMIT saves both changes together. From now on they are visible to everyone and survive a crash (durability).', example: 'COMMIT;' },
    rollback: { explain: 'If anything fails - a CHECK, a lost connection, an error in the program - ROLLBACK undoes both updates. The money is never lost or created (atomicity).', example: 'ROLLBACK;' }
  },
  'sql-mod-15': {
    src: { explain: 'Analysis starts from the tables the business uses every day: orders, customers, products. Analysts usually read them (or a copy) and never change them.' },
    win: { explain: 'As much work as possible is done in SQL, close to the data: joins, filters, GROUP BY summaries and window functions such as RANK, running totals with SUM OVER, and LAG for changes over time.', example: 'SELECT order_date, total_amount,\n       SUM(total_amount) OVER (ORDER BY order_date) AS running_total\nFROM orders;' },
    py: { explain: 'The query result is loaded into Python with pandas.read_sql, which turns it into a DataFrame - a table in memory that is easy to analyse further.', example: 'import pandas as pd\ndf = pd.read_sql("SELECT * FROM orders", conn)' },
    viz: { explain: 'In Python the data becomes charts (matplotlib, seaborn), statistics, or features for a machine-learning model.' },
    share: { explain: 'The findings are shared as a dashboard, a notebook or a short report, so managers can make decisions. Saving the SQL with the report lets anyone rerun it on fresh data.' }
  }
};
