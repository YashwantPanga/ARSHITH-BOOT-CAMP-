// Additional learning content for AI with Data Science, modules 11–15.
const SK = 'scikit-learn developers';
const GOOGLE_ML = 'Google for Developers';

export default {
  'ai-ds-mod-11': {
    skills: ['Build and read a confusion matrix', 'Choose between precision, recall and F1 for a business problem', 'Adjust a decision threshold on predicted probabilities'],
    prerequisites: ['ML workflow (Module 09)', 'Basic probability (Module 07)'],
    intuition: {
      analogy: 'A fraud detector is a security guard. Precision asks: "Of the people the guard stopped, how many were really thieves?" Recall asks: "Of all the thieves, how many did the guard stop?" A guard who stops everyone has perfect recall and terrible precision.',
      whyItMatters: 'Accuracy hides the costs that matter. Missing a disease (false negative) and alarming a healthy person (false positive) have very different consequences, and the metric must reflect that.'
    },
    workflow: {
      title: 'From scores to decisions',
      nodes: [
        { id: 'x', label: 'Features', detail: 'Activity, history, amounts…', input: 'Example', output: 'Feature vector' },
        { id: 'score', label: 'Model score', detail: 'Logistic regression: z = w·x + b.', input: 'Features', output: 'Score z' },
        { id: 'prob', label: 'Sigmoid', detail: 'p = 1 / (1 + e^(−z)) ∈ (0, 1).', input: 'z', output: 'Probability' },
        { id: 'thr', label: 'Threshold', detail: 'Predict 1 if p ≥ t (default 0.5; tuned to costs).', input: 'Probability', output: 'Class label' },
        { id: 'cm', label: 'Confusion matrix', detail: 'TP, FP, FN, TN on the test set.', input: 'Labels vs truth', output: 'Counts' },
        { id: 'metrics', label: 'Metrics', detail: 'Precision = TP/(TP+FP); Recall = TP/(TP+FN); F1.', input: 'Counts', output: 'Business-relevant scores' }
      ],
      edges: [{ from: 'x', to: 'score' }, { from: 'score', to: 'prob' }, { from: 'prob', to: 'thr' }, { from: 'thr', to: 'cm' }, { from: 'cm', to: 'metrics' }, { from: 'metrics', to: 'thr', label: 'tune t' }],
      explanation: 'Lowering the threshold raises recall and usually lowers precision; the right threshold depends on the relative cost of each error type.'
    },
    workedExample: {
      title: 'Confusion matrix and metrics from scratch',
      language: 'python',
      code: 'import math\n\ny_true = [1, 0, 1, 1, 0, 1, 0, 0, 1, 0]\ny_pred = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0]\n\ntp = sum(t == 1 and p == 1 for t, p in zip(y_true, y_pred))\nfp = sum(t == 0 and p == 1 for t, p in zip(y_true, y_pred))\nfn = sum(t == 1 and p == 0 for t, p in zip(y_true, y_pred))\ntn = sum(t == 0 and p == 0 for t, p in zip(y_true, y_pred))\nprecision = tp / (tp + fp)\nrecall = tp / (tp + fn)\nf1 = 2 * precision * recall / (precision + recall)\nprint(tp, fp, fn, tn)\nprint(round(precision, 2), round(recall, 2), round(f1, 2))\nprint(round(1 / (1 + math.exp(-2)), 3))',
      lineByLine: [
        { line: 6, explanation: 'True positives: predicted 1 and actually 1.' },
        { line: 7, explanation: 'False positives: predicted 1 but actually 0.' },
        { line: 8, explanation: 'False negatives: predicted 0 but actually 1.' },
        { line: 13, explanation: 'F1 is the harmonic mean of precision and recall.' },
        { line: 16, explanation: 'sigmoid(2) ≈ 0.881: a score of 2 means about 88% probability.' }
      ],
      expectedOutput: '4 1 1 4\n0.8 0.8 0.8\n0.881',
      edgeCases: ['With 1% positives, a model predicting all zeros has 99% accuracy and 0 recall.', 'Precision is undefined when the model predicts no positives (TP + FP = 0); libraries return 0 with a warning.']
    },
    caseStudy: {
      title: 'Flagging learners for mentor calls',
      problem: 'Mentors can call 50 learners a week. Missing an at-risk learner is costly, but wasted calls are limited by capacity.',
      data: 'Weekly predicted dropout probabilities for 600 active learners.',
      steps: ['Rank learners by probability instead of using a fixed 0.5 threshold.', 'Call the top 50 each week (precision@50).', 'Track recall over the cohort: what fraction of eventual dropouts were called?', 'Re-tune the cut-off as capacity changes.'],
      result: 'Capacity is fully used on the most at-risk learners, and the metric (precision@50) matches how the model is actually used.',
      limitations: 'Contacted learners may change behaviour, which changes future training labels (feedback loop).'
    },
    exercises: [
      {
        id: 'ai11-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Precision',
        objective: 'Compute precision from counts.',
        problem: 'A spam filter flags 50 emails; 40 are actually spam. What is its precision?',
        hints: ['Precision = TP / (TP + FP).'],
        check: { type: 'numeric', answer: 0.8, tolerance: 0.001 },
        solution: ['TP = 40, FP = 10.', 'Precision = 40 / 50 = 0.8.'],
        explanation: '80% of flagged emails were really spam.',
        mistakes: ['Dividing by all spam emails (that is recall).'],
        challenge: 'If there were 60 spam emails in total, what is the recall? (0.667)'
      },
      {
        id: 'ai11-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'F1 score',
        objective: 'Combine precision and recall.',
        problem: 'Precision = 0.8 and recall = 0.6. What is the F1 score? (3 decimals)',
        hints: ['F1 = 2PR / (P + R).'],
        check: { type: 'numeric', answer: 0.686, tolerance: 0.002 },
        solution: ['2 × 0.8 × 0.6 = 0.96.', '0.8 + 0.6 = 1.4.', '0.96 / 1.4 ≈ 0.686.'],
        explanation: 'The harmonic mean is pulled towards the lower value, so a model cannot hide poor recall behind high precision.',
        mistakes: ['Using the arithmetic mean (0.7).'],
        challenge: 'For which precision/recall pair is F1 equal to both? (When P = R.)'
      },
      {
        id: 'ai11-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Threshold trade-off',
        objective: 'Measure precision and recall at two thresholds.',
        problem: 'For thresholds 0.5 and 0.3, print the threshold, precision (3 decimals) and recall. Expected:\n0.5 0.75 0.75\n0.3 0.667 1.0',
        starterCode: 'probs = [0.9, 0.4, 0.35, 0.8, 0.2, 0.6, 0.55, 0.1]\ny     = [1,   1,   0,    1,   0,   1,   0,    0]\n\nfor t in (0.5, 0.3):\n    # predict 1 when prob >= t, then compute precision and recall\n    pass\n',
        hints: ['pred = [1 if p >= t else 0 for p in probs]', 'tp = sum(a == 1 and b == 1 for a, b in zip(pred, y))'],
        check: { type: 'output', expectedOutput: '0.5 0.75 0.75\n0.3 0.667 1.0' },
        solutionCode: 'probs = [0.9, 0.4, 0.35, 0.8, 0.2, 0.6, 0.55, 0.1]\ny     = [1,   1,   0,    1,   0,   1,   0,    0]\n\nfor t in (0.5, 0.3):\n    pred = [1 if p >= t else 0 for p in probs]\n    tp = sum(a == 1 and b == 1 for a, b in zip(pred, y))\n    fp = sum(a == 1 and b == 0 for a, b in zip(pred, y))\n    fn = sum(a == 0 and b == 1 for a, b in zip(pred, y))\n    print(t, round(tp / (tp + fp), 3), round(tp / (tp + fn), 3))',
        solution: ['At 0.5: predictions 1,0,0,1,0,1,1,0 → TP 3, FP 1, FN 1 → 0.75 / 0.75.', 'At 0.3: predictions 1,1,1,1,0,1,1,0 → TP 4, FP 2, FN 0 → 0.667 / 1.0.'],
        explanation: 'Lowering the threshold caught the missed positive (prob 0.4) at the cost of one extra false alarm.',
        mistakes: ['Using > instead of >= changes results when a probability equals the threshold.'],
        challenge: 'Find the threshold that maximises F1 among 0.1, 0.2, …, 0.9.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai11-k1', question: 'For cancer screening, which error is usually most costly?', options: ['False positive', 'False negative', 'True negative', 'True positive'], answer: 1, explanation: 'Missing a disease is typically worse than a follow-up test — prioritise recall.' },
      { id: 'ai11-k2', question: 'What does logistic regression output before thresholding?', options: ['A class name', 'A probability between 0 and 1', 'A distance', 'A cluster id'], answer: 1, explanation: 'The sigmoid maps the linear score to a probability.' },
      { id: 'ai11-k3', question: 'ROC-AUC measures…', options: ['Accuracy at 0.5', 'Ranking quality across all thresholds', 'Training speed', 'Precision only'], answer: 1, explanation: 'AUC is the probability a random positive is scored above a random negative.' }
    ],
    cheatSheet: ['Precision = TP/(TP+FP) · Recall = TP/(TP+FN) · F1 = 2PR/(P+R)', 'p = 1/(1+e^(−z)); predict 1 if p ≥ t', 'confusion_matrix, classification_report, roc_auc_score', 'Use class_weight="balanced" for imbalance'],
    references: [
      { title: 'scikit-learn — Metrics and scoring (classification)', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics', publisher: SK },
      { title: 'Google ML Crash Course — Classification: accuracy, recall, precision', url: 'https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall', publisher: GOOGLE_ML },
      { title: 'scikit-learn — Logistic regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression', publisher: SK }
    ],
    next: 'Module 12 finds structure in data without labels using clustering and dimensionality reduction.'
  },

  'ai-ds-mod-12': {
    skills: ['Run and interpret k-means clustering', 'Choose k with inertia and silhouette reasoning', 'Reduce dimensions with PCA and read explained variance'],
    prerequisites: ['NumPy (Module 03)', 'Scaling (Module 05)'],
    intuition: {
      analogy: 'k-means is like placing k ice-cream stalls on a beach: each visitor walks to the nearest stall, then each stall moves to the middle of its customers, and this repeats until nobody changes stall. PCA is finding the camera angle from which a 3-D object casts the most informative 2-D shadow.',
      whyItMatters: 'Customer segmentation, anomaly detection and visualising high-dimensional data all rely on these unsupervised tools — useful when labels do not exist.'
    },
    workflow: {
      title: 'One k-means iteration',
      nodes: [
        { id: 'init', label: 'Initialise k centroids', detail: 'Random points or k-means++.', input: 'Scaled data, k', output: 'Centroids' },
        { id: 'assign', label: 'Assign', detail: 'Each point joins its nearest centroid.', input: 'Points + centroids', output: 'Cluster labels' },
        { id: 'update', label: 'Update', detail: 'Each centroid moves to the mean of its points.', input: 'Labels', output: 'New centroids' },
        { id: 'conv', label: 'Converged?', detail: 'Labels unchanged or movement below tolerance.', input: 'Old vs new', output: 'Yes / no' },
        { id: 'done', label: 'Result', detail: 'Labels, centroids, inertia (within-cluster SSE).', input: 'Final state', output: 'Segments' }
      ],
      edges: [{ from: 'init', to: 'assign' }, { from: 'assign', to: 'update' }, { from: 'update', to: 'conv' }, { from: 'conv', to: 'assign', label: 'no' }, { from: 'conv', to: 'done', label: 'yes' }],
      explanation: 'k-means minimises inertia but can stop in a local minimum, so libraries run several initialisations (n_init) and keep the best.'
    },
    workedExample: {
      title: 'One k-means step and PCA with NumPy',
      language: 'python',
      code: 'import numpy as np\n\nX = np.array([[1, 1], [1.5, 2], [3, 3.5], [5, 7], [3.5, 5], [4.5, 5], [3.5, 4.5]])\ncentroids = np.array([[1.0, 1.0], [5.0, 7.0]])\n\nd = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)   # (7, 2) distances\nlabels = d.argmin(axis=1)\nprint(labels.tolist())\nnew_centroids = np.array([X[labels == k].mean(axis=0) for k in range(2)])\nprint(np.round(new_centroids, 3).tolist())\n\nZ = np.array([[2.0, 4.1], [3.0, 6.0], [4.0, 8.2], [5.0, 9.9]])\nZc = Z - Z.mean(axis=0)\ns = np.linalg.svd(Zc, compute_uv=False)\nratio = s ** 2 / (s ** 2).sum()\nprint(round(float(ratio[0]), 3))',
      lineByLine: [
        { line: 6, explanation: 'Broadcasting computes every point-to-centroid distance at once.' },
        { line: 7, explanation: 'Each point is assigned to its nearest centroid.' },
        { line: 9, explanation: 'Each centroid moves to the mean of its assigned points.' },
        { line: 13, explanation: 'PCA: centre the data, then the singular values give variance along principal directions.' },
        { line: 15, explanation: 'The first component explains almost all variance because the two columns are nearly proportional.' }
      ],
      expectedOutput: '[0, 0, 0, 1, 1, 1, 1]\n[[1.833, 2.167], [4.125, 5.375]]\n1.0',
      edgeCases: ['Always scale features before k-means or PCA; otherwise the column with the largest units dominates.', 'k-means assumes roughly spherical, similar-sized clusters; DBSCAN handles irregular shapes and noise.']
    },
    caseStudy: {
      title: 'Segmenting learners by study behaviour',
      problem: 'The team wants different nudges for different study styles but has no labels.',
      data: 'Per learner: sessions per week, average session length, quiz attempts, night-time share.',
      steps: ['Standardise the four features.', 'Run k-means for k = 2…8 and plot inertia (elbow) and silhouette.', 'Choose k = 4; describe each cluster by its centroid ("weekend sprinters", "daily short sessions", …).', 'Use PCA to plot the clusters in 2-D for the presentation.'],
      result: 'Four interpretable segments, each with a tailored reminder schedule tested in an experiment.',
      limitations: 'Clusters are descriptive, not ground truth; validate that they are stable across months and lead to different outcomes.'
    },
    exercises: [
      {
        id: 'ai12-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Before running k-means',
        objective: 'Prepare data for distance-based clustering.',
        problem: 'Features are income (₹ 10,000–5,00,000) and age (18–60). What should you do before k-means?',
        options: ['Nothing', 'Standardise or scale both features', 'Drop age', 'Sort by income'],
        hints: ['Euclidean distance adds squared differences across features.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Without scaling, income differences (hundreds of thousands) dwarf age differences, so clusters would depend almost only on income.'],
        explanation: 'StandardScaler gives each feature mean 0 and variance 1.',
        mistakes: ['Assuming k-means is scale-invariant.'],
        challenge: 'Would scaling change the result of a decision tree? (Generally no.)'
      },
      {
        id: 'ai12-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Compute inertia',
        objective: 'Calculate within-cluster sum of squares.',
        problem: 'A cluster contains (1, 2) and (3, 4) with centroid (2, 3). What is its inertia (sum of squared distances to the centroid)?',
        hints: ['(1−2)² + (2−3)² for the first point.'],
        check: { type: 'numeric', answer: 4, tolerance: 0 },
        solution: ['Point 1: 1 + 1 = 2.', 'Point 2: 1 + 1 = 2.', 'Inertia = 4.'],
        explanation: 'Inertia always decreases as k grows, which is why it is combined with the elbow or silhouette method.',
        mistakes: ['Summing distances instead of squared distances.'],
        challenge: 'What is the inertia if k equals the number of points? (0)'
      },
      {
        id: 'ai12-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Assign and measure',
        objective: 'Assign points to centroids and compute inertia with NumPy.',
        problem: 'Assign each point to the nearest centroid and print the labels and the total inertia (2 decimals). Expected:\n[0, 0, 1, 1, 1]\n2.0',
        starterCode: 'import numpy as np\nX = np.array([[0.0, 0.0], [1.0, 0.0], [5.0, 5.0], [6.0, 5.0], [5.0, 6.0]])\ncentroids = np.array([[0.5, 0.0], [5.5, 5.5]])\n\n# labels and inertia\n',
        hints: ['d2 = ((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)', 'labels = d2.argmin(axis=1); inertia = d2.min(axis=1).sum()'],
        check: { type: 'output', expectedOutput: '[0, 0, 1, 1, 1]\n2.0' },
        solutionCode: 'import numpy as np\nX = np.array([[0.0, 0.0], [1.0, 0.0], [5.0, 5.0], [6.0, 5.0], [5.0, 6.0]])\ncentroids = np.array([[0.5, 0.0], [5.5, 5.5]])\n\nd2 = ((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)\nlabels = d2.argmin(axis=1)\nprint(labels.tolist())\nprint(round(float(d2.min(axis=1).sum()), 2))',
        solution: ['(0, 0) and (1, 0) are each 0.5 away from (0.5, 0): squared distance 0.25 each → 0.5 for cluster 0.', '(5, 5), (6, 5) and (5, 6) are each at squared distance 0.25 + 0.25 = 0.5 from (5.5, 5.5) → 1.5 for cluster 1.', 'Total inertia = 0.5 + 1.5 = 2.0.'],
        explanation: 'Inertia sums squared distances, so it is in squared units of the features.',
        mistakes: ['Taking square roots before summing.'],
        challenge: 'Move the centroids to the cluster means and recompute the inertia.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai12-k1', question: 'Which value must you choose before running k-means?', options: ['The labels', 'The number of clusters k', 'The test size', 'The learning rate'], answer: 1, explanation: 'Use the elbow method, silhouette scores and domain sense.' },
      { id: 'ai12-k2', question: 'PCA components are…', options: ['Original columns', 'Orthogonal directions of maximum variance', 'Cluster centroids', 'Class labels'], answer: 1, explanation: 'Each successive component captures the most remaining variance.' },
      { id: 'ai12-k3', question: 'Which algorithm can label points as noise?', options: ['k-means', 'DBSCAN', 'PCA', 'Linear regression'], answer: 1, explanation: 'Points in low-density regions are marked as outliers.' }
    ],
    cheatSheet: ['KMeans(n_clusters=k, n_init=10).fit(X_scaled)', 'inertia_ (lower is tighter), silhouette_score (−1…1)', 'PCA(n_components=2).fit_transform(X_scaled); explained_variance_ratio_', 'Scale first; check stability'],
    references: [
      { title: 'scikit-learn — Clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html', publisher: SK },
      { title: 'scikit-learn — Decomposing signals in components (PCA)', url: 'https://scikit-learn.org/stable/modules/decomposition.html', publisher: SK },
      { title: 'Google — Clustering course', url: 'https://developers.google.com/machine-learning/clustering', publisher: GOOGLE_ML }
    ],
    next: 'Module 13 makes model evaluation rigorous with validation strategies and tuning.'
  },

  'ai-ds-mod-13': {
    skills: ['Use train/validation/test splits and k-fold cross-validation', 'Tune hyperparameters without leaking the test set', 'Diagnose bias vs variance'],
    prerequisites: ['Modules 09–11'],
    intuition: {
      analogy: 'Cross-validation is like a teacher giving five different mock exams, each covering a different part of the syllabus, instead of judging a student on a single test. The average score is more reliable, and the spread shows how consistent the student is.',
      whyItMatters: 'Choosing models and hyperparameters on the test set quietly turns it into training data. Disciplined validation is what makes reported performance trustworthy.'
    },
    workflow: {
      title: 'Model selection without leakage',
      nodes: [
        { id: 'data', label: 'Full dataset', detail: 'Labelled examples.', input: 'Data', output: 'Rows' },
        { id: 'test', label: 'Hold out test set', detail: 'Lock it away until the very end.', input: 'Rows', output: 'Untouched test set' },
        { id: 'cv', label: 'k-fold CV on training data', detail: 'Each fold is the validation set once.', input: 'Training rows', output: 'k scores per setting' },
        { id: 'tune', label: 'Tune hyperparameters', detail: 'GridSearchCV / RandomizedSearchCV picks the best mean CV score.', input: 'CV scores', output: 'Chosen settings' },
        { id: 'refit', label: 'Refit on all training data', detail: 'Train the final model with chosen settings.', input: 'Settings', output: 'Final model' },
        { id: 'final', label: 'Evaluate once on test', detail: 'Report this number.', input: 'Final model + test set', output: 'Honest estimate' }
      ],
      edges: [{ from: 'data', to: 'test' }, { from: 'data', to: 'cv', label: 'training part' }, { from: 'cv', to: 'tune' }, { from: 'tune', to: 'refit' }, { from: 'refit', to: 'final' }, { from: 'test', to: 'final' }],
      explanation: 'The test set is used exactly once; every decision before that uses only validation folds.'
    },
    workedExample: {
      title: 'Fold indices and a cross-validation summary',
      language: 'python',
      code: 'import numpy as np\n\nn, k = 10, 5\nindices = np.arange(n)\nfolds = np.array_split(indices, k)\nfor i, val_idx in enumerate(folds[:2]):\n    train_idx = np.setdiff1d(indices, val_idx)\n    print(f"fold {i}: val={val_idx.tolist()} train_size={len(train_idx)}")\n\nscores = np.array([0.80, 0.75, 0.90, 0.85, 0.80])\nprint(f"CV accuracy: {scores.mean():.2f} ± {scores.std():.3f}")',
      lineByLine: [
        { line: 5, explanation: 'Split 10 indices into 5 consecutive folds of 2.' },
        { line: 7, explanation: 'Training indices are everything except the validation fold.' },
        { line: 8, explanation: 'Each fold trains on 8 rows and validates on 2.' },
        { line: 11, explanation: 'Report mean ± standard deviation across folds: 0.82 ± 0.051.' }
      ],
      expectedOutput: 'fold 0: val=[0, 1] train_size=8\nfold 1: val=[2, 3] train_size=8\nCV accuracy: 0.82 ± 0.051',
      edgeCases: ['Shuffle before splitting unless data are time-ordered; for time series use forward-chaining (TimeSeriesSplit).', 'When rows from the same person appear several times, use GroupKFold so a person is never in both training and validation.']
    },
    caseStudy: {
      title: 'Choosing tree depth for a completion model',
      problem: 'A decision tree reaches 100% training accuracy at depth 20 but performs worse on new learners.',
      data: '8,000 learners, 30 features.',
      steps: ['Hold out 20% as a test set.', 'Run 5-fold CV for max_depth in {2, 4, 6, 8, 12, 20}.', 'Plot training vs validation accuracy: validation peaks at depth 6 then falls (overfitting).', 'Refit with depth 6 and evaluate once on the test set.'],
      result: 'The chosen depth generalises: the test score is close to the CV estimate.',
      limitations: 'If the test score differs a lot from CV, investigate distribution shift before trusting either.'
    },
    exercises: [
      {
        id: 'ai13-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Where to tune?',
        objective: 'Protect the test set.',
        problem: 'On which data should you compare different regularisation strengths?',
        options: ['The test set', 'Validation folds (cross-validation) within the training data', 'The full dataset including test', 'Random new data you generate'],
        hints: ['The test set must stay untouched until the final check.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Use cross-validation on the training data to compare settings.', 'Evaluate only the final chosen model on the test set.'],
        explanation: 'Tuning on the test set makes its score optimistic.',
        mistakes: ['Trying many settings and reporting the best test score.'],
        challenge: 'Explain nested cross-validation in one sentence.'
      },
      {
        id: 'ai13-e2', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Fold size',
        objective: 'Compute k-fold sizes.',
        problem: 'With 5-fold cross-validation on 200 rows, how many rows are in each validation fold?',
        hints: ['200 / 5'],
        check: { type: 'numeric', answer: 40, tolerance: 0 },
        solution: ['200 / 5 = 40 rows per validation fold; each model trains on 160 rows.'],
        explanation: 'Every row is used for validation exactly once.',
        mistakes: ['Answering 160 (the training size per fold).'],
        challenge: 'How many models are trained in 5-fold CV over 6 hyperparameter settings? (30, plus one final refit.)'
      },
      {
        id: 'ai13-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Generate k folds',
        objective: 'Implement k-fold splitting.',
        problem: 'Split indices 0–5 into k = 3 folds and print each fold\'s validation and training indices. Expected:\n[0, 1] [2, 3, 4, 5]\n[2, 3] [0, 1, 4, 5]\n[4, 5] [0, 1, 2, 3]',
        starterCode: 'n, k = 6, 3\nindices = list(range(n))\nsize = n // k\n\n# print validation and training indices for each fold\n',
        hints: ['val = indices[i * size:(i + 1) * size]', 'train = [j for j in indices if j not in val]'],
        check: { type: 'output', expectedOutput: '[0, 1] [2, 3, 4, 5]\n[2, 3] [0, 1, 4, 5]\n[4, 5] [0, 1, 2, 3]' },
        solutionCode: 'n, k = 6, 3\nindices = list(range(n))\nsize = n // k\n\nfor i in range(k):\n    val = indices[i * size:(i + 1) * size]\n    train = [j for j in indices if j not in val]\n    print(val, train)',
        solution: ['Each fold takes the next block of size n / k = 2.', 'Training indices are the complement of the fold.'],
        explanation: 'scikit-learn\'s KFold does the same (and can shuffle first).',
        mistakes: ['Overlapping folds, which validates some rows twice.'],
        challenge: 'Handle n not divisible by k (e.g. n = 7) like np.array_split does.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai13-k1', question: 'High training accuracy but low validation accuracy indicates…', options: ['High bias (underfitting)', 'High variance (overfitting)', 'Perfect model', 'Too much regularisation'], answer: 1, explanation: 'Reduce complexity, add regularisation or more data.' },
      { id: 'ai13-k2', question: 'Which search tries a fixed number of random combinations?', options: ['GridSearchCV', 'RandomizedSearchCV', 'KFold', 'train_test_split'], answer: 1, explanation: 'Often finds good settings faster than exhaustive grids.' },
      { id: 'ai13-k3', question: 'For time-series data, which split is appropriate?', options: ['Random shuffle', 'Forward-chaining (train on past, validate on future)', 'Leave-one-out at random', 'Stratified shuffle'], answer: 1, explanation: 'Never train on the future to predict the past.' }
    ],
    cheatSheet: ['cross_val_score(model, X, y, cv=5)', 'GridSearchCV(pipe, param_grid, cv=5).fit(X_train, y_train)', 'KFold / StratifiedKFold / GroupKFold / TimeSeriesSplit', 'Test set: once, at the end'],
    references: [
      { title: 'scikit-learn — Cross-validation: evaluating estimator performance', url: 'https://scikit-learn.org/stable/modules/cross_validation.html', publisher: SK },
      { title: 'scikit-learn — Tuning the hyper-parameters of an estimator', url: 'https://scikit-learn.org/stable/modules/grid_search.html', publisher: SK },
      { title: 'scikit-learn — Validation curves: plotting scores to evaluate models', url: 'https://scikit-learn.org/stable/modules/learning_curve.html', publisher: SK }
    ],
    next: 'Module 14 moves from classical models to neural networks, transformers and large language models.'
  },

  'ai-ds-mod-14': {
    skills: ['Compute a neuron\'s forward pass and a softmax', 'Explain embeddings and similarity search', 'Describe how transformers and LLMs generate text, and their limits'],
    prerequisites: ['NumPy (Module 03)', 'Classification (Module 11)'],
    intuition: {
      analogy: 'A neural network is a team of very simple workers in layers: each one weighs its inputs, adds them up and passes on a signal if it is strong enough. Stack enough layers and the team can recognise faces or translate sentences. An LLM is such a network trained to guess the next word, so well that it can continue almost any text.',
      whyItMatters: 'Generative AI is now part of everyday tools. Understanding the mechanics — weights, probabilities, embeddings — lets you use these systems effectively and recognise their failure modes such as confident fabrication.'
    },
    workflow: {
      title: 'How an LLM produces the next token',
      nodes: [
        { id: 'text', label: 'Prompt text', detail: '"Explain SQL joins in one line"', input: 'User', output: 'Characters' },
        { id: 'tok', label: 'Tokenizer', detail: 'Text → sub-word token ids.', input: 'Characters', output: 'Token ids' },
        { id: 'emb', label: 'Embeddings', detail: 'Each id → vector; position information added.', input: 'Token ids', output: 'Vectors' },
        { id: 'attn', label: 'Transformer layers', detail: 'Self-attention mixes information across tokens; feed-forward layers transform it.', input: 'Vectors', output: 'Contextual vectors' },
        { id: 'logits', label: 'Logits → softmax', detail: 'Scores for every vocabulary token → probabilities.', input: 'Last vector', output: 'Next-token distribution' },
        { id: 'sample', label: 'Sample / pick token', detail: 'Temperature controls randomness; append and repeat.', input: 'Probabilities', output: 'Generated text' }
      ],
      edges: [{ from: 'text', to: 'tok' }, { from: 'tok', to: 'emb' }, { from: 'emb', to: 'attn' }, { from: 'attn', to: 'logits' }, { from: 'logits', to: 'sample' }, { from: 'sample', to: 'tok', label: 'append token' }],
      explanation: 'Generation is a loop: each new token is fed back in. The model predicts plausible continuations; it does not look facts up unless connected to retrieval tools.'
    },
    workedExample: {
      title: 'Neuron, softmax and cosine similarity',
      language: 'python',
      code: 'import numpy as np\n\nx = np.array([0.5, -1.0, 2.0])\nw = np.array([0.4, 0.3, -0.2])\nb = 0.1\nz = x @ w + b\nprint(round(float(z), 2), max(0.0, float(z)), round(float(1 / (1 + np.exp(-z))), 3))\n\nlogits = np.array([2.0, 1.0, 0.1])\nprobs = np.exp(logits) / np.exp(logits).sum()\nprint(np.round(probs, 3).tolist())\n\ndef cosine(a, b):\n    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))\na, b2, c = np.array([1, 2, 3]), np.array([2, 4, 6]), np.array([3, -1, 0])\nprint(round(cosine(a, b2), 3), round(cosine(a, c), 3))',
      lineByLine: [
        { line: 6, explanation: 'Weighted sum: 0.2 − 0.3 − 0.4 + 0.1 = −0.4.' },
        { line: 7, explanation: 'ReLU(−0.4) = 0; sigmoid(−0.4) ≈ 0.401.' },
        { line: 10, explanation: 'Softmax turns scores into probabilities that sum to 1.' },
        { line: 15, explanation: 'Parallel vectors have cosine similarity 1; unrelated directions are near 0.' }
      ],
      expectedOutput: '-0.4 0.0 0.401\n[0.659, 0.242, 0.099]\n1.0 0.085',
      edgeCases: ['np.exp of large logits overflows; subtract the maximum logit first (numerically stable softmax).', 'LLM outputs can contain fabricated facts or citations; verify important claims against sources.']
    },
    caseStudy: {
      title: 'A course-content Q&A assistant with retrieval',
      problem: 'Learners ask questions about module content late at night; a general chatbot sometimes invents answers.',
      data: 'All module texts split into paragraphs.',
      steps: ['Embed each paragraph and store the vectors (e.g. pgvector).', 'Embed the learner\'s question and retrieve the 5 most similar paragraphs by cosine similarity.', 'Ask the LLM to answer only from those paragraphs and cite the module.', 'Log questions with no good match for instructors to review.'],
      result: 'Answers are grounded in course material and show where to read more, reducing invented answers.',
      limitations: 'Retrieval quality limits answer quality; the assistant must say "I don\'t know" when nothing relevant is retrieved.'
    },
    exercises: [
      {
        id: 'ai14-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'What does attention do?',
        objective: 'Explain self-attention conceptually.',
        problem: 'In a transformer, what does self-attention allow each token representation to do?',
        options: ['Ignore all other tokens', 'Combine information from other tokens weighted by relevance', 'Store the whole internet', 'Run SQL queries'],
        hints: ['In "The bank of the river", "bank" should look at "river".'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Self-attention computes relevance weights between tokens and mixes their information accordingly.'],
        explanation: 'This is what lets transformers model long-range context in parallel.',
        mistakes: ['Thinking attention retrieves facts from a database.'],
        challenge: 'Why do transformers need positional information?'
      },
      {
        id: 'ai14-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Count parameters',
        objective: 'Compute the size of a dense layer.',
        problem: 'A fully connected layer maps 10 inputs to 5 outputs with a bias per output. How many trainable parameters does it have?',
        hints: ['Weights: inputs × outputs; biases: outputs.'],
        check: { type: 'numeric', answer: 55, tolerance: 0 },
        solution: ['Weights: 10 × 5 = 50.', 'Biases: 5.', 'Total: 55.'],
        explanation: 'Large models have billions of such parameters across many layers.',
        mistakes: ['Forgetting the biases (50).'],
        challenge: 'Add a second layer 5 → 3. What is the new total? (55 + 18 = 73)'
      },
      {
        id: 'ai14-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Temperature and softmax',
        objective: 'See how temperature changes a next-token distribution.',
        problem: 'Compute a numerically stable softmax of the logits at temperature 1.0 and 0.5 and print the probability of the top token (3 decimals). Expected:\n1.0 0.631\n0.5 0.862',
        starterCode: 'import numpy as np\nlogits = np.array([3.0, 2.0, 1.0, 0.5])\n\ndef softmax(z):\n    # subtract the max for stability\n    pass\n\nfor T in (1.0, 0.5):\n    # divide logits by T, apply softmax, print T and the largest probability\n    pass\n',
        hints: ['e = np.exp(z - z.max()); return e / e.sum()', 'p = softmax(logits / T); print(T, round(float(p.max()), 3))'],
        check: { type: 'output', expectedOutput: '1.0 0.631\n0.5 0.862' },
        solutionCode: 'import numpy as np\nlogits = np.array([3.0, 2.0, 1.0, 0.5])\n\ndef softmax(z):\n    e = np.exp(z - z.max())\n    return e / e.sum()\n\nfor T in (1.0, 0.5):\n    p = softmax(logits / T)\n    print(T, round(float(p.max()), 3))',
        solution: ['Dividing by a temperature below 1 spreads the logits apart.', 'The top token\'s probability rises from about 0.631 to about 0.862 — output becomes more deterministic.'],
        explanation: 'Higher temperatures (> 1) flatten the distribution and make generation more varied.',
        mistakes: ['Multiplying by T instead of dividing.'],
        challenge: 'Print the full distribution for T = 2.0.'
      }
    ],
    knowledgeCheck: [
      { id: 'ai14-k1', question: 'What is an embedding?', options: ['A compressed file', 'A vector representation where similar items are close together', 'A type of SQL index', 'A prompt template'], answer: 1, explanation: 'Similarity between embeddings powers semantic search and RAG.' },
      { id: 'ai14-k2', question: 'Why can LLMs "hallucinate"?', options: ['They are connected to wrong websites', 'They generate statistically plausible text without verifying facts', 'Their GPUs overheat', 'They only know SQL'], answer: 1, explanation: 'Grounding with retrieval and asking for sources reduces, but does not eliminate, the risk.' },
      { id: 'ai14-k3', question: 'Backpropagation is used to…', options: ['Tokenise text', 'Compute gradients for updating weights', 'Store embeddings', 'Choose the temperature'], answer: 1, explanation: 'Gradients tell the optimiser how to adjust each weight to reduce the loss.' }
    ],
    cheatSheet: ['z = w·x + b; ReLU(z) = max(0, z); σ(z) = 1/(1+e^(−z))', 'softmax(z)ᵢ = e^(zᵢ−max) / Σ e^(zⱼ−max)', 'cosine(a, b) = a·b / (‖a‖‖b‖)', 'LLM: tokenize → embed → transformer → softmax → sample'],
    references: [
      { title: 'Google ML Crash Course — Neural networks', url: 'https://developers.google.com/machine-learning/crash-course/neural-networks', publisher: GOOGLE_ML },
      { title: 'Google ML Crash Course — Large language models', url: 'https://developers.google.com/machine-learning/crash-course/llm', publisher: GOOGLE_ML },
      { title: 'MIT 6.S191 Introduction to Deep Learning', url: 'https://introtodeeplearning.com/', publisher: 'Massachusetts Institute of Technology' },
      { title: 'Attention Is All You Need (Vaswani et al., 2017)', url: 'https://arxiv.org/abs/1706.03762', publisher: 'arXiv' }
    ],
    next: 'Module 15 takes a model from notebook to production and into your portfolio.'
  },

  'ai-ds-mod-15': {
    skills: ['Package a model behind a prediction API contract', 'Monitor data drift after deployment', 'Present a capstone project with clear evidence'],
    prerequisites: ['Modules 01–14'],
    intuition: {
      analogy: 'A model in a notebook is a prototype car in a garage. Deployment is getting it road-legal: a standard interface (steering wheel = API), safety checks (input validation), and a dashboard (monitoring) that warns you when the road conditions change.',
      whyItMatters: 'Models only create value when someone uses their predictions, and they degrade silently as the world changes. Employers look for evidence that you can ship and maintain models, not only train them.'
    },
    workflow: {
      title: 'From notebook to monitored service',
      nodes: [
        { id: 'train', label: 'Train & validate', detail: 'Pipeline with preprocessing + model, evaluated on a test set.', input: 'Data', output: 'Model artefact' },
        { id: 'pack', label: 'Package', detail: 'Save model + version + feature list (joblib/ONNX).', input: 'Artefact', output: 'Versioned bundle' },
        { id: 'api', label: 'Serve API', detail: 'POST /predict validates input and returns prediction + probability.', input: 'Bundle', output: 'Endpoint' },
        { id: 'log', label: 'Log predictions', detail: 'Inputs, outputs, model version, latency.', input: 'Requests', output: 'Prediction log' },
        { id: 'monitor', label: 'Monitor drift & quality', detail: 'Compare live feature distributions and outcomes with training.', input: 'Logs', output: 'Alerts' },
        { id: 'retrain', label: 'Retrain', detail: 'Triggered by drift or schedule; repeat validation.', input: 'New labelled data', output: 'New version' }
      ],
      edges: [{ from: 'train', to: 'pack' }, { from: 'pack', to: 'api' }, { from: 'api', to: 'log' }, { from: 'log', to: 'monitor' }, { from: 'monitor', to: 'retrain', label: 'drift' }, { from: 'retrain', to: 'pack' }],
      explanation: 'Each prediction should be traceable to a model version so that problems can be reproduced and rolled back.'
    },
    workedExample: {
      title: 'A tiny model bundle and a drift check',
      language: 'python',
      code: 'import json\nimport statistics as st\n\nbundle = {"version": "1.2.0", "features": ["hours", "quizzes"], "weights": [0.35, 0.2], "bias": -3.0}\nsaved = json.dumps(bundle)\n\ndef predict(payload, model=json.loads(saved)):\n    missing = [f for f in model["features"] if f not in payload]\n    if missing:\n        return {"error": f"missing features: {missing}"}\n    z = sum(w * payload[f] for w, f in zip(model["weights"], model["features"])) + model["bias"]\n    return {"version": model["version"], "will_complete": z >= 0, "score": round(z, 2)}\n\nprint(predict({"hours": 6, "quizzes": 7}))\nprint(predict({"hours": 6}))\n\ntrain_hours = [5, 6, 7, 6, 5, 8, 7, 6]\nlive_hours = [2, 3, 2, 4, 3, 2, 3, 3]\nshift = (st.mean(live_hours) - st.mean(train_hours)) / st.stdev(train_hours)\nprint(f"Drift (z-units): {shift:.2f}", "ALERT" if abs(shift) > 2 else "ok")',
      lineByLine: [
        { line: 4, explanation: 'The bundle stores the version and the exact feature order with the parameters.' },
        { line: 8, explanation: 'Validate inputs before predicting; return a clear error instead of crashing.' },
        { line: 11, explanation: '0.35×6 + 0.2×7 − 3 = 0.5 → predicted to complete.' },
        { line: 17, explanation: 'Live learners study far less than the training population.' },
        { line: 18, explanation: 'Mean shift of about −3.38 standard deviations → alert to investigate and possibly retrain.' }
      ],
      expectedOutput: "{'version': '1.2.0', 'will_complete': True, 'score': 0.5}\n{'error': \"missing features: ['quizzes']\"}\nDrift (z-units): -3.38 ALERT",
      edgeCases: ['Never unpickle model files from untrusted sources — pickle can execute code.', 'A drift alert is a signal to investigate, not proof the model is wrong; check whether outcomes changed too.']
    },
    caseStudy: {
      title: 'Capstone: deploying a course-completion predictor',
      problem: 'Build an end-to-end project suitable for a portfolio.',
      data: 'A public or synthetic learner-activity dataset (clearly labelled as such).',
      steps: ['Frame the decision and success metric (recall@capacity).', 'EDA notebook with written findings.', 'scikit-learn Pipeline, cross-validated, compared with a baseline.', 'FastAPI or Flask /predict endpoint with input validation, Dockerfile, and a simple drift report.', 'README with problem, data, approach, results (with uncertainty), limitations and how to run it.'],
      result: 'A repository a reviewer can run in minutes, showing data, modelling and engineering skills together.',
      limitations: 'Synthetic data cannot show real-world impact; say so explicitly rather than implying production results.'
    },
    exercises: [
      {
        id: 'ai15-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'What to monitor first',
        objective: 'Choose meaningful production monitoring.',
        problem: 'Labels for a churn model arrive only 60 days after prediction. What can you monitor immediately?',
        options: ['Accuracy on today\'s predictions', 'Input feature distributions and prediction distributions (drift)', 'Nothing until labels arrive', 'Training loss'],
        hints: ['You have today\'s inputs and outputs, but not today\'s outcomes.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Compare live input and output distributions with the training data as an early warning.', 'Measure accuracy once the delayed labels arrive.'],
        explanation: 'Drift monitoring is a proxy for performance when ground truth is delayed.',
        mistakes: ['Waiting 60 days to notice a broken data pipeline.'],
        challenge: 'Name two features whose drift would worry you most for this model.'
      },
      {
        id: 'ai15-e2', type: 'Short answer', difficulty: 'Beginner',
        title: 'Prediction endpoint method',
        objective: 'Design an ML API.',
        problem: 'Which HTTP method should a /predict endpoint use when the client sends a JSON body of features?',
        hints: ['GET requests should not carry a body.'],
        check: { type: 'text', accept: ['POST'] },
        solution: ['POST with a JSON body, returning JSON with the prediction, probability and model version.'],
        explanation: 'Return 400/422 for invalid input rather than a prediction from garbage data.',
        mistakes: ['Encoding dozens of features in a GET query string.'],
        challenge: 'Write the JSON response schema for this endpoint.'
      },
      {
        id: 'ai15-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Validate and predict',
        objective: 'Implement input validation in a prediction function.',
        problem: 'Complete predict so it rejects missing or negative inputs and otherwise returns the rounded score. Expected:\n1.05\nerror: missing hours\nerror: negative quizzes',
        starterCode: 'MODEL = {"features": ["hours", "quizzes"], "weights": [0.4, 0.15], "bias": -2.0}\n\ndef predict(payload):\n    # return "error: missing <f>" / "error: negative <f>" or the score rounded to 2 decimals\n    pass\n\nprint(predict({"hours": 5, "quizzes": 7}))\nprint(predict({"quizzes": 3}))\nprint(predict({"hours": 4, "quizzes": -1}))\n',
        hints: ['Loop over MODEL["features"] and check membership and sign first.', 'score = sum(w * payload[f] …) + bias'],
        check: { type: 'output', expectedOutput: '1.05\nerror: missing hours\nerror: negative quizzes' },
        solutionCode: 'MODEL = {"features": ["hours", "quizzes"], "weights": [0.4, 0.15], "bias": -2.0}\n\ndef predict(payload):\n    for f in MODEL["features"]:\n        if f not in payload:\n            return f"error: missing {f}"\n        if payload[f] < 0:\n            return f"error: negative {f}"\n    score = sum(w * payload[f] for w, f in zip(MODEL["weights"], MODEL["features"])) + MODEL["bias"]\n    return round(score, 2)\n\nprint(predict({"hours": 5, "quizzes": 7}))\nprint(predict({"quizzes": 3}))\nprint(predict({"hours": 4, "quizzes": -1}))',
        solution: ['Validate every feature before computing anything.', 'Score for the valid payload: 0.4 × 5 + 0.15 × 7 − 2 = 2 + 1.05 − 2 = 1.05.', 'The second payload has no hours; the third has a negative quiz count.'],
        explanation: 'round(…, 2) hides floating-point noise such as 1.0500000000000003.',
        mistakes: ['Validating after computing the score, which raises KeyError first.'],
        challenge: 'Also reject values above a plausible maximum (e.g. hours > 100).'
      }
    ],
    knowledgeCheck: [
      { id: 'ai15-k1', question: 'Why store the model version with every prediction?', options: ['To slow the API', 'To trace and reproduce results and roll back safely', 'It is required by HTTP', 'To encrypt data'], answer: 1, explanation: 'Traceability is essential for debugging and audits.' },
      { id: 'ai15-k2', question: 'Which file format can execute arbitrary code when loaded?', options: ['JSON', 'CSV', 'pickle', 'ONNX'], answer: 2, explanation: 'Only load pickles you created or trust.' },
      { id: 'ai15-k3', question: 'What makes a portfolio project credible?', options: ['A long list of libraries', 'A runnable repo with clear problem, baseline, results with limitations', 'Only screenshots', 'Claims of 99% accuracy'], answer: 1, explanation: 'Reviewers value honesty and reproducibility.' }
    ],
    cheatSheet: ['joblib.dump(pipeline, "model-v1.joblib")', 'POST /predict → {prediction, probability, model_version}', 'Monitor: input drift, prediction drift, latency, delayed accuracy', 'README: problem → data → approach → results → limitations'],
    references: [
      { title: 'scikit-learn — Model persistence', url: 'https://scikit-learn.org/stable/model_persistence.html', publisher: SK },
      { title: 'Google ML Crash Course — Production ML systems', url: 'https://developers.google.com/machine-learning/crash-course/production-ml-systems', publisher: GOOGLE_ML },
      { title: 'Rules of Machine Learning', url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', publisher: GOOGLE_ML },
      { title: 'FastAPI — Tutorial: Request Body', url: 'https://fastapi.tiangolo.com/tutorial/body/', publisher: 'FastAPI (Sebastián Ramírez)' }
    ],
    next: 'You have completed the AI with Data Science track. Publish your capstone, write up what you learned, and keep practising with new public datasets.'
  }
};
