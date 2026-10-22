// Explicit course → image mapping for the course slideshow.
// The project has no designed promotional flyers, so each course's existing thumbnail (its current
// "flyer" image, stored in the course record) is always slide 1, followed by subject-matched photos.
// Every entry is mapped by course id; a course that is not listed shows only its own thumbnail,
// never another course's images. Photos: Unsplash (free to use under the Unsplash License).

const U = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export const COURSE_GALLERY = {
  'python-programming': [
    { src: U('photo-1526379095098-d400fd0bf935'), alt: 'A learner holding a sticky note that says Python in front of a monitor', caption: 'Start with the language behind data science, automation and web back-ends' },
    { src: U('photo-1517694712202-14dd9538aa97'), alt: 'Laptop on a desk showing source code in an editor', caption: 'Write, run and debug real scripts in every module' },
    { src: U('photo-1461749280684-dccba630e2f6'), alt: 'Close-up of colourful program code on a screen', caption: 'From variables to databases and visualisation' }
  ],
  'sql-mastery': [
    { src: U('photo-1544383835-bda2bc66a55d'), alt: 'Wooden library card-catalogue drawers, an analogy for indexed data', caption: 'Organise data so every question has a fast, exact answer' },
    { src: U('photo-1551288049-bebda4e38f71'), alt: 'Analytics dashboard with charts on a monitor', caption: 'Turn tables into reports with joins, aggregates and window functions' },
    { src: U('photo-1460925895917-afdab827c52f'), alt: 'Laptop displaying business charts and metrics', caption: 'Practise every query on a live sample database' }
  ],
  'web-development': [
    { src: U('photo-1547658719-da2b51169166'), alt: 'Website open on a desktop monitor, tablet and phone at the same time', caption: 'Build responsive sites that work on every screen' },
    { src: U('photo-1498050108023-c5249f4df085'), alt: 'Laptop with code editor on a bright desk', caption: 'HTML, CSS, JavaScript, React and Node.js — end to end' },
    { src: U('photo-1555066931-4365d14bab8c'), alt: 'Code editor with JavaScript on a laptop screen', caption: 'Ship a full-stack capstone for your portfolio' }
  ],
  'data-science-ai': [
    { src: U('photo-1509228468518-180dd4864904'), alt: 'Handwritten system of linear equations on paper', caption: 'Build intuition for the maths behind machine learning' },
    { src: U('photo-1543286386-713bdd548da4'), alt: 'Hand-drawn line chart on paper next to a ruler and pen', caption: 'Statistics and probability, explained with worked examples' },
    { src: U('photo-1518186285589-2f7649de83e0'), alt: 'Monitor showing financial line charts', caption: 'From exploratory analysis to models that predict' },
    { src: U('photo-1555949963-ff9fe0c870eb'), alt: 'Colourful code on a dark screen', caption: 'NumPy, pandas, scikit-learn and modern AI tools' }
  ]
};

/** Slides for a course: its own thumbnail first, then the mapped gallery (deduplicated). */
export function slidesForCourse(course) {
  if (!course) return [];
  const own = course.thumbnail ? [{ src: course.thumbnail, alt: `${course.title} course banner`, caption: course.shortDescription || course.title }] : [];
  const mapped = COURSE_GALLERY[course.id] || [];
  const seen = new Set();
  return [...own, ...mapped].filter(s => s.src && !seen.has(s.src.split('?')[0]) && seen.add(s.src.split('?')[0]));
}
