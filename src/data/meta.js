// One name per category, used on filters, badges and the Categories page. 'All Categories' is the
// "no filter" value (shown as "All courses").
export const CATEGORIES = [
  'All Categories',
  'Python',
  'SQL',
  'Web Development',
  'AI & Data Science',
  'Cyber Security'
];
export const categoryLabel = (c) => (c === 'All Categories' ? 'All courses' : c);

// older records used other names for the same categories
const CATEGORY_ALIASES = { Programming: 'Python', 'Artificial Intelligence & Data Science': 'AI & Data Science', AI: 'AI & Data Science', 'AI & Data': 'AI & Data Science' };
export const categoryOf = (course) => CATEGORY_ALIASES[course?.category] || course?.category || '';

/** Category in the address bar: "web-development" rather than "Web+Development". */
export const categorySlug = (c) => String(c || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const categoryFromSlug = (s) => {
  if (!s) return 'All Categories';
  const name = CATEGORY_ALIASES[s] || s;
  return CATEGORIES.find(c => c === name || categorySlug(c) === categorySlug(name)) || 'All Categories';
};

const U = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=90`;

export const IMAGES = {
  heroPortrait: U('photo-1507003211169-0a1dd7228f2d', 1400),
  heroStudents: U('photo-1522202176988-66273c2fd55f', 1800),
  heroLaptop: U('photo-1519389950473-47ba0277781c', 1800),
  portrait: U('photo-1531482615713-2afd69097998', 1400),
  team: U('photo-1600880292203-757bb62b4baf', 1600),
  analytics: U('photo-1551288049-bebda4e38f71', 1400),
  code: U('photo-1515879218367-8466d910aaa4', 1800),
  study: U('photo-1434030216411-0b793f4b4173', 1600)
};

/** Visual identity for each track – used for the badge that overlaps course images. */
export const TRACKS = {
  python: { label: 'Python', short: 'Py', mark: 'py' },
  database: { label: 'SQL', short: 'SQL', mark: 'sql' },
  code: { label: 'Web Development', short: '</>', mark: 'web' },
  brain: { label: 'AI & Data Science', short: 'AI', mark: 'ai' },
  shield: { label: 'Cyber Security', short: 'CS', mark: 'cs' }
};

/** Rough learning hours per course, shown on cards (falls back to the course.duration string). */
export const hoursOf = (course) => {
  const m = String(course?.duration || '').match(/(\d+)/);
  return m ? `${m[1]} ${/week/i.test(course.duration) ? 'weeks' : 'hours'}` : `${(course?.modules?.length || 15) * 2} hours`;
};
