// Detailed, step-by-step sections for SQL modules 1-5. Each section explains one idea, shows the
// syntax, gives an example that runs on the Practice Lab sample database (its result table is
// generated into results.json) and ends with a tip. These replace the shorter sections in part1.
export default {
  'sql-mod-1': [
    {
      heading: 'What is a database?',
      text: 'A database is an organised collection of data that a computer can search and change quickly. A college stores students, courses and marks; a shop stores customers, products and orders. Keeping this in one database means everybody uses the same, up-to-date data.\n\nA relational database keeps data in tables that are linked to each other. The software that runs it is called an RDBMS (Relational Database Management System). Well-known ones are MySQL, PostgreSQL, Microsoft SQL Server, Oracle and SQLite.',
      bulletPoints: [
        'Database: the stored data itself.',
        'RDBMS: the program that stores the data, checks it and answers questions about it.',
        'SQLite: a small RDBMS that runs inside an app or a web page. The Practice Lab on this site uses SQLite.'
      ],
      note: 'You do not need to install anything for this course. Every example runs in your browser when you press "Try it".'
    },
    {
      heading: 'Tables, rows and columns',
      text: 'A table holds one kind of thing, for example employees. Each column is one piece of information (first name, salary) and each row is one record (one employee). It looks like a spreadsheet, but every value in a column has the same type and the database checks the data for you.',
      syntax: 'SELECT * FROM table_name;',
      code: 'SELECT *\nFROM employees;',
      bulletPoints: [
        'The employees table has 8 columns: emp_id, first_name, last_name, email, dept_id, salary, hire_date and manager_id.',
        'It has 8 rows - one for every employee.',
        'The * means "all columns".'
      ],
      note: 'A table is also called a relation, a row a record, and a column a field. You will hear all these words.'
    },
    {
      heading: 'Keys: how rows are identified and linked',
      text: 'Every table should have a primary key: a column whose value is different in every row, so each row can be found exactly. In employees it is emp_id. A foreign key is a column that points to the primary key of another table. employees.dept_id points to departments.dept_id - that is how we know which department each employee works in.',
      code: 'SELECT emp_id, first_name, dept_id\nFROM employees;',
      bulletPoints: [
        'Primary key (emp_id): unique and never empty.',
        'Foreign key (dept_id): must match an existing department.',
        'Because of keys, the department name is stored once in departments and not repeated for every employee.'
      ],
      note: 'Look at dept_id in the result: 1 is Engineering, 2 Sales, 3 Marketing, 4 Finance (from the departments table).'
    },
    {
      heading: 'What is SQL?',
      text: 'SQL (Structured Query Language, said "S-Q-L" or "sequel") is the standard language for working with relational databases. You write a statement that describes what you want, and the database works out how to get it. A statement that asks a question is called a query.',
      syntax: 'SELECT column1, column2\nFROM table_name\nWHERE condition;',
      code: 'SELECT first_name, salary\nFROM employees\nWHERE salary > 80000;',
      bulletPoints: [
        'Read it like English: "select the first name and salary from employees where the salary is more than 80000".',
        'The result is a small table: Aarav and Diya.'
      ],
      note: 'SQL is a standard (ANSI/ISO), so the basic commands are the same in MySQL, PostgreSQL, SQL Server, Oracle and SQLite. Each database adds a few extras.'
    },
    {
      heading: 'What can SQL do?',
      text: 'With SQL you can read data, add, change and delete data, create new tables, and control who may do what. Here is a small taste of reading data: counting rows and adding up a column.',
      code: 'SELECT COUNT(*)    AS employees,\n       SUM(salary) AS total_salaries,\n       MAX(salary) AS highest_salary\nFROM employees;',
      table: {
        headers: ['Group', 'Meaning', 'Commands', 'Module'],
        rows: [
          ['DQL', 'Read data (query)', 'SELECT', '6 - 12, 15'],
          ['DML', 'Change data', 'INSERT, UPDATE, DELETE', '5'],
          ['DDL', 'Create or change tables', 'CREATE, ALTER, DROP', '3, 4, 13'],
          ['TCL', 'Save or undo a group of changes', 'BEGIN, COMMIT, ROLLBACK', '14'],
          ['DCL', 'Permissions', 'GRANT, REVOKE', '14']
        ]
      },
      note: 'Do not worry about COUNT, SUM and MAX yet - module 9 explains them. Just notice how one short query answers a real question.'
    },
    {
      heading: 'The practice database',
      text: 'All examples in this course use one small sample database about a company and its online shop. It has six tables. The query below asks SQLite itself for the list of tables.',
      code: "SELECT name AS table_name\nFROM sqlite_master\nWHERE type = 'table'\nORDER BY name;",
      table: {
        headers: ['Table', 'What it stores', 'Rows'],
        rows: [
          ['departments', 'dept_id, dept_name, location', '4'],
          ['employees', 'emp_id, names, email, dept_id, salary, hire_date, manager_id', '8'],
          ['customers', 'customer_id, name, city, signup_date', '5'],
          ['products', 'product_id, name, category, price', '5'],
          ['orders', 'order_id, customer_id, order_date, status, total_amount', '6'],
          ['order_items', 'item_id, order_id, product_id, quantity, unit_price', '8']
        ]
      },
      note: 'The Practice Lab (button at the top of the page) also shows every table and column under "Sample schema". If you change data there, press "Reset data" to start fresh.'
    }
  ],

  'sql-mod-2': [
    {
      heading: 'SQL statements',
      text: 'A SQL statement is an instruction to the database. It is built from keywords (SELECT, FROM, WHERE), names of tables and columns, and values. Spaces and line breaks do not matter, so long statements are usually split over several lines to make them easy to read.',
      syntax: 'SELECT column_list\nFROM table_name\nWHERE condition;',
      code: 'SELECT first_name, last_name\nFROM employees\nWHERE dept_id = 2;',
      note: 'Put each main part (SELECT, FROM, WHERE) on its own line. It is the most common style and makes mistakes easy to spot.'
    },
    {
      heading: 'Keywords are not case sensitive',
      text: 'select, SELECT and Select mean the same thing. By convention, keywords are written in capital letters and table and column names in small letters, so you can see the structure of a query at a glance.',
      code: 'select first_name from employees where emp_id = 101;',
      bulletPoints: [
        'This works exactly like SELECT first_name FROM employees WHERE emp_id = 101;',
        'Text values ARE case sensitive when compared: \'Sales\' is not the same as \'sales\' in most databases.'
      ],
      note: 'Use the uppercase-keywords style in this course - it is what you will see at work.'
    },
    {
      heading: 'Semicolons and several statements',
      text: 'A semicolon (;) marks the end of a statement. It is required when you send more than one statement at once, and it is good practice to always write it. The Practice Lab runs all the statements and shows the result of the last one.',
      code: 'SELECT COUNT(*) AS departments FROM departments;\nSELECT COUNT(*) AS employees FROM employees;',
      note: 'Forgetting the semicolon between two statements gives a syntax error near the second SELECT.'
    },
    {
      heading: 'Comments',
      text: 'Comments are notes for people. The database ignores them. Use them to explain why a query does something, or to switch a line off while testing.',
      syntax: '-- single-line comment\n/* multi-line\n   comment */',
      code: "/* All employees in Sales.\n   Written for the monthly report. */\nSELECT first_name,   -- the employee\n       salary        -- yearly salary\nFROM employees\nWHERE dept_id = 2;\n-- WHERE dept_id = 3;  (this line is switched off)",
      note: 'MySQL also accepts # for single-line comments, but -- works everywhere.'
    },
    {
      heading: 'Text values need single quotes',
      text: "Text (also called strings) and dates are written inside single quotes: 'Mumbai', '2024-06-01'. Numbers are written without quotes. If the text itself contains a quote, write it twice: 'Ravi''s'.",
      code: "SELECT name, city\nFROM customers\nWHERE city = 'Mumbai';",
      table: {
        headers: ['Value', 'Write it as', 'Example'],
        rows: [
          ['Text', 'single quotes', "city = 'Mumbai'"],
          ['Date', "single quotes, 'YYYY-MM-DD'", "hire_date = '2021-03-14'"],
          ['Number', 'no quotes', 'salary > 60000'],
          ['Text with a quote', 'double the quote', "'Ravi''s laptop'"]
        ]
      },
      note: 'Double quotes are for names (a column called "First Name"), not for text values. WHERE city = "Mumbai" fails in many databases.'
    },
    {
      heading: 'Numbers and arithmetic',
      text: 'SQL can calculate with + (add), - (subtract), * (multiply), / (divide) and % (remainder). In SQLite, dividing two whole numbers gives a whole number, so write one of them with a decimal point to keep the decimals.',
      code: 'SELECT 10 + 5    AS added,\n       10 * 5    AS multiplied,\n       7 / 2     AS whole_division,\n       7 / 2.0   AS decimal_division,\n       7 % 2     AS remainder;',
      note: 'A SELECT does not always need a table. SELECT 2 + 3; simply calculates and returns 5.'
    },
    {
      heading: 'Data types',
      text: 'Every column has a data type that says what kind of values it may hold. Choosing the right type stops bad data (letters in a price column) and makes sorting and calculations correct. Type names differ slightly between databases:',
      table: {
        headers: ['Kind of data', 'Common types', 'Example values'],
        rows: [
          ['Whole numbers', 'INT / INTEGER, SMALLINT, BIGINT', '7, 2024, -15'],
          ['Exact decimals (money)', 'DECIMAL(10,2) / NUMERIC(10,2)', '1299.00'],
          ['Approximate decimals', 'REAL, FLOAT, DOUBLE', '3.14159'],
          ['Text', 'VARCHAR(n), CHAR(n), TEXT', "'Aarav', 'IN'"],
          ['Dates and times', 'DATE, TIME, DATETIME / TIMESTAMP', "'2024-06-01'"],
          ['True / false', 'BOOLEAN (SQLite stores 1 and 0)', 'TRUE, FALSE'],
          ['No value', 'NULL (any type)', 'NULL']
        ]
      },
      bulletPoints: [
        'VARCHAR(50) holds text up to 50 characters; CHAR(2) always exactly 2 (good for codes like IN).',
        'DECIMAL(10,2) means up to 10 digits, 2 of them after the decimal point.',
        'SQLite keeps it simple: it stores INTEGER, REAL, TEXT and NULL. Dates are stored as text like 2024-06-01.'
      ],
      note: 'Store money in DECIMAL, not FLOAT: FLOAT can give tiny rounding errors such as 0.30000000000000004.'
    },
    {
      heading: 'Checking and converting types: typeof and CAST',
      text: "typeof(value) (SQLite) tells you the type of a value. CAST(value AS type) converts a value, for example the text '250' into the number 250, or a number into text.",
      syntax: 'CAST(expression AS type)',
      code: "SELECT typeof(42)                 AS a_number,\n       typeof('42')               AS a_text,\n       CAST('250' AS INTEGER) + 5 AS converted,\n       CAST(98000 AS TEXT) || ' INR' AS as_text;",
      note: 'Other databases: PostgreSQL also writes value::type, and MySQL has CONVERT(). CAST works everywhere.'
    }
  ],

  'sql-mod-3': [
    {
      heading: 'CREATE DATABASE',
      text: 'On a database server (MySQL, PostgreSQL, SQL Server) you first create a database, then create tables inside it. SQLite is different: the database is a single file, created automatically, so there is no CREATE DATABASE in the Practice Lab.',
      syntax: 'CREATE DATABASE school;\nDROP DATABASE school;     -- deletes the whole database!',
      bulletPoints: [
        'MySQL: USE school; switches to that database.',
        'PostgreSQL: \\c school in the psql tool connects to it.'
      ],
      note: 'DROP DATABASE deletes every table and all data inside it. On real servers only administrators may run it.'
    },
    {
      heading: 'CREATE TABLE',
      text: 'CREATE TABLE makes a new, empty table. Inside the brackets list each column with its data type, separated by commas. After creating it you can add rows (INSERT) and read them (SELECT).',
      syntax: 'CREATE TABLE table_name (\n    column1 datatype,\n    column2 datatype,\n    ...\n);',
      code: "CREATE TABLE students (\n    student_id INTEGER,\n    full_name  VARCHAR(60),\n    city       VARCHAR(40),\n    joined_on  DATE\n);\n\nINSERT INTO students VALUES (1, 'Priya Das', 'Kolkata', '2024-06-10');\nINSERT INTO students VALUES (2, 'Rahul Verma', 'Pune', '2024-06-12');\n\nSELECT * FROM students;",
      note: 'Names should be lowercase with underscores (full_name). Avoid spaces and SQL keywords such as order or select as names.'
    },
    {
      heading: 'CREATE TABLE IF NOT EXISTS',
      text: 'Running CREATE TABLE twice gives the error "table already exists". Adding IF NOT EXISTS makes the statement do nothing when the table is already there - useful in scripts that may run more than once.',
      syntax: 'CREATE TABLE IF NOT EXISTS table_name ( ... );',
      code: "CREATE TABLE IF NOT EXISTS notes (note_id INTEGER, body TEXT);\nCREATE TABLE IF NOT EXISTS notes (note_id INTEGER, body TEXT);  -- no error\n\nINSERT INTO notes VALUES (1, 'Revise JOINs');\nSELECT * FROM notes;"
    },
    {
      heading: 'Looking at a table\'s structure',
      text: 'To see the columns of a table and their types, SQLite has PRAGMA table_info. Other databases use DESCRIBE table (MySQL) or \\d table (PostgreSQL).',
      syntax: 'PRAGMA table_info(table_name);',
      code: 'PRAGMA table_info(employees);',
      note: 'The result lists each column with its position (cid), name, type, whether it is NOT NULL, its default value and whether it is part of the primary key (pk).'
    },
    {
      heading: 'ALTER TABLE: add a column',
      text: 'ALTER TABLE changes an existing table without losing its data. ADD COLUMN adds a new column at the end. Existing rows get NULL (or the DEFAULT value) in the new column.',
      syntax: 'ALTER TABLE table_name ADD COLUMN column_name datatype;',
      code: "CREATE TABLE students (student_id INTEGER, full_name TEXT);\nINSERT INTO students VALUES (1, 'Priya Das'), (2, 'Rahul Verma');\n\nALTER TABLE students ADD COLUMN phone TEXT;\n\nSELECT * FROM students;"
    },
    {
      heading: 'ALTER TABLE: rename a column or a table',
      text: 'RENAME COLUMN gives a column a new name; RENAME TO gives the whole table a new name. The data stays as it is.',
      syntax: 'ALTER TABLE table_name RENAME COLUMN old_name TO new_name;\nALTER TABLE table_name RENAME TO new_table_name;',
      code: "CREATE TABLE students (student_id INTEGER, phone TEXT);\nINSERT INTO students VALUES (1, '98765 43210');\n\nALTER TABLE students RENAME COLUMN phone TO mobile;\nALTER TABLE students RENAME TO learners;\n\nSELECT * FROM learners;"
    },
    {
      heading: 'ALTER TABLE: remove a column',
      text: 'DROP COLUMN removes a column and all the values in it.',
      syntax: 'ALTER TABLE table_name DROP COLUMN column_name;',
      code: "CREATE TABLE students (student_id INTEGER, full_name TEXT, temp_code TEXT);\nINSERT INTO students VALUES (1, 'Priya Das', 'X1');\n\nALTER TABLE students DROP COLUMN temp_code;\n\nSELECT * FROM students;",
      note: 'Changing a column\'s type is written differently in each database: ALTER TABLE t MODIFY col type (MySQL), ALTER TABLE t ALTER COLUMN col TYPE type (PostgreSQL). SQLite needs a new table instead.'
    },
    {
      heading: 'CREATE TABLE ... AS SELECT',
      text: 'This creates a new table and fills it with the result of a query in one step. It is handy for backups, reports and practice copies.',
      syntax: 'CREATE TABLE new_table AS\nSELECT columns FROM existing_table WHERE condition;',
      code: 'CREATE TABLE engineering_team AS\nSELECT emp_id, first_name, salary\nFROM employees\nWHERE dept_id = 1;\n\nSELECT * FROM engineering_team;',
      note: 'SQL Server writes this as SELECT ... INTO new_table FROM ... . The copy has the data but not the keys and constraints of the original.'
    },
    {
      heading: 'DROP TABLE and emptying a table',
      text: 'DROP TABLE deletes a table completely - its structure and all its rows. To keep the table but remove all its rows, use DELETE FROM table (all databases) or TRUNCATE TABLE (MySQL, PostgreSQL, SQL Server; faster).',
      syntax: 'DROP TABLE table_name;\nDROP TABLE IF EXISTS table_name;\nDELETE FROM table_name;        -- empty it, keep the table\nTRUNCATE TABLE table_name;     -- same, not in SQLite',
      code: "CREATE TABLE temp_scores (score INTEGER);\nINSERT INTO temp_scores VALUES (10), (20), (30);\n\nDELETE FROM temp_scores;            -- rows gone, table stays\nSELECT COUNT(*) AS rows_left FROM temp_scores;",
      note: 'There is no undo for DROP TABLE. Always double-check the table name, and keep backups of real data.'
    }
  ],

  'sql-mod-4': [
    {
      heading: 'What are constraints?',
      text: 'Constraints are rules on columns. The database checks them on every INSERT and UPDATE and refuses any data that breaks a rule - so wrong data never gets in. You write them after the column type when creating a table.',
      table: {
        headers: ['Constraint', 'Rule'],
        rows: [
          ['NOT NULL', 'The column must have a value'],
          ['UNIQUE', 'No two rows may have the same value'],
          ['PRIMARY KEY', 'Unique and not NULL: identifies each row'],
          ['FOREIGN KEY', 'The value must exist in another table'],
          ['CHECK', 'The value must pass a condition'],
          ['DEFAULT', 'Value used when none is given']
        ]
      }
    },
    {
      heading: 'NOT NULL',
      text: 'By default a column may be left empty (NULL). NOT NULL makes a value required. Use it for anything that must always be known, such as a name or an order date.',
      syntax: 'column_name datatype NOT NULL',
      code: "CREATE TABLE members (\n    member_id INTEGER,\n    full_name TEXT NOT NULL\n);\nINSERT INTO members VALUES (1, 'Priya Das');\n-- INSERT INTO members VALUES (2, NULL);   -- remove the -- to see the error\n\nSELECT * FROM members;",
      note: 'Removing the -- and running again shows: NOT NULL constraint failed: members.full_name.'
    },
    {
      heading: 'UNIQUE',
      text: 'UNIQUE makes sure no two rows have the same value in that column - for example an email address or a roll number. NULL is allowed (and several NULLs are allowed) unless the column is also NOT NULL.',
      syntax: 'column_name datatype UNIQUE',
      code: "CREATE TABLE members (\n    member_id INTEGER,\n    email     TEXT UNIQUE\n);\nINSERT INTO members VALUES (1, 'priya@mail.com');\nINSERT INTO members VALUES (2, 'rahul@mail.com');\n-- INSERT INTO members VALUES (3, 'priya@mail.com');   -- duplicate: refused\n\nSELECT * FROM members;"
    },
    {
      heading: 'PRIMARY KEY',
      text: 'The primary key identifies each row. It is UNIQUE and NOT NULL together, and a table has only one. In SQLite, an INTEGER PRIMARY KEY column numbers itself (1, 2, 3...) when you leave it out of the INSERT.',
      syntax: 'column_name INTEGER PRIMARY KEY\n-- or, after the columns:\nPRIMARY KEY (column1, column2)',
      code: "CREATE TABLE members (\n    member_id INTEGER PRIMARY KEY,\n    full_name TEXT NOT NULL\n);\nINSERT INTO members (full_name) VALUES ('Priya Das');\nINSERT INTO members (full_name) VALUES ('Rahul Verma');\n\nSELECT * FROM members;",
      bulletPoints: [
        'Automatic numbering is called AUTO_INCREMENT in MySQL, SERIAL or GENERATED AS IDENTITY in PostgreSQL, and IDENTITY in SQL Server.',
        'A key made of two columns is a composite key: PRIMARY KEY (order_id, product_id).'
      ],
      note: 'Use a simple number as the primary key. Names, phone numbers and emails can change or repeat.'
    },
    {
      heading: 'FOREIGN KEY',
      text: 'A foreign key links a column to the primary key of another table, so the value must exist there. The table that is pointed to is the parent (batches); the table with the foreign key is the child (enrolments).',
      syntax: 'column_name datatype REFERENCES parent_table(parent_column)\n-- or, after the columns:\nFOREIGN KEY (column_name) REFERENCES parent_table(parent_column)',
      code: "PRAGMA foreign_keys = ON;   -- SQLite only: switch the checks on\n\nCREATE TABLE batches (\n    batch_id INTEGER PRIMARY KEY,\n    name     TEXT NOT NULL\n);\nCREATE TABLE enrolments (\n    enrolment_id INTEGER PRIMARY KEY,\n    student      TEXT NOT NULL,\n    batch_id     INTEGER REFERENCES batches(batch_id)\n);\nINSERT INTO batches VALUES (1, 'Morning'), (2, 'Evening');\nINSERT INTO enrolments (student, batch_id) VALUES ('Priya', 1), ('Rahul', 2);\n-- INSERT INTO enrolments (student, batch_id) VALUES ('Sam', 9);  -- batch 9 does not exist\n\nSELECT * FROM enrolments;",
      bulletPoints: [
        'ON DELETE CASCADE: deleting a batch also deletes its enrolments.',
        'ON DELETE SET NULL: deleting a batch sets batch_id to NULL in its enrolments.',
        'Without these, deleting a parent that still has children is refused.'
      ],
      note: 'SQLite checks foreign keys only after PRAGMA foreign_keys = ON; MySQL (InnoDB), PostgreSQL and SQL Server always check them.'
    },
    {
      heading: 'CHECK',
      text: 'CHECK adds a condition that every value must pass, such as "age is at least 18" or "price is more than 0".',
      syntax: 'column_name datatype CHECK (condition)',
      code: "CREATE TABLE products_demo (\n    name  TEXT,\n    price DECIMAL(8,2) CHECK (price > 0),\n    stock INTEGER CHECK (stock >= 0)\n);\nINSERT INTO products_demo VALUES ('Pen', 10, 100);\n-- INSERT INTO products_demo VALUES ('Free pen', 0, 5);   -- price 0 fails the CHECK\n\nSELECT * FROM products_demo;"
    },
    {
      heading: 'DEFAULT',
      text: 'DEFAULT gives a column a value automatically when the INSERT does not mention it - for example status \'active\' or today\'s date.',
      syntax: 'column_name datatype DEFAULT value',
      code: "CREATE TABLE accounts (\n    account_id INTEGER PRIMARY KEY,\n    holder     TEXT NOT NULL,\n    status     TEXT DEFAULT 'active',\n    opened_on  TEXT DEFAULT (date('now'))\n);\nINSERT INTO accounts (holder) VALUES ('Priya');\nINSERT INTO accounts (holder, status) VALUES ('Rahul', 'blocked');\n\nSELECT account_id, holder, status FROM accounts;"
    },
    {
      heading: 'NULL: the missing value',
      text: 'NULL means "no value" or "unknown". It is not zero and not empty text. Because nothing is equal to NULL, you test for it with IS NULL and IS NOT NULL, never with =.',
      code: "SELECT first_name, manager_id\nFROM employees\nWHERE manager_id IS NULL;",
      note: 'WHERE manager_id = NULL returns no rows at all - a very common mistake. Module 7 covers this again.'
    }
  ],

  'sql-mod-5': [
    {
      heading: 'INSERT INTO: add a row',
      text: 'INSERT INTO adds a new row to a table. Name the columns you are filling, then give the values in the same order inside VALUES.',
      syntax: 'INSERT INTO table_name (column1, column2, column3)\nVALUES (value1, value2, value3);',
      code: "INSERT INTO customers (customer_id, name, city, signup_date)\nVALUES (6, 'Kiran Rao', 'Goa', '2024-08-01');\n\nSELECT * FROM customers;",
      note: 'You may leave out the column list if you give a value for every column in table order - but listing the columns is safer and clearer.'
    },
    {
      heading: 'INSERT only some columns',
      text: 'Columns you do not mention get their DEFAULT value, or NULL if they have no default.',
      code: "INSERT INTO customers (customer_id, name)\nVALUES (7, 'Leela Menon');\n\nSELECT * FROM customers WHERE customer_id = 7;",
      note: 'city and signup_date are NULL for Leela because they were not given.'
    },
    {
      heading: 'INSERT several rows at once',
      text: 'Put several value lists after VALUES, separated by commas. It is shorter and faster than one INSERT per row.',
      syntax: 'INSERT INTO table_name (columns)\nVALUES (...), (...), (...);',
      code: "INSERT INTO products (product_id, name, category, price)\nVALUES (6, 'USB-C Hub', 'Electronics', 59),\n       (7, 'Desk Lamp', 'Furniture', 35),\n       (8, 'SQL Pocket Guide', 'Books', 19);\n\nSELECT * FROM products ORDER BY product_id;"
    },
    {
      heading: 'INSERT INTO ... SELECT',
      text: 'Instead of typing values, you can insert the result of a query. The SELECT must return the same number of columns, in the same order, as the column list.',
      syntax: 'INSERT INTO table2 (columns)\nSELECT columns FROM table1 WHERE condition;',
      code: "CREATE TABLE hyderabad_customers (customer_id INTEGER, name TEXT);\n\nINSERT INTO hyderabad_customers (customer_id, name)\nSELECT customer_id, name\nFROM customers\nWHERE city = 'Hyderabad';\n\nSELECT * FROM hyderabad_customers;"
    },
    {
      heading: 'UPDATE: change one row',
      text: 'UPDATE changes values in rows that already exist. SET says which columns get which new values; WHERE says which rows. Use the primary key in WHERE to change exactly one row.',
      syntax: 'UPDATE table_name\nSET column1 = value1, column2 = value2\nWHERE condition;',
      code: "UPDATE products\nSET price = 279\nWHERE product_id = 2;\n\nSELECT product_id, name, price FROM products;",
      note: 'Only product 2 (the headphones) changes from 249 to 279.'
    },
    {
      heading: 'UPDATE many rows, with a calculation',
      text: 'The new value can be calculated from the old one, and WHERE can match many rows. Here every Marketing employee (dept_id 3) gets a 10% raise.',
      code: 'UPDATE employees\nSET salary = ROUND(salary * 1.10)\nWHERE dept_id = 3;\n\nSELECT first_name, dept_id, salary\nFROM employees\nORDER BY dept_id;',
      note: 'Rohan goes from 61000 to 67100 and Isha from 55000 to 60500. Everyone else is unchanged.'
    },
    {
      heading: 'Danger: UPDATE without WHERE',
      text: 'If you leave out WHERE, UPDATE changes every row in the table. This example sets every order to SHIPPED - almost certainly a mistake in real life.',
      code: "UPDATE orders\nSET status = 'SHIPPED';      -- no WHERE: all 6 rows change!\n\nSELECT order_id, status FROM orders;",
      note: 'Before any UPDATE or DELETE, run SELECT * FROM table WHERE (same condition) to see exactly which rows will change. In the Practice Lab, press "Reset data" to undo.'
    },
    {
      heading: 'DELETE: remove rows',
      text: 'DELETE FROM removes whole rows that match WHERE. Rows in other tables that refer to them (child rows) should be deleted first, or the foreign key will refuse the delete.',
      syntax: 'DELETE FROM table_name WHERE condition;',
      code: "-- order 1004 was cancelled: delete its items first, then the order\nDELETE FROM order_items WHERE order_id = 1004;\nDELETE FROM orders      WHERE order_id = 1004;\n\nSELECT order_id, status FROM orders;"
    },
    {
      heading: 'DELETE every row',
      text: 'DELETE FROM table with no WHERE removes all rows but keeps the empty table (with its columns). To remove the table itself, use DROP TABLE (module 3).',
      code: "CREATE TABLE login_attempts (user_name TEXT, tried_at TEXT);\nINSERT INTO login_attempts VALUES ('priya', '2024-07-01'), ('rahul', '2024-07-02');\n\nDELETE FROM login_attempts;\n\nSELECT COUNT(*) AS rows_left FROM login_attempts;",
      note: 'Module 14 shows transactions: wrap risky changes in BEGIN ... ROLLBACK to test them safely.'
    }
  ]
};
