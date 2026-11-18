// Interview Questions, questions 1-60: SQL, Python, web and JavaScript, data science (original wording).
// Learners read the question, think of their answer, reveal ours and mark it as known.
// Answer format (rendered by AnswerText): blank lines between paragraphs, "- " bullets, "1. " steps,
// and a closing "Interview tip:" line. Every code snippet is unique and runs as written
// (SQL against the Interview Prep practice database, see sqlSchema.js).

const Q = (n, topic, difficulty, title, answer, code, lang) => ({
  id: `iq-${String(n).padStart(2, '0')}`, n, topic, difficulty, title,
  answer: Array.isArray(answer) ? answer.join('\n\n') : answer,
  ...(code ? { code: code.replace(/^\n/, '') } : {}), ...(lang ? { lang } : {})
});
const L = (...items) => items.map(x => `- ${x}`).join('\n');
const N = (...items) => items.map((x, i) => `${i + 1}. ${x}`).join('\n');
const C = String.raw;

export const QUESTIONS_60 = [
  // ---------------- SQL & Databases ----------------
  Q(1, 'SQL & Databases', 'Easy', 'What is the difference between WHERE and HAVING?', [
    "`WHERE` filters **individual rows before grouping** happens. `HAVING` filters **whole groups after** `GROUP BY` has built them. That one difference explains every rule about them.",
    "Because `WHERE` runs before any group exists, it cannot use aggregate functions: `WHERE COUNT(*) > 2` is an error. `HAVING` runs after the aggregates are calculated, so it is exactly where conditions like `COUNT(*) >= 2` or `AVG(salary) > 100000` belong.",
    "The logical order in which a query is evaluated makes this clear:",
    N("`FROM` and `JOIN`: build the rows", "`WHERE`: drop rows", "`GROUP BY`: form groups", "`HAVING`: drop groups", "`SELECT`: compute the output columns", "`ORDER BY` and `LIMIT`: sort and cut"),
    "A query can use both. Put every condition that does not need an aggregate in `WHERE`: rows removed early never have to be grouped, so the query does less work.",
    "Interview tip: say \"WHERE filters rows, HAVING filters groups\" and then show the evaluation order. It answers the follow-up \"why can't I use an alias from SELECT in WHERE?\" as well."
  ], C`
-- Departments that hired at least two people since 2019,
-- with their average salary
SELECT dept_id,
       COUNT(*)    AS hires,
       AVG(salary) AS avg_salary
FROM employees
WHERE hire_date >= '2019-01-01'      -- row filter: runs first
GROUP BY dept_id
HAVING COUNT(*) >= 2                 -- group filter: runs after grouping
ORDER BY hires DESC;`),

  Q(2, 'SQL & Databases', 'Easy', 'Explain INNER, LEFT, RIGHT and FULL joins.', [
    "A join combines rows from two tables using a matching condition, usually a foreign key equal to a primary key. The join types differ only in **what happens to rows that have no match**.",
    L("**INNER JOIN**: keeps only pairs that match on both sides. An employee with no department and a department with no employees both disappear.",
      "**LEFT JOIN** (LEFT OUTER JOIN): keeps every row of the left table. Where the right table has no match, its columns are filled with `NULL`.",
      "**RIGHT JOIN**: the mirror image, keeps every row of the right table. Most teams simply swap the table order and write a LEFT JOIN instead.",
      "**FULL OUTER JOIN**: keeps every row from both tables, matched where possible and padded with `NULL` elsewhere.",
      "**CROSS JOIN**: every row with every row (a Cartesian product), with no condition."),
    "A very common pattern is the **anti-join**: LEFT JOIN, then keep rows where the right side is `NULL`. That finds \"departments with no employees\" or \"customers who never ordered\".",
    "One trap: a condition on the right table placed in `WHERE` turns a LEFT JOIN back into an INNER JOIN, because `NULL` never passes the test. Put such conditions in the `ON` clause instead.",
    "Interview tip: draw two overlapping circles. INNER is the overlap, LEFT is the whole left circle, FULL is both circles."
  ], C`
-- 1) Every department and its people (empty departments still appear)
SELECT d.dept_name, e.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
ORDER BY d.dept_name, e.name;

-- 2) Anti-join: departments with no employees at all
SELECT d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;`),

  Q(3, 'SQL & Databases', 'Easy', 'What is a primary key and a foreign key?', [
    "A **primary key** is the column (or set of columns) that uniquely identifies each row of a table. It must be **unique** and **NOT NULL**, and a table has only one. Databases automatically build an index on it, so lookups by key are fast.",
    "A **foreign key** is a column in one table that refers to the primary key of another table, for example `orders.customer_id` pointing to `customers.customer_id`. The database then enforces **referential integrity**: you cannot insert an order for a customer that does not exist, and you cannot delete a customer who still has orders unless you say what should happen.",
    "That \"what should happen\" is the referential action:",
    L("`ON DELETE CASCADE`: delete the child rows too.", "`ON DELETE SET NULL`: keep the child rows, clear the reference.", "`RESTRICT` / `NO ACTION` (the default): refuse the delete."),
    "Related terms: a **candidate key** is any column set that could be the primary key; a **composite key** uses several columns together (an `order_items` row is identified by `order_id` plus `product_id`); a **surrogate key** is an artificial id such as an auto-increment number, while a **natural key** is real data such as an email address.",
    "Interview tip: mention that a foreign key may be NULL (an employee with no manager yet) while a primary key never can."
  ], C`
PRAGMA foreign_keys = ON;   -- SQLite checks foreign keys only when this is on

CREATE TABLE authors (
  author_id INTEGER PRIMARY KEY,
  name      TEXT NOT NULL
);
CREATE TABLE books (
  book_id   INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  author_id INTEGER NOT NULL
            REFERENCES authors(author_id) ON DELETE CASCADE
);

INSERT INTO authors VALUES (1, 'R. K. Narayan');
INSERT INTO books VALUES (10, 'Malgudi Days', 1);   -- works
-- INSERT INTO books VALUES (11, 'Ghost', 99);      -- fails: author 99 does not exist

DELETE FROM authors WHERE author_id = 1;            -- cascade removes book 10 too
SELECT COUNT(*) AS books_left FROM books;           -- 0`),

  Q(4, 'SQL & Databases', 'Medium', 'What is normalization? Name the first three normal forms.', [
    "Normalization is the process of organising tables so that **each fact is stored once**. Duplicated data causes three classic problems: an **update anomaly** (you change a customer's city in one row but not the others), an **insert anomaly** (you cannot store a new department until someone works in it) and a **delete anomaly** (deleting the last employee of a department also deletes the department's details).",
    L("**First normal form (1NF)**: every column holds a single atomic value and there are no repeating groups. A `phones` column containing \"98xxx, 97xxx\" breaks 1NF; move phones to their own table.",
      "**Second normal form (2NF)**: 1NF, and every non-key column depends on the **whole** primary key. This only matters for composite keys: in `order_items(order_id, product_id, product_name)` the product name depends on `product_id` alone, so it belongs in `products`.",
      "**Third normal form (3NF)**: 2NF, and non-key columns depend **only on the key**, not on other non-key columns (no transitive dependency). In `employees(emp_id, dept_id, dept_city)` the city depends on the department, not the employee, so it moves to `departments`."),
    "A popular summary: every non-key column must depend on \"the key, the whole key and nothing but the key\". **BCNF** is a slightly stricter 3NF in which every determinant must be a candidate key.",
    "Normalization favours correct writes. Reporting systems and data warehouses often **denormalize** on purpose, keeping pre-joined or repeated data so that reads are faster.",
    "Interview tip: give one tiny broken table and fix it step by step. That shows you understand the forms rather than reciting them."
  ], C`
-- Not normalised: department details repeat on every employee row
CREATE TABLE staff_flat (
  emp_id    INTEGER PRIMARY KEY,
  emp_name  TEXT,
  dept_name TEXT,
  dept_city TEXT      -- depends on the department, not the employee (breaks 3NF)
);

-- Normalised (3NF): each fact lives in exactly one place
CREATE TABLE dept_3nf (
  dept_id   INTEGER PRIMARY KEY,
  dept_name TEXT NOT NULL,
  dept_city TEXT
);
CREATE TABLE staff_3nf (
  emp_id   INTEGER PRIMARY KEY,
  emp_name TEXT NOT NULL,
  dept_id  INTEGER REFERENCES dept_3nf(dept_id)
);`),

  Q(5, 'SQL & Databases', 'Medium', 'What is an index and when can it hurt?', [
    "An index is a separate, sorted data structure (usually a **B-tree**) that maps column values to the rows that contain them. Like the index at the back of a book, it lets the database jump straight to matching rows instead of reading the whole table (a **full table scan**). A lookup becomes roughly O(log n) instead of O(n).",
    "Indexes speed up `WHERE` filters, `JOIN` conditions, `ORDER BY` and `GROUP BY` on the indexed columns, and they back `PRIMARY KEY` and `UNIQUE` constraints.",
    "They are not free:",
    L("**Slower writes**: every `INSERT`, `UPDATE` and `DELETE` must also update every index on the table.",
      "**Storage**: each index is extra data on disk and in memory.",
      "**Low selectivity**: an index on a yes/no column rarely helps, because half the table matches anyway.",
      "**Unused indexes**: wrapping the column in a function (`WHERE UPPER(name) = 'RAHUL'`) or a leading wildcard (`LIKE '%kumar'`) usually prevents the index from being used."),
    "With a **composite index** on `(dept_id, salary)` the order matters: it helps queries filtering on `dept_id`, or on `dept_id` and `salary`, but not on `salary` alone. This is the **leftmost-prefix rule**.",
    "Interview tip: say how you would check whether an index is used: run `EXPLAIN` (or `EXPLAIN QUERY PLAN` in SQLite) before and after creating it."
  ], C`
-- Before: the plan shows a full SCAN of employees
EXPLAIN QUERY PLAN
SELECT name, salary FROM employees WHERE dept_id = 2;

CREATE INDEX idx_emp_dept_salary ON employees(dept_id, salary);

-- After: the plan shows SEARCH ... USING INDEX idx_emp_dept_salary
EXPLAIN QUERY PLAN
SELECT name, salary FROM employees WHERE dept_id = 2;`),

  Q(6, 'SQL & Databases', 'Medium', 'DELETE vs TRUNCATE vs DROP?', [
    "All three remove data, at very different levels.",
    L("**DELETE** is a DML command that removes the rows matching a `WHERE` clause (or all rows without one). It works row by row, fires row-level triggers, is fully logged, and can be rolled back inside a transaction. The table and its structure stay.",
      "**TRUNCATE** removes **all** rows at once by deallocating the data pages. It has no `WHERE`, is much faster on big tables, does not fire row triggers, and usually resets identity/auto-increment counters. The table structure stays. In Oracle and MySQL it commits implicitly and cannot be rolled back; in PostgreSQL and SQL Server it can, inside a transaction.",
      "**DROP** is DDL that removes the table itself: data, structure, indexes, constraints and triggers. Anything that references it breaks."),
    "Choose by intent: some rows, use DELETE; empty a staging table quickly, use TRUNCATE; the table should no longer exist, use DROP.",
    "SQLite has no TRUNCATE command: `DELETE FROM t` without a `WHERE` is optimised internally into the same fast truncate.",
    "Interview tip: the follow-up is often \"which can be rolled back?\" Answer DELETE always, TRUNCATE depends on the database, DROP generally no (except in databases with transactional DDL such as PostgreSQL)."
  ], C`
CREATE TABLE audit_log (id INTEGER PRIMARY KEY, msg TEXT);
INSERT INTO audit_log (msg) VALUES ('login'), ('logout'), ('login');

BEGIN;
DELETE FROM audit_log WHERE msg = 'logout';   -- removes one row
ROLLBACK;                                     -- ...and it comes back
SELECT COUNT(*) AS rows_after_rollback FROM audit_log;   -- 3

DELETE FROM audit_log;            -- empties the table, structure stays
                                  -- (TRUNCATE TABLE audit_log; in MySQL/PostgreSQL)
DROP TABLE audit_log;             -- table and structure are gone`),

  Q(7, 'SQL & Databases', 'Medium', 'What does ACID mean?', [
    "ACID is the set of guarantees a database gives for a **transaction**, a group of statements that must succeed or fail as one unit. The textbook example is a bank transfer: debit one account, credit another.",
    L("**Atomicity**: all statements take effect or none do. If the credit fails after the debit, the debit is undone (rolled back). Databases achieve this with an undo log or write-ahead log.",
      "**Consistency**: a transaction moves the database from one valid state to another. Constraints such as primary keys, foreign keys and `CHECK (balance >= 0)` are never left violated.",
      "**Isolation**: transactions running at the same time behave as if they ran one after another, so no one sees another transaction's half-finished work. How strictly this holds depends on the isolation level.",
      "**Durability**: once a transaction is committed, it survives a crash or power cut, because the change was written to the log on disk before the commit was confirmed."),
    "Relational databases such as PostgreSQL, MySQL (InnoDB), Oracle and SQL Server are ACID. Many distributed NoSQL stores relax some of these guarantees, especially isolation across nodes, for availability and speed. That design is often described as **BASE** (basically available, soft state, eventually consistent).",
    "Interview tip: walk through the transfer example and say what each letter protects against. It is clearer than four definitions."
  ], C`
CREATE TABLE accounts (
  id      INTEGER PRIMARY KEY,
  owner   TEXT,
  balance INTEGER CHECK (balance >= 0)     -- consistency rule
);
INSERT INTO accounts VALUES (1, 'Asha', 5000), (2, 'Ravi', 1000);

-- Transfer 2000 from Asha to Ravi as one atomic unit
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 2000 WHERE id = 1;
UPDATE accounts SET balance = balance + 2000 WHERE id = 2;
COMMIT;            -- durable from here on; ROLLBACK would undo both updates

SELECT owner, balance FROM accounts;   -- Asha 3000, Ravi 3000`),

  Q(8, 'SQL & Databases', 'Medium', 'RANK vs DENSE_RANK vs ROW_NUMBER?', [
    "All three are **window functions** that number rows inside a window defined by `OVER (PARTITION BY ... ORDER BY ...)`. They differ only in how they treat **ties**.",
    L("**ROW_NUMBER()** gives every row a different number: 1, 2, 3, 4. Tied rows are numbered in an arbitrary order unless you add a tie-breaker to `ORDER BY`.",
      "**RANK()** gives tied rows the same number and then **skips**: 1, 2, 2, 4. The next rank equals one plus the number of rows ahead of it, as in sports results.",
      "**DENSE_RANK()** gives tied rows the same number **without gaps**: 1, 2, 2, 3."),
    "Which to use:",
    L("\"Top N per group\" or removing duplicates (keep one row each): `ROW_NUMBER()` and filter `= 1`.",
      "\"N-th highest distinct value\": `DENSE_RANK()`, because gaps would make rank N disappear.",
      "Competition-style ranking where ties push others down: `RANK()`."),
    "`PARTITION BY` restarts the numbering for each group, for example a separate ranking per subject.",
    "Interview tip: run all three side by side on data with a tie, as below. Interviewers like to see that you know the output, not just the names."
  ], C`
-- Math marks: Asha and Bala tie on 92
SELECT student, marks,
       ROW_NUMBER() OVER (ORDER BY marks DESC) AS row_num,
       RANK()       OVER (ORDER BY marks DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY marks DESC) AS dense_rnk
FROM scores
WHERE subject = 'Math';
-- student | marks | row_num | rnk | dense_rnk
-- Asha    | 92    | 1       | 1   | 1
-- Bala    | 92    | 2       | 1   | 1
-- Chen    | 75    | 3       | 3   | 2
-- Dina    | 60    | 4       | 4   | 3`),

  Q(9, 'SQL & Databases', 'Medium', 'What is the difference between UNION and UNION ALL?', [
    "Both stack the results of two or more `SELECT` statements on top of each other. The queries must return the **same number of columns** with **compatible types**; the column names come from the first query.",
    L("**UNION** removes duplicate rows from the combined result. To do that the database must sort or hash all the rows, which costs time and memory on large results.",
      "**UNION ALL** keeps every row, duplicates included, and simply appends the results. It is faster and is what you want whenever duplicates are impossible or meaningful."),
    "Related set operators: `INTERSECT` returns rows present in both results and `EXCEPT` (`MINUS` in Oracle) returns rows in the first but not the second.",
    "A join combines tables **side by side** (more columns); a union combines them **one under the other** (more rows). Mixing these two up is a common beginner mistake.",
    "Interview tip: say that UNION ALL is the default choice and UNION is used only when you actually need duplicates removed. It shows you think about cost."
  ], C`
-- Every city we operate in: office cities plus customer cities
SELECT city FROM departments
UNION                      -- Mumbai, Bengaluru, ... each listed once
SELECT city FROM customers
ORDER BY city;

-- Same lists with duplicates kept, tagged by source
SELECT city, 'office'   AS source FROM departments
UNION ALL
SELECT city, 'customer' AS source FROM customers;`),

  Q(10, 'SQL & Databases', 'Hard', 'How do you find the N-th highest salary?', [
    "This is one of the most asked SQL questions. The key point is that \"N-th highest\" means the N-th highest **distinct** salary: if two people earn 120000, the next lower salary is still the third highest.",
    "There are three standard approaches:",
    N("**Window function**: rank the salaries with `DENSE_RANK()` and keep rank N. It handles ties correctly and also extends to \"N-th highest per department\" with `PARTITION BY dept_id`.",
      "**LIMIT and OFFSET**: `SELECT DISTINCT salary ... ORDER BY salary DESC LIMIT 1 OFFSET N-1`. Short and readable; `DISTINCT` is what handles the ties.",
      "**Correlated subquery** (works on very old databases): find the salary that has exactly N-1 distinct salaries above it."),
    "Two edge cases interviewers check: what you return when fewer than N distinct salaries exist (wrap the query so it returns `NULL` instead of no row), and whether `NULL` salaries should be ignored (`DENSE_RANK` orders NULLs first or last depending on the database, so filter them out).",
    "Interview tip: lead with the DENSE_RANK version, then mention the OFFSET version as the alternative. Both below return 120000 for N = 2."
  ], C`
-- Approach 1: DENSE_RANK (N = 2)
SELECT DISTINCT salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
  WHERE salary IS NOT NULL
) ranked
WHERE rnk = 2;

-- Approach 2: DISTINCT + OFFSET, returns NULL if there is no 2nd salary
SELECT (
  SELECT DISTINCT salary FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;`),

  Q(11, 'SQL & Databases', 'Medium', 'What is a CTE and why use one?', [
    "A **Common Table Expression** is a named, temporary result set defined with `WITH name AS (...)` at the start of a query. It exists only for that single statement.",
    "Why use one:",
    L("**Readability**: a long query becomes a series of named steps that read top to bottom, instead of subqueries nested three levels deep.",
      "**Reuse inside the query**: the same CTE can be referenced several times without repeating its SQL.",
      "**Recursion**: `WITH RECURSIVE` can walk hierarchies such as an org chart, a category tree or a bill of materials, which plain SQL cannot do."),
    "A recursive CTE has two parts joined by `UNION ALL`: an **anchor** query that returns the starting rows, and a **recursive** query that refers to the CTE itself and adds the next level. It stops when the recursive part returns no new rows.",
    "CTE vs subquery vs temporary table: a CTE is mainly about structure and recursion; a temporary table actually stores data and can be indexed and reused across several statements. Performance of a CTE and an equivalent subquery is usually the same.",
    "Interview tip: if asked to show a CTE, use a recursive one. It proves you know the part most candidates skip."
  ], C`
-- Recursive CTE: everyone under Arjun Rao (emp_id 1), with their level
WITH RECURSIVE reports AS (
  SELECT emp_id, name, manager_id, 0 AS level
  FROM employees
  WHERE emp_id = 1                             -- anchor: the top manager
  UNION ALL
  SELECT e.emp_id, e.name, e.manager_id, r.level + 1
  FROM employees e
  JOIN reports r ON e.manager_id = r.emp_id    -- recursive step: next level down
)
SELECT level, name
FROM reports
ORDER BY level, name;`),

  Q(12, 'SQL & Databases', 'Hard', 'SQL vs NoSQL: how do you choose?', [
    "**SQL (relational) databases** such as PostgreSQL, MySQL and Oracle store data in tables with a fixed schema, enforce relationships with foreign keys, support powerful joins and give ACID transactions. **NoSQL** is a family of non-relational stores built for flexible data or very large scale.",
    "The main NoSQL types:",
    L("**Document** (MongoDB, Firestore): JSON-like documents; good when each record is naturally one nested object, such as a product with varying attributes.",
      "**Key-value** (Redis, DynamoDB): very fast lookups by key; used for caches, sessions and counters.",
      "**Wide-column** (Cassandra, HBase): huge write volumes spread across many machines, such as event logs and IoT data.",
      "**Graph** (Neo4j): relationship-heavy data, such as social networks and recommendations."),
    "How to choose:",
    L("Choose **SQL** when data is structured and related, correctness matters (payments, orders, inventory), and you need ad-hoc queries and joins.",
      "Choose **NoSQL** when the schema changes often, the access pattern is simple and known in advance (\"get everything for user X\"), or the scale needs easy horizontal partitioning."),
    "The line is blurring: PostgreSQL stores and indexes JSON, and some NoSQL databases now offer transactions. Many real systems use both, for example PostgreSQL for orders plus Redis for caching.",
    "Interview tip: avoid saying \"NoSQL is faster\". Say which access pattern and consistency need you are designing for, then pick the store that fits."
  ]),

  Q(13, 'SQL & Databases', 'Easy', 'What does GROUP BY do?', [
    "`GROUP BY` collapses rows that share the same values in the listed columns into **one row per group**, so that aggregate functions such as `COUNT`, `SUM`, `AVG`, `MIN` and `MAX` are calculated per group instead of over the whole table.",
    "The rule to remember: every column in `SELECT` must either appear in `GROUP BY` or be inside an aggregate function. Selecting `name` while grouping by `dept_id` is an error in standard SQL, because a department has many names and the database cannot know which one you mean. (MySQL and SQLite sometimes allow it and return an arbitrary row, which is a hidden bug.)",
    "Useful details:",
    L("`COUNT(*)` counts rows; `COUNT(column)` skips NULLs; `COUNT(DISTINCT column)` counts unique values.",
      "You can group by several columns, such as one row per (city, year).",
      "Filter groups with `HAVING`, not `WHERE`.",
      "`GROUP BY` does not guarantee any order, so add `ORDER BY` if order matters."),
    "Interview tip: when you write a GROUP BY query, say out loud \"one row per ...\" before you start. It keeps the SELECT list correct."
  ], C`
-- Revenue and items sold per product category, highest first
SELECT p.category,
       COUNT(DISTINCT oi.order_id)       AS orders,
       SUM(oi.quantity)                  AS units,
       SUM(oi.quantity * oi.unit_price)  AS revenue
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
GROUP BY p.category              -- one row per category
ORDER BY revenue DESC;`),

  Q(14, 'SQL & Databases', 'Medium', 'What is a view?', [
    "A **view** is a saved `SELECT` statement that you can query like a table. It stores the query, not the data: each time you select from the view, the database runs the underlying query against the current data.",
    "Why teams use views:",
    L("**Simplicity**: hide a complicated join behind a simple name, such as `employee_details`.",
      "**Security**: give a reporting user access to a view that exposes names and departments but not salaries, without granting access to the base table.",
      "**Stable interface**: if tables are restructured, the view can be rewritten so existing reports keep working."),
    "Limitations: a plain view is only as fast as its query, and updating data through a view is allowed only for simple single-table views.",
    "A **materialized view** (PostgreSQL, Oracle) stores the result physically, so reads are fast, but it must be refreshed to pick up new data. It is a common answer to \"this dashboard query is slow\".",
    "Interview tip: contrast view vs materialized view in one line each: one is a stored query, the other a stored result."
  ], C`
CREATE VIEW employee_directory AS
SELECT e.emp_id, e.name, d.dept_name, d.city      -- no salary column exposed
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id;

-- Query it like a normal table
SELECT name, city
FROM employee_directory
WHERE dept_name = 'Engineering';`),

  Q(15, 'SQL & Databases', 'Hard', 'How would you speed up a slow query?', [
    "Start by **measuring**, not guessing. Run `EXPLAIN` (or `EXPLAIN ANALYZE` in PostgreSQL) to see the execution plan: which tables are fully scanned, which indexes are used, the join order and the estimated versus actual row counts.",
    "Then work through the usual causes:",
    N("**Missing index**: add an index on columns used in `WHERE`, `JOIN` and `ORDER BY`. Composite indexes should follow the leftmost-prefix rule.",
      "**Non-sargable filters**: a function on the column (`WHERE YEAR(hire_date) = 2020`, `WHERE LOWER(email) = ...`) or a leading wildcard (`LIKE '%x'`) stops index use. Rewrite it as a range on the raw column.",
      "**Reading too much**: replace `SELECT *` with the columns you need, filter early, and paginate with `LIMIT` (keyset pagination for deep pages).",
      "**Join problems**: join on indexed keys, check for an accidental many-to-many explosion, and replace `IN (subquery)` with `EXISTS` or a join where the plan is better.",
      "**Stale statistics**: run `ANALYZE` so the optimizer has accurate row estimates.",
      "**Design-level fixes**: caching, a materialized view or summary table, partitioning a huge table by date, or a read replica for reporting."),
    "Finally, measure again to confirm the change helped, and check that it did not slow down writes.",
    "Interview tip: structure the answer as measure, find the bottleneck, fix, re-measure. That structure matters more than listing every trick."
  ], C`
-- Slow: the function on hire_date hides the column from any index
SELECT name FROM employees
WHERE strftime('%Y', hire_date) = '2021';

-- Fast: same result, written as a range on the raw column
CREATE INDEX idx_emp_hire ON employees(hire_date);
EXPLAIN QUERY PLAN
SELECT name FROM employees
WHERE hire_date >= '2021-01-01' AND hire_date < '2022-01-01';`),

  // ---------------- Python ----------------
  Q(16, 'Python', 'Easy', 'List vs tuple vs set vs dictionary?', [
    "These are Python's four core built-in collections. Pick one by asking three questions: does order matter, can it change, and are duplicates allowed?",
    L("**list** `[1, 2, 2]`: ordered, mutable, allows duplicates, indexed by position. The general-purpose sequence.",
      "**tuple** `(1, 2, 2)`: ordered and **immutable**. Slightly lighter than a list, and hashable when its items are, so it can be a dictionary key or a set member. Used for fixed records such as coordinates or function return values.",
      "**set** `{1, 2}`: unordered, mutable, **unique** items only. Membership tests (`x in s`) are O(1) on average thanks to hashing. Supports union `|`, intersection `&` and difference `-`.",
      "**dict** `{'a': 1}`: key to value mapping with unique, hashable keys and O(1) average lookup. Since Python 3.7 dictionaries keep insertion order."),
    "Performance matters in interviews: `x in my_list` is O(n) because it scans, while `x in my_set` is O(1) on average. Converting a list to a set before many lookups is a classic optimisation.",
    "Interview tip: give the real-world use of each in one phrase: list for a sequence of items, tuple for a fixed record, set for uniqueness and fast membership, dict for lookup by key."
  ], C`
marks = [78, 92, 85, 92]                 # list: ordered, duplicates allowed
point = (12.97, 77.59)                   # tuple: fixed record (lat, lon)
unique_marks = set(marks)                # set: {78, 85, 92}
student = {"name": "Asha", "marks": 92}  # dict: lookup by key

marks.append(60)                         # lists can grow
# point[0] = 0                           # TypeError: tuples are immutable
locations = {point: "Bengaluru"}         # tuples can be dictionary keys

print(len(marks), sorted(unique_marks), student["name"], locations[point])
print(92 in unique_marks)                # O(1) average membership test`),

  Q(17, 'Python', 'Easy', 'What is the difference between == and is?', [
    "`==` checks **equality of value**: do the two objects hold the same data? It calls the object's `__eq__` method, so classes can define what \"equal\" means.",
    "`is` checks **identity**: are both names pointing to the **same object in memory**? It compares `id(a)` with `id(b)` and cannot be overridden.",
    "Two separate lists with the same items are `==` but not `is`. Assigning one name to another (`b = a`) makes them `is`, so changing one changes \"both\", because there is only one object.",
    "When to use `is`: only for singletons, chiefly `x is None` and `x is not None`. That is the official style (PEP 8) and it is also safer, because a badly written `__eq__` could claim to equal `None`.",
    "A trap to mention: CPython caches small integers (-5 to 256) and some strings, so `a is b` can be `True` for small numbers by accident and `False` for larger ones. Never use `is` to compare numbers or strings.",
    "Interview tip: one sentence each: == compares values, is compares identity. Then add \"use is only for None\"."
  ], C`
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)      # True:  same contents
print(a is b)      # False: two different list objects
print(a is c)      # True:  c is another name for the same object

c.append(4)
print(a)           # [1, 2, 3, 4]: changed through c

result = None
if result is None:          # the correct way to test for None
    print("no result yet")`),

  Q(18, 'Python', 'Medium', 'Mutable vs immutable objects?', [
    "A **mutable** object can be changed in place after it is created. An **immutable** object cannot: any \"change\" actually creates a new object.",
    L("**Immutable**: `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes`.",
      "**Mutable**: `list`, `dict`, `set`, `bytearray`, and most user-defined objects."),
    "You can see the difference with `id()`: after `s += \"!\"` a string has a new id, while after `lst.append(1)` a list keeps the same id.",
    "Why it matters in real code:",
    L("**Shared references**: Python passes references to objects. A function that modifies a list argument modifies the caller's list; a function cannot modify the caller's integer.",
      "**Hashing**: only immutable (hashable) objects can be dictionary keys or set members, because their hash must never change.",
      "**Bugs**: mutable default arguments and `[[0] * 3] * 3` (three references to one inner list) both come from shared mutable objects.",
      "**Safety**: immutable objects are naturally safe to share between threads."),
    "Note: a tuple is immutable, but if it contains a list, that inner list can still change. The tuple only fixes which objects it holds.",
    "Interview tip: show the `[[0] * 3] * 3` grid bug below. It is a memorable way to prove you understand references."
  ], C`
name = "code"
print(id(name))
name += "lekho"            # strings are immutable: a NEW object is created
print(id(name))            # different id

grid = [[0] * 3] * 3       # three references to the SAME inner list
grid[0][0] = 1
print(grid)                # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

grid = [[0] * 3 for _ in range(3)]   # three separate lists
grid[0][0] = 1
print(grid)                # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`),

  Q(19, 'Python', 'Medium', 'Why is a mutable default argument a bug?', [
    "Default argument values are evaluated **once, when the function is defined**, not each time it is called. If the default is a mutable object such as a list or a dict, every call that relies on the default shares that same single object.",
    "So a function like `def add_item(item, basket=[])` appears to work on the first call, but the second call sees the items from the first call too. The list lives on the function object (you can even inspect it in `add_item.__defaults__`).",
    "The standard fix is to use `None` as a sentinel and create a fresh object inside the function:",
    L("`def add_item(item, basket=None):`", "`    if basket is None: basket = []`"),
    "The same rule applies to any default that should be fresh per call, such as `datetime.now()`: as a default it is frozen at definition time.",
    "The behaviour is occasionally used on purpose, as a simple cache that survives between calls, but in interview answers and production code treat it as a bug.",
    "Interview tip: explain the cause (evaluated once at definition) before the fix. The \"why\" is what is being tested."
  ], C`
def add_item_buggy(item, basket=[]):     # one list shared by every call
    basket.append(item)
    return basket

print(add_item_buggy("pen"))      # ['pen']
print(add_item_buggy("book"))     # ['pen', 'book']  <- surprise
print(add_item_buggy.__defaults__)

def add_item(item, basket=None):         # the fix: None as a sentinel
    if basket is None:
        basket = []                      # a fresh list on every call
    basket.append(item)
    return basket

print(add_item("pen"), add_item("book"))   # ['pen'] ['book']`),

  Q(20, 'Python', 'Easy', 'What is a list comprehension?', [
    "A list comprehension builds a new list from an iterable in one readable expression: `[expression for item in iterable if condition]`. It replaces the pattern \"create an empty list, loop, maybe test, append\".",
    "It is usually faster than the equivalent loop, because the appending happens inside the interpreter's optimised code path, and it reads like a sentence: \"the square of x for each x in nums if x is even\".",
    "The same syntax exists for other collections:",
    L("**Set comprehension**: `{w.lower() for w in words}`",
      "**Dict comprehension**: `{name: len(name) for name in names}`",
      "**Generator expression**: `(x * x for x in nums)`, which is lazy and builds nothing until iterated. Use it with `sum()`, `max()` or `any()` on large data."),
    "Two details: an `if` at the end filters items, while `a if cond else b` at the start chooses a value for every item; and nested loops read left to right in the same order as written loops.",
    "Readability limit: if a comprehension needs more than one condition and nested loops, a normal loop is clearer.",
    "Interview tip: write the loop version and the comprehension next to each other. It shows you understand what the comprehension does."
  ], C`
nums = [3, 8, 5, 12, 7, 10]

even_squares = [n * n for n in nums if n % 2 == 0]      # filter, then map
labels = ["even" if n % 2 == 0 else "odd" for n in nums] # choose per item
lengths = {w: len(w) for w in ["sql", "python", "java"]} # dict comprehension
pairs = [(r, c) for r in range(2) for c in range(3)]     # nested loops
total = sum(n for n in nums if n > 5)                    # lazy generator

print(even_squares)   # [64, 144, 100]
print(labels)
print(lengths)
print(pairs)
print(total)          # 37`),

  Q(21, 'Python', 'Medium', 'What are *args and **kwargs?', [
    "They let a function accept a **variable number of arguments**.",
    L("`*args` collects any extra **positional** arguments into a **tuple**.",
      "`**kwargs` collects any extra **keyword** arguments into a **dict**."),
    "The names `args` and `kwargs` are only a convention; the `*` and `**` are what matter.",
    "The full parameter order is: normal parameters, `*args`, keyword-only parameters, `**kwargs`, as in `def f(a, b=2, *args, flag=False, **kwargs)`. Any parameter after `*args` can only be passed by keyword.",
    "The same symbols **unpack** at the call site: `f(*my_list)` spreads a list into positional arguments, and `f(**my_dict)` spreads a dict into keyword arguments.",
    "Where they are used in practice: wrapper functions and decorators that must pass through whatever they receive (`return func(*args, **kwargs)`), functions like `print()` that take any number of values, and subclasses that forward extra options to a parent constructor.",
    "Interview tip: mention both roles, collecting in the definition and unpacking in the call. Many candidates know only the first."
  ], C`
def make_order(customer, *items, express=False, **details):
    print("customer:", customer)
    print("items:", items)            # tuple of extra positional args
    print("express:", express)        # keyword-only argument
    print("details:", details)        # dict of extra keyword args

make_order("Asha", "pen", "notebook", express=True, city="Pune", gift=True)

cart = ["laptop", "mouse"]
extra = {"city": "Chennai"}
make_order("Ravi", *cart, **extra)    # unpacking at the call site`),

  Q(22, 'Python', 'Medium', 'What is a decorator?', [
    "A decorator is a function that **takes a function and returns a new function** that usually adds behaviour before or after the original runs, without changing the original's code. Writing `@timer` above `def work()` is just shorthand for `work = timer(work)`.",
    "Decorators work because functions in Python are first-class objects (they can be passed and returned) and because inner functions are **closures** that remember the function they wrap.",
    "A correct decorator:",
    L("defines an inner `wrapper(*args, **kwargs)` so it works for any signature;",
      "calls the original and **returns its result**;",
      "uses `@functools.wraps(func)` so the wrapped function keeps its name and docstring."),
    "A decorator that takes its own arguments, such as `@retry(times=3)`, needs one more level: a function that returns the decorator.",
    "Common real uses: logging, timing, caching (`@functools.lru_cache`), access checks in web frameworks (`@login_required`), registering routes (`@app.get('/')`) and retries.",
    "Interview tip: write one from memory, including `functools.wraps` and returning the result. Those two details are what interviewers look for."
  ], C`
import functools
import time

def retry(times):                     # decorator factory: takes arguments
    def decorator(func):
        @functools.wraps(func)        # keep func.__name__ and docstring
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except ConnectionError as err:
                    print(f"attempt {attempt} failed: {err}")
                    time.sleep(0.01)
            raise RuntimeError(f"{func.__name__} failed {times} times")
        return wrapper
    return decorator

calls = {"n": 0}

@retry(times=3)
def fetch_rates():
    calls["n"] += 1
    if calls["n"] < 3:
        raise ConnectionError("timeout")
    return {"USD": 83.2}

print(fetch_rates(), fetch_rates.__name__)`),

  Q(23, 'Python', 'Medium', 'What is a generator?', [
    "A generator is a function that **produces values lazily, one at a time**, using `yield` instead of `return`. Calling it does not run the body; it returns a generator object. Each `next()` (or each loop step) runs the body until the next `yield`, hands out that value, and **pauses**, keeping all local variables, until it is asked again.",
    "Why it matters:",
    L("**Memory**: a generator holds one item at a time, so it can process a 10 GB log file or an infinite sequence in constant memory, while a list would hold everything at once.",
      "**Pipelines**: generators chain naturally (read lines, then filter, then parse), and each stage pulls only what it needs.",
      "**Speed to first result**: work starts immediately instead of after the whole list is built."),
    "Key facts: a generator can be iterated **only once**; when the body ends it raises `StopIteration`, which `for` loops handle for you; a **generator expression** `(x * 2 for x in data)` is the one-line form; and `yield from other()` delegates to another generator.",
    "Interview tip: compare `sum([x * x for x in range(10**7)])` with `sum(x * x for x in range(10**7))`. Same answer, but the second never builds a ten-million-item list."
  ], C`
def read_errors(lines):
    for line in lines:                    # pulls one line at a time
        if "ERROR" in line:
            yield line.split(" ", 1)[1]   # pause here and hand out a value

def fibonacci():
    a, b = 0, 1
    while True:                           # infinite, but lazy
        yield a
        a, b = b, a + b

log = ["INFO start", "ERROR disk full", "INFO retry", "ERROR timeout"]
print(list(read_errors(log)))             # ['disk full', 'timeout']

fib = fibonacci()
print([next(fib) for _ in range(8)])      # [0, 1, 1, 2, 3, 5, 8, 13]`),

  Q(24, 'Python', 'Hard', 'What is the GIL?', [
    "The **Global Interpreter Lock** is a mutex in CPython, the standard Python interpreter, that allows **only one thread to execute Python bytecode at a time**. It exists because CPython's memory management (reference counting) is not thread-safe; one global lock is simple and makes single-threaded code fast.",
    "The consequences depend on the kind of work:",
    L("**CPU-bound work** (number crunching, image processing in pure Python): threads give almost no speed-up, because they take turns holding the GIL. Use `multiprocessing` or `concurrent.futures.ProcessPoolExecutor`: each process has its own interpreter and its own GIL, so they run truly in parallel.",
      "**I/O-bound work** (network calls, file and database access): threads work well, because a thread releases the GIL while it waits for I/O. `asyncio` is another excellent option for many concurrent connections.",
      "**C extensions** such as NumPy release the GIL during heavy computations, which is why numeric Python can still use several cores."),
    "Recent changes worth mentioning: Python 3.12 added per-interpreter GILs, and Python 3.13 introduced an optional **free-threaded build** without the GIL (PEP 703). The standard build still has the GIL.",
    "Interview tip: finish with the decision rule: I/O-bound use threads or asyncio, CPU-bound use processes."
  ], C`
import time
from concurrent.futures import ThreadPoolExecutor

def fake_download(n):
    time.sleep(0.2)          # I/O wait: the thread releases the GIL here
    return n

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(fake_download, range(5)))
elapsed = time.perf_counter() - start

print(results)
print(f"5 downloads took {elapsed:.2f}s, not 1.0s")   # threads overlap I/O waits`),

  Q(25, 'Python', 'Medium', 'Shallow copy vs deep copy?', [
    "Assignment (`b = a`) copies nothing: both names point to the same object. Copies come in two depths:",
    L("A **shallow copy** creates a new outer container but fills it with **references to the same inner objects**. Made with `copy.copy(x)`, `list(x)`, `x[:]`, `x.copy()` or `dict(x)`.",
      "A **deep copy** recursively copies the container **and everything inside it**, so the copy is completely independent. Made with `copy.deepcopy(x)`."),
    "For a flat list of numbers or strings there is no visible difference, because the items are immutable. The difference shows with **nested mutable data**: after a shallow copy of a list of lists, appending to `copy[0]` also changes `original[0]`, because both outer lists hold the same inner list.",
    "Deep copy costs more time and memory, and it correctly handles objects that refer to themselves (it keeps a memo of what it has already copied). Classes can customise both behaviours with `__copy__` and `__deepcopy__`.",
    "Interview tip: show the nested-list example and print `original` after changing the copy. It is the clearest proof."
  ], C`
import copy

original = {"name": "Team A", "members": ["Asha", "Ravi"]}

shallow = copy.copy(original)
deep = copy.deepcopy(original)

shallow["members"].append("Kiran")    # shares the inner list with original
deep["members"].append("Meera")       # has its own inner list

print(original["members"])   # ['Asha', 'Ravi', 'Kiran']
print(deep["members"])       # ['Asha', 'Ravi', 'Meera']
print(shallow["members"] is original["members"])   # True
print(deep["members"] is original["members"])      # False`),

  Q(26, 'Python', 'Easy', 'How does exception handling work?', [
    "Python signals errors with **exceptions**. Code that might fail goes in a `try` block, and an `except` block handles a specific exception type. If no handler matches, the exception travels up the call stack and finally stops the program with a traceback.",
    "The full statement has four parts:",
    L("`try`: the code that might raise.",
      "`except SomeError as e`: runs only if that error (or a subclass) was raised. List the most specific types first.",
      "`else`: runs only if the `try` block raised **nothing**. Code here is not protected by the handlers, which keeps them precise.",
      "`finally`: runs **always**, error or not, even after `return`. Used for cleanup such as closing files or releasing locks."),
    "Good practice: catch specific exceptions (`ValueError`, `KeyError`), never a bare `except:` that also hides typos and Ctrl+C; use `raise` to signal your own errors; define custom exceptions by subclassing `Exception`; and use `raise NewError(...) from err` to keep the original cause in the traceback.",
    "Python style favours **EAFP** (\"easier to ask forgiveness than permission\"): try the operation and handle the failure, instead of checking every condition first (LBYL).",
    "Interview tip: explain what `else` is for. Most candidates cannot, so it stands out."
  ], C`
class InsufficientBalance(Exception):
    pass

def withdraw(balance, amount_text):
    try:
        amount = int(amount_text)               # may raise ValueError
        if amount > balance:
            raise InsufficientBalance(f"need {amount}, have {balance}")
    except ValueError:
        print("not a number:", amount_text)
        return balance
    except InsufficientBalance as err:
        print("declined:", err)
        return balance
    else:
        print("approved")                       # only when nothing was raised
        return balance - amount
    finally:
        print("transaction logged")             # always runs

print(withdraw(500, "200"))
print(withdraw(500, "abc"))
print(withdraw(500, "900"))`),

  Q(27, 'Python', 'Medium', 'What is the difference between a module and a package?', [
    "A **module** is a single `.py` file. Its functions, classes and variables can be imported into other files with `import name` or `from name import thing`.",
    "A **package** is a **directory of modules** that is importable as a unit, which lets you organise a large codebase into namespaces such as `shop.payments.upi`. A traditional (regular) package contains an `__init__.py` file, which runs when the package is first imported and often re-exports the most useful names. Since Python 3.3 a directory without `__init__.py` can still be imported as a **namespace package**, but regular packages remain the norm.",
    "Related ideas:",
    L("A **library** is an informal term for a collection of packages you install, usually with `pip` from PyPI (for example `requests` or `pandas`).",
      "Python finds modules by searching `sys.path`: the script's folder, the standard library and `site-packages`.",
      "A module is executed **only once** per process; later imports reuse the cached object in `sys.modules`.",
      "`if __name__ == \"__main__\":` lets a file work both as an importable module and as a script, because `__name__` is `\"__main__\"` only when the file is run directly."),
    "Interview tip: draw a tiny folder tree (`shop/__init__.py`, `shop/cart.py`) and show the import line. Concrete beats abstract."
  ], C`
# A module is any .py file; this snippet uses modules from the standard library.
import math                        # module
import os.path                     # os is a package, os.path a module inside it
from collections import Counter    # import one name from a module
import sys

print(math.sqrt(144))
print(os.path.join("shop", "cart.py"))
print(Counter("interview").most_common(2))
print(math.__name__, "loaded from", type(math.__spec__).__name__)
print("math" in sys.modules)       # modules are cached after the first import

if __name__ == "__main__":         # True only when this file is run directly
    print("running as a script")`),

  Q(28, 'Python', 'Medium', 'What do __init__ and self mean in a class?', [
    "`__init__` is the **initialiser**: Python calls it automatically right after a new object is created, so you can set the object's starting attributes. Strictly speaking it is not the constructor: `__new__` creates the object and `__init__` fills it in. In everyday answers it is fine to call `__init__` the constructor, but mention the difference if asked.",
    "`self` is the **instance the method is working on**. When you write `acct.deposit(100)`, Python turns it into `Account.deposit(acct, 100)`, so the object is passed automatically as the first parameter. `self` is only a naming convention, but every Python developer follows it.",
    "Key points:",
    L("Attributes set as `self.balance = ...` belong to **that object**; each instance has its own.",
      "Attributes set directly in the class body are **class attributes**, shared by all instances.",
      "`__init__` must return `None`; returning anything else raises a `TypeError`.",
      "A child class that defines its own `__init__` should call `super().__init__(...)` to run the parent's set-up."),
    "Other \"dunder\" (double underscore) methods let objects work with built-in syntax: `__str__` for `print()`, `__repr__` for debugging, `__len__` for `len()`, `__eq__` for `==`.",
    "Interview tip: show the `Account.deposit(acct, 100)` rewrite. It explains self better than any definition."
  ], C`
class Account:
    bank = "CodeLekho Bank"              # class attribute: shared

    def __init__(self, owner, balance=0):
        self.owner = owner               # instance attributes: per object
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def __repr__(self):
        return f"Account({self.owner!r}, {self.balance})"

a = Account("Asha", 1000)
b = Account("Ravi")
a.deposit(500)
Account.deposit(b, 200)       # exactly what b.deposit(200) does
print(a, b, a.bank is b.bank)`),

  Q(29, 'Python', 'Hard', 'What is time complexity? Give the cost of common Python operations.', [
    "Time complexity describes **how the running time grows as the input size n grows**, written in Big-O notation. It ignores constants and small terms and focuses on the growth rate, so O(2n + 5) is simply O(n). Space complexity is the same idea for memory.",
    "Average costs worth memorising:",
    L("**list**: index `a[i]` and `append` O(1) (append is amortised O(1)); `insert(0, x)` and `pop(0)` O(n) because items shift; `x in a` O(n); `sort()` O(n log n).",
      "**dict / set**: get, set, delete and `in` are O(1) on average and O(n) in the rare worst case of many hash collisions.",
      "**collections.deque**: `append` and `popleft` are both O(1), which makes it the right queue for BFS.",
      "**str**: strings are immutable, so building one with `+=` in a loop can be O(n squared) in total; use `''.join(parts)` instead, which is O(n).",
      "**heapq**: `heappush` and `heappop` are O(log n); `min(a)` on a list is O(n).",
      "Slicing `a[i:j]` copies, so it costs O(j - i)."),
    "The most common optimisation in interviews is replacing a nested loop with a set or dict lookup, turning O(n squared) into O(n).",
    "Interview tip: after every solution, state the time and space complexity without being asked. It is expected at product companies."
  ], C`
from collections import deque
import timeit

data = list(range(100_000))
lookup = set(data)

# Membership: O(n) scan of a list vs O(1) hash lookup in a set
print(timeit.timeit(lambda: 99_999 in data, number=200))
print(timeit.timeit(lambda: 99_999 in lookup, number=200))

# Queue: list.pop(0) shifts every item, deque.popleft() does not
queue = deque([1, 2, 3])
queue.append(4)
print(queue.popleft(), list(queue))     # 1 [2, 3, 4]`),

  Q(30, 'Python', 'Easy', 'How do you reverse a string or list?', [
    "There are three common ways, and an interviewer may ask for each.",
    L("**Slicing** `s[::-1]`: works for strings, lists and tuples and returns a **new** reversed copy. The step of -1 walks from the end to the start. This is the idiomatic answer for strings.",
      "`reversed(x)`: returns a lazy **iterator** without copying; wrap it as `''.join(reversed(s))` or `list(reversed(a))` when you need the result. Works on any sequence.",
      "`a.reverse()`: lists only, reverses **in place** and returns `None`. A classic bug is `b = a.reverse()`, which sets `b` to `None`."),
    "Strings are immutable, so they have no `.reverse()` method; you always create a new string.",
    "Often the follow-up is \"do it without built-ins\". Use **two pointers**: swap the first and last items and move both pointers inward until they meet. That is O(n) time and O(1) extra space for a list. For a string, convert it to a list first, swap, then join.",
    "Interview tip: mention which methods copy and which work in place. That distinction is the real point of the question."
  ], C`
def reverse_in_place(items):
    left, right = 0, len(items) - 1
    while left < right:                      # two pointers moving inward
        items[left], items[right] = items[right], items[left]
        left += 1
        right -= 1
    return items

word = "interview"
print(word[::-1])                  # 'weivretni' (new string)
print("".join(reversed(word)))     # same, via an iterator

nums = [1, 2, 3, 4, 5]
nums.reverse()                     # in place, returns None
print(nums)
print(reverse_in_place(list("python")))`),

  // ---------------- Web & JavaScript ----------------
  Q(31, 'Web & JavaScript', 'Easy', 'var vs let vs const?', [
    "All three declare variables; they differ in **scope**, **hoisting** and **reassignment**.",
    L("**var**: **function-scoped** (it ignores `{}` blocks such as `if` and `for`). Its declaration is hoisted and initialised to `undefined`, so using it before the line gives `undefined` instead of an error. It can be redeclared, and at the top level it becomes a property of the global object.",
      "**let**: **block-scoped**. It is hoisted too, but stays in the **temporal dead zone** until its line runs, so earlier access throws a `ReferenceError`. It can be reassigned but not redeclared in the same scope.",
      "**const**: block-scoped like `let`, but the binding cannot be reassigned and must be initialised immediately. The object it points to can still change: `const user = {}` followed by `user.name = 'Asha'` is allowed. Use `Object.freeze()` for real immutability."),
    "The classic loop example: with `var`, callbacks created in a loop all see the final value of `i`, because there is one shared variable. With `let`, each iteration gets a fresh binding.",
    "Modern guideline: use `const` by default, `let` when you must reassign, and avoid `var` in new code.",
    "Interview tip: show the setTimeout loop below. It covers scope, closures and the event loop in one example."
  ], C`
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0);   // var: 3, 3, 3
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);   // let: 0, 1, 2
}

const user = { name: "Asha" };
user.name = "Ravi";            // allowed: the object itself is mutable
// user = {};                  // TypeError: assignment to constant variable
console.log(user.name);

console.log(typeof hoisted);   // "undefined": var declaration is hoisted
var hoisted = 1;`),

  Q(32, 'Web & JavaScript', 'Easy', '== vs === in JavaScript?', [
    "`===` is **strict equality**: it returns `true` only when both values have the **same type and the same value**. No conversion happens.",
    "`==` is **loose equality**: if the types differ, JavaScript first **coerces** them to a common type using a set of rules, then compares. That produces surprising results:",
    L("`'5' == 5` is `true` (the string becomes a number).",
      "`0 == ''` and `0 == false` are `true`.",
      "`null == undefined` is `true`, but `null == 0` is `false`.",
      "`[] == false` is `true`, because the array becomes an empty string and then 0."),
    "Edge cases for both: `NaN === NaN` is `false` (use `Number.isNaN(x)`), and objects compare by **reference**, so `{} === {}` is `false` even though they look the same. `Object.is()` is a third option that treats `NaN` as equal to itself and distinguishes `+0` from `-0`.",
    "Best practice is to always use `===` and `!==`. The one accepted use of `==` is `x == null`, a short way to test for both `null` and `undefined`.",
    "Interview tip: give one surprising `==` result and say \"that is why I use ===\". Short and convincing."
  ], C`
console.log("5" == 5);           // true  (type coercion)
console.log("5" === 5);          // false (different types)
console.log(0 == "");            // true
console.log(null == undefined);  // true
console.log(null === undefined); // false
console.log(NaN === NaN);        // false
console.log(Number.isNaN(NaN));  // true
console.log({} === {});          // false: two different objects

const input = null;
if (input == null) console.log("null or undefined");   // the one common == use`),

  Q(33, 'Web & JavaScript', 'Medium', 'What is a closure?', [
    "A **closure** is a function together with the variables from the scope where it was **created**. The inner function keeps access to those variables even after the outer function has returned.",
    "This works because JavaScript uses **lexical scoping**: what a function can see is decided by where it is written, not where it is called. When an outer function returns an inner function, the outer function's variables are not thrown away; they live on as long as the inner function can still use them.",
    "Where closures are used every day:",
    L("**Private state**: a counter or bank balance that cannot be changed from outside except through the returned functions.",
      "**Function factories**: `makeMultiplier(3)` returns a function that remembers 3.",
      "**Callbacks and event handlers**: a click handler remembers the item it was created for.",
      "**Memoization, `once()`, debounce and throttle**: they all store state in a closure.",
      "**React hooks**: each render's handlers close over that render's props and state, which is also the source of \"stale closure\" bugs."),
    "A cost to mention: anything a closure references stays in memory, so long-lived closures that capture large objects can cause memory leaks.",
    "Interview tip: write the counter below and point out that `count` cannot be reached any other way. That is the whole idea."
  ], C`
function createCounter(start = 0) {
  let count = start;                 // private: only the functions below see it
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const visits = createCounter(10);
visits.increment();
visits.increment();
console.log(visits.value());      // 12
console.log(visits.count);        // undefined: not reachable from outside

const makeMultiplier = (factor) => (n) => n * factor;   // factory
const triple = makeMultiplier(3);
console.log(triple(7));           // 21`),

  Q(34, 'Web & JavaScript', 'Medium', 'Explain the event loop.', [
    "JavaScript runs on **one main thread**: it executes one piece of code at a time. The **event loop** is how it still handles timers, network requests and clicks without freezing.",
    "The parts involved:",
    L("**Call stack**: the functions currently running.",
      "**Web APIs / Node APIs**: the browser or Node runs timers, `fetch` and file I/O outside the JavaScript thread.",
      "**Macrotask queue** (task queue): callbacks from `setTimeout`, `setInterval`, I/O and UI events.",
      "**Microtask queue**: promise callbacks (`.then`, code after `await`) and `queueMicrotask`."),
    "The loop's rule:",
    N("Run the current script until the call stack is empty.", "Run **all** microtasks, including any new ones they add.", "Let the browser render if needed.", "Take **one** macrotask, run it, and go back to step 2."),
    "That is why a resolved promise's callback runs before a `setTimeout(..., 0)` callback, and why a long synchronous loop freezes the page: nothing else can run until the stack is empty.",
    "Interview tip: predict the output of the snippet below out loud. Interviewers use exactly this kind of question."
  ], C`
console.log("1: script start");

setTimeout(() => console.log("5: timeout (macrotask)"), 0);

Promise.resolve()
  .then(() => console.log("3: promise then (microtask)"))
  .then(() => console.log("4: second then (microtask)"));

queueMicrotask(() => console.log("3b: queueMicrotask"));

console.log("2: script end");
// Order: 1, 2, 3, 3b, 4, 5`),

  Q(35, 'Web & JavaScript', 'Medium', 'Promises vs async/await?', [
    "A **Promise** is an object that represents a value that will be available later. It is in one of three states: **pending**, **fulfilled** (with a value) or **rejected** (with an error). You react with `.then()` for success, `.catch()` for errors and `.finally()` for cleanup, and chains replace deeply nested callbacks (\"callback hell\").",
    "**async/await** is syntax built on top of promises. An `async` function always returns a promise, and `await` pauses that function until a promise settles, then gives you its value or throws its error. Errors are handled with an ordinary `try/catch`, so asynchronous code reads like synchronous code.",
    "Things interviewers check:",
    L("`await` pauses only the async function, not the whole program; the event loop keeps running.",
      "Awaiting in sequence is slow when tasks are independent. Start them together and use `Promise.all([...])`.",
      "`Promise.all` fails fast on the first rejection; `Promise.allSettled` waits for all and reports each result; `Promise.race` settles with the first to finish; `Promise.any` fulfils with the first success.",
      "A forgotten `await` returns a pending promise instead of the value, a very common bug."),
    "Interview tip: show the sequential vs parallel timing difference below. It proves you understand that async/await is still promises underneath."
  ], C`
const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function sequential() {
  const a = await wait(100, "profile");
  const b = await wait(100, "orders");       // starts only after a finishes
  return [a, b];
}

async function parallel() {
  return Promise.all([wait(100, "profile"), wait(100, "orders")]);   // both at once
}

async function main() {
  let t = Date.now();
  await sequential();
  console.log("sequential ~", Date.now() - t, "ms");   // about 200 ms
  t = Date.now();
  await parallel();
  console.log("parallel   ~", Date.now() - t, "ms");   // about 100 ms
  try {
    await Promise.reject(new Error("network down"));
  } catch (err) {
    console.log("caught:", err.message);
  }
}
main();`),

  Q(36, 'Web & JavaScript', 'Easy', 'What is the box model in CSS?', [
    "In CSS every element is drawn as a rectangular box made of four layers, from the inside out:",
    N("**Content**: the text or image, sized by `width` and `height`.", "**Padding**: space between the content and the border; it shows the element's background colour.", "**Border**: the line around the padding.", "**Margin**: transparent space outside the border that separates the element from its neighbours."),
    "The total size depends on `box-sizing`:",
    L("`content-box` (the default): `width` covers only the content, so `width: 200px` plus `padding: 20px` and `border: 2px` gives a box 244px wide.",
      "`border-box`: `width` includes padding and border, so the box stays exactly 200px. Most projects set `*, *::before, *::after { box-sizing: border-box; }` because layouts become predictable."),
    "Two details often asked: **vertical margins collapse** (two adjacent 20px margins between blocks give 20px, not 40px), and inline elements such as `<span>` ignore `width`, `height` and vertical margins unless they are `inline-block` or `block`.",
    "Interview tip: mention that the browser DevTools \"Computed\" panel shows the box model diagram for any element. It shows you debug layouts in practice."
  ], C`
<style>
  *, *::before, *::after { box-sizing: border-box; }

  .card {
    width: 240px;          /* total width stays 240px with border-box */
    padding: 16px;         /* inside the border */
    border: 2px solid #1f6f5b;
    margin: 24px auto;     /* outside the border; auto centres it */
  }
  .card + .card { margin-top: 12px; }   /* vertical margins collapse */
</style>

<div class="card">Content, padding, border, margin</div>
<div class="card">Second card</div>`, 'html'),

  Q(37, 'Web & JavaScript', 'Medium', 'Flexbox vs Grid?', [
    "Both are modern CSS layout systems. The short rule: **Flexbox is one-dimensional, Grid is two-dimensional**.",
    L("**Flexbox** (`display: flex`) arranges items along **one axis**, a row or a column. Items can grow, shrink and wrap, and `justify-content` and `align-items` make alignment and spacing easy. It is **content-first**: item sizes drive the layout. Ideal for navigation bars, button groups, toolbars, centring something, and lists of cards that wrap.",
      "**Grid** (`display: grid`) defines **rows and columns at the same time** and places items into cells or named areas. It is **layout-first**: you design the structure and items fit into it. Ideal for page layouts (header, sidebar, main, footer), dashboards and galleries where rows and columns must line up."),
    "Useful pieces to know: `gap` works in both; `flex: 1` makes items share space equally; `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` builds a responsive card grid without any media query; `grid-template-areas` lets you draw a layout by name.",
    "They work well together: Grid for the overall page, Flexbox inside each component.",
    "Interview tip: answer with \"one axis vs two axes\" and one example of each. Then show the responsive grid line; it impresses."
  ], C`
<style>
  .navbar {                         /* Flexbox: one row, spaced out */
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .gallery {                        /* Grid: responsive columns, no media query */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }
</style>

<nav class="navbar"><strong>CodeLekho</strong><a href="#">Courses</a><a href="#">Login</a></nav>
<section class="gallery"><div>SQL</div><div>Python</div><div>DSA</div><div>Web</div></section>`, 'html'),

  Q(38, 'Web & JavaScript', 'Easy', 'What is semantic HTML and why does it matter?', [
    "Semantic HTML means using elements that describe **what the content is**, not just how it looks: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<button>`, `<figure>`, `<time>`, rather than a page built entirely from `<div>` and `<span>`.",
    "Why it matters:",
    L("**Accessibility**: screen readers use these elements to announce regions and let users jump to the navigation or main content. A real `<button>` is focusable and works with the keyboard for free; a clickable `<div>` is not.",
      "**SEO**: search engines understand the page structure better, such as which part is the main article and what the headings are.",
      "**Maintainability**: `<nav>` tells the next developer what a block is far better than `<div class=\"box3\">`.",
      "**Built-in behaviour**: `<form>` submits on Enter, `<label for>` focuses its input, `<details>` expands without JavaScript."),
    "Related good habits: one `<h1>` per page and headings in order without skipping levels; meaningful `alt` text on images; use ARIA attributes only when no native element fits (\"no ARIA is better than bad ARIA\").",
    "Interview tip: give the button vs clickable div example. It shows you understand the practical accessibility impact."
  ], C`
<header>
  <nav aria-label="Main">
    <a href="/courses">Courses</a>
    <a href="/interview">Interview Prep</a>
  </nav>
</header>

<main>
  <article>
    <h1>SQL joins explained</h1>
    <p>Published <time datetime="2026-11-01">1 November 2026</time></p>
    <figure>
      <img src="joins.png" alt="Venn diagram of inner and left joins">
      <figcaption>Inner join keeps only the overlap.</figcaption>
    </figure>
    <button type="button">Mark as read</button>
  </article>
</main>

<footer>© CodeLekho</footer>`, 'html'),

  Q(39, 'Web & JavaScript', 'Medium', 'What happens when you type a URL and press Enter?', [
    "This question tests whether you understand the whole web stack. A strong answer walks through the steps in order:",
    N("**Parse the URL**: the browser separates the scheme (`https`), host, path and query. If you typed words instead of a URL, it searches instead.",
      "**DNS lookup**: the browser finds the server's IP address, checking its own cache, the OS cache, the router, then the configured DNS resolver, which may ask root, TLD and authoritative name servers.",
      "**TCP connection**: a three-way handshake (SYN, SYN-ACK, ACK) with the server on port 443. With HTTP/3 this is QUIC over UDP instead.",
      "**TLS handshake**: the server sends its certificate, the browser verifies it, and both agree on encryption keys.",
      "**HTTP request**: `GET /path` with headers such as `Host`, cookies and `Accept`. It may pass through a CDN or load balancer first.",
      "**Server work**: the web server or application runs code, queries databases or caches, and builds a response.",
      "**HTTP response**: a status code (200, 301, 404), headers (`Content-Type`, `Cache-Control`, `Set-Cookie`) and the HTML body.",
      "**Rendering**: the browser parses HTML into the DOM and CSS into the CSSOM, downloads scripts, images and styles (more requests), runs JavaScript, builds the render tree, computes layout and paints pixels."),
    "Caching can skip many of these steps: DNS caches, the browser HTTP cache, service workers and CDN edges.",
    "Interview tip: give the eight steps briefly first, then offer to go deeper into whichever one the interviewer picks (often DNS, TLS or rendering)."
  ]),

  Q(40, 'Web & JavaScript', 'Medium', 'What are the common HTTP methods and status codes?', [
    "**Methods** say what the client wants to do with a resource:",
    L("**GET**: read data. Safe (no changes) and idempotent, and can be cached.",
      "**POST**: create a resource or trigger an action. Not idempotent: sending it twice may create two orders.",
      "**PUT**: replace a resource completely. Idempotent: sending it twice has the same effect as once.",
      "**PATCH**: update part of a resource.",
      "**DELETE**: remove a resource. Idempotent.",
      "**OPTIONS** (used by CORS preflight) and **HEAD** (headers only)."),
    "**Status codes** are grouped by their first digit:",
    L("**2xx success**: 200 OK, 201 Created (after a POST), 204 No Content.",
      "**3xx redirection**: 301 Moved Permanently, 302 Found (temporary), 304 Not Modified (use your cached copy).",
      "**4xx client error**: 400 Bad Request, 401 Unauthorized (not logged in), 403 Forbidden (logged in but not allowed), 404 Not Found, 409 Conflict, 422 Unprocessable Entity (validation failed), 429 Too Many Requests.",
      "**5xx server error**: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout."),
    "Interview tip: the classic follow-ups are \"401 vs 403\" and \"PUT vs PATCH\". Have one-line answers ready for both."
  ], C`
// Node 18+ (or any modern browser): inspect a real response
async function inspect() {
  const res = await fetch("https://httpbin.org/status/404");
  console.log(res.status, res.ok);          // 404 false

  const created = await fetch("https://httpbin.org/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course: "SQL" }),
  });
  console.log(created.status);              // 200 from this test server
}
inspect().catch((err) => console.log("offline:", err.message));`),

  Q(41, 'Web & JavaScript', 'Medium', 'What is REST?', [
    "**REST** (Representational State Transfer) is an architectural style for designing web APIs. Instead of calling functions, clients work with **resources** identified by URLs, such as `/courses/42`, and use standard HTTP methods to act on them.",
    "The main constraints:",
    L("**Client-server**: the front end and the back end evolve separately.",
      "**Stateless**: every request carries everything the server needs, such as an auth token. The server keeps no session between requests, which makes horizontal scaling easy.",
      "**Cacheable**: responses say whether they can be cached.",
      "**Uniform interface**: resources are nouns in URLs, actions are HTTP methods, and representations are usually JSON.",
      "**Layered system**: proxies, CDNs and load balancers can sit in between without the client knowing."),
    "Good REST design in practice: plural nouns (`GET /courses`, `POST /courses`, `GET /courses/42`, `PATCH /courses/42`, `DELETE /courses/42`); nested resources for relationships (`/courses/42/lessons`); filtering, sorting and pagination with query parameters (`?level=beginner&page=2`); correct status codes; and versioning (`/api/v1/`).",
    "Interview tip: design a tiny API live, like the one below, instead of reciting constraints. It shows you can apply them."
  ], C`
// A minimal REST API for courses with Express (npm install express)
const express = require("express");
const app = express();
app.use(express.json());

const courses = [{ id: 1, title: "SQL Basics" }];

app.get("/api/v1/courses", (req, res) => res.json(courses));
app.get("/api/v1/courses/:id", (req, res) => {
  const course = courses.find((c) => c.id === Number(req.params.id));
  return course ? res.json(course) : res.status(404).json({ error: "Not found" });
});
app.post("/api/v1/courses", (req, res) => {
  const course = { id: courses.length + 1, title: req.body.title };
  courses.push(course);
  res.status(201).json(course);             // 201 Created
});

app.listen(3000, () => console.log("API on http://localhost:3000"));`),

  Q(42, 'Web & JavaScript', 'Medium', 'What is CORS?', [
    "Browsers enforce the **same-origin policy**: JavaScript on one origin (scheme + host + port, for example `https://app.example.com`) may not read responses from another origin. It stops a malicious site from silently reading your bank data with your cookies.",
    "**CORS** (Cross-Origin Resource Sharing) is the controlled way for a **server to allow** specific other origins. The browser sends an `Origin` header, and the server answers with `Access-Control-Allow-Origin: https://app.example.com`. If the header is missing or does not match, the browser blocks JavaScript from reading the response.",
    "For \"non-simple\" requests, such as `PUT` or `DELETE`, JSON bodies or custom headers like `Authorization`, the browser first sends a **preflight** `OPTIONS` request asking permission. The server replies with `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`, and only then is the real request sent.",
    "Points interviewers look for:",
    L("CORS is enforced **by the browser**. Postman, curl and server-to-server calls ignore it.",
      "It is fixed **on the server**, not in front-end code.",
      "Sending cookies cross-origin needs `credentials: 'include'` on the client and `Access-Control-Allow-Credentials: true` on the server, and then the origin cannot be `*`.",
      "`Access-Control-Allow-Origin: *` on an API that uses cookies or private data is a security mistake."),
    "Interview tip: say clearly \"CORS is a browser protection that the server relaxes\". Many people think it protects the server."
  ], C`
// Express server allowing one front-end origin (npm install express cors)
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: "https://app.codelekho.example",   // only this site may read responses
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,                         // allow cookies
}));

app.get("/api/profile", (req, res) => res.json({ name: "Asha" }));
app.listen(4000, () => console.log("API on http://localhost:4000"));`),

  Q(43, 'Web & JavaScript', 'Medium', 'localStorage vs sessionStorage vs cookies?', [
    "All three store small pieces of data in the browser, with different lifetimes and uses.",
    L("**localStorage**: about 5 to 10 MB per origin, **persists until cleared** by code or the user, and is shared across all tabs of the same origin. Readable only by JavaScript and never sent to the server automatically. Good for preferences such as theme or a draft.",
      "**sessionStorage**: same API and size, but scoped to **one tab** and cleared when that tab closes. Good for one-tab wizard state.",
      "**Cookies**: about 4 KB each, **sent automatically with every request** to their domain, with an expiry you set. They exist mainly for the server: sessions, authentication and tracking."),
    "Cookie security attributes are a favourite follow-up:",
    L("`HttpOnly`: JavaScript cannot read it, which protects session cookies from XSS.",
      "`Secure`: sent only over HTTPS.",
      "`SameSite=Lax` or `Strict`: not sent on most cross-site requests, which defends against CSRF."),
    "Never store auth tokens or secrets in localStorage: any XSS bug can read them. An `HttpOnly`, `Secure`, `SameSite` cookie is the safer place for a session. Both web storage APIs store **strings only**, so use `JSON.stringify` and `JSON.parse` for objects.",
    "Interview tip: end with where you would keep a login token and why. That is usually the real question."
  ], C`
// Run in the browser console
localStorage.setItem("theme", "dark");                       // survives restarts
localStorage.setItem("cart", JSON.stringify([{ id: 7, qty: 2 }]));
const cart = JSON.parse(localStorage.getItem("cart") || "[]");

sessionStorage.setItem("step", "2");                         // this tab only

// A readable cookie for 7 days (a session cookie would be set by the server
// with HttpOnly, which JavaScript can never read)
document.cookie = "lang=te; max-age=604800; path=/; SameSite=Lax; Secure";

console.log(localStorage.getItem("theme"), cart.length, sessionStorage.getItem("step"));
console.log(document.cookie);`),

  Q(44, 'Web & JavaScript', 'Hard', 'What is the virtual DOM in React?', [
    "Updating the real browser DOM is expensive: changes can trigger style recalculation, layout and repaint. The **virtual DOM** is React's lightweight, in-memory description of the UI as plain JavaScript objects.",
    "How an update works:",
    N("State or props change, so React calls the component again and gets a **new** virtual tree.",
      "React **diffs** the new tree against the previous one. This step is called **reconciliation**.",
      "It applies only the **minimum real DOM changes**, batched together (the **commit** phase)."),
    "The diffing algorithm is fast (close to O(n)) because of two assumptions: elements of a **different type** produce entirely different trees, so React replaces the subtree instead of comparing deeply; and in lists, **keys** identify which item is which. That is why keys must be **stable and unique**, such as a database id. Using the array index as the key causes wrong updates and lost input state when items are inserted, removed or reordered.",
    "Modern React (the **Fiber** architecture) can split rendering work into chunks and prioritise urgent updates such as typing over slow ones, which enables features like `useTransition`.",
    "Nuance worth adding: the virtual DOM is not \"faster than the DOM\"; it makes declarative UI **fast enough** by minimising DOM work. Frameworks such as Svelte and Solid skip it by compiling updates directly.",
    "Interview tip: connect the answer to keys. It shows you know the practical consequence, not just the theory."
  ], C`
import { useState } from "react";

export default function TaskList() {
  const [tasks, setTasks] = useState([
    { id: 101, title: "Revise joins" },
    { id: 102, title: "Practise DSA" },
  ]);

  const addFirst = () =>
    setTasks((t) => [{ id: Date.now(), title: "Mock interview" }, ...t]);

  return (
    <>
      <button onClick={addFirst}>Add to top</button>
      <ul>
        {/* stable id as key: React moves rows instead of rebuilding them */}
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title} <input placeholder="notes" />
          </li>
        ))}
      </ul>
    </>
  );
}`, 'jsx'),

  Q(45, 'Web & JavaScript', 'Medium', 'What do useState and useEffect do?', [
    "Both are **React hooks**, functions that let function components hold state and run side effects.",
    "**useState** gives a component memory between renders. `const [count, setCount] = useState(0)` returns the current value and a setter. Calling the setter **schedules a re-render** with the new value; it does not change the variable immediately. When the next value depends on the previous one, use the function form `setCount(c => c + 1)`, because updates are batched.",
    "**useEffect** runs code **after React has painted**, for work that is not rendering: fetching data, subscriptions, timers, or updating the document title. Its **dependency array** controls when it runs:",
    L("no array: after every render;", "`[]`: once, after the first render;", "`[userId]`: after the first render and whenever `userId` changes."),
    "The function returned from an effect is its **cleanup**: React runs it before the effect runs again and when the component unmounts. Use it to clear intervals, remove listeners and ignore stale fetch results.",
    "Rules of hooks: call them only at the top level of a component or custom hook, never inside conditions or loops, because React tracks hooks by call order.",
    "Interview tip: mention the cleanup function and the race condition it prevents when `userId` changes quickly. It is the part most answers miss."
  ], C`
import { useEffect, useState } from "react";

export default function UserCard({ userId }) {
  const [user, setUser] = useState(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let ignore = false;                        // guards against stale responses
    fetch("https://jsonplaceholder.typicode.com/users/" + userId)
      .then((res) => res.json())
      .then((data) => { if (!ignore) setUser(data); });
    return () => { ignore = true; };           // cleanup when userId changes
  }, [userId]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);            // cleanup on unmount
  }, []);

  return <p>{user ? user.name : "Loading..."} (viewing for {seconds}s)</p>;
}`, 'jsx'),

  // ---------------- Data Science & AI ----------------
  Q(46, 'Data Science & AI', 'Easy', 'Supervised vs unsupervised learning?', [
    "The difference is whether the training data has **labels**, the correct answers.",
    L("**Supervised learning**: every example comes with a label, and the model learns the mapping from inputs to that label. **Classification** predicts a category (spam or not, which digit); **regression** predicts a number (house price, delivery time). Algorithms: linear and logistic regression, decision trees, random forests, gradient boosting, SVMs, neural networks.",
      "**Unsupervised learning**: there are no labels, so the model finds structure on its own. **Clustering** groups similar items (customer segments with k-means); **dimensionality reduction** compresses features (PCA); **anomaly detection** flags unusual transactions; **association rules** find items bought together."),
    "Other paradigms to mention briefly:",
    L("**Semi-supervised**: a few labelled examples plus many unlabelled ones, useful when labelling is expensive.",
      "**Self-supervised**: labels are created from the data itself, such as predicting the next word. This is how large language models are pre-trained.",
      "**Reinforcement learning**: an agent learns by trial and error from rewards, as in game playing and robotics."),
    "Interview tip: give one business example for each type. \"Predict churn\" is supervised; \"group customers into segments\" is unsupervised."
  ], C`
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans

X, y = load_iris(return_X_y=True)

# Supervised: learn from labels y, then predict labels
clf = LogisticRegression(max_iter=500).fit(X, y)
print("supervised accuracy:", round(clf.score(X, y), 3))

# Unsupervised: no labels given, the model finds 3 groups on its own
km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)
print("cluster sizes:", sorted((km.labels_ == k).sum() for k in range(3)))`),

  Q(47, 'Data Science & AI', 'Medium', 'What are overfitting and underfitting?', [
    "Both describe a model that **generalises badly** to new data, for opposite reasons.",
    L("**Overfitting**: the model learns the training data too well, including its noise and quirks. Training error is very low but validation or test error is much higher. Typical causes: a model too complex for the amount of data, too many features, or training for too long.",
      "**Underfitting**: the model is too simple to capture the real pattern, such as a straight line through curved data. Error is high on **both** training and test data."),
    "How to detect it: compare training and validation scores, or plot **learning curves**. A big gap means overfitting; two similar but poor scores mean underfitting.",
    "Fixes for **overfitting**:",
    L("more training data or data augmentation;", "a simpler model, or fewer features;", "**regularisation** (L1, L2, dropout in neural networks);", "**early stopping**;", "limiting tree depth, pruning, or using ensembles such as random forests;", "cross-validation to tune hyperparameters honestly."),
    "Fixes for **underfitting**: a more expressive model, better features, less regularisation, or training longer.",
    "Interview tip: name the symptom with numbers, such as \"99% train accuracy but 75% validation means overfitting\". It shows you have actually trained models."
  ], C`
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor

rng = np.random.default_rng(42)
X = np.sort(rng.uniform(0, 6, 200)).reshape(-1, 1)
y = np.sin(X).ravel() + rng.normal(0, 0.3, 200)          # signal + noise
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)

for depth in (1, 4, 20):    # too simple, about right, too complex
    tree = DecisionTreeRegressor(max_depth=depth, random_state=0).fit(X_tr, y_tr)
    print(f"depth {depth:>2}: train R2 = {tree.score(X_tr, y_tr):.2f}, "
          f"test R2 = {tree.score(X_te, y_te):.2f}")
# depth 1 underfits (both low); depth 20 overfits (train ~1.0, test lower)`),

  Q(48, 'Data Science & AI', 'Medium', 'Explain the bias-variance trade-off.', [
    "A model's expected error on new data can be split into three parts: **bias squared + variance + irreducible noise**.",
    L("**Bias** is error from wrong or overly simple assumptions. A high-bias model misses the pattern consistently: it **underfits**.",
      "**Variance** is error from being too sensitive to the particular training sample. Train a high-variance model on a slightly different dataset and its predictions change a lot: it **overfits**.",
      "**Noise** is randomness in the data itself that no model can remove."),
    "The trade-off: making a model more flexible usually lowers bias but raises variance, and simplifying it does the opposite. The goal is the complexity where **total** error is lowest, which you find with validation data or cross-validation.",
    "Examples: linear regression is high-bias and low-variance; a deep decision tree or k-NN with k = 1 is low-bias and high-variance.",
    "Tools that move the balance:",
    L("**Regularisation** adds a little bias to cut a lot of variance.",
      "**Bagging** (random forests) averages many high-variance models to reduce variance.",
      "**Boosting** combines many high-bias weak learners to reduce bias.",
      "**More data** reduces variance without adding bias."),
    "Interview tip: use the dartboard picture: bias is how far the shots land from the centre on average, variance is how spread out they are."
  ], C`
import numpy as np
from sklearn.neighbors import KNeighborsRegressor

rng = np.random.default_rng(0)
x_test = np.array([[2.5]])
true_value = np.sin(2.5)

for k in (1, 15, 80):                      # small k: low bias, high variance
    preds = []
    for _ in range(200):                   # 200 different training samples
        X = rng.uniform(0, 5, (100, 1))
        y = np.sin(X).ravel() + rng.normal(0, 0.4, 100)
        preds.append(KNeighborsRegressor(n_neighbors=k).fit(X, y).predict(x_test)[0])
    preds = np.array(preds)
    print(f"k={k:>2}: bias^2={(preds.mean() - true_value) ** 2:.3f}, variance={preds.var():.3f}")`),

  Q(49, 'Data Science & AI', 'Easy', 'Why split data into training, validation and test sets?', [
    "A model must be judged on data it has **never seen**, because the goal is to perform well on future data, not to memorise the past. A typical split is about 70/15/15 or 80/10/10.",
    L("**Training set**: the model learns its parameters (weights, tree splits) from this data.",
      "**Validation set**: used to compare models and tune **hyperparameters** such as tree depth, learning rate or regularisation strength, and for early stopping.",
      "**Test set**: used **once, at the very end**, for an honest estimate of real-world performance."),
    "Why a separate test set? If you tune against the validation set many times, you slowly fit your choices to it, so its score becomes optimistic. The untouched test set protects against that.",
    "Rules that prevent **data leakage**:",
    L("Split **before** any preprocessing that learns from data. Fit scalers, imputers and encoders on the training set only, then apply them to validation and test data. A scikit-learn `Pipeline` enforces this.",
      "For **time series**, split by time (train on the past, test on the future), never randomly.",
      "Use a **stratified** split for imbalanced classes so each set has the same class ratio.",
      "Keep all rows from the same user or patient in one set, so the model cannot recognise individuals."),
    "With small datasets, use **k-fold cross-validation** instead of a single validation split.",
    "Interview tip: mention data leakage by name and give the scaler example. It is the mistake interviewers most want you to avoid."
  ], C`
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = load_breast_cancer(return_X_y=True)

# 70% train, 15% validation, 15% test, keeping the class ratio (stratify)
X_train, X_tmp, y_train, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=1)
X_val, X_test, y_val, y_test = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=1)

best_C, best_score = None, 0
for C_value in (0.01, 0.1, 1, 10):                       # tune on validation only
    model = make_pipeline(StandardScaler(), LogisticRegression(C=C_value, max_iter=1000))
    score = model.fit(X_train, y_train).score(X_val, y_val)
    if score > best_score:
        best_C, best_score = C_value, score

final = make_pipeline(StandardScaler(), LogisticRegression(C=best_C, max_iter=1000)).fit(X_train, y_train)
print("best C:", best_C, "| test accuracy (used once):", round(final.score(X_test, y_test), 3))`),

  Q(50, 'Data Science & AI', 'Medium', 'Precision vs recall vs F1?', [
    "These metrics evaluate a classifier, and they matter most when classes are **imbalanced**, where plain accuracy misleads. (If only 1% of transactions are fraud, a model that always says \"not fraud\" is 99% accurate and useless.)",
    "Using the confusion matrix counts TP, FP, FN and TN:",
    L("**Precision = TP / (TP + FP)**: of everything the model flagged as positive, how much really was positive? High precision means few false alarms.",
      "**Recall = TP / (TP + FN)**: of all the real positives, how many did the model catch? Also called sensitivity or true positive rate.",
      "**F1 = 2 x precision x recall / (precision + recall)**: the harmonic mean, which is high only when **both** are high."),
    "Which one matters depends on the **cost of each mistake**:",
    L("**Recall** when missing a positive is costly: cancer screening, fraud detection.",
      "**Precision** when false alarms are costly: a spam filter must not hide real emails; a recommendation should not annoy users."),
    "There is a trade-off: lowering the decision threshold catches more positives (recall goes up) but adds false alarms (precision goes down). A **precision-recall curve** shows every threshold; **ROC-AUC** summarises ranking quality across thresholds.",
    "Interview tip: always tie the metric choice to the business cost. \"For fraud I would favour recall, then tune the threshold so precision stays acceptable.\""
  ], C`
from sklearn.metrics import precision_score, recall_score, f1_score

# 1 = fraud. 10 transactions: 4 real frauds.
y_true = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
y_pred = [1, 1, 1, 0, 1, 1, 0, 0, 0, 0]   # caught 3 frauds, 2 false alarms

p = precision_score(y_true, y_pred)   # 3 / (3 + 2) = 0.60
r = recall_score(y_true, y_pred)      # 3 / (3 + 1) = 0.75
f = f1_score(y_true, y_pred)          # 2 * 0.6 * 0.75 / 1.35 = 0.667
print(f"precision={p:.2f} recall={r:.2f} f1={f:.3f}")`),

  Q(51, 'Data Science & AI', 'Medium', 'What is a confusion matrix?', [
    "A confusion matrix is a table that compares a classifier's **predicted** classes with the **actual** classes, so you can see exactly what kinds of mistakes it makes. For two classes it has four cells:",
    L("**True Positive (TP)**: predicted positive, actually positive.",
      "**False Positive (FP)**: predicted positive, actually negative. A false alarm, or Type I error.",
      "**False Negative (FN)**: predicted negative, actually positive. A miss, or Type II error.",
      "**True Negative (TN)**: predicted negative, actually negative."),
    "Every common metric comes from these cells: accuracy = (TP + TN) / total, precision = TP / (TP + FP), recall = TP / (TP + FN), specificity = TN / (TN + FP).",
    "For **multi-class** problems it becomes an n by n table. The diagonal holds correct predictions, and large off-diagonal cells show which classes the model confuses, such as the digits 4 and 9, which points you to what to fix.",
    "Be careful about orientation: scikit-learn puts **actual classes in rows and predicted classes in columns**, and orders labels ascending, so for 0/1 labels the top-left cell is TN, not TP.",
    "Interview tip: read the cells aloud in plain words (\"12 frauds were missed\"). It shows you can explain model errors to non-technical people."
  ], C`
from sklearn.metrics import confusion_matrix, classification_report

actual    = ["spam", "spam", "ham", "ham", "ham", "spam", "ham", "ham"]
predicted = ["spam", "ham",  "ham", "spam", "ham", "spam", "ham", "ham"]

cm = confusion_matrix(actual, predicted, labels=["spam", "ham"])
print(cm)
# rows = actual, columns = predicted
# [[2 1]   actual spam: 2 caught (TP), 1 missed (FN)
#  [1 4]]  actual ham:  1 false alarm (FP), 4 correct (TN)
print(classification_report(actual, predicted, labels=["spam", "ham"]))`),

  Q(52, 'Data Science & AI', 'Medium', 'How do you handle missing data?', [
    "First **understand why** values are missing, because the right fix depends on it:",
    L("**MCAR** (missing completely at random): unrelated to anything, such as a sensor glitch. Dropping rows is unbiased, just wasteful.",
      "**MAR** (missing at random): explained by other columns, such as older customers skipping the income field. Impute using those columns.",
      "**MNAR** (missing not at random): related to the missing value itself, such as people with high incomes declining to share income. The missingness is information in itself."),
    "Then choose a strategy:",
    N("**Drop** rows with few gaps, or columns that are mostly empty.",
      "**Simple imputation**: median for skewed numbers, mean for symmetric ones, mode or an explicit \"Unknown\" category for categories.",
      "**Group-wise imputation**: fill with the median of a similar group (median salary per department).",
      "**Model-based**: k-NN imputation or iterative imputation (MICE) predicts the missing value from other features.",
      "**Time series**: forward-fill or interpolate.",
      "**Add a missing indicator** column, so the model can learn that missingness itself matters (vital for MNAR)."),
    "Two rules: fit the imputer on **training data only** to avoid leakage, and note that some models such as XGBoost, LightGBM and recent scikit-learn trees handle NaN natively.",
    "Interview tip: start with \"first I check how much is missing and why\". Jumping straight to \"fill with the mean\" is the weak answer."
  ], C`
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "dept":   ["Eng", "Eng", "Sales", "Sales", "Eng", "HR"],
    "salary": [120, np.nan, 70, 75, 150, np.nan],
    "city":   ["Pune", None, "Delhi", "Delhi", "Pune", "Goa"],
})

print(df.isna().sum())                                     # how much is missing?
df["salary_missing"] = df["salary"].isna().astype(int)     # keep the signal
df["salary"] = df["salary"].fillna(df.groupby("dept")["salary"].transform("median"))
df["salary"] = df["salary"].fillna(df["salary"].median())  # HR had no other values
df["city"] = df["city"].fillna("Unknown")
print(df)`),

  Q(53, 'Data Science & AI', 'Medium', 'What is feature scaling and when is it needed?', [
    "Feature scaling puts numeric features on comparable ranges. Without it, a feature like salary (in lakhs) would dominate a feature like years of experience (0 to 40), purely because its numbers are bigger.",
    "Common methods:",
    L("**Standardisation (z-score)**: `(x - mean) / std`, giving mean 0 and standard deviation 1. The usual default (`StandardScaler`).",
      "**Min-max normalisation**: `(x - min) / (max - min)`, mapping to 0 to 1. Good for bounded inputs such as image pixels, but sensitive to outliers (`MinMaxScaler`).",
      "**Robust scaling**: uses the median and interquartile range, so outliers do not distort it (`RobustScaler`).",
      "**Log transform**: compresses heavily skewed data such as income or prices before scaling."),
    "When scaling **is needed**: algorithms based on **distance** (k-NN, k-means, SVM), on **gradient descent** (linear and logistic regression, neural networks, which converge much faster on scaled data), on **regularisation** (the penalty treats all coefficients equally, so units must be comparable) and on **variance** (PCA).",
    "When it is **not needed**: tree-based models (decision trees, random forests, gradient boosting), because they split on thresholds and only the order of values matters.",
    "As with every preprocessing step, fit the scaler on the training set only, then transform validation and test data with it.",
    "Interview tip: list which models need scaling and which do not, with the reason. The tree-based exception is the key part."
  ], C`
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

# columns: years of experience, salary in rupees (one outlier)
X = np.array([[1, 300000], [3, 450000], [5, 600000], [7, 800000], [10, 5000000]], dtype=float)

for scaler in (StandardScaler(), MinMaxScaler(), RobustScaler()):
    scaled = scaler.fit_transform(X)
    print(type(scaler).__name__.ljust(15), np.round(scaled[:, 1], 2))
# MinMax squeezes the normal salaries near 0 because of the outlier;
# RobustScaler keeps them spread out.`),

  Q(54, 'Data Science & AI', 'Hard', 'What is regularisation (L1 vs L2)?', [
    "Regularisation fights **overfitting** by adding a penalty on large model weights to the loss function: **loss = data error + lambda x penalty**. The strength lambda (`alpha` in scikit-learn, or `C = 1 / lambda` in logistic regression) is tuned with validation data.",
    L("**L1 (Lasso)**: the penalty is the sum of **absolute** weights. It pushes many weights to **exactly zero**, so it also performs **feature selection** and produces sparse, interpretable models.",
      "**L2 (Ridge)**: the penalty is the sum of **squared** weights. It shrinks all weights smoothly towards zero but rarely to exactly zero. It handles correlated features well by sharing weight between them.",
      "**Elastic Net**: a mix of L1 and L2, useful when there are many correlated features and you still want some selection."),
    "Why L1 gives zeros: geometrically, its constraint region is a diamond whose corners sit on the axes, and the optimum tends to land on a corner, where some weights are zero. The L2 region is a circle with no corners.",
    "Regularisation in other models: **dropout**, **weight decay** and **early stopping** in neural networks; `max_depth`, `min_samples_leaf` and pruning in trees.",
    "Scale features first: the penalty compares weights directly, so features in larger units would be penalised unfairly.",
    "Interview tip: the one-line summary is \"L1 makes weights zero and selects features, L2 makes weights small and keeps them all\"."
  ], C`
import numpy as np
from sklearn.linear_model import Lasso, Ridge
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(7)
X = StandardScaler().fit_transform(rng.normal(size=(200, 6)))
# only the first two features really matter
y = 4 * X[:, 0] - 3 * X[:, 1] + rng.normal(0, 0.5, 200)

print("Lasso (L1):", np.round(Lasso(alpha=0.3).fit(X, y).coef_, 2))   # extra weights become 0
print("Ridge (L2):", np.round(Ridge(alpha=10).fit(X, y).coef_, 2))    # all small, none exactly 0`),

  Q(55, 'Data Science & AI', 'Medium', 'How does a decision tree work, and what is a random forest?', [
    "A **decision tree** predicts by asking a series of yes/no questions about the features, such as \"income above 50,000?\" then \"age below 30?\", until it reaches a leaf that gives the prediction (the majority class, or the average value for regression).",
    "It is built greedily from the top: at each node it tries every feature and threshold and picks the split that makes the child groups **purest**. Purity is measured by **Gini impurity** or **entropy** (information gain) for classification, and by variance reduction for regression. It keeps splitting until a stopping rule such as `max_depth` or `min_samples_leaf`.",
    "Strengths: easy to explain, handles numbers and categories, needs no scaling, and captures non-linear patterns. Weakness: a deep tree **overfits** badly and changes a lot if the data changes slightly (high variance).",
    "A **random forest** fixes that by building **many trees** and combining them (majority vote or average), adding two kinds of randomness so the trees make different mistakes:",
    L("**Bagging**: each tree trains on a bootstrap sample, drawn with replacement from the data.",
      "**Feature randomness**: each split considers only a random subset of features."),
    "Averaging many decorrelated trees greatly reduces variance. A bonus: the rows each tree did not see give a free **out-of-bag** score, and the forest reports **feature importances**.",
    "Interview tip: say \"a forest reduces variance, not bias\", then contrast it with boosting, which builds trees one after another to reduce bias."
  ], C`
from sklearn.datasets import load_wine
from sklearn.model_selection import cross_val_score
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier

X, y = load_wine(return_X_y=True, as_frame=True)

tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y)
print(export_text(tree, feature_names=list(X.columns)))      # the learned questions

single = cross_val_score(DecisionTreeClassifier(random_state=0), X, y, cv=5).mean()
forest = cross_val_score(RandomForestClassifier(n_estimators=200, random_state=0), X, y, cv=5).mean()
print(f"one deep tree: {single:.3f}  random forest: {forest:.3f}")`),

  Q(56, 'Data Science & AI', 'Medium', 'What is gradient descent?', [
    "Gradient descent is the optimisation method used to train most machine learning models. It finds the parameters (weights) that **minimise a loss function** by repeatedly taking small steps **downhill**.",
    "The update rule is `w = w - learning_rate x gradient`. The **gradient** is the vector of partial derivatives of the loss with respect to each weight; it points uphill, so moving against it reduces the loss. Repeat until the loss stops improving.",
    "The **learning rate** is the most important setting: too small and training is very slow; too large and the loss bounces around or diverges. Learning-rate schedules reduce it over time.",
    "Variants:",
    L("**Batch gradient descent**: uses the whole dataset per step. Accurate but slow on big data.",
      "**Stochastic gradient descent (SGD)**: one example per step. Fast and noisy; the noise can help escape poor regions.",
      "**Mini-batch** (for example 32 to 512 examples): the standard in deep learning, balancing both and using GPUs well.",
      "**Momentum, RMSProp and Adam**: smarter optimisers that adapt the step size per parameter. Adam is the common default for neural networks."),
    "Practical notes: scale the features (otherwise the loss surface is a stretched valley and convergence is slow), and remember that on non-convex losses it can stop at a local minimum or saddle point, which matters less in practice for large networks.",
    "Interview tip: write the update rule and explain what happens with a too-large learning rate. That is the classic follow-up."
  ], C`
import numpy as np

# Fit y = w*x + b by gradient descent on mean squared error
rng = np.random.default_rng(1)
x = rng.uniform(0, 10, 100)
y = 3.0 * x + 7.0 + rng.normal(0, 1, 100)

w, b, lr = 0.0, 0.0, 0.01
for step in range(2000):
    error = (w * x + b) - y
    grad_w = 2 * np.mean(error * x)       # d(MSE)/dw
    grad_b = 2 * np.mean(error)           # d(MSE)/db
    w -= lr * grad_w                      # step downhill
    b -= lr * grad_b
    if step % 500 == 0:
        print(f"step {step:4d}: loss = {np.mean(error ** 2):.3f}")

print(f"learned w = {w:.2f}, b = {b:.2f}  (true values 3 and 7)")`),

  Q(57, 'Data Science & AI', 'Hard', 'What is a neural network and what does backpropagation do?', [
    "A **neural network** is a model built from layers of simple units (neurons). Each neuron computes a weighted sum of its inputs plus a bias, then applies a **non-linear activation function** such as ReLU, sigmoid or tanh. Stacking an input layer, one or more hidden layers and an output layer lets the network learn very complex functions. Without the non-linearity, any number of layers would collapse into a single linear model.",
    "Training repeats four steps:",
    N("**Forward pass**: feed a batch through the network to get predictions.",
      "**Loss**: measure how wrong they are, using mean squared error for regression or cross-entropy for classification.",
      "**Backpropagation**: compute the gradient of the loss with respect to **every weight**, efficiently, by applying the **chain rule** from the output layer backwards. Each layer reuses the gradient already computed for the layer after it, so the cost is about the same as one forward pass.",
      "**Update**: an optimiser such as SGD or Adam adjusts every weight a little in the direction that reduces the loss."),
    "So backpropagation computes the gradients, and gradient descent uses them; they are two different things.",
    "Common problems and fixes: **vanishing gradients** in deep networks with sigmoid activations (use ReLU, residual connections, batch normalisation); **overfitting** (dropout, weight decay, more data). Specialised architectures: **CNNs** for images, **RNNs/LSTMs** for older sequence models, **transformers** for language and much more.",
    "Interview tip: separate the two ideas clearly: backpropagation finds the gradients, the optimiser takes the step."
  ], C`
import numpy as np

# A 2-8-1 network learning XOR, with backpropagation written by hand
rng = np.random.default_rng(0)
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y = np.array([[0], [1], [1], [0]], dtype=float)
W1, b1 = rng.normal(size=(2, 8)), np.zeros((1, 8))
W2, b2 = rng.normal(size=(8, 1)), np.zeros((1, 1))
sigmoid = lambda z: 1 / (1 + np.exp(-z))

for epoch in range(5000):
    h = np.tanh(X @ W1 + b1)                 # forward pass
    out = sigmoid(h @ W2 + b2)
    d_out = out - y                          # gradient of cross-entropy wrt pre-sigmoid
    d_h = (d_out @ W2.T) * (1 - h ** 2)      # chain rule back through tanh
    W2 -= 0.1 * h.T @ d_out;  b2 -= 0.1 * d_out.sum(0, keepdims=True)
    W1 -= 0.1 * X.T @ d_h;    b1 -= 0.1 * d_h.sum(0, keepdims=True)

print(np.round(out.ravel(), 2))              # close to [0, 1, 1, 0]`),

  Q(58, 'Data Science & AI', 'Hard', 'What is a transformer / large language model?', [
    "A **transformer** is a neural network architecture, introduced in the 2017 paper \"Attention Is All You Need\", that processes a whole sequence in parallel using **self-attention**. It replaced RNNs for language because it trains much faster on GPUs and handles long-range context better.",
    "How self-attention works: each token (a word or word piece) is turned into an embedding, and then into three vectors: a **query**, a **key** and a **value**. Each token's query is compared with every token's key to get attention weights (a softmax of scaled dot products), and its new representation is the weighted average of the values. So in \"the bank of the river\", the word \"bank\" can attend to \"river\" and get the right meaning. **Multi-head** attention runs several of these in parallel, and **positional encodings** add word-order information, because attention by itself ignores order.",
    "A **large language model (LLM)**, such as GPT, Claude, Gemini or Llama, is a very large transformer, usually decoder-only:",
    L("**Pre-training**: learn to predict the next token over trillions of tokens of text (self-supervised).",
      "**Fine-tuning**: instruction tuning, plus reinforcement learning from human feedback (RLHF) or similar methods, to make it helpful and safe.",
      "**Generation**: produce text one token at a time, each choice conditioned on everything before it, within a limited **context window**."),
    "Limitations to mention: they can **hallucinate** confident but false facts, their knowledge has a cut-off date, and they reflect biases in the training data. **RAG** (retrieval-augmented generation) reduces hallucination by retrieving relevant documents and putting them in the prompt.",
    "Interview tip: explain attention with one concrete sentence example. It is far more convincing than the formula alone."
  ], C`
import numpy as np

def self_attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    scores = Q @ K.T / np.sqrt(K.shape[1])            # how much each token attends to each other
    weights = np.exp(scores - scores.max(axis=1, keepdims=True))
    weights /= weights.sum(axis=1, keepdims=True)     # softmax per row
    return weights @ V, weights

rng = np.random.default_rng(3)
tokens = ["the", "bank", "of", "river"]
X = rng.normal(size=(4, 8))                           # 4 token embeddings of size 8
Wq, Wk, Wv = (rng.normal(size=(8, 8)) * 0.3 for _ in range(3))   # learned in a real model

output, attn = self_attention(X, Wq, Wk, Wv)
print(output.shape)                                   # (4, 8): one new vector per token
print(dict(zip(tokens, np.round(attn[1], 2))))        # what "bank" attends to`),

  Q(59, 'Data Science & AI', 'Easy', 'What do pandas and NumPy do?', [
    "They are the foundation of data work in Python.",
    "**NumPy** provides the `ndarray`: a fast, fixed-type, n-dimensional array stored in one contiguous block of memory. Operations are **vectorised**, so `a * 2` or `a + b` runs in optimised C over the whole array with no Python loop, often 10 to 100 times faster than a list. It also gives **broadcasting** (operations between arrays of different shapes), linear algebra, random numbers and statistics. scikit-learn, pandas and much of the deep learning ecosystem are built on it.",
    "**pandas** builds labelled, table-like structures on top of NumPy: the **Series** (one labelled column) and the **DataFrame** (a table with named columns of possibly different types). It is the everyday tool for:",
    L("reading and writing CSV, Excel, JSON and SQL (`read_csv`, `to_sql`);",
      "cleaning: missing values, types, duplicates, string operations;",
      "selecting with `loc` (by label) and `iloc` (by position) and filtering with boolean masks;",
      "`groupby` aggregations, `merge`/`join` (like SQL joins), pivot tables and time-series resampling."),
    "Rule of thumb: NumPy for numerical arrays and maths, pandas for labelled tabular data analysis. For data too big for memory, people move to Polars, Dask or Spark.",
    "Interview tip: say \"vectorisation\" and show a groupby. Those two words cover most of what is being tested."
  ], C`
import numpy as np
import pandas as pd

prices = np.array([55000, 2500, 30000, 12000])
print(prices * 1.18)                    # vectorised: GST added to every item at once
print(prices.mean(), prices[prices > 10000])

orders = pd.DataFrame({
    "city":   ["Mumbai", "Pune", "Mumbai", "Delhi", "Pune"],
    "amount": [60000, 1900, 30000, 55000, 3100],
})
summary = orders.groupby("city")["amount"].agg(["count", "sum", "mean"])
print(summary.sort_values("sum", ascending=False))
print(orders.loc[orders["amount"] > 20000, "city"].tolist())`),

  Q(60, 'Data Science & AI', 'Medium', 'Correlation vs causation?', [
    "**Correlation** means two variables move together. **Causation** means a change in one actually **produces** a change in the other. Correlation is necessary for a simple causal link, but it is never proof of one.",
    "Why correlated things may not be causal:",
    L("**Confounding variable**: a third factor drives both. Ice-cream sales and drowning deaths rise together because both rise in hot weather.",
      "**Reverse causation**: the arrow points the other way. Hospitals have more sick people, but they do not make people sick.",
      "**Coincidence**: with enough variables, some will correlate by pure chance (spurious correlation).",
      "**Selection bias**: the sample itself creates the pattern."),
    "Measuring correlation: **Pearson's r** (from -1 to +1) measures **linear** relationships; **Spearman's rank correlation** measures monotonic ones. A correlation of 0 does not mean \"no relationship\": y = x squared over symmetric data has r close to 0 but a perfect dependency.",
    "Establishing causation:",
    L("**Randomised controlled experiments**, such as **A/B tests**: random assignment balances out confounders.",
      "When experiments are impossible: observational methods such as controlling for confounders in regression, difference-in-differences, instrumental variables or propensity score matching."),
    "Interview tip: give a business example: \"users who use feature X churn less\" might only mean engaged users try more features. You would run an A/B test before claiming X reduces churn."
  ], C`
import numpy as np

rng = np.random.default_rng(5)
temperature = rng.uniform(20, 40, 365)                       # the hidden confounder
ice_cream_sales = 50 * temperature + rng.normal(0, 80, 365)
drownings = 0.4 * temperature + rng.normal(0, 1.5, 365)

print("corr(ice cream, drownings):", round(np.corrcoef(ice_cream_sales, drownings)[0, 1], 2))

# Remove temperature's effect from both, then correlate what is left
resid_ice = ice_cream_sales - np.polyval(np.polyfit(temperature, ice_cream_sales, 1), temperature)
resid_drown = drownings - np.polyval(np.polyfit(temperature, drownings, 1), temperature)
print("after controlling for temperature:", round(np.corrcoef(resid_ice, resid_drown)[0, 1], 2))

x = np.linspace(-3, 3, 101)
print("y = x^2 Pearson r:", round(np.corrcoef(x, x ** 2)[0, 1], 2))   # ~0, yet fully dependent`),
];
