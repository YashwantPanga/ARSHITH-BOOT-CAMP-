// Data Science & AI - detailed step-by-step sections for modules 6-10 (see ai-sections.part1.js).
const py = (s) => ({ language: 'python', ...s });

export default {
  'ai-ds-mod-6': [
    py({
      heading: 'Why visualise?',
      text: 'People understand pictures far faster than tables. A chart shows trends, comparisons and unusual values at a glance. matplotlib is Python\'s main charting library; the chart appears under the output.',
      code: 'import matplotlib.pyplot as plt\nplt.figure(figsize=(5, 3))\nplt.plot([1, 2, 3, 4, 5], [10, 14, 13, 18, 22], marker="o")\nplt.title("My first chart")\nplt.show()'
    }),
    py({
      heading: 'Line charts: change over time',
      text: 'Use a line chart for values over time. Label both axes and give the chart a title that says what to notice.',
      code: 'import matplotlib.pyplot as plt\nmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]\nonline = [120, 135, 160, 150, 190, 220]\nstore = [100, 98, 105, 110, 104, 108]\nplt.figure(figsize=(6, 3.2))\nplt.plot(months, online, marker="o", label="Online")\nplt.plot(months, store, marker="s", label="Store")\nplt.title("Online sales doubled in six months")\nplt.ylabel("Orders")\nplt.legend()\nplt.grid(alpha=0.3)\nplt.show()'
    }),
    py({
      heading: 'Bar charts: comparing categories',
      text: 'Use bars to compare amounts between categories. Sort the bars so the order means something; horizontal bars suit long labels.',
      code: 'import matplotlib.pyplot as plt\ncities = ["Hyderabad", "Delhi", "Mumbai", "Pune"]\nrevenue = [1587, 1338, 499, 329]\nplt.figure(figsize=(6, 3))\nplt.barh(cities[::-1], revenue[::-1], color="#426557")\nplt.title("Revenue by city (Rs)")\nfor y, v in enumerate(revenue[::-1]):\n    plt.text(v + 20, y, str(v), va="center")\nplt.show()'
    }),
    py({
      heading: 'Histograms: the shape of the data',
      text: 'A histogram groups numbers into bins and shows how many fall in each. It reveals the typical value, the spread, skew and outliers.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(0)\nmarks = np.clip(rng.normal(65, 12, 300), 0, 100)\nplt.figure(figsize=(6, 3))\nplt.hist(marks, bins=15, color="#013A2B", edgecolor="white")\nplt.axvline(marks.mean(), color="orange", linestyle="--", label=f"mean {marks.mean():.0f}")\nplt.title("Distribution of exam marks")\nplt.xlabel("Marks")\nplt.legend()\nplt.show()'
    }),
    py({
      heading: 'Scatter plots: relationships',
      text: 'A scatter plot shows two numeric variables against each other. If the points rise together, the variables are positively related.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(1)\nhours = rng.uniform(0, 10, 60)\nmarks = 35 + 6 * hours + rng.normal(0, 6, 60)\nplt.figure(figsize=(5, 3.4))\nplt.scatter(hours, marks, alpha=0.7)\nplt.title("More study hours, higher marks")\nplt.xlabel("Hours studied")\nplt.ylabel("Marks")\nplt.show()\nprint("correlation:", round(np.corrcoef(hours, marks)[0, 1], 2))'
    }),
    py({
      heading: 'Several charts in one figure',
      text: 'plt.subplots creates a grid of charts that share one figure - good for comparing views of the same data side by side.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(2)\ndata = rng.normal(50, 10, 200)\nfig, axes = plt.subplots(1, 2, figsize=(7, 3))\naxes[0].hist(data, bins=12, color="#426557")\naxes[0].set_title("Histogram")\naxes[1].boxplot(data)\naxes[1].set_title("Box plot")\nfig.tight_layout()\nplt.show()'
    }),
    py({
      heading: 'Plotting straight from pandas',
      text: 'DataFrames have a .plot() method that calls matplotlib for you - the quickest way to chart a groupby result.',
      code: 'import pandas as pd\nimport matplotlib.pyplot as plt\ndf = pd.DataFrame({"category": ["Electronics", "Furniture", "Books", "Electronics", "Furniture"], "amount": [1299, 499, 39, 249, 329]})\nsummary = df.groupby("category")["amount"].sum().sort_values()\nsummary.plot(kind="barh", figsize=(5, 2.6), color="#013A2B", title="Sales by category")\nplt.show()\nprint(summary)'
    }),
    {
      heading: 'Choosing the right chart and telling the story',
      text: 'Pick the chart from the question, then make the message obvious.',
      table: {
        headers: ['Question', 'Chart'],
        rows: [
          ['How does it change over time?', 'line'],
          ['Which category is biggest?', 'bar (sorted)'],
          ['How are values spread?', 'histogram or box plot'],
          ['Are two numbers related?', 'scatter'],
          ['What share of the whole?', 'bar or (for 2-4 parts) pie']
        ]
      },
      bulletPoints: [
        'Title = the finding ("Online sales doubled"), not just the topic ("Sales").',
        'Label axes with units; start bar charts at zero.',
        'Use one highlight colour for what matters and grey for the rest.',
        'Remove clutter: heavy grid lines, 3-D effects, unnecessary legends.'
      ]
    }
  ],

  'ai-ds-mod-7': [
    py({
      heading: 'Measures of centre: mean, median, mode',
      text: 'The mean is the average; the median is the middle value when sorted; the mode is the most common value. The median is not pulled by extreme values, so it is better for things like salaries.',
      code: 'import statistics as st\nsalaries = [25000, 28000, 30000, 32000, 35000, 400000]\nprint("mean:", round(st.mean(salaries)))\nprint("median:", st.median(salaries))\nprint("mode:", st.mode(["Pune", "Delhi", "Pune", "Goa"]))',
      note: 'One very high salary raises the mean to about 92,000, but the median stays at 31,000 - closer to a "typical" salary.'
    }),
    py({
      heading: 'Measures of spread: range, variance, standard deviation',
      text: 'Spread tells how far values are from the centre. The standard deviation is roughly the typical distance from the mean, in the same unit as the data.',
      code: 'import numpy as np\nclass_a = np.array([60, 62, 65, 63, 61])\nclass_b = np.array([30, 95, 70, 40, 76])\nfor name, m in [("A", class_a), ("B", class_b)]:\n    print(name, "mean", m.mean(), "range", m.max() - m.min(), "std", round(m.std(ddof=1), 1))',
      note: 'Both classes have a similar mean, but class B is far more spread out - the mean alone hides that.'
    }),
    py({
      heading: 'Percentiles and quartiles',
      text: 'The 90th percentile is the value below which 90% of the data falls. Quartiles split the data into four parts (25%, 50% = median, 75%). The box plot is drawn from them.',
      code: 'import numpy as np\nrng = np.random.default_rng(3)\nmarks = rng.integers(30, 100, 200)\nfor p in [25, 50, 75, 90]:\n    print(f"{p}th percentile: {np.percentile(marks, p)}")'
    }),
    py({
      heading: 'The normal distribution',
      text: 'Many measurements (heights, test scores, errors) follow a bell-shaped normal distribution. About 68% of values lie within 1 standard deviation of the mean, 95% within 2 and 99.7% within 3.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(4)\nh = rng.normal(165, 8, 10000)\nwithin1 = np.mean(np.abs(h - h.mean()) < h.std())\nwithin2 = np.mean(np.abs(h - h.mean()) < 2 * h.std())\nprint(f"within 1 sd: {within1:.1%}, within 2 sd: {within2:.1%}")\nplt.figure(figsize=(5, 2.8))\nplt.hist(h, bins=40, color="#426557")\nplt.title("Heights (cm): a normal distribution")\nplt.show()'
    }),
    py({
      heading: 'Correlation',
      text: 'Correlation (from -1 to 1) measures how strongly two variables move together in a straight line. +1: perfectly together; 0: no linear link; -1: one goes up as the other goes down.',
      code: 'import pandas as pd\ndf = pd.DataFrame({\n    "hours": [1, 2, 3, 4, 5, 6, 7, 8],\n    "marks": [40, 48, 55, 58, 66, 72, 79, 85],\n    "phone_time": [8, 7, 7, 6, 4, 4, 3, 2],\n    "shoe_size": [7, 9, 6, 8, 7, 9, 6, 8]\n})\nprint(df.corr().round(2))',
      note: 'Correlation is not causation: ice-cream sales and drownings are correlated because both rise in summer.'
    }),
    py({
      heading: 'Probability basics',
      text: 'Probability is a number from 0 (impossible) to 1 (certain). With data, it is estimated as "how often it happened / how many tries". Simulation with random numbers is an easy way to check intuition.',
      code: 'import numpy as np\nrng = np.random.default_rng(5)\nrolls = rng.integers(1, 7, 100000)\nprint("P(six) about", round(np.mean(rolls == 6), 3), "- exact 1/6 =", round(1 / 6, 3))\ntwo = rng.integers(1, 7, (100000, 2)).sum(axis=1)\nprint("P(sum of two dice = 7) about", round(np.mean(two == 7), 3), "- exact 6/36 =", round(6 / 36, 3))'
    }),
    py({
      heading: 'Samples and the central limit theorem',
      text: 'We usually study a sample, not the whole population. The averages of many samples cluster around the true mean, in a normal shape - even when the data itself is not normal. Larger samples give more reliable averages.',
      code: 'import numpy as np\nrng = np.random.default_rng(6)\npopulation = rng.exponential(scale=500, size=100000)   # skewed, like order values\nprint("true mean:", round(population.mean()))\nfor n in [5, 50, 500]:\n    means = [rng.choice(population, n).mean() for _ in range(2000)]\n    print(f"sample size {n:>3}: averages vary by about {np.std(means):.0f}")'
    }),
    py({
      heading: 'Hypothesis testing: is the difference real?',
      text: 'Is a new website design really better, or did we get lucky? A hypothesis test answers this. A permutation test shuffles the labels many times: if a difference as big as ours rarely appears by chance (p-value below 0.05), we call it significant.',
      code: 'import numpy as np\nrng = np.random.default_rng(7)\nold = rng.normal(5.0, 1.5, 80)    # minutes on site, old design\nnew = rng.normal(5.6, 1.5, 80)    # new design\nobserved = new.mean() - old.mean()\nall_data = np.concatenate([old, new])\ncount = 0\nfor _ in range(5000):\n    rng.shuffle(all_data)\n    if all_data[80:].mean() - all_data[:80].mean() >= observed:\n        count += 1\nprint(f"observed difference: {observed:.2f} minutes")\nprint(f"p-value: {count / 5000:.4f}")',
      note: 'scipy.stats.ttest_ind does a classic t-test in one line.'
    })
  ],

  'ai-ds-mod-8': [
    py({
      heading: 'What is EDA?',
      text: 'Exploratory Data Analysis is getting to know a dataset before modelling: its size, columns, types, missing values, distributions and relationships. Good EDA prevents wrong conclusions and suggests which features matter. We use a table of 200 restaurant bills: the bill, the tip, the group size, the day and the time.',
      code: 'import pandas as pd\nimport numpy as np\nrng = np.random.default_rng(8)\nn = 200\ntips = pd.DataFrame({\n    "total_bill": rng.gamma(4, 5, n).round(2),\n    "size": rng.choice([1, 2, 3, 4, 5, 6], n, p=[.05, .5, .2, .15, .06, .04]),\n    "day": rng.choice(["Thur", "Fri", "Sat", "Sun"], n),\n    "time": rng.choice(["Lunch", "Dinner"], n, p=[.3, .7]),\n})\ntips["tip"] = (tips["total_bill"] * rng.normal(0.15, 0.04, n)).clip(1).round(2)\nprint(tips.shape)\nprint(tips.head())',
      note: 'The examples in this module build the same table of restaurant bills (with a fixed random seed), so each example runs on its own.'
    }),
    py({
      heading: 'Step 1: structure and quality',
      text: 'info() shows columns, types and non-missing counts; describe() the statistics; nunique() how many different values each column has.',
      code: 'import pandas as pd\nimport numpy as np\nrng = np.random.default_rng(8)\nn = 200\ntips = pd.DataFrame({\n    "total_bill": rng.gamma(4, 5, n).round(2),\n    "size": rng.choice([1, 2, 3, 4, 5, 6], n, p=[.05, .5, .2, .15, .06, .04]),\n    "day": rng.choice(["Thur", "Fri", "Sat", "Sun"], n),\n    "time": rng.choice(["Lunch", "Dinner"], n, p=[.3, .7]),\n})\ntips["tip"] = (tips["total_bill"] * rng.normal(0.15, 0.04, n)).clip(1).round(2)\ntips.info()\nprint(tips.describe().round(2))\nprint(tips.nunique())'
    }),
    py({
      heading: 'Step 2: one column at a time',
      text: 'Univariate analysis looks at each column alone: the distribution of numbers (histogram) and the counts of categories (value_counts).',
      code: 'import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(8)\nbills = pd.Series(rng.gamma(4, 5, 200).round(2), name="total_bill")\ndays = pd.Series(rng.choice(["Thur", "Fri", "Sat", "Sun"], 200), name="day")\nprint(days.value_counts())\nprint("skewness:", round(bills.skew(), 2), "(positive = long tail of big bills)")\nbills.plot(kind="hist", bins=20, figsize=(5, 2.8), title="Total bill", color="#426557")\nplt.show()'
    }),
    py({
      heading: 'Step 3: relationships between columns',
      text: 'Bivariate analysis compares two columns: a number by category (groupby), or two numbers (correlation, scatter).',
      code: 'import pandas as pd\nimport numpy as np\nrng = np.random.default_rng(8)\nn = 200\ntips = pd.DataFrame({"total_bill": rng.gamma(4, 5, n).round(2), "day": rng.choice(["Thur", "Fri", "Sat", "Sun"], n), "size": rng.choice([1, 2, 3, 4, 5, 6], n)})\ntips["tip"] = (tips["total_bill"] * rng.normal(0.15, 0.04, n)).clip(1).round(2)\nprint(tips.groupby("day")[["total_bill", "tip"]].mean().round(2))\nprint("bill vs tip correlation:", round(tips["total_bill"].corr(tips["tip"]), 2))'
    }),
    py({
      heading: 'Pivot tables',
      text: 'pivot_table summarises a number by two categories at once - rows and columns - like an Excel pivot table.',
      code: 'import pandas as pd\nimport numpy as np\nrng = np.random.default_rng(9)\nn = 300\ndf = pd.DataFrame({"day": rng.choice(["Fri", "Sat", "Sun"], n), "time": rng.choice(["Lunch", "Dinner"], n), "bill": rng.gamma(4, 5, n)})\nprint(df.pivot_table(values="bill", index="day", columns="time", aggfunc="mean").round(1))'
    }),
    py({
      heading: 'A correlation heatmap',
      text: 'With many numeric columns, a heatmap of the correlation matrix shows at a glance which variables move together.',
      code: 'import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(10)\nn = 200\nsize = rng.integers(1, 7, n)\nbill = size * 6 + rng.normal(0, 4, n)\ndf = pd.DataFrame({"size": size, "bill": bill, "tip": bill * 0.15 + rng.normal(0, 0.8, n), "wait_min": rng.normal(20, 5, n)})\ncorr = df.corr()\nplt.figure(figsize=(4.2, 3.4))\nplt.imshow(corr, cmap="Greens", vmin=-1, vmax=1)\nplt.xticks(range(4), corr.columns, rotation=45)\nplt.yticks(range(4), corr.columns)\nfor i in range(4):\n    for j in range(4):\n        plt.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=8)\nplt.colorbar()\nplt.title("Correlation matrix")\nplt.show()'
    }),
    py({
      heading: 'Writing up the findings',
      text: 'EDA ends with clear, checkable findings and next steps - not just charts. Each finding should be backed by a number.',
      code: 'findings = [\n    ("Bills are right-skewed", "a few large groups pay much more; use the median for typical bills"),\n    ("Tips grow with the bill", "correlation about 0.8; tip percent is fairly stable around 15%"),\n    ("Group size drives the bill", "each extra person adds about Rs 6 on average"),\n    ("Wait time is unrelated", "correlation near 0; not useful for predicting tips"),\n]\nfor i, (finding, evidence) in enumerate(findings, 1):\n    print(f"{i}. {finding} - {evidence}")'
    })
  ],

  'ai-ds-mod-9': [
    {
      heading: 'What is machine learning?',
      text: 'In normal programming you write the rules. In machine learning you give the computer examples (inputs with the right answers) and it finds the rules itself. The learned rules are the model; using it on new inputs is prediction.',
      table: {
        headers: ['Word', 'Meaning', 'Example'],
        rows: [
          ['Features (X)', 'the inputs', 'area, rooms, location of a house'],
          ['Target (y)', 'the answer to predict', 'the price'],
          ['Training', 'learning from examples', 'model.fit(X_train, y_train)'],
          ['Prediction', 'answering for new inputs', 'model.predict(X_new)'],
          ['Evaluation', 'checking on unseen data', 'accuracy on the test set']
        ]
      }
    },
    py({
      heading: 'A dataset: features and target',
      text: 'scikit-learn includes small datasets for practice. The iris dataset has 150 flowers with 4 measurements each (features) and the species (target). Classifying the species from the measurements is a classic first problem.',
      code: 'from sklearn.datasets import load_iris\niris = load_iris(as_frame=True)\nX = iris.data\ny = iris.target\nprint(X.head())\nprint(X.shape, y.shape)\nprint("species:", list(iris.target_names))\nprint(y.value_counts())'
    }),
    py({
      heading: 'Train / test split',
      text: 'Never judge a model on the data it learned from - it may have memorised it. Keep part of the data aside (the test set, often 20-30%) and evaluate only on that.',
      code: 'from sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nX, y = load_iris(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)\nprint("train:", X_train.shape, "test:", X_test.shape)',
      note: 'random_state makes the split repeatable; stratify keeps the same share of each class in both parts.'
    }),
    py({
      heading: 'fit and predict',
      text: 'Every scikit-learn model works the same way: create it, fit it on the training data, predict on new data. Learning this one pattern lets you use dozens of algorithms.',
      syntax: 'model = SomeModel(settings)\nmodel.fit(X_train, y_train)\npredictions = model.predict(X_test)',
      code: 'from sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.neighbors import KNeighborsClassifier\nX, y = load_iris(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)\nmodel = KNeighborsClassifier(n_neighbors=5)\nmodel.fit(X_train, y_train)\nprint("first 10 predictions:", model.predict(X_test[:10]))\nprint("true answers:        ", y_test[:10])'
    }),
    py({
      heading: 'Measuring how good it is',
      text: 'For classification, accuracy is the share of correct predictions on the test set. Always compare with a simple baseline, such as always guessing the most common class.',
      code: 'from sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.dummy import DummyClassifier\nX, y = load_iris(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)\nbaseline = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)\nmodel = KNeighborsClassifier().fit(X_train, y_train)\nprint("baseline accuracy:", round(baseline.score(X_test, y_test), 2))\nprint("model accuracy:   ", round(model.score(X_test, y_test), 2))'
    }),
    py({
      heading: 'Predicting for a new example',
      text: 'Once trained, the model can answer for inputs it has never seen. Give the features in the same order as during training.',
      code: 'from sklearn.datasets import load_iris\nfrom sklearn.neighbors import KNeighborsClassifier\niris = load_iris()\nmodel = KNeighborsClassifier().fit(iris.data, iris.target)\nnew_flower = [[5.9, 3.0, 5.1, 1.8]]   # sepal length, sepal width, petal length, petal width (cm)\npredicted = model.predict(new_flower)[0]\nprint("This flower is probably:", iris.target_names[predicted])\nprint("Probabilities:", model.predict_proba(new_flower).round(2))'
    }),
    py({
      heading: 'Pipelines: preprocessing plus model',
      text: 'A Pipeline chains steps such as scaling and a model into one object. fit and predict then run all steps in the right order, and the test data is processed exactly like the training data.',
      code: 'from sklearn.datasets import load_wine\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neighbors import KNeighborsClassifier\nX, y = load_wine(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0, stratify=y)\nraw = KNeighborsClassifier().fit(X_train, y_train)\npipe = make_pipeline(StandardScaler(), KNeighborsClassifier()).fit(X_train, y_train)\nprint("without scaling:", round(raw.score(X_test, y_test), 2))\nprint("with scaling:   ", round(pipe.score(X_test, y_test), 2))'
    }),
    py({
      heading: 'Overfitting and underfitting',
      text: 'An overfitted model memorises the training data (great training score, poor test score). An underfitted model is too simple for the pattern (poor on both). The goal is the setting where the test score is best.',
      code: 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.tree import DecisionTreeClassifier\nX, y = load_breast_cancer(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=1)\nfor depth in [1, 3, 5, None]:\n    tree = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X_train, y_train)\n    print(f"max_depth={str(depth):>4}: train {tree.score(X_train, y_train):.2f}  test {tree.score(X_test, y_test):.2f}")',
      note: 'Unlimited depth reaches 100% on training data - a clear sign of memorising.'
    })
  ],

  'ai-ds-mod-10': [
    {
      heading: 'What is regression?',
      text: 'Regression predicts a number: a price, a temperature, sales next month. Linear regression is the simplest model: it fits the best straight line (or plane) through the data, y = intercept + slope × x.',
      table: {
        headers: ['Problem', 'Target'],
        rows: [['House price prediction', 'price (Rs)'], ['Demand forecasting', 'units sold'], ['Delivery time estimate', 'minutes'], ['Exam score prediction', 'marks']]
      }
    },
    py({
      heading: 'Simple linear regression',
      text: 'With one feature, the model learns a slope (how much y changes per unit of x) and an intercept (y when x is 0).',
      code: 'import numpy as np\nfrom sklearn.linear_model import LinearRegression\narea = np.array([[600], [800], [1000], [1200], [1500], [1800]])\nprice = np.array([32, 41, 52, 60, 76, 90])     # lakh Rs\nmodel = LinearRegression().fit(area, price)\nprint("slope:", round(model.coef_[0], 4), "lakh per sq ft")\nprint("intercept:", round(model.intercept_, 2))\nprint("predicted price for 1100 sq ft:", round(model.predict([[1100]])[0], 1), "lakh")'
    }),
    py({
      heading: 'Seeing the fitted line',
      text: 'Plotting the data with the model\'s line shows how well a straight line describes the relationship.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.linear_model import LinearRegression\nrng = np.random.default_rng(11)\nx = rng.uniform(500, 2000, 40)\ny = 0.05 * x + 3 + rng.normal(0, 6, 40)\nmodel = LinearRegression().fit(x.reshape(-1, 1), y)\nline_x = np.linspace(500, 2000, 50)\nplt.figure(figsize=(5, 3.2))\nplt.scatter(x, y, alpha=0.7, label="houses")\nplt.plot(line_x, model.predict(line_x.reshape(-1, 1)), color="orange", label="fitted line")\nplt.xlabel("Area (sq ft)")\nplt.ylabel("Price (lakh)")\nplt.legend()\nplt.show()'
    }),
    py({
      heading: 'Regression metrics: MAE, RMSE, R²',
      text: 'MAE is the average size of the errors, in the target\'s unit. RMSE punishes big errors more. R² (0 to 1) is the share of the variation the model explains: 1 is perfect, 0 is no better than predicting the average.',
      code: 'from sklearn.datasets import load_diabetes\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score\nX, y = load_diabetes(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)\npred = LinearRegression().fit(X_train, y_train).predict(X_test)\nprint("MAE: ", round(mean_absolute_error(y_test, pred), 1))\nprint("RMSE:", round(mean_squared_error(y_test, pred) ** 0.5, 1))\nprint("R2:  ", round(r2_score(y_test, pred), 3))'
    }),
    py({
      heading: 'Multiple regression',
      text: 'With several features the model learns one coefficient per feature. Each coefficient says how much the prediction changes when that feature goes up by 1 and the others stay the same.',
      code: 'import pandas as pd\nimport numpy as np\nfrom sklearn.linear_model import LinearRegression\nrng = np.random.default_rng(12)\nn = 200\ndf = pd.DataFrame({"area": rng.uniform(500, 2000, n), "bedrooms": rng.integers(1, 5, n), "age_years": rng.uniform(0, 30, n)})\ndf["price"] = 0.04 * df.area + 4 * df.bedrooms - 0.5 * df.age_years + 10 + rng.normal(0, 4, n)\nmodel = LinearRegression().fit(df[["area", "bedrooms", "age_years"]], df["price"])\nfor name, c in zip(["area", "bedrooms", "age_years"], model.coef_):\n    print(f"{name:>10}: {c:+.3f}")\nprint("R2:", round(model.score(df[["area", "bedrooms", "age_years"]], df["price"]), 3))'
    }),
    py({
      heading: 'Curves: polynomial regression',
      text: 'When the relationship bends, add powers of the feature (x², x³) and fit a linear model on them. Too high a degree overfits.',
      code: 'import numpy as np\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import PolynomialFeatures\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\nrng = np.random.default_rng(13)\nx = rng.uniform(-3, 3, 120).reshape(-1, 1)\ny = 2 + x[:, 0] ** 2 + rng.normal(0, 0.8, 120)\nX_train, X_test, y_train, y_test = train_test_split(x, y, random_state=0)\nfor degree in [1, 2, 10]:\n    m = make_pipeline(PolynomialFeatures(degree), LinearRegression()).fit(X_train, y_train)\n    print(f"degree {degree:>2}: train R2 {m.score(X_train, y_train):.3f}  test R2 {m.score(X_test, y_test):.3f}")'
    }),
    py({
      heading: 'Regularisation: Ridge and Lasso',
      text: 'Ridge and Lasso are linear regression with a penalty on large coefficients, which reduces overfitting when there are many features. Lasso can set useless coefficients to exactly zero, which also selects features. alpha sets the penalty strength.',
      code: 'import numpy as np\nfrom sklearn.linear_model import LinearRegression, Ridge, Lasso\nfrom sklearn.model_selection import cross_val_score\nrng = np.random.default_rng(14)\nX = rng.normal(size=(60, 30))            # 30 features, only 3 matter\ny = 3 * X[:, 0] - 2 * X[:, 1] + X[:, 2] + rng.normal(0, 1, 60)\nfor name, model in [("Linear", LinearRegression()), ("Ridge", Ridge(alpha=5)), ("Lasso", Lasso(alpha=0.1))]:\n    print(f"{name:>6}: cross-validated R2 {cross_val_score(model, X, y, cv=5).mean():.3f}")\nprint("features kept by Lasso:", int(np.sum(Lasso(alpha=0.1).fit(X, y).coef_ != 0)))'
    }),
    py({
      heading: 'Checking the errors (residuals)',
      text: 'Residuals are actual minus predicted. They should look like random noise around zero. A pattern (a curve, or errors growing with the prediction) means the model is missing something.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.linear_model import LinearRegression\nrng = np.random.default_rng(15)\nx = rng.uniform(0, 10, 80).reshape(-1, 1)\ny = 3 + 2 * x[:, 0] + rng.normal(0, 1.5, 80)\nmodel = LinearRegression().fit(x, y)\nresiduals = y - model.predict(x)\nplt.figure(figsize=(5, 2.8))\nplt.scatter(model.predict(x), residuals, alpha=0.7)\nplt.axhline(0, color="orange")\nplt.title("Residuals: random noise around 0 is good")\nplt.xlabel("Predicted")\nplt.show()\nprint("mean residual:", round(residuals.mean(), 4))'
    })
  ]
};
