// Sample database used by the SQL Practice Lab (browser, sql.js) and by the exercise
// verification tests (Node, sql.js). Keep both in sync by importing from here only.
export const SAMPLE_SCHEMA = `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL, location TEXT);
CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, email TEXT UNIQUE, dept_id INTEGER REFERENCES departments(dept_id), salary REAL, hire_date TEXT, manager_id INTEGER);
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT, city TEXT, signup_date TEXT);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(customer_id), order_date TEXT, status TEXT, total_amount REAL);
CREATE TABLE order_items (item_id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(order_id), product_id INTEGER REFERENCES products(product_id), quantity INTEGER, unit_price REAL);
INSERT INTO departments VALUES (1,'Engineering','Hyderabad'),(2,'Sales','Mumbai'),(3,'Marketing','Bengaluru'),(4,'Finance','Chennai');
INSERT INTO employees VALUES
 (101,'Aarav','Sharma','aarav@arb.io',1,98000,'2021-03-14',NULL),(102,'Diya','Reddy','diya@arb.io',1,87000,'2022-06-01',101),
 (103,'Kabir','Mehta','kabir@arb.io',2,64000,'2020-11-20',NULL),(104,'Ananya','Iyer','ananya@arb.io',2,58000,'2023-01-09',103),
 (105,'Rohan','Gupta','rohan@arb.io',3,61000,'2021-08-30',NULL),(106,'Meera','Nair','meera@arb.io',4,72000,'2019-05-17',NULL),
 (107,'Vihaan','Das','vihaan@arb.io',1,79000,'2024-02-12',101),(108,'Isha','Patel','isha@arb.io',3,55000,'2024-07-01',105);
INSERT INTO customers VALUES (1,'Arjun Rao','Hyderabad','2023-01-05'),(2,'Sara Khan','Mumbai','2023-03-22'),(3,'Neel Joshi','Pune','2023-07-11'),(4,'Tara Singh','Delhi','2024-02-02'),(5,'Zoya Ali','Hyderabad','2024-05-19');
INSERT INTO products VALUES (1,'Laptop Pro 14','Electronics',1299.0),(2,'Noise-Cancel Headphones','Electronics',249.0),(3,'Standing Desk','Furniture',499.0),(4,'Ergo Chair','Furniture',329.0),(5,'Python Crash Course','Books',39.0);
INSERT INTO orders VALUES (1001,1,'2024-06-01','DELIVERED',1548.0),(1002,2,'2024-06-03','SHIPPED',499.0),(1003,1,'2024-06-10','DELIVERED',39.0),(1004,3,'2024-06-15','CANCELLED',329.0),(1005,4,'2024-07-02','PENDING',1338.0),(1006,5,'2024-07-04','DELIVERED',249.0);
INSERT INTO order_items VALUES (1,1001,1,1,1299.0),(2,1001,2,1,249.0),(3,1002,3,1,499.0),(4,1003,5,1,39.0),(5,1004,4,1,329.0),(6,1005,1,1,1299.0),(7,1005,5,1,39.0),(8,1006,2,1,249.0);
`;
