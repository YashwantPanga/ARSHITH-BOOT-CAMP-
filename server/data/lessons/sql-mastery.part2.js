// SQL & Relational Databases - lesson text for modules 6-10 (see part1 for notes).
export default {
  'sql-mod-6': {
    description: 'Read data with SELECT: choose columns, rename them with AS, and calculate new columns.',
    readingMaterial: {
      introduction: 'SELECT is the statement you will use most. It reads data from one or more tables and returns a result table. In this module you choose columns, give them friendly names, and calculate new values such as a monthly salary or a full name.',
      objectives: [
        'Read all or some columns with SELECT',
        'Rename result columns with AS (aliases)',
        'Calculate new columns with + - * / and join text with ||',
        'Understand the order in which a SELECT is written'
      ],
      sections: [
        {
          heading: 'SELECT and FROM',
          text: 'SELECT lists the columns to show; FROM names the table. The result is a new table that is shown to you - the original table does not change.',
          bulletPoints: [
            'SELECT * FROM employees; - every column.',
            'SELECT first_name, salary FROM employees; - only these columns, in this order.',
            'You can SELECT the same column twice, or columns in any order.'
          ]
        },
        {
          heading: 'Aliases with AS',
          text: 'An alias is a temporary name for a column (or a table) in the result. It makes results easier to read.',
          bulletPoints: [
            'SELECT first_name AS name FROM employees;',
            'Put an alias with spaces in double quotes: AS "Monthly salary".',
            'Table aliases make long queries shorter: FROM employees AS e, then e.first_name.'
          ]
        },
        {
          heading: 'Calculated columns',
          text: 'A column in SELECT can be a calculation instead of a stored column.',
          table: {
            headers: ['You write', 'Result'],
            rows: [
              ['salary / 12', 'Monthly salary'],
              ['salary * 1.10', 'Salary after a 10% raise'],
              ["first_name || ' ' || last_name", 'Full name (MySQL: CONCAT(first_name, \' \', last_name))'],
              ['ROUND(price * 0.9, 2)', 'Price after 10% discount, 2 decimals']
            ]
          },
          bulletPoints: [
            'In SQLite, 7 / 2 gives 3 (whole numbers). Write 7 / 2.0 to get 3.5.'
          ]
        },
        {
          heading: 'The order of a SELECT statement',
          text: 'The parts of a SELECT must be written in this order. You will meet each one in the next modules.',
          table: {
            headers: ['Order', 'Clause', 'Purpose'],
            rows: [
              ['1', 'SELECT', 'Which columns'],
              ['2', 'FROM / JOIN', 'Which tables'],
              ['3', 'WHERE', 'Which rows'],
              ['4', 'GROUP BY', 'Make groups'],
              ['5', 'HAVING', 'Which groups'],
              ['6', 'ORDER BY', 'Sort the result'],
              ['7', 'LIMIT', 'How many rows']
            ]
          }
        }
      ],
      codeExamples: [
        {
          title: 'Rename columns with AS',
          language: 'sql',
          code: 'SELECT first_name AS name,\n       hire_date  AS joined\nFROM employees;',
          explanation: 'The result columns are called name and joined instead of first_name and hire_date.'
        },
        {
          title: 'Full name and monthly salary',
          language: 'sql',
          code: "SELECT first_name || ' ' || last_name AS full_name,\n       salary,\n       ROUND(salary / 12.0, 2)       AS monthly_salary\nFROM employees;",
          explanation: "|| joins text, so 'Aarav' || ' ' || 'Sharma' becomes 'Aarav Sharma'. Dividing by 12.0 keeps the decimals; ROUND keeps 2 of them (98000 becomes 8166.67)."
        },
        {
          title: 'Prices with a discount',
          language: 'sql',
          code: 'SELECT name,\n       price,\n       ROUND(price * 0.9, 2) AS sale_price,\n       ROUND(price * 0.1, 2) AS you_save\nFROM products;',
          explanation: 'Each product shows its normal price, a 10% discounted price and the amount saved (Laptop Pro 14: 1169.1 and 129.9). ROUND keeps the decimals tidy. The products table itself is not changed.'
        }
      ],
      bestPractices: [
        'Give every calculated column an alias.',
        'Name only the columns you need; SELECT * is fine for exploring.',
        'Use table aliases (e, d) once a query uses more than one table.'
      ],
      commonMistakes: [
        'A comma after the last column: SELECT first_name, salary, FROM employees.',
        'Integer division in SQLite: 5 / 2 is 2, not 2.5.',
        'Using a column alias inside WHERE of the same query - most databases do not allow it.'
      ],
      practiceExercise: {
        title: 'Order report',
        problem: 'From the orders table show: order_id, total_amount, and a column total_with_tax that is total_amount plus 18% GST, rounded to 2 decimals.',
        solutionCode: 'SELECT order_id,\n       total_amount,\n       ROUND(total_amount * 1.18, 2) AS total_with_tax\nFROM orders;'
      },
      keyTakeaways: [
        'SELECT chooses columns; FROM chooses the table.',
        'AS gives a column or table a temporary name.',
        'Columns can be calculated with + - * / and text joined with ||.',
        'Clause order: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.'
      ]
    }
  },

  'sql-mod-7': {
    description: 'Pick the rows you want with WHERE: comparisons, AND, OR, NOT, BETWEEN, IN, LIKE and IS NULL.',
    readingMaterial: {
      introduction: 'WHERE filters rows: only the rows for which the condition is true are returned (or updated, or deleted). This module covers every common kind of condition, with examples on the practice tables.',
      objectives: [
        'Filter rows with comparison operators (=, <>, >, <, >=, <=)',
        'Combine conditions with AND, OR and NOT',
        'Use BETWEEN, IN and LIKE',
        'Find missing values with IS NULL'
      ],
      sections: [
        {
          heading: 'Comparison operators',
          text: 'The simplest condition compares a column with a value.',
          table: {
            headers: ['Operator', 'Meaning', 'Example'],
            rows: [
              ['=', 'Equal', 'dept_id = 1'],
              ['<> or !=', 'Not equal', "status <> 'DELIVERED'"],
              ['>  <', 'Greater / less than', 'salary > 70000'],
              ['>=  <=', 'Greater / less or equal', "hire_date >= '2023-01-01'"]
            ]
          }
        },
        {
          heading: 'AND, OR, NOT',
          text: 'Join conditions to make more exact filters.',
          bulletPoints: [
            'AND: both conditions must be true. dept_id = 1 AND salary > 80000',
            'OR: at least one must be true. city = \'Pune\' OR city = \'Delhi\'',
            'NOT: reverses a condition. NOT category = \'Books\'',
            'AND is checked before OR, so use brackets when you mix them: WHERE (city = \'Pune\' OR city = \'Delhi\') AND signup_date >= \'2024-01-01\''
          ]
        },
        {
          heading: 'BETWEEN and IN',
          text: 'Short ways to write common conditions.',
          bulletPoints: [
            'BETWEEN 50000 AND 70000 includes both ends (same as >= 50000 AND <= 70000). It also works for dates.',
            "IN ('Pune', 'Delhi') matches any value in the list - shorter than many ORs.",
            'NOT IN and NOT BETWEEN do the opposite.'
          ]
        },
        {
          heading: 'LIKE: matching patterns in text',
          text: 'LIKE compares text with a pattern that uses two wildcards.',
          table: {
            headers: ['Pattern', 'Matches'],
            rows: [
              ["'A%'", 'Starts with A (% = any number of characters)'],
              ["'%a'", 'Ends with a'],
              ["'%Desk%'", 'Contains Desk anywhere'],
              ["'_i%'", 'Second letter is i (_ = exactly one character)']
            ]
          },
          bulletPoints: [
            'In SQLite and MySQL, LIKE ignores upper/lower case for English letters; in PostgreSQL use ILIKE for that.'
          ]
        },
        {
          heading: 'IS NULL',
          text: 'NULL means "no value", and nothing is equal to NULL - not even NULL. So = NULL never matches. Use IS NULL and IS NOT NULL.',
          bulletPoints: [
            'WHERE manager_id IS NULL finds employees with no manager.',
            'WHERE manager_id IS NOT NULL finds employees who have one.'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'AND, OR and brackets',
          language: 'sql',
          code: "SELECT first_name, dept_id, salary\nFROM employees\nWHERE (dept_id = 1 OR dept_id = 2)\n  AND salary >= 64000;",
          explanation: 'Employees in department 1 or 2 who earn 64000 or more: Aarav, Diya, Kabir and Vihaan. Without the brackets the result would be different.'
        },
        {
          title: 'BETWEEN and IN',
          language: 'sql',
          code: "SELECT first_name, salary, hire_date\nFROM employees\nWHERE salary BETWEEN 55000 AND 65000\n  AND hire_date >= '2021-01-01';\n\nSELECT name, city\nFROM customers\nWHERE city IN ('Pune', 'Delhi', 'Mumbai');",
          explanation: 'The first query finds Ananya, Rohan and Isha. The Lab shows the last result: the three customers living in Pune, Delhi or Mumbai.'
        },
        {
          title: 'LIKE patterns',
          language: 'sql',
          code: "SELECT name, category\nFROM products\nWHERE name LIKE '%Desk%'\n   OR name LIKE 'P%';",
          explanation: "'%Desk%' finds Standing Desk and 'P%' finds Python Crash Course."
        },
        {
          title: 'Finding missing values',
          language: 'sql',
          code: 'SELECT first_name, last_name\nFROM employees\nWHERE manager_id IS NULL;',
          explanation: 'Aarav, Kabir, Rohan and Meera have no manager (they lead their departments). WHERE manager_id = NULL would return nothing.'
        }
      ],
      bestPractices: [
        'Use brackets whenever you mix AND with OR.',
        'Use IN instead of a long chain of OR conditions on one column.',
        'Write dates as YYYY-MM-DD so comparisons and BETWEEN work correctly.'
      ],
      commonMistakes: [
        'Writing = NULL instead of IS NULL.',
        'Forgetting that BETWEEN includes both end values.',
        'Mixing AND and OR without brackets and getting the wrong rows.'
      ],
      practiceExercise: {
        title: 'Find the right orders',
        problem: "From orders, show order_id, status and total_amount for orders that are NOT cancelled and have a total between 200 and 1500 (inclusive).",
        solutionCode: "SELECT order_id, status, total_amount\nFROM orders\nWHERE status <> 'CANCELLED'\n  AND total_amount BETWEEN 200 AND 1500;"
      },
      keyTakeaways: [
        'WHERE keeps only the rows where the condition is true.',
        'AND needs both conditions, OR needs one; use brackets when mixing.',
        'BETWEEN (inclusive), IN (list) and LIKE (pattern with % and _) shorten conditions.',
        'Check for missing values with IS NULL / IS NOT NULL.'
      ]
    }
  },

  'sql-mod-8': {
    description: 'Remove duplicates with DISTINCT, sort with ORDER BY, and return only the first rows with LIMIT and OFFSET.',
    readingMaterial: {
      introduction: 'A query result often needs tidying: removing repeated values, putting rows in a useful order, or showing only the top few. DISTINCT, ORDER BY and LIMIT do exactly that.',
      objectives: [
        'Remove duplicate values with SELECT DISTINCT',
        'Sort results with ORDER BY, ascending or descending, on one or more columns',
        'Return the top N rows with LIMIT',
        'Show results page by page with LIMIT and OFFSET'
      ],
      sections: [
        {
          heading: 'SELECT DISTINCT',
          text: 'DISTINCT removes duplicate rows from the result. SELECT DISTINCT city FROM customers shows each city once.',
          bulletPoints: [
            'With several columns, DISTINCT removes rows where all those columns are the same.',
            'COUNT(DISTINCT city) counts the different cities.'
          ]
        },
        {
          heading: 'ORDER BY',
          text: 'Without ORDER BY, the order of rows is not guaranteed. ORDER BY sorts the result.',
          bulletPoints: [
            'ASC = smallest first (the default). DESC = largest first.',
            'Sort by several columns: ORDER BY dept_id ASC, salary DESC - by department, then highest salary first inside each department.',
            'You can sort by an alias or a calculation: ORDER BY monthly DESC.',
            'Text is sorted A to Z, dates from oldest to newest.'
          ]
        },
        {
          heading: 'LIMIT and OFFSET',
          text: 'LIMIT n returns only the first n rows. It is almost always used with ORDER BY, for "top 3" lists.',
          table: {
            headers: ['Database', 'First 3 rows'],
            rows: [
              ['SQLite, MySQL, PostgreSQL', 'SELECT ... ORDER BY ... LIMIT 3'],
              ['SQL Server', 'SELECT TOP 3 ...'],
              ['Oracle, standard SQL', '... FETCH FIRST 3 ROWS ONLY']
            ]
          },
          bulletPoints: [
            'OFFSET skips rows: LIMIT 3 OFFSET 3 gives rows 4 to 6 - page 2 when a page has 3 rows.'
          ]
        }
      ],
      codeExamples: [
        {
          title: 'Each city only once',
          language: 'sql',
          code: 'SELECT DISTINCT city\nFROM customers\nORDER BY city;',
          explanation: 'Hyderabad appears for two customers but is shown once. The result: Delhi, Hyderabad, Mumbai, Pune.'
        },
        {
          title: 'Sort by two columns',
          language: 'sql',
          code: 'SELECT dept_id, first_name, salary\nFROM employees\nORDER BY dept_id ASC, salary DESC;',
          explanation: 'Rows are grouped by department 1, 2, 3, 4; inside each department the highest salary comes first.'
        },
        {
          title: 'Top 3 most expensive products',
          language: 'sql',
          code: 'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 3;',
          explanation: 'Sort from highest price, then keep 3 rows: Laptop Pro 14, Standing Desk, Ergo Chair.'
        },
        {
          title: 'Page 2 of the employee list',
          language: 'sql',
          code: 'SELECT emp_id, first_name\nFROM employees\nORDER BY emp_id\nLIMIT 3 OFFSET 3;',
          explanation: 'Skip the first 3 employees and show the next 3: 104, 105 and 106.'
        }
      ],
      bestPractices: [
        'Always use ORDER BY when the order of rows matters.',
        'Always combine LIMIT with ORDER BY, otherwise "top 3" is random.',
        'Add a unique column (such as the ID) at the end of ORDER BY so ties are always in the same order.'
      ],
      commonMistakes: [
        'Putting ORDER BY before WHERE - ORDER BY comes near the end.',
        'Expecting DISTINCT to apply to only one of several selected columns.',
        'Using LIMIT without ORDER BY.'
      ],
      practiceExercise: {
        title: 'Newest hires',
        problem: 'Show the first_name and hire_date of the 3 employees who joined most recently, newest first.',
        solutionCode: 'SELECT first_name, hire_date\nFROM employees\nORDER BY hire_date DESC\nLIMIT 3;'
      },
      keyTakeaways: [
        'SELECT DISTINCT removes duplicate rows.',
        'ORDER BY sorts; ASC is the default, DESC is reverse.',
        'LIMIT n keeps the first n rows; OFFSET skips rows.',
        'TOP (SQL Server) and FETCH FIRST (Oracle) do the same as LIMIT.'
      ]
    }
  },

  'sql-mod-9': {
    description: 'Summarise data with COUNT, SUM, AVG, MIN and MAX, make groups with GROUP BY and filter groups with HAVING.',
    readingMaterial: {
      introduction: 'Aggregate functions turn many rows into one answer: how many orders, total sales, average salary. With GROUP BY you get one answer per group - for example the average salary of each department. This is the heart of reports and dashboards.',
      objectives: [
        'Use COUNT, SUM, AVG, MIN and MAX',
        'Make one result row per group with GROUP BY',
        'Filter groups with HAVING and know how it differs from WHERE',
        'Understand how aggregates treat NULL'
      ],
      sections: [
        {
          heading: 'Aggregate functions',
          text: 'An aggregate function reads many rows and returns one value.',
          table: {
            headers: ['Function', 'Returns', 'Example'],
            rows: [
              ['COUNT(*)', 'Number of rows', 'COUNT(*) FROM orders → 6'],
              ['COUNT(column)', 'Number of non-NULL values', 'COUNT(manager_id) → 4'],
              ['SUM(column)', 'Total', 'SUM(total_amount)'],
              ['AVG(column)', 'Average', 'AVG(salary)'],
              ['MIN / MAX(column)', 'Smallest / largest', 'MAX(price)']
            ]
          },
          bulletPoints: [
            'Aggregates skip NULL values (except COUNT(*), which counts rows).'
          ]
        },
        {
          heading: 'GROUP BY',
          text: 'GROUP BY splits the rows into groups that share a value, then runs the aggregate once per group.',
          bulletPoints: [
            'SELECT dept_id, AVG(salary) FROM employees GROUP BY dept_id; - one row per department.',
            'Rule: every column in SELECT must either be in GROUP BY or be inside an aggregate function.',
            'You can group by several columns: GROUP BY category, city.'
          ]
        },
        {
          heading: 'HAVING vs WHERE',
          text: 'WHERE filters rows before grouping. HAVING filters groups after grouping, so it can use aggregates.',
          table: {
            headers: ['', 'WHERE', 'HAVING'],
            rows: [
              ['Works on', 'Single rows', 'Groups'],
              ['Runs', 'Before GROUP BY', 'After GROUP BY'],
              ['Can use COUNT, SUM...', 'No', 'Yes'],
              ['Example', "WHERE status <> 'CANCELLED'", 'HAVING COUNT(*) >= 2']
            ]
          }
        }
      ],
      codeExamples: [
        {
          title: 'Summary of all orders',
          language: 'sql',
          code: "SELECT COUNT(*)          AS orders,\n       SUM(total_amount)  AS revenue,\n       ROUND(AVG(total_amount), 2) AS average_order,\n       MAX(total_amount)  AS biggest_order\nFROM orders\nWHERE status <> 'CANCELLED';",
          explanation: 'The cancelled order is removed by WHERE first. Then 5 orders remain: revenue 3673, average 734.6, biggest 1548.'
        },
        {
          title: 'Headcount and average salary per department',
          language: 'sql',
          code: 'SELECT dept_id,\n       COUNT(*)            AS employees,\n       ROUND(AVG(salary))  AS avg_salary\nFROM employees\nGROUP BY dept_id\nORDER BY dept_id;',
          explanation: 'One row per department. Department 1 (Engineering) has 3 employees with an average salary of 88000.'
        },
        {
          title: 'HAVING: only big groups',
          language: 'sql',
          code: 'SELECT customer_id,\n       COUNT(*)          AS orders,\n       SUM(total_amount) AS spent\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) >= 2;',
          explanation: 'Only customer 1 (Arjun Rao) has 2 or more orders, spending 1587 in total.'
        },
        {
          title: 'Products per category',
          language: 'sql',
          code: 'SELECT category,\n       COUNT(*)   AS products,\n       MIN(price) AS cheapest,\n       MAX(price) AS most_expensive\nFROM products\nGROUP BY category\nORDER BY products DESC;',
          explanation: 'Electronics and Furniture have 2 products each, Books has 1.'
        }
      ],
      bestPractices: [
        'Give every aggregate an alias (AS revenue).',
        'Filter rows with WHERE whenever you can; use HAVING only for conditions on aggregates.',
        'Round averages for display with ROUND.'
      ],
      commonMistakes: [
        'Selecting a column that is neither grouped nor aggregated.',
        'Writing WHERE COUNT(*) > 2 - aggregates belong in HAVING.',
        'Forgetting that AVG ignores NULL values.'
      ],
      practiceExercise: {
        title: 'Orders by status',
        problem: 'Show each order status with the number of orders and the total amount, only for statuses whose total amount is more than 400, largest total first.',
        solutionCode: 'SELECT status,\n       COUNT(*)          AS orders,\n       SUM(total_amount) AS total\nFROM orders\nGROUP BY status\nHAVING SUM(total_amount) > 400\nORDER BY total DESC;'
      },
      keyTakeaways: [
        'COUNT, SUM, AVG, MIN and MAX turn many rows into one value.',
        'GROUP BY gives one result row per group.',
        'WHERE filters rows before grouping; HAVING filters groups after.',
        'Every selected column must be grouped or aggregated.'
      ]
    }
  },

  'sql-mod-10': {
    description: 'Combine tables with joins: INNER JOIN, LEFT JOIN, RIGHT and FULL JOIN, self joins and joining three tables.',
    readingMaterial: {
      introduction: 'Data is split over several tables so nothing is stored twice. An order stores only customer_id, not the customer\'s name. A join puts the tables back together in the result: it matches rows from two tables using a related column, usually a foreign key and the primary key it points to.',
      objectives: [
        'Join two tables with INNER JOIN ... ON',
        'Keep unmatched rows with LEFT JOIN',
        'Know what RIGHT JOIN, FULL JOIN and CROSS JOIN return',
        'Join a table to itself and join three tables'
      ],
      sections: [
        {
          heading: 'INNER JOIN',
          text: 'INNER JOIN returns only the rows that have a match in both tables. ON says which columns must match.',
          bulletPoints: [
            'SELECT ... FROM orders o JOIN customers c ON o.customer_id = c.customer_id',
            'JOIN on its own means INNER JOIN.',
            'Use table aliases (o, c) and write alias.column, so it is clear which table each column comes from.'
          ]
        },
        {
          heading: 'Types of join',
          text: 'The join type decides what happens to rows that have no match.',
          table: {
            headers: ['Join', 'Returns'],
            rows: [
              ['INNER JOIN', 'Only rows with a match in both tables'],
              ['LEFT JOIN', 'All rows from the left table, plus matches from the right (NULL where there is none)'],
              ['RIGHT JOIN', 'All rows from the right table, plus matches from the left'],
              ['FULL JOIN', 'All rows from both tables, matched where possible'],
              ['CROSS JOIN', 'Every row combined with every row (all combinations)']
            ]
          },
          bulletPoints: [
            'LEFT JOIN + WHERE right_table.column IS NULL finds rows with no match, for example customers who never ordered.'
          ]
        },
        {
          heading: 'Self join',
          text: 'A table can be joined to itself. employees.manager_id holds the emp_id of another employee, so joining employees to employees shows each person next to their manager. Use two different aliases (e for the employee, m for the manager).'
        },
        {
          heading: 'Joining three or more tables',
          text: 'Add one JOIN per table. To list which products each customer bought you go customers → orders → order_items → products.'
        }
      ],
      codeExamples: [
        {
          title: 'INNER JOIN: orders with customer names',
          language: 'sql',
          code: 'SELECT o.order_id, c.name, o.order_date, o.total_amount\nFROM orders AS o\nJOIN customers AS c ON o.customer_id = c.customer_id\nORDER BY o.order_id;',
          explanation: 'Each order gets the name of its customer: order 1001 belongs to Arjun Rao.'
        },
        {
          title: 'LEFT JOIN: every department, even empty ones',
          language: 'sql',
          code: "INSERT INTO departments VALUES (5, 'Legal', 'Delhi');\n\nSELECT d.dept_name, COUNT(e.emp_id) AS employees\nFROM departments AS d\nLEFT JOIN employees AS e ON e.dept_id = d.dept_id\nGROUP BY d.dept_name\nORDER BY employees DESC;",
          explanation: 'The new Legal department has nobody, but LEFT JOIN still lists it with 0 employees. An INNER JOIN would drop it.'
        },
        {
          title: 'Self join: employee and manager',
          language: 'sql',
          code: "SELECT e.first_name AS employee,\n       m.first_name AS manager\nFROM employees AS e\nLEFT JOIN employees AS m ON e.manager_id = m.emp_id\nORDER BY e.emp_id;",
          explanation: 'Diya and Vihaan report to Aarav. Employees with no manager show NULL in the manager column.'
        },
        {
          title: 'Three tables: who bought what',
          language: 'sql',
          code: 'SELECT c.name AS customer, p.name AS product, oi.quantity\nFROM customers AS c\nJOIN orders      AS o  ON o.customer_id = c.customer_id\nJOIN order_items AS oi ON oi.order_id   = o.order_id\nJOIN products    AS p  ON p.product_id  = oi.product_id\nORDER BY c.name;',
          explanation: 'Each JOIN adds one table. The result lists 8 purchases: for example Arjun Rao bought a Laptop Pro 14, headphones and a book.'
        }
      ],
      bestPractices: [
        'Join on the foreign key and the primary key it refers to.',
        'Always qualify columns with the table alias when more than one table is used.',
        'Use LEFT JOIN when you must not lose rows from the main table.'
      ],
      commonMistakes: [
        'Forgetting the ON condition, which combines every row with every row.',
        'Putting a condition on the right table in WHERE after a LEFT JOIN - it removes the NULL rows and turns it into an inner join. Put it in ON instead.',
        'Ambiguous column names: name exists in both customers and products, so write c.name or p.name.'
      ],
      practiceExercise: {
        title: 'Department report',
        problem: 'Show each employee\'s first_name, their department name and the department location, ordered by department name and then first_name.',
        solutionCode: 'SELECT e.first_name, d.dept_name, d.location\nFROM employees AS e\nJOIN departments AS d ON e.dept_id = d.dept_id\nORDER BY d.dept_name, e.first_name;'
      },
      keyTakeaways: [
        'A join matches rows from two tables using ON.',
        'INNER JOIN keeps only matches; LEFT JOIN keeps every row of the left table.',
        'A self join compares rows of the same table (employee and manager).',
        'Add one JOIN per extra table.'
      ]
    }
  }
};
