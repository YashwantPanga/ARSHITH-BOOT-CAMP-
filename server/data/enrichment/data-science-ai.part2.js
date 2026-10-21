// Additional learning content for AI with Data Science, modules 6–10.
const SK = 'scikit-learn developers';
const GOOGLE_ML = 'Google for Developers';

export default {
  'ai-ds-mod-6': {
    skills: ['Choose a chart type that matches the question', 'Build figures with Matplotlib\'s object-oriented API', 'Remove clutter so the message stands out'],
    prerequisites: ['pandas basics (Module 04)'],
    intuition: {
      analogy: 'A chart is a sentence written with shapes. A line says "this changed over time", bars say "these are bigger than those", a histogram says "this is how values are spread out". Using the wrong shape is like using the wrong verb — the reader gets a different message.',
      whyItMatters: 'Decision-makers rarely read tables. A clear chart is often the difference between an analysis that changes a decision and one that is ignored.'
    },
    workflow: {
      title: 'From question to chart',
      nodes: [
        { id: 'q', label: 'Question', detail: 'What should the viewer conclude?', input: 'Analysis goal', output: 'One-sentence message' },
        { id: 'type', label: 'Chart type', detail: 'Trend → line; compare → bar; distribution → histogram/box; relationship → scatter.', input: 'Message', output: 'Chart choice' },
        { id: 'build', label: 'Build (fig, ax)', detail: 'plt.subplots(); ax.plot / ax.bar / ax.hist.', input: 'Data', output: 'Raw chart' },
        { id: 'declutter', label: 'Declutter', detail: 'Remove spines and gridlines that add no information; label directly.', input: 'Raw chart', output: 'Clean chart' },
        { id: 'emph', label: 'Emphasise', detail: 'One highlight colour, a clear title stating the takeaway.', input: 'Clean chart', output: 'Story-ready chart' }
      ],
      edges: [{ from: 'q', to: 'type' }, { from: 'type', to: 'build' }, { from: 'build', to: 'declutter' }, { from: 'declutter', to: 'emph' }],
      explanation: 'Start from the message, not from the data. A title such as "SQL enrolments overtook Web in Q3" tells the reader what to see.'
    },
    workedExample: {
      title: 'A decluttered bar chart (object-oriented API)',
      language: 'python',
      code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\n\ncourses = ["Python", "SQL", "Web", "AI"]\nlearners = [420, 310, 280, 390]\n\nfig, ax = plt.subplots(figsize=(6, 3))\nbars = ax.bar(courses, learners, color="#013A2B")\nax.set_title("Learners per course")\nax.set_ylabel("Learners")\nax.bar_label(bars)\nfor side in ("top", "right"):\n    ax.spines[side].set_visible(False)\n\nprint(len(ax.patches), ax.get_title())\nprint(max(zip(learners, courses))[1])\nplt.close(fig)',
      lineByLine: [
        { line: 2, explanation: 'Agg renders without a screen (scripts, servers, the Practice Lab).' },
        { line: 8, explanation: 'Explicit fig and ax objects make multi-panel figures predictable.' },
        { line: 12, explanation: 'bar_label writes values on the bars, so gridlines become unnecessary.' },
        { line: 14, explanation: 'Removing the top and right spines reduces non-data ink.' },
        { line: 16, explanation: 'Four bar patches were drawn.' }
      ],
      expectedOutput: '4 Learners per course\nPython',
      edgeCases: ['Truncating the y-axis of a bar chart exaggerates differences — bars should start at zero.', 'Rainbow palettes are hard to read for colour-blind viewers; use a single hue plus one accent.']
    },
    caseStudy: {
      title: 'One chart for a review meeting',
      problem: 'A 12-slide deck of default charts failed to convince leadership to add a SQL evening batch.',
      data: 'Monthly enrolments per course for 12 months.',
      steps: ['Write the message first: "SQL demand has doubled since March and now exceeds batch capacity."', 'Use a line chart: SQL highlighted in forest green, other courses in light grey.', 'Add a dashed capacity line and label it directly.', 'Delete the legend by labelling lines at their right end.'],
      result: 'A single chart made the capacity gap obvious and the batch was approved.',
      limitations: 'Highlighting one series is a deliberate editorial choice; share the full data on request.'
    },
    exercises: [
      {
        id: 'ai6-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Pick the chart',
        objective: 'Match chart type to message.',
        problem: 'You want to show how daily active learners changed over the last 90 days. Which chart?',
        options: ['Pie chart', 'Line chart', 'Histogram', 'Box plot'],
        hints: ['The x-axis is time.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Line charts show trends over an ordered, continuous axis such as time.'],
        explanation: 'A histogram shows the distribution of values, not their order in time.',
        mistakes: ['Using bars for 90 time points, which creates visual clutter.'],
        challenge: 'Add a 7-day rolling average line on top.'
      },
      {
        id: 'ai6-e2', type: 'Short answer', difficulty: 'Beginner',
        title: 'Show a distribution',
        objective: 'Name the right plot for one numeric variable.',
        problem: 'Which plot type groups numeric values into bins to show their distribution? (one word)',
        hints: ['ax.____(values, bins=10)'],
        check: { type: 'text', accept: ['histogram', 'hist'] },
        solution: ['A histogram counts how many values fall into each bin.'],
        explanation: 'Box plots and violin plots are alternatives that summarise distributions compactly.',
        mistakes: ['Using a bar chart of raw values in row order.'],
        challenge: 'Compare two groups\' distributions with side-by-side box plots.'
      },
      {
        id: 'ai6-e3', type: 'Data visualization task', difficulty: 'Intermediate', language: 'python',
        title: 'Histogram counts',
        objective: 'Compute the numbers behind a histogram.',
        problem: 'Count the scores in the bins [0, 50), [50, 70), [70, 90), [90, 100] with NumPy and print the counts as a list. Expected:\n[1, 3, 4, 2]',
        starterCode: 'import numpy as np\nscores = [45, 67, 72, 88, 91, 55, 79, 62, 95, 70]\n\n# use np.histogram with explicit bin edges\n',
        hints: ['np.histogram(scores, bins=[0, 50, 70, 90, 100])', 'It returns (counts, edges); print counts.tolist().'],
        check: { type: 'output', expectedOutput: '[1, 3, 4, 2]' },
        solutionCode: 'import numpy as np\nscores = [45, 67, 72, 88, 91, 55, 79, 62, 95, 70]\n\ncounts, edges = np.histogram(scores, bins=[0, 50, 70, 90, 100])\nprint(counts.tolist())',
        solution: ['[0, 50): 45.', '[50, 70): 67, 55, 62.', '[70, 90): 72, 88, 79, 70 (70 belongs to this bin because bins include their left edge).', '[90, 100]: 91, 95 (the last bin includes its right edge).'],
        explanation: 'ax.hist uses the same binning rules, so these counts are the bar heights you would see.',
        mistakes: ['Putting 70 in the [50, 70) bin.'],
        challenge: 'Draw the histogram with ax.hist and label each bar with its count.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai6-k1', question: 'What does the "data-ink ratio" principle encourage?', options: ['More decoration', 'Removing ink that does not represent data', '3-D charts', 'Using every colour'], answer: 1, explanation: 'Every mark should earn its place.' },
      { id: 'ai6-k2', question: 'Which Seaborn function creates a grid of plots split by a category?', options: ['sns.heatmap', 'sns.relplot / sns.catplot with col=', 'sns.set_theme', 'sns.load_dataset'], answer: 1, explanation: 'Figure-level functions support faceting with row= and col=.' },
      { id: 'ai6-k3', question: 'Which chart best shows the relationship between hours studied and score?', options: ['Pie', 'Scatter', 'Stacked bar', 'Line over time'], answer: 1, explanation: 'Scatter plots show how two numeric variables vary together.' }
    ],
    cheatSheet: ['fig, ax = plt.subplots(); ax.plot / bar / hist / scatter', 'ax.set_title, set_xlabel, bar_label, spines[...].set_visible(False)', 'fig.savefig("chart.png", dpi=200, bbox_inches="tight")', 'Message-first titles; one accent colour'],
    references: [
      { title: 'Matplotlib — Quick start guide', url: 'https://matplotlib.org/stable/users/explain/quick_start.html', publisher: 'Matplotlib Development Team' },
      { title: 'seaborn — User guide and tutorial', url: 'https://seaborn.pydata.org/tutorial.html', publisher: 'seaborn (Michael Waskom)' },
      { title: 'numpy.histogram', url: 'https://numpy.org/doc/stable/reference/generated/numpy.histogram.html', publisher: 'NumPy Developers' }
    ],
    next: 'Module 07 adds the statistics needed to say whether a pattern in a chart is real or just noise.'
  },

  'ai-ds-mod-7': {
    skills: ['Compute and interpret mean, standard deviation and standard error', 'Build a confidence interval and read a p-value correctly', 'Apply Bayes\' theorem to a diagnostic-test problem'],
    prerequisites: ['Basic algebra', 'Python arithmetic'],
    intuition: {
      analogy: 'A sample is a spoonful of soup used to judge the whole pot. Statistics tells you how confident you can be about the pot from that spoonful — and a bigger spoon (larger sample) gives a more reliable taste.',
      whyItMatters: 'Without statistics, random variation is easily mistaken for a real effect. A/B tests, survey results and model comparisons all rely on these ideas.'
    },
    workflow: {
      title: 'From sample to conclusion',
      nodes: [
        { id: 'pop', label: 'Population', detail: 'All learners; true mean μ unknown.', input: 'Real world', output: 'Quantity of interest' },
        { id: 'sample', label: 'Random sample', detail: 'n observations x₁ … xₙ.', input: 'Population', output: 'Data' },
        { id: 'desc', label: 'Descriptive statistics', detail: 'x̄ = Σx/n; s = √(Σ(x−x̄)²/(n−1)).', input: 'Data', output: 'Estimates' },
        { id: 'se', label: 'Standard error', detail: 'SE = s/√n measures uncertainty of x̄.', input: 'Estimates', output: 'Uncertainty' },
        { id: 'infer', label: 'Inference', detail: 'Confidence interval x̄ ± t·SE, or a hypothesis test (p-value).', input: 'x̄, SE', output: 'Statement about μ' },
        { id: 'decide', label: 'Conclusion', detail: 'Report effect size and interval, not only "significant".', input: 'Inference', output: 'Decision' }
      ],
      edges: [{ from: 'pop', to: 'sample' }, { from: 'sample', to: 'desc' }, { from: 'desc', to: 'se' }, { from: 'se', to: 'infer' }, { from: 'infer', to: 'decide' }],
      explanation: 'Uncertainty shrinks with the square root of n: quadrupling the sample size halves the standard error.'
    },
    workedExample: {
      title: 'Confidence interval and Bayes\' theorem (standard library only)',
      language: 'python',
      code: 'import statistics as st\n\ndata = [12, 15, 11, 14, 13, 16, 12, 15, 14, 13]   # minutes to finish a quiz\nmean = st.mean(data)\ns = st.stdev(data)                 # sample standard deviation (n - 1)\nse = s / len(data) ** 0.5\nt = 2.262                          # t critical value: 95% two-sided, df = 9\nprint(mean, round(s, 3), round(se, 3))\nprint(f"95% CI: ({mean - t * se:.2f}, {mean + t * se:.2f})")\n\nprior, sens, spec = 0.01, 0.95, 0.90\np_pos = sens * prior + (1 - spec) * (1 - prior)\nprint(f"P(disease | positive) = {sens * prior / p_pos:.3f}")',
      lineByLine: [
        { line: 4, explanation: 'x̄ = 135 / 10 = 13.5.' },
        { line: 5, explanation: 'Σ(x − x̄)² = 22.5; s² = 22.5 / 9 = 2.5; s ≈ 1.581.' },
        { line: 6, explanation: 'SE = 1.581 / √10 = 0.5.' },
        { line: 9, explanation: '13.5 ± 2.262 × 0.5 → (12.37, 14.63).' },
        { line: 12, explanation: 'P(+) = 0.95·0.01 + 0.10·0.99 = 0.1085.' },
        { line: 13, explanation: 'Posterior = 0.0095 / 0.1085 ≈ 0.088: most positives are false alarms when the condition is rare.' }
      ],
      expectedOutput: '13.5 1.581 0.5\n95% CI: (12.37, 14.63)\nP(disease | positive) = 0.088',
      edgeCases: ['A 95% CI does not mean "95% probability μ is in this interval"; it means the method captures μ in 95% of repeated samples.', 'A small p-value does not measure the size or importance of an effect — always report the effect size too.']
    },
    caseStudy: {
      title: 'Did the new quiz layout help?',
      problem: 'An A/B test compares average quiz scores: old layout (n = 400, mean 71.2) vs new layout (n = 400, mean 73.0).',
      data: 'Per-learner scores in each group; standard deviation about 12 in both.',
      steps: ['State H₀: no difference in mean score.', 'Difference = 1.8 points; SE of difference = √(12²/400 + 12²/400) ≈ 0.85.', 'z ≈ 1.8 / 0.85 ≈ 2.1, so p ≈ 0.035 (two-sided).', 'Report the 95% CI for the difference: 1.8 ± 1.96 × 0.85 ≈ (0.14, 3.46) points.'],
      result: 'The improvement is statistically detectable but small (under 2 points); the team ships it because it costs nothing and harms no metric.',
      limitations: 'Checking results many times during a test inflates false positives; decide the sample size in advance.'
    },
    exercises: [
      {
        id: 'ai7-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'z-score',
        objective: 'Standardise a value.',
        problem: 'Exam scores have mean 70 and standard deviation 10. What is the z-score of a learner who scored 85?',
        hints: ['z = (x − mean) / sd'],
        check: { type: 'numeric', answer: 1.5, tolerance: 0.001 },
        solution: ['z = (85 − 70) / 10 = 1.5.', 'The learner scored 1.5 standard deviations above the mean.'],
        explanation: 'In a normal distribution about 93% of values lie below z = 1.5.',
        mistakes: ['Dividing by the variance (100) instead of the standard deviation.'],
        challenge: 'What score has z = −2? (50)'
      },
      {
        id: 'ai7-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Bayes with a better test',
        objective: 'Apply Bayes\' theorem.',
        problem: 'A condition affects 2% of people. A test has sensitivity 90% and specificity 95%. What is P(condition | positive)? Give a probability to 3 decimals.',
        hints: ['P(+) = sens·prior + (1 − spec)·(1 − prior).', 'Posterior = sens·prior / P(+).'],
        check: { type: 'numeric', answer: 0.269, tolerance: 0.002 },
        solution: ['True positives: 0.90 × 0.02 = 0.018.', 'False positives: 0.05 × 0.98 = 0.049.', 'P(+) = 0.067; posterior = 0.018 / 0.067 ≈ 0.269.'],
        explanation: 'Even a good test produces mostly false positives when the condition is rare — base rates matter.',
        mistakes: ['Answering 0.90 (confusing P(+ | condition) with P(condition | +)).'],
        challenge: 'What prevalence would make the posterior exactly 0.5?'
      },
      {
        id: 'ai7-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Confidence interval for a sample',
        objective: 'Compute mean, standard error and a 95% CI.',
        problem: 'For the session lengths below, print the mean, the standard error (3 decimals) and the 95% CI using t = 2.776 (df = 4). Expected:\n30\n1.703\n(25.27, 34.73)',
        starterCode: 'import statistics as st\nminutes = [25, 35, 30, 28, 32]\n\n# mean, standard error and 95% CI\n',
        hints: ['se = st.stdev(minutes) / len(minutes) ** 0.5', 'f"({low:.2f}, {high:.2f})"'],
        check: { type: 'output', expectedOutput: '30\n1.703\n(25.27, 34.73)' },
        solutionCode: 'import statistics as st\nminutes = [25, 35, 30, 28, 32]\n\nmean = st.mean(minutes)\nse = st.stdev(minutes) / len(minutes) ** 0.5\nt = 2.776\nprint(mean)\nprint(round(se, 3))\nprint(f"({mean - t * se:.2f}, {mean + t * se:.2f})")',
        solution: ['Mean = 150 / 5 = 30.', 'Deviations −5, 5, 0, −2, 2 → squared sum 58; s² = 58 / 4 = 14.5; s ≈ 3.808.', 'SE = 3.808 / √5 ≈ 1.703.', 'CI = 30 ± 2.776 × 1.703 = 30 ± 4.73 → (25.27, 34.73).'],
        explanation: 'With only 5 observations the t critical value (2.776) is much larger than 1.96, which widens the interval honestly.',
        mistakes: ['Using the population standard deviation (pstdev) instead of the sample one.'],
        challenge: 'How many sessions would halve the standard error? (4× as many: 20.)'
      }
    ],
    knowledgeCheck: [
      { id: 'ai7-k1', question: 'Why divide by n − 1 in the sample variance?', options: ['It is faster', 'It corrects the downward bias from measuring deviations around x̄', 'To avoid division by zero', 'It is a convention with no effect'], answer: 1, explanation: 'Bessel\'s correction makes s² an unbiased estimator of σ².' },
      { id: 'ai7-k2', question: 'A p-value of 0.03 means…', options: ['There is a 3% chance H₀ is true', 'If H₀ were true, data this extreme would occur about 3% of the time', 'The effect is large', 'The result is 97% important'], answer: 1, explanation: 'It is a statement about the data assuming H₀, not about H₀ itself.' },
      { id: 'ai7-k3', question: 'The Central Limit Theorem says that sample means…', options: ['Are always exactly normal', 'Become approximately normal as n grows, for most population shapes', 'Equal the population mean', 'Have zero variance'], answer: 1, explanation: 'This is why many inference methods work even for skewed data with large samples.' }
    ],
    cheatSheet: ['x̄ = Σx/n · s = √(Σ(x−x̄)²/(n−1)) · SE = s/√n', '95% CI ≈ x̄ ± t(0.975, n−1)·SE', 'P(A|B) = P(B|A)·P(A) / P(B)', 'Report effect size + CI, not just p < 0.05'],
    references: [
      { title: 'Khan Academy — Statistics and probability', url: 'https://www.khanacademy.org/math/statistics-probability', publisher: 'Khan Academy' },
      { title: 'MIT 18.05 Introduction to Probability and Statistics', url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/', publisher: 'MIT OpenCourseWare' },
      { title: 'statistics — Mathematical statistics functions', url: 'https://docs.python.org/3/library/statistics.html', publisher: 'Python Software Foundation' },
      { title: 'SciPy — Statistical functions (scipy.stats)', url: 'https://docs.scipy.org/doc/scipy/reference/stats.html', publisher: 'SciPy developers' }
    ],
    next: 'Module 08 applies these tools systematically in exploratory data analysis.'
  },

  'ai-ds-mod-8': {
    skills: ['Run a structured EDA checklist', 'Quantify relationships with correlation', 'Spot data-quality issues before modelling'],
    prerequisites: ['pandas (Module 04)', 'Statistics (Module 07)'],
    intuition: {
      analogy: 'EDA is walking around a house before buying it: open every room, check the plumbing, look for cracks. You do not decide yet — you learn what questions to ask the seller.',
      whyItMatters: 'Many modelling failures trace back to something visible in ten minutes of EDA: a duplicated ID, a target leaking into a feature, or a column that is 80% missing.'
    },
    workflow: {
      title: 'EDA checklist',
      nodes: [
        { id: 'shape', label: 'Structure', detail: 'shape, dtypes, head(), duplicates.', input: 'Dataset', output: 'Overview' },
        { id: 'uni', label: 'Univariate', detail: 'describe(), histograms, value_counts().', input: 'Each column', output: 'Distributions, outliers' },
        { id: 'missing', label: 'Missingness', detail: 'isna().mean() per column; patterns.', input: 'Dataset', output: 'Missing report' },
        { id: 'bi', label: 'Bivariate', detail: 'Correlation, grouped means, scatter plots vs target.', input: 'Column pairs', output: 'Candidate signals' },
        { id: 'notes', label: 'Findings & hypotheses', detail: 'Write down issues and ideas to test.', input: 'All of the above', output: 'Modelling plan' }
      ],
      edges: [{ from: 'shape', to: 'uni' }, { from: 'uni', to: 'missing' }, { from: 'missing', to: 'bi' }, { from: 'bi', to: 'notes' }],
      explanation: 'EDA ends with written findings, not just plots — they guide cleaning and feature choices.'
    },
    workedExample: {
      title: 'Correlation and grouped summaries',
      language: 'python',
      code: 'import pandas as pd\n\ndf = pd.DataFrame({\n    "hours": [2, 4, 6, 8, 10],\n    "score": [50, 60, 65, 80, 90],\n    "track": ["A", "B", "A", "B", "B"],\n})\nprint(df.shape, int(df.duplicated().sum()))\nprint(round(df["hours"].corr(df["score"]), 3))\nprint(df.groupby("track")["score"].mean().round(1).to_dict())\nprint(df["score"].describe()[["mean", "50%"]].tolist())',
      lineByLine: [
        { line: 8, explanation: '5 rows, 3 columns, no duplicate rows.' },
        { line: 9, explanation: 'Pearson r = Σ(dx·dy) / √(Σdx²·Σdy²) = 200 / √(40 × 1020) ≈ 0.990.' },
        { line: 10, explanation: 'Mean score per track: A = (50 + 65)/2 = 57.5; B = (60 + 80 + 90)/3 ≈ 76.7.' },
        { line: 11, explanation: 'Mean 69.0 vs median 65.0 suggests a slight right skew.' }
      ],
      expectedOutput: "(5, 3) 0\n0.99\n{'A': 57.5, 'B': 76.7}\n[69.0, 65.0]",
      edgeCases: ['Correlation measures linear association only and is sensitive to outliers; always look at the scatter plot.', 'A strong correlation between a feature and the target can be leakage (e.g. "refund_issued" when predicting churn).']
    },
    caseStudy: {
      title: 'EDA before predicting course completion',
      problem: 'A team wants to predict completion from activity data.',
      data: '12,000 learners × 25 columns.',
      steps: ['Structure check found 140 duplicated learner IDs from a double import — removed.', 'Univariate: "last_login_days" had values of −1 used as a missing marker — converted to NaN.', 'Bivariate: "certificate_downloaded" correlated 0.97 with completion — it is recorded after completion, so it is leakage and excluded.', 'Findings written up as a one-page note.'],
      result: 'Three issues that would have produced a misleadingly accurate model were caught before training.',
      limitations: 'EDA findings are hypotheses; confirm important ones with domain experts.'
    },
    exercises: [
      {
        id: 'ai8-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Read a correlation',
        objective: 'Interpret Pearson correlation.',
        problem: 'Correlation between "videos watched" and "quiz score" is r = −0.05. What is the best interpretation?',
        options: ['Strong negative relationship', 'Essentially no linear relationship', 'Watching videos causes lower scores', 'Strong positive relationship'],
        hints: ['r ranges from −1 to 1; values near 0 mean weak linear association.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['|r| = 0.05 is negligible.', 'There could still be a non-linear relationship — plot it.'],
        explanation: 'Correlation never establishes causation in either direction.',
        mistakes: ['Reading the minus sign as a meaningful negative effect.'],
        challenge: 'Construct data with a clear U-shaped relationship and r close to 0.'
      },
      {
        id: 'ai8-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Missing share',
        objective: 'Quantify missingness.',
        problem: 'A column has 1,200 rows and 300 missing values. What percentage is missing?',
        hints: ['missing / total × 100'],
        check: { type: 'numeric', answer: 25, tolerance: 0.01 },
        solution: ['300 / 1200 = 0.25 → 25%.'],
        explanation: 'In pandas: df["col"].isna().mean() * 100.',
        mistakes: ['Dividing by the number of non-missing rows (900).'],
        challenge: 'Above what missing share would you drop a column? Justify your threshold.'
      },
      {
        id: 'ai8-e3', type: 'Data analysis task', difficulty: 'Intermediate', language: 'python',
        title: 'Quick EDA summary',
        objective: 'Produce a compact EDA report with pandas.',
        problem: 'Print the number of duplicate rows, the share of missing values in "age" (2 decimals), and the city with the highest mean spend. Expected:\n1\n0.17\nPune',
        starterCode: 'import pandas as pd\ndf = pd.DataFrame({\n    "id":    [1, 2, 3, 3, 4, 5],\n    "age":   [25, None, 31, 31, 40, 22],\n    "city":  ["Delhi", "Pune", "Delhi", "Delhi", "Pune", "Delhi"],\n    "spend": [200, 450, 150, 150, 500, 100],\n})\n\n# duplicates, missing share in age, city with highest mean spend\n',
        hints: ['int(df.duplicated().sum())', 'round(df["age"].isna().mean(), 2)', 'df.groupby("city")["spend"].mean().idxmax()'],
        check: { type: 'output', expectedOutput: '1\n0.17\nPune' },
        solutionCode: 'import pandas as pd\ndf = pd.DataFrame({\n    "id":    [1, 2, 3, 3, 4, 5],\n    "age":   [25, None, 31, 31, 40, 22],\n    "city":  ["Delhi", "Pune", "Delhi", "Delhi", "Pune", "Delhi"],\n    "spend": [200, 450, 150, 150, 500, 100],\n})\n\nprint(int(df.duplicated().sum()))\nprint(round(df["age"].isna().mean(), 2))\nprint(df.groupby("city")["spend"].mean().idxmax())',
        solution: ['Row 4 repeats row 3 exactly → 1 duplicate.', '1 of 6 ages is missing → 0.17.', 'Pune mean spend = 475, Delhi = 150 → Pune.'],
        explanation: 'In a real project you would drop the duplicate before computing the other statistics.',
        mistakes: ['Counting both copies of the duplicated row as duplicates (duplicated() marks only the repeats).'],
        challenge: 'Recompute the statistics after df.drop_duplicates().'
      }
    ],
    knowledgeCheck: [
      { id: 'ai8-k1', question: 'Which plot best checks whether a numeric feature relates to a numeric target?', options: ['Pie chart', 'Scatter plot', 'Bar of counts', 'Table of IDs'], answer: 1, explanation: 'Scatter plots reveal linear and non-linear patterns and outliers.' },
      { id: 'ai8-k2', question: 'A feature that is only known after the outcome happens is an example of…', options: ['Feature scaling', 'Target leakage', 'Imputation', 'Regularisation'], answer: 1, explanation: 'Leaky features make offline metrics look great and fail in production.' },
      { id: 'ai8-k3', question: 'If the mean is much larger than the median, the distribution is likely…', options: ['Left-skewed', 'Right-skewed', 'Symmetric', 'Uniform'], answer: 1, explanation: 'A long right tail pulls the mean upwards.' }
    ],
    cheatSheet: ['df.shape, df.dtypes, df.duplicated().sum()', 'df.describe(), s.value_counts(), df.isna().mean()', 'df.corr(numeric_only=True), df.groupby(k)[y].mean()', 'Write findings: issues, leakage, hypotheses'],
    references: [
      { title: 'pandas — Descriptive statistics', url: 'https://pandas.pydata.org/docs/user_guide/basics.html#descriptive-statistics', publisher: 'pandas development team' },
      { title: 'Google ML Crash Course — Working with numerical data', url: 'https://developers.google.com/machine-learning/crash-course/numerical-data', publisher: GOOGLE_ML },
      { title: 'seaborn — Visualizing distributions of data', url: 'https://seaborn.pydata.org/tutorial/distributions.html', publisher: 'seaborn (Michael Waskom)' }
    ],
    next: 'Module 09 turns these explored features into a first machine-learning model.'
  },

  'ai-ds-mod-9': {
    skills: ['Split data into training and test sets', 'Follow the fit / predict / evaluate pattern', 'Recognise overfitting and leakage'],
    prerequisites: ['NumPy and pandas (Modules 03–04)', 'EDA (Module 08)'],
    intuition: {
      analogy: 'Training a model on all your data and then testing it on the same data is like a student grading their own exam with the answer key they studied from. A held-out test set is the surprise exam that shows what was really learned.',
      whyItMatters: 'The goal of machine learning is to perform well on new data. Honest evaluation protocols are what separate a working model from an impressive-looking demo.'
    },
    workflow: {
      title: 'Supervised learning workflow (scikit-learn style)',
      nodes: [
        { id: 'xy', label: 'Features X, target y', detail: 'Each row is an example; y holds the answers.', input: 'Clean dataset', output: 'X, y' },
        { id: 'split', label: 'train_test_split', detail: 'Hold out e.g. 20% for testing, stratified for classes.', input: 'X, y', output: 'Train and test sets' },
        { id: 'fit', label: 'model.fit(X_train, y_train)', detail: 'Learn parameters from training data only.', input: 'Training set', output: 'Fitted model' },
        { id: 'pred', label: 'model.predict(X_test)', detail: 'Predict unseen examples.', input: 'Test features', output: 'Predictions' },
        { id: 'eval', label: 'Evaluate', detail: 'Compare predictions with y_test (accuracy, MAE…).', input: 'Predictions + y_test', output: 'Generalisation estimate' }
      ],
      edges: [{ from: 'xy', to: 'split' }, { from: 'split', to: 'fit', label: 'train' }, { from: 'split', to: 'pred', label: 'test' }, { from: 'fit', to: 'pred' }, { from: 'pred', to: 'eval' }],
      explanation: 'Every preprocessing step that learns from data (scalers, imputers) must be fitted on the training split only — scikit-learn Pipelines enforce this.'
    },
    workedExample: {
      title: 'A 1-nearest-neighbour classifier from scratch',
      language: 'python',
      code: 'import numpy as np\n\n# features: [hours studied, quizzes passed]; label: 1 = completed course\nX_train = np.array([[2, 1], [3, 2], [8, 12], [9, 14], [7, 10], [1, 0]])\ny_train = np.array([0, 0, 1, 1, 1, 0])\nX_test = np.array([[6, 9], [2, 3]])\ny_test = np.array([1, 0])\n\ndef predict(X):\n    preds = []\n    for x in X:\n        distances = np.sqrt(((X_train - x) ** 2).sum(axis=1))\n        preds.append(y_train[distances.argmin()])\n    return np.array(preds)\n\npred = predict(X_test)\nprint(pred.tolist())\nprint("Test accuracy:", (pred == y_test).mean())',
      lineByLine: [
        { line: 4, explanation: 'Six labelled training examples.' },
        { line: 6, explanation: 'Two unseen test examples with known answers.' },
        { line: 11, explanation: 'Euclidean distance from x to every training point (broadcasting).' },
        { line: 12, explanation: 'Predict the label of the closest training example.' },
        { line: 17, explanation: 'Both test predictions are correct → accuracy 1.0 on this tiny test set.' }
      ],
      expectedOutput: '[1, 0]\nTest accuracy: 1.0',
      edgeCases: ['Features on different scales dominate distances (salary vs age) — scale features for distance-based models.', 'Two test examples are far too few for a reliable estimate; this is a toy illustration.']
    },
    caseStudy: {
      title: 'A model that looked perfect',
      problem: 'A completion classifier scored 99% accuracy in the notebook but 71% after deployment.',
      data: 'Learner activity features; the scaler and imputer had been fitted on the full dataset, and some learners appeared in both train and test with different enrolments.',
      steps: ['Move preprocessing into a Pipeline fitted on training data only.', 'Split by learner (GroupKFold) so no learner appears in both sets.', 'Re-evaluate: 74% — close to the production number.'],
      result: 'An honest offline estimate that matches reality, so future improvements can be trusted.',
      limitations: 'Behaviour changes over time; also evaluate on the most recent period (time-based split).'
    },
    exercises: [
      {
        id: 'ai9-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Spot the leakage',
        objective: 'Recognise data leakage.',
        problem: 'Which step leaks test information into training?',
        options: ['Splitting data before scaling', 'Fitting a StandardScaler on all data, then splitting', 'Stratifying the split by class', 'Using a random seed'],
        hints: ['The scaler learns means and standard deviations.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Fitting on all data uses test-set statistics during training.', 'Split first, fit the scaler on the training part, then transform both.'],
        explanation: 'Pipelines make the correct order automatic.',
        mistakes: ['Thinking scaling is harmless because it does not use the labels.'],
        challenge: 'Write the correct three-line sequence with fit_transform and transform.'
      },
      {
        id: 'ai9-e2', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Split sizes',
        objective: 'Compute train/test sizes.',
        problem: 'A dataset has 1,250 rows. With test_size=0.2, how many rows are in the test set?',
        hints: ['1250 × 0.2'],
        check: { type: 'numeric', answer: 250, tolerance: 0 },
        solution: ['1250 × 0.2 = 250 test rows; 1000 remain for training.'],
        explanation: 'scikit-learn rounds the test size up when the product is fractional.',
        mistakes: ['Answering 1000 (the training size).'],
        challenge: 'With a further 25% of the training set held out for validation, how many rows train the model? (750)'
      },
      {
        id: 'ai9-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Evaluate a nearest-neighbour model',
        objective: 'Implement predict and accuracy with NumPy.',
        problem: 'Using 1-nearest-neighbour on the data below, print the predictions and accuracy. Expected:\n[0, 1, 1, 0]\n0.75',
        starterCode: 'import numpy as np\nX_train = np.array([[1.0, 1.0], [1.5, 2.0], [5.0, 5.0], [6.0, 5.5]])\ny_train = np.array([0, 0, 1, 1])\nX_test = np.array([[1.2, 1.4], [5.5, 5.2], [3.6, 3.6], [2.0, 1.0]])\ny_test = np.array([0, 1, 0, 0])\n\n# predict each test point with its nearest training point, then compute accuracy\n',
        hints: ['dist = np.sqrt(((X_train - x) ** 2).sum(axis=1))', 'pred = y_train[dist.argmin()]', 'accuracy = (preds == y_test).mean()'],
        check: { type: 'output', expectedOutput: '[0, 1, 1, 0]\n0.75' },
        solutionCode: 'import numpy as np\nX_train = np.array([[1.0, 1.0], [1.5, 2.0], [5.0, 5.0], [6.0, 5.5]])\ny_train = np.array([0, 0, 1, 1])\nX_test = np.array([[1.2, 1.4], [5.5, 5.2], [3.6, 3.6], [2.0, 1.0]])\ny_test = np.array([0, 1, 0, 0])\n\npreds = np.array([y_train[np.sqrt(((X_train - x) ** 2).sum(axis=1)).argmin()] for x in X_test])\nprint(preds.tolist())\nprint(float((preds == y_test).mean()))',
        solution: ['(3.6, 3.6) is closer to (5.0, 5.0) [distance ≈ 1.98] than to (1.5, 2.0) [≈ 2.64], so it is predicted 1 — but its label is 0.', 'Three of four predictions are correct → 0.75.'],
        explanation: 'Points near the boundary between classes are where simple models make mistakes.',
        mistakes: ['Computing distance without the square root — fine for argmin, but remember it when reporting distances.'],
        challenge: 'Implement k = 3 with a majority vote and compare.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai9-k1', question: 'Overfitting means the model…', options: ['Performs well on training data but poorly on new data', 'Is too simple', 'Has too little data to load', 'Uses too few features always'], answer: 0, explanation: 'It memorised noise instead of learning general patterns.' },
      { id: 'ai9-k2', question: 'Why stratify a classification split?', options: ['To shuffle rows', 'To keep class proportions similar in train and test', 'To remove outliers', 'To scale features'], answer: 1, explanation: 'Important for imbalanced classes.' },
      { id: 'ai9-k3', question: 'In scikit-learn, which method learns parameters?', options: ['predict', 'fit', 'score', 'transform only'], answer: 1, explanation: 'fit learns; predict/transform apply what was learned.' }
    ],
    cheatSheet: ['X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)', 'model.fit(X_train, y_train); model.predict(X_test)', 'Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])', 'Never fit preprocessing on test data'],
    references: [
      { title: 'scikit-learn — Getting Started', url: 'https://scikit-learn.org/stable/getting_started.html', publisher: SK },
      { title: 'scikit-learn — Common pitfalls and recommended practices', url: 'https://scikit-learn.org/stable/common_pitfalls.html', publisher: SK },
      { title: 'Google ML Crash Course — Datasets, generalization, and overfitting', url: 'https://developers.google.com/machine-learning/crash-course/overfitting', publisher: GOOGLE_ML }
    ],
    next: 'Module 10 studies regression models that predict numbers.'
  },

  'ai-ds-mod-10': {
    skills: ['Fit a linear regression and interpret slope and intercept', 'Evaluate with MAE, MSE/RMSE and R²', 'Diagnose underfitting and overfitting with residuals'],
    prerequisites: ['ML workflow (Module 09)', 'NumPy (Module 03)'],
    intuition: {
      analogy: 'Linear regression draws the straight line through a cloud of points that keeps the total squared vertical distance from the points as small as possible — like stretching a rubber band through pins so it pulls equally from above and below.',
      whyItMatters: 'Forecasting revenue, estimating delivery times or pricing houses are regression problems. Linear models are also the most interpretable baseline before trying complex models.'
    },
    workflow: {
      title: 'Ordinary least squares, step by step',
      nodes: [
        { id: 'data', label: 'Pairs (xᵢ, yᵢ)', detail: 'e.g. hours studied → score.', input: 'Training data', output: 'Points' },
        { id: 'means', label: 'Means', detail: 'x̄, ȳ', input: 'Points', output: 'Centres' },
        { id: 'slope', label: 'Slope', detail: 'β₁ = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²', input: 'Deviations', output: 'β₁' },
        { id: 'icpt', label: 'Intercept', detail: 'β₀ = ȳ − β₁x̄', input: 'β₁, means', output: 'β₀' },
        { id: 'pred', label: 'Predict', detail: 'ŷ = β₀ + β₁x', input: 'New x', output: 'ŷ' },
        { id: 'eval', label: 'Evaluate', detail: 'MSE = mean((y − ŷ)²), R² = 1 − SSE/SST', input: 'ŷ and y', output: 'Error metrics' }
      ],
      edges: [{ from: 'data', to: 'means' }, { from: 'means', to: 'slope' }, { from: 'slope', to: 'icpt' }, { from: 'icpt', to: 'pred' }, { from: 'pred', to: 'eval' }],
      explanation: 'β₁ is the expected change in y for a one-unit increase in x; R² is the share of variance in y explained by the model.'
    },
    workedExample: {
      title: 'Least squares by hand with NumPy',
      language: 'python',
      code: 'import numpy as np\n\nx = np.array([1, 2, 3, 4], dtype=float)      # hours of practice\ny = np.array([2, 4, 5, 7], dtype=float)      # score (out of 10)\n\nb1 = ((x - x.mean()) * (y - y.mean())).sum() / ((x - x.mean()) ** 2).sum()\nb0 = y.mean() - b1 * x.mean()\npred = b0 + b1 * x\nmse = ((y - pred) ** 2).mean()\nr2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()\n\nprint(round(b1, 2), round(b0, 2))\nprint(round(mse, 3), round(r2, 3))\nprint("Prediction for 5 hours:", round(b0 + b1 * 5, 2))',
      lineByLine: [
        { line: 6, explanation: 'Σ(x−x̄)(y−ȳ) = 8 and Σ(x−x̄)² = 5, so β₁ = 1.6.' },
        { line: 7, explanation: 'β₀ = 4.5 − 1.6 × 2.5 = 0.5.' },
        { line: 9, explanation: 'Residuals −0.1, 0.3, −0.3, 0.1 → SSE = 0.2, MSE = 0.05.' },
        { line: 10, explanation: 'SST = 13, so R² = 1 − 0.2/13 ≈ 0.985.' },
        { line: 14, explanation: 'ŷ(5) = 0.5 + 1.6 × 5 = 8.5.' }
      ],
      expectedOutput: '1.6 0.5\n0.05 0.985\nPrediction for 5 hours: 8.5',
      edgeCases: ['Extrapolating far beyond the training range (e.g. 40 hours → score 64.5 out of 10) gives nonsense.', 'Highly correlated features make individual coefficients unstable; regularisation (Ridge/Lasso) helps.']
    },
    caseStudy: {
      title: 'Estimating delivery time',
      problem: 'An e-commerce team wants to show customers an estimated delivery time.',
      data: 'Distance (km), order size, warehouse load and actual delivery hours for 50,000 past orders.',
      steps: ['Baseline: always predict the median (MAE 9.1 hours).', 'Linear regression on distance and load (MAE 6.4 hours).', 'Inspect residuals by region: rural areas are systematically under-predicted.', 'Add a region feature; MAE drops further and residuals become balanced.'],
      result: 'Customers see estimates that are, on average, several hours more accurate than the baseline.',
      limitations: 'Promised times should include a buffer; under-promising hurts trust less than late deliveries.'
    },
    exercises: [
      {
        id: 'ai10-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Use a fitted line',
        objective: 'Interpret and apply regression coefficients.',
        problem: 'A model predicts price (₹ thousands) = 12 + 3.5 × area (in 100 sq ft). What is the predicted price for area = 8?',
        hints: ['Substitute x = 8.'],
        check: { type: 'numeric', answer: 40, tolerance: 0.001 },
        solution: ['12 + 3.5 × 8 = 12 + 28 = 40 → ₹40 thousand.'],
        explanation: 'Each additional 100 sq ft adds ₹3.5 thousand on average.',
        mistakes: ['Multiplying the intercept by x.'],
        challenge: 'What does the intercept 12 mean, and is it meaningful for area = 0?'
      },
      {
        id: 'ai10-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Compute MAE and RMSE',
        objective: 'Calculate regression error metrics.',
        problem: 'Actual: 10, 12, 15. Predicted: 11, 12, 13. What is the RMSE? (2 decimals)',
        hints: ['Errors: −1, 0, 2.', 'RMSE = √(mean of squared errors).'],
        check: { type: 'numeric', answer: 1.29, tolerance: 0.006 },
        solution: ['Squared errors: 1, 0, 4 → mean 5/3 ≈ 1.667.', 'RMSE = √1.667 ≈ 1.29.', '(MAE would be (1 + 0 + 2)/3 = 1.)'],
        explanation: 'RMSE penalises large errors more than MAE.',
        mistakes: ['Taking the square root of the sum instead of the mean.'],
        challenge: 'Which metric would you report to a business user, and why?'
      },
      {
        id: 'ai10-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Fit and evaluate with np.polyfit',
        objective: 'Fit a line with NumPy and compute R².',
        problem: 'Fit y = b1·x + b0 with np.polyfit(x, y, 1) and print the slope, intercept and R² (each rounded to 2 decimals). Expected:\n2.0\n1.0\n1.0',
        starterCode: 'import numpy as np\nx = np.array([0, 1, 2, 3, 4], dtype=float)\ny = np.array([1, 3, 5, 7, 9], dtype=float)\n\n# fit, predict, R²\n',
        hints: ['b1, b0 = np.polyfit(x, y, 1)', 'r2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()'],
        check: { type: 'output', expectedOutput: '2.0\n1.0\n1.0' },
        solutionCode: 'import numpy as np\nx = np.array([0, 1, 2, 3, 4], dtype=float)\ny = np.array([1, 3, 5, 7, 9], dtype=float)\n\nb1, b0 = np.polyfit(x, y, 1)\npred = b1 * x + b0\nr2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()\nprint(round(float(b1), 2))\nprint(round(float(b0), 2))\nprint(round(float(r2), 2))',
        solution: ['The data lie exactly on y = 2x + 1.', 'Residuals are zero, so R² = 1.'],
        explanation: 'Real data are never this clean; R² = 1 on real data usually signals leakage.',
        mistakes: ['Unpacking polyfit as (intercept, slope) — it returns the highest power first.'],
        challenge: 'Add noise with np.random.default_rng(0).normal(0, 1, 5) and refit.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai10-k1', question: 'R² = 0.80 means…', options: ['80% of predictions are exactly right', 'The model explains 80% of the variance in y', 'Error is 20%', 'The slope is 0.8'], answer: 1, explanation: 'It compares model error with the error of predicting the mean.' },
      { id: 'ai10-k2', question: 'Ridge regression adds which penalty?', options: ['Sum of absolute coefficients', 'Sum of squared coefficients', 'Number of features', 'None'], answer: 1, explanation: 'L2 (Ridge) shrinks coefficients; L1 (Lasso) can set some to zero.' },
      { id: 'ai10-k3', question: 'A residual plot with a clear curve suggests…', options: ['A perfect model', 'A non-linear relationship the linear model misses', 'Too much data', 'Data leakage'], answer: 1, explanation: 'Try polynomial features or a non-linear model.' }
    ],
    cheatSheet: ['ŷ = β₀ + β₁x; β₁ = Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²', 'MAE = mean|y−ŷ|, RMSE = √mean(y−ŷ)², R² = 1 − SSE/SST', 'np.polyfit(x, y, 1); LinearRegression().fit(X, y)', 'Ridge (L2), Lasso (L1) regularisation'],
    references: [
      { title: 'scikit-learn — Linear Models', url: 'https://scikit-learn.org/stable/modules/linear_model.html', publisher: SK },
      { title: 'Google ML Crash Course — Linear regression', url: 'https://developers.google.com/machine-learning/crash-course/linear-regression', publisher: GOOGLE_ML },
      { title: 'Khan Academy — Least-squares regression', url: 'https://www.khanacademy.org/math/statistics-probability/describing-relationships-quantitative-data', publisher: 'Khan Academy' }
    ],
    next: 'Module 11 predicts categories instead of numbers with classification models.'
  }
};
