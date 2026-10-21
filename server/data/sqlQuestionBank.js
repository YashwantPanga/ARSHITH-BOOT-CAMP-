// Comprehensive 100-Question Bank for SQL & Relational Databases Course
// 75 Module Quiz Questions (5 per module x 15 modules) + 25 NEW Final Assessment Questions

export const SQL_QUESTION_BANK = [
  // =========================================================================
  // MODULE 1 — Introduction to SQL & Databases (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m1-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-1",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "What does the abbreviation 'SQL' stand for in relational database engineering?",
    options: [
      "Structured Query Language",
      "Sequential Question Logic",
      "System Query Listing",
      "Server Quantitative Language"
    ],
    correctAnswer: 0,
    explanation: "SQL stands for Structured Query Language. Standardized by ANSI in 1986 and ISO in 1987, it is the universal language used to manage data in relational databases.",
    status: "active"
  },
  {
    id: "sql-q-m1-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-1",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Who is widely recognized as the father of relational database management systems (RDBMS) for publishing the relational model paper in 1970?",
    options: [
      "Dr. Edgar F. Codd",
      "Alan Turing",
      "Donald Knuth",
      "Linus Torvalds"
    ],
    correctAnswer: 0,
    explanation: "Dr. Edgar F. 'Ted' Codd, an IBM computer scientist, published the foundational 1970 paper defining relational algebra, primary/foreign key normalization, and relational database theory.",
    status: "active"
  },
  {
    id: "sql-q-m1-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-1",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "Which component of an RDBMS engine parses raw SQL code strings, verifies syntax rules, and generates an Abstract Syntax Tree (AST)?",
    options: [
      "Parser & AST Generator",
      "Cost-Based Optimizer (CBO)",
      "Buffer Pool RAM Manager",
      "Write-Ahead Logging (WAL) Handler"
    ],
    correctAnswer: 0,
    explanation: "The Query Parser accepts raw SQL input, checks for syntax errors, resolves identifier names against the catalog dictionary, and produces an Abstract Syntax Tree (AST) for the query planner.",
    status: "active"
  },
  {
    id: "sql-q-m1-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-1",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "Which SQL sub-language includes structural definition commands such as CREATE, ALTER, DROP, and TRUNCATE?",
    options: [
      "DDL (Data Definition Language)",
      "DML (Data Manipulation Language)",
      "DQL (Data Query Language)",
      "DCL (Data Control Language)"
    ],
    correctAnswer: 0,
    explanation: "Data Definition Language (DDL) manages schema objects like tables, views, schemas, and indexes. It includes CREATE, ALTER, DROP, TRUNCATE, and RENAME commands.",
    status: "active"
  },
  {
    id: "sql-q-m1-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-1",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "In PostgreSQL, a developer executes 'BEGIN TRANSACTION; DROP TABLE audit_logs; ROLLBACK;'. What is the status of the audit_logs table after execution?",
    options: [
      "The table remains intact because PostgreSQL supports Transactional DDL",
      "The table is permanently deleted because DDL commands always auto-commit",
      "The table schema exists but all row data is erased",
      "The query throws a syntax error because DROP TABLE cannot be inside a transaction"
    ],
    correctAnswer: 0,
    explanation: "PostgreSQL supports fully Transactional DDL. Executing ROLLBACK inside a transaction block restores the table and its data perfectly, unlike MySQL which auto-commits DDL immediately.",
    status: "active"
  },

  // =========================================================================
  // MODULE 2 — SQL Syntax, Keywords & Data Types (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m2-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-2",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which fundamental SQL keyword is used to retrieve data records from one or more tables?",
    options: [
      "SELECT",
      "FETCH",
      "EXTRACT",
      "GET"
    ],
    correctAnswer: 0,
    explanation: "SELECT is the primary SQL DQL keyword used to project columns and retrieve dataset rows from database tables.",
    status: "active"
  },
  {
    id: "sql-q-m2-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-2",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which SQL data type should ALWAYS be selected to store monetary currency values and account balances to prevent binary floating-point rounding errors?",
    options: [
      "NUMERIC / DECIMAL",
      "FLOAT",
      "DOUBLE PRECISION",
      "REAL"
    ],
    correctAnswer: 0,
    explanation: "NUMERIC/DECIMAL stores exact fixed-point numbers. Floating-point types (FLOAT/REAL) exhibit binary representation rounding errors that cause accounting discrepancies in financial applications.",
    status: "active"
  },
  {
    id: "sql-q-m2-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-2",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What is the key storage difference between CHAR(10) and VARCHAR(10) when storing the string value 'SQL'?",
    options: [
      "CHAR(10) allocates exactly 10 bytes padding 7 spaces; VARCHAR(10) stores 3 bytes plus length metadata",
      "VARCHAR(10) allocates 10 bytes padding spaces; CHAR(10) stores only 3 bytes",
      "CHAR(10) allows up to 255 characters; VARCHAR(10) allows unlimited text",
      "Both data types behave identically on physical disk storage"
    ],
    correctAnswer: 0,
    explanation: "CHAR(n) is fixed-length and pads trailing spaces up to n characters. VARCHAR(n) is variable-length and stores only the actual text bytes plus a 1-2 byte length prefix.",
    status: "active"
  },
  {
    id: "sql-q-m2-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-2",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "In ANSI-compliant SQL, what is the distinction between single quotes (') and double quotes (\")?",
    options: [
      "Single quotes enclose literal values; double quotes enclose database identifiers (e.g. table/column names)",
      "Double quotes enclose string literals; single quotes enclose identifiers",
      "Single quotes are used for numbers; double quotes are used for text",
      "Single and double quotes can be used interchangeably for all literals and identifiers"
    ],
    correctAnswer: 0,
    explanation: "ANSI standard SQL uses single quotes for string literals (e.g. 'Active') and double quotes for case-sensitive or reserved database identifiers (e.g. \"User Table\").",
    status: "active"
  },
  {
    id: "sql-q-m2-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-2",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "What will the following SQL temporal expression output?\nSELECT CAST('2026-05-15' AS DATE) + INTERVAL '10 days' AS new_date;",
    options: [
      "2026-05-25",
      "2026-05-15 00:00:10",
      "2026-06-15",
      "Syntax Error: Date math requires DATEDIFF"
    ],
    correctAnswer: 0,
    explanation: "Adding an INTERVAL '10 days' to the DATE literal '2026-05-15' yields '2026-05-25'.",
    status: "active"
  },

  // =========================================================================
  // MODULE 3 — DDL: Creating & Managing Database Structures (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m3-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-3",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which DDL command removes all data rows from a table instantly while retaining its underlying table structure and column definitions?",
    options: [
      "TRUNCATE TABLE",
      "DROP TABLE",
      "REMOVE TABLE",
      "PURGE TABLE"
    ],
    correctAnswer: 0,
    explanation: "TRUNCATE TABLE deallocates all data storage pages of a table instantly while keeping the table schema, columns, constraints, and indexes intact for future inserts.",
    status: "active"
  },
  {
    id: "sql-q-m3-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-3",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which defensive guard clause should be included in database migration scripts to prevent fatal execution errors if a table already exists?",
    options: [
      "IF NOT EXISTS",
      "IF UNIQUE",
      "WHERE NOT CREATED",
      "ON CONFLICT SKIP"
    ],
    correctAnswer: 0,
    explanation: "CREATE TABLE IF NOT EXISTS guarantees idempotent migration script execution by quietly skipping table creation if the table name is already present in the data dictionary.",
    status: "active"
  },
  {
    id: "sql-q-m3-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-3",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "Why is TRUNCATE TABLE significantly faster than DELETE FROM table when clearing multi-million row tables?",
    options: [
      "TRUNCATE deallocates disk storage pages at once without scanning individual rows or writing row-level undo logs",
      "TRUNCATE runs on a secondary thread in background mode",
      "DELETE FROM re-indexes the table during deletion, whereas TRUNCATE disables indexes",
      "TRUNCATE converts table rows into JSON archive files before deleting"
    ],
    correctAnswer: 0,
    explanation: "TRUNCATE operates at the physical storage layer by deallocating storage pages instantly. DELETE FROM scans table rows sequentially and records undo/redo logs for every single deleted row.",
    status: "active"
  },
  {
    id: "sql-q-m3-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-3",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What is the defining characteristic of a GENERATED ALWAYS AS (...) STORED column in modern relational table definitions?",
    options: [
      "Its value is automatically computed from other columns upon INSERT/UPDATE and persisted on disk",
      "It requires a client application trigger to update its value",
      "It can be manually overwritten by user UPDATE queries at any time",
      "It generates random primary key UUID strings automatically"
    ],
    correctAnswer: 0,
    explanation: "Generated stored columns calculate their values from defined expression formulas automatically whenever a row is inserted or updated, persisting the computed result directly on disk.",
    status: "active"
  },
  {
    id: "sql-q-m3-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-3",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "A database developer needs to add a NOT NULL column named 'status' to a production table containing 100,000 existing rows. Which statement executes without error?",
    options: [
      "ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active';",
      "ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL;",
      "ALTER TABLE users INSERT COLUMN status VARCHAR(20) NOT NULL;",
      "UPDATE users ADD status VARCHAR(20) NOT NULL DEFAULT 'Active';"
    ],
    correctAnswer: 0,
    explanation: "Adding a NOT NULL column to a populated table requires providing a DEFAULT value. Without a DEFAULT value, the engine fails because existing rows would receive invalid NULL values.",
    status: "active"
  },

  // =========================================================================
  // MODULE 4 — Constraints & Keys (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m4-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-4",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which database constraint enforces Entity Integrity by ensuring that every row in a table is uniquely identifiable and non-null?",
    options: [
      "PRIMARY KEY",
      "CHECK",
      "FOREIGN KEY",
      "DEFAULT"
    ],
    correctAnswer: 0,
    explanation: "PRIMARY KEY enforces Entity Integrity. It guarantees that key values are strictly unique across all rows and implicitly enforces NOT NULL.",
    status: "active"
  },
  {
    id: "sql-q-m4-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-4",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "What happens when an INSERT query attempts to write a value into a UNIQUE column that already exists in another row of the table?",
    options: [
      "The database engine aborts the INSERT and throws a unique constraint violation error",
      "The database overwrites the existing row with the new values",
      "The database converts the duplicate value into NULL automatically",
      "The database creates a copy of the table in scratch memory"
    ],
    correctAnswer: 0,
    explanation: "UNIQUE constraints reject duplicate values. Any attempt to insert a duplicate value results in a constraint violation error that aborts the transaction.",
    status: "active"
  },
  {
    id: "sql-q-m4-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-4",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "In a Foreign Key relationship between 'orders' (child) and 'customers' (parent), what occurs when a customer record is deleted if the Foreign Key is defined with ON DELETE CASCADE?",
    options: [
      "All associated order records for that customer are automatically deleted from the orders table",
      "The customer deletion is blocked until orders are manually removed",
      "The customer_id values in the orders table are set to NULL",
      "The orders table is dropped from the database"
    ],
    correctAnswer: 0,
    explanation: "ON DELETE CASCADE maintains referential integrity by automatically removing all child records (orders) whenever their referenced parent record (customer) is deleted.",
    status: "active"
  },
  {
    id: "sql-q-m4-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-4",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "Which constraint type enforces Domain Integrity by validating that column values satisfy a specific Boolean predicate (e.g. CHECK (salary > 0))?",
    options: [
      "CHECK Constraint",
      "FOREIGN KEY Constraint",
      "UNIQUE Constraint",
      "PRIMARY KEY Constraint"
    ],
    correctAnswer: 0,
    explanation: "CHECK constraints evaluate Boolean expressions against inserted/updated column values, rejecting any data modifications where the predicate evaluates to FALSE.",
    status: "active"
  },
  {
    id: "sql-q-m4-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-4",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Consider table 'bank_accounts' created with:\nCREATE TABLE bank_accounts (\n  account_id INT PRIMARY KEY,\n  balance NUMERIC(12,2) CHECK (balance >= 0.00)\n);\nWhat happens if an UPDATE attempts to set balance = -150.00 for account_id = 1?",
    options: [
      "The UPDATE operation fails with a CHECK constraint error and the balance remains unchanged",
      "The balance is set to 0.00 automatically",
      "The balance is updated to -150.00 and a warning is written to log files",
      "The account record is moved to an overdraft table"
    ],
    correctAnswer: 0,
    explanation: "Setting balance to -150.00 causes the CHECK predicate (balance >= 0.00) to evaluate to FALSE, triggering a constraint violation error that leaves the row untouched.",
    status: "active"
  },

  // =========================================================================
  // MODULE 5 — DML: INSERT, UPDATE & DELETE (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m5-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-5",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which DML statement is used to append new rows of data into a database table?",
    options: [
      "INSERT INTO",
      "ADD ROW",
      "APPEND DATA",
      "CREATE ROW"
    ],
    correctAnswer: 0,
    explanation: "INSERT INTO is the standard SQL DML command used to insert new records into a table.",
    status: "active"
  },
  {
    id: "sql-q-m5-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-5",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "What is the critical risk of executing an UPDATE statement without specifying a WHERE clause?",
    options: [
      "Every single row in the target table will be updated with the new values",
      "The database engine will reject the query due to missing syntax",
      "Only the first row of the table will be updated",
      "The table will be truncated automatically"
    ],
    correctAnswer: 0,
    explanation: "Omitting the WHERE clause in an UPDATE statement applies the column assignment to every row in the table, potentially overwriting entire datasets accidentally.",
    status: "active"
  },
  {
    id: "sql-q-m5-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-5",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "How many distinct rows will be inserted by the following statement?\nINSERT INTO skills (skill_name) VALUES ('SQL'), ('Python'), ('Docker');",
    options: [
      "3 rows",
      "1 row containing a string array",
      "0 rows until COMMIT is called explicitly in all engines",
      "Syntax error: Multi-row INSERT is not valid ANSI SQL"
    ],
    correctAnswer: 0,
    explanation: "Multi-row INSERT statements separate tuple values with commas, inserting 3 distinct rows in a single batch operation.",
    status: "active"
  },
  {
    id: "sql-q-m5-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-5",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What is the effect of executing: DELETE FROM employees WHERE department = 'Sales';",
    options: [
      "Deletes only the employee rows belonging to the Sales department",
      "Deletes the entire employees table and its schema definition",
      "Sets the department column to NULL for Sales employees",
      "Deletes the Sales department entry from the departments table"
    ],
    correctAnswer: 0,
    explanation: "DELETE FROM with a WHERE clause removes only the specific rows matching the predicate, preserving all non-matching rows and the table structure.",
    status: "active"
  },
  {
    id: "sql-q-m5-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-5",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Table 'products' has columns (id, price, stock) with a row (id=1, price=100.00, stock=5).\nWhat is the value of price after executing:\nUPDATE products SET price = price * 1.10 WHERE id = 1 AND stock > 0;",
    options: [
      "110.00",
      "100.00",
      "105.00",
      "0.00"
    ],
    correctAnswer: 0,
    explanation: "Since stock=5 satisfies stock > 0, price is updated to 100.00 * 1.10 = 110.00.",
    status: "active"
  },

  // =========================================================================
  // MODULE 6 — SELECT Statement: Retrieving Data (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m6-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-6",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which clause in a SELECT query specifies the source table from which data columns are retrieved?",
    options: [
      "FROM",
      "INTO",
      "SOURCE",
      "TABLE"
    ],
    correctAnswer: 0,
    explanation: "The FROM clause identifies the table, view, or subquery source from which dataset rows are extracted.",
    status: "active"
  },
  {
    id: "sql-q-m6-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-6",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Why is executing 'SELECT *' considered a severe production anti-pattern in enterprise backend software?",
    options: [
      "It prevents Index-Only scans, inflates network payload sizes, and breaks positional application code",
      "It causes database servers to lock tables in exclusive write mode",
      "It converts text data into uppercase automatically",
      "It is restricted by database administrators in production servers"
    ],
    correctAnswer: 0,
    explanation: "SELECT * forces disk table heap lookups, transfers unneeded text/BLOB columns over network interfaces, and breaks backend code when schema column orders change.",
    status: "active"
  },
  {
    id: "sql-q-m6-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-6",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "Which function safely handles division operations by returning NULL instead of crashing with a division by zero error if the denominator is 0?",
    options: [
      "NULLIF(denominator, 0)",
      "COALESCE(denominator, 0)",
      "ISNULL(denominator)",
      "ZEROIF(denominator)"
    ],
    correctAnswer: 0,
    explanation: "NULLIF(a, b) returns NULL if a equals b. Wrapping denominators in NULLIF(denominator, 0) yields NULL on zero, preventing division by zero query execution crashes.",
    status: "active"
  },
  {
    id: "sql-q-m6-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-6",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "How do you assign a temporary descriptive column label to a calculated field in a SELECT projection?",
    options: [
      "Using the AS keyword (e.g. SELECT unit_price * qty AS total_cost)",
      "Using the LABEL keyword",
      "Using the ALIAS keyword",
      "Enclosing the calculation in square brackets"
    ],
    correctAnswer: 0,
    explanation: "The AS keyword assigns column or table aliases in SQL queries (e.g. SELECT price * qty AS total_cost).",
    status: "active"
  },
  {
    id: "sql-q-m6-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-6",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "What will the following query output for a row where first_name = 'Arshith' and last_name = 'Kumar'?\nSELECT CONCAT_WS(' ', first_name, last_name) AS full_name FROM users;",
    options: [
      "Arshith Kumar",
      "Arshith, Kumar",
      "ArshithKumar",
      "WS Arshith Kumar"
    ],
    correctAnswer: 0,
    explanation: "CONCAT_WS(separator, str1, str2) concatenates arguments using the specified separator (' '), producing 'Arshith Kumar'.",
    status: "active"
  },

  // =========================================================================
  // MODULE 7 — Filtering Data with WHERE & Operators (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m7-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-7",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which SQL operator filters dataset rows by testing if a value falls within an inclusive numeric or date range?",
    options: [
      "BETWEEN",
      "IN",
      "LIKE",
      "WITHIN"
    ],
    correctAnswer: 0,
    explanation: "BETWEEN min_val AND max_val tests if expressions fall within an inclusive range (e.g. WHERE price BETWEEN 10 AND 50).",
    status: "active"
  },
  {
    id: "sql-q-m7-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-7",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "In a LIKE pattern matching query, which wildcard symbol represents any sequence of zero or more characters?",
    options: [
      "%",
      "_",
      "*",
      "?"
    ],
    correctAnswer: 0,
    explanation: "The percent sign (%) wildcard matches any sequence of zero or more characters. The underscore (_) wildcard matches exactly one character.",
    status: "active"
  },
  {
    id: "sql-q-m7-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-7",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What does the query predicate 'WHERE status IN ('Pending', 'Processing')' accomplish?",
    options: [
      "Matches rows where status is equal to either 'Pending' or 'Processing'",
      "Matches rows where status contains the string 'Pending Processing'",
      "Matches rows where status is NOT equal to 'Pending'",
      "Creates a new status column with those two values"
    ],
    correctAnswer: 0,
    explanation: "The IN operator acts as shorthand for multiple OR conditions, matching any row where status equals any literal in the list.",
    status: "active"
  },
  {
    id: "sql-q-m7-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-7",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "Why does the comparison 'WHERE score = NULL' fail to return rows with missing scores in standard SQL?",
    options: [
      "In SQL, comparing anything to NULL using '=' yields UNKNOWN; 'IS NULL' must be used",
      "NULL values can only be filtered using the LIKE operator",
      "Equality comparison on NULL automatically converts NULL into 0",
      "NULL values are excluded from database tables completely"
    ],
    correctAnswer: 0,
    explanation: "NULL represents an unknown state. Any arithmetic or comparison expression with NULL using = or != yields UNKNOWN (false). Checking for NULL requires IS NULL or IS NOT NULL.",
    status: "active"
  },
  {
    id: "sql-q-m7-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-7",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Consider an employee record with age = 25, salary = 80000, and department = 'Engineering'.\nDoes this row match the predicate?\nWHERE age > 30 AND (salary > 50000 OR department = 'Sales')",
    options: [
      "No, because age > 30 evaluates to FALSE",
      "Yes, because salary > 50000 is TRUE",
      "Yes, because parentheses override age restrictions",
      "No, because department is not Sales"
    ],
    correctAnswer: 0,
    explanation: "Logical AND requires both sides to be TRUE. Since age > 30 is FALSE (25 > 30 is false), the overall condition evaluates to FALSE regardless of the parenthesized OR clause.",
    status: "active"
  },

  // =========================================================================
  // MODULE 8 — DISTINCT, ORDER BY & LIMIT (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m8-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-8",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which SQL keyword eliminates duplicate rows from a query result set?",
    options: [
      "DISTINCT",
      "UNIQUE",
      "GROUP",
      "FILTER"
    ],
    correctAnswer: 0,
    explanation: "SELECT DISTINCT scans projected result tuples and removes duplicate identical rows from the final query output.",
    status: "active"
  },
  {
    id: "sql-q-m8-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-8",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "What is the default sort direction of the ORDER BY clause if neither ASC nor DESC is specified?",
    options: [
      "ASC (Ascending)",
      "DESC (Descending)",
      "Unsorted / Random",
      "Primary key order"
    ],
    correctAnswer: 0,
    explanation: "By default, ORDER BY sorts values in ASC (ascending) order (smallest to largest / A to Z) when no direction is specified.",
    status: "active"
  },
  {
    id: "sql-q-m8-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-8",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "In SQL result pagination, what does 'LIMIT 10 OFFSET 20' achieve?",
    options: [
      "Skips the first 20 rows and returns the next 10 rows",
      "Returns 20 rows starting from row 10",
      "Limits results to rows where ID is between 10 and 20",
      "Sorts 10 rows by column 20"
    ],
    correctAnswer: 0,
    explanation: "OFFSET 20 skips the first 20 matching rows of the result set; LIMIT 10 restricts the returned batch to 10 rows (page 3 of size 10).",
    status: "active"
  },
  {
    id: "sql-q-m8-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-8",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "In PostgreSQL, where do NULL values appear by default when executing 'ORDER BY score ASC'?",
    options: [
      "NULLs appear LAST by default in ASC order",
      "NULLs appear FIRST by default in ASC order",
      "NULL values trigger a runtime error during sorting",
      "NULL values are omitted from the output completely"
    ],
    correctAnswer: 0,
    explanation: "In PostgreSQL standard sorting, NULLS ARE CONSIDERED LARGER THAN ANY VALUE. Thus, ORDER BY col ASC places NULLs LAST by default (unless NULLS FIRST is explicitly specified).",
    status: "active"
  },
  {
    id: "sql-q-m8-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-8",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "What does the following query return?\nSELECT DISTINCT category FROM products ORDER BY category DESC LIMIT 3;",
    options: [
      "The top 3 unique product category names sorted in reverse alphabetical order",
      "The 3 most expensive products in each category",
      "The first 3 rows of the products table without sorting",
      "Categories with 3 or more products"
    ],
    correctAnswer: 0,
    explanation: "DISTINCT deduplicates category names, ORDER BY category DESC sorts them alphabetically from Z to A, and LIMIT 3 returns the top 3 items.",
    status: "active"
  },

  // =========================================================================
  // MODULE 9 — Aggregate Functions, GROUP BY & HAVING (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m9-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-9",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which aggregate function computes the total number of rows matching a query condition?",
    options: [
      "COUNT()",
      "SUM()",
      "TOTAL()",
      "NUMROWS()"
    ],
    correctAnswer: 0,
    explanation: "COUNT() is the standard SQL aggregate function that counts rows or non-null values across group partitions.",
    status: "active"
  },
  {
    id: "sql-q-m9-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-9",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "What is the fundamental functional difference between the WHERE clause and the HAVING clause?",
    options: [
      "WHERE filters individual rows BEFORE grouping; HAVING filters aggregated groups AFTER GROUP BY",
      "HAVING filters individual rows; WHERE filters aggregated groups",
      "WHERE is used with SELECT; HAVING is used only with INSERT",
      "There is no difference; they are aliases"
    ],
    correctAnswer: 0,
    explanation: "WHERE operates on individual rows before the GROUP BY phase. HAVING evaluates predicates on aggregated summary values (e.g. HAVING COUNT(*) > 5) after grouping.",
    status: "active"
  },
  {
    id: "sql-q-m9-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-9",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "How does COUNT(*) differ from COUNT(email) when counting rows in a table?",
    options: [
      "COUNT(*) counts all rows including NULLs; COUNT(email) counts only rows where email IS NOT NULL",
      "COUNT(email) is faster because it uses an index",
      "COUNT(*) excludes NULL values, while COUNT(email) includes NULLs",
      "Both count identical values in all relational engines"
    ],
    correctAnswer: 0,
    explanation: "COUNT(*) counts total table tuples regardless of contents. COUNT(column) evaluates the specific column and skips NULL entries.",
    status: "active"
  },
  {
    id: "sql-q-m9-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-9",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What occurs if a non-aggregated column (e.g. employee_name) is projected in a SELECT statement containing GROUP BY department?",
    options: [
      "The database engine throws a GROUP BY syntax error unless employee_name is in the GROUP BY clause or wrapped in an aggregate function",
      "The engine selects the first employee name alphabetically",
      "The engine returns NULL for employee_name",
      "The query executes normally by picking a random name"
    ],
    correctAnswer: 0,
    explanation: "ANSI SQL requires that any non-aggregated column in the SELECT projection list must appear in the GROUP BY clause to ensure deterministic row grouping.",
    status: "active"
  },
  {
    id: "sql-q-m9-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-9",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "What will the following query return?\nSELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department HAVING AVG(salary) > 75000;",
    options: [
      "Department names and average salaries for departments whose average employee salary exceeds 75,000",
      "All employees with salary over 75,000 grouped by department",
      "The department with the highest overall salary",
      "An error because AVG cannot be used in HAVING"
    ],
    correctAnswer: 0,
    explanation: "The query aggregates employees into department groups, calculates the average salary per department, and filters out departments where the average is <= 75000.",
    status: "active"
  },

  // =========================================================================
  // MODULE 10 — SQL Joins & Relationships (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m10-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-10",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which type of SQL JOIN returns ONLY rows where join key values match in both participating tables?",
    options: [
      "INNER JOIN",
      "LEFT JOIN",
      "FULL OUTER JOIN",
      "CROSS JOIN"
    ],
    correctAnswer: 0,
    explanation: "INNER JOIN produces a result set containing only matching record tuples from both tables where the ON condition is satisfied.",
    status: "active"
  },
  {
    id: "sql-q-m10-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-10",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which JOIN returns ALL rows from the left table and matching rows from the right table, populating right-side columns with NULL when no match exists?",
    options: [
      "LEFT JOIN (LEFT OUTER JOIN)",
      "RIGHT JOIN",
      "INNER JOIN",
      "SELF JOIN"
    ],
    correctAnswer: 0,
    explanation: "LEFT JOIN retains every record from the left table regardless of matches, placing NULL values in right table attributes when no matching foreign key exists.",
    status: "active"
  },
  {
    id: "sql-q-m10-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-10",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What is a CROSS JOIN in relational database querying?",
    options: [
      "A Cartesian Product that pairs every row of Table A with every row of Table B (M x N rows)",
      "A join that matches records across two different database servers",
      "A join that filters rows using a subquery predicate",
      "An inner join with multiple ON conditions"
    ],
    correctAnswer: 0,
    explanation: "CROSS JOIN performs a Cartesian Product, producing every possible pair combination between Table A (M rows) and Table B (N rows), yielding M × N total output rows.",
    status: "active"
  },
  {
    id: "sql-q-m10-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-10",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What is a Self-Join in SQL?",
    options: [
      "Joining a table to itself using table aliases to model hierarchical parent-child relationships",
      "A join that executes inside a single CPU core",
      "Joining two tables with identical column names",
      "Updating a table based on its own primary key"
    ],
    correctAnswer: 0,
    explanation: "A Self-Join joins a table to itself using distinct aliases (e.g. emp e JOIN emp m ON e.manager_id = m.id) to query hierarchical structures like employee-manager relationships.",
    status: "active"
  },
  {
    id: "sql-q-m10-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-10",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Given table Customers (5 rows) and Orders (3 rows matching 2 customers).\nHow many output rows does the following query return?\nSELECT * FROM Customers LEFT JOIN Orders ON Customers.id = Orders.customer_id;",
    options: [
      "6 rows (3 matching order rows + 3 non-matching customer rows with NULLs)",
      "5 rows",
      "3 rows",
      "15 rows"
    ],
    correctAnswer: 0,
    explanation: "The 2 matching customers produce 3 order rows. The remaining 3 unmatched customers each produce 1 row with NULL order fields. Total = 3 + 3 = 6 rows.",
    status: "active"
  },

  // =========================================================================
  // MODULE 11 — Subqueries, UNION & Advanced Querying (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m11-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-11",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "What is a Subquery (or nested query) in SQL?",
    options: [
      "A SELECT query nested inside another SELECT, INSERT, UPDATE, or DELETE statement",
      "A query stored in a secondary text file on disk",
      "A background daemon process that cleans indexes",
      "A query that runs only on standby read replicas"
    ],
    correctAnswer: 0,
    explanation: "A Subquery is an inner query embedded within an outer SQL statement to supply filtering criteria, scalar values, or dynamic table datasets.",
    status: "active"
  },
  {
    id: "sql-q-m11-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-11",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "What is the primary operational difference between UNION and UNION ALL when combining query result sets?",
    options: [
      "UNION removes duplicate rows between result sets; UNION ALL retains all rows including duplicates and executes faster",
      "UNION ALL removes duplicates; UNION retains duplicates",
      "UNION requires identical table names; UNION ALL allows different tables",
      "UNION ALL can only be used with numeric columns"
    ],
    correctAnswer: 0,
    explanation: "UNION performs a deduplication sort to eliminate duplicate rows between datasets. UNION ALL simply concatenates result sets without deduplication, making it significantly faster.",
    status: "active"
  },
  {
    id: "sql-q-m11-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-11",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What is a Correlated Subquery?",
    options: [
      "A subquery that references column attributes from the outer query, evaluating once for each row processed by the outer query",
      "A subquery that runs once before the outer query executes",
      "A subquery connected using a CROSS JOIN",
      "A subquery that creates temporary disk tables"
    ],
    correctAnswer: 0,
    explanation: "Correlated Subqueries depend on values from outer query rows. The inner query re-executes for every row evaluated by the outer statement.",
    status: "active"
  },
  {
    id: "sql-q-m11-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-11",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "Which SQL clause defined using the WITH keyword allows creating reusable, named temporary result sets (CTEs) within a single query execution?",
    options: [
      "Common Table Expression (CTE)",
      "VIEW Statement",
      "TEMPORARY SCHEMA",
      "WINDOW PARTITION"
    ],
    correctAnswer: 0,
    explanation: "Common Table Expressions (CTEs), introduced with WITH, define modular named query blocks that enhance legibility and reusability within complex queries.",
    status: "active"
  },
  {
    id: "sql-q-m11-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-11",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Which query correctly identifies employees who earn more than their own department's average salary?",
    options: [
      "SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);",
      "SELECT * FROM employees WHERE salary > AVG(salary) GROUP BY department;",
      "SELECT * FROM employees HAVING salary > AVG(salary);",
      "SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);"
    ],
    correctAnswer: 0,
    explanation: "Option A uses a correlated subquery filtering the inner AVG(salary) by the outer employee's department (e.department).",
    status: "active"
  },

  // =========================================================================
  // MODULE 12 — SQL Functions & Conditional Logic (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m12-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-12",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which SQL expression provides IF-THEN-ELSE conditional evaluation logic directly inside SELECT projections?",
    options: [
      "CASE expression",
      "IFNULL statement",
      "DECODE block",
      "SWITCH clause"
    ],
    correctAnswer: 0,
    explanation: "CASE WHEN predicate THEN result ELSE fallback END provides ANSI standard conditional logic inside queries.",
    status: "active"
  },
  {
    id: "sql-q-m12-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-12",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which scalar string function returns the total character count of a text field?",
    options: [
      "LENGTH() / CHAR_LENGTH()",
      "COUNT()",
      "SIZE()",
      "TEXTLEN()"
    ],
    correctAnswer: 0,
    explanation: "LENGTH() or CHAR_LENGTH() returns the number of characters present in a string value.",
    status: "active"
  },
  {
    id: "sql-q-m12-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-12",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What does COALESCE(val1, val2, val3) return when evaluated in a SELECT projection?",
    options: [
      "Returns the first non-null argument in the parameter list",
      "Returns NULL if all values are distinct",
      "Concatenates all non-null text values",
      "Returns the sum of all arguments"
    ],
    correctAnswer: 0,
    explanation: "COALESCE evaluates arguments sequentially from left to right and returns the first value that is NOT NULL.",
    status: "active"
  },
  {
    id: "sql-q-m12-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-12",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What will the scalar string expression output?\nSELECT LOWER(SUBSTRING('DATABASE', 1, 4));",
    options: [
      "data",
      "DATA",
      "base",
      "db"
    ],
    correctAnswer: 0,
    explanation: "SUBSTRING('DATABASE', 1, 4) extracts 4 characters starting at position 1 ('DATA'). LOWER() converts 'DATA' to lowercase ('data').",
    status: "active"
  },
  {
    id: "sql-q-m12-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-12",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "What result does this CASE expression yield for score = 85?\nSELECT CASE \n  WHEN score >= 90 THEN 'A' \n  WHEN score >= 80 THEN 'B' \n  ELSE 'C' \nEND AS grade;",
    options: [
      "B",
      "A",
      "C",
      "NULL"
    ],
    correctAnswer: 0,
    explanation: "score = 85 is evaluated sequentially. score >= 90 is FALSE. score >= 80 (85 >= 80) is TRUE, returning 'B'.",
    status: "active"
  },

  // =========================================================================
  // MODULE 13 — Views, Indexes & Database Optimization (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m13-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-13",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "What is a SQL View?",
    options: [
      "A virtual table based on the stored result set of a SELECT query",
      "A copy of table data stored in client browser memory",
      "A physical snapshot of disk heap storage",
      "A GUI tool used by DBAs"
    ],
    correctAnswer: 0,
    explanation: "A View is a virtual saved query structure that simplifies complex queries and restricts column access without duplicating underlying data.",
    status: "active"
  },
  {
    id: "sql-q-m13-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-13",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which tree data structure is most widely used by relational engines for fast primary key and indexed lookups?",
    options: [
      "B-Tree (Balanced Tree)",
      "Linked List",
      "Binary Search Tree (Unbalanced)",
      "Graph Database Network"
    ],
    correctAnswer: 0,
    explanation: "B-Tree indexes maintain sorted self-balancing tree structures that enable logarithmic time complexity (O(log N)) search lookups.",
    status: "active"
  },
  {
    id: "sql-q-m13-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-13",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "How does adding a B-Tree index on a table column affect SELECT read performance versus INSERT/UPDATE write performance?",
    options: [
      "Accelerates SELECT read queries, but slightly slows down INSERT/UPDATE writes due to index maintenance overhead",
      "Accelerates both reads and writes equally",
      "Slows down SELECT reads, but accelerates INSERT writes",
      "Has zero impact on write operations"
    ],
    correctAnswer: 0,
    explanation: "Indexes speed up read operations by avoiding full table scans. However, every INSERT, UPDATE, or DELETE must also update the B-Tree index pages on disk.",
    status: "active"
  },
  {
    id: "sql-q-m13-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-13",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "Which SQL utility command allows database engineers to inspect the query execution plan selected by the cost-based optimizer?",
    options: [
      "EXPLAIN (or EXPLAIN ANALYZE)",
      "INSPECT QUERY",
      "SHOW EXECUTION",
      "DEBUG QUERY"
    ],
    correctAnswer: 0,
    explanation: "EXPLAIN prints the execution plan details (Seq Scan, Index Scan, Nested Loop, Cost) chosen by the database query optimizer.",
    status: "active"
  },
  {
    id: "sql-q-m13-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-13",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "Given a Composite Index created on (last_name, first_name), which WHERE clause can utilize this index efficiently under the Leftmost Prefix Rule?",
    options: [
      "WHERE last_name = 'Smith' AND first_name = 'John', as well as WHERE last_name = 'Smith'",
      "WHERE first_name = 'John' only",
      "WHERE department = 'Sales'",
      "Only queries using OR conditions"
    ],
    correctAnswer: 0,
    explanation: "Under the Leftmost Prefix Rule, a composite index (A, B) can optimize queries filtering by (A) or (A AND B), but CANNOT optimize queries filtering by (B) alone.",
    status: "active"
  },

  // =========================================================================
  // MODULE 14 — Transactions, TCL & Database Security (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m14-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-14",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "What does the acronym ACID stand for in transaction processing architecture?",
    options: [
      "Atomicity, Consistency, Isolation, Durability",
      "Authentication, Control, Integrity, Security",
      "Authorization, Cipher, Indexing, Decryption",
      "Access, Concurrency, Isolation, Deployment"
    ],
    correctAnswer: 0,
    explanation: "ACID principles guarantee reliable transaction execution: Atomicity (all-or-nothing), Consistency (rules enforced), Isolation (concurrent safety), Durability (persisted on disk).",
    status: "active"
  },
  {
    id: "sql-q-m14-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-14",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which TCL command permanently persists all data modifications made during the active transaction block onto physical disk storage?",
    options: [
      "COMMIT",
      "SAVE",
      "PERSIST",
      "END"
    ],
    correctAnswer: 0,
    explanation: "COMMIT ends the active transaction and writes changes permanently to disk and transaction logs.",
    status: "active"
  },
  {
    id: "sql-q-m14-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-14",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "Which DCL command assigns specific access privileges (e.g. SELECT, INSERT) on database objects to user roles?",
    options: [
      "GRANT",
      "ALLOW",
      "ASSIGN",
      "PERMIT"
    ],
    correctAnswer: 0,
    explanation: "GRANT specifies access rights (e.g. GRANT SELECT, INSERT ON orders TO app_role;) to database roles.",
    status: "active"
  },
  {
    id: "sql-q-m14-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-14",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "What is the purpose of a SAVEPOINT statement inside a multi-statement transaction?",
    options: [
      "Establishes a named checkpoint to which you can roll back partial changes without aborting the entire transaction",
      "Saves query results to a CSV file automatically",
      "Locks the database against read operations",
      "Creates an automatic backup copy of the database"
    ],
    correctAnswer: 0,
    explanation: "SAVEPOINT point_name allows rolling back sub-operations within a transaction (ROLLBACK TO SAVEPOINT) while continuing the remainder of the transaction.",
    status: "active"
  },
  {
    id: "sql-q-m14-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-14",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "A database server experiences a complete power failure midway through executing a multi-statement transaction before COMMIT is called. What happens upon restart?",
    options: [
      "Atomicity guarantees that crash recovery rolls back all uncommitted changes using WAL transaction logs",
      "Partial statements executed before the crash remain in the table",
      "The database drops the affected tables automatically",
      "An administrator must manually inspect every row"
    ],
    correctAnswer: 0,
    explanation: "Atomicity enforces that transactions complete 100% or 0%. Crash recovery uses the Write-Ahead Log (WAL) to undo uncommitted transactions upon server reboot.",
    status: "active"
  },

  // =========================================================================
  // MODULE 15 — SQL for Data Analytics, Python & AI + Final Project (5 Questions)
  // =========================================================================
  {
    id: "sql-q-m15-1",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-15",
    category: "module",
    order: 1,
    difficulty: "easy",
    questionText: "Which Python standard library module provides an embedded relational SQL engine without requiring external server installation?",
    options: [
      "sqlite3",
      "psycopg2",
      "pymysql",
      "sqlalchemy"
    ],
    correctAnswer: 0,
    explanation: "sqlite3 is built into the Python standard library, providing lightweight embedded SQL database functionality out-of-the-box.",
    status: "active"
  },
  {
    id: "sql-q-m15-2",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-15",
    category: "module",
    order: 2,
    difficulty: "easy-medium",
    questionText: "Which Pandas library function executes a SQL query and loads the result dataset directly into a Pandas DataFrame?",
    options: [
      "pd.read_sql_query()",
      "pd.load_sql()",
      "pd.parse_sql()",
      "pd.import_query()"
    ],
    correctAnswer: 0,
    explanation: "pd.read_sql_query(sql, con) executes a SQL query over a database connection and returns the dataset formatted as a DataFrame.",
    status: "active"
  },
  {
    id: "sql-q-m15-3",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-15",
    category: "module",
    order: 3,
    difficulty: "medium",
    questionText: "What is the primary security protection achieved by using Parameterized Queries (e.g. cur.execute('SELECT * FROM users WHERE id = ?', (user_id,)))?",
    options: [
      "Completely prevents SQL Injection attacks by binding user input strictly as literal data parameters",
      "Encrypts network traffic using SSL",
      "Compresses database query payloads",
      "Prevents deadlocks in multi-threaded code"
    ],
    correctAnswer: 0,
    explanation: "Parameterized queries separate executable SQL syntax from user input parameters, preventing attackers from injecting malicious SQL commands into queries.",
    status: "active"
  },
  {
    id: "sql-q-m15-4",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-15",
    category: "module",
    order: 4,
    difficulty: "medium",
    questionText: "How can AI Large Language Model (LLM) tools assist database engineers in enterprise SQL workflows?",
    options: [
      "By explaining execution plan bottlenecks, suggesting index strategies, and converting natural language into SQL queries",
      "By replacing relational database storage engines completely",
      "By bypassing SQL syntax validation checks",
      "By automatically dropping unused database tables without backups"
    ],
    correctAnswer: 0,
    explanation: "AI tools assist developers by generating complex query drafts, identifying missing B-Tree index candidates, explaining EXPLAIN output, and refactoring inefficient queries.",
    status: "active"
  },
  {
    id: "sql-q-m15-5",
    courseId: "sql-data-analysis",
    moduleId: "sql-mod-15",
    category: "module",
    order: 5,
    difficulty: "medium-practical",
    questionText: "In a Python sqlite3 application, what step MUST be invoked after executing INSERT or UPDATE queries to persist changes permanently to the database file?",
    options: [
      "conn.commit()",
      "conn.save()",
      "cur.persist()",
      "cur.close()"
    ],
    correctAnswer: 0,
    explanation: "sqlite3 opens implicit transactions. Modifications made by INSERT, UPDATE, or DELETE are lost unless conn.commit() is explicitly called before closing the connection.",
    status: "active"
  },

  // =========================================================================
  // FINAL SQL ASSESSMENT — 25 NEW UNIQUE QUESTIONS (Covering Modules 1-15)
  // =========================================================================
  {
    id: "sql-q-final-1",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 1,
    difficulty: "easy",
    questionText: "Which SQL sub-language command is 'GRANT SELECT ON orders TO analyst_role;' categorized under?",
    options: [
      "DCL (Data Control Language)",
      "DDL (Data Definition Language)",
      "DML (Data Manipulation Language)",
      "TCL (Transaction Control Language)"
    ],
    correctAnswer: 0,
    explanation: "GRANT and REVOKE belong to Data Control Language (DCL), which manages access security and privilege permissions on database objects.",
    status: "active"
  },
  {
    id: "sql-q-final-2",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 2,
    difficulty: "medium",
    questionText: "Why can schema DDL statements like CREATE TABLE be safely executed inside a BEGIN...COMMIT transaction block in PostgreSQL, whereas in MySQL they cannot?",
    options: [
      "PostgreSQL supports Transactional DDL, whereas MySQL issues implicit auto-commits for DDL commands",
      "MySQL requires all tables to be created in RAM first",
      "PostgreSQL disables write-ahead logs during DDL",
      "MySQL does not support transactions"
    ],
    correctAnswer: 0,
    explanation: "PostgreSQL implements Transactional DDL, allowing DDL commands to roll back cleanly. MySQL immediately auto-commits DDL operations, preventing rollback.",
    status: "active"
  },
  {
    id: "sql-q-final-3",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 3,
    difficulty: "medium",
    questionText: "What is the primary operational advantage of storing application timestamps using TIMESTAMPTZ instead of plain TIMESTAMP?",
    options: [
      "TIMESTAMPTZ converts incoming client timestamps to UTC for storage and converts UTC back to the client session timezone on output",
      "TIMESTAMPTZ uses 50% less disk storage space than TIMESTAMP",
      "TIMESTAMPTZ allows dates before the year 1970",
      "TIMESTAMP cannot be sorted using ORDER BY"
    ],
    correctAnswer: 0,
    explanation: "TIMESTAMPTZ normalizes all timestamps to UTC on disk and adjusts values to local session timezones on retrieval, preventing timezone bugs across global servers.",
    status: "active"
  },
  {
    id: "sql-q-final-4",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 4,
    difficulty: "advanced",
    questionText: "An engineer executes 'CREATE TABLE stage_orders AS SELECT * FROM orders WHERE 1=0;'. What does this query produce?",
    options: [
      "Creates a new empty table 'stage_orders' with the exact column structure of 'orders', containing 0 rows",
      "Copies all data rows from orders into stage_orders",
      "Throws a division by zero error because of WHERE 1=0",
      "Deletes all rows from orders"
    ],
    correctAnswer: 0,
    explanation: "WHERE 1=0 evaluates to FALSE for all rows. Using CTAS with a false predicate creates a table matching the source schema structure without copying data rows.",
    status: "active"
  },
  {
    id: "sql-q-final-5",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 5,
    difficulty: "easy",
    questionText: "Which constraint prevents duplicate non-null values across rows while permitting multiple NULL entries in standard ANSI SQL?",
    options: [
      "UNIQUE",
      "PRIMARY KEY",
      "CHECK",
      "NOT NULL"
    ],
    correctAnswer: 0,
    explanation: "UNIQUE requires non-null column values to be unique. Under ANSI standards, multiple NULL entries are permitted because NULL != NULL.",
    status: "active"
  },
  {
    id: "sql-q-final-6",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 6,
    difficulty: "medium",
    questionText: "A DELETE query targeting 'customers' fails with error 'foreign key constraint violation'. What caused this failure?",
    options: [
      "Child records referencing the customer exist in another table without cascading delete enabled",
      "The customers table is locked by an active backup process",
      "The primary key sequence counter reached its maximum limit",
      "The customer ID is set to 0"
    ],
    correctAnswer: 0,
    explanation: "Referential integrity prevents deleting parent records when child rows reference the foreign key key unless ON DELETE CASCADE or SET NULL is configured.",
    status: "active"
  },
  {
    id: "sql-q-final-7",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 7,
    difficulty: "medium",
    questionText: "Consider a table 'inventory' with (product_id=101, stock=3). What occurs when executing:\nUPDATE inventory SET stock = stock - 5 WHERE product_id = 101 AND stock >= 5;",
    options: [
      "0 rows are updated because stock >= 5 evaluates to FALSE (3 >= 5 is false)",
      "Stock is updated to -2",
      "Stock is set to 0",
      "The query crashes with an underflow error"
    ],
    correctAnswer: 0,
    explanation: "The WHERE clause fails because 3 >= 5 is FALSE. The engine skips the row, updating 0 rows and keeping stock unchanged at 3.",
    status: "active"
  },
  {
    id: "sql-q-final-8",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 8,
    difficulty: "advanced",
    questionText: "What value does 'SELECT SUM(quantity * unit_price) FROM sales;' return if the sales table contains 0 rows?",
    options: [
      "NULL",
      "0.00",
      "0",
      "Throws an empty table exception"
    ],
    correctAnswer: 0,
    explanation: "Aggregate functions (SUM, AVG, MIN, MAX) evaluated over 0 matching rows return NULL (except COUNT, which returns 0).",
    status: "active"
  },
  {
    id: "sql-q-final-9",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 9,
    difficulty: "medium",
    questionText: "How does the string predicate 'WHERE city LIKE 'N%'' differ from 'WHERE city LIKE 'N_''?",
    options: [
      "'N%' matches any string starting with 'N' of any length; 'N_' matches strings of EXACTLY 2 characters starting with 'N'",
      "'N_' matches strings of any length; 'N%' matches single characters",
      "Both predicates perform identical character matching",
      "'N_' is case-sensitive while 'N%' is case-insensitive"
    ],
    correctAnswer: 0,
    explanation: "% matches 0 or more characters. _ matches exactly 1 character. Thus 'N_' matches 2-character strings starting with N (e.g. 'NY').",
    status: "active"
  },
  {
    id: "sql-q-final-10",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 10,
    difficulty: "medium",
    questionText: "In the query:\nSELECT department, COUNT(*) FROM employees WHERE salary > 50000 GROUP BY department HAVING COUNT(*) > 5;\nWhy is 'salary > 50000' in WHERE while 'COUNT(*) > 5' is in HAVING?",
    options: [
      "WHERE filters individual employee rows before grouping; HAVING filters aggregated department group counts after GROUP BY",
      "WHERE filters groups; HAVING filters individual rows",
      "COUNT(*) cannot be evaluated in HAVING clauses",
      "WHERE is processed after HAVING in logical execution"
    ],
    correctAnswer: 0,
    explanation: "WHERE filters raw rows before aggregation. Aggregate predicates like COUNT(*) > 5 must be evaluated in HAVING after group reduction.",
    status: "active"
  },
  {
    id: "sql-q-final-11",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 11,
    difficulty: "advanced",
    questionText: "Given column 'val' with values [10, 20, NULL, 30]. What are the results of AVG(val), COUNT(val), and COUNT(*)?",
    options: [
      "AVG(val) = 20, COUNT(val) = 3, COUNT(*) = 4",
      "AVG(val) = 15, COUNT(val) = 4, COUNT(*) = 4",
      "AVG(val) = 20, COUNT(val) = 4, COUNT(*) = 4",
      "AVG(val) = 15, COUNT(val) = 3, COUNT(*) = 3"
    ],
    correctAnswer: 0,
    explanation: "AVG ignores NULL: (10 + 20 + 30) / 3 = 60 / 3 = 20. COUNT(val) counts non-nulls = 3. COUNT(*) counts all rows = 4.",
    status: "active"
  },
  {
    id: "sql-q-final-12",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 12,
    difficulty: "advanced",
    questionText: "In the clause 'ORDER BY department ASC, salary DESC', how are query output rows ordered?",
    options: [
      "Sorted alphabetically by department; within each department, sorted from highest salary to lowest",
      "Sorted by salary first, then by department",
      "Sorted from lowest salary to highest across all departments",
      "Sorted by primary key ID"
    ],
    correctAnswer: 0,
    explanation: "Sorting applies sequentially. Primary sort is department ASC (A to Z). Secondary sort breaks ties within each department by salary DESC (highest first).",
    status: "active"
  },
  {
    id: "sql-q-final-13",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 13,
    difficulty: "practical",
    questionText: "What is the exact logical execution order of clauses in an ANSI SQL SELECT query?",
    options: [
      "FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT",
      "SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT",
      "FROM -> SELECT -> WHERE -> GROUP BY -> ORDER BY -> HAVING -> LIMIT",
      "WHERE -> FROM -> GROUP BY -> HAVING -> SELECT -> LIMIT -> ORDER BY"
    ],
    correctAnswer: 0,
    explanation: "The SQL engine evaluates queries in logical sequence: 1. FROM (tables) -> 2. WHERE (row filter) -> 3. GROUP BY -> 4. HAVING (group filter) -> 5. SELECT (projection) -> 6. ORDER BY -> 7. LIMIT.",
    status: "active"
  },
  {
    id: "sql-q-final-14",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 14,
    difficulty: "medium",
    questionText: "What result set does a FULL OUTER JOIN produce between Table A and Table B?",
    options: [
      "All matching rows, plus unmatched rows from Table A (with NULLs for B) and unmatched rows from Table B (with NULLs for A)",
      "Only matching rows present in both tables",
      "Only unmatched rows from Table A",
      "A Cartesian Product multiplying all rows"
    ],
    correctAnswer: 0,
    explanation: "FULL OUTER JOIN combines the results of both LEFT JOIN and RIGHT JOIN, returning all matched tuples as well as unmatched rows from both left and right tables padded with NULLs.",
    status: "active"
  },
  {
    id: "sql-q-final-15",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 15,
    difficulty: "medium",
    questionText: "Why is UNION ALL preferred over UNION when combining datasets known to contain no duplicate rows?",
    options: [
      "UNION ALL avoids the memory-intensive deduplication sort step, executing faster",
      "UNION ALL encrypts output data",
      "UNION fails when combining more than 2 tables",
      "UNION ALL converts strings to numbers automatically"
    ],
    correctAnswer: 0,
    explanation: "UNION forces the database to sort and deduplicate result sets. If duplicates cannot exist or are acceptable, UNION ALL skips deduplication and executes much faster.",
    status: "active"
  },
  {
    id: "sql-q-final-16",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 16,
    difficulty: "advanced",
    questionText: "Consider a CTE defined as:\nWITH HighEarners AS (\n  SELECT * FROM employees WHERE salary > 100000\n)\nSELECT department, COUNT(*) FROM HighEarners GROUP BY department;\nWhat is the primary architectural benefit of using this CTE?",
    options: [
      "Improves query legibility by modularizing complex subqueries into named readable blocks",
      "Creates a permanent table on disk that updates automatically",
      "Bypasses database security authorization checks",
      "Allows queries to run without database connections"
    ],
    correctAnswer: 0,
    explanation: "Common Table Expressions (CTEs) break complex queries into named, readable logical units, significantly improving code maintainability and reusability.",
    status: "active"
  },
  {
    id: "sql-q-final-17",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 17,
    difficulty: "advanced",
    questionText: "What does COALESCE(phone, mobile, 'No Phone Listed') return for a record where phone IS NULL and mobile = '555-0199'?",
    options: [
      "555-0199",
      "No Phone Listed",
      "NULL",
      "Syntax Error"
    ],
    correctAnswer: 0,
    explanation: "COALESCE returns the first non-null argument. Since phone is NULL, it evaluates mobile ('555-0199'), which is NOT NULL, returning '555-0199'.",
    status: "active"
  },
  {
    id: "sql-q-final-18",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 18,
    difficulty: "practical",
    questionText: "What will this query output for a row where hire_date = '2020-03-15'?\nSELECT CASE WHEN hire_date < '2021-01-01' THEN 'Senior' ELSE 'Junior' END AS tier FROM staff;",
    options: [
      "Senior",
      "Junior",
      "NULL",
      "2020-03-15"
    ],
    correctAnswer: 0,
    explanation: "'2020-03-15' < '2021-01-01' is TRUE, causing the CASE expression to evaluate to 'Senior'.",
    status: "active"
  },
  {
    id: "sql-q-final-19",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 19,
    difficulty: "medium",
    questionText: "Why does filtering by 'WHERE YEAR(created_at) = 2026' fail to utilize a standard B-Tree index defined on created_at?",
    options: [
      "Wrapping an indexed column inside a function prevents the optimizer from using a direct B-Tree Index Scan",
      "B-Tree indexes cannot index date data types",
      "The YEAR() function drops table indexes automatically",
      "WHERE clauses cannot use indexes when checking numeric equality"
    ],
    correctAnswer: 0,
    explanation: "Wrapping indexed columns in scalar functions (e.g. YEAR(col)) prevents B-Tree index lookup optimization, forcing an expensive full Sequential Table Scan.",
    status: "active"
  },
  {
    id: "sql-q-final-20",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 20,
    difficulty: "medium",
    questionText: "What is an Updatable View in relational database management?",
    options: [
      "A view based on a single table without aggregation or DISTINCT through which INSERT/UPDATE/DELETE queries can modify underlying table data",
      "A view that automatically updates every 5 minutes",
      "A view stored as a temporary file on disk",
      "A view that allows modifying database passwords"
    ],
    correctAnswer: 0,
    explanation: "Simple views targeting a single base table without aggregate functions or GROUP BY clauses are Updatable Views that pass DML operations directly down to the underlying table.",
    status: "active"
  },
  {
    id: "sql-q-final-21",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 21,
    difficulty: "advanced",
    questionText: "In ACID transaction isolation levels, what does READ COMMITTED prevent?",
    options: [
      "Prevents Dirty Reads by ensuring a transaction reads only data committed prior to query execution",
      "Prevents all concurrent write operations entirely",
      "Prevents table dropped errors",
      "Prevents server power failures"
    ],
    correctAnswer: 0,
    explanation: "READ COMMITTED isolation level guarantees that queries read only committed data changes, preventing 'dirty reads' of uncommitted transient transaction data.",
    status: "active"
  },
  {
    id: "sql-q-final-22",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 22,
    difficulty: "advanced",
    questionText: "What diagnostic insights does EXPLAIN ANALYZE provide when optimizing slow SQL queries?",
    options: [
      "Executes the query and reports both the estimated planner cost and the actual measured execution time and row counts",
      "Automatically adds B-Tree indexes to slow columns",
      "Rewrites SQL code into Python code",
      "Deletes duplicate table rows"
    ],
    correctAnswer: 0,
    explanation: "EXPLAIN ANALYZE actually executes the statement and compares the optimizer's estimated plan costs against actual runtime milliseconds and row processing counts.",
    status: "active"
  },
  {
    id: "sql-q-final-23",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 23,
    difficulty: "advanced",
    questionText: "How does parameterized query binding cur.execute('SELECT * FROM users WHERE user = ?', (input_str,)) prevent SQL Injection?",
    options: [
      "The database engine treats input_str strictly as a literal data scalar, rendering embedded SQL quotes inert",
      "It converts input strings into binary hash values",
      "It deletes special characters from user input strings",
      "It runs the query on a isolated sandboxed virtual machine"
    ],
    correctAnswer: 0,
    explanation: "Parameter binding transmits query templates and parameter data separately to the engine. The engine treats parameter values strictly as literal data, preventing command injection.",
    status: "active"
  },
  {
    id: "sql-q-final-24",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 24,
    difficulty: "practical",
    questionText: "A Python application querying 1,000,000 database rows crashes with Out of Memory (OOM) errors after calling cur.fetchall(). How should this be refactored?",
    options: [
      "Use cur.fetchmany(batch_size) or iterate over the cursor line-by-line to stream records efficiently without loading all rows into RAM at once",
      "Increase server disk space",
      "Convert the SQL database to a CSV file",
      "Use SELECT * instead of column names"
    ],
    correctAnswer: 0,
    explanation: "fetchall() loads the entire dataset into application RAM at once. Iterating over the cursor or fetching in batches streams records in small memory chunks.",
    status: "active"
  },
  {
    id: "sql-q-final-25",
    courseId: "sql-data-analysis",
    moduleId: "final-test",
    category: "final-test",
    order: 25,
    difficulty: "practical",
    questionText: "Given an EXPLAIN plan showing 'Seq Scan on orders (cost=0.00..1845.00 rows=50000 width=45)' when filtering by order_date, what action optimizes this lookup?",
    options: [
      "Create a B-Tree index on orders(order_date) to enable sub-millisecond Index Scan lookups",
      "Execute TRUNCATE TABLE orders",
      "Increase the query LIMIT to 50000",
      "Rename the column order_date to date_created"
    ],
    correctAnswer: 0,
    explanation: "Creating a B-Tree index on orders(order_date) allows the query planner to switch from a full Sequential Scan to a fast Index Scan.",
    status: "active"
  }
];
