// Visual versions of the text (ASCII) architecture diagrams stored in the course content.
// Keyed by module id. The stored diagrams are not modified: the lesson shows these cards and keeps
// the original text one a click away ("Original diagram"). Every label, branch and loop of the
// original is kept; formulas and advanced terms sit in `details` (shown when a card is opened).
// Rendered by src/components/diagrams/VisualDiagram.jsx.

export const VISUAL_DIAGRAMS = {
  /* ------------------------------------------------------------------ 01 */
  'ai-ds-mod-1': {
    title: 'The AI Ecosystem and the CRISP-DM Lifecycle',
    subtitle: 'Four nested fields of AI, followed by the six-phase process real data-science projects follow.',
    sections: [
      {
        type: 'layers',
        title: 'Artificial intelligence ecosystem',
        text: 'Each level sits inside the one above it, like nesting dolls.',
        items: [
          { title: 'Artificial Intelligence', subtitle: 'Broad vision: machine cognition', icon: 'ai', tone: 'blue',
            text: 'The overall field of building machines that perform tasks needing human-like intelligence.',
            tags: ['Reasoning', 'Planning', 'Problem solving', 'Decision making'],
            details: ['Includes both rule-based (hand-written logic) and adaptive (learning) systems.'] },
          { title: 'Machine Learning', subtitle: 'Statistical pattern extraction', icon: 'data', tone: 'green',
            text: 'A branch of AI where programs learn patterns from data instead of following only hand-written rules.',
            tags: ['Predictions', 'Recommendations', 'Spam detection'],
            details: ['Data → learning algorithm → predictions or decisions. Forms the statistical core of modern AI.'] },
          { title: 'Deep Learning', subtitle: 'Multi-layer neural networks', icon: 'neural', tone: 'purple',
            text: 'A type of machine learning that stacks many layers of artificial neurons to learn complex patterns.',
            tags: ['Image recognition', 'Speech recognition'],
            details: ['Input → input layer → hidden layers 1…N → output. The layers learn useful features automatically.'] },
          { title: 'Generative AI & LLMs', subtitle: 'Diffusion, GPTs, RAG', icon: 'sparkles', tone: 'orange',
            text: 'Systems that create new content (text, images) or work with language.',
            tags: ['Diffusion models (images)', 'GPTs (text)', 'RAG (answers grounded in documents)'],
            details: ['Modern generative models are built on deep-learning foundations such as transformers.'] }
        ]
      },
      {
        type: 'flow',
        title: 'The 6 phases of the CRISP-DM cycle',
        text: 'Projects move forward step by step, but evaluation often sends you back to the start.',
        direction: 'column',
        steps: [
          { title: 'Business Need', subtitle: 'Business understanding', icon: 'target', tone: 'blue', text: 'Define the problem and what success looks like.' },
          { title: 'Data Discovery', subtitle: 'Data understanding', icon: 'search', tone: 'green', text: 'Collect and explore the data that is available.' },
          { title: 'Data Prep / ETL', subtitle: 'Data preparation', icon: 'filter', tone: 'purple', text: 'Clean, transform and organise the data (Extract, Transform, Load).' },
          { title: 'ML Modeling', subtitle: 'Modeling', icon: 'brain', tone: 'orange', text: 'Choose algorithms and train models.' },
          { title: 'Model Evaluation', subtitle: 'Evaluation', icon: 'gauge', tone: 'teal', text: 'Check the model against the business goals before using it.' },
          { title: 'Production Deployment & MLOps', subtitle: 'Deployment', icon: 'rocket', tone: 'rose', text: 'Put the model into use.',
            details: ['MLOps (monitoring, retraining and maintenance) continues after deployment and is not a one-time step.'] }
        ],
        loops: [
          { from: 'Model Evaluation', to: 'Business Need', label: 'Iterative loop: if results miss the goal, revisit the problem and run the cycle again.' }
        ]
      }
    ],
    note: 'Not every AI system uses machine learning, and generative models differ in how they use deep learning — the levels show how the fields relate, not that each always contains the next.'
  },

  /* ------------------------------------------------------------------ 02 */
  'ai-ds-mod-2': {
    title: 'Python Data Structures in Memory and the Data Pipeline',
    subtitle: 'How Python stores values, and the pattern used to process large data step by step.',
    sections: [
      {
        type: 'compare',
        title: 'Python data structures in memory',
        columns: [
          { title: 'Immutable objects', subtitle: 'int, float, str, tuple', icon: 'shield', tone: 'blue',
            text: 'The value can never change. "Changing" the variable creates a brand-new object.',
            items: ["a = 42 → object at address 0x10A holds 42", "a reassigned to 43 → a new object at 0x10B [New Object]"] },
          { title: 'Mutable objects', subtitle: 'list, dict, set', icon: 'boxes', tone: 'green',
            text: 'The same object is updated in place, so no new copy is made.',
            items: ["L = [1, 2] → object at 0x20A holds pointers to the elements", "L.append(3) → still 0x20A, mutated in place"] }
        ]
      },
      {
        type: 'flow',
        title: 'Data processing pipeline pattern',
        steps: [
          { title: 'Raw Data', subtitle: 'CSV / JSON', icon: 'file', text: 'Records read from files.' },
          { title: 'Generator Stream', icon: 'workflow', text: 'Yields one record at a time instead of loading everything.' },
          { title: 'Comprehension / Filter', icon: 'filter', text: 'Keeps and reshapes only the records you need.', details: ['Output: a clean tuple stream.'] },
          { title: 'Statistical Aggregation / ML Model', icon: 'chart', text: 'Consumes the clean tuple stream.' }
        ]
      }
    ],
    note: 'Knowing whether data is changed in place or copied is the difference between tiny memory use and out-of-memory crashes on large datasets.'
  },

  /* ------------------------------------------------------------------ 03 */
  'ai-ds-mod-3': {
    title: 'NumPy ndarray Memory Layout and Broadcasting',
    subtitle: 'Why NumPy is fast, and how it combines arrays of different shapes.',
    sections: [
      {
        type: 'compare',
        title: 'NumPy ndarray contiguous memory layout',
        text: 'Array shape (2, 3) · dtype int32 (4 bytes each) · strides (12, 4).',
        columns: [
          { title: 'Logical view', subtitle: 'How you think about it', icon: 'grid', tone: 'blue',
            items: ['Row 0: [10, 20, 30]', 'Row 1: [40, 50, 60]'] },
          { title: 'Contiguous memory (C-order)', subtitle: 'How it is stored', icon: 'binary', tone: 'green',
            text: 'One contiguous 24-byte RAM buffer: [10 | 20 | 30 | 40 | 50 | 60].',
            details: ['Byte offsets: 0x00, 0x04, 0x08, 0x0C, 0x10, 0x14.', 'Strides (12, 4): move 12 bytes for the next row, 4 bytes for the next column.'] }
        ]
      },
      {
        type: 'flow',
        title: 'NumPy broadcasting rule alignment',
        direction: 'column',
        steps: [
          { title: 'Line up the shapes', icon: 'layers', text: 'Array A has shape (4, 3). Array B has shape (3).' },
          { title: 'Prepend 1 to the shorter shape', icon: 'blocks', text: 'B becomes shape (1, 3).' },
          { title: 'Compare dimensions from the right', icon: 'compare',
            items: ['Dimension 1: 3 == 3 → compatible', 'Dimension 0: 4 vs 1 → the 1 broadcasts to 4'] },
          { title: 'Result shape (4, 3)', icon: 'zap', tone: 'teal', text: 'Executed with zero memory duplication — B is not copied 4 times.' }
        ]
      }
    ],
    note: 'Contiguous storage lets NumPy walk through numbers with byte strides instead of following Python object pointers — the source of its large speed-ups.'
  },

  /* ------------------------------------------------------------------ 04 */
  'ai-ds-mod-4': {
    title: 'Pandas DataFrame Architecture and Split-Apply-Combine',
    subtitle: 'How a DataFrame stores columns, and how groupby works.',
    sections: [
      {
        type: 'compare',
        title: 'Pandas DataFrame memory model',
        text: "Index (rows): [0, 1, 2, … N]. Columns: 'cust_id', 'region', 'revenue', 'churn'. Underlying storage: BlockManager / PyArrow.",
        columns: [
          { title: 'Integer block', subtitle: "['cust_id']", icon: 'binary', tone: 'blue', text: '1D contiguous int64 array.' },
          { title: 'Categorical', subtitle: "['region']", icon: 'shapes', tone: 'purple', text: 'Category / string dictionary.' },
          { title: 'Float block', subtitle: "['revenue']", icon: 'line', tone: 'green', text: '1D contiguous float64 array.' },
          { title: 'Boolean block', subtitle: "['churn']", icon: 'shield', tone: 'orange', text: '1D contiguous bool array.' }
        ]
      },
      {
        type: 'flow',
        title: 'Split-apply-combine workflow (groupby)',
        steps: [
          { title: 'Raw table', icon: 'table', items: ['[North, $100]', '[South, $150]', '[North, $200]', '[South, $350]'] },
          { title: "Split by 'Region'", icon: 'split', items: ["Group 'North': $100, $200", "Group 'South': $150, $350"] },
          { title: 'Apply aggregation', icon: 'sigma', items: ['North: sum() = $300', 'South: sum() = $500'] },
          { title: 'Combine into result', icon: 'combine', tone: 'teal', text: '[North: $300, South: $500]' }
        ]
      }
    ],
    note: 'Columns with the same data type are stored together as fast NumPy blocks; groupby splits rows into groups, aggregates each, and stitches the answers back into one table.'
  },

  /* ------------------------------------------------------------------ 05 */
  'ai-ds-mod-5': {
    title: 'Data Preprocessing Lifecycle and the ColumnTransformer Pipeline',
    subtitle: 'How messy data is cleaned, then prepared reproducibly for a model.',
    sections: [
      {
        type: 'flow',
        title: 'Data cleaning & preprocessing taxonomy',
        direction: 'column',
        steps: [
          { n: '', title: 'Raw enterprise data', icon: 'database', tone: 'slate', text: 'Dirty records straight from the source.' },
          { n: 1, title: 'Data audit', icon: 'list', text: 'Duplicates → invalid casing → structural corrections.' },
          { n: 2, title: 'Missing value analysis', icon: 'search', text: 'Pick a fix based on why the values are missing:',
            items: ['MCAR → simple imputation (median / mode)', 'MAR → multivariate KNN / iterative MICE', 'MNAR → missingness-indicator feature flag + domain imputation'],
            details: ['MCAR: missing completely at random. MAR: missing at random (depends on other columns). MNAR: missing not at random (depends on the missing value itself).'] },
          { n: 3, title: 'Outlier handling', icon: 'filter', text: 'IQR clipping / RobustScaler / Isolation Forest mask.' }
        ]
      },
      {
        type: 'branches',
        title: 'Reproducible scikit-learn ColumnTransformer pipeline',
        source: { title: 'Raw features', text: 'All input columns.' },
        columns: [
          { title: 'Numerical pipeline', tone: 'blue', icon: 'binary', cards: [{ title: 'Imputer', text: 'Fill missing numbers.' }, { title: 'RobustScaler', text: 'Scale using median and IQR, so outliers matter less.' }] },
          { title: 'Categorical pipeline', tone: 'purple', icon: 'shapes', cards: [{ title: 'Imputer', text: 'Fill missing categories.' }, { title: 'OneHotEncoder', text: 'Turn categories into 0/1 columns.' }] }
        ],
        merge: { title: 'Combined feature matrix', text: 'Fed into the ML model.' }
      }
    ],
    note: 'Statistics such as means, medians and category lists are learned only on the training data and then applied unchanged to the test data.'
  },

  /* ------------------------------------------------------------------ 06 */
  'ai-ds-mod-6': {
    title: 'Matplotlib Object Hierarchy and Chart Selection',
    subtitle: 'What a Matplotlib figure is made of, and which chart fits which question.',
    sections: [
      {
        type: 'layers',
        title: 'Matplotlib object-oriented hierarchy',
        items: [
          { n: '', title: 'Figure', subtitle: 'Top-level canvas (bounding container)', icon: 'grid', tone: 'blue', text: 'The whole image. It holds one or more Axes.' }
        ]
      },
      {
        type: 'compare',
        title: 'Inside the Figure: Axes (subplots)',
        columns: [
          { title: 'Axes 1', subtitle: 'Subplot [0, 0]', icon: 'line', tone: 'green', items: ['Title, X-label, Y-label', 'X-axis (ticks, tick labels)', 'Y-axis (ticks, tick labels)', 'Spines (top, bottom, etc.)'] },
          { title: 'Axes 2', subtitle: 'Subplot [0, 1]', icon: 'chart', tone: 'purple', items: ['Title, X-label, Y-label', 'Scatter points, lines, bars', 'Legend', 'Gridlines'] }
        ]
      },
      {
        type: 'table',
        title: 'Chart type selection matrix',
        head: ['Data relationship', 'Single variable (1D)', 'Two variables (2D)'],
        rows: [
          ['Distribution', 'Histplot, KDE, Boxplot', 'Violinplot, Jointplot'],
          ['Comparison', 'Bar chart, Countplot', 'Grouped Barplot, Catplot'],
          ['Relationship', '—', 'Scatterplot, Lineplot'],
          ['Multi-feature', '—', 'Heatmap, Pairplot']
        ]
      }
    ],
    note: 'The Figure is the canvas; each Axes is an independent plot inside it, so you can control every element. Use the matrix to pick a chart from the kind of question you are asking.'
  },

  /* ------------------------------------------------------------------ 07 */
  'ai-ds-mod-7': {
    title: 'Statistical Inference and the Hypothesis Testing Lifecycle',
    subtitle: 'From a sample to a decision about the whole population.',
    sections: [
      {
        type: 'flow',
        title: 'From population to hypotheses',
        direction: 'column',
        steps: [
          { title: 'Population', subtitle: 'Unknown μ (mean) and σ (spread)', icon: 'boxes', text: 'Everyone you care about — too large to measure fully.' },
          { title: 'Random sampling', subtitle: 'n ≥ 30', icon: 'filter', text: 'Pick a random subset.' },
          { title: 'Sample dataset', subtitle: 'x̄, s, n', icon: 'table', text: 'The sample mean, standard deviation and size.',
            details: ['Central Limit Theorem: x̄ ~ N(μ, σ / √n) — sample means are approximately normally distributed.'] },
          { title: 'Formulate hypotheses', icon: 'scale',
            items: ['H0: μA = μB — null hypothesis, no genuine difference', 'H1: μA ≠ μB — alternative hypothesis, a significant difference exists'] }
        ]
      },
      {
        type: 'compare',
        title: 'Select test statistic & alpha (e.g. α = 0.05)',
        columns: [
          { title: "Student's t-test", subtitle: 'Comparing 2 means (numeric)', icon: 'compare', tone: 'blue', text: 'Uses the t-statistic.' },
          { title: 'One-way ANOVA', subtitle: 'Comparing 3+ means (numeric)', icon: 'layers', tone: 'purple', text: 'Uses the F-statistic.' },
          { title: 'Chi-square test', subtitle: 'Categorical frequencies', icon: 'pie', tone: 'orange', text: 'Uses the χ² statistic.' }
        ]
      },
      {
        type: 'compare',
        title: 'Calculate the p-value and decide',
        columns: [
          { title: 'p < 0.05 → Reject H0', icon: 'target', tone: 'green', items: ['Result is statistically significant.', 'Observed difference is unlikely to be due to chance.'] },
          { title: 'p ≥ 0.05 → Fail to reject H0', icon: 'shield', tone: 'slate', items: ['Insufficient evidence to disprove H0.', 'The difference could easily occur by chance.'] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 08 */
  'ai-ds-mod-8': {
    title: 'The Exploratory Data Analysis (EDA) Framework',
    subtitle: 'Five checks that turn a raw dataset into a modeling plan.',
    sections: [
      {
        type: 'flow',
        direction: 'column',
        steps: [
          { n: '', title: 'Raw dataset ingestion', icon: 'database', tone: 'slate', text: 'Structural audit: .shape, .dtypes, .info(), .describe().' },
          { n: 1, title: 'Missingness audit', icon: 'search', tone: 'blue',
            items: ['missingno.matrix() / .isnull().sum()', 'Mechanism classification: MCAR (drop / simple) vs MAR (iterative) vs MNAR (domain indicator)'] },
          { n: 2, title: 'Univariate analysis', subtitle: 'One column at a time', icon: 'chart', tone: 'green',
            items: ['Numerical: histograms, KDE, skewness (> 1.0 indicates heavy skew), kurtosis', 'Categorical: value counts, cardinality checks, rare-category grouping (< 1%)'] },
          { n: 3, title: 'Bivariate & multivariate analysis', subtitle: 'Columns together', icon: 'network', tone: 'purple',
            items: ['Target correlation: Pearson (linear) vs Spearman (monotonic)', 'Feature-to-feature collinearity: correlation heatmap (identify |r| > 0.85)', 'Subgroup dynamics: faceted boxplots, pairplots coloured by target hue'] },
          { n: 4, title: 'Outlier & anomaly diagnostics', icon: 'bug', tone: 'orange',
            items: ['Tukey IQR bounds: [Q1 − 1.5·IQR, Q3 + 1.5·IQR]', 'Treatment decision: cap (winsorize), retain (tree models), or a separate anomaly model'] },
          { n: 5, title: 'Distribution normalization', icon: 'line', tone: 'teal', text: 'Skewed features → apply Log1p / Box-Cox / Yeo-Johnson for linear and distance-based models.' },
          { n: '', title: 'Synthesized data audit & modeling blueprint', icon: 'list', tone: 'rose', text: 'A written plan for how the data will be modeled.' }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 09 */
  'ai-ds-mod-9': {
    title: 'Scikit-Learn Production Pipeline and Validation',
    subtitle: 'A leak-free path from raw data to an honest score on unseen data.',
    sections: [
      {
        type: 'flow',
        title: 'Split the data first',
        steps: [
          { title: 'Raw dataset', subtitle: 'Features X, labels y', icon: 'database' },
          { title: 'Train / test split', subtitle: '80% train, 20% holdout test', icon: 'split', text: 'The test set is put aside and not touched until the very end.' }
        ]
      },
      {
        type: 'branches',
        title: 'Two separate paths',
        columns: [
          { title: 'Training set only', tone: 'blue', icon: 'brain', cards: [
            { title: 'Leak-free preprocessing pipeline', text: 'ColumnTransformer with two sub-pipelines:',
              items: ['Numerical: SimpleImputer(median) → StandardScaler()', 'Categorical: SimpleImputer(most_frequent) → OneHotEncoder()'] },
            { title: 'Estimator training & cross-validation', text: "Pipeline(steps=[('preprocessor', …), ('model', …)]) with K-Fold / Stratified K-Fold CV (5 folds).",
              items: ['Fold 1: train on 2,3,4,5 → validate on 1', 'Fold 2: train on 1,3,4,5 → validate on 2', '…', 'Calculate mean CV score ± std dev'] },
            { title: 'Final estimator fit on full train set', text: 'Retrain once on all the training data.' }
          ] },
          { title: 'Held-out unseen test set', tone: 'orange', icon: 'shield', cards: [
            { title: 'Kept untouched', text: 'Never used for preprocessing statistics, training or tuning.' }
          ] }
        ],
        merge: { title: 'Evaluate on holdout test set', icon: 'gauge', text: 'Single pass: pipeline.score(X_test, y_test) → an unbiased generalization metric.' }
      }
    ]
  },

  /* ------------------------------------------------------------------ 10 */
  'ai-ds-mod-10': {
    title: 'Regression Modeling and the Regularization Spectrum',
    subtitle: 'Objective loss function: J(w) = MSE(w) + regularization penalty.',
    sections: [
      {
        type: 'layers',
        title: 'Start: no penalty',
        items: [
          { n: 1, title: 'Ordinary Least Squares (OLS)', subtitle: 'Penalty: none (λ = 0)', icon: 'line', tone: 'blue',
            text: 'Unbiased, but high variance when features are strongly correlated (multicollinearity) or when there are more features than rows (p > n).',
            details: ['J(w) = (1/n) · ||y − Xw||²', 'Analytical solution: w = (Xᵀ X)⁻¹ Xᵀ y'] }
        ]
      },
      {
        type: 'compare',
        title: 'Add a penalty',
        columns: [
          { n: 2, title: 'Ridge regression', subtitle: 'L2 regularization', icon: 'shield', tone: 'green',
            items: ['Shrinks coefficients toward zero.', 'Solves multicollinearity stably.'],
            details: ['J(w) = MSE(w) + λ · Σ wⱼ²', 'Constraint: ||w||₂² ≤ t (a circle)'] },
          { n: 3, title: 'Lasso regression', subtitle: 'L1 regularization', icon: 'filter', tone: 'purple',
            items: ['Drives some coefficients to exactly zero.', 'Performs automated feature selection.'],
            details: ['J(w) = MSE(w) + λ · Σ |wⱼ|', 'Constraint: ||w||₁ ≤ t (a diamond)'] }
        ]
      },
      {
        type: 'layers',
        title: 'Combine both',
        items: [
          { n: 4, title: 'Elastic Net', subtitle: 'Combined L1 + L2 regularization', icon: 'combine', tone: 'orange',
            text: 'Balances feature sparsity (L1) with stable grouping of correlated predictors (L2).',
            details: ['J(w) = MSE(w) + r·λ·||w||₁ + ((1 − r)/2)·λ·||w||₂²'] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 11 */
  'ai-ds-mod-11': {
    title: 'Classification Algorithms and Decision Taxonomy',
    subtitle: 'Three families of classifiers, then choosing the right metric.',
    sections: [
      {
        type: 'branches',
        title: 'Algorithm families',
        source: { title: 'Input feature space', subtitle: 'X1, X2, …, Xp', text: 'The columns describing each example.' },
        columns: [
          { title: 'Probabilistic / linear', tone: 'blue', icon: 'line', cards: [
            { title: 'Logistic Regression', text: 'Soft linear boundary.', details: ['p = 1 / (1 + e^-(wᵀx + b))'] },
            { title: 'Naive Bayes', text: 'Fast; assumes features are independent.', details: ['P(C|X) ∝ P(C) · Π P(xᵢ|C)'] }
          ] },
          { title: 'Geometric / distance', tone: 'green', icon: 'scan', cards: [
            { title: 'Support Vector Machine (SVM)', text: 'Support vectors define the boundary.', details: ['Maximize the margin 2 / ||w||'] },
            { title: 'K-Nearest Neighbors (KNN)', text: 'Majority vote of the k nearest neighbours. Non-parametric, lazy learner.' }
          ] },
          { title: 'Hierarchical / ensemble', tone: 'purple', icon: 'branch', cards: [
            { title: 'Decision Trees (CART)', text: 'Orthogonal partitions of the feature space.', details: ['Gini / entropy splits'] },
            { title: 'Random Forest (bagging) & XGBoost (boosting)', text: 'Many trees combined: low variance, high predictive power.' }
          ] }
        ]
      },
      {
        type: 'compare',
        title: 'Evaluation metric selection (imbalance aware)',
        columns: [
          { title: 'Balanced classes', subtitle: '50 / 50', icon: 'scale', tone: 'teal', items: ['Accuracy', 'Confusion matrix', 'Macro F1-score'] },
          { title: 'Imbalanced classes', subtitle: '95 / 5 or 99 / 1', icon: 'gauge', tone: 'orange', items: ['Precision, Recall, F1-score', 'PR-AUC', 'SMOTE (oversampling)'] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 12 */
  'ai-ds-mod-12': {
    title: 'Clustering and Dimensionality Reduction',
    subtitle: 'Two ways to find structure in data that has no labels.',
    sections: [
      {
        type: 'branches',
        source: { title: 'Unlabeled high-dimensional dataset', subtitle: 'X in R^(n × p)', text: 'n rows, p columns, no target column.' },
        columns: [
          { title: 'Clustering (partitioning & density)', tone: 'blue', icon: 'shapes', cards: [
            { title: 'K-Means / K-Means++', text: 'Spherical, centroid-based clusters.', details: ['Minimize inertia: Σ ||xᵢ − μₖ||²'] },
            { title: 'DBSCAN (density-based)', text: 'Discovers arbitrary, non-spherical shapes and isolates noise / outliers as label −1.', details: ['Parameters: eps (radius), min_samples'] },
            { title: 'Cluster validation diagnostics', text: 'Elbow method + silhouette analysis (s > 0.5).' }
          ] },
          { title: 'Dimensionality reduction (compression)', tone: 'purple', icon: 'layers', cards: [
            { title: 'Principal Component Analysis (PCA)', text: 'Keep the top k directions that explain the most variation.', details: ['Covariance matrix: Σ = Xᵀ X', 'Eigen-decomposition: Σ v = λ v', 'Select top k components'] },
            { title: 'Non-linear manifold learning', items: ['t-SNE: preserves local neighbours', 'UMAP: preserves global & local structure'] },
            { title: 'Low-dimensional representations', text: '2D / 3D visualization and denoising.' }
          ] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 13 */
  'ai-ds-mod-13': {
    title: 'Model Evaluation, Optimization and Explainability',
    subtitle: 'Tune honestly with nested cross-validation, then check calibration, explanations and errors.',
    sections: [
      {
        type: 'flow',
        title: 'Dataset partitioning: outer K-fold cross-validation',
        text: 'The outer loop measures how well the whole process generalizes.',
        direction: 'column',
        steps: [
          { title: 'Outer fold split', icon: 'split', tone: 'blue', text: 'Fold 1: train on folds 2, 3, 4, 5 → holdout validation on fold 1 (repeated for every fold).' },
          { title: 'Inner K-fold CV (hyperparameter tuning)', subtitle: 'Within the training folds only', icon: 'loop', tone: 'purple', text: 'Search strategies:',
            items: ['GridSearchCV: exhaustive Cartesian search', 'RandomizedSearchCV: sampled from statistical distributions', 'Bayesian optimization (Optuna / TPE): directed probabilistic surrogate updates'] },
          { title: 'Refit', icon: 'target', tone: 'green', text: 'Optimal hyperparameters found → refit on fold 1 training data, then score on the holdout fold.' }
        ],
        loops: [{ from: 'Refit', to: 'Outer fold split', label: 'repeat for the next outer fold' }]
      },
      {
        type: 'compare',
        title: 'Post-optimization validation & interpretability',
        columns: [
          { n: 1, title: 'Probability calibration', icon: 'gauge', tone: 'blue', items: ['Reliability curves', 'Platt scaling (sigmoid)', 'Isotonic (non-parametric)'] },
          { n: 2, title: 'Explainability & importance', icon: 'idea', tone: 'green', items: ['Permutation importance', 'TreeSHAP / KernelSHAP values', 'Waterfall / summary plots'] },
          { n: 3, title: 'Error diagnostics', icon: 'bug', tone: 'orange', items: ['Top false negatives', 'Residual distribution', "McNemar's test vs a reference model"] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 14 */
  'ai-ds-mod-14': {
    title: 'Deep Learning, Transformer Attention and RAG',
    subtitle: 'Three building blocks of modern AI systems.',
    sections: [
      {
        type: 'flow',
        title: 'Part A: artificial neural network (forward & backward pass)',
        steps: [
          { title: 'Input layer', subtitle: 'x', icon: 'data' },
          { title: 'Hidden layer 1', subtitle: 'ReLU activation', icon: 'neural', details: ['z1 = W1·x + b1', 'a1 = ReLU(z1)'] },
          { title: 'Output layer', subtitle: 'ŷ (prediction)', icon: 'target', details: ['z2 = W2·a1 + b2 → ŷ'] },
          { title: 'Loss', subtitle: 'L(y, ŷ) = cross-entropy', icon: 'gauge', text: 'How wrong the prediction is.' }
        ],
        loops: [{ from: 'Loss', to: 'Input layer', label: 'Backpropagation: dL/dW = dL/dŷ · dŷ/dz · dz/dW sends the error backwards and updates every weight.' }]
      },
      {
        type: 'branches',
        title: 'Part B: transformer self-attention mechanism',
        source: { title: 'Tokens → embeddings', subtitle: '["Data", "Science", "Model"]', text: 'Embeddings (E) + positional encodings (PE).', icon: 'chat' },
        columns: [
          { title: 'Query', tone: 'blue', cards: [{ title: 'Q = E · W_Q', text: 'What each token is looking for.' }] },
          { title: 'Key', tone: 'green', cards: [{ title: 'K = E · W_K', text: 'What each token offers to match against.' }] },
          { title: 'Value', tone: 'purple', cards: [{ title: 'V = E · W_V', text: 'The information each token passes on.' }] }
        ]
      },
      {
        type: 'flow',
        title: 'Attention computation',
        steps: [
          { title: 'Scaled dot-product', subtitle: 'Uses Q and K', icon: 'sigma', details: ['S = Q · Kᵀ / √d_k'] },
          { title: 'Attention weights', subtitle: 'Softmax(S)', icon: 'pie', text: 'How much each token attends to every other token.' },
          { title: 'Context output', subtitle: 'Uses the weights and V', icon: 'combine', tone: 'teal', details: ['Z = Attention_Weights · V'] }
        ]
      },
      {
        type: 'branches',
        title: 'Part C: retrieval-augmented generation (RAG) pipeline',
        columns: [
          { title: 'Indexing documents', tone: 'blue', icon: 'file', cards: [{ title: 'Documents' }, { title: 'Chunking' }, { title: 'Embedding model' }, { title: 'Vector DB', subtitle: 'FAISS / Chroma' }] },
          { title: 'Answering a question', tone: 'orange', icon: 'chat', cards: [{ title: 'User query' }, { title: 'Embedding model' }, { title: 'ANN vector similarity search', text: 'Finds the closest chunks in the vector DB.' }, { title: 'Retrieved context + user prompt' }] }
        ],
        merge: { title: 'LLM (Claude / GPT / LLaMA)', icon: 'sparkles', text: 'Produces a grounded, factual response based on the retrieved context.' }
      }
    ]
  },

  /* ------------------------------------------------------------------ 15 */
  'ai-ds-mod-15': {
    title: 'End-to-End MLOps Production Deployment',
    subtitle: 'From a notebook model to a monitored web service.',
    sections: [
      {
        type: 'flow',
        title: 'Offline training environment',
        text: 'Jupyter / Python script.',
        steps: [
          { title: 'Dataset', icon: 'database' },
          { title: 'Pipeline', subtitle: 'Preprocess + model', icon: 'workflow' },
          { title: 'Validation & tuning', icon: 'gauge' }
        ]
      },
      {
        type: 'flow',
        title: 'Serialization & artifact storage',
        steps: [
          { title: 'Save the pipeline', icon: 'filecode', details: ["joblib.dump(pipeline, 'model_v1.0.0.joblib')"] },
          { title: 'S3 / cloud model registry', icon: 'cloud', text: 'Versioned storage for model files.' }
        ]
      },
      {
        type: 'code',
        title: 'Online serving service (FastAPI microservice)',
        label: 'Pydantic schema validation + a /predict endpoint',
        code: 'class InferenceRequest(BaseModel):  # Pydantic Schema Validation\n    features: list[float]\n\n@app.post("/predict")\nasync def predict(payload: InferenceRequest):\n    prediction = model.predict([payload.features])\n    log_payload_to_db(payload, prediction)\n    return {"prediction": prediction[0]}'
      },
      {
        type: 'flow',
        title: 'Containerization (Docker)',
        steps: [
          { title: 'Dockerfile', icon: 'filecode' },
          { title: 'Build image', icon: 'container', details: ['docker build -t ml-api:v1 .'] },
          { title: 'Run container', icon: 'server', details: ['docker run -p 8000:8000'] }
        ]
      },
      {
        type: 'compare',
        title: 'Production observability & drift monitoring',
        text: 'MLOps continues after deployment.',
        columns: [
          { n: 1, title: 'Data drift', subtitle: 'PSI / KS-test', icon: 'trend', tone: 'blue', text: 'Trigger an alert if PSI > 0.2.' },
          { n: 2, title: 'Concept drift', subtitle: 'True labels', icon: 'loop', tone: 'purple', text: 'Retrain if AUC drops by more than 5%.' },
          { n: 3, title: 'Latency & health', icon: 'gauge', tone: 'orange', text: 'Monitor p99 latency.' }
        ]
      }
    ]
  }
};

export function visualDiagramFor(moduleId) {
  return VISUAL_DIAGRAMS[moduleId] || null;
}
