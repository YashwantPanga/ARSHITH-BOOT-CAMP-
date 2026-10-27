// Detailed, step-by-step sections for SQL modules 11-15 (see sql-sections.part1.js).
export default {
  'sql-mod-11': [
    {
      heading: 'What is a subquery?',
      text: 'A subquery is a SELECT written inside brackets within another statement. The database runs the inner query first and uses its answer in the outer query. Use one when a question needs another answer first: "who earns more than the average?" needs the average.',
      syntax: 'SELECT columns\nFROM table_name\nWHERE column operator (SELECT ... );',
      code: 'SELECT first_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);',
      note: 'Run SELECT AVG(salary) FROM employees; on its own first: 71750. Then the whole query makes sense.'
    },
    {
      heading: 'Subquery that returns one value',
      text: 'A subquery used with =, <, > etc. must return exactly one value (one row, one column). Aggregates like MAX, MIN and AVG are perfect for this.',
      code: 'SELECT name, price\nFROM products\nWHERE price = (SELECT MAX(price) FROM products);',
      note: 'If the subquery returned several rows, = would not know which one to compare with.'
    },
    {
      heading: 'Subquery with IN',
      text: 'When the subquery returns a list (one column, many rows), use IN. Here: customers who have at least one delivered order.',
      syntax: 'WHERE column IN (SELECT column FROM ...)',
      code: "SELECT name, city\nFROM customers\nWHERE customer_id IN (\n    SELECT customer_id FROM orders WHERE status = 'DELIVERED'\n);"
    },
    {
      heading: 'NOT IN',
      text: 'NOT IN keeps the values that are not in the list - here products that were never ordered.',
      code: "INSERT INTO products VALUES (6, 'Webcam', 'Electronics', 89);\n\nSELECT name\nFROM products\nWHERE product_id NOT IN (SELECT product_id FROM order_items);",
      note: 'Careful: if the subquery list contains a NULL, NOT IN returns no rows at all. NOT EXISTS (below) does not have this problem.'
    },
    {
      heading: 'Subquery in FROM (a derived table)',
      text: 'A subquery can also act as a temporary table in FROM. Give it an alias and select from it like any table.',
      code: 'SELECT dept_id, avg_salary\nFROM (\n    SELECT dept_id, ROUND(AVG(salary)) AS avg_salary\n    FROM employees\n    GROUP BY dept_id\n) AS dept_avg\nWHERE avg_salary > 60000;'
    },
    {
      heading: 'Correlated subquery',
      text: 'A correlated subquery refers to the current row of the outer query, so it runs once per row. Here, each employee is compared with the average salary of their own department.',
      code: 'SELECT e.first_name, e.dept_id, e.salary\nFROM employees AS e\nWHERE e.salary > (\n    SELECT AVG(x.salary) FROM employees AS x WHERE x.dept_id = e.dept_id\n);'
    },
    {
      heading: 'EXISTS and NOT EXISTS',
      text: 'EXISTS is true when the subquery returns at least one row. It is usually correlated: "customers for whom an order exists". NOT EXISTS is the opposite.',
      syntax: 'WHERE EXISTS (SELECT 1 FROM ... WHERE ...)',
      code: "INSERT INTO customers VALUES (6, 'Kiran Rao', 'Goa', '2024-08-01');\n\nSELECT c.name\nFROM customers AS c\nWHERE NOT EXISTS (\n    SELECT 1 FROM orders AS o WHERE o.customer_id = c.customer_id\n);",
      note: 'SELECT 1 is a convention: EXISTS only cares whether a row exists, not what is in it.'
    },
    {
      heading: 'ANY and ALL',
      text: 'ANY and ALL compare a value with every value a subquery returns: > ALL (...) means "greater than all of them", > ANY (...) "greater than at least one". They work in MySQL, PostgreSQL, SQL Server and Oracle, but not in SQLite. The same questions can always be written with MAX and MIN.',
      syntax: "WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 2)\n-- same as:\nWHERE salary > (SELECT MAX(salary) FROM employees WHERE dept_id = 2)",
      code: 'SELECT first_name, salary\nFROM employees\nWHERE salary > (SELECT MAX(salary) FROM employees WHERE dept_id = 2);',
      note: 'This finds everyone who earns more than every person in Sales.'
    },
    {
      heading: 'UNION and UNION ALL',
      text: 'UNION puts the results of two SELECTs one below the other. Both must have the same number of columns, in the same order, with similar types. UNION removes duplicates; UNION ALL keeps them and is faster.',
      syntax: 'SELECT columns FROM table1\nUNION [ALL]\nSELECT columns FROM table2;',
      code: "SELECT city FROM customers\nUNION\nSELECT location FROM departments\nORDER BY city;",
      note: 'The result column takes its name from the first SELECT (city). Change UNION to UNION ALL to see the duplicate cities return.'
    },
    {
      heading: 'INTERSECT and EXCEPT',
      text: 'INTERSECT keeps rows found in both results; EXCEPT keeps rows in the first result that are not in the second. Oracle calls EXCEPT "MINUS".',
      code: "SELECT city FROM customers\nINTERSECT\nSELECT location FROM departments;",
      note: 'Hyderabad and Mumbai have both customers and a company office.'
    },
    {
      heading: 'WITH: common table expressions (CTE)',
      text: 'WITH gives a subquery a name at the top of the query. The main query then uses that name like a table. Long queries become a series of small, readable steps.',
      syntax: 'WITH step_name AS (\n    SELECT ...\n)\nSELECT ... FROM step_name;',
      code: "WITH delivered AS (\n    SELECT customer_id, SUM(total_amount) AS spent\n    FROM orders\n    WHERE status = 'DELIVERED'\n    GROUP BY customer_id\n)\nSELECT c.name, d.spent\nFROM delivered AS d\nJOIN customers AS c ON c.customer_id = d.customer_id\nORDER BY d.spent DESC;",
      note: 'Several steps are separated by commas: WITH a AS (...), b AS (... FROM a ...) SELECT ... FROM b;'
    }
  ],

  'sql-mod-12': [
    {
      heading: 'UPPER and LOWER',
      text: 'UPPER changes text to capital letters, LOWER to small letters. They are often used to compare text without worrying about case.',
      syntax: 'UPPER(text)   LOWER(text)',
      code: "SELECT first_name,\n       UPPER(first_name) AS upper_name,\n       LOWER(email)      AS lower_email\nFROM employees;"
    },
    {
      heading: 'LENGTH',
      text: 'LENGTH returns the number of characters in a text value.',
      code: 'SELECT name, LENGTH(name) AS letters\nFROM products\nORDER BY letters DESC;',
      note: 'MySQL: CHAR_LENGTH(text). SQL Server: LEN(text).'
    },
    {
      heading: 'SUBSTR and INSTR: parts of text',
      text: 'SUBSTR(text, start, length) cuts out part of a text; positions start at 1. INSTR(text, find) returns the position where find first appears (0 if not found). Together they can split an email into user name and domain.',
      syntax: 'SUBSTR(text, start_position, length)\nINSTR(text, text_to_find)',
      code: "SELECT email,\n       SUBSTR(email, 1, INSTR(email, '@') - 1) AS user_name,\n       SUBSTR(email, INSTR(email, '@') + 1)    AS domain\nFROM employees;",
      note: 'SQL Server writes SUBSTRING and CHARINDEX; MySQL accepts SUBSTRING and LOCATE.'
    },
    {
      heading: 'REPLACE and TRIM',
      text: 'REPLACE swaps every occurrence of one piece of text for another. TRIM removes spaces from both ends (LTRIM and RTRIM do one side only).',
      code: "SELECT REPLACE('98765-43210', '-', '')   AS phone_digits,\n       TRIM('   Arshith   ')             AS trimmed,\n       REPLACE(name, ' ', '_')            AS code_name\nFROM products;"
    },
    {
      heading: 'Joining text',
      text: '|| joins text values. Combine it with other functions to build labels.',
      code: "SELECT UPPER(SUBSTR(first_name, 1, 1)) || '. ' || last_name AS short_name,\n       first_name || ' (' || email || ')'               AS contact\nFROM employees;"
    },
    {
      heading: 'Number functions',
      text: 'ROUND rounds to a number of decimal places, ABS removes the minus sign, and % gives the remainder of a division.',
      table: {
        headers: ['Function', 'Example', 'Result'],
        rows: [
          ['ROUND(x, d)', 'ROUND(87.456, 1)', '87.5'],
          ['ROUND(x)', 'ROUND(87.6)', '88'],
          ['ABS(x)', 'ABS(-15)', '15'],
          ['x % y', '17 % 5', '2'],
          ['CAST(x AS INTEGER)', 'CAST(87.9 AS INTEGER)', '87 (cuts off decimals)']
        ]
      },
      code: 'SELECT name,\n       price,\n       ROUND(price * 0.82, 2)        AS price_in_usd_guess,\n       CAST(price / 100 AS INTEGER)  AS hundreds\nFROM products;'
    },
    {
      heading: 'Date functions (SQLite)',
      text: "SQLite stores dates as text such as '2024-06-01' and has functions to work with them. Date functions are the part of SQL that differs most between databases - the table shows the matching MySQL and PostgreSQL versions.",
      table: {
        headers: ['Task', 'SQLite', 'MySQL', 'PostgreSQL'],
        rows: [
          ["Today", "date('now')", 'CURDATE()', 'CURRENT_DATE'],
          ['Year of a date', "strftime('%Y', d)", 'YEAR(d)', 'EXTRACT(YEAR FROM d)'],
          ['Add 30 days', "date(d, '+30 days')", 'DATE_ADD(d, INTERVAL 30 DAY)', "d + INTERVAL '30 days'"],
          ['Days between', 'julianday(a) - julianday(b)', 'DATEDIFF(a, b)', 'a - b']
        ]
      },
      code: "SELECT first_name,\n       hire_date,\n       strftime('%Y', hire_date)    AS year_joined,\n       strftime('%m', hire_date)    AS month_joined,\n       date(hire_date, '+1 year')   AS first_anniversary\nFROM employees\nORDER BY hire_date;"
    },
    {
      heading: 'Days between two dates',
      text: 'julianday turns a date into a day number, so subtracting two of them gives the number of days in between.',
      code: "SELECT order_id,\n       order_date,\n       CAST(julianday('2024-07-31') - julianday(order_date) AS INTEGER) AS days_before_month_end\nFROM orders;"
    },
    {
      heading: 'COALESCE and IFNULL: replacing NULL',
      text: 'COALESCE returns the first value in its list that is not NULL. It is the standard way to show a default instead of an empty value. IFNULL (SQLite, MySQL) and ISNULL (SQL Server) do the same with two values.',
      syntax: 'COALESCE(value1, value2, ..., default)',
      code: "SELECT first_name,\n       COALESCE(manager_id, 'no manager') AS manager\nFROM employees;"
    },
    {
      heading: 'NULLIF',
      text: 'NULLIF(a, b) returns NULL when a equals b, otherwise a. Its most common use: avoiding division by zero.',
      code: 'SELECT 100 / NULLIF(0, 0)   AS safe_division,\n       NULLIF(5, 0)          AS kept;',
      note: 'Dividing by NULL gives NULL instead of an error.'
    },
    {
      heading: 'CASE: if-then-else',
      text: 'CASE goes through its WHEN conditions in order and returns the THEN value of the first true one. ELSE is used when none is true (without ELSE you get NULL). Always finish with END.',
      syntax: 'CASE\n    WHEN condition1 THEN result1\n    WHEN condition2 THEN result2\n    ELSE other_result\nEND',
      code: "SELECT first_name,\n       salary,\n       CASE\n           WHEN salary >= 80000 THEN 'High'\n           WHEN salary >= 60000 THEN 'Medium'\n           ELSE 'Low'\n       END AS salary_band\nFROM employees\nORDER BY salary DESC;",
      note: 'Put the strictest condition first. If >= 60000 came first, every high earner would be labelled Medium.'
    },
    {
      heading: 'CASE inside SUM: counting by condition',
      text: 'CASE inside SUM or COUNT counts or adds only the rows you choose. This turns rows into columns - a small pivot table.',
      code: "SELECT COUNT(*) AS all_orders,\n       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'PENDING'   THEN 1 ELSE 0 END) AS pending,\n       SUM(CASE WHEN status = 'CANCELLED' THEN total_amount ELSE 0 END) AS cancelled_value\nFROM orders;"
    }
  ],

  'sql-mod-13': [
    {
      heading: 'What is a view?',
      text: 'A view is a saved SELECT with a name. It does not store any data of its own: every time you read it, its query runs on the current data. Views make long queries reusable and can hide columns (such as salaries) from users who should not see them.',
      syntax: 'CREATE VIEW view_name AS\nSELECT columns FROM tables WHERE condition;',
      code: "CREATE VIEW employee_directory AS\nSELECT e.first_name || ' ' || e.last_name AS employee,\n       d.dept_name,\n       d.location\nFROM employees AS e\nJOIN departments AS d ON d.dept_id = e.dept_id;\n\nSELECT * FROM employee_directory;"
    },
    {
      heading: 'Using a view like a table',
      text: 'You can filter, sort and join a view exactly like a table.',
      code: "CREATE VIEW employee_directory AS\nSELECT e.first_name AS employee, d.dept_name, d.location\nFROM employees AS e\nJOIN departments AS d ON d.dept_id = e.dept_id;\n\nSELECT employee, dept_name\nFROM employee_directory\nWHERE location = 'Hyderabad'\nORDER BY employee;",
      note: 'Because the view runs its query each time, it always shows the latest data.'
    },
    {
      heading: 'Changing and removing a view',
      text: 'To change a view, drop it and create it again (MySQL and PostgreSQL also offer CREATE OR REPLACE VIEW). DROP VIEW removes only the view, never the data in the tables.',
      syntax: 'DROP VIEW IF EXISTS view_name;\nCREATE OR REPLACE VIEW view_name AS SELECT ...;   -- MySQL, PostgreSQL',
      code: "CREATE VIEW cheap_products AS SELECT name, price FROM products WHERE price < 100;\nDROP VIEW cheap_products;\nCREATE VIEW cheap_products AS SELECT name, price FROM products WHERE price < 300;\n\nSELECT * FROM cheap_products;"
    },
    {
      heading: 'What is an index?',
      text: 'Finding rows with WHERE email = \'...\' in a big table means reading every row - a full table scan. An index is a sorted list of a column\'s values with pointers to the rows, like the index at the back of a book. With it the database jumps straight to the matching rows.',
      table: {
        headers: ['Good columns to index', 'Usually not worth indexing'],
        rows: [
          ['Used often in WHERE', 'Tiny tables'],
          ['Used in JOIN ... ON (foreign keys)', 'Rarely searched columns'],
          ['Used in ORDER BY', 'Columns with very few different values (yes / no)']
        ]
      },
      note: 'Primary key and UNIQUE columns already have an index automatically.'
    },
    {
      heading: 'CREATE INDEX',
      text: 'CREATE INDEX builds an index on one or more columns. Queries do not change - the database simply becomes faster at finding rows.',
      syntax: 'CREATE INDEX index_name ON table_name (column1, column2, ...);',
      code: 'CREATE INDEX idx_orders_customer ON orders (customer_id);\n\nSELECT name AS index_name, tbl_name AS on_table\nFROM sqlite_master\nWHERE type = \'index\' AND name LIKE \'idx_%\';'
    },
    {
      heading: 'Seeing whether an index is used: EXPLAIN',
      text: 'EXPLAIN QUERY PLAN (SQLite) or EXPLAIN (MySQL, PostgreSQL) shows how the database will run a query. SCAN means it reads the whole table; SEARCH ... USING INDEX means it uses an index.',
      code: 'CREATE INDEX idx_orders_customer ON orders (customer_id);\n\nEXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 1;',
      note: 'Remove the CREATE INDEX line and run again: the plan changes to SCAN orders.'
    },
    {
      heading: 'UNIQUE and composite indexes',
      text: 'A UNIQUE index also refuses duplicate values, like a UNIQUE constraint. A composite index covers several columns and helps queries that filter on the first column, or on the first and second together.',
      syntax: 'CREATE UNIQUE INDEX index_name ON table_name (column);\nCREATE INDEX index_name ON table_name (column1, column2);',
      code: "CREATE INDEX idx_orders_status_date ON orders (status, order_date);\n\nEXPLAIN QUERY PLAN\nSELECT order_id FROM orders\nWHERE status = 'DELIVERED' AND order_date >= '2024-06-05';"
    },
    {
      heading: 'DROP INDEX and the cost of indexes',
      text: 'Indexes speed up reading but every INSERT, UPDATE and DELETE must also update them, and they use disk space. Create the ones your real queries need, and drop indexes nobody uses.',
      syntax: 'DROP INDEX index_name;',
      code: "CREATE INDEX idx_products_name ON products (name);\nDROP INDEX idx_products_name;\n\nSELECT COUNT(*) AS my_indexes\nFROM sqlite_master\nWHERE type = 'index' AND name LIKE 'idx_%';"
    },
    {
      heading: 'Tips for fast queries',
      text: 'A few habits keep queries fast as data grows.',
      bulletPoints: [
        'Select only the columns you need instead of SELECT *.',
        'Filter early with WHERE so fewer rows are processed.',
        "Do not wrap an indexed column in a function in WHERE: WHERE UPPER(email) = 'X' cannot use a normal index on email.",
        "A LIKE pattern that starts with % ('%gmail.com') cannot use an index; 'aarav%' can.",
        'Index the foreign key columns you join on.'
      ],
      note: 'Stored procedures (CREATE PROCEDURE) and triggers save logic inside MySQL, PostgreSQL and SQL Server. SQLite supports triggers but not stored procedures.'
    }
  ],

  'sql-mod-14': [
    {
      heading: 'What is a transaction?',
      text: 'A transaction is a group of statements that must succeed or fail together. Moving money between two accounts takes two UPDATEs; if only the first one ran, money would disappear. Inside a transaction, either both are saved or neither is.',
      table: {
        headers: ['Command', 'What it does'],
        rows: [
          ['BEGIN / START TRANSACTION', 'Start a transaction'],
          ['COMMIT', 'Save all changes made since BEGIN'],
          ['ROLLBACK', 'Undo all changes made since BEGIN'],
          ['SAVEPOINT name', 'Mark a point inside the transaction'],
          ['ROLLBACK TO name', 'Undo only back to that point']
        ]
      },
      note: 'Without BEGIN, databases save every statement on its own as soon as it runs (autocommit).'
    },
    {
      heading: 'BEGIN and COMMIT',
      text: 'Start with BEGIN, run the statements, then COMMIT to save them all together.',
      syntax: 'BEGIN;\n    statement1;\n    statement2;\nCOMMIT;',
      code: "CREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance DECIMAL(10,2));\nINSERT INTO accounts VALUES (1, 'Priya', 5000), (2, 'Rahul', 1000);\n\nBEGIN;\nUPDATE accounts SET balance = balance - 1500 WHERE id = 1;\nUPDATE accounts SET balance = balance + 1500 WHERE id = 2;\nCOMMIT;\n\nSELECT * FROM accounts;"
    },
    {
      heading: 'ROLLBACK: undo',
      text: 'ROLLBACK cancels every change since BEGIN. Here an UPDATE without WHERE wipes all balances - and ROLLBACK brings them back.',
      code: "CREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance DECIMAL(10,2));\nINSERT INTO accounts VALUES (1, 'Priya', 5000), (2, 'Rahul', 1000);\n\nBEGIN;\nUPDATE accounts SET balance = 0;   -- mistake: no WHERE\nROLLBACK;\n\nSELECT * FROM accounts;",
      note: 'Applications use ROLLBACK when something fails half-way, for example when the second UPDATE breaks a CHECK rule.'
    },
    {
      heading: 'SAVEPOINT: undo part of the work',
      text: 'A savepoint marks a spot inside a transaction. ROLLBACK TO that savepoint undoes only what came after it; the transaction continues.',
      code: "CREATE TABLE cart (item TEXT);\n\nBEGIN;\nINSERT INTO cart VALUES ('Laptop');\nSAVEPOINT extras;\nINSERT INTO cart VALUES ('Gift wrap');\nROLLBACK TO extras;\nINSERT INTO cart VALUES ('Mouse');\nCOMMIT;\n\nSELECT * FROM cart;"
    },
    {
      heading: 'ACID: what transactions promise',
      text: 'Databases guarantee four properties, remembered as ACID.',
      table: {
        headers: ['Letter', 'Property', 'In plain words'],
        rows: [
          ['A', 'Atomicity', 'All statements happen, or none do'],
          ['C', 'Consistency', 'All rules (constraints) hold before and after'],
          ['I', 'Isolation', 'Other users do not see half-finished work'],
          ['D', 'Durability', 'After COMMIT the change survives a crash or power cut']
        ]
      }
    },
    {
      heading: 'Users and permissions: GRANT and REVOKE',
      text: 'Server databases have users. GRANT gives a user a permission on a table; REVOKE takes it back. Give every user and application only the permissions it needs (the principle of least privilege). SQLite is a file used by one program, so it has no users and these commands do not run in the Practice Lab.',
      syntax: 'GRANT SELECT ON employees TO report_user;\nGRANT SELECT, INSERT, UPDATE ON orders TO shop_app;\nREVOKE UPDATE ON orders FROM shop_app;',
      bulletPoints: [
        'Permissions include SELECT, INSERT, UPDATE, DELETE, CREATE and ALL PRIVILEGES.',
        'A report user usually needs only SELECT.',
        'Never let a website connect as the database administrator.'
      ]
    },
    {
      heading: 'SQL injection: the danger',
      text: "SQL injection happens when a program builds a query by pasting user input into the SQL text. Suppose a login form searches WHERE name = '<what the user typed>'. If someone types  x' OR '1'='1  the query becomes the one below - and the condition is true for every row, so every customer is returned.",
      code: "-- the user typed:  x' OR '1'='1\nSELECT customer_id, name, city\nFROM customers\nWHERE name = 'x' OR '1'='1';",
      note: 'Attackers use this to log in without a password, read other people\'s data or delete tables.'
    },
    {
      heading: 'Preventing SQL injection: parameters',
      text: 'The fix is to never paste input into SQL. Write a placeholder (? or $1) and pass the value separately. The database then treats it purely as data, never as SQL.',
      syntax: 'Python:   cursor.execute("SELECT * FROM customers WHERE name = ?", (name,))\nNode.js:  db.query("SELECT * FROM customers WHERE name = $1", [name])\nJava:     PreparedStatement with ? placeholders',
      bulletPoints: [
        "With a parameter, the input x' OR '1'='1 is searched as a strange name - and nothing is found.",
        'Also check input (length, format) and give the application account limited permissions.'
      ]
    }
  ],

  'sql-mod-15': [
    {
      heading: 'Window functions: OVER',
      text: 'A window function calculates across a group of rows related to the current row, but unlike GROUP BY it keeps every row. You recognise it by OVER (...). Inside OVER, ORDER BY sets the order and PARTITION BY splits the rows into groups.',
      syntax: 'FUNCTION() OVER (PARTITION BY column ORDER BY column)',
      code: 'SELECT first_name,\n       dept_id,\n       salary,\n       ROUND(AVG(salary) OVER (PARTITION BY dept_id)) AS dept_average\nFROM employees\nORDER BY dept_id, salary DESC;',
      note: 'Every employee row stays, and each one also shows the average of its own department.'
    },
    {
      heading: 'ROW_NUMBER',
      text: 'ROW_NUMBER numbers the rows 1, 2, 3... in the order given inside OVER.',
      code: 'SELECT ROW_NUMBER() OVER (ORDER BY hire_date) AS joining_order,\n       first_name,\n       hire_date\nFROM employees;'
    },
    {
      heading: 'RANK and DENSE_RANK',
      text: 'RANK and DENSE_RANK give equal values the same rank. After a tie, RANK skips numbers (1, 1, 3) while DENSE_RANK does not (1, 1, 2).',
      code: 'SELECT name,\n       category,\n       price,\n       RANK()       OVER (ORDER BY category) AS rank_by_category,\n       DENSE_RANK() OVER (ORDER BY category) AS dense_rank_by_category\nFROM products;'
    },
    {
      heading: 'Ranking inside groups: PARTITION BY',
      text: 'PARTITION BY restarts the numbering for every group. Here each department has its own ranking from the highest salary down.',
      code: 'SELECT dept_id,\n       first_name,\n       salary,\n       RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank_in_dept\nFROM employees\nORDER BY dept_id, rank_in_dept;'
    },
    {
      heading: 'Top N per group',
      text: 'Window functions cannot be used in WHERE, so put the ranking in a CTE and filter outside it. This returns the highest-paid employee of each department.',
      code: 'WITH ranked AS (\n    SELECT dept_id, first_name, salary,\n           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn\n    FROM employees\n)\nSELECT dept_id, first_name, salary\nFROM ranked\nWHERE rn = 1;'
    },
    {
      heading: 'Running totals',
      text: 'SUM(...) OVER (ORDER BY ...) adds each row to the total of the rows before it - a running total.',
      code: "SELECT order_date,\n       total_amount,\n       SUM(total_amount) OVER (ORDER BY order_date) AS running_total\nFROM orders\nWHERE status <> 'CANCELLED';"
    },
    {
      heading: 'LAG and LEAD: compare with the previous row',
      text: 'LAG(column) gives the value from the previous row, LEAD(column) from the next one. Useful for "change since last time".',
      code: "SELECT order_date,\n       total_amount,\n       LAG(total_amount) OVER (ORDER BY order_date) AS previous_order,\n       total_amount - LAG(total_amount) OVER (ORDER BY order_date) AS difference\nFROM orders\nWHERE status <> 'CANCELLED';",
      note: 'The first row has no previous row, so LAG gives NULL there.'
    },
    {
      heading: 'A monthly sales report',
      text: 'Reports combine what you know: WHERE to filter, a date function to make the month, GROUP BY to summarise and ORDER BY to sort.',
      code: "SELECT strftime('%Y-%m', order_date) AS month,\n       COUNT(*)                       AS orders,\n       SUM(total_amount)              AS revenue,\n       ROUND(AVG(total_amount), 2)    AS average_order\nFROM orders\nWHERE status <> 'CANCELLED'\nGROUP BY month\nORDER BY month;"
    },
    {
      heading: 'A customer summary',
      text: 'One row per customer with their number of orders, total spent and last order date, plus a CASE label. LEFT JOIN keeps customers with no (non-cancelled) orders.',
      code: "SELECT c.name,\n       COUNT(o.order_id)                AS orders,\n       COALESCE(SUM(o.total_amount), 0) AS spent,\n       MAX(o.order_date)                AS last_order,\n       CASE WHEN COALESCE(SUM(o.total_amount), 0) >= 1000 THEN 'Gold' ELSE 'Regular' END AS segment\nFROM customers AS c\nLEFT JOIN orders AS o\n       ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'\nGROUP BY c.customer_id, c.name\nORDER BY spent DESC;"
    },
    {
      heading: 'Using SQL from Python',
      text: 'Programs send SQL to a database through a driver and get rows back. Python includes sqlite3 for SQLite; MySQL and PostgreSQL have similar libraries (mysql-connector-python, psycopg). pandas can load a query result straight into a DataFrame for charts and analysis.',
      syntax: 'import sqlite3\nconn = sqlite3.connect("shop.db")\nrows = conn.execute(\n    "SELECT name, city FROM customers WHERE city = ?", ("Hyderabad",)\n).fetchall()\nfor name, city in rows:\n    print(name, city)\n\nimport pandas as pd\ndf = pd.read_sql("SELECT * FROM orders", conn)\nprint(df.groupby("status")["total_amount"].sum())',
      bulletPoints: [
        'Always pass values with ? placeholders (module 14), never by joining strings.',
        'conn.commit() saves INSERT, UPDATE and DELETE changes; conn.close() ends the connection.'
      ]
    },
    {
      heading: 'Final project',
      text: 'In the final project you put everything together: design tables with keys and constraints, load data, and answer business questions with joins, GROUP BY, subqueries and window functions. Open "Projects" on the course page for the full brief, and submit your GitHub repository there. Passing the final assessment and submitting the project earns your certificate.'
    }
  ]
};
