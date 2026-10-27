// SQL & Relational Databases - lesson text for modules 1-5, written for complete beginners.
// Every code example runs as-is in the Practice Lab (SQLite with the sample tables in
// shared/sampleSchema.js); tests/sql-lessons.test.js runs them all.
export default {
  'sql-mod-1': {
    description: 'What a database is, what tables, rows and columns are, what SQL does, and your first SELECT query on a real database.',
    readingMaterial: {
      introduction: 'A database is an organised store of data that a program can search and change quickly. Most databases used by banks, shops and colleges are relational databases: the data is kept in tables, a bit like spreadsheets. SQL (Structured Query Language, said "sequel" or "S-Q-L") is the language you use to talk to them.\n\nIn this module you will learn the basic words - table, row, column, key - and run your first query on the practice database that comes with this course.',
      objectives: [
        'Explain what a database and a relational database are',
        'Describe a table using the words row, column and primary key',
        'Know the main groups of SQL commands',
        'Run a simple SELECT query and read its result'
      ],
      sections: [
        {
          heading: 'What is a database?',
          text: 'A database keeps data safely in one place so many people and programs can use it at the same time. Think of a college: student details, courses, marks and fees all need to be stored, searched and updated without mistakes. A DBMS (Database Management System) is the software that does this. Popular ones are MySQL, PostgreSQL, SQL Server, Oracle and SQLite.',
          bulletPoints: [
            'Relational database: data is stored in tables that are linked to each other.',
            'RDBMS: Relational Database Management System - the software, for example MySQL or PostgreSQL.',
            'SQLite: a small database that runs inside an app or a browser. The Practice Lab uses SQLite.'
          ]
        },
        {
          heading: 'Tables, rows and columns',
          text: 'A table stores one kind of thing - for example employees. Each column is one detail (first name, salary) and each row is one record (one employee). This is the employees table in the practice database (some columns hidden):',
          table: {
            headers: ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary'],
            rows: [
              ['101', 'Aarav', 'Sharma', '1', '98000'],
              ['102', 'Diya', 'Reddy', '1', '87000'],
              ['103', 'Kabir', 'Mehta', '2', '64000']
            ]
          },
          bulletPoints: [
            'Column (field): one piece of information, such as salary.',
            'Row (record): all the information about one employee.',
            'Primary key: a column whose value is different in every row (emp_id), so each row can be found exactly.',
            'Foreign key: a column that points to a row in another table. dept_id points to the departments table.'
          ]
        },
        {
          heading: 'What is SQL?',
          text: 'SQL is a standard language for storing, reading, changing and deleting data in a relational database. You write a statement, the database runs it and gives you back a result. SQL reads almost like English: SELECT first_name FROM employees means "show me the first names from the employees table".',
          bulletPoints: [
            'You describe WHAT you want; the database decides HOW to fetch it quickly.',
            'The same basic SQL works in MySQL, PostgreSQL, SQL Server, Oracle and SQLite. Each adds a few extras of its own.'
          ]
        },
        {
          heading: 'The groups of SQL commands',
          text: 'SQL commands are grouped by what they do. You will learn each group in this course.',
          table: {
            headers: ['Group', 'Meaning', 'Commands'],
            rows: [
              ['DQL', 'Ask questions (read data)', 'SELECT'],
              ['DML', 'Change the data', 'INSERT, UPDATE, DELETE'],
              ['DDL', 'Create or change tables', 'CREATE, ALTER, DROP'],
              ['TCL', 'Save or undo a group of changes', 'COMMIT, ROLLBACK'],
              ['DCL', 'Give or take away permissions', 'GRANT, REVOKE']
            ]
          }
        },
        {
          heading: 'The practice database',
          text: 'Every example in this course runs on a small sample database with six tables. Open the Practice Lab (button at the top of the page) to see their columns at any time.',
          bulletPoints: [
            'departments - 4 departments (Engineering, Sales, Marketing, Finance).',
            'employees - 8 employees with their department, salary, hire date and manager.',
            'customers - 5 customers of an online shop.',
            'products - 5 products with a category and price.',
            'orders - 6 orders placed by the customers.',
            'order_items - which products are in each order.'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Your first query: show a whole table',
          language: 'sql',
          code: '-- * means "every column"\nSELECT *\nFROM departments;',
          explanation: 'SELECT * returns every column and every row of the departments table: 4 rows, one per department. Press "Try it" to run it.'
        },
        {
          title: 'Choose the columns you want',
          language: 'sql',
          code: 'SELECT first_name, last_name, salary\nFROM employees;',
          explanation: 'List the columns after SELECT, separated by commas. The result has only those 3 columns, for all 8 employees.'
        },
        {
          title: 'Count the rows in a table',
          language: 'sql',
          code: 'SELECT COUNT(*) AS total_customers\nFROM customers;',
          explanation: 'COUNT(*) counts rows. The answer is 5. "AS total_customers" gives the result column a readable name.'
        }
      ],
      bestPractices: [
        'Write SQL keywords in capital letters (SELECT, FROM) and table and column names in small letters. It is not required, but it makes queries easier to read.',
        'End every statement with a semicolon (;).',
        'Ask only for the columns you need instead of SELECT * in real applications.'
      ],
      commonMistakes: [
        'Misspelling a table or column name - the database answers "no such table" or "no such column".',
        'Forgetting the comma between column names in SELECT.',
        'Thinking a database is the same as a spreadsheet: a database checks the data (for example, unique IDs) and many users can change it at the same time.'
      ],
      practiceExercise: {
        title: 'Look around the shop',
        problem: 'Write two queries:\n1. Show every column of the products table.\n2. Show only the name and city of every customer.',
        solutionCode: 'SELECT *\nFROM products;\n\nSELECT name, city\nFROM customers;'
      },
      keyTakeaways: [
        'A relational database stores data in tables made of rows and columns.',
        'A primary key identifies each row; a foreign key links a row to another table.',
        'SQL is the language used to read and change data in a relational database.',
        'SELECT column_names FROM table_name; is the most common SQL statement.'
      ]
    }
  },

  'sql-mod-2': {
    description: 'How SQL statements are written: keywords, semicolons, comments and quotes, plus the common data types for numbers, text and dates.',
    readingMaterial: {
      introduction: 'Before writing bigger queries, it helps to know the basic rules of SQL: how a statement is built, when to use quotes, how to write comments, and what kind of values a column can hold (its data type). These rules are almost the same in every database.',
      objectives: [
        'Write a SQL statement with correct keywords, commas and semicolon',
        'Use single quotes for text values and add comments to SQL',
        'Choose a sensible data type for numbers, text, dates and true/false values',
        'Convert a value from one type to another with CAST'
      ],
      sections: [
        {
          heading: 'How a SQL statement is built',
          text: 'A statement is made of keywords (SELECT, FROM, WHERE), names (tables and columns) and values. Spaces and new lines do not matter, so you can split a long statement over several lines.',
          bulletPoints: [
            'SQL keywords are not case sensitive: select and SELECT do the same thing.',
            'A semicolon (;) ends a statement. It is needed when you run more than one statement at once.',
            'Separate items in a list with commas: SELECT first_name, salary FROM employees;'
          ]
        },
        {
          heading: 'Quotes: text values vs numbers',
          text: 'Text values (strings) and dates go inside single quotes. Numbers do not need quotes.',
          table: {
            headers: ['Value', 'How to write it', 'Example'],
            rows: [
              ['Text', 'Single quotes', "WHERE city = 'Mumbai'"],
              ['Date', 'Single quotes, year-month-day', "WHERE hire_date = '2021-03-14'"],
              ['Number', 'No quotes', 'WHERE salary > 60000'],
              ['Text containing a quote', 'Write the quote twice', "'Ravi''s laptop'"]
            ]
          },
          bulletPoints: [
            'Double quotes are for names (for example a column called "First Name" with a space), not for text values.'
          ]
        },
        {
          heading: 'Comments',
          text: 'Comments are notes for people. The database ignores them.',
          bulletPoints: [
            'Single-line comment: start with two dashes. -- this is a note',
            'Multi-line comment: put the text between /* and */.'
          ]
        },
        {
          heading: 'Data types',
          text: 'Every column has a data type that says what kind of values it holds. The names differ a little between databases; this table shows the common ones.',
          table: {
            headers: ['Kind of data', 'Common types', 'Example values'],
            rows: [
              ['Whole numbers', 'INT / INTEGER, SMALLINT, BIGINT', '7, 2024, -15'],
              ['Exact decimals (money)', 'DECIMAL(10,2) / NUMERIC(10,2)', '1299.00'],
              ['Approximate decimals', 'REAL, FLOAT, DOUBLE', '3.14159'],
              ['Text', 'VARCHAR(n), CHAR(n), TEXT', "'Aarav', 'IN'"],
              ['Dates and times', 'DATE, TIME, DATETIME / TIMESTAMP', "'2024-06-01'"],
              ['True / false', 'BOOLEAN (SQLite uses 1 and 0)', 'TRUE, FALSE']
            ]
          },
          bulletPoints: [
            'VARCHAR(50) holds text up to 50 characters. CHAR(2) always holds exactly 2, good for codes like "IN".',
            'Use DECIMAL for money, because FLOAT can give small rounding errors.',
            'SQLite (the Practice Lab) is relaxed about types: it stores INTEGER, REAL, TEXT and NULL. Dates are stored as text like 2024-06-01.'
          ]
        },
        {
          heading: 'Converting types with CAST',
          text: "CAST(value AS type) changes a value into another type, for example the text '250' into the number 250. In SQLite, typeof(value) tells you the type of a value.",
          bulletPoints: [
            "CAST('250' AS INTEGER) gives the number 250.",
            'CAST(salary AS TEXT) gives the salary as text.'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'One statement over several lines, with comments',
          language: 'sql',
          code: '/* Employees in department 1.\n   Line breaks only make it easier to read. */\nSELECT first_name, salary   -- two columns\nFROM employees\nWHERE dept_id = 1;          -- a number: no quotes',
          explanation: 'The database ignores the comments and the line breaks. The result: Aarav, Diya and Vihaan with their salaries.'
        },
        {
          title: 'Text values need single quotes',
          language: 'sql',
          code: "SELECT name, city\nFROM customers\nWHERE city = 'Hyderabad';",
          explanation: "Hyderabad is text, so it is written inside single quotes. Two customers live there: Arjun Rao and Zoya Ali. Text comparisons are case sensitive, so 'hyderabad' would find nothing."
        },
        {
          title: 'See and change data types',
          language: 'sql',
          code: "SELECT\n    typeof(42)                AS a_whole_number,\n    typeof(3.5)               AS a_decimal,\n    typeof('hello')           AS some_text,\n    CAST('250' AS INTEGER) + 5 AS text_to_number,\n    CAST(98000 AS TEXT)       AS number_to_text;",
          explanation: "typeof shows integer, real and text. CAST('250' AS INTEGER) turns the text into a number, so adding 5 gives 255."
        }
      ],
      bestPractices: [
        'Put each main part of a query (SELECT, FROM, WHERE) on its own line.',
        'Use single quotes for text and dates, never double quotes.',
        'Store money in DECIMAL columns and dates in DATE columns, not as free text.'
      ],
      commonMistakes: [
        "Writing WHERE city = Mumbai without quotes - the database thinks Mumbai is a column name.",
        'Using double quotes for text values: WHERE city = "Mumbai" fails in many databases.',
        'Writing dates as 01/06/2024 instead of the standard 2024-06-01.'
      ],
      practiceExercise: {
        title: 'Quotes and types',
        problem: "1. Show the first_name and hire_date of employees hired on '2024-07-01'.\n2. Show the name and price of the product called 'Ergo Chair'.\n3. Use CAST to turn the text '1999' into an integer and add 1 to it.",
        solutionCode: "SELECT first_name, hire_date\nFROM employees\nWHERE hire_date = '2024-07-01';\n\nSELECT name, price\nFROM products\nWHERE name = 'Ergo Chair';\n\nSELECT CAST('1999' AS INTEGER) + 1 AS next_year;"
      },
      keyTakeaways: [
        'Keywords are not case sensitive; end statements with a semicolon.',
        'Text and dates go in single quotes; numbers do not.',
        'Comments start with -- or go between /* and */.',
        'Choose a data type that matches the data: INTEGER, DECIMAL, VARCHAR, DATE.'
      ]
    }
  },

  'sql-mod-3': {
    description: 'Create your own tables with CREATE TABLE, change them with ALTER TABLE, and remove them with DROP TABLE.',
    readingMaterial: {
      introduction: 'So far you have read tables that already exist. Now you will make your own. Commands that create or change the structure of a database are called DDL (Data Definition Language): CREATE, ALTER and DROP.\n\nThe Practice Lab database lives only in your browser, so you can create and drop tables freely. Use "Reset data" to start again at any time.',
      objectives: [
        'Create a table with CREATE TABLE, giving each column a name and a type',
        'Add or rename a column with ALTER TABLE',
        'Copy data into a new table with CREATE TABLE ... AS SELECT',
        'Remove a table safely with DROP TABLE IF EXISTS'
      ],
      sections: [
        {
          heading: 'CREATE TABLE',
          text: 'CREATE TABLE makes a new, empty table. Inside the brackets you list each column with its data type, separated by commas.',
          bulletPoints: [
            'Syntax: CREATE TABLE table_name ( column1 type, column2 type, ... );',
            'Table and column names should be short, lowercase and use underscores: first_name, not "First Name".',
            'CREATE TABLE IF NOT EXISTS does nothing (instead of failing) when the table is already there.'
          ]
        },
        {
          heading: 'ALTER TABLE',
          text: 'ALTER TABLE changes an existing table without losing its data.',
          table: {
            headers: ['What you want', 'Statement'],
            rows: [
              ['Add a column', 'ALTER TABLE students ADD COLUMN phone TEXT;'],
              ['Rename a column', 'ALTER TABLE students RENAME COLUMN phone TO mobile;'],
              ['Rename the table', 'ALTER TABLE students RENAME TO learners;'],
              ['Remove a column', 'ALTER TABLE students DROP COLUMN mobile;']
            ]
          },
          bulletPoints: [
            'A new column is empty (NULL) in all the existing rows.',
            'Changing the type of a column is written differently in each database (MODIFY in MySQL, ALTER COLUMN in PostgreSQL and SQL Server).'
          ]
        },
        {
          heading: 'DROP TABLE and TRUNCATE',
          text: 'DROP TABLE deletes the whole table: its structure and all its rows. There is no undo, so be careful.',
          bulletPoints: [
            'DROP TABLE IF EXISTS name; avoids an error when the table does not exist.',
            'TRUNCATE TABLE name; (MySQL, PostgreSQL, SQL Server) removes all rows but keeps the empty table. In SQLite use DELETE FROM name;'
          ]
        },
        {
          heading: 'Create a table from a query',
          text: 'CREATE TABLE new_table AS SELECT ... makes a new table and fills it with the result of a query. It is handy for backups and reports.',
          bulletPoints: [
            'SQL Server writes the same idea as SELECT ... INTO new_table FROM ...'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Create a table, add rows and read them',
          language: 'sql',
          code: "DROP TABLE IF EXISTS students;\n\nCREATE TABLE students (\n    student_id INTEGER,\n    full_name  VARCHAR(60),\n    city       VARCHAR(40),\n    joined_on  DATE\n);\n\nINSERT INTO students VALUES (1, 'Priya Das', 'Kolkata', '2024-06-10');\nINSERT INTO students VALUES (2, 'Rahul Verma', 'Pune', '2024-06-12');\n\nSELECT * FROM students;",
          explanation: 'DROP TABLE IF EXISTS lets you run the example again. CREATE TABLE makes a table with 4 columns, two INSERTs add rows, and SELECT shows them.'
        },
        {
          title: 'Add and rename a column',
          language: 'sql',
          code: "DROP TABLE IF EXISTS students;\nCREATE TABLE students (student_id INTEGER, full_name TEXT);\nINSERT INTO students VALUES (1, 'Priya Das');\n\nALTER TABLE students ADD COLUMN phone TEXT;\nALTER TABLE students RENAME COLUMN phone TO mobile;\n\nSELECT * FROM students;",
          explanation: 'After ALTER TABLE the table has a third column, mobile. It is NULL for Priya because no value was given.'
        },
        {
          title: 'Make a new table from a query',
          language: 'sql',
          code: 'DROP TABLE IF EXISTS engineering_team;\n\nCREATE TABLE engineering_team AS\nSELECT emp_id, first_name, salary\nFROM employees\nWHERE dept_id = 1;\n\nSELECT * FROM engineering_team;',
          explanation: 'The new table engineering_team gets the columns and the 3 rows returned by the SELECT.'
        }
      ],
      bestPractices: [
        'Give every table a primary key column (next module).',
        'Use DROP TABLE IF EXISTS and CREATE TABLE IF NOT EXISTS in scripts that may run more than once.',
        'Take a backup before dropping or changing a table that holds real data.'
      ],
      commonMistakes: [
        'Leaving a comma after the last column in CREATE TABLE: ( id INTEGER, name TEXT, ) is an error.',
        'Running DROP TABLE on the wrong table - it cannot be undone.',
        'Using spaces or SQL keywords as names, for example a column called order or first name.'
      ],
      practiceExercise: {
        title: 'Build a courses table',
        problem: "1. Create a table courses with columns course_id (INTEGER), title (VARCHAR(100)) and fee (DECIMAL(8,2)).\n2. Insert two courses: (1, 'SQL Basics', 99) and (2, 'Python Basics', 99).\n3. Add a column level (TEXT).\n4. Show all rows.",
        solutionCode: "DROP TABLE IF EXISTS courses;\n\nCREATE TABLE courses (\n    course_id INTEGER,\n    title     VARCHAR(100),\n    fee       DECIMAL(8,2)\n);\n\nINSERT INTO courses VALUES (1, 'SQL Basics', 99);\nINSERT INTO courses VALUES (2, 'Python Basics', 99);\n\nALTER TABLE courses ADD COLUMN level TEXT;\n\nSELECT * FROM courses;"
      },
      keyTakeaways: [
        'CREATE TABLE defines a new table with named, typed columns.',
        'ALTER TABLE adds, renames or removes columns of an existing table.',
        'DROP TABLE deletes a table and all its data permanently.',
        'CREATE TABLE ... AS SELECT copies the result of a query into a new table.'
      ]
    }
  },

  'sql-mod-4': {
    description: 'Rules that keep data correct: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK and DEFAULT.',
    readingMaterial: {
      introduction: 'Constraints are rules on a column or table. The database checks them every time data is added or changed, and refuses data that breaks a rule. They stop mistakes such as two students with the same ID, an order for a customer who does not exist, or a negative price.',
      objectives: [
        'Use NOT NULL, UNIQUE, CHECK and DEFAULT on columns',
        'Give a table a PRIMARY KEY',
        'Link two tables with a FOREIGN KEY',
        'Read the error a database gives when a rule is broken'
      ],
      sections: [
        {
          heading: 'The six common constraints',
          text: 'You add constraints when you create the table, after the column type.',
          table: {
            headers: ['Constraint', 'What it means', 'Example'],
            rows: [
              ['NOT NULL', 'The column must have a value', 'full_name TEXT NOT NULL'],
              ['UNIQUE', 'No two rows may have the same value', 'email TEXT UNIQUE'],
              ['PRIMARY KEY', 'NOT NULL + UNIQUE; identifies each row', 'student_id INTEGER PRIMARY KEY'],
              ['FOREIGN KEY', 'Value must exist in another table', 'REFERENCES departments(dept_id)'],
              ['CHECK', 'Value must pass a test', 'CHECK (fee >= 0)'],
              ['DEFAULT', 'Value used when none is given', "status TEXT DEFAULT 'active'"]
            ]
          }
        },
        {
          heading: 'PRIMARY KEY',
          text: 'A primary key is the column (or columns) that identifies each row. Every table should have one. Its values must be unique and cannot be empty.',
          bulletPoints: [
            'In SQLite an INTEGER PRIMARY KEY column fills itself with 1, 2, 3... when you leave it out. MySQL calls this AUTO_INCREMENT; PostgreSQL uses SERIAL or GENERATED AS IDENTITY.',
            'A key made of two columns is a composite key: PRIMARY KEY (order_id, product_id).'
          ]
        },
        {
          heading: 'FOREIGN KEY',
          text: 'A foreign key is a column that refers to the primary key of another table. In the practice database, employees.dept_id refers to departments.dept_id. The database then refuses an employee whose department does not exist.',
          bulletPoints: [
            'The referenced table (departments) is called the parent; the table with the foreign key (employees) is the child.',
            'ON DELETE CASCADE deletes the child rows automatically when the parent row is deleted.',
            'SQLite checks foreign keys only after PRAGMA foreign_keys = ON; (other databases always check).'
          ]
        },
        {
          heading: 'NULL: a missing value',
          text: 'NULL means "no value" or "unknown". It is not zero and not empty text. A column allows NULL unless it is NOT NULL or a PRIMARY KEY.'
        }
      ],
      codeExamples: [
        {
          title: 'A table with constraints',
          language: 'sql',
          code: "DROP TABLE IF EXISTS members;\n\nCREATE TABLE members (\n    member_id INTEGER PRIMARY KEY,\n    full_name TEXT NOT NULL,\n    email     TEXT UNIQUE,\n    age       INTEGER CHECK (age >= 18),\n    plan      TEXT DEFAULT 'basic'\n);\n\n-- member_id is filled in automatically; plan uses its default\nINSERT INTO members (full_name, email, age) VALUES ('Priya Das', 'priya@mail.com', 22);\nINSERT INTO members (full_name, email, age, plan) VALUES ('Rahul Verma', 'rahul@mail.com', 30, 'gold');\n\nSELECT * FROM members;",
          explanation: "Priya gets member_id 1 and plan 'basic' (the default). Rahul gets member_id 2."
        },
        {
          title: 'Breaking a rule gives an error',
          language: 'sql',
          code: "DROP TABLE IF EXISTS members;\nCREATE TABLE members (\n    member_id INTEGER PRIMARY KEY,\n    email     TEXT UNIQUE,\n    age       INTEGER CHECK (age >= 18)\n);\nINSERT INTO members (email, age) VALUES ('priya@mail.com', 22);\n\n-- Delete the two dashes at the start of the next line and run again:\n-- INSERT INTO members (email, age) VALUES ('priya@mail.com', 25);\n\nSELECT * FROM members;",
          explanation: 'As written, the valid row is saved and shown. Now remove the -- before the second INSERT and run again: the database refuses it with "UNIQUE constraint failed: members.email". Change that email and set age to 15 - now the CHECK rule refuses it.'
        },
        {
          title: 'Linking two tables with a foreign key',
          language: 'sql',
          code: "PRAGMA foreign_keys = ON;  -- SQLite only: turn on foreign key checks\nDROP TABLE IF EXISTS enrolments;\nDROP TABLE IF EXISTS batches;\n\nCREATE TABLE batches (\n    batch_id INTEGER PRIMARY KEY,\n    name     TEXT NOT NULL\n);\nCREATE TABLE enrolments (\n    enrolment_id INTEGER PRIMARY KEY,\n    student      TEXT NOT NULL,\n    batch_id     INTEGER REFERENCES batches(batch_id)\n);\n\nINSERT INTO batches VALUES (1, 'Morning'), (2, 'Evening');\nINSERT INTO enrolments (student, batch_id) VALUES ('Priya', 1), ('Rahul', 2);\n\nSELECT * FROM enrolments;",
          explanation: "Both enrolments point to batches that exist. Add INSERT INTO enrolments (student, batch_id) VALUES ('Sam', 9); at the end and run again: it fails with \"FOREIGN KEY constraint failed\" because batch 9 does not exist."
        }
      ],
      bestPractices: [
        'Give every table a primary key.',
        'Make columns NOT NULL when a value is always required (names, dates, amounts).',
        'Use foreign keys for every link between tables, so the data can never point to a missing row.'
      ],
      commonMistakes: [
        'Testing for a missing value with = NULL. Use IS NULL (module 7).',
        'Using a person\'s name or phone number as the primary key - they can change or repeat. Use a numeric ID.',
        'Creating the child table before the parent table it refers to.'
      ],
      practiceExercise: {
        title: 'Products with rules',
        problem: "Create a table shop_items with:\n- item_id: INTEGER PRIMARY KEY\n- name: TEXT, required\n- sku: TEXT, must be unique\n- price: DECIMAL(8,2), must be greater than 0\n- in_stock: INTEGER, default 1\nInsert two valid items without giving item_id, then show all rows.",
        solutionCode: "DROP TABLE IF EXISTS shop_items;\n\nCREATE TABLE shop_items (\n    item_id  INTEGER PRIMARY KEY,\n    name     TEXT NOT NULL,\n    sku      TEXT UNIQUE,\n    price    DECIMAL(8,2) CHECK (price > 0),\n    in_stock INTEGER DEFAULT 1\n);\n\nINSERT INTO shop_items (name, sku, price) VALUES ('Notebook', 'NB-01', 45);\nINSERT INTO shop_items (name, sku, price) VALUES ('Pen', 'PN-01', 10);\n\nSELECT * FROM shop_items;"
      },
      keyTakeaways: [
        'Constraints are rules the database checks on every change.',
        'PRIMARY KEY = unique and not empty; one per table.',
        'FOREIGN KEY makes sure a value exists in the parent table.',
        'NOT NULL, UNIQUE, CHECK and DEFAULT keep column values valid.'
      ]
    }
  },

  'sql-mod-5': {
    description: 'Add rows with INSERT, change them with UPDATE and remove them with DELETE - and why WHERE matters so much.',
    readingMaterial: {
      introduction: 'DML (Data Manipulation Language) changes the data inside tables: INSERT adds new rows, UPDATE changes existing rows and DELETE removes rows. UPDATE and DELETE work on every row unless you say which rows with WHERE - so always check your WHERE before running them.',
      objectives: [
        'Insert one or many rows with INSERT INTO',
        'Copy rows from a query with INSERT INTO ... SELECT',
        'Change values with UPDATE ... SET ... WHERE',
        'Remove rows with DELETE FROM ... WHERE'
      ],
      sections: [
        {
          heading: 'INSERT INTO',
          text: 'INSERT adds new rows. Name the columns you are filling, then give the values in the same order.',
          bulletPoints: [
            "INSERT INTO customers (customer_id, name, city) VALUES (6, 'Kiran Rao', 'Goa');",
            'Columns you leave out get their DEFAULT value, or NULL.',
            "Insert several rows at once: VALUES (6, 'Kiran'), (7, 'Leela');",
            'INSERT INTO table_a (cols) SELECT cols FROM table_b WHERE ...; copies rows from a query.'
          ]
        },
        {
          heading: 'UPDATE',
          text: 'UPDATE changes values in existing rows. SET says what to change; WHERE says which rows.',
          bulletPoints: [
            'UPDATE products SET price = 279 WHERE product_id = 2;',
            'Change several columns: SET price = 279, category = \'Audio\'.',
            'A value can be calculated from the old value: SET salary = salary * 1.10 (a 10% raise).',
            'Without WHERE, every row in the table is changed.'
          ]
        },
        {
          heading: 'DELETE',
          text: 'DELETE removes whole rows. Like UPDATE, it uses WHERE to choose the rows.',
          bulletPoints: [
            "DELETE FROM orders WHERE status = 'CANCELLED';",
            'DELETE FROM orders; (no WHERE) removes every row but keeps the table.',
            'Before a DELETE or UPDATE, run a SELECT with the same WHERE to see which rows will be affected.'
          ]
        },
        {
          heading: 'Safe habit: SELECT first',
          text: 'Professionals check before they change. Write the WHERE as a SELECT, look at the rows, then turn it into UPDATE or DELETE. In module 14 you will also learn transactions, which let you undo changes.'
        }
      ],
      codeExamples: [
        {
          title: 'Insert one row and several rows',
          language: 'sql',
          code: "INSERT INTO customers (customer_id, name, city, signup_date)\nVALUES (6, 'Kiran Rao', 'Goa', '2024-08-01');\n\nINSERT INTO customers (customer_id, name, city)\nVALUES (7, 'Leela Menon', 'Kochi'),\n       (8, 'Omar Shaikh', 'Mumbai');\n\nSELECT * FROM customers;",
          explanation: 'The table now has 8 customers. Leela and Omar have no signup_date, so it is NULL. (Use "Reset data" in the Practice Lab to undo.)'
        },
        {
          title: 'Update with a WHERE',
          language: 'sql',
          code: "-- 1. Check which rows will change\nSELECT first_name, salary FROM employees WHERE dept_id = 3;\n\n-- 2. Give them a 10% raise\nUPDATE employees\nSET salary = ROUND(salary * 1.10)\nWHERE dept_id = 3;\n\n-- 3. See the result\nSELECT first_name, salary FROM employees WHERE dept_id = 3;",
          explanation: 'Only the two Marketing employees (Rohan and Isha) change: 61000 becomes 67100 and 55000 becomes 60500. The Lab shows the result of the last SELECT.'
        },
        {
          title: 'Delete with a WHERE',
          language: 'sql',
          code: "DELETE FROM order_items\nWHERE order_id IN (SELECT order_id FROM orders WHERE status = 'CANCELLED');\n\nDELETE FROM orders\nWHERE status = 'CANCELLED';\n\nSELECT order_id, status FROM orders;",
          explanation: "Order 1004 was cancelled. Its items are deleted first (they refer to it), then the order. 5 orders remain."
        },
        {
          title: 'Copy rows with INSERT ... SELECT',
          language: 'sql',
          code: "DROP TABLE IF EXISTS vip_customers;\nCREATE TABLE vip_customers (customer_id INTEGER, name TEXT);\n\nINSERT INTO vip_customers (customer_id, name)\nSELECT customer_id, name\nFROM customers\nWHERE city = 'Hyderabad';\n\nSELECT * FROM vip_customers;",
          explanation: 'The two Hyderabad customers are copied into the new table.'
        }
      ],
      bestPractices: [
        'Always list the column names in INSERT, so the statement still works if columns are added later.',
        'Run a SELECT with the same WHERE before every UPDATE or DELETE.',
        'Use the primary key in WHERE when you mean exactly one row: WHERE emp_id = 104.'
      ],
      commonMistakes: [
        'Forgetting WHERE in UPDATE or DELETE and changing every row.',
        'Giving the values in a different order from the column list.',
        'Deleting a parent row (an order) while child rows (its items) still refer to it.'
      ],
      practiceExercise: {
        title: 'Manage the product list',
        problem: "1. Insert a new product: product_id 6, name 'USB-C Hub', category 'Electronics', price 59.\n2. Increase the price of every Furniture product by 50.\n3. Delete the product with product_id 5.\n4. Show all products ordered by product_id.",
        solutionCode: "INSERT INTO products (product_id, name, category, price)\nVALUES (6, 'USB-C Hub', 'Electronics', 59);\n\nUPDATE products\nSET price = price + 50\nWHERE category = 'Furniture';\n\nDELETE FROM order_items WHERE product_id = 5;\nDELETE FROM products WHERE product_id = 5;\n\nSELECT * FROM products ORDER BY product_id;"
      },
      keyTakeaways: [
        'INSERT INTO table (columns) VALUES (...) adds rows.',
        'UPDATE table SET column = value WHERE ... changes rows.',
        'DELETE FROM table WHERE ... removes rows.',
        'No WHERE means every row - check with SELECT first.'
      ]
    }
  }
};
