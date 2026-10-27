// SQL & Relational Databases - lesson text for modules 11-15 (see part1 for notes).
export default {
  'sql-mod-11': {
    description: 'Queries inside queries: subqueries with IN and EXISTS, combining results with UNION, and readable steps with WITH (CTEs).',
    readingMaterial: {
      introduction: 'Sometimes one question needs the answer to another question first: "which employees earn more than the average?" needs the average. A subquery is a SELECT inside another statement that provides that answer. In this module you also combine results with UNION and write long queries step by step with WITH.',
      objectives: [
        'Use a subquery that returns one value inside WHERE',
        'Use IN and EXISTS with a subquery that returns a list',
        'Combine the results of two queries with UNION and UNION ALL',
        'Break a long query into named steps with WITH (a CTE)'
      ],
      sections: [
        {
          heading: 'Subqueries',
          text: 'A subquery is a SELECT written inside brackets in another statement. The database runs it and uses its result.',
          table: {
            headers: ['Kind', 'Returns', 'Used with'],
            rows: [
              ['Single value', 'One value', '=, >, < ... e.g. salary > (SELECT AVG(salary) FROM employees)'],
              ['List', 'One column, many rows', 'IN / NOT IN'],
              ['Table', 'Rows and columns', 'FROM ( ... ) AS t'],
              ['Correlated', 'Runs once per outer row', 'EXISTS / NOT EXISTS']
            ]
          }
        },
        {
          heading: 'IN and EXISTS',
          text: 'IN checks whether a value appears in the list a subquery returns. EXISTS is true when the subquery returns at least one row; it is often used with a correlated subquery that refers to the outer row.',
          bulletPoints: [
            'WHERE customer_id IN (SELECT customer_id FROM orders)',
            'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)',
            'ANY and ALL compare with every value of a list (salary > ALL (...)). They work in MySQL, PostgreSQL and SQL Server, but not in SQLite - use MAX/MIN there.'
          ]
        },
        {
          heading: 'UNION and UNION ALL',
          text: 'UNION stacks the results of two SELECTs on top of each other. Both must have the same number of columns, with similar types, in the same order.',
          bulletPoints: [
            'UNION removes duplicate rows; UNION ALL keeps them (and is faster).',
            'The column names come from the first SELECT.',
            'INTERSECT returns rows in both results; EXCEPT returns rows in the first but not the second.'
          ]
        },
        {
          heading: 'WITH: common table expressions (CTE)',
          text: 'WITH gives a name to a subquery, so the main query can use it like a table. Long queries become a series of easy steps.',
          bulletPoints: [
            'WITH dept_avg AS (SELECT dept_id, AVG(salary) AS avg_sal FROM employees GROUP BY dept_id) SELECT ... FROM dept_avg ...',
            'Several CTEs are separated by commas: WITH a AS (...), b AS (...) SELECT ...'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Who earns more than the average?',
          language: 'sql',
          code: 'SELECT first_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;',
          explanation: 'The subquery returns the average salary (71750). The outer query keeps employees above it: Aarav, Diya, Vihaan and Meera.'
        },
        {
          title: 'IN and NOT EXISTS',
          language: 'sql',
          code: "-- customers who have placed at least one order\nSELECT name FROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders);\n\n-- products that were never ordered\nSELECT p.name\nFROM products AS p\nWHERE NOT EXISTS (\n    SELECT 1 FROM order_items AS oi WHERE oi.product_id = p.product_id\n);",
          explanation: 'The Lab shows the first list: all 5 customers have ordered. The second query returns no rows, because every product appears in order_items - add INSERT INTO products VALUES (6, \'Webcam\', \'Electronics\', 89); at the top and run again to see Webcam appear.'
        },
        {
          title: 'UNION: one contact list from two tables',
          language: 'sql',
          code: "SELECT first_name || ' ' || last_name AS person, 'employee' AS type\nFROM employees\nUNION ALL\nSELECT name, 'customer'\nFROM customers\nORDER BY type, person;",
          explanation: 'The two results are stacked into one list of 13 people (8 employees + 5 customers). ORDER BY at the end sorts the whole list.'
        },
        {
          title: 'WITH: compare each employee with their department average',
          language: 'sql',
          code: 'WITH dept_avg AS (\n    SELECT dept_id, AVG(salary) AS avg_salary\n    FROM employees\n    GROUP BY dept_id\n)\nSELECT e.first_name, e.salary, ROUND(d.avg_salary) AS dept_average\nFROM employees AS e\nJOIN dept_avg AS d ON d.dept_id = e.dept_id\nWHERE e.salary > d.avg_salary;',
          explanation: 'Step 1 (the CTE) works out each department\'s average. Step 2 joins it to employees and keeps those above their own department\'s average: Aarav, Kabir and Rohan.'
        }
      ],
      bestPractices: [
        'Use WITH to name the steps of a long query.',
        'Prefer UNION ALL unless you really need duplicates removed.',
        'Use NOT EXISTS instead of NOT IN when the subquery column may contain NULL.'
      ],
      commonMistakes: [
        'A single-value subquery (after =) that returns several rows - an error.',
        'UNION of SELECTs with a different number of columns.',
        'NOT IN with a list containing NULL returns no rows at all.'
      ],
      practiceExercise: {
        title: 'Above-average products',
        problem: 'Show the name and price of every product that costs more than the average product price, most expensive first.',
        solutionCode: 'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products)\nORDER BY price DESC;'
      },
      keyTakeaways: [
        'A subquery is a SELECT inside another statement.',
        'IN checks a list; EXISTS checks whether any row matches.',
        'UNION combines results and removes duplicates; UNION ALL keeps them.',
        'WITH (CTE) names a subquery so long queries read step by step.'
      ]
    }
  },

  'sql-mod-12': {
    description: 'Built-in functions for text, numbers and dates, handling NULL with COALESCE, and if-then logic with CASE.',
    readingMaterial: {
      introduction: 'SQL has many built-in functions that change values as they are read: UPPER makes text capital, ROUND rounds numbers, date functions work out ages and months. CASE adds "if ... then ... else" logic, for example to label salaries as High, Medium or Low.',
      objectives: [
        'Use common text functions such as UPPER, LENGTH, SUBSTR and REPLACE',
        'Use number functions such as ROUND and ABS',
        'Work with dates using date functions',
        'Replace NULL with COALESCE and write conditions with CASE'
      ],
      sections: [
        {
          heading: 'Text functions',
          text: 'The names below work in SQLite; most are the same in other databases.',
          table: {
            headers: ['Function', 'Example', 'Result'],
            rows: [
              ['UPPER / LOWER', "UPPER('sql')", 'SQL'],
              ['LENGTH', "LENGTH('Aarav')", '5 (MySQL: CHAR_LENGTH)'],
              ['SUBSTR(text, start, length)', "SUBSTR('Hyderabad', 1, 3)", 'Hyd (SQL Server: SUBSTRING)'],
              ['REPLACE', "REPLACE('a-b-c', '-', ' ')", 'a b c'],
              ['TRIM', "TRIM('  hi  ')", 'hi'],
              ['|| (join)', "'Hi ' || 'there'", 'Hi there (MySQL: CONCAT)'],
              ['INSTR', "INSTR('aarav@arb.io', '@')", '6']
            ]
          }
        },
        {
          heading: 'Number functions',
          text: 'Arithmetic plus a few helpers.',
          bulletPoints: [
            'ROUND(87.456, 1) gives 87.5. ROUND(value) rounds to a whole number.',
            'ABS(-5) gives 5.',
            '% gives the remainder: 7 % 3 is 1.',
            'MAX and MIN with two values (SQLite) or GREATEST / LEAST (MySQL, PostgreSQL) pick the larger or smaller value.'
          ]
        },
        {
          heading: 'Date functions',
          text: "Date functions are the part that differs most between databases. In SQLite dates are text like '2024-06-01' and these functions work on them:",
          table: {
            headers: ['SQLite', 'Meaning', 'MySQL / PostgreSQL'],
            rows: [
              ["date('now')", "Today's date", 'CURDATE() / CURRENT_DATE'],
              ["strftime('%Y', hire_date)", 'Year as text', 'YEAR(hire_date) / EXTRACT(YEAR FROM ...)'],
              ["strftime('%m', hire_date)", 'Month', 'MONTH(hire_date)'],
              ["date(hire_date, '+30 days')", 'Add 30 days', "DATE_ADD(..., INTERVAL 30 DAY) / + INTERVAL '30 days'"],
              ['julianday(a) - julianday(b)', 'Days between two dates', 'DATEDIFF(a, b) / a - b']
            ]
          }
        },
        {
          heading: 'NULL helpers',
          text: 'COALESCE(a, b, c) returns the first value that is not NULL. It is used to show a default instead of an empty value.',
          bulletPoints: [
            "COALESCE(manager_id, 0) or COALESCE(signup_date, 'unknown').",
            'IFNULL (SQLite, MySQL) and ISNULL (SQL Server) do the same with two values.',
            'NULLIF(a, b) returns NULL when a equals b - useful to avoid dividing by zero.'
          ]
        },
        {
          heading: 'CASE: if-then-else',
          text: 'CASE checks conditions in order and returns the value of the first one that is true. ELSE is used when none is true.',
          bulletPoints: [
            "CASE WHEN salary >= 80000 THEN 'High' WHEN salary >= 60000 THEN 'Medium' ELSE 'Low' END",
            'CASE can be used in SELECT, ORDER BY, and inside aggregates: SUM(CASE WHEN status = \'DELIVERED\' THEN 1 ELSE 0 END).'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Text functions',
          language: 'sql',
          code: "SELECT UPPER(first_name)                 AS name_caps,\n       LENGTH(first_name)                AS letters,\n       SUBSTR(email, 1, INSTR(email, '@') - 1) AS username,\n       LOWER(SUBSTR(last_name, 1, 3))    AS short_code\nFROM employees;",
          explanation: "For Aarav Sharma: AARAV, 5, aarav, sha. INSTR finds the position of @ so SUBSTR can cut the username out of the email."
        },
        {
          title: 'Dates: year joined and days employed',
          language: 'sql',
          code: "SELECT first_name,\n       hire_date,\n       strftime('%Y', hire_date)  AS year_joined,\n       date(hire_date, '+90 days') AS probation_ends,\n       CAST(julianday('2025-01-01') - julianday(hire_date) AS INTEGER) AS days_to_2025\nFROM employees\nORDER BY hire_date;",
          explanation: 'For each employee: the year they joined, the date 90 days after joining, and how many days they had worked by 1 January 2025.'
        },
        {
          title: 'CASE: salary bands',
          language: 'sql',
          code: "SELECT first_name,\n       salary,\n       CASE\n           WHEN salary >= 80000 THEN 'High'\n           WHEN salary >= 60000 THEN 'Medium'\n           ELSE 'Low'\n       END AS band\nFROM employees\nORDER BY salary DESC;",
          explanation: 'Aarav and Diya are High; Vihaan, Meera, Kabir and Rohan are Medium; Ananya and Isha are Low.'
        },
        {
          title: 'COALESCE and CASE inside a summary',
          language: 'sql',
          code: "SELECT COALESCE(manager_id, 'none') AS manager,\n       COUNT(*) AS people\nFROM employees\nGROUP BY manager_id;\n\nSELECT COUNT(*) AS orders,\n       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled\nFROM orders;",
          explanation: 'The first query shows "none" instead of NULL. The second (shown in the Lab) counts 6 orders: 3 delivered and 1 cancelled, in one row.'
        }
      ],
      bestPractices: [
        'Always give function results an alias.',
        'Store dates in YYYY-MM-DD format so date functions and sorting work.',
        'Put the most specific CASE condition first - the first true WHEN wins.'
      ],
      commonMistakes: [
        'Forgetting END at the end of a CASE.',
        'Expecting function names to be identical in every database (LENGTH vs LEN, SUBSTR vs SUBSTRING).',
        'Ordering CASE conditions badly: WHEN salary >= 60000 before WHEN salary >= 80000 labels everybody Medium.'
      ],
      practiceExercise: {
        title: 'Price labels',
        problem: "For every product show name, price and a column price_band: 'Premium' if price is 1000 or more, 'Standard' if 200 or more, otherwise 'Budget'. Also show the name in capital letters as name_caps.",
        solutionCode: "SELECT name,\n       price,\n       CASE\n           WHEN price >= 1000 THEN 'Premium'\n           WHEN price >= 200  THEN 'Standard'\n           ELSE 'Budget'\n       END AS price_band,\n       UPPER(name) AS name_caps\nFROM products;"
      },
      keyTakeaways: [
        'Text functions: UPPER, LOWER, LENGTH, SUBSTR, REPLACE, TRIM, ||.',
        'ROUND, ABS and % work on numbers; date functions differ between databases.',
        'COALESCE returns the first non-NULL value.',
        'CASE WHEN ... THEN ... ELSE ... END adds if-then logic.'
      ]
    }
  },

  'sql-mod-13': {
    description: 'Save queries as views, speed up searches with indexes, and see how the database runs a query with EXPLAIN.',
    readingMaterial: {
      introduction: 'As a database grows, two things matter: reusing good queries, and keeping them fast. A view saves a query under a name so it can be used like a table. An index works like the index at the back of a book: the database can jump to the right rows instead of reading the whole table.',
      objectives: [
        'Create, use and drop a view',
        'Explain what an index is and when it helps',
        'Create an index and a unique index',
        'Read a simple query plan with EXPLAIN QUERY PLAN'
      ],
      sections: [
        {
          heading: 'Views',
          text: 'A view is a saved SELECT with a name. It does not store data itself; every time you read the view, its query runs on the current data.',
          bulletPoints: [
            'CREATE VIEW view_name AS SELECT ...;',
            'Use it like a table: SELECT * FROM view_name WHERE ...;',
            'Views hide complex joins and can show users only some columns (for example, no salaries).',
            'DROP VIEW view_name; removes the view, not the data.'
          ]
        },
        {
          heading: 'Indexes',
          text: 'Without an index, finding rows with WHERE email = ... means checking every row (a full table scan). An index keeps the values of a column sorted with pointers to the rows, so the database finds them quickly.',
          table: {
            headers: ['Good to index', 'Usually not worth it'],
            rows: [
              ['Columns used often in WHERE', 'Very small tables'],
              ['Columns used in JOIN ... ON (foreign keys)', 'Columns that are rarely searched'],
              ['Columns used in ORDER BY', 'Columns with very few different values (yes/no)']
            ]
          },
          bulletPoints: [
            'Primary keys and UNIQUE columns get an index automatically.',
            'Indexes make reading faster but INSERT, UPDATE and DELETE a little slower, and they use space.'
          ]
        },
        {
          heading: 'Seeing the plan: EXPLAIN',
          text: 'EXPLAIN shows how the database plans to run a query. In SQLite write EXPLAIN QUERY PLAN; in MySQL and PostgreSQL write EXPLAIN.',
          bulletPoints: [
            'SCAN employees means every row is read.',
            'SEARCH employees USING INDEX ... means an index is used to jump to the rows.'
          ]
        },
        {
          heading: 'Writing fast queries',
          text: 'A few simple habits keep queries quick.',
          bulletPoints: [
            'Select only the columns you need.',
            'Filter with WHERE as early as possible.',
            'Avoid functions on an indexed column in WHERE (WHERE UPPER(email) = ... cannot use a normal index on email).',
            "A pattern that starts with % (LIKE '%abc') cannot use an index."
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Create and use a view',
          language: 'sql',
          code: "DROP VIEW IF EXISTS employee_directory;\n\nCREATE VIEW employee_directory AS\nSELECT e.first_name || ' ' || e.last_name AS employee,\n       d.dept_name,\n       d.location\nFROM employees AS e\nJOIN departments AS d ON d.dept_id = e.dept_id;\n\nSELECT * FROM employee_directory\nWHERE location = 'Hyderabad';",
          explanation: 'The view hides the join and the salaries. Reading it with a WHERE returns the 3 Hyderabad (Engineering) employees.'
        },
        {
          title: 'Index: before and after',
          language: 'sql',
          code: "EXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 1;\n\nCREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);\n\nEXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE customer_id = 1;",
          explanation: 'Before the index the plan says SCAN orders (read every row). After CREATE INDEX it says SEARCH orders USING INDEX idx_orders_customer. The Lab shows the last plan.'
        },
        {
          title: 'A unique index blocks duplicates',
          language: 'sql',
          code: "DROP TABLE IF EXISTS newsletter;\nCREATE TABLE newsletter (email TEXT);\nCREATE UNIQUE INDEX idx_newsletter_email ON newsletter(email);\n\nINSERT INTO newsletter VALUES ('a@mail.com');\nINSERT INTO newsletter VALUES ('b@mail.com');\n\nSELECT * FROM newsletter;",
          explanation: "Like a UNIQUE constraint, a unique index makes the database refuse a second 'a@mail.com'. Add that INSERT and run again to see the error."
        }
      ],
      bestPractices: [
        'Index foreign key columns that are used in joins.',
        'Use views to give reports a simple, stable name.',
        'Check slow queries with EXPLAIN before adding indexes.'
      ],
      commonMistakes: [
        'Adding an index on every column - it slows down every change.',
        'Thinking a view stores a copy of the data. It runs its query each time.',
        'Expecting LIKE \'%text\' to use an index.'
      ],
      practiceExercise: {
        title: 'Sales view',
        problem: "Create a view delivered_orders that shows order_id, the customer's name and total_amount for orders with status 'DELIVERED'. Then select from the view the orders worth more than 100.",
        solutionCode: "DROP VIEW IF EXISTS delivered_orders;\n\nCREATE VIEW delivered_orders AS\nSELECT o.order_id, c.name, o.total_amount\nFROM orders AS o\nJOIN customers AS c ON c.customer_id = o.customer_id\nWHERE o.status = 'DELIVERED';\n\nSELECT * FROM delivered_orders\nWHERE total_amount > 100;"
      },
      keyTakeaways: [
        'A view is a saved query that can be used like a table.',
        'An index helps the database find rows without reading the whole table.',
        'Indexes speed up reads but slow down writes a little.',
        'EXPLAIN shows whether a query scans the table or uses an index.'
      ]
    }
  },

  'sql-mod-14': {
    description: 'Group changes into transactions with COMMIT and ROLLBACK, the ACID properties, user permissions, and protecting apps from SQL injection.',
    readingMaterial: {
      introduction: 'Some changes must happen together or not at all. Moving money from one account to another is two UPDATEs: if the first runs and the second fails, money disappears. A transaction groups statements so they are saved together (COMMIT) or undone together (ROLLBACK). This module also covers who may do what in a database, and how to keep applications safe.',
      objectives: [
        'Use BEGIN, COMMIT and ROLLBACK',
        'Explain the four ACID properties',
        'Know how GRANT and REVOKE control permissions',
        'Explain SQL injection and how parameters prevent it'
      ],
      sections: [
        {
          heading: 'Transactions',
          text: 'A transaction is a group of statements treated as one unit of work.',
          table: {
            headers: ['Command', 'What it does'],
            rows: [
              ['BEGIN (or START TRANSACTION)', 'Start a transaction'],
              ['COMMIT', 'Save every change since BEGIN'],
              ['ROLLBACK', 'Undo every change since BEGIN'],
              ['SAVEPOINT name / ROLLBACK TO name', 'Undo only back to a point inside the transaction']
            ]
          },
          bulletPoints: [
            'Without BEGIN, most databases commit each statement on its own (autocommit).'
          ]
        },
        {
          heading: 'ACID',
          text: 'Databases promise four properties for transactions.',
          table: {
            headers: ['Letter', 'Property', 'Meaning'],
            rows: [
              ['A', 'Atomicity', 'All the statements happen, or none of them'],
              ['C', 'Consistency', 'The rules (constraints) are true before and after'],
              ['I', 'Isolation', 'Transactions running at the same time do not see each other\'s half-finished work'],
              ['D', 'Durability', 'After COMMIT, the change survives a crash or power cut']
            ]
          }
        },
        {
          heading: 'Users and permissions (DCL)',
          text: 'Server databases such as MySQL, PostgreSQL and SQL Server have users. GRANT gives a user permission; REVOKE takes it away. (SQLite is a file used by one app, so it has no users.)',
          bulletPoints: [
            'GRANT SELECT ON employees TO report_user;',
            'GRANT SELECT, INSERT, UPDATE ON orders TO shop_app;',
            'REVOKE UPDATE ON orders FROM shop_app;',
            'Give each user only the permissions they need (least privilege).'
          ]
        },
        {
          heading: 'SQL injection',
          text: "SQL injection happens when an app builds SQL by pasting user input into the text. If a user types ' OR '1'='1 into a login box, the query can turn into one that matches every user. The fix is to never paste input into SQL: use parameters (placeholders) and let the database driver pass the values separately.",
          bulletPoints: [
            "Unsafe: \"SELECT * FROM users WHERE email = '\" + email + \"'\"",
            'Safe (Python): cursor.execute("SELECT * FROM users WHERE email = ?", (email,))',
            'Safe (Node.js): db.query("SELECT * FROM users WHERE email = $1", [email])'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'COMMIT: save a group of changes',
          language: 'sql',
          code: "DROP TABLE IF EXISTS accounts;\nCREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance DECIMAL(10,2) CHECK (balance >= 0));\nINSERT INTO accounts VALUES (1, 'Priya', 5000), (2, 'Rahul', 1000);\n\nBEGIN;\nUPDATE accounts SET balance = balance - 1500 WHERE id = 1;\nUPDATE accounts SET balance = balance + 1500 WHERE id = 2;\nCOMMIT;\n\nSELECT * FROM accounts;",
          explanation: 'Both updates are saved together: Priya now has 3500 and Rahul 2500. The total is still 6000.'
        },
        {
          title: 'ROLLBACK: undo a mistake',
          language: 'sql',
          code: "DROP TABLE IF EXISTS accounts;\nCREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance DECIMAL(10,2));\nINSERT INTO accounts VALUES (1, 'Priya', 5000), (2, 'Rahul', 1000);\n\nBEGIN;\nUPDATE accounts SET balance = 0;   -- oops, no WHERE!\nROLLBACK;                          -- undo it\n\nSELECT * FROM accounts;",
          explanation: 'The UPDATE without WHERE set every balance to 0, but ROLLBACK undid it. The balances are back to 5000 and 1000.'
        },
        {
          title: 'SAVEPOINT: undo part of a transaction',
          language: 'sql',
          code: "DROP TABLE IF EXISTS cart;\nCREATE TABLE cart (item TEXT);\n\nBEGIN;\nINSERT INTO cart VALUES ('Laptop');\nSAVEPOINT before_extras;\nINSERT INTO cart VALUES ('Gift wrap');\nROLLBACK TO before_extras;\nINSERT INTO cart VALUES ('Mouse');\nCOMMIT;\n\nSELECT * FROM cart;",
          explanation: 'Only Gift wrap is undone. The cart keeps Laptop and Mouse.'
        }
      ],
      bestPractices: [
        'Wrap changes that belong together (a payment and its record) in one transaction.',
        'Keep transactions short so other users are not kept waiting.',
        'Always use parameters for user input; never build SQL by joining strings.',
        'Give applications only the permissions they need.'
      ],
      commonMistakes: [
        'Forgetting COMMIT, so the changes are lost when the connection closes.',
        'Pasting user input directly into SQL text (SQL injection).',
        'Letting an application connect as the database administrator.'
      ],
      practiceExercise: {
        title: 'Safe price change',
        problem: 'Inside a transaction, increase the price of every Books product by 10. Then, before committing, decide it was a mistake and undo it. Finally show all products to prove nothing changed.',
        solutionCode: "BEGIN;\nUPDATE products SET price = price + 10 WHERE category = 'Books';\nROLLBACK;\n\nSELECT * FROM products;"
      },
      keyTakeaways: [
        'A transaction groups statements: COMMIT saves them, ROLLBACK undoes them.',
        'ACID: Atomicity, Consistency, Isolation, Durability.',
        'GRANT and REVOKE control what each database user may do.',
        'Parameters (placeholders) prevent SQL injection.'
      ]
    }
  },

  'sql-mod-15': {
    description: 'Use SQL for real analysis: window functions for rankings and running totals, report queries, and using SQL from Python - then the final project.',
    readingMaterial: {
      introduction: 'This module puts everything together the way data analysts use SQL every day: rankings, running totals, month-by-month reports and customer summaries. You will also see how Python reads data from a database, and then start the final project.',
      objectives: [
        'Rank rows with ROW_NUMBER, RANK and DENSE_RANK',
        'Compute running totals and group totals with window functions (OVER)',
        'Build a monthly sales report and a customer summary',
        'Read query results from Python with the sqlite3 module'
      ],
      sections: [
        {
          heading: 'Window functions',
          text: 'A window function calculates across a set of rows related to the current row, without merging them like GROUP BY does. Every row stays in the result and gets an extra value.',
          table: {
            headers: ['Function', 'Gives'],
            rows: [
              ['ROW_NUMBER() OVER (ORDER BY salary DESC)', '1, 2, 3, ... in that order'],
              ['RANK() OVER (...)', 'Rank with gaps after ties (1, 1, 3)'],
              ['DENSE_RANK() OVER (...)', 'Rank without gaps (1, 1, 2)'],
              ['SUM(x) OVER (ORDER BY date)', 'Running total'],
              ['AVG(x) OVER (PARTITION BY dept_id)', 'Average of the row\'s group, on every row'],
              ['LAG(x) / LEAD(x) OVER (ORDER BY date)', 'Value from the previous / next row']
            ]
          },
          bulletPoints: [
            'PARTITION BY restarts the calculation for each group, like GROUP BY but without merging rows.'
          ]
        },
        {
          heading: 'Report queries',
          text: 'Most business questions are a mix of what you already know: JOIN to bring data together, WHERE to filter, GROUP BY to summarise, CASE to label and ORDER BY to rank.',
          bulletPoints: [
            "Monthly revenue: GROUP BY strftime('%Y-%m', order_date).",
            'Customer summary: number of orders, total spent and last order date per customer.',
            'Best sellers: SUM(quantity) per product, top N with ORDER BY and LIMIT.'
          ]
        },
        {
          heading: 'SQL from Python',
          text: 'Programs send SQL to a database and get rows back. Python includes sqlite3 for SQLite; other databases use similar libraries (mysql-connector, psycopg). The pandas library can load a query straight into a table for charts and analysis.',
          bulletPoints: [
            'import sqlite3, then conn = sqlite3.connect("shop.db")',
            'rows = conn.execute("SELECT name, city FROM customers WHERE city = ?", ("Hyderabad",)).fetchall()',
            'import pandas as pd, then df = pd.read_sql("SELECT * FROM orders", conn)',
            'Always pass values with ? placeholders, never by joining strings (module 14).'
          ]
        },
        {
          heading: 'Final project',
          text: 'In the final project you design tables with keys and constraints, load data, and write report queries with joins, GROUP BY, subqueries and window functions. Open "Projects" on the course page for the full brief, and submit your GitHub repository there.'
        }
      ],
      codeExamples: [
        {
          title: 'Rank employees by salary',
          language: 'sql',
          code: 'SELECT first_name,\n       dept_id,\n       salary,\n       RANK() OVER (ORDER BY salary DESC)                      AS overall_rank,\n       RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank_in_dept\nFROM employees\nORDER BY overall_rank;',
          explanation: 'Aarav is rank 1 overall and in Engineering. rank_in_dept restarts at 1 in every department because of PARTITION BY.'
        },
        {
          title: 'Running total of sales',
          language: 'sql',
          code: "SELECT order_date,\n       order_id,\n       total_amount,\n       SUM(total_amount) OVER (ORDER BY order_date) AS running_total\nFROM orders\nWHERE status <> 'CANCELLED'\nORDER BY order_date;",
          explanation: 'Each row adds its amount to the total so far: 1548, 2047, 2086, 3424, 3673.'
        },
        {
          title: 'Monthly revenue report',
          language: 'sql',
          code: "SELECT strftime('%Y-%m', order_date) AS month,\n       COUNT(*)                       AS orders,\n       SUM(total_amount)              AS revenue\nFROM orders\nWHERE status <> 'CANCELLED'\nGROUP BY month\nORDER BY month;",
          explanation: 'June 2024 has 3 orders worth 2086; July 2024 has 2 orders worth 1587.'
        },
        {
          title: 'Customer summary with a label',
          language: 'sql',
          code: "WITH summary AS (\n    SELECT c.name,\n           COUNT(o.order_id)               AS orders,\n           COALESCE(SUM(o.total_amount), 0) AS spent,\n           MAX(o.order_date)               AS last_order\n    FROM customers AS c\n    LEFT JOIN orders AS o\n           ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'\n    GROUP BY c.customer_id, c.name\n)\nSELECT *,\n       CASE WHEN spent >= 1000 THEN 'Gold' ELSE 'Regular' END AS segment\nFROM summary\nORDER BY spent DESC;",
          explanation: 'One row per customer with orders, money spent and last order date. Arjun Rao and Tara Singh are Gold. Neel Joshi only has a cancelled order, so LEFT JOIN keeps him with 0.'
        }
      ],
      bestPractices: [
        'Build big reports in steps with WITH, checking each step\'s result.',
        'Exclude cancelled or test data explicitly in every report.',
        'Use window functions for rankings and running totals instead of complicated self joins.'
      ],
      commonMistakes: [
        'Using a window function in WHERE - wrap the query in WITH and filter outside.',
        'Mixing up RANK (gaps after ties) and DENSE_RANK (no gaps).',
        'Building SQL in Python with string formatting instead of ? parameters.'
      ],
      practiceExercise: {
        title: 'Best-selling products',
        problem: 'For each product show its name, the total quantity sold (from order_items, excluding cancelled orders) and its rank by quantity sold (highest = 1, use DENSE_RANK).',
        solutionCode: "SELECT p.name,\n       SUM(oi.quantity) AS units_sold,\n       DENSE_RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank\nFROM products AS p\nJOIN order_items AS oi ON oi.product_id = p.product_id\nJOIN orders AS o ON o.order_id = oi.order_id\nWHERE o.status <> 'CANCELLED'\nGROUP BY p.product_id, p.name\nORDER BY sales_rank, p.name;"
      },
      keyTakeaways: [
        'Window functions (OVER) add rankings and running totals while keeping every row.',
        'PARTITION BY restarts a window calculation for each group.',
        'Reports combine JOIN, WHERE, GROUP BY, CASE and ORDER BY.',
        'Applications run SQL through a driver and must pass values as parameters.'
      ]
    }
  }
};
