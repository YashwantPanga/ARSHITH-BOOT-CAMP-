// Additional learning content for SQL & Relational Databases, modules 6–10.
const PG = 'PostgreSQL Global Development Group';
const SQLITE = 'SQLite Consortium';

export default {
  'sql-mod-6': {
    skills: ['Explain the logical evaluation order of a SELECT', 'Project, compute and alias columns', 'Protect calculations from division by zero'],
    prerequisites: ['Modules 01–05'],
    intuition: {
      analogy: 'Although you write SELECT first, the database reads a query like a recipe in a different order: first fetch the ingredients (FROM), throw away what you do not need (WHERE), group them (GROUP BY), and only then plate the dish (SELECT) and arrange it (ORDER BY).',
      whyItMatters: 'Knowing the logical order explains common errors, such as why a column alias defined in SELECT cannot be used in WHERE but can be used in ORDER BY.'
    },
    workflow: {
      title: 'Logical query processing order',
      nodes: [
        { id: 'from', label: '1. FROM / JOIN', detail: 'Build the working set of rows.', input: 'Tables', output: 'Combined rows' },
        { id: 'where', label: '2. WHERE', detail: 'Keep rows that satisfy the condition.', input: 'Rows', output: 'Filtered rows' },
        { id: 'group', label: '3. GROUP BY', detail: 'Collapse rows into groups.', input: 'Filtered rows', output: 'Groups' },
        { id: 'having', label: '4. HAVING', detail: 'Keep groups that satisfy a condition.', input: 'Groups', output: 'Filtered groups' },
        { id: 'select', label: '5. SELECT', detail: 'Compute expressions and aliases.', input: 'Rows/groups', output: 'Projected columns' },
        { id: 'order', label: '6. ORDER BY / LIMIT', detail: 'Sort and cut the result.', input: 'Projected rows', output: 'Final result' }
      ],
      edges: [{ from: 'from', to: 'where' }, { from: 'where', to: 'group' }, { from: 'group', to: 'having' }, { from: 'having', to: 'select' }, { from: 'select', to: 'order' }],
      explanation: 'Each stage only sees the output of the previous one. An alias is created at stage 5, so stage 2 (WHERE) cannot reference it, while stage 6 (ORDER BY) can.'
    },
    workedExample: {
      title: 'Computed columns and aliases',
      language: 'sql',
      code: "SELECT first_name || ' ' || last_name AS full_name,\n       salary / 1000 AS salary_k\nFROM employees\nWHERE dept_id = 1\nORDER BY salary_k DESC;",
      lineByLine: [
        { line: 1, explanation: '|| concatenates strings (standard SQL; MySQL uses CONCAT).' },
        { line: 2, explanation: 'Arithmetic on columns creates a computed column named salary_k.' },
        { line: 4, explanation: 'WHERE uses the original column dept_id.' },
        { line: 5, explanation: 'ORDER BY may use the alias because it is evaluated after SELECT.' }
      ],
      expectedOutput: 'full_name | salary_k\nAarav Sharma | 98\nDiya Reddy | 87\nVihaan Das | 79',
      edgeCases: ['SELECT * in application code breaks when columns are added or reordered; list columns explicitly.', 'x / 0 raises an error in PostgreSQL; NULLIF(divisor, 0) turns it into NULL instead.']
    },
    caseStudy: {
      title: 'An order summary screen',
      problem: 'A customer support screen shows each order line with its share of the order total, and it crashed when a test order had a total of 0.',
      data: 'order_items with quantity and unit_price; orders with total_amount.',
      steps: ['Compute quantity * unit_price AS line_total.', 'Compute 100.0 * line_total / NULLIF(total_amount, 0) AS pct to avoid division by zero.', 'Round for display only, in the final SELECT.'],
      result: 'The screen shows percentages for real orders and an empty value (NULL) for zero-total orders instead of an error.',
      limitations: 'NULL must then be displayed sensibly by the application (e.g. "—").'
    },
    exercises: [
      {
        id: 'sql6-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Why does the alias fail?',
        objective: 'Apply the logical processing order.',
        problem: 'SELECT salary * 12 AS annual FROM employees WHERE annual > 900000; fails in PostgreSQL. Why?',
        options: ['annual is a reserved word', 'WHERE is evaluated before SELECT, so the alias does not exist yet', 'You cannot multiply in SELECT', 'Aliases need double quotes'],
        hints: ['Look at the order diagram: where is WHERE relative to SELECT?'],
        check: { type: 'mcq', answer: 1 },
        solution: ['WHERE runs at step 2; aliases are created at step 5.', 'Repeat the expression (WHERE salary * 12 > 900000) or use a subquery/CTE.'],
        explanation: 'SQLite is lenient here, but standard SQL and PostgreSQL reject it — write portable SQL.',
        mistakes: ['Assuming SQL is evaluated top to bottom as written.'],
        challenge: 'Rewrite the query with a CTE so the alias can be filtered.'
      },
      {
        id: 'sql6-e2', type: 'SQL query writing', difficulty: 'Beginner', language: 'sql',
        title: 'Customer signup years',
        objective: 'Use a string function in a computed column.',
        problem: 'Return each customer\'s name and the year they signed up (first 4 characters of signup_date) as signup_year, ordered by customer_id.',
        starterCode: 'SELECT name, \nFROM customers\nORDER BY customer_id;',
        hints: ['substr(signup_date, 1, 4) AS signup_year (PostgreSQL also has EXTRACT(YEAR FROM date)).'],
        check: { type: 'rows', ordered: true, rows: [['Arjun Rao', '2023'], ['Sara Khan', '2023'], ['Neel Joshi', '2023'], ['Tara Singh', '2024'], ['Zoya Ali', '2024']] },
        solutionCode: 'SELECT name, substr(signup_date, 1, 4) AS signup_year\nFROM customers\nORDER BY customer_id;',
        solution: ['Dates are stored as ISO text (YYYY-MM-DD) in the sample DB, so the first four characters are the year.'],
        explanation: 'ISO date strings sort and slice predictably; that is why ISO 8601 is the recommended text format.',
        mistakes: ['Using substr(signup_date, 0, 4), which returns only 3 characters in SQLite.'],
        challenge: 'Count customers per signup year.'
      },
      {
        id: 'sql6-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Share of an order',
        objective: 'Compute percentages safely.',
        problem: 'For order 1001, return product_id and each line\'s percentage of the order total (total_amount = 1548), rounded to 1 decimal, as pct. Order by product_id. Join order_items to orders and use NULLIF for safety.',
        starterCode: 'SELECT oi.product_id,\n       \nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nWHERE oi.order_id = 1001\nORDER BY oi.product_id;',
        hints: ['ROUND(100.0 * oi.quantity * oi.unit_price / NULLIF(o.total_amount, 0), 1) AS pct'],
        check: { type: 'rows', ordered: true, rows: [[1, 83.9], [2, 16.1]] },
        solutionCode: 'SELECT oi.product_id,\n       ROUND(100.0 * oi.quantity * oi.unit_price / NULLIF(o.total_amount, 0), 1) AS pct\nFROM order_items oi\nJOIN orders o ON o.order_id = oi.order_id\nWHERE oi.order_id = 1001\nORDER BY oi.product_id;',
        solution: ['1299 / 1548 = 83.9 %; 249 / 1548 = 16.1 %.', 'Multiplying by 100.0 first forces decimal arithmetic.'],
        explanation: 'NULLIF(x, 0) returns NULL when x is 0, so the division yields NULL instead of an error.',
        mistakes: ['Writing 100 * … / total with integer columns and losing decimals.'],
        challenge: 'Show the percentages for every order in one query.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql6-k1', question: 'Which clause is evaluated last (before LIMIT)?', options: ['WHERE', 'SELECT', 'ORDER BY', 'FROM'], answer: 2, explanation: 'ORDER BY sorts the projected result.' },
      { id: 'sql6-k2', question: 'What does NULLIF(a, b) return when a = b?', options: ['a', 'b', 'NULL', '0'], answer: 2, explanation: 'Otherwise it returns a.' },
      { id: 'sql6-k3', question: 'Why avoid SELECT * in production code?', options: ['It is invalid SQL', 'It returns unnecessary data and breaks when columns change', 'It is always slower than a JOIN', 'It locks the table'], answer: 1, explanation: 'Explicit columns make the contract with the application clear.' }
    ],
    cheatSheet: ['FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT', "expr AS alias; a || ' ' || b", 'NULLIF(divisor, 0); COALESCE(x, default)'],
    references: [
      { title: 'PostgreSQL — SELECT', url: 'https://www.postgresql.org/docs/current/sql-select.html', publisher: PG },
      { title: 'PostgreSQL — Select Lists', url: 'https://www.postgresql.org/docs/current/queries-select-lists.html', publisher: PG },
      { title: 'PostgreSQL — Conditional Expressions (NULLIF, COALESCE)', url: 'https://www.postgresql.org/docs/current/functions-conditional.html', publisher: PG }
    ],
    next: 'Module 07 goes deep into WHERE: operators, NULL logic and index-friendly filters.'
  },

  'sql-mod-7': {
    skills: ['Combine AND/OR/NOT with correct parentheses', 'Handle NULL with IS NULL and three-valued logic', 'Write index-friendly (SARGable) filters'],
    prerequisites: ['SELECT basics (Module 06)'],
    intuition: {
      analogy: 'NULL means "unknown", not "zero" or "empty". Asking "is an unknown salary greater than 50,000?" has no yes/no answer — it is also unknown. SQL therefore has three truth values: TRUE, FALSE and UNKNOWN, and WHERE keeps only TRUE.',
      whyItMatters: 'Filters decide which rows reach reports and dashboards. A misplaced OR or a NULL in a NOT IN list can silently change business numbers.'
    },
    workflow: {
      title: 'How WHERE decides whether a row is kept',
      nodes: [
        { id: 'row', label: 'Row', detail: 'One candidate row from FROM.', input: 'Row', output: 'Values' },
        { id: 'eval', label: 'Evaluate condition', detail: 'Comparisons with NULL produce UNKNOWN.', input: 'Values', output: 'TRUE / FALSE / UNKNOWN' },
        { id: 'keep', label: 'Keep', detail: 'Only TRUE rows continue.', input: 'TRUE', output: 'Row in result' },
        { id: 'drop', label: 'Discard', detail: 'FALSE and UNKNOWN rows are removed.', input: 'FALSE / UNKNOWN', output: 'Row filtered out' }
      ],
      edges: [{ from: 'row', to: 'eval' }, { from: 'eval', to: 'keep', label: 'TRUE' }, { from: 'eval', to: 'drop', label: 'FALSE / UNKNOWN' }],
      explanation: 'This is why WHERE manager_id <> 101 does not return rows whose manager_id is NULL: the comparison is UNKNOWN, not TRUE.'
    },
    workedExample: {
      title: 'The NOT IN … NULL trap',
      language: 'sql',
      code: 'SELECT\n  (SELECT COUNT(*) FROM employees WHERE manager_id NOT IN (101)) AS without_null,\n  (SELECT COUNT(*) FROM employees WHERE manager_id NOT IN (101, NULL)) AS with_null,\n  (SELECT COUNT(*) FROM employees WHERE manager_id IS NULL) AS no_manager;',
      lineByLine: [
        { line: 2, explanation: 'Employees managed by 103 and 105 qualify (2). Rows with NULL manager are UNKNOWN and dropped.' },
        { line: 3, explanation: 'x NOT IN (101, NULL) means x <> 101 AND x <> NULL; the second part is always UNKNOWN, so no row is ever TRUE.' },
        { line: 4, explanation: 'IS NULL is the correct test for missing values: 4 top-level employees.' }
      ],
      expectedOutput: 'without_null | with_null | no_manager\n2 | 0 | 4',
      edgeCases: ['Prefer NOT EXISTS over NOT IN with subqueries that may return NULL.', 'WHERE lower(email) = … cannot use a plain index on email; create an expression index or store normalised values.']
    },
    caseStudy: {
      title: 'A marketing list that was too short',
      problem: 'A campaign query "customers NOT IN (SELECT customer_id FROM unsubscribes)" returned zero customers.',
      data: 'The unsubscribes table had one row with a NULL customer_id from a broken import.',
      steps: ['Reproduce with SELECT COUNT(*) … NOT IN (…).', 'Find SELECT * FROM unsubscribes WHERE customer_id IS NULL.', 'Rewrite with NOT EXISTS, which ignores NULLs correctly.', 'Add NOT NULL to unsubscribes.customer_id.'],
      result: 'The campaign list returned the expected 18,400 customers and the bad row could no longer be inserted.',
      limitations: 'The fix depended on understanding three-valued logic; tests with NULL data would have caught it earlier.'
    },
    exercises: [
      {
        id: 'sql7-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'AND before OR',
        objective: 'Apply logical operator precedence.',
        problem: "WHERE dept_id = 1 OR dept_id = 3 AND salary > 60000 is read by SQL as…",
        options: ['(dept_id = 1 OR dept_id = 3) AND salary > 60000', 'dept_id = 1 OR (dept_id = 3 AND salary > 60000)', 'An error', 'dept_id IN (1, 3, 60000)'],
        hints: ['AND binds more tightly than OR, just as × binds more tightly than +.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['AND is evaluated first, so the salary condition only applies to department 3.', 'Add parentheses to express the other meaning.'],
        explanation: 'Always parenthesise mixed AND/OR conditions for readability.',
        mistakes: ['Assuming left-to-right evaluation.'],
        challenge: 'Run both versions in the Practice Lab and compare the row counts.'
      },
      {
        id: 'sql7-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Well-paid in Engineering or Marketing',
        objective: 'Combine IN with AND correctly.',
        problem: 'Return the first_name of employees in departments 1 or 3 who earn more than 60000, highest salary first.',
        starterCode: 'SELECT first_name\nFROM employees\nWHERE \nORDER BY salary DESC;',
        hints: ['dept_id IN (1, 3) AND salary > 60000'],
        check: { type: 'rows', ordered: true, rows: [['Aarav'], ['Diya'], ['Vihaan'], ['Rohan']] },
        solutionCode: 'SELECT first_name\nFROM employees\nWHERE dept_id IN (1, 3) AND salary > 60000\nORDER BY salary DESC;',
        solution: ['IN (1, 3) replaces the OR and avoids the precedence trap.', 'Isha (55000) is excluded by the salary condition.'],
        explanation: 'IN is shorthand for several equality tests joined with OR.',
        mistakes: ['Writing dept_id = 1 OR dept_id = 3 AND salary > 60000 (keeps all of dept 1 regardless of salary — same result here only by coincidence).'],
        challenge: 'Add employees hired after 2022 from any department using OR with correct parentheses.'
      },
      {
        id: 'sql7-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'June orders still active',
        objective: 'Use BETWEEN and <> on dates and text.',
        problem: 'Return order_id and status for orders placed in June 2024 that are not CANCELLED, ordered by order_id.',
        starterCode: 'SELECT order_id, status\nFROM orders\nWHERE \nORDER BY order_id;',
        hints: ["order_date BETWEEN '2024-06-01' AND '2024-06-30'", "status <> 'CANCELLED'"],
        check: { type: 'rows', ordered: true, rows: [[1001, 'DELIVERED'], [1002, 'SHIPPED'], [1003, 'DELIVERED']] },
        solutionCode: "SELECT order_id, status\nFROM orders\nWHERE order_date BETWEEN '2024-06-01' AND '2024-06-30'\n  AND status <> 'CANCELLED'\nORDER BY order_id;",
        solution: ['BETWEEN is inclusive at both ends.', 'Order 1004 is in June but cancelled.'],
        explanation: 'For timestamp columns, use >= start AND < next_day instead of BETWEEN to include the whole last day.',
        mistakes: ["Using LIKE '2024-06%' on a real DATE column in PostgreSQL (works on text only and is not index-friendly)."],
        challenge: 'Find customers whose name contains "a" case-insensitively.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql7-k1', question: 'What is the result of NULL = NULL in a WHERE clause?', options: ['TRUE', 'FALSE', 'UNKNOWN', 'Error'], answer: 2, explanation: 'Use IS NULL, or IS NOT DISTINCT FROM in PostgreSQL.' },
      { id: 'sql7-k2', question: "Which pattern matches names starting with 'A'?", options: ["LIKE '%A'", "LIKE 'A%'", "LIKE '_A'", "= 'A*'"], answer: 1, explanation: '% matches any number of characters; _ matches exactly one.' },
      { id: 'sql7-k3', question: 'Which filter can use an index on hire_date?', options: ["WHERE substr(hire_date,1,4) = '2024'", "WHERE hire_date >= '2024-01-01' AND hire_date < '2025-01-01'", 'WHERE hire_date + 0 > 0', "WHERE CAST(hire_date AS TEXT) LIKE '%2024%'"], answer: 1, explanation: 'Leaving the column bare (SARGable) lets the planner use the index.' }
    ],
    cheatSheet: ['= <> < > <= >=, BETWEEN a AND b (inclusive)', 'IN (…), LIKE / ILIKE, IS NULL / IS NOT NULL', 'NOT EXISTS instead of NOT IN with nullable subqueries', 'Parenthesise mixed AND/OR'],
    references: [
      { title: 'PostgreSQL — Comparison Functions and Operators', url: 'https://www.postgresql.org/docs/current/functions-comparison.html', publisher: PG },
      { title: 'PostgreSQL — Pattern Matching (LIKE)', url: 'https://www.postgresql.org/docs/current/functions-matching.html', publisher: PG },
      { title: 'PostgreSQL — Logical Operators', url: 'https://www.postgresql.org/docs/current/functions-logical.html', publisher: PG }
    ],
    next: 'Module 08 removes duplicates, sorts and paginates the filtered rows.'
  },

  'sql-mod-8': {
    skills: ['Remove duplicates with DISTINCT', 'Sort by several keys, deterministically', 'Paginate with LIMIT/OFFSET and keyset pagination'],
    prerequisites: ['Filtering (Module 07)'],
    intuition: {
      analogy: 'OFFSET pagination is like reading page 500 of a book by counting every page from the start. Keyset pagination is like using a bookmark: "continue after the last row I saw".',
      whyItMatters: 'Every list screen — products, orders, search results — sorts and pages data. Non-deterministic ordering causes items to appear twice or disappear between pages.'
    },
    workflow: {
      title: 'Offset vs keyset pagination',
      nodes: [
        { id: 'req', label: 'Request page N', detail: 'User clicks "next".', input: 'Page number or last key', output: 'Query parameters' },
        { id: 'off', label: 'OFFSET (N-1)*size', detail: 'Database reads and discards all earlier rows.', input: 'Page number', output: 'Slower for deep pages' },
        { id: 'key', label: 'WHERE key < last_key', detail: 'Index jumps straight to the next rows.', input: 'Last seen key', output: 'Constant-time pages' },
        { id: 'order', label: 'ORDER BY key DESC, id', detail: 'A unique tie-breaker makes order deterministic.', input: 'Candidate rows', output: 'Stable order' },
        { id: 'limit', label: 'LIMIT size', detail: 'Return one page.', input: 'Ordered rows', output: 'Page of results' }
      ],
      edges: [{ from: 'req', to: 'off', label: 'offset style' }, { from: 'req', to: 'key', label: 'keyset style' }, { from: 'off', to: 'order' }, { from: 'key', to: 'order' }, { from: 'order', to: 'limit' }],
      explanation: 'Both styles need a deterministic ORDER BY. Keyset pagination scales better and does not skip rows when new data is inserted.'
    },
    workedExample: {
      title: 'DISTINCT and a page of results',
      language: 'sql',
      code: 'SELECT DISTINCT category FROM products ORDER BY category;\n\nSELECT name, price\nFROM products\nORDER BY price DESC, product_id\nLIMIT 2 OFFSET 2;',
      lineByLine: [
        { line: 1, explanation: 'DISTINCT removes duplicate category values.' },
        { line: 5, explanation: 'product_id breaks ties so the order is always the same.' },
        { line: 6, explanation: 'Skip the 2 most expensive products and return the next 2 (page 2 with size 2).' }
      ],
      expectedOutput: 'category\nBooks\nElectronics\nFurniture\n\nname | price\nErgo Chair | 329\nNoise-Cancel Headphones | 249',
      edgeCases: ['Without ORDER BY, LIMIT returns an arbitrary subset that can change between runs.', 'NULLs sort last in ascending order in PostgreSQL and first in SQLite — use NULLS FIRST/LAST to be explicit.']
    },
    caseStudy: {
      title: 'An infinite-scroll product feed',
      problem: 'A shopping app used OFFSET pagination; at page 400 queries took seconds and users saw duplicates when new products were added.',
      data: '2 million products sorted by popularity.',
      steps: ['Add an index on (popularity DESC, product_id).', 'Return the last (popularity, product_id) with each page.', 'Request the next page with WHERE (popularity, product_id) < (:p, :id) ORDER BY popularity DESC, product_id DESC LIMIT 20.'],
      result: 'Every page loads in milliseconds regardless of depth, and inserts no longer shift items between pages.',
      limitations: 'Keyset pagination cannot jump directly to "page 400"; it suits next/previous navigation.'
    },
    exercises: [
      {
        id: 'sql8-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Distinct cities',
        objective: 'Predict DISTINCT results.',
        problem: 'How many rows does SELECT DISTINCT city FROM customers; return for the sample data?',
        hints: ['Cities: Hyderabad, Mumbai, Pune, Delhi, Hyderabad.'],
        check: { type: 'numeric', answer: 4, tolerance: 0 },
        solution: ['Hyderabad appears twice; DISTINCT keeps one.', 'Result: Hyderabad, Mumbai, Pune, Delhi → 4 rows.'],
        explanation: 'DISTINCT applies to the whole selected row, not a single column, when several columns are selected.',
        mistakes: ['Counting 5 rows.'],
        challenge: 'Use COUNT(DISTINCT city) to get the same answer in one value.'
      },
      {
        id: 'sql8-e2', type: 'SQL query writing', difficulty: 'Beginner', language: 'sql',
        title: 'Top three earners',
        objective: 'Use ORDER BY with LIMIT.',
        problem: 'Return first_name and salary of the three highest-paid employees, highest first.',
        starterCode: 'SELECT first_name, salary\nFROM employees\n\n;',
        hints: ['ORDER BY salary DESC LIMIT 3'],
        check: { type: 'rows', ordered: true, rows: [['Aarav', 98000], ['Diya', 87000], ['Vihaan', 79000]] },
        solutionCode: 'SELECT first_name, salary\nFROM employees\nORDER BY salary DESC, emp_id\nLIMIT 3;',
        solution: ['Sort descending, then keep the first three rows.', 'Adding emp_id as a tie-breaker keeps results deterministic.'],
        explanation: 'SQL Server uses TOP 3; standard SQL also offers FETCH FIRST 3 ROWS ONLY.',
        mistakes: ['Forgetting DESC and getting the three lowest.'],
        challenge: 'Return the second-highest salary only.'
      },
      {
        id: 'sql8-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Keyset next page',
        objective: 'Write a keyset-pagination query.',
        problem: 'The previous page of products (sorted by price DESC) ended at price 329. Return the next 2 products (name, price) using keyset pagination.',
        starterCode: 'SELECT name, price\nFROM products\nWHERE \nORDER BY price DESC\nLIMIT 2;',
        hints: ['Continue with prices strictly lower than the last one seen: WHERE price < 329.'],
        check: { type: 'rows', ordered: true, rows: [['Noise-Cancel Headphones', 249], ['Python Crash Course', 39]] },
        solutionCode: 'SELECT name, price\nFROM products\nWHERE price < 329\nORDER BY price DESC\nLIMIT 2;',
        solution: ['The filter starts after the last seen key.', 'ORDER BY and LIMIT return the next page.'],
        explanation: 'If prices can tie, include the id: WHERE (price, product_id) < (329, 4).',
        mistakes: ['Using <= 329, which repeats the last row of the previous page.'],
        challenge: 'Rewrite it with a tie-breaker on product_id using row-value comparison.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql8-k1', question: 'Which clause guarantees the order of results?', options: ['DISTINCT', 'LIMIT', 'ORDER BY', 'GROUP BY'], answer: 2, explanation: 'Only ORDER BY defines order.' },
      { id: 'sql8-k2', question: 'What does LIMIT 10 OFFSET 20 return?', options: ['Rows 10–20', 'Rows 21–30', 'Rows 20–30', 'Rows 1–10'], answer: 1, explanation: 'Skip 20 rows, then return 10.' },
      { id: 'sql8-k3', question: 'Why add a unique column to ORDER BY?', options: ['Speed', 'To make ordering deterministic when values tie', 'It is required syntax', 'To remove duplicates'], answer: 1, explanation: 'Ties otherwise come back in arbitrary order.' }
    ],
    cheatSheet: ['SELECT DISTINCT cols …', 'ORDER BY a DESC, id ASC NULLS LAST', 'LIMIT n OFFSET m', 'Keyset: WHERE (k, id) < (:k, :id) ORDER BY k DESC, id DESC LIMIT n'],
    references: [
      { title: 'PostgreSQL — Sorting Rows (ORDER BY)', url: 'https://www.postgresql.org/docs/current/queries-order.html', publisher: PG },
      { title: 'PostgreSQL — LIMIT and OFFSET', url: 'https://www.postgresql.org/docs/current/queries-limit.html', publisher: PG }
    ],
    next: 'Module 09 summarises many rows into totals and averages with aggregates and GROUP BY.'
  },

  'sql-mod-9': {
    skills: ['Use COUNT, SUM, AVG, MIN and MAX correctly with NULLs', 'Group rows and filter groups with HAVING', 'Explain the "every selected column must be grouped or aggregated" rule'],
    prerequisites: ['Modules 06–08'],
    intuition: {
      analogy: 'GROUP BY is like sorting exam papers into piles by class, then writing one summary card per pile: number of papers, average mark, highest mark. HAVING throws away cards for piles that are too small.',
      whyItMatters: 'Nearly every report — revenue per month, students per course, average delivery time per city — is an aggregate query.'
    },
    workflow: {
      title: 'From rows to group summaries',
      nodes: [
        { id: 'rows', label: 'Filtered rows', detail: 'After WHERE.', input: 'Table rows', output: 'Rows to summarise' },
        { id: 'group', label: 'GROUP BY dept_id', detail: 'Rows with the same key form one group.', input: 'Rows', output: 'Groups' },
        { id: 'agg', label: 'Aggregate per group', detail: 'COUNT(*), AVG(salary), MAX(salary)…', input: 'Groups', output: 'One row per group' },
        { id: 'having', label: 'HAVING COUNT(*) >= 2', detail: 'Filter on aggregated values.', input: 'Group rows', output: 'Qualifying groups' },
        { id: 'out', label: 'Report', detail: 'Sorted summary.', input: 'Qualifying groups', output: 'Final table' }
      ],
      edges: [{ from: 'rows', to: 'group' }, { from: 'group', to: 'agg' }, { from: 'agg', to: 'having' }, { from: 'having', to: 'out' }],
      explanation: 'WHERE filters individual rows before grouping; HAVING filters whole groups after aggregation.'
    },
    workedExample: {
      title: 'Headcount and top salary per department',
      language: 'sql',
      code: 'SELECT dept_id,\n       COUNT(*)    AS headcount,\n       MAX(salary) AS top\nFROM employees\nGROUP BY dept_id\nHAVING COUNT(*) >= 2\nORDER BY dept_id;',
      lineByLine: [
        { line: 1, explanation: 'dept_id is selected and appears in GROUP BY, so it is allowed.' },
        { line: 2, explanation: 'COUNT(*) counts rows in each group.' },
        { line: 5, explanation: 'One output row per department.' },
        { line: 6, explanation: 'Finance (dept 4) has one employee and is removed.' }
      ],
      expectedOutput: 'dept_id | headcount | top\n1 | 3 | 98000\n2 | 2 | 64000\n3 | 2 | 61000',
      edgeCases: ['COUNT(column) ignores NULLs, COUNT(*) does not: COUNT(manager_id) is 4 while COUNT(*) is 8.', 'AVG ignores NULLs too, which can raise the average unexpectedly — use COALESCE if missing should mean 0.']
    },
    caseStudy: {
      title: 'Monthly revenue dashboard',
      problem: 'Management wants revenue per month and per status, excluding cancelled orders, with months below ₹1,000 highlighted.',
      data: 'orders(order_id, order_date, status, total_amount).',
      steps: ["Filter out cancelled orders in WHERE.", "Group by substr(order_date, 1, 7) (or date_trunc('month', …) in PostgreSQL).", 'Compute SUM(total_amount) and COUNT(*).', 'Use HAVING SUM(total_amount) < 1000 in a second query for the alert list.'],
      result: 'June 2024: ₹2,086 from 3 orders; July 2024: ₹1,587 from 2 orders (sample data).',
      limitations: 'Revenue recognition rules (refunds, partial shipments) may require more than a simple SUM.'
    },
    exercises: [
      {
        id: 'sql9-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'WHERE or HAVING?',
        objective: 'Place conditions in the right clause.',
        problem: 'You want departments whose average salary is above 70000. Where does AVG(salary) > 70000 go?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'SELECT'],
        hints: ['The condition uses an aggregate.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Aggregates are not available in WHERE because WHERE runs before grouping.', 'HAVING filters groups after aggregation.'],
        explanation: 'Conditions on raw columns belong in WHERE (cheaper); conditions on aggregates belong in HAVING.',
        mistakes: ['Putting a non-aggregate filter in HAVING, which works but processes more rows than needed.'],
        challenge: 'Write the full query and run it.'
      },
      {
        id: 'sql9-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Average salary',
        objective: 'Compute an aggregate by hand.',
        problem: 'What does SELECT AVG(salary) FROM employees; return for the sample data?',
        hints: ['Salaries: 98000, 87000, 64000, 58000, 61000, 72000, 79000, 55000.'],
        check: { type: 'numeric', answer: 71750, tolerance: 0.5 },
        solution: ['Sum = 574000.', '574000 / 8 = 71750.'],
        explanation: 'AVG = SUM / COUNT of non-NULL values.',
        mistakes: ['Dividing by 4 departments instead of 8 employees.'],
        challenge: 'Compute the average per department and confirm Engineering is 88000.'
      },
      {
        id: 'sql9-e3', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Revenue by status',
        objective: 'Combine WHERE, GROUP BY and ORDER BY on an aggregate.',
        problem: 'Return status and total revenue (SUM of total_amount) as revenue for all orders except CANCELLED, highest revenue first.',
        starterCode: 'SELECT status, \nFROM orders\nWHERE \nGROUP BY status\nORDER BY revenue DESC;',
        hints: ['SUM(total_amount) AS revenue', "WHERE status <> 'CANCELLED'"],
        check: { type: 'rows', ordered: true, rows: [['DELIVERED', 1836], ['PENDING', 1338], ['SHIPPED', 499]] },
        solutionCode: "SELECT status, SUM(total_amount) AS revenue\nFROM orders\nWHERE status <> 'CANCELLED'\nGROUP BY status\nORDER BY revenue DESC;",
        solution: ['DELIVERED = 1548 + 39 + 249 = 1836.', 'PENDING = 1338; SHIPPED = 499.'],
        explanation: 'Removing cancelled orders in WHERE is cheaper than filtering the group afterwards.',
        mistakes: ['Selecting order_id too, which is neither grouped nor aggregated.'],
        challenge: 'Add the number of orders per status.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql9-k1', question: 'What does COUNT(manager_id) return for the sample employees?', options: ['8', '4', '0', 'NULL'], answer: 1, explanation: 'Four employees have a manager; NULLs are not counted.' },
      { id: 'sql9-k2', question: 'Which extension adds subtotal and grand-total rows?', options: ['WINDOW', 'ROLLUP', 'PIVOT', 'UNION'], answer: 1, explanation: 'GROUP BY ROLLUP(a, b) adds subtotals per a and a grand total.' },
      { id: 'sql9-k3', question: 'Is this valid in standard SQL: SELECT dept_id, first_name, COUNT(*) FROM employees GROUP BY dept_id?', options: ['Yes', 'No — first_name is not grouped or aggregated', 'Only with HAVING', 'Only in PostgreSQL'], answer: 1, explanation: 'Every selected column must be grouped or aggregated.' }
    ],
    cheatSheet: ['COUNT(*) vs COUNT(col), SUM, AVG, MIN, MAX', 'GROUP BY cols HAVING agg_condition', 'COUNT(DISTINCT col)', 'GROUP BY ROLLUP / CUBE / GROUPING SETS (PostgreSQL)'],
    references: [
      { title: 'PostgreSQL — Aggregate Functions (tutorial)', url: 'https://www.postgresql.org/docs/current/tutorial-agg.html', publisher: PG },
      { title: 'PostgreSQL — GROUP BY and HAVING Clauses', url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP', publisher: PG },
      { title: 'PostgreSQL — Aggregate Functions reference', url: 'https://www.postgresql.org/docs/current/functions-aggregate.html', publisher: PG }
    ],
    next: 'Module 10 combines several tables with joins before aggregating.'
  },

  'sql-mod-10': {
    skills: ['Choose INNER, LEFT, RIGHT, FULL and self joins', 'Join three tables to answer a business question', 'Spot duplicate-multiplying joins'],
    prerequisites: ['Aggregates (Module 09)', 'Keys (Module 04)'],
    intuition: {
      analogy: 'A join is matching two guest lists by ID card number. INNER JOIN keeps only people on both lists; LEFT JOIN keeps everyone on the first list and leaves blanks where the second list has no match.',
      whyItMatters: 'Normalised databases split information across tables to avoid duplication. Joins put it back together for every report and screen.'
    },
    workflow: {
      title: 'Join types at a glance',
      nodes: [
        { id: 'a', label: 'Left table (A)', detail: 'e.g. employees', input: 'Rows of A', output: 'Join input' },
        { id: 'b', label: 'Right table (B)', detail: 'e.g. departments or employees (self join)', input: 'Rows of B', output: 'Join input' },
        { id: 'cond', label: 'ON condition', detail: 'Usually foreign key = primary key.', input: 'Pairs of rows', output: 'Matches' },
        { id: 'inner', label: 'INNER JOIN', detail: 'Only matching pairs.', input: 'Matches', output: 'Intersection' },
        { id: 'left', label: 'LEFT JOIN', detail: 'All of A; NULLs where B has no match.', input: 'Matches + unmatched A', output: 'A preserved' },
        { id: 'full', label: 'FULL JOIN', detail: 'All of A and B; NULLs on either side.', input: 'Everything', output: 'Union of both' }
      ],
      edges: [{ from: 'a', to: 'cond' }, { from: 'b', to: 'cond' }, { from: 'cond', to: 'inner' }, { from: 'cond', to: 'left' }, { from: 'cond', to: 'full' }],
      explanation: 'The ON condition decides which rows pair up; the join type decides what happens to rows without a partner.'
    },
    workedExample: {
      title: 'Self join: employees and their managers',
      language: 'sql',
      code: 'SELECT e.first_name AS employee,\n       m.first_name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.emp_id = e.manager_id\nORDER BY e.emp_id;',
      lineByLine: [
        { line: 3, explanation: 'The same table is used twice with different aliases.' },
        { line: 4, explanation: 'LEFT JOIN keeps employees who have no manager (manager_id is NULL).' },
        { line: 1, explanation: 'Aliases make the two first_name columns distinguishable.' }
      ],
      expectedOutput: 'employee | manager\nAarav | NULL\nDiya | Aarav\nKabir | NULL\nAnanya | Kabir\nRohan | NULL\nMeera | NULL\nVihaan | Aarav\nIsha | Rohan',
      edgeCases: ['With INNER JOIN, the four top-level managers would disappear from the result.', 'Joining orders to order_items and then summing orders.total_amount counts each order once per item — aggregate at the right level.']
    },
    caseStudy: {
      title: 'Which customers bought which categories?',
      problem: 'The marketing team wants units sold and revenue per product category, counting delivered orders only.',
      data: 'orders → order_items → products (sample schema).',
      steps: ['Join orders to order_items on order_id and order_items to products on product_id.', "Filter status = 'DELIVERED'.", 'Group by category and sum quantity and quantity * unit_price.'],
      result: 'Electronics: 3 units / ₹1,797; Books: 1 unit / ₹39 (sample data).',
      limitations: 'Revenue from order_items may differ from orders.total_amount if discounts or shipping are stored only on the order.'
    },
    exercises: [
      {
        id: 'sql10-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Keep unmatched rows',
        objective: 'Choose the correct join type.',
        problem: 'You need every department listed, including departments with no employees. Which join from departments to employees?',
        options: ['INNER JOIN', 'departments LEFT JOIN employees', 'departments RIGHT JOIN employees', 'CROSS JOIN'],
        hints: ['Which side must be preserved?'],
        check: { type: 'mcq', answer: 1 },
        solution: ['LEFT JOIN preserves every row of the left table (departments).'],
        explanation: 'Departments without employees would show NULL employee columns.',
        mistakes: ['Using INNER JOIN, which drops empty departments.'],
        challenge: 'Count employees per department so empty departments show 0 (COUNT(e.emp_id)).'
      },
      {
        id: 'sql10-e2', type: 'SQL query writing', difficulty: 'Intermediate', language: 'sql',
        title: 'Customer spend',
        objective: 'Join and aggregate.',
        problem: 'Return each customer\'s name, number of orders as orders and total amount as total (all statuses), highest total first.',
        starterCode: 'SELECT c.name, \nFROM customers c\nJOIN orders o ON \nGROUP BY c.customer_id, c.name\nORDER BY total DESC;',
        hints: ['ON o.customer_id = c.customer_id', 'COUNT(*) AS orders, SUM(o.total_amount) AS total'],
        check: { type: 'rows', ordered: true, rows: [['Arjun Rao', 2, 1587], ['Tara Singh', 1, 1338], ['Sara Khan', 1, 499], ['Neel Joshi', 1, 329], ['Zoya Ali', 1, 249]] },
        solutionCode: 'SELECT c.name, COUNT(*) AS orders, SUM(o.total_amount) AS total\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_id, c.name\nORDER BY total DESC;',
        solution: ['Arjun has orders 1001 (1548) and 1003 (39) = 1587.', 'Group by the customer key, not just the name (names can repeat).'],
        explanation: 'Grouping by customer_id keeps two different people with the same name separate.',
        mistakes: ['Grouping by name only.'],
        challenge: 'Change it to a LEFT JOIN and COUNT(o.order_id) so customers without orders show 0.'
      },
      {
        id: 'sql10-e3', type: 'SQL query writing', difficulty: 'Advanced', language: 'sql',
        title: 'Category sales from delivered orders',
        objective: 'Join three tables, filter and aggregate.',
        problem: "Return category, units (sum of quantity) and revenue (sum of quantity * unit_price) for DELIVERED orders only, highest revenue first.",
        starterCode: 'SELECT p.category, \nFROM orders o\nJOIN order_items oi ON \nJOIN products p ON \nWHERE \nGROUP BY p.category\nORDER BY revenue DESC;',
        hints: ['oi.order_id = o.order_id and p.product_id = oi.product_id', "WHERE o.status = 'DELIVERED'"],
        check: { type: 'rows', ordered: true, rows: [['Electronics', 3, 1797], ['Books', 1, 39]] },
        solutionCode: "SELECT p.category,\n       SUM(oi.quantity) AS units,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status = 'DELIVERED'\nGROUP BY p.category\nORDER BY revenue DESC;",
        solution: ['Delivered orders: 1001 (laptop + headphones), 1003 (book), 1006 (headphones).', 'Electronics: 3 units, 1299 + 249 + 249 = 1797; Books: 1 unit, 39.'],
        explanation: 'Sum line-level values (from order_items) rather than order totals to avoid double counting.',
        mistakes: ['Summing o.total_amount after joining items, which counts order 1001 twice.'],
        challenge: 'Add Furniture with 0 units using a LEFT JOIN from products.'
      }
    ],
    knowledgeCheck: [
      { id: 'sql10-k1', question: 'What does a CROSS JOIN of 5 customers and 5 products return?', options: ['5 rows', '10 rows', '25 rows', '0 rows'], answer: 2, explanation: 'Every combination: 5 × 5.' },
      { id: 'sql10-k2', question: 'An N:M relationship (students ↔ courses) is modelled with…', options: ['A foreign key in students', 'A junction table with two foreign keys', 'A self join', 'A view'], answer: 1, explanation: 'e.g. enrolments(student_id, course_id).' },
      { id: 'sql10-k3', question: 'Where should a filter on the right table go in a LEFT JOIN to keep unmatched left rows?', options: ['WHERE', 'ON', 'HAVING', 'ORDER BY'], answer: 1, explanation: 'A WHERE condition on the right table removes the NULL rows and turns it into an inner join.' }
    ],
    cheatSheet: ['A JOIN B ON B.fk = A.pk', 'LEFT / RIGHT / FULL [OUTER] JOIN, CROSS JOIN', 'Self join: employees e JOIN employees m ON m.emp_id = e.manager_id', 'Filter right table in ON to keep LEFT semantics'],
    references: [
      { title: 'PostgreSQL Tutorial — Joins Between Tables', url: 'https://www.postgresql.org/docs/current/tutorial-join.html', publisher: PG },
      { title: 'PostgreSQL — Joined Tables', url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN', publisher: PG }
    ],
    next: 'Module 11 nests queries inside queries and combines result sets with UNION.'
  }
};
