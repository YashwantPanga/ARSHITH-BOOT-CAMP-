// Additional learning content for AI with Data Science, modules 1–5.
// Python exercises use only the standard library, NumPy, pandas and Matplotlib so they run in the
// in-browser Practice Lab (Pyodide) and in the automated verifier.
const NUMPY = 'NumPy Developers';
const PANDAS = 'pandas development team';
const GOOGLE_ML = 'Google for Developers';

export default {
  'ai-ds-mod-1': {
    skills: ['Distinguish AI, machine learning, deep learning and generative AI', 'Walk through a project with the CRISP-DM lifecycle', 'Compare a model against a simple baseline'],
    prerequisites: ['Basic Python (lists, loops)', 'School-level algebra'],
    intuition: {
      analogy: 'Traditional programming is writing a recipe by hand. Machine learning is showing a cook hundreds of finished dishes with their ratings and letting them work out the recipe. The data is the teacher; the model is what the cook learned.',
      whyItMatters: 'Knowing which problems need learning from data — and which are solved by a simple rule — saves months of effort. Every model must beat a sensible baseline to be worth deploying.'
    },
    workflow: {
      title: 'CRISP-DM project lifecycle',
      nodes: [
        { id: 'biz', label: 'Business understanding', detail: 'Define the decision to improve and how success is measured.', input: 'Stakeholder goal', output: 'Success criteria' },
        { id: 'data', label: 'Data understanding', detail: 'Collect and explore available data; check quality.', input: 'Raw sources', output: 'Data report' },
        { id: 'prep', label: 'Data preparation', detail: 'Clean, join, engineer features.', input: 'Raw data', output: 'Modelling dataset' },
        { id: 'model', label: 'Modelling', detail: 'Train candidate models and a baseline.', input: 'Dataset', output: 'Trained models' },
        { id: 'eval', label: 'Evaluation', detail: 'Do results meet the business criteria?', input: 'Models + test data', output: 'Go / no-go' },
        { id: 'deploy', label: 'Deployment & monitoring', detail: 'Serve predictions; watch for drift.', input: 'Approved model', output: 'Business value' }
      ],
      edges: [
        { from: 'biz', to: 'data' }, { from: 'data', to: 'prep' }, { from: 'prep', to: 'model' }, { from: 'model', to: 'eval' },
        { from: 'eval', to: 'deploy', label: 'meets criteria' }, { from: 'eval', to: 'biz', label: 'revisit' }
      ],
      explanation: 'The loop back from evaluation is the norm, not a failure: most projects iterate several times as the problem and data become clearer.'
    },
    workedExample: {
      title: 'Is a model better than a baseline?',
      language: 'python',
      code: 'hours  = [2, 9, 4, 12, 7, 1, 10, 5, 3]\npassed = [0, 1, 0, 1, 0, 0, 1, 1, 0]\n\n# A hand-written rule: predict "pass" when a learner studied 6+ hours\nrule = [1 if h >= 6 else 0 for h in hours]\ncorrect = sum(r == p for r, p in zip(rule, passed))\nprint("Rule accuracy:", round(correct / len(passed), 2))\n\n# Baseline: always predict the most common outcome\nmajority = 1 if passed.count(1) > passed.count(0) else 0\nprint(f"Baseline accuracy (always {majority}):", round(passed.count(majority) / len(passed), 2))',
      lineByLine: [
        { line: 5, explanation: 'A rule written by a person — no learning involved.' },
        { line: 6, explanation: 'Count how many predictions match the true labels.' },
        { line: 7, explanation: '7 of 9 correct → 0.78.' },
        { line: 10, explanation: 'Five learners failed, so the majority class is 0.' },
        { line: 11, explanation: 'Always predicting "fail" is already right 5/9 = 0.56 of the time.' }
      ],
      expectedOutput: 'Rule accuracy: 0.78\nBaseline accuracy (always 0): 0.56',
      edgeCases: ['With imbalanced data (e.g. 99% non-fraud) a useless model can show 99% accuracy — compare against the baseline and use other metrics (Module 11).', 'Correlation in historical data does not prove causation; hours studied may stand in for motivation.']
    },
    caseStudy: {
      title: 'Predicting which learners need support',
      problem: 'A bootcamp wants to contact learners at risk of dropping out in the first two weeks.',
      data: 'Logins per week, quiz scores, time spent per module, and whether past learners completed the course.',
      steps: ['Business understanding: success = more completions per mentor hour, not just accuracy.', 'Data: join activity logs with completion outcomes; check missing weeks.', 'Baseline: flag everyone who missed two consecutive quizzes.', 'Model: logistic regression on activity features; compare recall with the baseline.', 'Deploy a weekly list for mentors and track completion rates.'],
      result: 'The model is only adopted if it finds more at-risk learners than the simple rule for the same mentor effort.',
      limitations: 'Predictions must be used to offer help, not to penalise learners; review fairness across groups (e.g. learners with slower internet).'
    },
    exercises: [
      {
        id: 'ai1-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which learning paradigm?',
        objective: 'Classify problems as supervised, unsupervised or reinforcement learning.',
        problem: 'You have 50,000 emails each labelled "spam" or "not spam" and want to label new emails automatically. Which paradigm is this?',
        options: ['Unsupervised learning', 'Supervised learning (classification)', 'Reinforcement learning', 'Rule-based expert system'],
        hints: ['The training data includes the correct answer for each example.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Labelled examples + a categorical target = supervised classification.'],
        explanation: 'Grouping emails by topic without labels would be unsupervised (clustering).',
        mistakes: ['Calling it unsupervised because the model "finds patterns" on its own.'],
        challenge: 'Give one example each of regression and clustering from your own life.'
      },
      {
        id: 'ai1-e2', type: 'Architecture interpretation', difficulty: 'Intermediate',
        title: 'Read the lifecycle diagram',
        objective: 'Locate decisions in CRISP-DM.',
        problem: 'Using the CRISP-DM diagram above: a model has 94% accuracy, but managers say it would not change any decision they make. Which phase should the team return to?',
        options: ['Data preparation', 'Modelling', 'Business understanding', 'Deployment'],
        hints: ['The problem is not the model\'s quality but whether it addresses the right question.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Evaluation revealed a mismatch with the business need.', 'The "revisit" arrow leads back to business understanding to redefine the objective and success criteria.'],
        explanation: 'Technical metrics are only meaningful when tied to a decision.',
        mistakes: ['Tuning the model further, which optimises the wrong goal.'],
        challenge: 'Write one measurable success criterion for the dropout case study.'
      },
      {
        id: 'ai1-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Model vs baseline',
        objective: 'Compute accuracy and compare with a majority-class baseline.',
        problem: 'Compute the model accuracy, the majority-class baseline accuracy and the improvement (rounded to 2 decimals). Expected:\nModel accuracy: 0.8\nBaseline accuracy: 0.6\nImprovement: 0.2',
        starterCode: 'preds  = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1]\nactual = [1, 0, 0, 1, 0, 1, 1, 0, 1, 1]\n\n# your code here\n',
        hints: ['accuracy = matches / len(actual)', 'The majority class in actual is 1 (6 of 10).', 'Round the improvement: round(model - baseline, 2)'],
        check: { type: 'output', expectedOutput: 'Model accuracy: 0.8\nBaseline accuracy: 0.6\nImprovement: 0.2' },
        solutionCode: 'preds  = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1]\nactual = [1, 0, 0, 1, 0, 1, 1, 0, 1, 1]\n\nmodel = sum(p == a for p, a in zip(preds, actual)) / len(actual)\nmajority = 1 if actual.count(1) > actual.count(0) else 0\nbaseline = actual.count(majority) / len(actual)\nprint("Model accuracy:", model)\nprint("Baseline accuracy:", baseline)\nprint("Improvement:", round(model - baseline, 2))',
        solution: ['8 of 10 predictions match → 0.8.', 'Six labels are 1, so always predicting 1 gives 0.6.', '0.8 − 0.6 = 0.2 (rounded to hide floating-point noise).'],
        explanation: 'Without round, Python prints 0.20000000000000007 because of binary floating point.',
        mistakes: ['Using the predictions to decide the majority class instead of the true labels.'],
        challenge: 'Compute the same numbers for a model that always predicts 0. Is it useful?'
      }
    ],
    knowledgeCheck: [
      { id: 'ai1-k1', question: 'Which statement is correct?', options: ['All AI is deep learning', 'Deep learning is a subset of machine learning, which is a subset of AI', 'Machine learning contains AI', 'Generative AI is unrelated to ML'], answer: 1, explanation: 'AI ⊃ ML ⊃ DL; generative AI is a family of (mostly deep) models.' },
      { id: 'ai1-k2', question: 'What is a baseline model?', options: ['The final model', 'A simple reference prediction every model must beat', 'A deep network', 'The training data'], answer: 1, explanation: 'Examples: majority class, mean value, last period\'s value.' },
      { id: 'ai1-k3', question: 'Text, images and audio are examples of…', options: ['Structured data', 'Unstructured data', 'Metadata', 'Labels'], answer: 1, explanation: 'They lack a fixed row/column schema.' }
    ],
    cheatSheet: ['AI ⊃ ML ⊃ Deep Learning; GenAI generates new content', 'Supervised (labels) · Unsupervised (structure) · Reinforcement (rewards)', 'CRISP-DM: Business → Data → Prep → Model → Evaluate → Deploy', 'Always compare with a baseline'],
    references: [
      { title: 'Introduction to Machine Learning', url: 'https://developers.google.com/machine-learning/intro-to-ml', publisher: GOOGLE_ML },
      { title: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', publisher: GOOGLE_ML },
      { title: 'MIT OpenCourseWare — Introduction to Computational Thinking and Data Science', url: 'https://ocw.mit.edu/courses/6-0002-introduction-to-computational-thinking-and-data-science-fall-2016/', publisher: 'MIT OpenCourseWare' }
    ],
    next: 'Module 02 sharpens the Python skills used throughout data science: comprehensions, generators and clean functions.'
  },

  'ai-ds-mod-2': {
    skills: ['Write list/dict comprehensions and generator expressions', 'Process records lazily to save memory', 'Organise analysis code into small functions'],
    prerequisites: ['Python basics (variables, loops, functions)'],
    intuition: {
      analogy: 'A list is a fully cooked buffet laid out at once; a generator is a chef cooking each plate only when you ask for it. For a million rows, the buffet may not fit on the table — the chef never has that problem.',
      whyItMatters: 'Data work is mostly transforming collections. Idiomatic Python makes those transformations short, readable and memory-efficient before you even reach NumPy and pandas.'
    },
    workflow: {
      title: 'A lazy record-processing pipeline',
      nodes: [
        { id: 'read', label: 'Read lines', detail: 'Iterate a file or string line by line.', input: 'Text source', output: 'One line at a time' },
        { id: 'parse', label: 'Parse', detail: 'Split into fields; convert types.', input: 'Line', output: 'Record (tuple/dict)' },
        { id: 'filter', label: 'Filter', detail: 'Drop invalid or irrelevant records.', input: 'Records', output: 'Valid records' },
        { id: 'agg', label: 'Aggregate', detail: 'Accumulate totals in a dict.', input: 'Valid records', output: 'Summary' }
      ],
      edges: [{ from: 'read', to: 'parse' }, { from: 'parse', to: 'filter' }, { from: 'filter', to: 'agg' }],
      explanation: 'Chained generators pass one record at a time through every stage, so memory use stays constant regardless of file size.'
    },
    workedExample: {
      title: 'Comprehensions, generators and sorting',
      language: 'python',
      code: 'import sys\n\nsquares_list = [n * n for n in range(1000)]\nsquares_gen = (n * n for n in range(1000))\nprint(sum(squares_list) == sum(squares_gen))\nprint(sys.getsizeof(squares_list) > sys.getsizeof(squares_gen))\n\nrecords = [{"name": "Asha", "score": 82}, {"name": "Ravi", "score": 67}, {"name": "Meena", "score": 91}]\npassed = {r["name"]: r["score"] for r in records if r["score"] >= 70}\nprint(passed)\nprint(sorted(records, key=lambda r: r["score"], reverse=True)[0]["name"])',
      lineByLine: [
        { line: 3, explanation: 'A list comprehension builds all 1000 values in memory.' },
        { line: 4, explanation: 'A generator expression produces values on demand.' },
        { line: 6, explanation: 'The list object is far larger than the small generator object.' },
        { line: 9, explanation: 'A dict comprehension with a filter keeps only passing learners.' },
        { line: 11, explanation: 'key= tells sorted which value to compare.' }
      ],
      expectedOutput: "True\nTrue\n{'Asha': 82, 'Meena': 91}\nMeena",
      edgeCases: ['A generator can be consumed only once; a second sum() over it returns 0.', 'Deeply nested comprehensions hurt readability — use a normal loop when logic grows.']
    },
    caseStudy: {
      title: 'Summarising a large sales export',
      problem: 'A 4 GB CSV of point-of-sale records crashes a laptop when loaded fully into a list.',
      data: 'Lines of city,product,amount.',
      steps: ['Open the file and iterate line by line.', 'Parse with a generator expression; skip malformed lines.', 'Accumulate totals per city in a dict.', 'Only the small summary is kept in memory.'],
      result: 'The summary is computed with a few megabytes of memory.',
      limitations: 'For repeated, multi-column analysis, pandas with chunksize or a database is more convenient.'
    },
    exercises: [
      {
        id: 'ai2-e1', type: 'Predict the output', difficulty: 'Beginner',
        title: 'Comprehension with a condition',
        objective: 'Read a filtered comprehension.',
        problem: 'print([x ** 2 for x in range(6) if x % 2 == 1])',
        hints: ['Odd numbers from 0 to 5 are 1, 3 and 5.'],
        check: { type: 'text', accept: ['[1, 9, 25]'] },
        solution: ['The filter keeps 1, 3, 5.', 'Squares: 1, 9, 25.'],
        explanation: 'The if clause filters before the expression is applied.',
        mistakes: ['Squaring even numbers.'],
        challenge: 'Write the equivalent with map and filter.'
      },
      {
        id: 'ai2-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Generators are single-use',
        objective: 'Understand generator exhaustion.',
        problem: 'g = (n for n in [1, 2, 3])\nprint(sum(g), sum(g))\n\nWhat is printed?',
        options: ['6 6', '6 0', '0 6', 'An error'],
        hints: ['After the first sum, the generator has no items left.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['The first sum consumes every value → 6.', 'The second sum sees an empty generator → 0.'],
        explanation: 'Convert to a list if you need to iterate more than once.',
        mistakes: ['Expecting generators to rewind.'],
        challenge: 'Use itertools.tee to iterate twice without storing a full list.'
      },
      {
        id: 'ai2-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Sales per city',
        objective: 'Parse, filter and aggregate text records.',
        problem: 'Parse the CSV text (skip the header), total sales per city, and print the cities alphabetically with their totals. Expected:\nDelhi 150\nHyderabad 320\nPune 120',
        starterCode: 'data = """city,sales\nHyderabad,120\nPune,80\nHyderabad,200\nDelhi,150\nPune,40"""\n\n# your code here\n',
        hints: ['lines = data.splitlines()[1:]', 'city, sales = line.split(","); totals[city] = totals.get(city, 0) + int(sales)'],
        check: { type: 'output', expectedOutput: 'Delhi 150\nHyderabad 320\nPune 120' },
        solutionCode: 'data = """city,sales\nHyderabad,120\nPune,80\nHyderabad,200\nDelhi,150\nPune,40"""\n\ntotals = {}\nfor city, sales in (line.split(",") for line in data.splitlines()[1:]):\n    totals[city] = totals.get(city, 0) + int(sales)\nfor city in sorted(totals):\n    print(city, totals[city])',
        solution: ['Skip the header with [1:].', 'A generator expression splits each line lazily.', 'Accumulate with dict.get and print in sorted order.'],
        explanation: 'The same pattern works for files by iterating over the file object.',
        mistakes: ['Forgetting int(), which concatenates strings like "120200".'],
        challenge: 'Solve it with collections.Counter.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai2-k1', question: 'Which syntax creates a generator?', options: ['[x for x in a]', '{x for x in a}', '(x for x in a)', '{x: x for x in a}'], answer: 2, explanation: 'Parentheses create a generator expression.' },
      { id: 'ai2-k2', question: 'Why are tuples sometimes preferred over lists for records?', options: ['They are mutable', 'They are immutable and hashable', 'They are always faster to sort', 'They store more data'], answer: 1, explanation: 'Immutable records can be dict keys and cannot change accidentally.' },
      { id: 'ai2-k3', question: 'What does yield do in a function?', options: ['Ends the program', 'Turns the function into a generator that produces values lazily', 'Returns a list', 'Raises an error'], answer: 1, explanation: 'Each yield pauses the function and hands out one value.' }
    ],
    cheatSheet: ['[f(x) for x in xs if cond]', '{k: v for k, v in pairs}', '(f(x) for x in xs)  # lazy', 'sorted(items, key=lambda r: r["score"], reverse=True)'],
    references: [
      { title: 'The Python Tutorial — List Comprehensions', url: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions', publisher: 'Python Software Foundation' },
      { title: 'Functional Programming HOWTO — Generators', url: 'https://docs.python.org/3/howto/functional.html#generators', publisher: 'Python Software Foundation' },
      { title: 'collections — Counter', url: 'https://docs.python.org/3/library/collections.html#collections.Counter', publisher: 'Python Software Foundation' }
    ],
    next: 'Module 03 replaces Python loops over numbers with fast NumPy array operations.'
  },

  'ai-ds-mod-3': {
    skills: ['Create and reshape ndarrays', 'Apply broadcasting rules confidently', 'Distinguish views from copies'],
    prerequisites: ['Python lists and loops (Module 02)'],
    intuition: {
      analogy: 'A Python list is a row of separate boxes, each holding any kind of object. A NumPy array is one long tray of identical slots in contiguous memory — the CPU can process the whole tray in one sweep, like a machine stamping a sheet instead of a person stamping each card.',
      whyItMatters: 'pandas, scikit-learn, TensorFlow and PyTorch are all built on array computing. Vectorised NumPy code is often 10–100× faster than equivalent Python loops.'
    },
    workflow: {
      title: 'How broadcasting combines arrays',
      nodes: [
        { id: 'shapes', label: 'Compare shapes', detail: 'Align from the right: (4, 3) and (3,).', input: 'Two arrays', output: 'Aligned dimensions' },
        { id: 'rule', label: 'Dimensions compatible?', detail: 'Equal, or one of them is 1 (missing counts as 1).', input: 'Each dimension pair', output: 'Yes / no' },
        { id: 'stretch', label: 'Virtually stretch', detail: 'Size-1 dimensions repeat without copying data.', input: 'Compatible shapes', output: 'Common shape (4, 3)' },
        { id: 'op', label: 'Element-wise operation', detail: 'Compiled loop over the common shape.', input: 'Stretched views', output: 'Result array' },
        { id: 'err', label: 'ValueError', detail: '"operands could not be broadcast together"', input: 'Incompatible shapes', output: 'Error' }
      ],
      edges: [{ from: 'shapes', to: 'rule' }, { from: 'rule', to: 'stretch', label: 'yes' }, { from: 'rule', to: 'err', label: 'no' }, { from: 'stretch', to: 'op' }],
      explanation: 'Subtracting column means from a (students × subjects) matrix works because the (3,) vector of means is stretched across all 4 rows.'
    },
    workedExample: {
      title: 'Column statistics, standardisation and views',
      language: 'python',
      code: 'import numpy as np\n\nscores = np.array([[70, 80, 90], [60, 75, 85], [88, 92, 79], [55, 65, 70]])  # students x subjects\nprint(scores.shape)\ncol_means = scores.mean(axis=0)\nprint(np.round(col_means, 2).tolist())\nz = (scores - col_means) / scores.std(axis=0)\nprint(np.round(z[0], 2).tolist())\n\nfirst_subject = scores[:, 0]   # a view, not a copy\nfirst_subject[0] = 100\nprint(scores[0, 0])',
      lineByLine: [
        { line: 3, explanation: 'A 4×3 integer array: 4 students, 3 subjects.' },
        { line: 5, explanation: 'axis=0 collapses rows → one mean per column.' },
        { line: 7, explanation: 'Broadcasting subtracts the (3,) means from every row, then divides by each column\'s standard deviation (z-scores).' },
        { line: 10, explanation: 'Basic slicing returns a view sharing memory with scores.' },
        { line: 12, explanation: 'Changing the view changed the original array.' }
      ],
      expectedOutput: '(4, 3)\n[68.25, 78.0, 81.0]\n[0.14, 0.21, 1.21]\n100',
      edgeCases: ['Fancy indexing (scores[[0, 2]]) and boolean masks return copies, not views.', 'Integer arrays silently truncate assigned floats: a[0] = 2.9 stores 2.']
    },
    caseStudy: {
      title: 'Vectorising a feature-scaling step',
      problem: 'A preprocessing script min-max scaled 200 features for 1 million rows using nested Python loops and took 20 minutes.',
      data: 'A float matrix of shape (1_000_000, 200).',
      steps: ['Compute mins = X.min(axis=0) and maxs = X.max(axis=0).', 'Scale with (X - mins) / (maxs - mins) using broadcasting.', 'Guard zero-range columns with np.where(range == 0, 1, range).'],
      result: 'The same transformation runs in seconds and the code shrinks to three lines.',
      limitations: 'Fit the min/max on training data only and reuse them for test data to avoid leakage (Module 13).'
    },
    exercises: [
      {
        id: 'ai3-e1', type: 'Short answer', difficulty: 'Beginner',
        title: 'Broadcast shape',
        objective: 'Apply broadcasting rules.',
        problem: 'What is the shape of a + b if a.shape is (3, 1) and b.shape is (1, 4)? Write it like (r, c).',
        hints: ['Each size-1 dimension stretches to match the other array.'],
        check: { type: 'text', accept: ['(3, 4)', '(3,4)', '3, 4', '3x4'] },
        solution: ['Rows: 3 vs 1 → 3.', 'Columns: 1 vs 4 → 4.', 'Result shape (3, 4).'],
        explanation: 'This "outer" broadcasting builds a full table from a column and a row.',
        mistakes: ['Answering (3, 1) or (1, 4).'],
        challenge: 'What happens with shapes (3, 2) and (3,)? (Error: 2 vs 3 are incompatible.)'
      },
      {
        id: 'ai3-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'View or copy?',
        objective: 'Predict memory sharing.',
        problem: 'a = np.arange(6)\nb = a[a > 2]\nb[0] = 99\n\nWhat is a[3] now?',
        options: ['99', '3', '0', 'An error'],
        hints: ['Boolean-mask indexing returns a new array.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['a[a > 2] is a copy containing 3, 4, 5.', 'Changing b does not affect a, so a[3] is still 3.'],
        explanation: 'np.shares_memory(a, b) returns False here.',
        mistakes: ['Assuming every indexing operation returns a view.'],
        challenge: 'Modify a in place for values above 2 using a[a > 2] = 0.'
      },
      {
        id: 'ai3-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Min–max scale each column',
        objective: 'Use axis-wise reductions and broadcasting.',
        problem: 'Scale each column of X to the range 0–1 and print each row rounded to 2 decimals as a list. Expected:\n[0.0, 1.0]\n[0.5, 0.0]\n[1.0, 0.25]',
        starterCode: 'import numpy as np\nX = np.array([[10.0, 400.0], [20.0, 200.0], [30.0, 250.0]])\n\n# scale columns to [0, 1] without loops over elements\n',
        hints: ['mins = X.min(axis=0); maxs = X.max(axis=0)', 'scaled = (X - mins) / (maxs - mins)', 'for row in np.round(scaled, 2): print(row.tolist())'],
        check: { type: 'output', expectedOutput: '[0.0, 1.0]\n[0.5, 0.0]\n[1.0, 0.25]' },
        solutionCode: 'import numpy as np\nX = np.array([[10.0, 400.0], [20.0, 200.0], [30.0, 250.0]])\n\nmins = X.min(axis=0)\nmaxs = X.max(axis=0)\nscaled = (X - mins) / (maxs - mins)\nfor row in np.round(scaled, 2):\n    print(row.tolist())',
        solution: ['Column 1: min 10, max 30 → 0, 0.5, 1.', 'Column 2: min 200, max 400 → 1, 0, 0.25.', 'Broadcasting applies the per-column mins and ranges to every row.'],
        explanation: '.tolist() converts NumPy floats to plain Python floats for clean printing.',
        mistakes: ['Using X.min() without axis, which takes the global minimum.'],
        challenge: 'Standardise instead: (X - mean) / std per column.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai3-k1', question: 'What does a.reshape(2, -1) do for an array of 6 elements?', options: ['Error', 'Shape (2, 3)', 'Shape (2, 6)', 'Shape (-1, 2)'], answer: 1, explanation: '-1 lets NumPy infer the remaining dimension.' },
      { id: 'ai3-k2', question: 'Which computes the matrix product of A and B?', options: ['A * B', 'A @ B', 'A + B', 'A ** B'], answer: 1, explanation: '* is element-wise; @ (np.matmul) is matrix multiplication.' },
      { id: 'ai3-k3', question: 'Why is vectorised NumPy faster than a Python loop?', options: ['It uses more memory', 'Operations run in compiled code over contiguous memory', 'It skips calculations', 'It uses the GPU automatically'], answer: 1, explanation: 'The per-element Python overhead disappears.' }
    ],
    cheatSheet: ['np.array, np.arange, np.zeros((r, c)), a.shape, a.reshape', 'a.mean(axis=0) per column, axis=1 per row', 'Broadcasting: align right; sizes equal or 1', 'A @ B matrix product; np.linalg.svd(A)'],
    references: [
      { title: 'NumPy: the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', publisher: NUMPY },
      { title: 'Broadcasting', url: 'https://numpy.org/doc/stable/user/basics.broadcasting.html', publisher: NUMPY },
      { title: 'Copies and views', url: 'https://numpy.org/doc/stable/user/basics.copies.html', publisher: NUMPY }
    ],
    next: 'Module 04 builds labelled, table-shaped data on top of NumPy with pandas.'
  },

  'ai-ds-mod-4': {
    skills: ['Load and inspect DataFrames', 'Aggregate with groupby and transform', 'Combine tables with merge'],
    prerequisites: ['NumPy arrays (Module 03)', 'Basic SQL joins are helpful'],
    intuition: {
      analogy: 'A DataFrame is a spreadsheet that you control with code: every column has a name and a type, every row has an index label, and operations such as "total sales per city" are one line instead of a pivot-table dialog.',
      whyItMatters: 'Most real data arrives as tables (CSV, Excel, SQL). pandas is the standard Python tool for cleaning, reshaping and summarising them before modelling.'
    },
    workflow: {
      title: 'Split–apply–combine with groupby',
      nodes: [
        { id: 'df', label: 'DataFrame', detail: 'orders: customer, amount', input: 'Rows', output: 'Table' },
        { id: 'split', label: 'Split', detail: 'Group rows by key (customer).', input: 'Table', output: 'Groups' },
        { id: 'apply', label: 'Apply', detail: 'agg (sum, count), transform (same shape) or filter.', input: 'Each group', output: 'Per-group results' },
        { id: 'combine', label: 'Combine', detail: 'Results are stitched into a Series/DataFrame.', input: 'Per-group results', output: 'Summary table' },
        { id: 'merge', label: 'Merge', detail: 'Join with customers on the key to add city.', input: 'Two tables', output: 'Enriched table' }
      ],
      edges: [{ from: 'df', to: 'split' }, { from: 'split', to: 'apply' }, { from: 'apply', to: 'combine' }, { from: 'df', to: 'merge' }, { from: 'merge', to: 'split', label: 'group by city' }],
      explanation: 'agg returns one row per group; transform returns a value for every original row, which is ideal for "share of group total" features.'
    },
    workedExample: {
      title: 'groupby, merge and transform',
      language: 'python',
      code: 'import pandas as pd\n\norders = pd.DataFrame({"order_id": [1, 2, 3, 4, 5], "customer": ["A", "B", "A", "C", "B"], "amount": [250, 120, 90, 300, 60]})\ncustomers = pd.DataFrame({"customer": ["A", "B", "C"], "city": ["Hyderabad", "Pune", "Hyderabad"]})\n\nsummary = orders.groupby("customer")["amount"].agg(["count", "sum"])\nprint(summary.loc["A", "sum"], summary.loc["B", "count"])\n\nmerged = orders.merge(customers, on="customer", how="left")\nfor city, total in merged.groupby("city")["amount"].sum().sort_values(ascending=False).items():\n    print(city, total)\n\norders["share"] = orders["amount"] / orders.groupby("customer")["amount"].transform("sum")\nprint(round(orders.loc[0, "share"], 3))',
      lineByLine: [
        { line: 6, explanation: 'Count and total per customer in one call.' },
        { line: 7, explanation: 'Customer A spent 250 + 90 = 340; B has 2 orders.' },
        { line: 9, explanation: 'A left merge keeps every order and adds the customer\'s city.' },
        { line: 10, explanation: 'Hyderabad = A (340) + C (300) = 640; Pune = B (180).' },
        { line: 13, explanation: 'transform("sum") broadcasts each customer\'s total back to its rows: 250 / 340 = 0.735.' }
      ],
      expectedOutput: '340 2\nHyderabad 640\nPune 180\n0.735',
      edgeCases: ['Merging on keys with duplicates on both sides multiplies rows — check df.shape before and after.', 'Chained assignment (df[df.x > 0]["y"] = 1) may not modify df; use df.loc[mask, "y"] = 1.']
    },
    caseStudy: {
      title: 'Monthly course revenue report',
      problem: 'Finance exports enrolments (learner, course, fee, date) and needs revenue per course per month with month-over-month growth.',
      data: 'enrolments.csv with 40,000 rows.',
      steps: ['pd.read_csv(..., parse_dates=["date"]).', 'df["month"] = df["date"].dt.to_period("M").', 'pivot = df.pivot_table(index="month", columns="course", values="fee", aggfunc="sum").', 'growth = pivot.pct_change().round(3).'],
      result: 'A tidy month × course table and its growth rates, regenerated every month by re-running the notebook.',
      limitations: 'Refunds stored in another table must be merged and subtracted for accurate revenue.'
    },
    exercises: [
      {
        id: 'ai4-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Select rows by condition',
        objective: 'Filter a DataFrame correctly.',
        problem: 'Which expression selects orders with amount above 100 AND customer "A"?',
        options: ['df[df.amount > 100 and df.customer == "A"]', 'df[(df.amount > 100) & (df.customer == "A")]', 'df.amount > 100 & df.customer == "A"', 'df.loc[amount > 100, "A"]'],
        hints: ['pandas uses & and | with parentheses around each condition.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Boolean Series are combined element-wise with &.', 'Parentheses are required because & binds more tightly than >.'],
        explanation: 'Python\'s and keyword raises "The truth value of a Series is ambiguous".',
        mistakes: ['Using and/or with Series.'],
        challenge: 'Write the same filter with df.query().'
      },
      {
        id: 'ai4-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Merge row count',
        objective: 'Predict the size of a merge.',
        problem: 'orders has 5 rows with customers A, B, A, C, B. customers has one row each for A and B only (no C). How many rows does orders.merge(customers, on="customer", how="inner") return?',
        hints: ['An inner merge drops orders whose customer is missing from the other table.'],
        check: { type: 'numeric', answer: 4, tolerance: 0 },
        solution: ['Orders for A (2) and B (2) find a match.', 'The order for C has no match and is dropped.', '4 rows.'],
        explanation: 'how="left" would keep all 5 rows with NaN city for C.',
        mistakes: ['Answering 5 by assuming every row survives.'],
        challenge: 'Use indicator=True to see which side each row came from.'
      },
      {
        id: 'ai4-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Average score per course',
        objective: 'Group, aggregate and sort.',
        problem: 'Compute the mean score per course (rounded to 1 decimal) and print courses from highest to lowest mean. Expected:\nSQL 84.5\nPython 79.0\nWeb 71.0',
        starterCode: 'import pandas as pd\ndf = pd.DataFrame({\n    "course": ["Python", "SQL", "Python", "Web", "SQL", "Python"],\n    "score":  [82, 90, 75, 71, 79, 80],\n})\n\n# your code here\n',
        hints: ['df.groupby("course")["score"].mean()', '.sort_values(ascending=False)', 'Iterate with .items() and round each value.'],
        check: { type: 'output', expectedOutput: 'SQL 84.5\nPython 79.0\nWeb 71.0' },
        solutionCode: 'import pandas as pd\ndf = pd.DataFrame({\n    "course": ["Python", "SQL", "Python", "Web", "SQL", "Python"],\n    "score":  [82, 90, 75, 71, 79, 80],\n})\n\nmeans = df.groupby("course")["score"].mean().sort_values(ascending=False)\nfor course, mean in means.items():\n    print(course, round(float(mean), 1))',
        solution: ['Python: (82 + 75 + 80) / 3 = 79.0.', 'SQL: (90 + 79) / 2 = 84.5.', 'Web: 71.0.'],
        explanation: 'Converting with float() avoids NumPy\'s type name appearing in some printing contexts.',
        mistakes: ['Sorting before aggregating.'],
        challenge: 'Add the number of learners per course using agg(["mean", "count"]).'
      }
    ],
    knowledgeCheck: [
      { id: 'ai4-k1', question: 'Which method gives a quick summary of numeric columns?', options: ['df.head()', 'df.describe()', 'df.info()', 'df.shape'], answer: 1, explanation: 'describe() shows count, mean, std, min, quartiles and max.' },
      { id: 'ai4-k2', question: 'df.loc vs df.iloc:', options: ['loc uses labels, iloc uses integer positions', 'They are identical', 'iloc uses labels', 'loc only works on columns'], answer: 0, explanation: 'Use loc for labels/boolean masks and iloc for positions.' },
      { id: 'ai4-k3', question: 'Which reduces memory for a column with few repeated strings?', options: ['astype("category")', 'astype("object")', 'astype("float64")', 'to_list()'], answer: 0, explanation: 'Categoricals store each distinct value once.' }
    ],
    cheatSheet: ['pd.read_csv(path, parse_dates=[…]); df.info(); df.describe()', 'df.loc[mask, cols]; df.iloc[rows, cols]', 'df.groupby(k)[col].agg([…]) / .transform("sum")', 'df.merge(other, on=k, how="left"); df.pivot_table(…)'],
    references: [
      { title: '10 minutes to pandas', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', publisher: PANDAS },
      { title: 'Group by: split-apply-combine', url: 'https://pandas.pydata.org/docs/user_guide/groupby.html', publisher: PANDAS },
      { title: 'Merge, join, concatenate and compare', url: 'https://pandas.pydata.org/docs/user_guide/merging.html', publisher: PANDAS }
    ],
    next: 'Module 05 deals with the messy reality of data: missing values, outliers and encodings.'
  },

  'ai-ds-mod-5': {
    skills: ['Detect and impute missing values', 'Find outliers with the IQR rule', 'Encode categories and scale numeric features'],
    prerequisites: ['pandas basics (Module 04)'],
    intuition: {
      analogy: 'Cleaning data is washing vegetables before cooking: skipping it does not save time — it ruins the dish. A model trained on typos, impossible ages and silent blanks learns those mistakes as if they were facts.',
      whyItMatters: 'Practitioners commonly report that data preparation takes the majority of project time. Systematic cleaning steps make results reproducible and defensible.'
    },
    workflow: {
      title: 'A reproducible cleaning pipeline',
      nodes: [
        { id: 'profile', label: 'Profile', detail: 'isna().sum(), describe(), value_counts().', input: 'Raw table', output: 'Issue list' },
        { id: 'fix', label: 'Fix types & errors', detail: 'Parse dates, strip text, correct units.', input: 'Raw table', output: 'Typed table' },
        { id: 'outliers', label: 'Handle outliers', detail: 'IQR or domain rules; decide remove, cap or keep.', input: 'Typed table', output: 'Plausible values' },
        { id: 'impute', label: 'Impute missing', detail: 'Median / mode / "Unknown" — fitted on training data.', input: 'Plausible values', output: 'Complete table' },
        { id: 'encode', label: 'Encode & scale', detail: 'One-hot categories; scale numerics.', input: 'Complete table', output: 'Model-ready features' }
      ],
      edges: [{ from: 'profile', to: 'fix' }, { from: 'fix', to: 'outliers' }, { from: 'outliers', to: 'impute' }, { from: 'impute', to: 'encode' }],
      explanation: 'Remove impossible values before computing imputation statistics, otherwise a single 120-year-old "learner" shifts the mean used to fill gaps.'
    },
    workedExample: {
      title: 'Missing values, IQR outliers and one-hot encoding',
      language: 'python',
      code: 'import pandas as pd\n\ndf = pd.DataFrame({"age": [22, 25, None, 31, 29, 120], "city": ["Pune", "Delhi", "Pune", None, "Delhi", "Pune"]})\nprint(df["age"].isna().sum(), df["city"].isna().sum())\n\nq1, q3 = df["age"].quantile([0.25, 0.75])\niqr = q3 - q1\noutliers = df[(df["age"] < q1 - 1.5 * iqr) | (df["age"] > q3 + 1.5 * iqr)]\nprint(outliers["age"].tolist())\n\nclean = df.drop(outliers.index).copy()\nclean["age"] = clean["age"].fillna(clean["age"].median())\nclean["city"] = clean["city"].fillna("Unknown")\nprint(clean["age"].tolist())\nprint(sorted(pd.get_dummies(clean["city"]).columns.tolist()))',
      lineByLine: [
        { line: 4, explanation: 'One missing age and one missing city.' },
        { line: 6, explanation: 'Quartiles of the observed ages: Q1 = 25, Q3 = 31, so IQR = 6.' },
        { line: 8, explanation: 'Values outside 16 … 40 are flagged: only 120.' },
        { line: 11, explanation: 'Drop the outlier row before computing the median.' },
        { line: 12, explanation: 'Median of 22, 25, 31, 29 is 27, used to fill the gap.' },
        { line: 15, explanation: 'One-hot encoding creates one column per category.' }
      ],
      expectedOutput: "1 1\n[120.0]\n[22.0, 25.0, 27.0, 31.0, 29.0]\n['Delhi', 'Pune', 'Unknown']",
      edgeCases: ['Imputing with statistics from the whole dataset before a train/test split leaks test information into training.', 'Outliers are not always errors (a genuinely large order); decide with domain knowledge.']
    },
    caseStudy: {
      title: 'Cleaning a learner survey',
      problem: 'A satisfaction survey has blank answers, ages like 0 and 999, and cities spelled "hyd", "Hyderabad" and "HYDERABAD".',
      data: '3,200 survey responses.',
      steps: ['Normalise text: str.strip().str.title(), then map known aliases.', 'Treat impossible ages (< 15 or > 80) as missing.', 'Impute age with the median per course; fill unknown cities with "Unknown".', 'Document every rule in the notebook for reproducibility.'],
      result: 'Clean categories (one Hyderabad), plausible ages, and a written record of every change.',
      limitations: 'Imputation invents values; report how many were imputed and test whether conclusions change without them.'
    },
    exercises: [
      {
        id: 'ai5-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Median imputation',
        objective: 'Compute the value used to fill missing data.',
        problem: 'Observed incomes (thousands): 30, 45, 38, 52, 41. What value does median imputation use for a missing income?',
        hints: ['Sort the values and take the middle one.'],
        check: { type: 'numeric', answer: 41, tolerance: 0 },
        solution: ['Sorted: 30, 38, 41, 45, 52.', 'The middle (3rd) value is 41.'],
        explanation: 'The median is robust to extreme values, unlike the mean (41.2 here, but very different if one income were 900).',
        mistakes: ['Using the unsorted middle value (38).'],
        challenge: 'Compute the mean and see how a value of 900 instead of 52 changes both statistics.'
      },
      {
        id: 'ai5-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'IQR upper fence',
        objective: 'Apply the 1.5 × IQR rule.',
        problem: 'Q1 = 40 and Q3 = 70 for delivery times (minutes). Above what value is a delivery flagged as an outlier by the 1.5 × IQR rule?',
        hints: ['IQR = Q3 − Q1.', 'Upper fence = Q3 + 1.5 × IQR.'],
        check: { type: 'numeric', answer: 115, tolerance: 0 },
        solution: ['IQR = 70 − 40 = 30.', 'Upper fence = 70 + 1.5 × 30 = 115 minutes.'],
        explanation: 'The lower fence would be 40 − 45 = −5, so no short deliveries are flagged.',
        mistakes: ['Adding 1.5 × Q3 instead of 1.5 × IQR.'],
        challenge: 'What is the upper fence using the stricter 3 × IQR "extreme" rule? (160)'
      },
      {
        id: 'ai5-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Clean a small dataset',
        objective: 'Impute, encode and count missing values with pandas.',
        problem: 'Fill missing hours with the median and missing plan with "Basic", then print the missing counts after cleaning, the filled hours, and the one-hot column names. Expected:\n0\n[4.0, 6.0, 5.5, 8.0, 5.0]\n[\'plan_Basic\', \'plan_Pro\']',
        starterCode: 'import pandas as pd\ndf = pd.DataFrame({"hours": [4, 6, None, 8, 5], "plan": ["Pro", None, "Basic", "Pro", "Basic"]})\n\n# your code here\n',
        hints: ['df["hours"] = df["hours"].fillna(df["hours"].median())', 'pd.get_dummies(df, columns=["plan"]) creates plan_Basic and plan_Pro.', 'Total missing: int(df.isna().sum().sum())'],
        check: { type: 'output', expectedOutput: "0\n[4.0, 6.0, 5.5, 8.0, 5.0]\n['plan_Basic', 'plan_Pro']" },
        solutionCode: 'import pandas as pd\ndf = pd.DataFrame({"hours": [4, 6, None, 8, 5], "plan": ["Pro", None, "Basic", "Pro", "Basic"]})\n\ndf["hours"] = df["hours"].fillna(df["hours"].median())\ndf["plan"] = df["plan"].fillna("Basic")\nprint(int(df.isna().sum().sum()))\nprint(df["hours"].tolist())\nencoded = pd.get_dummies(df, columns=["plan"])\nprint([c for c in encoded.columns if c.startswith("plan_")])',
        solution: ['The observed hours sorted are 4, 5, 6, 8; with an even count the median is the mean of the two middle values: (5 + 6) / 2 = 5.5.', 'The missing plan becomes "Basic", so no missing values remain.', 'get_dummies turns plan into plan_Basic and plan_Pro indicator columns.'],
        explanation: 'pandas converts the hours column to float because it contained a missing value (NaN is a float), so the list prints 4.0, 6.0, …',
        mistakes: ['Imputing the plan with the mode when the requirement says "Basic".'],
        challenge: 'Scale hours to 0–1 after imputing.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai5-k1', question: 'Which missing-data mechanism depends on the missing value itself (e.g. high earners skip the income question)?', options: ['MCAR', 'MAR', 'MNAR', 'None'], answer: 2, explanation: 'Missing Not At Random is the hardest case; simple imputation can bias results.' },
      { id: 'ai5-k2', question: 'Why one-hot encode a "city" column instead of mapping cities to 1, 2, 3?', options: ['It is faster', 'Integer codes imply an order and distance that do not exist', 'Models cannot read text', 'To save memory'], answer: 1, explanation: 'One-hot avoids inventing an ordering for nominal categories.' },
      { id: 'ai5-k3', question: 'Which scaler is least affected by outliers?', options: ['Min–max scaling', 'Standardisation (z-score)', 'Robust scaling with median and IQR', 'No scaling'], answer: 2, explanation: 'Median and IQR ignore extreme values.' }
    ],
    cheatSheet: ['df.isna().sum(); df.dropna(); df.fillna(value)', 'q1, q3 = s.quantile([.25, .75]); fences = q1 − 1.5·IQR, q3 + 1.5·IQR', 'pd.get_dummies(df, columns=[…])', 'Fit imputers/scalers on training data only'],
    references: [
      { title: 'Working with missing data', url: 'https://pandas.pydata.org/docs/user_guide/missing_data.html', publisher: PANDAS },
      { title: 'scikit-learn — Imputation of missing values', url: 'https://scikit-learn.org/stable/modules/impute.html', publisher: 'scikit-learn developers' },
      { title: 'scikit-learn — Preprocessing data (scaling and encoding)', url: 'https://scikit-learn.org/stable/modules/preprocessing.html', publisher: 'scikit-learn developers' }
    ],
    next: 'Module 06 turns clean data into clear charts and stories.'
  }
};
