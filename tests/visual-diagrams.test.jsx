// @vitest-environment jsdom
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import VisualDiagram, { validateVisualDiagram } from '../src/components/diagrams/VisualDiagram';
import { VISUAL_DIAGRAMS } from '../src/data/visualDiagrams';
import { normalizeDiagram } from '../src/utils/normalizeModule';

afterEach(() => cleanup());

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
const modulesWithText = db.courses.flatMap(c => c.modules)
  .map(m => ({ id: m.id, diagram: normalizeDiagram(m.readingMaterial?.diagram) }))
  .filter(m => m.diagram);

// Terms from each original text diagram that the visual version must still contain.
const MUST_KEEP = {
  'ai-ds-mod-1': ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Generative AI', 'Diffusion', 'GPTs', 'RAG', 'Business Need', 'Data Discovery', 'Data Prep / ETL', 'ML Modeling', 'Model Evaluation', 'Production Deployment & MLOps', 'Iterative loop'],
  'ai-ds-mod-2': ['Immutable', 'Mutable', '0x10A', '0x10B', '0x20A', 'append(3)', 'Generator Stream', 'Comprehension / Filter', 'clean tuple stream', 'Statistical Aggregation / ML Model'],
  'ai-ds-mod-3': ['(2, 3)', 'int32', 'Strides', '(12, 4)', '24-byte', 'C-order', '(4, 3)', 'Prepend 1', '(1, 3)', 'zero memory duplication'],
  'ai-ds-mod-4': ['BlockManager', 'PyArrow', 'cust_id', 'region', 'revenue', 'churn', 'int64', 'float64', 'bool', "Split by 'Region'", '$300', '$500'],
  'ai-ds-mod-5': ['Data audit', 'MCAR', 'MAR', 'MNAR', 'MICE', 'IQR', 'RobustScaler', 'Isolation Forest', 'OneHotEncoder', 'Combined feature matrix'],
  'ai-ds-mod-6': ['Figure', 'Axes 1', 'Axes 2', 'Spines', 'Legend', 'Gridlines', 'Histplot', 'Violinplot', 'Countplot', 'Catplot', 'Scatterplot', 'Heatmap', 'Pairplot'],
  'ai-ds-mod-7': ['Population', 'n ≥ 30', 'Central Limit Theorem', 'H0', 'H1', 't-test', 'ANOVA', 'Chi-square', 'p < 0.05', 'p ≥ 0.05', 'Fail to reject H0'],
  'ai-ds-mod-8': ['missingno', 'Univariate', 'Skewness', 'Kurtosis', 'Pearson', 'Spearman', '0.85', 'Tukey IQR', 'winsorize', 'Box-Cox', 'Yeo-Johnson', 'modeling blueprint'],
  'ai-ds-mod-9': ['80% train', '20% holdout', 'SimpleImputer(median)', 'StandardScaler()', 'OneHotEncoder()', 'Stratified K-Fold', 'Fold 2', 'mean CV score', 'Final estimator fit', 'pipeline.score(X_test, y_test)'],
  'ai-ds-mod-10': ['Ordinary Least Squares', 'λ = 0', 'multicollinearity', 'Ridge', 'L2', 'Lasso', 'L1', 'exactly zero', 'feature selection', 'Elastic Net'],
  'ai-ds-mod-11': ['Logistic Regression', 'Naive Bayes', 'Support Vector Machine', 'K-Nearest Neighbors', 'Decision Trees (CART)', 'Gini', 'Random Forest', 'XGBoost', 'Macro F1-score', 'PR-AUC', 'SMOTE'],
  'ai-ds-mod-12': ['K-Means', 'inertia', 'DBSCAN', 'eps', 'min_samples', '−1', 'Silhouette', 'PCA', 'Eigen-decomposition', 't-SNE', 'UMAP', '2D / 3D'],
  'ai-ds-mod-13': ['outer K-fold', 'GridSearchCV', 'RandomizedSearchCV', 'Optuna', 'Refit', 'Reliability curves', 'Platt scaling', 'Isotonic', 'Permutation importance', 'SHAP', 'False negatives', "McNemar's test"],
  'ai-ds-mod-14': ['ReLU', 'cross-entropy', 'Backpropagation', 'Q = E · W_Q', 'K = E · W_K', 'V = E · W_V', 'Softmax', 'd_k', 'Chunking', 'FAISS / Chroma', 'ANN vector similarity search', 'Claude / GPT / LLaMA', 'grounded'],
  'ai-ds-mod-15': ['joblib.dump', 'model registry', 'FastAPI', 'InferenceRequest', '/predict', 'log_payload_to_db', 'docker build -t ml-api:v1 .', 'docker run -p 8000:8000', 'PSI > 0.2', 'Concept drift', 'p99 latency']
};

describe('visual diagram data', () => {
  it('has a visual version for every text architecture diagram in the courses', () => {
    expect(modulesWithText.length).toBeGreaterThan(0);
    const missing = modulesWithText.filter(m => !VISUAL_DIAGRAMS[m.id]).map(m => m.id);
    expect(missing).toEqual([]);
  });

  it('only defines diagrams for modules that exist', () => {
    const ids = new Set(db.courses.flatMap(c => c.modules).map(m => m.id));
    expect(Object.keys(VISUAL_DIAGRAMS).filter(id => !ids.has(id))).toEqual([]);
  });

  it.each(Object.entries(VISUAL_DIAGRAMS))('%s is a valid definition', (_, def) => {
    expect(validateVisualDiagram(def)).toEqual([]);
  });

  it.each(Object.entries(MUST_KEEP))('%s keeps the labels of the original diagram', (id, terms) => {
    const text = JSON.stringify(VISUAL_DIAGRAMS[id]).toLowerCase();
    const lost = terms.filter(t => !text.includes(t.toLowerCase()));
    expect(lost).toEqual([]);
  });

  it('reports problems in a broken definition instead of rendering it', () => {
    expect(validateVisualDiagram({ title: 'x', sections: [{ type: 'flow', steps: [] }, { type: 'nope' }] }).length).toBe(2);
    const { container } = render(<VisualDiagram def={{ title: 'x', sections: [] }} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('VisualDiagram component', () => {
  it('renders every diagram with all of its card titles', () => {
    for (const [id, def] of Object.entries(VISUAL_DIAGRAMS)) {
      const { container, unmount } = render(<VisualDiagram def={def} original="+--+" />);
      const titles = def.sections.flatMap(s => [...(s.items || []), ...(s.steps || []), ...(s.type === 'compare' ? s.columns : []), ...((s.type === 'branches' ? s.columns : []).flatMap(c => c.cards))]).map(c => c.title);
      for (const t of titles) expect(container.textContent, `${id}: ${t}`).toContain(t);
      unmount();
    }
  });

  it('shows the CRISP-DM feedback loop and the original text diagram on request', () => {
    render(<VisualDiagram def={VISUAL_DIAGRAMS['ai-ds-mod-1']} original="ORIGINAL ASCII" />);
    expect(screen.getByText(/Feedback loops/i)).toBeTruthy();
    expect(screen.queryByText('ORIGINAL ASCII')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /original diagram/i }));
    expect(screen.getByText('ORIGINAL ASCII')).toBeTruthy();
  });

  it('expands technical detail with the keyboard-accessible card button', () => {
    render(<VisualDiagram def={VISUAL_DIAGRAMS['ai-ds-mod-10']} />);
    const card = screen.getByRole('button', { name: /Ordinary Least Squares/i });
    expect(card.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/\(Xᵀ X\)⁻¹/)).toBeNull();
    fireEvent.click(card);
    expect(card.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/\(Xᵀ X\)⁻¹/)).toBeTruthy();
  });

  it('opens full screen and closes with Escape', () => {
    render(<VisualDiagram def={VISUAL_DIAGRAMS['ai-ds-mod-14']} />);
    fireEvent.click(screen.getByRole('button', { name: /full screen/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Part C: retrieval-augmented generation/i)).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
