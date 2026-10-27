// Detailed, step-by-step sections for SQL modules 6-10 (see sql-sections.part1.js).
export default {
  'sql-mod-6': [
    {
      heading: 'SELECT: read data from a table',
      text: 'SELECT reads data. After SELECT list the columns you want; after FROM name the table. The answer comes back as a result table. Reading data never changes the table.',
      syntax: 'SELECT column1, column2, ...\nFROM table_name;',
      code: 'SELECT first_name, last_name, salary\nFROM employees;',
      note: 'Columns appear in the order you list them, and you can list them in any order you like.'
    },
    {
      heading: 'SELECT *: all columns',
      text: 'An asterisk (*) means every column of the table. It is perfect for a quick look at a table.',
      syntax: 'SELECT * FROM table_name;',
      code: 'SELECT * FROM products;',
      note: 'In real applications, list the columns you need instead of *. It is faster and does not break when someone adds a column.'
    },
    {
      heading: 'Column aliases with AS',
      text: 'An alias gives a column a different name in the result. It does not rename anything in the table. Use it to make results readable, especially for calculated columns.',
      syntax: 'SELECT column_name AS alias_name\nFROM table_name;',
      code: 'SELECT first_name AS name,\n       hire_date  AS joined_on,\n       salary     AS yearly_salary\nFROM employees;',
      note: 'An alias with spaces needs double quotes: AS "Joined on". The word AS is optional in most databases, but writing it is clearer.'
    },
    {
      heading: 'Calculating new columns',
      text: 'A column in SELECT can be a calculation using + - * /. The calculation runs for every row. Give the result an alias.',
      code: 'SELECT first_name,\n       salary,\n       ROUND(salary / 12.0, 2) AS monthly_salary,\n       ROUND(salary * 1.10)    AS after_10pct_raise\nFROM employees;',
      note: 'ROUND(value, 2) keeps two decimals. Without it, 98000 / 12.0 shows as 8166.666666666667 and 98000 * 1.10 as 107800.00000000001 - computers store decimals approximately. Module 12 shows more functions.'
    },
    {
      heading: 'Joining text together',
      text: 'The || operator joins (concatenates) text. Here first and last names become one full name, with a space between them.',
      syntax: "SQLite, PostgreSQL, Oracle:  first_name || ' ' || last_name\nMySQL:                       CONCAT(first_name, ' ', last_name)\nSQL Server:                  first_name + ' ' + last_name",
      code: "SELECT first_name || ' ' || last_name AS full_name,\n       email\nFROM employees;"
    },
    {
      heading: 'Table aliases',
      text: 'A table can have an alias too: FROM employees AS e. Then e.first_name means "first_name from employees". Table aliases make queries with several tables (module 10) much shorter.',
      syntax: 'SELECT t.column\nFROM table_name AS t;',
      code: 'SELECT e.emp_id, e.first_name, e.salary\nFROM employees AS e;'
    },
    {
      heading: 'SELECT without a table',
      text: 'SELECT can also just calculate something, without reading a table. This is handy for testing a function or a calculation before using it in a real query.',
      code: "SELECT 2 + 3            AS sum,\n       UPPER('sql')     AS shout,\n       ROUND(10 / 3.0, 2) AS third;",
      note: 'Oracle needs a FROM even here: SELECT 2 + 3 FROM dual;'
    },
    {
      heading: 'The order of the parts of a query',
      text: 'A SELECT can have up to seven parts, and they must be written in this order. You already know SELECT and FROM; the next modules add the rest one by one.',
      table: {
        headers: ['#', 'Clause', 'What it does', 'Module'],
        rows: [
          ['1', 'SELECT', 'Which columns to show', '6'],
          ['2', 'FROM / JOIN', 'Which tables to read', '6, 10'],
          ['3', 'WHERE', 'Which rows to keep', '7'],
          ['4', 'GROUP BY', 'Make groups of rows', '9'],
          ['5', 'HAVING', 'Which groups to keep', '9'],
          ['6', 'ORDER BY', 'Sort the result', '8'],
          ['7', 'LIMIT', 'How many rows to return', '8']
        ]
      },
      code: 'SELECT dept_id, COUNT(*) AS people\nFROM employees\nWHERE salary > 55000\nGROUP BY dept_id\nHAVING COUNT(*) >= 1\nORDER BY people DESC\nLIMIT 3;',
      note: 'The database actually runs them in a different order (FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT). That is why a column alias from SELECT cannot be used in WHERE.'
    }
  ],

  'sql-mod-7': [
    {
      heading: 'The WHERE clause',
      text: 'WHERE filters rows: only rows for which the condition is true are returned. WHERE is also used in UPDATE and DELETE to choose which rows to change.',
      syntax: 'SELECT columns\nFROM table_name\nWHERE condition;',
      code: 'SELECT first_name, dept_id\nFROM employees\nWHERE dept_id = 1;',
      note: 'Text values go in single quotes (WHERE city = \'Pune\'); numbers do not (WHERE dept_id = 1).'
    },
    {
      heading: 'Comparison operators',
      text: 'These operators compare a column with a value.',
      table: {
        headers: ['Operator', 'Meaning', 'Example'],
        rows: [
          ['=', 'Equal to', 'dept_id = 1'],
          ['<> or !=', 'Not equal to', "status <> 'DELIVERED'"],
          ['>', 'Greater than', 'salary > 70000'],
          ['<', 'Less than', 'price < 100'],
          ['>=', 'Greater than or equal', "hire_date >= '2023-01-01'"],
          ['<=', 'Less than or equal', 'total_amount <= 500']
        ]
      },
      code: "SELECT first_name, hire_date\nFROM employees\nWHERE hire_date >= '2023-01-01';",
      note: "Dates written as 'YYYY-MM-DD' compare correctly, because that order sorts the same way as the dates themselves."
    },
    {
      heading: 'AND: both conditions',
      text: 'AND joins two conditions; a row is kept only if both are true.',
      syntax: 'WHERE condition1 AND condition2',
      code: 'SELECT first_name, dept_id, salary\nFROM employees\nWHERE dept_id = 1 AND salary > 80000;'
    },
    {
      heading: 'OR: at least one condition',
      text: 'OR keeps a row if either condition (or both) is true.',
      syntax: 'WHERE condition1 OR condition2',
      code: "SELECT name, city\nFROM customers\nWHERE city = 'Pune' OR city = 'Delhi';"
    },
    {
      heading: 'NOT: the opposite',
      text: 'NOT reverses a condition: it keeps the rows for which the condition is false.',
      syntax: 'WHERE NOT condition',
      code: "SELECT name, category\nFROM products\nWHERE NOT category = 'Electronics';"
    },
    {
      heading: 'Mixing AND and OR: use brackets',
      text: 'AND is applied before OR, just like × before + in maths. When you mix them, put brackets around the OR part so the database does what you mean.',
      code: 'SELECT first_name, dept_id, salary\nFROM employees\nWHERE (dept_id = 1 OR dept_id = 2)\n  AND salary >= 64000;',
      note: 'Without the brackets this would mean dept_id = 1 OR (dept_id = 2 AND salary >= 64000), which also returns every Engineering employee regardless of salary.'
    },
    {
      heading: 'BETWEEN: a range',
      text: 'BETWEEN keeps values inside a range, including both ends. It works for numbers, dates and text.',
      syntax: 'WHERE column BETWEEN low AND high',
      code: "SELECT order_id, order_date, total_amount\nFROM orders\nWHERE order_date BETWEEN '2024-06-01' AND '2024-06-30';",
      note: 'BETWEEN 100 AND 500 is the same as >= 100 AND <= 500. NOT BETWEEN keeps everything outside the range.'
    },
    {
      heading: 'IN: a list of values',
      text: 'IN is a short way to write several OR conditions on the same column.',
      syntax: 'WHERE column IN (value1, value2, ...)',
      code: "SELECT order_id, status\nFROM orders\nWHERE status IN ('PENDING', 'SHIPPED');",
      note: 'NOT IN keeps the rows whose value is not in the list.'
    },
    {
      heading: 'LIKE: patterns in text',
      text: 'LIKE compares text with a pattern. % stands for any number of characters (even none) and _ for exactly one character.',
      syntax: "WHERE column LIKE 'pattern'",
      table: {
        headers: ['Pattern', 'Finds text that...'],
        rows: [
          ["'A%'", 'starts with A'],
          ["'%a'", 'ends with a'],
          ["'%Desk%'", 'contains Desk'],
          ["'_i%'", 'has i as the second letter'],
          ["'____'", 'has exactly four characters']
        ]
      },
      code: "SELECT first_name\nFROM employees\nWHERE first_name LIKE 'A%' OR first_name LIKE '_i%';",
      note: 'In SQLite and MySQL, LIKE ignores upper and lower case for English letters. PostgreSQL LIKE is case sensitive; use ILIKE there.'
    },
    {
      heading: 'IS NULL and IS NOT NULL',
      text: 'NULL means "no value". Comparing with = NULL never matches anything, so SQL has special tests: IS NULL and IS NOT NULL.',
      syntax: 'WHERE column IS NULL\nWHERE column IS NOT NULL',
      code: 'SELECT first_name, manager_id\nFROM employees\nWHERE manager_id IS NOT NULL;',
      note: 'These four employees have a manager. Change IS NOT NULL to IS NULL to see the four who do not.'
    }
  ],

  'sql-mod-8': [
    {
      heading: 'SELECT DISTINCT',
      text: 'DISTINCT removes duplicate rows from the result, so each different value appears only once.',
      syntax: 'SELECT DISTINCT column FROM table_name;',
      code: 'SELECT DISTINCT city\nFROM customers;',
      note: 'Hyderabad belongs to two customers but is shown once.'
    },
    {
      heading: 'DISTINCT on several columns',
      text: 'With more than one column, DISTINCT removes rows only when all the listed columns are the same. Customer 1 has two DELIVERED orders, so that pair is shown once.',
      code: 'SELECT DISTINCT customer_id, status\nFROM orders\nORDER BY customer_id;'
    },
    {
      heading: 'Counting different values',
      text: 'COUNT(DISTINCT column) counts how many different values a column has.',
      code: 'SELECT COUNT(city)          AS all_customers_with_city,\n       COUNT(DISTINCT city) AS different_cities\nFROM customers;'
    },
    {
      heading: 'ORDER BY: sort the result',
      text: 'Without ORDER BY, rows can come back in any order. ORDER BY sorts them by one or more columns. ASC (ascending: smallest, A, oldest first) is the default.',
      syntax: 'SELECT columns\nFROM table_name\nORDER BY column [ASC | DESC];',
      code: 'SELECT name, price\nFROM products\nORDER BY price;'
    },
    {
      heading: 'ORDER BY ... DESC',
      text: 'DESC (descending) reverses the order: largest, Z, newest first.',
      code: 'SELECT first_name, hire_date\nFROM employees\nORDER BY hire_date DESC;'
    },
    {
      heading: 'Sorting by several columns',
      text: 'List several columns to sort by the first, then by the second when the first is equal, and so on. Each column can have its own ASC or DESC.',
      code: 'SELECT dept_id, first_name, salary\nFROM employees\nORDER BY dept_id ASC, salary DESC;',
      note: 'Read it as: by department, and inside each department the highest salary first.'
    },
    {
      heading: 'Sorting by a calculation or alias',
      text: 'You can sort by an expression, or by a column alias defined in SELECT.',
      code: "SELECT first_name || ' ' || last_name AS full_name,\n       ROUND(salary / 12.0) AS monthly\nFROM employees\nORDER BY monthly DESC;"
    },
    {
      heading: 'LIMIT: the first rows only',
      text: 'LIMIT n returns at most n rows. Together with ORDER BY it answers "top 3" questions.',
      syntax: 'SELECT columns\nFROM table_name\nORDER BY column\nLIMIT number;',
      code: 'SELECT first_name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 3;',
      table: {
        headers: ['Database', 'Top 3 rows'],
        rows: [
          ['SQLite, MySQL, PostgreSQL', '... ORDER BY salary DESC LIMIT 3'],
          ['SQL Server', 'SELECT TOP 3 ... ORDER BY salary DESC'],
          ['Oracle, standard SQL', '... ORDER BY salary DESC FETCH FIRST 3 ROWS ONLY']
        ]
      }
    },
    {
      heading: 'OFFSET: skip rows (pages)',
      text: 'OFFSET skips a number of rows before LIMIT starts counting. Websites use it to show results page by page: with 3 rows per page, page 2 is LIMIT 3 OFFSET 3.',
      syntax: 'LIMIT rows_per_page OFFSET rows_to_skip',
      code: 'SELECT emp_id, first_name\nFROM employees\nORDER BY emp_id\nLIMIT 3 OFFSET 3;',
      note: 'Always use ORDER BY with LIMIT and OFFSET, otherwise the pages may contain different rows each time.'
    }
  ],

  'sql-mod-9': [
    {
      heading: 'What are aggregate functions?',
      text: 'An aggregate function takes many rows and returns one value: a count, a total, an average, the smallest or the largest. They are the building blocks of every report.',
      table: {
        headers: ['Function', 'Returns'],
        rows: [
          ['COUNT()', 'how many rows / values'],
          ['SUM()', 'the total'],
          ['AVG()', 'the average'],
          ['MIN()', 'the smallest value'],
          ['MAX()', 'the largest value']
        ]
      }
    },
    {
      heading: 'COUNT',
      text: 'COUNT(*) counts rows. COUNT(column) counts only the rows where that column is not NULL.',
      syntax: 'SELECT COUNT(*) FROM table_name WHERE condition;',
      code: 'SELECT COUNT(*)          AS employees,\n       COUNT(manager_id) AS with_a_manager\nFROM employees;',
      note: '8 employees, but only 4 have a manager_id - the others are NULL and are not counted.'
    },
    {
      heading: 'SUM',
      text: 'SUM adds up the values in a numeric column.',
      code: "SELECT SUM(total_amount) AS revenue\nFROM orders\nWHERE status <> 'CANCELLED';"
    },
    {
      heading: 'AVG',
      text: 'AVG gives the average (mean). Wrap it in ROUND to keep the result tidy.',
      code: 'SELECT ROUND(AVG(salary), 2) AS average_salary\nFROM employees;'
    },
    {
      heading: 'MIN and MAX',
      text: 'MIN and MAX return the smallest and largest values. They work on numbers, dates and text.',
      code: 'SELECT MIN(price) AS cheapest,\n       MAX(price) AS most_expensive,\n       MIN(name)  AS first_alphabetically\nFROM products;',
      note: 'MIN on text gives the first value in alphabetical order; MIN on dates gives the earliest date.'
    },
    {
      heading: 'GROUP BY: one result per group',
      text: 'GROUP BY puts rows with the same value into groups, and the aggregate is calculated for each group separately. Here: number of employees and average salary for each department.',
      syntax: 'SELECT column, AGGREGATE(column)\nFROM table_name\nGROUP BY column;',
      code: 'SELECT dept_id,\n       COUNT(*)           AS employees,\n       ROUND(AVG(salary)) AS avg_salary\nFROM employees\nGROUP BY dept_id;',
      note: 'Rule: every column in SELECT must be either in GROUP BY or inside an aggregate function.'
    },
    {
      heading: 'GROUP BY more than one column',
      text: 'Grouping by two columns makes one group for each combination of values.',
      code: 'SELECT customer_id, status, COUNT(*) AS orders\nFROM orders\nGROUP BY customer_id, status\nORDER BY customer_id;'
    },
    {
      heading: 'HAVING: filter groups',
      text: 'HAVING is like WHERE, but for groups. It runs after grouping, so it can use aggregates such as COUNT(*) or SUM(...).',
      syntax: 'SELECT column, AGGREGATE(column)\nFROM table_name\nGROUP BY column\nHAVING condition;',
      code: 'SELECT dept_id, COUNT(*) AS employees\nFROM employees\nGROUP BY dept_id\nHAVING COUNT(*) >= 2;'
    },
    {
      heading: 'WHERE and HAVING together',
      text: 'WHERE removes rows before grouping; HAVING removes groups after. This query ignores cancelled orders, groups by customer and keeps customers who spent more than 400.',
      code: "SELECT customer_id,\n       COUNT(*)          AS orders,\n       SUM(total_amount) AS spent\nFROM orders\nWHERE status <> 'CANCELLED'\nGROUP BY customer_id\nHAVING SUM(total_amount) > 400\nORDER BY spent DESC;",
      table: {
        headers: ['', 'WHERE', 'HAVING'],
        rows: [
          ['Filters', 'rows', 'groups'],
          ['Runs', 'before GROUP BY', 'after GROUP BY'],
          ['Can use SUM, COUNT...', 'no', 'yes']
        ]
      }
    }
  ],

  'sql-mod-10': [
    {
      heading: 'Why do we need joins?',
      text: 'Data is split over several tables so nothing is stored twice. The orders table stores only customer_id, not the customer\'s name. A join combines rows from two tables, matching them on a related column - usually a foreign key and the primary key it points to.',
      code: 'SELECT order_id, customer_id, total_amount\nFROM orders;',
      note: 'This shows only numbers for the customer. The next section joins customers to show their names.'
    },
    {
      heading: 'INNER JOIN',
      text: 'INNER JOIN returns the rows that have a match in both tables. ON says which columns must be equal.',
      syntax: 'SELECT columns\nFROM table1\nINNER JOIN table2 ON table1.column = table2.column;',
      code: 'SELECT orders.order_id, customers.name, orders.total_amount\nFROM orders\nINNER JOIN customers ON orders.customer_id = customers.customer_id;',
      note: 'JOIN on its own means INNER JOIN.'
    },
    {
      heading: 'Joins with table aliases',
      text: 'Writing full table names everywhere is long. Give each table a short alias and use it in front of every column: o.order_id, c.name.',
      code: 'SELECT o.order_id, c.name, c.city, o.total_amount\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id\nORDER BY o.order_id;'
    },
    {
      heading: 'LEFT JOIN',
      text: 'LEFT JOIN returns every row of the left (first) table, plus the matching rows from the right table. When there is no match, the right table\'s columns are NULL.',
      syntax: 'SELECT columns\nFROM table1\nLEFT JOIN table2 ON table1.column = table2.column;',
      code: "INSERT INTO departments VALUES (5, 'Legal', 'Delhi');   -- a department with nobody in it\n\nSELECT d.dept_name, e.first_name\nFROM departments AS d\nLEFT JOIN employees AS e ON e.dept_id = d.dept_id\nORDER BY d.dept_id;",
      note: 'Legal appears with NULL as first_name. An INNER JOIN would leave Legal out completely.'
    },
    {
      heading: 'RIGHT JOIN',
      text: 'RIGHT JOIN is the mirror of LEFT JOIN: every row of the right table is kept. Most people simply swap the tables and write a LEFT JOIN instead.',
      syntax: 'SELECT columns\nFROM table1\nRIGHT JOIN table2 ON table1.column = table2.column;',
      code: "INSERT INTO departments VALUES (5, 'Legal', 'Delhi');\n\nSELECT e.first_name, d.dept_name\nFROM employees AS e\nRIGHT JOIN departments AS d ON e.dept_id = d.dept_id\nORDER BY d.dept_id;"
    },
    {
      heading: 'FULL OUTER JOIN',
      text: 'FULL OUTER JOIN keeps every row from both tables, matched where possible and NULL where not.',
      syntax: 'SELECT columns\nFROM table1\nFULL OUTER JOIN table2 ON table1.column = table2.column;',
      code: "INSERT INTO departments VALUES (5, 'Legal', 'Delhi');\nINSERT INTO employees (emp_id, first_name, dept_id) VALUES (109, 'Sam', NULL);\n\nSELECT e.first_name, d.dept_name\nFROM employees AS e\nFULL OUTER JOIN departments AS d ON e.dept_id = d.dept_id\nWHERE e.emp_id IS NULL OR d.dept_id IS NULL;",
      note: 'The result shows only the unmatched rows: Sam (no department) and Legal (no employees). MySQL has no FULL JOIN; there you combine a LEFT and a RIGHT JOIN with UNION.'
    },
    {
      heading: 'CROSS JOIN',
      text: 'CROSS JOIN combines every row of one table with every row of the other - all possible pairs. 4 departments × 3 product categories = 12 rows. It is rarely needed, but useful for making combinations such as sizes × colours.',
      code: "SELECT d.dept_name, p.category\nFROM departments AS d\nCROSS JOIN (SELECT DISTINCT category FROM products) AS p\nORDER BY d.dept_name, p.category;"
    },
    {
      heading: 'Self join',
      text: 'A table can be joined to itself. employees.manager_id contains the emp_id of another employee, so joining employees to employees puts each person next to their manager. Use two aliases: e for the employee and m for the manager.',
      code: 'SELECT e.first_name AS employee,\n       m.first_name AS manager\nFROM employees AS e\nLEFT JOIN employees AS m ON e.manager_id = m.emp_id\nORDER BY e.emp_id;'
    },
    {
      heading: 'Joining three or more tables',
      text: 'Add one JOIN per extra table, each with its own ON. To see which customer bought which product you go customers → orders → order_items → products.',
      code: 'SELECT c.name AS customer, p.name AS product, oi.quantity, oi.unit_price\nFROM customers AS c\nJOIN orders      AS o  ON o.customer_id = c.customer_id\nJOIN order_items AS oi ON oi.order_id   = o.order_id\nJOIN products    AS p  ON p.product_id  = oi.product_id\nORDER BY c.name;'
    },
    {
      heading: 'Finding rows with no match',
      text: 'LEFT JOIN plus WHERE right_table.key IS NULL finds rows that have no partner - for example customers who never placed an order.',
      code: "INSERT INTO customers VALUES (6, 'Kiran Rao', 'Goa', '2024-08-01');\n\nSELECT c.name\nFROM customers AS c\nLEFT JOIN orders AS o ON o.customer_id = c.customer_id\nWHERE o.order_id IS NULL;",
      note: 'Kiran is new and has no orders, so only Kiran is returned.'
    }
  ]
};
