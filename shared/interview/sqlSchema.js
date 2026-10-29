// Practice database for the SQL Interview 50 set. Every problem runs against a fresh copy of it,
// so a learner's DELETE or DROP never affects the next run.
export const INTERVIEW_SQL_TABLES = ['departments', 'employees', 'customers', 'products', 'orders', 'order_items', 'logins', 'scores', 'weather'];

export const INTERVIEW_SQL_SCHEMA = `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL, city TEXT);
INSERT INTO departments VALUES
 (1,'Engineering','Bengaluru'),(2,'Sales','Mumbai'),(3,'Marketing','Delhi'),
 (4,'HR','Hyderabad'),(5,'Finance','Chennai'),(6,'Legal','Pune');

CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, name TEXT NOT NULL, dept_id INTEGER REFERENCES departments(dept_id),
  salary INTEGER, manager_id INTEGER, hire_date TEXT);
INSERT INTO employees VALUES
 (1,'Arjun Rao',1,150000,NULL,'2018-03-12'),
 (2,'Priya Nair',1,120000,1,'2019-07-01'),
 (3,'Kiran Shah',1,120000,1,'2020-01-15'),
 (4,'Meera Iyer',1,95000,2,'2021-06-20'),
 (5,'Rahul Verma',2,110000,1,'2018-11-05'),
 (6,'Sneha Gupta',2,70000,5,'2022-02-14'),
 (7,'Vikram Singh',2,115000,5,'2021-09-30'),
 (8,'Anita Das',3,88000,1,'2019-04-22'),
 (9,'Rohan Mehta',3,90000,8,'2023-01-09'),
 (10,'Divya Pillai',4,65000,1,'2020-08-17'),
 (11,'Farhan Ali',4,52000,10,'2023-05-02'),
 (12,'Lakshmi Menon',5,98000,1,'2017-12-01'),
 (13,'Sanjay Kumar',5,98000,12,'2022-10-10'),
 (14,'Neha Joshi',NULL,45000,NULL,'2024-03-18');

CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, email TEXT, signup_date TEXT, referred_by INTEGER);
INSERT INTO customers VALUES
 (1,'Aisha Khan','Mumbai','aisha@gmail.com','2023-01-05',NULL),
 (2,'Ben Thomas','Bengaluru','ben@yahoo.com','2023-02-11',1),
 (3,'Chitra Rao','Chennai','chitra@gmail.com','2023-02-20',1),
 (4,'Dev Patel','Mumbai','dev@outlook.com','2023-03-02',NULL),
 (5,'Esha Sen','Delhi','esha@gmail.com','2023-04-18',2),
 (6,'Faisal Qureshi','Bengaluru','ben@yahoo.com','2023-05-07',NULL),
 (7,'Gita Bose','Kolkata','gita@yahoo.com','2023-06-25',4),
 (8,'Hari Krishnan','Chennai','hari@gmail.com','2023-07-14',NULL);

CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT, price INTEGER);
INSERT INTO products VALUES
 (1,'Laptop','Electronics',55000),(2,'Headphones','Electronics',2500),(3,'Phone','Electronics',30000),
 (4,'Desk','Furniture',12000),(5,'Chair','Furniture',7000),(6,'Notebook','Stationery',120),
 (7,'Pen Set','Stationery',350),(8,'Monitor','Electronics',15000);

CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(customer_id), order_date TEXT, status TEXT, amount INTEGER);
INSERT INTO orders VALUES
 (1,1,'2024-01-05','delivered',60000),(2,2,'2024-01-18','delivered',1900),(3,1,'2024-02-02','delivered',30000),
 (4,3,'2024-02-14','cancelled',12000),(5,4,'2024-02-20','delivered',28000),(6,2,'2024-03-03','shipped',3100),
 (7,5,'2024-03-15','delivered',55000),(8,1,'2024-03-28','delivered',2400),(9,6,'2024-04-02','delivered',38000),
 (10,7,'2024-04-10','pending',60000),(11,4,'2024-04-22','delivered',7500),(12,3,'2024-05-01','delivered',1750);

CREATE TABLE order_items (order_id INTEGER REFERENCES orders(order_id), product_id INTEGER REFERENCES products(product_id), quantity INTEGER, unit_price INTEGER);
INSERT INTO order_items VALUES
 (1,1,1,55000),(1,2,2,2500),(2,6,10,120),(2,7,2,350),(3,3,1,30000),(4,4,1,12000),(5,5,4,7000),
 (6,2,1,2500),(6,6,5,120),(7,1,1,55000),(8,6,20,120),(9,4,2,12000),(9,5,2,7000),(10,3,2,30000),
 (11,2,3,2500),(12,7,5,350);

CREATE TABLE logins (user_id INTEGER, login_date TEXT);
INSERT INTO logins VALUES
 (1,'2024-06-01'),(1,'2024-06-02'),(1,'2024-06-03'),(1,'2024-06-05'),
 (2,'2024-06-01'),(2,'2024-06-01'),(2,'2024-06-04'),
 (3,'2024-06-02'),(3,'2024-06-03'),(3,'2024-06-04'),(3,'2024-06-05'),
 (4,'2024-06-05');

CREATE TABLE scores (student TEXT, subject TEXT, marks INTEGER);
INSERT INTO scores VALUES
 ('Asha','Math',92),('Asha','Science',85),('Asha','English',78),
 ('Bala','Math',92),('Bala','Science',70),('Bala','English',88),
 ('Chen','Math',75),('Chen','Science',95),('Chen','English',80),
 ('Dina','Math',60),('Dina','Science',85),('Dina','English',91);

CREATE TABLE weather (day TEXT PRIMARY KEY, temperature INTEGER);
INSERT INTO weather VALUES
 ('2024-07-01',30),('2024-07-02',32),('2024-07-03',31),('2024-07-04',34),('2024-07-05',34),('2024-07-06',29);
`;
