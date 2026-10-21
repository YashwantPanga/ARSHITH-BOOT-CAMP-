// Additional learning content for SQL & Relational Databases, modules 11–15.
const PG = 'PostgreSQL Global Development Group';
const SQLITE = 'SQLite Consortium';

export default {
  'sql-mod-11': {
    skills: ['Write scalar, IN/EXISTS and correlated subqueries', 'Structure complex logic with CTEs (WITH)', 'Combine result sets with UNION, INTERSECT and EXCEPT'],
    prerequisites: ['Joins and aggregates (Modules 09–10)'],
    intuition: {
      analogy: 'A subquery is a question you answer first so you can ask the real question: "Who earns more than the average?" needs the average first. A CTE is writing that first answer on a sticky note with a name, so the main query reads like a sentence.',
      whyItMatters: 'Real business questions are layered ("customers whose spend is above their city\'s average"). CTEs keep such queries readable and testable step by step.'
    },
    workflow: {
      title: 'Building a query from named steps (CTEs)',
      nodes: [
        { id: 'cte1', label: 'WITH spend AS (…)', detail: 'Step 1: total spend per customer.', input: 'orders', output: 'customer_id, total' },
        { id: 'cte2', label: 'avg_spend AS (…)', detail: 'Step 2: one row with the average total.', input: 'spend', output: 'avg_total' },
        { id: 'main', label: 'Main SELECT', detail: 'Join steps and filter: total > avg_total.', input: 'spend, avg_spend, customers', output: 'Answer rows' },
        { id: 'set', label: 'Optional UNION / EXCEPT', detail: 'Combine with another compatible result.', input: 'Two result sets', output: 'Combined set' }
      ],
      edges: [{ from: 'cte1', to: 'cte2' }, { from: 'cte1', to: 'main' }, { from: 'cte2', to: 'main' }, { from: 'main', to: 'set' }],
      explanation: 'Each CTE can be run on its own while debugging, which makes complex logic much easier to verify.'
    },
    workedExample: {
      title: 'Scalar subquery and recursive CTE',
      language: 'sql',
      code: 'SELECT first_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;\n\nWITH RECURSIVE team(emp_id, first_name, level) AS (\n  SELECT emp_id, first_name, 0 FROM employees WHERE emp_id = 101\n  UNION ALL\n  SELECT e.emp_id, e.first_name, t.level + 1\n  FROM employees e JOIN team t ON e.manager_id = t.emp_id\n)\nSELECT first_name, level FROM team ORDER BY level, first_name;',
      lineByLine: [
        { line: 3, explanation: 'The subquery returns one value (71750), used like a constant.' },
        { line: 6, explanation: 'A recursive CTE has an anchor part …' },
        { line: 8, explanation: '… and a recursive part that joins back to the CTE until no new rows appear.' },
        { line: 12, explanation: 'Aarav (level 0) manages Diya and Vihaan (level 1).' }
      ],
      expectedOutput: 'first_name | salary\nAarav | 98000\nDiya | 87000\nVihaan | 79000\nMeera | 72000\n\nfirst_name | level\nAarav | 0\nDiya | 1\nVihaan | 1',
      edgeCases: ['A scalar subquery that returns more than one row raises an error.', 'UNION removes duplicates (extra sort/hash work); use UNION ALL when duplicates are impossible or wanted.']
    },
    caseStudy: {
      title: 'Finding VIP customers',
      problem: 'Sales defines VIPs as customers whose non-cancelled spend is above ₹500.',
      data: 'orders and customers (sample schema).',
      steps: ['CTE spend: SUM(total_amount) per customer where status <> \'CANCELLED\'.', 'Join spend to customers and filter total > 500.', 'Use EXCEPT to compare with last month\'s VIP list and find newcomers.'],
      result: 'Arjun Rao (₹1,587) and Tara Singh (₹1,338) qualify in the sample data.',
      limitations: 'A fixed ₹500 threshold ignores seasonality; a percentile-based rule (window functions, Module 15) adapts automatically.'
    },
    exercises: [
      {
        id: 'sql11-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'UNION vs UNION ALL',
        objective: 'Predict set-operator results.',
        problem: 'How many rows does this return?\nSELECT city FROM customers\nUNION\nSELECT location FROM departments;',
        hints: ['Customer cities: Hyderabad, Mumbai, Pune, Delhi, Hyderabad.', 'Department locations: Hyderabad, Mumbai, Bengaluru, Chennai.'],
        check: { type: 'numeric', answer: 6, tolerance: 0 },
        solution: ['UNION removes duplicates across both results.', 'Distinct values: Hyderabad, Mumbai, Pune, Delhi, Bengaluru, Chennai → 6.'],
        explanation: 'UNION ALL would return 9 rows (5 + 4).',
        mistakes: ['Counting 9 because duplicates were not removed.'],
        challenge: 'Use INTERSECT to list cities that have both customers and a department.'
      },
      {
        id: 'sql11-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Above their department\'s average',
        objective: 'Write a correlated subquery.',
        problem: 'Return first_name and salary of employees who earn more than the average salary of their own department, ordered by emp_id.',
        starterCode: 'SELECT first_name, salary\nFROM employees e\nWHERE salary > (\n  -- average for e\'s department\n)\nORDER BY emp_id;',
        hints: ['SELECT AVG(salary) FROM employees x WHERE x.dept_id = e.dept_id'],
        check: { type: 'rows', ordered: true, rows: [['Aarav', 98000], ['Kabir', 64000], ['Rohan', 61000]] },
        solutionCode: 'SELECT first_name, salary\nFROM employees e\nWHERE salary > (\n  SELECT AVG(salary) FROM employees x WHERE x.dept_id = e.dept_id\n)\nORDER BY emp_id;',
        solution: ['Department averages: Engineering 88000, Sales 61000, Marketing 58000, Finance 72000.', 'Only Aarav, Kabir and Rohan are above their own department\'s average; Meera equals hers.'],
        explanation: 'The inner query refers to e.dept_id from the outer row, so it is re-evaluated per row (correlated).',
        mistakes: ['Comparing with the company-wide average instead.'],
        challenge: 'Rewrite it with a CTE of department averages and a join.'
      },
      {
        id: 'sql11-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'VIP customers with a CTE',
        objective: 'Structure a query with WITH.',
        problem: 'Using a CTE, return name and total non-cancelled spend for customers whose total is above 500, highest first.',
        starterCode: "WITH spend AS (\n  SELECT customer_id, SUM(total_amount) AS total\n  FROM orders\n  WHERE \n  GROUP BY customer_id\n)\nSELECT \nFROM spend s\nJOIN customers c ON c.customer_id = s.customer_id\nWHERE \nORDER BY s.total DESC;",
        hints: ["WHERE status <> 'CANCELLED' inside the CTE", 'SELECT c.name, s.total … WHERE s.total > 500'],
        check: { type: 'rows', ordered: true, rows: [['Arjun Rao', 1587], ['Tara Singh', 1338]] },
        solutionCode: "WITH spend AS (\n  SELECT customer_id, SUM(total_amount) AS total\n  FROM orders\n  WHERE status <> 'CANCELLED'\n  GROUP BY customer_id\n)\nSELECT c.name, s.total\nFROM spend s\nJOIN customers c ON c.customer_id = s.customer_id\nWHERE s.total > 500\nORDER BY s.total DESC;",
        solution: ['The CTE computes spend once per customer.', 'The main query joins names and filters the total.'],
        explanation: 'Sara Khan (499) misses the threshold by ₹1 — boundaries matter.',
        mistakes: ['Filtering total > 500 inside the CTE with WHERE (aggregates need HAVING there).'],
        challenge: 'Replace the fixed 500 with "above the average customer spend" using a second CTE.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql11-k1', question: 'Which is usually safer than NOT IN when the subquery can return NULL?', options: ['NOT EXISTS', 'NOT LIKE', '<> ALL', 'EXCEPT ALL'], answer: 0, explanation: 'NOT EXISTS is unaffected by NULLs in the subquery.' },
      { id: 'sql11-k2', question: 'What does EXCEPT return?', options: ['Rows in both queries', 'Rows in the first query but not the second', 'All rows of both', 'Only duplicates'], answer: 1, explanation: 'It is set difference (MINUS in Oracle).' },
      { id: 'sql11-k3', question: 'What must two queries combined with UNION have?', options: ['The same table', 'The same number of columns with compatible types', 'A WHERE clause', 'An ORDER BY each'], answer: 1, explanation: 'Columns are matched by position.' }
    ],
    cheatSheet: ['WHERE x > (SELECT AVG(x) FROM t)', 'WHERE EXISTS (SELECT 1 FROM t2 WHERE t2.k = t1.k)', 'WITH a AS (…), b AS (…) SELECT …', 'WITH RECURSIVE …; UNION [ALL] / INTERSECT / EXCEPT'],
    references: [
      { title: 'PostgreSQL — WITH Queries (Common Table Expressions)', url: 'https://www.postgresql.org/docs/current/queries-with.html', publisher: PG },
      { title: 'PostgreSQL — Subquery Expressions', url: 'https://www.postgresql.org/docs/current/functions-subquery.html', publisher: PG },
      { title: 'PostgreSQL — Combining Queries (UNION, INTERSECT, EXCEPT)', url: 'https://www.postgresql.org/docs/current/queries-union.html', publisher: PG }
    ],
    next: 'Module 12 transforms values inside queries with functions and CASE.'
  },

  'sql-mod-12': {
    skills: ['Use string, numeric and date functions', 'Classify rows with CASE', 'Handle missing values with COALESCE'],
    prerequisites: ['SELECT and GROUP BY (Modules 06, 09)'],
    intuition: {
      analogy: 'CASE is the SQL version of if/elif/else applied to every row, like a teacher stamping "Distinction", "Pass" or "Re-sit" on each answer sheet according to the mark.',
      whyItMatters: 'Reports need human-friendly labels (salary bands, delivery-time buckets) and clean values (trimmed names, consistent dates) computed close to the data.'
    },
    workflow: {
      title: 'Evaluating a CASE expression for one row',
      nodes: [
        { id: 'row', label: 'Row value', detail: 'e.g. salary = 64000', input: 'Row', output: 'Value' },
        { id: 'w1', label: 'WHEN salary >= 80000', detail: 'First condition checked.', input: 'Value', output: 'TRUE / FALSE' },
        { id: 'w2', label: 'WHEN salary >= 60000', detail: 'Checked only if the first was not TRUE.', input: 'Value', output: 'TRUE / FALSE' },
        { id: 'else', label: 'ELSE', detail: 'Used when no WHEN matched (NULL if omitted).', input: 'No match', output: 'Default label' },
        { id: 'res', label: 'Result', detail: "'Senior' / 'Mid' / 'Junior'", input: 'First match', output: 'Label' }
      ],
      edges: [{ from: 'row', to: 'w1' }, { from: 'w1', to: 'res', label: 'TRUE' }, { from: 'w1', to: 'w2', label: 'else' }, { from: 'w2', to: 'res', label: 'TRUE' }, { from: 'w2', to: 'else', label: 'else' }, { from: 'else', to: 'res' }],
      explanation: 'Like if/elif, the first true branch wins, so order conditions from most to least specific.'
    },
    workedExample: {
      title: 'Bands and codes',
      language: 'sql',
      code: "SELECT first_name,\n       salary,\n       CASE WHEN salary >= 80000 THEN 'Senior'\n            WHEN salary >= 60000 THEN 'Mid'\n            ELSE 'Junior' END AS band,\n       UPPER(substr(last_name, 1, 3)) AS code\nFROM employees\nWHERE dept_id IN (1, 2)\nORDER BY emp_id;",
      lineByLine: [
        { line: 3, explanation: 'Searched CASE: each WHEN has its own condition.' },
        { line: 5, explanation: 'ELSE catches everything below 60000.' },
        { line: 6, explanation: 'substr takes the first 3 letters; UPPER capitalises them.' }
      ],
      expectedOutput: 'first_name | salary | band | code\nAarav | 98000 | Senior | SHA\nDiya | 87000 | Senior | RED\nKabir | 64000 | Mid | MEH\nAnanya | 58000 | Junior | IYE\nVihaan | 79000 | Mid | DAS',
      edgeCases: ['Functions on indexed columns in WHERE (UPPER(email) = …) prevent normal index use.', 'Date functions differ between databases: SQLite uses date()/julianday(), PostgreSQL uses date_trunc()/age()/EXTRACT.']
    },
    caseStudy: {
      title: 'Delivery-time buckets for operations',
      problem: 'Operations wants the share of deliveries that were on time (≤ 2 days), late (3–5) or very late (> 5).',
      data: 'shipments(order_id, shipped_on, delivered_on).',
      steps: ['Compute days = delivered_on - shipped_on (PostgreSQL date subtraction).', "CASE WHEN days <= 2 THEN 'On time' WHEN days <= 5 THEN 'Late' ELSE 'Very late' END.", 'GROUP BY the bucket and compute COUNT(*) and the percentage of the total.'],
      result: 'A three-row summary replaces a manual spreadsheet classification every week.',
      limitations: 'Undelivered shipments have NULL delivered_on; decide explicitly whether they belong in a separate "In transit" bucket.'
    },
    exercises: [
      {
        id: 'sql12-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Default for missing values',
        objective: 'Use COALESCE.',
        problem: 'What does COALESCE(NULL, NULL, \'N/A\', \'x\') return?',
        options: ['NULL', "'N/A'", "'x'", 'An error'],
        hints: ['COALESCE returns the first non-NULL argument.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['The first two arguments are NULL; the third is the first non-NULL value.'],
        explanation: 'Typical use: COALESCE(phone, \'not provided\').',
        mistakes: ['Thinking it returns the last argument.'],
        challenge: 'Show each employee\'s manager_id, or "Top level" when it is NULL.'
      },
      {
        id: 'sql12-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Count employees per band',
        objective: 'Group by a CASE expression.',
        problem: "Classify all employees as Senior (≥ 80000), Mid (≥ 60000) or Junior, then return band and the number of employees as staff, ordered by band.",
        starterCode: "SELECT CASE\n         -- your WHEN branches\n       END AS band,\n       COUNT(*) AS staff\nFROM employees\nGROUP BY band\nORDER BY band;",
        hints: ["CASE WHEN salary >= 80000 THEN 'Senior' WHEN salary >= 60000 THEN 'Mid' ELSE 'Junior' END"],
        check: { type: 'rows', ordered: true, rows: [['Junior', 2], ['Mid', 4], ['Senior', 2]] },
        solutionCode: "SELECT CASE WHEN salary >= 80000 THEN 'Senior'\n            WHEN salary >= 60000 THEN 'Mid'\n            ELSE 'Junior' END AS band,\n       COUNT(*) AS staff\nFROM employees\nGROUP BY band\nORDER BY band;",
        solution: ['Senior: Aarav, Diya. Mid: Kabir, Rohan, Meera, Vihaan. Junior: Ananya, Isha.', 'Grouping by the alias works in SQLite and PostgreSQL; standard SQL may require repeating the expression or using a subquery.'],
        explanation: 'Alphabetical order puts Junior, Mid, Senior.',
        mistakes: ['Ordering WHEN salary >= 60000 first, which labels everyone above 60000 as Mid.'],
        challenge: 'Order the bands Senior, Mid, Junior using a CASE in ORDER BY.'
      },
      {
        id: 'sql12-e3', type: 'SQL query writing', difficulty: 'Advanced', language: 'sql',
        title: 'Tenure in full years',
        objective: 'Use date functions (SQLite dialect).',
        problem: "Compute each employee's tenure in completed years as of '2026-01-01' using CAST((julianday('2026-01-01') - julianday(hire_date)) / 365.25 AS INTEGER) AS tenure. Return first_name and tenure for employees with tenure of at least 4 years, longest first, then by first_name.",
        starterCode: "SELECT first_name,\n       CAST((julianday('2026-01-01') - julianday(hire_date)) / 365.25 AS INTEGER) AS tenure\nFROM employees\nWHERE \nORDER BY tenure DESC, first_name;",
        hints: ['You cannot use the alias in WHERE portably — repeat the expression, or wrap it in a subquery.'],
        check: { type: 'rows', ordered: true, rows: [['Meera', 6], ['Kabir', 5], ['Aarav', 4], ['Rohan', 4]] },
        solutionCode: "SELECT first_name, tenure FROM (\n  SELECT first_name,\n         CAST((julianday('2026-01-01') - julianday(hire_date)) / 365.25 AS INTEGER) AS tenure\n  FROM employees\n) t\nWHERE tenure >= 4\nORDER BY tenure DESC, first_name;",
        solution: ['julianday converts a date to a day number, so the difference is in days.', 'Dividing by 365.25 approximates years; CAST to INTEGER truncates to completed years.', 'A subquery lets the outer WHERE use the alias.'],
        explanation: 'In PostgreSQL you would write EXTRACT(YEAR FROM age(DATE \'2026-01-01\', hire_date)).',
        mistakes: ['Rounding instead of truncating (Ananya would wrongly become 3).'],
        challenge: 'Count hires per year with strftime(\'%Y\', hire_date).'
      }
    ],
    knowledgeCheck: [
      { id: 'sql12-k1', question: "What does LENGTH(TRIM('  SQL  ')) return?", options: ['7', '3', '5', '0'], answer: 1, explanation: 'TRIM removes leading and trailing spaces.' },
      { id: 'sql12-k2', question: 'What does a CASE without ELSE return when nothing matches?', options: ["''", '0', 'NULL', 'An error'], answer: 2, explanation: 'Add ELSE to avoid unexpected NULLs.' },
      { id: 'sql12-k3', question: 'ROUND(2.675, 2) can return 2.67 in some systems because…', options: ['Of a bug in SQL', 'Binary floating point cannot represent 2.675 exactly', 'ROUND always rounds down', 'Two decimals are not allowed'], answer: 1, explanation: 'Use NUMERIC for exact decimal rounding.' }
    ],
    cheatSheet: ['UPPER, LOWER, TRIM, SUBSTR/SUBSTRING, REPLACE, LENGTH, ||', 'ROUND, ABS, CEIL/FLOOR (PostgreSQL), %', "CASE WHEN … THEN … ELSE … END; COALESCE; NULLIF", "SQLite: date(), strftime(), julianday() · PostgreSQL: date_trunc, EXTRACT, age"],
    references: [
      { title: 'PostgreSQL — String Functions and Operators', url: 'https://www.postgresql.org/docs/current/functions-string.html', publisher: PG },
      { title: 'PostgreSQL — Date/Time Functions and Operators', url: 'https://www.postgresql.org/docs/current/functions-datetime.html', publisher: PG },
      { title: 'SQLite — Date And Time Functions', url: 'https://www.sqlite.org/lang_datefunc.html', publisher: SQLITE }
    ],
    next: 'Module 13 packages queries as views and speeds them up with indexes.'
  },

  'sql-mod-13': {
    skills: ['Create views to simplify and secure access', 'Explain how B-tree indexes speed up lookups', 'Read a basic execution plan'],
    prerequisites: ['Joins and aggregates (Modules 09–10)'],
    intuition: {
      analogy: 'An index is the index at the back of a textbook: instead of reading every page to find "normalisation", you jump to page 212. A view is a saved question — like a bookmarked search that is re-run every time you open it.',
      whyItMatters: 'As tables grow from thousands to millions of rows, the right index turns a multi-second query into milliseconds; views give analysts a stable, simple interface to complex joins.'
    },
    workflow: {
      title: 'Lookup with and without an index',
      nodes: [
        { id: 'q', label: 'WHERE email = ?', detail: 'Query arrives at the planner.', input: 'Query', output: 'Plan choice' },
        { id: 'scan', label: 'Sequential scan', detail: 'Read every row and test the condition.', input: 'Whole table', output: 'Matching rows (O(n))' },
        { id: 'idx', label: 'B-tree index search', detail: 'Walk a balanced tree from root to leaf.', input: 'Index pages', output: 'Row pointer (O(log n))' },
        { id: 'heap', label: 'Fetch row', detail: 'Read the table page that holds the row.', input: 'Row pointer', output: 'Row' },
        { id: 'res', label: 'Result', detail: 'Same rows either way; only cost differs.', input: 'Rows', output: 'Answer' }
      ],
      edges: [{ from: 'q', to: 'scan', label: 'no useful index' }, { from: 'q', to: 'idx', label: 'index on email' }, { from: 'idx', to: 'heap' }, { from: 'scan', to: 'res' }, { from: 'heap', to: 'res' }],
      explanation: 'Indexes change performance, never results. The trade-off is extra storage and slower writes, because every INSERT/UPDATE must also update each index.'
    },
    workedExample: {
      title: 'A payroll view',
      language: 'sql',
      code: 'CREATE VIEW dept_payroll AS\nSELECT d.dept_name, COUNT(*) AS staff, SUM(e.salary) AS payroll\nFROM employees e\nJOIN departments d ON d.dept_id = e.dept_id\nGROUP BY d.dept_name;\n\nCREATE INDEX idx_employees_dept ON employees(dept_id);\n\nSELECT * FROM dept_payroll ORDER BY payroll DESC;',
      lineByLine: [
        { line: 1, explanation: 'The view stores the query, not the data; it is recomputed on each use.' },
        { line: 7, explanation: 'An index on the foreign key helps joins and filters by department.' },
        { line: 9, explanation: 'Users query the view like a table.' }
      ],
      expectedOutput: 'dept_name | staff | payroll\nEngineering | 3 | 264000\nSales | 2 | 122000\nMarketing | 2 | 116000\nFinance | 1 | 72000',
      edgeCases: ['A materialized view (PostgreSQL) stores the result and must be refreshed — fast to read, possibly stale.', 'Indexes on low-selectivity columns (e.g. a boolean) are rarely used by the planner.']
    },
    caseStudy: {
      title: 'A slow login query',
      problem: 'Login takes 3 seconds on a users table with 5 million rows.',
      data: 'SELECT * FROM users WHERE lower(email) = lower(:email).',
      steps: ['Run EXPLAIN ANALYZE: it shows a sequential scan over 5 million rows.', 'Create an expression index: CREATE INDEX ON users (lower(email));', 'Re-run EXPLAIN ANALYZE: an index scan reading a handful of pages.'],
      result: 'Login drops to a few milliseconds without changing application code.',
      limitations: 'Each extra index slows inserts slightly and uses disk; add indexes for real, measured query patterns.'
    },
    exercises: [
      {
        id: 'sql13-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which query benefits?',
        objective: 'Predict index usefulness.',
        problem: 'There is a B-tree index on orders(order_date). Which query can use it efficiently?',
        options: ["WHERE substr(order_date, 6, 2) = '06'", "WHERE order_date >= '2024-06-01' AND order_date < '2024-07-01'", "WHERE order_date LIKE '%06%'", 'WHERE order_date IS NOT NULL OR status = \'PENDING\''],
        hints: ['The column must appear "bare" on one side of a range or equality comparison.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['A range on the raw column maps to a contiguous slice of the B-tree.', 'Functions on the column or leading wildcards prevent normal index use.'],
        explanation: 'This is the SARGable idea from Module 07 applied to indexes.',
        mistakes: ['Assuming any query mentioning the column uses the index.'],
        challenge: 'In the Practice Lab, compare EXPLAIN QUERY PLAN output for options A and B after creating the index.'
      },
      {
        id: 'sql13-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'The cost of indexes',
        objective: 'Understand index trade-offs.',
        problem: 'A logging table receives 20,000 inserts per second and is queried once a day. A developer adds 8 indexes. What is the most likely effect?',
        options: ['Inserts become noticeably slower', 'Inserts become faster', 'Daily queries become slower', 'No effect'],
        hints: ['Every insert must also update each index.'],
        check: { type: 'mcq', answer: 0 },
        solution: ['Each insert now performs 8 extra index updates.', 'For write-heavy tables, keep only indexes that serve real queries.'],
        explanation: 'Indexing is a read/write trade-off.',
        mistakes: ['Treating indexes as free.'],
        challenge: 'Suggest one index that would serve the daily query instead.'
      },
      {
        id: 'sql13-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'A view for high-value orders',
        objective: 'Create and query a view.',
        problem: 'Create a view high_value_orders with order_id and total_amount for orders above 1000, then select from it ordered by order_id.',
        starterCode: 'CREATE VIEW high_value_orders AS\n  -- your SELECT\n;\n\nSELECT * FROM high_value_orders ORDER BY order_id;',
        hints: ['SELECT order_id, total_amount FROM orders WHERE total_amount > 1000'],
        check: { type: 'rows', ordered: true, rows: [[1001, 1548], [1005, 1338]] },
        solutionCode: 'CREATE VIEW high_value_orders AS\n  SELECT order_id, total_amount FROM orders WHERE total_amount > 1000;\n\nSELECT * FROM high_value_orders ORDER BY order_id;',
        solution: ['The view encapsulates the filter.', 'Orders 1001 (1548) and 1005 (1338) qualify.'],
        explanation: 'Grant analysts SELECT on the view rather than the base table to hide sensitive columns.',
        mistakes: ['Putting ORDER BY inside the view definition and relying on it — order is only guaranteed by the outer query.'],
        challenge: 'Add the customer name to the view with a join.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql13-k1', question: 'What does a regular (non-materialized) view store?', options: ['A copy of the data', 'The query definition', 'An index', 'Nothing at all'], answer: 1, explanation: 'Results are computed when the view is queried.' },
      { id: 'sql13-k2', question: 'Which command shows the actual run time of each plan step in PostgreSQL?', options: ['EXPLAIN', 'EXPLAIN ANALYZE', 'SHOW PLAN', 'DESCRIBE'], answer: 1, explanation: 'EXPLAIN ANALYZE executes the query and reports real timings.' },
      { id: 'sql13-k3', question: 'An index on (last_name, first_name) helps which filter most?', options: ['WHERE first_name = ?', 'WHERE last_name = ?', 'WHERE email = ?', 'None'], answer: 1, explanation: 'Composite indexes are used from the leftmost column.' }
    ],
    cheatSheet: ['CREATE VIEW v AS SELECT …;  DROP VIEW v;', 'CREATE INDEX idx ON t(col);  CREATE INDEX ON t (lower(email));', 'EXPLAIN [ANALYZE] query (PostgreSQL) / EXPLAIN QUERY PLAN (SQLite)', 'REFRESH MATERIALIZED VIEW mv;'],
    references: [
      { title: 'PostgreSQL — Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html', publisher: PG },
      { title: 'PostgreSQL — Using EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html', publisher: PG },
      { title: 'PostgreSQL — CREATE VIEW', url: 'https://www.postgresql.org/docs/current/sql-createview.html', publisher: PG },
      { title: 'SQLite — Query Planning', url: 'https://www.sqlite.org/queryplanner.html', publisher: SQLITE }
    ],
    next: 'Module 14 keeps data correct under concurrent use with transactions, and safe with permissions.'
  },

  'sql-mod-14': {
    skills: ['Explain ACID with a bank-transfer example', 'Use BEGIN, COMMIT, ROLLBACK and SAVEPOINT', 'Grant least-privilege access with GRANT/REVOKE'],
    prerequisites: ['DML (Module 05)'],
    intuition: {
      analogy: 'A transaction is an all-or-nothing envelope: either every instruction inside it is carried out, or none is. A transfer that debits one account but crashes before crediting the other would otherwise make money disappear.',
      whyItMatters: 'Payments, inventory and enrolments involve several related changes. Transactions and isolation levels keep them consistent when many users act at once; permissions limit damage from mistakes and attacks.'
    },
    workflow: {
      title: 'A money transfer as one transaction',
      nodes: [
        { id: 'begin', label: 'BEGIN', detail: 'Start the unit of work.', input: 'Request: move ₹300', output: 'Open transaction' },
        { id: 'debit', label: 'Debit sender', detail: 'UPDATE … balance - 300 (CHECK balance >= 0).', input: 'Sender row', output: 'Pending change' },
        { id: 'credit', label: 'Credit receiver', detail: 'UPDATE … balance + 300.', input: 'Receiver row', output: 'Pending change' },
        { id: 'commit', label: 'COMMIT', detail: 'Both changes become visible and durable together.', input: 'All steps succeeded', output: 'Consistent balances' },
        { id: 'rollback', label: 'ROLLBACK', detail: 'Any failure undoes every pending change.', input: 'Error / constraint violation', output: 'Original balances' }
      ],
      edges: [{ from: 'begin', to: 'debit' }, { from: 'debit', to: 'credit', label: 'ok' }, { from: 'credit', to: 'commit', label: 'ok' }, { from: 'debit', to: 'rollback', label: 'fails' }, { from: 'credit', to: 'rollback', label: 'fails' }],
      explanation: 'Atomicity (all or nothing), Consistency (constraints hold), Isolation (others do not see half-done work) and Durability (committed data survives crashes) together are ACID.'
    },
    workedExample: {
      title: 'Commit, savepoint and partial rollback',
      language: 'sql',
      code: "CREATE TABLE wallet (id INTEGER PRIMARY KEY, owner TEXT, balance INTEGER CHECK (balance >= 0));\nINSERT INTO wallet VALUES (1, 'Asha', 1000), (2, 'Ravi', 200);\n\nBEGIN;\nUPDATE wallet SET balance = balance - 300 WHERE id = 1;\nUPDATE wallet SET balance = balance + 300 WHERE id = 2;\nCOMMIT;\n\nBEGIN;\nSAVEPOINT before_bonus;\nUPDATE wallet SET balance = balance + 5000 WHERE id = 2;\nROLLBACK TO before_bonus;\nCOMMIT;\n\nSELECT owner, balance FROM wallet ORDER BY id;",
      lineByLine: [
        { line: 1, explanation: 'The CHECK forbids negative balances (consistency).' },
        { line: 4, explanation: 'Both updates of the transfer are inside one transaction.' },
        { line: 10, explanation: 'A savepoint marks a point you can return to without abandoning the whole transaction.' },
        { line: 12, explanation: 'The accidental bonus is undone; the transfer committed earlier is unaffected.' }
      ],
      expectedOutput: 'owner | balance\nAsha | 700\nRavi | 500',
      edgeCases: ['Long-running transactions hold locks and block other users — keep them short.', 'READ COMMITTED (PostgreSQL default) can show different results for the same query twice in one transaction; REPEATABLE READ prevents that.']
    },
    caseStudy: {
      title: 'Overselling the last seat',
      problem: 'Two learners clicked "Enrol" for the last seat in a batch at the same moment and both were accepted.',
      data: 'batches(batch_id, seats_left) and enrolments.',
      steps: ['Wrap check-and-insert in one transaction.', 'Use SELECT … FOR UPDATE on the batch row (PostgreSQL) so the second request waits.', 'Decrement seats_left with a condition: UPDATE batches SET seats_left = seats_left - 1 WHERE batch_id = :id AND seats_left > 0; check the affected row count.'],
      result: 'Only one request succeeds; the other receives "batch full" instead of a phantom seat.',
      limitations: 'Row locks reduce concurrency for very hot rows; at large scale a queue or reservation system may be needed.'
    },
    exercises: [
      {
        id: 'sql14-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which ACID property?',
        objective: 'Name ACID properties from scenarios.',
        problem: 'After a power cut, a transaction that had already returned COMMIT is still present when the server restarts. Which property is this?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        hints: ['It is about surviving crashes.'],
        check: { type: 'mcq', answer: 3 },
        solution: ['Durability: committed changes are written to stable storage (e.g. the write-ahead log) before COMMIT returns.'],
        explanation: 'Atomicity would be the guarantee that an uncommitted half-transfer is fully undone.',
        mistakes: ['Confusing durability with atomicity.'],
        challenge: 'Describe a scenario that illustrates isolation.'
      },
      {
        id: 'sql14-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Least privilege',
        objective: 'Write a GRANT statement.',
        problem: 'Write the PostgreSQL statement that allows the role analyst to read (only read) the orders table.',
        hints: ['GRANT <privilege> ON <table> TO <role>;'],
        check: { type: 'text', keywords: ['grant select', 'on orders', 'to analyst'] },
        solution: ['GRANT SELECT ON orders TO analyst;', 'Do not grant INSERT/UPDATE/DELETE to a reporting role.'],
        explanation: 'REVOKE SELECT ON orders FROM analyst; removes it again.',
        mistakes: ['GRANT ALL PRIVILEGES, which also allows changes and deletion.'],
        challenge: 'How would you hide the customers.phone column from analysts? (A view, or column-level GRANT.)'
      },
      {
        id: 'sql14-e3', type: 'SQL query writing', difficulty: 'Advanced', language: 'sql',
        title: 'Undo part of a transaction',
        objective: 'Use SAVEPOINT and ROLLBACK TO.',
        problem: "Create stock(item TEXT PRIMARY KEY, qty INTEGER) with ('pen', 50) and ('book', 10). In ONE transaction: reduce pen by 5, set a savepoint, wrongly set book to 0, roll back to the savepoint, reduce book by 2, commit. Finally select item and qty ordered by item.",
        starterCode: "CREATE TABLE stock (item TEXT PRIMARY KEY, qty INTEGER);\nINSERT INTO stock VALUES ('pen', 50), ('book', 10);\n\n-- your transaction here\n\nSELECT item, qty FROM stock ORDER BY item;",
        hints: ['BEGIN; UPDATE …; SAVEPOINT s1; UPDATE …; ROLLBACK TO s1; UPDATE …; COMMIT;'],
        check: { type: 'rows', ordered: true, rows: [['book', 8], ['pen', 45]] },
        solutionCode: "CREATE TABLE stock (item TEXT PRIMARY KEY, qty INTEGER);\nINSERT INTO stock VALUES ('pen', 50), ('book', 10);\n\nBEGIN;\nUPDATE stock SET qty = qty - 5 WHERE item = 'pen';\nSAVEPOINT s1;\nUPDATE stock SET qty = 0 WHERE item = 'book';\nROLLBACK TO s1;\nUPDATE stock SET qty = qty - 2 WHERE item = 'book';\nCOMMIT;\n\nSELECT item, qty FROM stock ORDER BY item;",
        solution: ['The pen update happened before the savepoint, so it is kept (45).', 'The wrong book update is undone; then book is reduced to 8.'],
        explanation: 'ROLLBACK TO keeps the transaction open; plain ROLLBACK would discard everything, including the pen change.',
        mistakes: ['Using ROLLBACK instead of ROLLBACK TO s1 and losing the pen update.'],
        challenge: 'Add a CHECK (qty >= 0) and see what happens when you try to reduce book by 20.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql14-k1', question: 'Which anomaly is reading another transaction\'s uncommitted change?', options: ['Dirty read', 'Phantom read', 'Lost update', 'Deadlock'], answer: 0, explanation: 'PostgreSQL never allows dirty reads, even at READ UNCOMMITTED.' },
      { id: 'sql14-k2', question: 'What is the strictest ANSI isolation level?', options: ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'READ UNCOMMITTED'], answer: 2, explanation: 'Transactions behave as if run one after another.' },
      { id: 'sql14-k3', question: 'Row-Level Security (RLS) lets you…', options: ['Encrypt a column', 'Restrict which rows each user can see', 'Speed up queries', 'Back up tables'], answer: 1, explanation: 'Policies filter rows per user or role.' }
    ],
    cheatSheet: ['BEGIN; … COMMIT; / ROLLBACK;', 'SAVEPOINT s; ROLLBACK TO s; RELEASE s;', 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;', 'GRANT SELECT ON t TO role; REVOKE …; CREATE POLICY … (RLS)'],
    references: [
      { title: 'PostgreSQL Tutorial — Transactions', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html', publisher: PG },
      { title: 'PostgreSQL — Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html', publisher: PG },
      { title: 'PostgreSQL — Privileges', url: 'https://www.postgresql.org/docs/current/ddl-priv.html', publisher: PG },
      { title: 'PostgreSQL — Row Security Policies', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html', publisher: PG }
    ],
    next: 'Module 15 uses SQL for analytics with window functions and connects it to Python and AI workflows.'
  },

  'sql-mod-15': {
    skills: ['Rank, number and compare rows with window functions', 'Compute running totals and moving averages', 'Load query results into pandas for further analysis'],
    prerequisites: ['Modules 09–11'],
    intuition: {
      analogy: 'GROUP BY folds rows into one summary per group; a window function is like holding a transparent ruler over the table — every row stays visible, and each row can also see a calculation over its neighbours (its rank, the running total so far, the previous value).',
      whyItMatters: 'Leaderboards, running revenue, month-over-month change and "top N per category" are everyday analytics questions that window functions answer in a single, efficient query.'
    },
    workflow: {
      title: 'Analytics pipeline from SQL to insight',
      nodes: [
        { id: 'src', label: 'Operational tables', detail: 'orders, customers, products', input: 'Transactions', output: 'Raw rows' },
        { id: 'win', label: 'Window query', detail: 'RANK / SUM OVER / LAG computed in the database.', input: 'Raw rows', output: 'Enriched rows' },
        { id: 'py', label: 'pandas.read_sql', detail: 'Load the result into a DataFrame.', input: 'SQL result', output: 'DataFrame' },
        { id: 'viz', label: 'Visualise / model', detail: 'Charts or ML features in Python.', input: 'DataFrame', output: 'Insight' },
        { id: 'share', label: 'Report', detail: 'Dashboard or notebook shared with stakeholders.', input: 'Insight', output: 'Decision' }
      ],
      edges: [{ from: 'src', to: 'win' }, { from: 'win', to: 'py' }, { from: 'py', to: 'viz' }, { from: 'viz', to: 'share' }],
      explanation: 'Do heavy filtering and aggregation in SQL, close to the data; bring only the summarised result into Python.'
    },
    workedExample: {
      title: 'Rank within each department',
      language: 'sql',
      code: 'SELECT first_name, dept_id, salary,\n       RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk\nFROM employees\nORDER BY dept_id, rnk;',
      lineByLine: [
        { line: 2, explanation: 'PARTITION BY restarts the ranking for each department.' },
        { line: 2, explanation: 'ORDER BY inside OVER defines who is first within the partition.' },
        { line: 4, explanation: 'Rows are not collapsed — every employee is still listed.' }
      ],
      expectedOutput: 'first_name | dept_id | salary | rnk\nAarav | 1 | 98000 | 1\nDiya | 1 | 87000 | 2\nVihaan | 1 | 79000 | 3\nKabir | 2 | 64000 | 1\nAnanya | 2 | 58000 | 2\nRohan | 3 | 61000 | 1\nIsha | 3 | 55000 | 2\nMeera | 4 | 72000 | 1',
      edgeCases: ['RANK leaves gaps after ties (1, 1, 3); DENSE_RANK does not (1, 1, 2); ROW_NUMBER always gives unique numbers.', 'Window functions cannot be used directly in WHERE; filter them in an outer query or CTE.']
    },
    caseStudy: {
      title: 'Cumulative revenue for a monthly review',
      problem: 'Leadership wants to see how revenue accumulates over the quarter and the best-selling product per category.',
      data: 'orders and order_items (sample schema).',
      steps: ['SUM(total_amount) OVER (ORDER BY order_date) for the running total of non-cancelled orders.', 'ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC) in a CTE, keeping rn = 1.', 'Load both results with pandas.read_sql_query and plot the running total as a line chart.'],
      result: 'Running revenue reaches ₹3,673 by 4 July in the sample data; the charts are regenerated by re-running one notebook.',
      limitations: 'For large warehouses, pre-aggregated tables or a columnar database keep these queries fast.'
    },
    exercises: [
      {
        id: 'sql15-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Ties in rankings',
        objective: 'Distinguish ranking functions.',
        problem: 'Scores 90, 90, 80 ordered descending. Which function returns 1, 1, 2?',
        options: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE(2)'],
        hints: ['One function leaves no gaps after a tie.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['ROW_NUMBER → 1, 2, 3.', 'RANK → 1, 1, 3.', 'DENSE_RANK → 1, 1, 2.'],
        explanation: 'Choose based on whether positions after a tie should be skipped.',
        mistakes: ['Assuming RANK never leaves gaps.'],
        challenge: 'Which function would split employees into salary quartiles? (NTILE(4))'
      },
      {
        id: 'sql15-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Running revenue',
        objective: 'Compute a cumulative sum with a window.',
        problem: "For orders that are not CANCELLED, return order_id and the running total of total_amount ordered by order_date as running, in order_date order.",
        starterCode: "SELECT order_id,\n       SUM(total_amount) OVER (  ) AS running\nFROM orders\nWHERE status <> 'CANCELLED'\nORDER BY order_date;",
        hints: ['OVER (ORDER BY order_date)'],
        check: { type: 'rows', ordered: true, rows: [[1001, 1548], [1002, 2047], [1003, 2086], [1005, 3424], [1006, 3673]] },
        solutionCode: "SELECT order_id,\n       SUM(total_amount) OVER (ORDER BY order_date) AS running\nFROM orders\nWHERE status <> 'CANCELLED'\nORDER BY order_date;",
        solution: ['1548 → +499 = 2047 → +39 = 2086 → +1338 = 3424 → +249 = 3673.', 'The WHERE runs before the window, so the cancelled order is excluded from the total.'],
        explanation: 'With ORDER BY in OVER, the default frame is from the first row up to the current row.',
        mistakes: ['Using GROUP BY, which collapses the rows instead of accumulating.'],
        challenge: 'Add a 2-order moving average with ROWS BETWEEN 1 PRECEDING AND CURRENT ROW.'
      },
      {
        id: 'sql15-e3', type: 'SQL query writing', difficulty: 'Advanced', language: 'sql',
        title: 'Top earner per department',
        objective: 'Filter on a window function using a CTE.',
        problem: 'Return first_name and dept_id of the highest-paid employee in each department, ordered by dept_id. Use ROW_NUMBER in a CTE.',
        starterCode: 'WITH ranked AS (\n  SELECT first_name, dept_id,\n         ROW_NUMBER() OVER (  ) AS rn\n  FROM employees\n)\nSELECT first_name, dept_id\nFROM ranked\nWHERE \nORDER BY dept_id;',
        hints: ['OVER (PARTITION BY dept_id ORDER BY salary DESC)', 'WHERE rn = 1'],
        check: { type: 'rows', ordered: true, rows: [['Aarav', 1], ['Kabir', 2], ['Rohan', 3], ['Meera', 4]] },
        solutionCode: 'WITH ranked AS (\n  SELECT first_name, dept_id,\n         ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn\n  FROM employees\n)\nSELECT first_name, dept_id\nFROM ranked\nWHERE rn = 1\nORDER BY dept_id;',
        solution: ['Number employees within each department by salary.', 'Keep row number 1 in the outer query (windows cannot be filtered in the same WHERE).'],
        explanation: 'Use RANK instead of ROW_NUMBER to keep all employees tied for first place.',
        mistakes: ['Putting WHERE rn = 1 inside the CTE.'],
        challenge: 'Return the top 2 per department.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql15-k1', question: 'Which function returns the previous row\'s value?', options: ['LEAD', 'LAG', 'FIRST', 'PRIOR'], answer: 1, explanation: 'LAG looks back; LEAD looks forward.' },
      { id: 'sql15-k2', question: 'In pandas, which call runs SQL and returns a DataFrame?', options: ['pd.read_csv', 'pd.read_sql_query', 'pd.sql()', 'df.query'], answer: 1, explanation: 'pd.read_sql_query(sql, connection).' },
      { id: 'sql15-k3', question: 'What does the pgvector extension add to PostgreSQL?', options: ['A vector data type and similarity search for embeddings', 'Graphics rendering', 'A NoSQL engine', 'Spreadsheet import'], answer: 0, explanation: 'It stores embeddings and supports nearest-neighbour queries used in AI search.' }
    ],
    cheatSheet: ['fn() OVER (PARTITION BY a ORDER BY b)', 'ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD', 'SUM(x) OVER (ORDER BY d ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)', 'pandas.read_sql_query(sql, conn)'],
    references: [
      { title: 'PostgreSQL Tutorial — Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', publisher: PG },
      { title: 'PostgreSQL — Window Functions reference', url: 'https://www.postgresql.org/docs/current/functions-window.html', publisher: PG },
      { title: 'SQLite — Window Functions', url: 'https://www.sqlite.org/windowfunctions.html', publisher: SQLITE },
      { title: 'pandas.read_sql_query', url: 'https://pandas.pydata.org/docs/reference/api/pandas.read_sql_query.html', publisher: 'pandas development team' }
    ],
    next: 'You have completed the SQL track. Combine it with Python (Module 15 of the Python course) or continue into data science, where these query results become model features.'
  }
};
