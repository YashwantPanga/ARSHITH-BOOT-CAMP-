// Data Science & AI - detailed step-by-step sections for modules 1-5. Python examples run in the
// Practice Lab (numpy, pandas, matplotlib and scikit-learn load automatically); their output and
// charts are generated into results.json.
const py = (s) => ({ language: 'python', ...s });

export default {
  'ai-ds-mod-1': [
    {
      heading: 'AI, Machine Learning, Deep Learning and Data Science',
      text: 'These words are related but not the same. Artificial Intelligence is the big goal: computers doing tasks that need human-like intelligence. Machine Learning is the main way to get there: instead of writing rules by hand, the computer learns patterns from examples. Deep Learning is machine learning with large neural networks. Data Science is using data - statistics, programming and ML - to answer questions and make decisions.',
      table: {
        headers: ['Term', 'In one line', 'Example'],
        rows: [
          ['AI', 'machines doing "intelligent" tasks', 'a chess program, a chatbot'],
          ['Machine Learning', 'learning patterns from data', 'spam filter that learns from emails'],
          ['Deep Learning', 'ML with many-layered neural networks', 'face recognition, ChatGPT'],
          ['Data Science', 'answering questions with data', 'which products sell best and why']
        ]
      }
    },
    {
      heading: 'The data science workflow',
      text: 'Almost every project follows the same steps. This course teaches one module per step.',
      table: {
        headers: ['Step', 'Question', 'Module'],
        rows: [
          ['1. Ask', 'What problem are we solving?', '1'],
          ['2. Collect', 'Where does the data come from?', '2, 4'],
          ['3. Clean', 'Is the data correct and complete?', '5'],
          ['4. Explore', 'What patterns are there?', '6, 7, 8'],
          ['5. Model', 'Can we predict or group?', '9 - 12, 14'],
          ['6. Evaluate', 'How good is the model?', '13'],
          ['7. Share / deploy', 'Who uses the result, and how?', '15']
        ]
      }
    },
    py({
      heading: 'A first look at real data',
      text: 'Data scientists use Python with the pandas library. Here a small table of students is created and summarised in three lines - this is what the course builds on.',
      code: 'import pandas as pd\ndf = pd.DataFrame({\n    "name": ["Aarav", "Diya", "Kabir", "Meera", "Rohan"],\n    "hours_studied": [5, 9, 2, 7, 4],\n    "marks": [62, 91, 40, 80, 55]\n})\nprint(df)\nprint("Average marks:", df["marks"].mean())\nprint("Correlation hours vs marks:", round(df["hours_studied"].corr(df["marks"]), 2))',
      note: 'A correlation near 1 means "more hours, higher marks". You will learn exactly what it means in module 7.'
    }),
    {
      heading: 'Kinds of data',
      text: 'Recognising the type of each column decides which charts, statistics and models you can use.',
      table: {
        headers: ['Type', 'Meaning', 'Example'],
        rows: [
          ['Numerical - continuous', 'any value in a range', 'height, price, temperature'],
          ['Numerical - discrete', 'counts', 'number of orders'],
          ['Categorical - nominal', 'labels with no order', 'city, colour'],
          ['Categorical - ordinal', 'labels with an order', 'low / medium / high'],
          ['Text', 'free text', 'reviews, emails'],
          ['Time', 'dates and times', 'order date']
        ]
      },
      bulletPoints: [
        'Structured data fits in tables (rows and columns). Unstructured data - images, audio, text - needs extra processing.'
      ],
      language: 'python',
      code: 'import pandas as pd\norders = pd.DataFrame({\n    "amount": [1299.0, 499.5, 39.0],          # continuous\n    "items": [2, 1, 3],                        # discrete\n    "city": ["Pune", "Delhi", "Pune"],         # nominal\n    "priority": ["high", "low", "medium"],     # ordinal\n    "ordered_on": pd.to_datetime(["2024-06-01", "2024-06-03", "2024-06-10"]),  # time\n})\nprint(orders.dtypes)\nprint("different cities:", orders["city"].nunique())'
    },
    {
      heading: 'Types of machine learning',
      text: 'Machine learning problems fall into a few families.',
      table: {
        headers: ['Type', 'Learns from', 'Task', 'Example'],
        rows: [
          ['Supervised - regression', 'examples with a number answer', 'predict a number', 'house price'],
          ['Supervised - classification', 'examples with a category answer', 'predict a category', 'spam or not spam'],
          ['Unsupervised - clustering', 'data with no answers', 'find groups', 'customer segments'],
          ['Reinforcement learning', 'rewards from trying actions', 'learn a strategy', 'game-playing agents']
        ]
      }
    },
    py({
      heading: 'Prediction in 6 lines',
      text: 'A preview of module 9: a model learns the link between hours studied and marks, then predicts marks for a student who studied 6 hours. You do not need to understand every line yet.',
      code: 'from sklearn.linear_model import LinearRegression\nhours = [[5], [9], [2], [7], [4]]\nmarks = [62, 91, 40, 80, 55]\nmodel = LinearRegression().fit(hours, marks)\nprint("Predicted marks for 6 hours:", round(model.predict([[6]])[0], 1))\nprint("Each extra hour adds about", round(model.coef_[0], 1), "marks")'
    }),
    {
      heading: 'Tools of a data scientist',
      text: 'You will use these throughout the course; all of them are free.',
      table: {
        headers: ['Tool', 'Used for'],
        rows: [
          ['Python', 'the programming language'],
          ['NumPy', 'fast maths on arrays of numbers'],
          ['pandas', 'tables of data: load, clean, analyse'],
          ['matplotlib / seaborn', 'charts'],
          ['scikit-learn', 'machine learning models'],
          ['Jupyter Notebook / Google Colab', 'writing code, notes and charts together'],
          ['SQL', 'getting data out of databases']
        ]
      },
      note: 'Google Colab runs Python notebooks in the browser for free, with GPUs for deep learning.'
    },
    {
      heading: 'Responsible AI',
      text: 'Models learn from data, including its mistakes and biases. A hiring model trained on past decisions can copy past unfairness. Good data scientists check who could be harmed, protect personal data, explain how their models decide, and never present a guess as a certainty.',
      bulletPoints: [
        'Fairness: does the model work equally well for different groups?',
        'Privacy: remove names, phone numbers and other personal data you do not need.',
        'Transparency: be able to explain what the model uses to decide.'
      ]
    }
  ],

  'ai-ds-mod-2': [
    py({
      heading: 'Python for data: lists of records',
      text: 'Before pandas, data is often a list of dictionaries - one dictionary per row. Loops, comprehensions and built-in functions already answer many questions.',
      code: 'sales = [\n    {"product": "Laptop", "city": "Hyderabad", "amount": 1299},\n    {"product": "Chair", "city": "Pune", "amount": 329},\n    {"product": "Desk", "city": "Hyderabad", "amount": 499},\n]\ntotal = sum(s["amount"] for s in sales)\nhyd = [s["product"] for s in sales if s["city"] == "Hyderabad"]\nprint("Total:", total)\nprint("Sold in Hyderabad:", hyd)\nprint("Biggest sale:", max(sales, key=lambda s: s["amount"])["product"])'
    }),
    py({
      heading: 'Comprehensions for transforming data',
      text: 'List and dictionary comprehensions turn one collection into another in a single readable line - converting units, cleaning values, building look-up tables.',
      code: 'temps_c = [31.5, 29.0, 35.2, 27.8]\ntemps_f = [round(c * 9 / 5 + 32, 1) for c in temps_c]\nprint(temps_f)\n\nnames = [" aarav ", "DIYA", "kabir"]\nclean = [n.strip().title() for n in names]\nprint(clean)\n\nlengths = {n: len(n) for n in clean}\nprint(lengths)'
    }),
    py({
      heading: 'Counting with collections.Counter',
      text: 'Counter counts how often each value appears - the first question asked of almost any categorical column.',
      code: 'from collections import Counter\ncities = ["Hyderabad", "Pune", "Hyderabad", "Delhi", "Pune", "Hyderabad"]\ncounts = Counter(cities)\nprint(counts)\nprint(counts.most_common(2))'
    }),
    py({
      heading: 'Functions for repeatable analysis',
      text: 'Wrap a calculation you need more than once in a function. It makes analysis consistent and easy to test.',
      code: 'def summary(values):\n    """Return count, mean, minimum and maximum of a list of numbers."""\n    n = len(values)\n    return {"count": n, "mean": round(sum(values) / n, 2), "min": min(values), "max": max(values)}\n\nprint(summary([62, 91, 40, 80, 55]))\nprint(summary([1299, 329, 499]))'
    }),
    py({
      heading: 'Reading a CSV file with the csv module',
      text: 'CSV is the most common format for data files. Python\'s csv module reads it row by row. (Here the file is created first so the example is self-contained.)',
      code: 'import csv\nwith open("students.csv", "w", newline="") as f:\n    f.write("name,city,marks\\nAarav,Hyderabad,62\\nDiya,Pune,91\\nKabir,Delhi,40\\n")\n\nwith open("students.csv") as f:\n    rows = list(csv.DictReader(f))\nprint(rows[0])\npassed = [r["name"] for r in rows if int(r["marks"]) >= 50]\nprint("Passed:", passed)',
      note: 'Every value read from a CSV is text - convert numbers with int() or float(). pandas does this automatically (module 4).'
    }),
    py({
      heading: 'Working with dates',
      text: 'The datetime module parses dates, calculates differences and extracts parts such as the month or weekday - essential for sales and time data.',
      code: 'from datetime import datetime, timedelta\norder = datetime.strptime("2024-06-15", "%Y-%m-%d")\nprint(order.strftime("%d %B %Y, %A"))\ndelivery = order + timedelta(days=5)\nprint("Delivery:", delivery.date())\nprint("Days from order to 1 July:", (datetime(2024, 7, 1) - order).days)'
    }),
    py({
      heading: 'Handling bad values',
      text: 'Real data contains mistakes: empty cells, text in number columns. try / except lets you convert what you can and record what you could not.',
      code: 'raw = ["62", "91", "", "forty", "55"]\nmarks, problems = [], []\nfor value in raw:\n    try:\n        marks.append(int(value))\n    except ValueError:\n        problems.append(value)\nprint("Usable:", marks)\nprint("Could not read:", problems)'
    }),
    py({
      heading: 'From lists to pandas',
      text: 'Everything above gets shorter with pandas. A list of dictionaries becomes a DataFrame in one line, and summaries become single method calls. The next two modules introduce NumPy and pandas properly.',
      code: 'import pandas as pd\nsales = [\n    {"product": "Laptop", "city": "Hyderabad", "amount": 1299},\n    {"product": "Chair", "city": "Pune", "amount": 329},\n    {"product": "Desk", "city": "Hyderabad", "amount": 499},\n]\ndf = pd.DataFrame(sales)\nprint(df)\nprint(df.groupby("city")["amount"].sum())'
    })
  ],

  'ai-ds-mod-3': [
    py({
      heading: 'Why NumPy?',
      text: 'NumPy stores numbers in arrays and does maths on the whole array at once - far faster than Python loops, and the foundation of pandas, scikit-learn and deep learning libraries.',
      code: 'import numpy as np\nprices = np.array([499, 1299, 249, 329])\nprint(prices * 1.18)          # tax on every price at once\nprint(prices.sum(), prices.mean(), prices.max())',
      note: 'By convention NumPy is imported as np.'
    }),
    py({
      heading: 'Creating arrays',
      text: 'Arrays can be made from lists or with helper functions for common patterns.',
      code: 'import numpy as np\nprint(np.array([1, 2, 3]))\nprint(np.zeros(4))\nprint(np.ones((2, 3)))\nprint(np.arange(0, 10, 2))\nprint(np.linspace(0, 1, 5))\nprint(np.eye(3))'
    }),
    py({
      heading: 'Shape, dimensions and type',
      text: 'shape gives the size in each dimension, ndim the number of dimensions, dtype the type of the numbers. reshape changes the shape without changing the data.',
      code: 'import numpy as np\na = np.arange(12)\nprint(a.shape, a.ndim, a.dtype)\nm = a.reshape(3, 4)\nprint(m)\nprint(m.shape, m.ndim)\nprint(m.T.shape)     # transpose: rows become columns'
    }),
    py({
      heading: 'Indexing and slicing',
      text: 'Arrays use [ ] like lists. In 2-D arrays, [row, column] selects; slices work in each dimension.',
      code: 'import numpy as np\nm = np.array([[10, 20, 30],\n              [40, 50, 60],\n              [70, 80, 90]])\nprint(m[0, 1])        # row 0, column 1\nprint(m[1])           # whole row 1\nprint(m[:, 2])        # whole column 2\nprint(m[0:2, 1:3])    # top-right 2x2 block'
    }),
    py({
      heading: 'Vectorised maths',
      text: 'Operators work element by element between arrays of the same shape, and NumPy has fast functions (np.sqrt, np.log, np.round...) for whole arrays.',
      code: 'import numpy as np\nprice = np.array([100, 250, 400])\nqty = np.array([3, 1, 2])\nprint("line totals:", price * qty)\nprint("order total:", (price * qty).sum())\nprint(np.sqrt([16, 25, 81]))\nprint(np.round(np.array([1.234, 5.678]), 1))'
    }),
    py({
      heading: 'Broadcasting',
      text: 'When shapes differ, NumPy stretches the smaller one where it can. A single number applies to every element; a row applies to every row.',
      code: 'import numpy as np\nmarks = np.array([[60, 70, 80],\n                  [55, 65, 90]])\nbonus = np.array([5, 0, 2])        # one bonus per subject\nprint(marks + 10)\nprint(marks + bonus)'
    }),
    py({
      heading: 'Aggregations along an axis',
      text: 'sum, mean, min, max and std can work on the whole array, or along an axis: axis=0 goes down the columns, axis=1 across the rows.',
      code: 'import numpy as np\nmarks = np.array([[60, 70, 80],     # student 1\n                  [55, 65, 90],     # student 2\n                  [75, 85, 70]])    # student 3\nprint("overall mean:", marks.mean())\nprint("per subject (axis=0):", marks.mean(axis=0))\nprint("per student (axis=1):", marks.mean(axis=1).round(1))\nprint("best subject per student:", marks.argmax(axis=1))'
    }),
    py({
      heading: 'Boolean masks',
      text: 'A comparison on an array gives an array of True / False. Use it inside [ ] to keep only matching values - this is how filtering works in NumPy and pandas.',
      code: 'import numpy as np\nmarks = np.array([62, 91, 40, 80, 55, 38])\npassed = marks >= 50\nprint(passed)\nprint("passing marks:", marks[passed])\nprint("number passed:", passed.sum())\nprint(np.where(marks >= 50, "pass", "fail"))'
    }),
    py({
      heading: 'Random numbers',
      text: 'np.random creates random data for simulations and for splitting datasets. A seed makes the "random" numbers the same every run, so results can be repeated.',
      code: 'import numpy as np\nrng = np.random.default_rng(seed=42)\nprint(rng.integers(1, 7, size=10))           # 10 dice rolls\nheights = rng.normal(loc=165, scale=8, size=1000)\nprint(round(heights.mean(), 1), round(heights.std(), 1))\nprint(rng.choice(["red", "green", "blue"], size=5))'
    })
  ],

  'ai-ds-mod-4': [
    py({
      heading: 'Series and DataFrame',
      text: 'pandas has two main objects. A Series is one column of values with an index (labels). A DataFrame is a table: several Series sharing the same index. pandas is imported as pd.',
      code: 'import pandas as pd\nmarks = pd.Series([62, 91, 40], index=["Aarav", "Diya", "Kabir"])\nprint(marks)\nprint(marks["Diya"])\n\ndf = pd.DataFrame({"name": ["Aarav", "Diya", "Kabir"], "marks": [62, 91, 40], "city": ["Hyderabad", "Pune", "Delhi"]})\nprint(df)'
    }),
    py({
      heading: 'Loading data',
      text: 'pd.read_csv reads a CSV file (or a URL) into a DataFrame and converts numbers automatically. pandas also reads Excel (read_excel), JSON (read_json) and SQL queries (read_sql).',
      syntax: 'df = pd.read_csv("sales.csv")',
      code: 'import pandas as pd\nfrom io import StringIO\ncsv_text = """order_id,city,product,qty,price\n1001,Hyderabad,Laptop,1,1299\n1002,Mumbai,Desk,1,499\n1003,Hyderabad,Book,3,39\n1004,Pune,Chair,2,329\n1005,Delhi,Laptop,1,1299"""\ndf = pd.read_csv(StringIO(csv_text))\nprint(df.head(3))\nprint(df.shape)\nprint(df.dtypes)'
    }),
    py({
      heading: 'Selecting columns',
      text: 'df["col"] gives one column as a Series; df[["a", "b"]] gives several as a DataFrame.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"name": ["Aarav", "Diya", "Kabir"], "marks": [62, 91, 40], "city": ["Hyderabad", "Pune", "Delhi"]})\nprint(df["name"])\nprint(df[["name", "marks"]])'
    }),
    py({
      heading: 'Selecting rows: loc and iloc',
      text: 'iloc selects by position (like a list); loc selects by label and also accepts conditions. Both take [rows, columns].',
      code: 'import pandas as pd\ndf = pd.DataFrame({"name": ["Aarav", "Diya", "Kabir", "Meera"], "marks": [62, 91, 40, 80]})\nprint(df.iloc[0])           # first row\nprint(df.iloc[1:3])         # rows 1 and 2\nprint(df.loc[df["marks"] > 60, "name"])'
    }),
    py({
      heading: 'Filtering rows',
      text: 'A condition on a column gives True/False for every row; put it in [ ] to keep the True rows. Combine conditions with & (and) and | (or), each in brackets.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"product": ["Laptop", "Desk", "Book", "Chair", "Laptop"], "city": ["Hyderabad", "Mumbai", "Hyderabad", "Pune", "Delhi"], "price": [1299, 499, 39, 329, 1299]})\nprint(df[df["price"] > 300])\nprint(df[(df["city"] == "Hyderabad") & (df["price"] < 100)])\nprint(df[df["city"].isin(["Pune", "Delhi"])])'
    }),
    py({
      heading: 'Sorting and new columns',
      text: 'sort_values sorts by one or more columns. New columns are calculated from existing ones for every row at once.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"product": ["Laptop", "Desk", "Book", "Chair"], "qty": [1, 1, 3, 2], "price": [1299, 499, 39, 329]})\ndf["total"] = df["qty"] * df["price"]\ndf["size"] = df["total"].apply(lambda t: "big" if t > 600 else "small")\nprint(df.sort_values("total", ascending=False))'
    }),
    py({
      heading: 'Summaries: describe, value_counts, groupby',
      text: 'describe() gives the main statistics of every number column. value_counts() counts categories. groupby splits the rows into groups and summarises each - the pandas version of SQL GROUP BY.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"city": ["Hyderabad", "Mumbai", "Hyderabad", "Pune", "Delhi", "Pune"], "amount": [1548, 499, 39, 658, 1299, 120]})\nprint(df["amount"].describe().round(1))\nprint(df["city"].value_counts())\nprint(df.groupby("city")["amount"].agg(["count", "sum", "mean"]).round(1))'
    }),
    py({
      heading: 'Combining tables: merge',
      text: 'merge joins two DataFrames on a common column, like a SQL JOIN. how="left" keeps every row of the left table.',
      code: 'import pandas as pd\norders = pd.DataFrame({"order_id": [1, 2, 3], "customer_id": [10, 20, 10], "amount": [500, 300, 200]})\ncustomers = pd.DataFrame({"customer_id": [10, 20, 30], "name": ["Arjun", "Sara", "Neel"]})\nmerged = orders.merge(customers, on="customer_id", how="left")\nprint(merged)\nprint(merged.groupby("name")["amount"].sum())'
    })
  ],

  'ai-ds-mod-5': [
    py({
      heading: 'Why cleaning matters',
      text: 'Real data is messy: missing values, duplicates, wrong types, spelling variants, impossible values. A model trained on messy data gives wrong answers ("garbage in, garbage out"). Cleaning often takes most of a project\'s time. Always start by looking.',
      code: 'import pandas as pd\nimport numpy as np\ndf = pd.DataFrame({\n    "name": ["Aarav", "Diya", "Diya", "kabir ", "Meera"],\n    "age": [21, np.nan, np.nan, 23, 230],\n    "city": ["Hyderabad", "pune", "pune", "Delhi", None],\n    "fee": ["99", "99", "99", "free", "99"]\n})\nprint(df)\ndf.info()'
    }),
    py({
      heading: 'Finding missing values',
      text: 'Missing values show as NaN or None. isna().sum() counts them per column - the first thing to check.',
      code: 'import pandas as pd\nimport numpy as np\ndf = pd.DataFrame({"age": [21, np.nan, 23, np.nan], "city": ["Pune", None, "Delhi", "Pune"], "marks": [62, 91, 40, 80]})\nprint(df.isna().sum())\nprint("rows with any missing value:", df.isna().any(axis=1).sum())'
    }),
    py({
      heading: 'Dropping or filling missing values',
      text: 'dropna() removes rows with missing values - fine when few rows are affected. fillna() replaces them: with the median for numbers (robust to outliers), the most common value for categories, or a label like "unknown".',
      code: 'import pandas as pd\nimport numpy as np\ndf = pd.DataFrame({"age": [21, np.nan, 23, 30], "city": ["Pune", None, "Delhi", "Pune"]})\nprint(df.dropna())\nfilled = df.copy()\nfilled["age"] = filled["age"].fillna(filled["age"].median())\nfilled["city"] = filled["city"].fillna(filled["city"].mode()[0])\nprint(filled)'
    }),
    py({
      heading: 'Removing duplicates',
      text: 'duplicated() marks rows that repeat an earlier row; drop_duplicates() removes them. Use subset= to compare only some columns, such as an email.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"email": ["a@x.com", "b@x.com", "a@x.com", "c@x.com"], "name": ["Aarav", "Diya", "Aarav", "Kabir"]})\nprint(df.duplicated().sum(), "duplicate rows")\nprint(df.drop_duplicates())\nprint(df.drop_duplicates(subset="email", keep="last"))'
    }),
    py({
      heading: 'Fixing text and types',
      text: 'Text columns need consistent spelling and case; number columns stored as text must be converted. pd.to_numeric(errors="coerce") turns values it cannot read into NaN instead of failing.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"city": [" Hyderabad", "pune", "PUNE ", "Delhi"], "fee": ["99", "99", "free", "1,299"], "joined": ["2024-01-05", "2024-02-10", "2024-03-01", "2024-03-15"]})\ndf["city"] = df["city"].str.strip().str.title()\ndf["fee"] = pd.to_numeric(df["fee"].str.replace(",", ""), errors="coerce")\ndf["joined"] = pd.to_datetime(df["joined"])\nprint(df)\nprint(df.dtypes)'
    }),
    py({
      heading: 'Finding outliers with the IQR rule',
      text: 'Outliers are values far from the rest - an age of 230 is a typing mistake. A common rule: values more than 1.5 × IQR below the first quartile or above the third quartile are suspicious.',
      code: 'import pandas as pd\nages = pd.Series([21, 23, 22, 25, 24, 230, 22, 26])\nq1, q3 = ages.quantile(0.25), ages.quantile(0.75)\niqr = q3 - q1\nlow, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr\nprint(f"normal range: {low} to {high}")\nprint("outliers:", ages[(ages < low) | (ages > high)].tolist())',
      note: 'Do not delete outliers blindly: check whether they are mistakes or real but rare (a very large order).'
    }),
    py({
      heading: 'Encoding categories as numbers',
      text: 'Models need numbers. One-hot encoding turns a category column into several 0/1 columns, one per category. Ordinal categories (low/medium/high) can be mapped to 0, 1, 2 instead.',
      code: 'import pandas as pd\ndf = pd.DataFrame({"city": ["Pune", "Delhi", "Pune", "Mumbai"], "level": ["low", "high", "medium", "low"]})\ndf["level_num"] = df["level"].map({"low": 0, "medium": 1, "high": 2})\nprint(pd.get_dummies(df, columns=["city"], dtype=int))'
    }),
    py({
      heading: 'Scaling numbers',
      text: 'Columns on very different scales (age 20-60, salary 20,000-2,000,000) confuse many models. Standardisation turns each column into "how many standard deviations from the mean"; min-max scaling squeezes it into 0-1.',
      code: 'import pandas as pd\nfrom sklearn.preprocessing import StandardScaler, MinMaxScaler\ndf = pd.DataFrame({"age": [22, 35, 48, 60], "salary": [25000, 60000, 90000, 150000]})\nprint(pd.DataFrame(StandardScaler().fit_transform(df), columns=df.columns).round(2))\nprint(pd.DataFrame(MinMaxScaler().fit_transform(df), columns=df.columns).round(2))'
    })
  ]
};
