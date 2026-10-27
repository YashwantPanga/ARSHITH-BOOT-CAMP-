// Data Science & AI - detailed step-by-step sections for modules 11-15 (see ai-sections.part1.js).
const py = (s) => ({ language: 'python', ...s });

const SPLIT = 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\nX, y = load_breast_cancer(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0, stratify=y)\n';

export default {
  'ai-ds-mod-11': [
    {
      heading: 'What is classification?',
      text: 'Classification predicts a category: spam or not, which disease, will the customer leave. Binary classification has two classes; multi-class has more. The examples use a medical dataset: 569 tumours described by 30 measurements, labelled malignant (0) or benign (1).',
      table: {
        headers: ['Problem', 'Classes'],
        rows: [['Email filter', 'spam / not spam'], ['Loan approval', 'repay / default'], ['Customer churn', 'stays / leaves'], ['Handwritten digits', '0 - 9']]
      }
    },
    py({
      heading: 'Logistic regression',
      text: 'Despite its name, logistic regression is a classifier. It calculates the probability of the positive class with an S-shaped curve, and predicts that class when the probability is above 0.5. It is fast, simple and easy to explain - always a good first model.',
      code: SPLIT + 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nmodel = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train)\nprint("accuracy:", round(model.score(X_test, y_test), 3))\nprint("probabilities for 3 patients:", model.predict_proba(X_test[:3]).round(3))'
    }),
    py({
      heading: 'The confusion matrix',
      text: 'Accuracy alone hides which mistakes are made. The confusion matrix counts each combination of true and predicted class: true negatives, false positives, false negatives and true positives.',
      code: SPLIT + 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import confusion_matrix\npred = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train).predict(X_test)\ncm = confusion_matrix(y_test, pred)\nprint(cm)\nprint(f"missed malignant tumours (predicted benign): {cm[0, 1]}")',
      note: 'Rows are the true class, columns the predicted class. In medicine, missing a malignant tumour is far worse than a false alarm.'
    }),
    py({
      heading: 'Precision, recall and F1',
      text: 'Precision: of everything predicted positive, how much really was? Recall: of all real positives, how many did we find? F1 balances the two. Which matters more depends on the cost of each mistake.',
      code: SPLIT + 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import classification_report\npred = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train).predict(X_test)\nprint(classification_report(y_test, pred, target_names=["malignant", "benign"]))'
    }),
    py({
      heading: 'Decision trees',
      text: 'A decision tree asks a series of yes/no questions about the features ("is worst radius above 16.8?") until it reaches an answer. Trees are easy to read and need no scaling, but deep trees overfit.',
      code: SPLIT + 'from sklearn.tree import DecisionTreeClassifier, export_text\nfrom sklearn.datasets import load_breast_cancer\nnames = list(load_breast_cancer().feature_names)\ntree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X_train, y_train)\nprint("accuracy:", round(tree.score(X_test, y_test), 3))\nprint(export_text(tree, feature_names=names))'
    }),
    py({
      heading: 'K-nearest neighbours',
      text: 'KNN classifies a new point by looking at the k most similar training examples and taking the majority class. It needs scaled features, because distance is used.',
      code: SPLIT + 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neighbors import KNeighborsClassifier\nfor k in [1, 5, 15]:\n    m = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k)).fit(X_train, y_train)\n    print(f"k={k:>2}: accuracy {m.score(X_test, y_test):.3f}")'
    }),
    py({
      heading: 'Random forests',
      text: 'A random forest trains many decision trees on random parts of the data and lets them vote. It is one of the strongest general-purpose models and also tells which features mattered most.',
      code: SPLIT + 'from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.datasets import load_breast_cancer\nimport pandas as pd\nforest = RandomForestClassifier(n_estimators=200, random_state=0).fit(X_train, y_train)\nprint("accuracy:", round(forest.score(X_test, y_test), 3))\nimportance = pd.Series(forest.feature_importances_, index=load_breast_cancer().feature_names)\nprint(importance.sort_values(ascending=False).head(5).round(3))'
    }),
    py({
      heading: 'Changing the decision threshold',
      text: 'Classifiers predict "positive" when the probability is above 0.5 by default. Moving the threshold trades precision for recall - for example, flag more patients for a second check so fewer malignant cases are missed.',
      code: SPLIT + 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import recall_score\nmodel = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train)\np_malignant = model.predict_proba(X_test)[:, 0]\nfor t in [0.5, 0.3, 0.1]:\n    pred_malignant = p_malignant >= t\n    print(f"threshold {t}: malignant found {recall_score(y_test == 0, pred_malignant):.2f}, patients flagged {pred_malignant.sum()}")'
    })
  ],

  'ai-ds-mod-12': [
    {
      heading: 'Unsupervised learning',
      text: 'Sometimes there is no answer column - only data. Unsupervised learning finds structure on its own: clustering groups similar rows (customer segments), and dimensionality reduction compresses many columns into a few while keeping most of the information.',
      table: {
        headers: ['Technique', 'Question it answers', 'Example'],
        rows: [
          ['K-means clustering', 'Which groups exist?', 'customer segments'],
          ['DBSCAN', 'Which dense groups, and which points are outliers?', 'fraud detection, map hot spots'],
          ['PCA', 'Can 30 columns be summarised in 2-3?', 'visualising high-dimensional data']
        ]
      }
    },
    py({
      heading: 'K-means clustering',
      text: 'K-means places k centres, assigns every point to the nearest centre, moves each centre to the middle of its points, and repeats until nothing changes. You choose k.',
      code: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.datasets import make_blobs\nfrom sklearn.cluster import KMeans\nX, _ = make_blobs(n_samples=300, centers=3, cluster_std=1.0, random_state=42)\nkm = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)\nplt.figure(figsize=(5, 3.4))\nplt.scatter(X[:, 0], X[:, 1], c=km.labels_, s=15, cmap="viridis")\nplt.scatter(*km.cluster_centers_.T, c="red", marker="X", s=150)\nplt.title("K-means found 3 groups")\nplt.show()\nprint("points per cluster:", np.bincount(km.labels_))'
    }),
    py({
      heading: 'Choosing k: the elbow method',
      text: 'Inertia measures how tight the clusters are (lower is tighter). It always drops as k grows, but after the right k it drops only a little - the "elbow" of the curve.',
      code: 'from sklearn.datasets import make_blobs\nfrom sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\nX, _ = make_blobs(n_samples=300, centers=4, random_state=7)\nfor k in range(2, 7):\n    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)\n    print(f"k={k}: inertia {km.inertia_:8.1f}   silhouette {silhouette_score(X, km.labels_):.3f}")',
      note: 'The silhouette score (higher is better, up to 1) is another guide; here both point to k = 4.'
    }),
    py({
      heading: 'Scale before clustering',
      text: 'Clustering uses distances, so a column measured in lakhs (income) would dominate one measured in years (age). Standardise first.',
      code: 'import numpy as np\nimport pandas as pd\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nrng = np.random.default_rng(16)\ncustomers = pd.DataFrame({\n    "age": np.concatenate([rng.normal(25, 3, 50), rng.normal(50, 4, 50)]),\n    "yearly_spend": np.concatenate([rng.normal(40000, 8000, 50), rng.normal(42000, 8000, 50)])\n})\nfor name, data in [("raw", customers), ("scaled", StandardScaler().fit_transform(customers))]:\n    labels = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(data)\n    print(name, "-> average age per cluster:", customers.groupby(labels)["age"].mean().round(1).tolist())',
      note: 'Without scaling, the clusters split by spending noise; with scaling they find the real young / older groups.'
    }),
    py({
      heading: 'Describing the clusters',
      text: 'A cluster number means nothing to a business. Summarise each cluster with group means to give it a name such as "young big spenders".',
      code: 'import numpy as np\nimport pandas as pd\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nrng = np.random.default_rng(17)\ndf = pd.DataFrame({"visits_per_month": np.concatenate([rng.normal(2, 1, 60), rng.normal(12, 2, 40), rng.normal(6, 1.5, 50)]).clip(0),\n                   "avg_order": np.concatenate([rng.normal(300, 60, 60), rng.normal(250, 50, 40), rng.normal(1500, 300, 50)])})\ndf["segment"] = KMeans(n_clusters=3, n_init=10, random_state=0).fit_predict(StandardScaler().fit_transform(df))\nprint(df.groupby("segment").agg(customers=("avg_order", "size"), visits=("visits_per_month", "mean"), avg_order=("avg_order", "mean")).round(1))'
    }),
    py({
      heading: 'PCA: fewer dimensions',
      text: 'Principal Component Analysis finds new axes (components) that capture as much of the variation as possible. Keeping the first 2 lets you draw 30-column data on a flat chart.',
      code: 'import matplotlib.pyplot as plt\nfrom sklearn.datasets import load_breast_cancer\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.decomposition import PCA\ndata = load_breast_cancer()\nX2 = PCA(n_components=2).fit_transform(StandardScaler().fit_transform(data.data))\nplt.figure(figsize=(5, 3.4))\nfor label, colour in [(0, "crimson"), (1, "seagreen")]:\n    pts = X2[data.target == label]\n    plt.scatter(pts[:, 0], pts[:, 1], s=10, c=colour, label=data.target_names[label], alpha=0.7)\nplt.legend()\nplt.title("30 features shown in 2 dimensions")\nplt.show()'
    }),
    py({
      heading: 'How much information is kept?',
      text: 'explained_variance_ratio_ tells how much of the variation each component keeps. Choose enough components to keep, say, 95%.',
      code: 'import numpy as np\nfrom sklearn.datasets import load_breast_cancer\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.decomposition import PCA\nX = StandardScaler().fit_transform(load_breast_cancer().data)\npca = PCA().fit(X)\ncum = np.cumsum(pca.explained_variance_ratio_)\nprint("first 3 components keep:", pca.explained_variance_ratio_[:3].round(3))\nprint("components needed for 95%:", int(np.argmax(cum >= 0.95) + 1), "of", X.shape[1])'
    }),
    py({
      heading: 'DBSCAN: groups of any shape, plus outliers',
      text: 'DBSCAN groups points that lie in dense areas and marks isolated points as noise (label -1). It finds odd-shaped clusters and does not need k.',
      code: 'import numpy as np\nfrom sklearn.datasets import make_moons\nfrom sklearn.cluster import DBSCAN, KMeans\nX, _ = make_moons(n_samples=300, noise=0.06, random_state=0)\nX = np.vstack([X, [[2.5, 1.5], [-1.5, -0.8]]])     # two outliers\ndb = DBSCAN(eps=0.2, min_samples=5).fit(X)\nprint("DBSCAN clusters:", sorted(set(db.labels_) - {-1}), "| outliers:", int((db.labels_ == -1).sum()))\nprint("K-means would just cut the moons in half:", np.bincount(KMeans(2, n_init=10, random_state=0).fit_predict(X)))'
    })
  ],

  'ai-ds-mod-13': [
    py({
      heading: 'Why one test split is not enough',
      text: 'A single train/test split can be lucky or unlucky. The score changes noticeably depending on which rows land in the test set.',
      code: 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.tree import DecisionTreeClassifier\nX, y = load_breast_cancer(return_X_y=True)\nfor seed in range(5):\n    X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=seed)\n    print(f"split {seed}: accuracy {DecisionTreeClassifier(random_state=0).fit(X_train, y_train).score(X_test, y_test):.3f}")'
    }),
    py({
      heading: 'K-fold cross-validation',
      text: 'Cross-validation splits the data into k folds, trains k times - each time testing on a different fold - and averages the scores. The mean is more reliable, and the spread shows how stable the model is.',
      code: 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import cross_val_score\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nX, y = load_breast_cancer(return_X_y=True)\nscores = cross_val_score(make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)), X, y, cv=5)\nprint("fold scores:", scores.round(3))\nprint(f"mean {scores.mean():.3f} +/- {scores.std():.3f}")'
    }),
    py({
      heading: 'Comparing models fairly',
      text: 'Use the same cross-validation for every candidate model, then pick the best mean score - and prefer the simpler model when scores are close.',
      code: 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import cross_val_score, StratifiedKFold\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.neighbors import KNeighborsClassifier\nfrom sklearn.ensemble import RandomForestClassifier\nX, y = load_breast_cancer(return_X_y=True)\ncv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)\nmodels = {\n    "logistic": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),\n    "knn": make_pipeline(StandardScaler(), KNeighborsClassifier()),\n    "forest": RandomForestClassifier(n_estimators=100, random_state=0),\n}\nfor name, m in models.items():\n    print(f"{name:>8}: {cross_val_score(m, X, y, cv=cv).mean():.3f}")'
    }),
    py({
      heading: 'Hyperparameter tuning with GridSearchCV',
      text: 'Hyperparameters are settings you choose (k in KNN, max_depth of a tree). GridSearchCV tries every combination with cross-validation and keeps the best.',
      code: 'from sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import GridSearchCV, train_test_split\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.neighbors import KNeighborsClassifier\nX, y = load_breast_cancer(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0, stratify=y)\npipe = Pipeline([("scale", StandardScaler()), ("knn", KNeighborsClassifier())])\ngrid = GridSearchCV(pipe, {"knn__n_neighbors": [3, 5, 9, 15], "knn__weights": ["uniform", "distance"]}, cv=5)\ngrid.fit(X_train, y_train)\nprint("best settings:", grid.best_params_)\nprint("best CV score:", round(grid.best_score_, 3))\nprint("test score:", round(grid.score(X_test, y_test), 3))',
      note: 'The test set is used once, at the very end, to report the final score.'
    }),
    py({
      heading: 'ROC curve and AUC',
      text: 'The ROC curve shows the true positive rate against the false positive rate for every threshold. AUC (area under the curve) summarises it: 1.0 is perfect, 0.5 is random guessing. It is useful because it does not depend on one threshold.',
      code: 'import matplotlib.pyplot as plt\nfrom sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.metrics import roc_curve, roc_auc_score\nX, y = load_breast_cancer(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0, stratify=y)\nprob = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train).predict_proba(X_test)[:, 1]\nfpr, tpr, _ = roc_curve(y_test, prob)\nplt.figure(figsize=(4, 3.4))\nplt.plot(fpr, tpr, label=f"AUC = {roc_auc_score(y_test, prob):.3f}")\nplt.plot([0, 1], [0, 1], "--", color="grey")\nplt.xlabel("False positive rate")\nplt.ylabel("True positive rate")\nplt.legend()\nplt.show()'
    }),
    py({
      heading: 'Data leakage',
      text: 'Leakage happens when information from the test data sneaks into training - for example scaling or selecting features on the whole dataset before splitting. Scores look great and then fail in real life. Putting all preprocessing inside a Pipeline prevents it.',
      code: 'import numpy as np\nfrom sklearn.feature_selection import SelectKBest, f_classif\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import cross_val_score\nfrom sklearn.pipeline import make_pipeline\nrng = np.random.default_rng(0)\nX = rng.normal(size=(100, 2000))      # pure noise\ny = rng.integers(0, 2, 100)           # random labels: true accuracy is 50%\nX_leaky = SelectKBest(f_classif, k=20).fit_transform(X, y)    # selected using ALL rows\nprint("leaky:  ", round(cross_val_score(LogisticRegression(), X_leaky, y, cv=5).mean(), 2))\nsafe = make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression())\nprint("correct:", round(cross_val_score(safe, X, y, cv=5).mean(), 2))',
      note: 'The data is pure noise, so the honest answer is about 50%. The leaky version claims about 78%; the correct pipeline reports close to chance (around 0.5-0.6 with only 100 rows).'
    }),
    py({
      heading: 'Imbalanced classes',
      text: 'When one class is rare (fraud: 1 in 100), a model that always says "not fraud" scores 99% accuracy and is useless. Look at recall and precision, use stratified splits, and give the rare class more weight.',
      code: 'from sklearn.datasets import make_classification\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import recall_score, accuracy_score\nX, y = make_classification(n_samples=3000, weights=[0.97], flip_y=0, class_sep=0.8, random_state=1)\nX_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=0)\nfor w in [None, "balanced"]:\n    pred = LogisticRegression(class_weight=w, max_iter=1000).fit(X_train, y_train).predict(X_test)\n    print(f"class_weight={str(w):>8}: accuracy {accuracy_score(y_test, pred):.3f}, rare cases found {recall_score(y_test, pred):.2f}")'
    }),
    py({
      heading: 'Learning curves: more data or a better model?',
      text: 'A learning curve shows training and validation scores as the training set grows. A big gap means overfitting (more data or a simpler model helps); two low scores mean underfitting (a stronger model or better features help).',
      code: 'import numpy as np\nfrom sklearn.datasets import load_breast_cancer\nfrom sklearn.model_selection import learning_curve\nfrom sklearn.tree import DecisionTreeClassifier\nX, y = load_breast_cancer(return_X_y=True)\nsizes, train, val = learning_curve(DecisionTreeClassifier(random_state=0), X, y, cv=5, train_sizes=[0.1, 0.3, 0.6, 1.0])\nfor n, t, v in zip(sizes, train.mean(axis=1), val.mean(axis=1)):\n    print(f"{n:>4} rows: train {t:.3f}  validation {v:.3f}")'
    })
  ],

  'ai-ds-mod-14': [
    {
      heading: 'From machine learning to deep learning',
      text: 'Deep learning uses neural networks: layers of simple units (neurons) that each compute a weighted sum of their inputs and pass it through an activation function. Stacking many layers lets the network learn complex patterns directly from raw data - pixels, sound, text - which is why it powers image recognition, speech and chatbots.',
      table: {
        headers: ['Network type', 'Good for'],
        rows: [
          ['Feed-forward (MLP)', 'tables of numbers'],
          ['Convolutional (CNN)', 'images and video'],
          ['Recurrent / LSTM', 'sequences (older approach)'],
          ['Transformer', 'text, code, and now images and audio (GPT, BERT)']
        ]
      }
    },
    py({
      heading: 'One neuron by hand',
      text: 'A neuron multiplies each input by a weight, adds a bias and applies an activation (here the sigmoid, which squeezes the result between 0 and 1). Training means adjusting the weights to reduce the error - this example learns the logical AND with gradient descent.',
      code: 'import numpy as np\nX = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])\ny = np.array([0, 0, 0, 1])            # AND\nrng = np.random.default_rng(0)\nw, b = rng.normal(size=2), 0.0\nsigmoid = lambda z: 1 / (1 + np.exp(-z))\nfor epoch in range(2000):\n    p = sigmoid(X @ w + b)\n    error = p - y\n    w -= 0.5 * X.T @ error / len(y)   # gradient descent step\n    b -= 0.5 * error.mean()\nprint("weights:", w.round(2), "bias:", round(b, 2))\nprint("predictions:", sigmoid(X @ w + b).round(2))'
    }),
    py({
      heading: 'A neural network with scikit-learn',
      text: 'MLPClassifier builds a small feed-forward network. Here it recognises handwritten digits (8×8 pixel images) with two hidden layers.',
      code: 'from sklearn.datasets import load_digits\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.neural_network import MLPClassifier\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.pipeline import make_pipeline\nX, y = load_digits(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0, stratify=y)\nnet = make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=0))\nnet.fit(X_train, y_train)\nprint("digit accuracy:", round(net.score(X_test, y_test), 3))\nprint("predicted:", net.predict(X_test[:10]))\nprint("actual:   ", y_test[:10])'
    }),
    py({
      heading: 'Deep learning frameworks',
      text: 'For real deep learning, people use PyTorch or TensorFlow/Keras, usually on a GPU (Google Colab gives one for free). The ideas are the same as above: layers, a loss, an optimiser and training epochs.',
      code: 'import tensorflow as tf\nmodel = tf.keras.Sequential([\n    tf.keras.layers.Input(shape=(28, 28)),\n    tf.keras.layers.Flatten(),\n    tf.keras.layers.Dense(128, activation="relu"),\n    tf.keras.layers.Dense(10, activation="softmax"),\n])\nmodel.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])\n(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()\nmodel.fit(x_train / 255, y_train, epochs=3, validation_split=0.1)\nprint(model.evaluate(x_test / 255, y_test))',
      run: false,
      output: 'Epoch 1/3 ... accuracy: 0.92\nEpoch 3/3 ... accuracy: 0.97\n[0.08, 0.975]   (loss, accuracy on the test images)',
      note: 'Run this in Google Colab - TensorFlow is too large for the in-browser Practice Lab.'
    }),
    py({
      heading: 'Text as numbers: bag of words',
      text: 'Models need numbers, so text is turned into vectors. The simplest way counts how often each word appears. TF-IDF also lowers the weight of words that appear everywhere ("the", "is").',
      code: 'from sklearn.feature_extraction.text import CountVectorizer\nreviews = ["great course, great teacher", "boring course", "great examples and clear teacher"]\nvec = CountVectorizer()\nX = vec.fit_transform(reviews)\nprint(vec.get_feature_names_out())\nprint(X.toarray())'
    }),
    py({
      heading: 'A small sentiment classifier',
      text: 'With text turned into numbers, any classifier can learn. This model learns positive and negative reviews from a handful of examples.',
      code: 'from sklearn.pipeline import make_pipeline\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.linear_model import LogisticRegression\ntexts = ["loved it, very clear", "excellent and helpful", "great examples", "really useful course",\n         "waste of time", "very confusing", "boring and too slow", "did not help at all"]\nlabels = [1, 1, 1, 1, 0, 0, 0, 0]\nmodel = make_pipeline(TfidfVectorizer(), LogisticRegression()).fit(texts, labels)\nfor review in ["clear and helpful examples", "slow and confusing"]:\n    print(review, "->", "positive" if model.predict([review])[0] else "negative")'
    }),
    {
      heading: 'Large language models and generative AI',
      text: 'A large language model (LLM) such as Claude or GPT is a huge transformer network trained on enormous amounts of text to predict the next word. That simple training goal produces models that can answer questions, summarise, translate and write code. Generative AI also creates images, audio and video.',
      bulletPoints: [
        'Tokens: models read text in small pieces (tokens), roughly 3/4 of a word each.',
        'Embeddings: text turned into vectors where similar meanings are close together - used for search and recommendations.',
        'RAG (retrieval-augmented generation): first search your own documents, then let the model answer using them.',
        'Limits: models can state wrong facts confidently ("hallucinate"), so check important answers.'
      ]
    },
    py({
      heading: 'Using an LLM from Python',
      text: 'LLMs are used through an API: send a message, get text back. Good prompts are specific: give the role, the task, the context and the format you want.',
      code: 'import anthropic\n\nclient = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY from the environment\nreply = client.messages.create(\n    model="claude-sonnet-5-5",\n    max_tokens=300,\n    messages=[{\n        "role": "user",\n        "content": "You are a data science tutor. In 3 bullet points, explain overfitting to a beginner."\n    }],\n)\nprint(reply.content[0].text)',
      run: false,
      output: '- Overfitting is when a model memorises the training data instead of learning the general pattern...\n- ...',
      note: 'Keep the API key in an environment variable, never in your code.'
    })
  ],

  'ai-ds-mod-15': [
    {
      heading: 'From notebook to product',
      text: 'A model is only useful when someone can use it. Deployment means saving the trained model, loading it in an application, and serving predictions - usually through a web API - while monitoring that it keeps working.',
      table: {
        headers: ['Step', 'Tool'],
        rows: [
          ['Train and evaluate', 'scikit-learn, notebooks'],
          ['Save the model', 'joblib / pickle'],
          ['Serve predictions', 'FastAPI or Flask'],
          ['Package', 'requirements.txt, Docker'],
          ['Host', 'Render, Railway, a VPS, cloud platforms'],
          ['Monitor', 'log inputs and predictions, check accuracy over time']
        ]
      }
    },
    py({
      heading: 'Saving and loading a model',
      text: 'joblib.dump writes the whole trained pipeline (preprocessing and model) to a file; joblib.load brings it back in another program, ready to predict.',
      code: 'import joblib\nfrom sklearn.datasets import load_iris\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\niris = load_iris()\nmodel = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(iris.data, iris.target)\njoblib.dump(model, "iris_model.joblib")\n\nloaded = joblib.load("iris_model.joblib")\nprint(iris.target_names[loaded.predict([[6.1, 2.8, 4.7, 1.2]])[0]])',
      note: 'Load model files only from sources you trust - a pickle/joblib file can run code when loaded.'
    }),
    py({
      heading: 'A prediction function',
      text: 'Wrap the model in a function that takes plain input, checks it, and returns a clear answer with a confidence. The web API will call this function.',
      code: 'import numpy as np\nfrom sklearn.datasets import load_iris\nfrom sklearn.linear_model import LogisticRegression\niris = load_iris()\nmodel = LogisticRegression(max_iter=1000).fit(iris.data, iris.target)\n\ndef predict_species(sepal_length, sepal_width, petal_length, petal_width):\n    values = [sepal_length, sepal_width, petal_length, petal_width]\n    if any(v <= 0 or v > 30 for v in values):\n        return {"error": "measurements must be between 0 and 30 cm"}\n    probs = model.predict_proba([values])[0]\n    best = int(np.argmax(probs))\n    return {"species": str(iris.target_names[best]), "confidence": round(float(probs[best]), 2)}\n\nprint(predict_species(5.1, 3.5, 1.4, 0.2))\nprint(predict_species(6.7, 3.0, 5.2, 2.3))\nprint(predict_species(-1, 3, 4, 1))'
    }),
    py({
      heading: 'Serving the model with FastAPI',
      text: 'FastAPI turns a Python function into a web API with automatic input checking and documentation. Any website or app can then send measurements and get a prediction back as JSON.',
      code: '# app.py  -  run with: uvicorn app:app --reload\nimport joblib\nfrom fastapi import FastAPI\nfrom pydantic import BaseModel, Field\n\napp = FastAPI(title="Iris classifier")\nmodel = joblib.load("iris_model.joblib")\nNAMES = ["setosa", "versicolor", "virginica"]\n\nclass Flower(BaseModel):\n    sepal_length: float = Field(gt=0, lt=30)\n    sepal_width: float = Field(gt=0, lt=30)\n    petal_length: float = Field(gt=0, lt=30)\n    petal_width: float = Field(gt=0, lt=30)\n\n@app.post("/predict")\ndef predict(f: Flower):\n    x = [[f.sepal_length, f.sepal_width, f.petal_length, f.petal_width]]\n    return {"species": NAMES[int(model.predict(x)[0])]}',
      run: false,
      output: 'POST /predict {"sepal_length": 6.1, "sepal_width": 2.8, "petal_length": 4.7, "petal_width": 1.2}\n-> {"species": "versicolor"}\n(open http://localhost:8000/docs for an automatic test page)'
    }),
    {
      heading: 'Packaging: requirements and Docker',
      text: 'Write down the exact library versions in requirements.txt so the server installs the same versions you trained with. Docker packages the code, libraries and model into one image that runs the same everywhere.',
      syntax: '# requirements.txt\nscikit-learn==1.5.2\njoblib==1.4.2\nfastapi==0.115.0\nuvicorn==0.30.6\n\n# Dockerfile\nFROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]'
    },
    {
      heading: 'Monitoring a deployed model',
      text: 'The world changes: customers, prices and behaviour drift, and a model trained last year slowly gets worse. Log every prediction, compare incoming data with the training data, and retrain when performance drops.',
      bulletPoints: [
        'Data drift: the inputs change (new cities, higher prices).',
        'Concept drift: the relationship changes (what made customers leave last year no longer does).',
        'Keep a "champion" model and test new "challenger" models before switching.'
      ]
    },
    {
      heading: 'Capstone project and portfolio',
      text: 'Your capstone should show the full workflow on a real question. Pick a dataset you find interesting (Kaggle, data.gov.in, a public API), and publish the notebook, a short report and - if you can - a small deployed demo.',
      table: {
        headers: ['Project idea', 'Skills shown'],
        rows: [
          ['Predict house prices in your city', 'cleaning, regression, feature engineering'],
          ['Customer churn for a telecom', 'classification, imbalance, business metrics'],
          ['Segment online-shop customers', 'clustering, PCA, storytelling'],
          ['Sentiment of product reviews', 'NLP, text classification'],
          ['Sales forecasting dashboard', 'time series, visualisation, deployment']
        ]
      },
      bulletPoints: [
        'GitHub: clean notebook, README with the question, data source, method, results and limitations.',
        'Explain results in business words: "the model finds 80% of customers who will leave, with 1 in 3 alerts correct".',
        'Add the Arshith Bootcamp certificate to LinkedIn and link the project.'
      ],
      note: 'Open "Projects" on the course page for the official capstone brief and submit your repository there.'
    }
  ]
};
