// Mini-project (GitHub repository) submissions. The final assessment stays locked until the learner
// has submitted a GitHub repository for every mini project of their course.

export const GITHUB_REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}(?:\.git)?\/?$/;

export const requiredProjects = (course) => (course?.projects || []).filter(p => p && p.id);

/** Project ids of `course` for which `userId` has a submitted GitHub repository on the server. */
export function getSubmittedProjectIds(db, userId, course) {
  const required = new Set(requiredProjects(course).map(p => p.id));
  const ids = new Set();
  for (const s of db.projectSubmissions || []) {
    if (s.userId === userId && s.courseId === course?.id && required.has(s.projectId) && GITHUB_REPO_RE.test(s.githubUrl || '')
      && s.status !== 'Rejected') ids.add(s.projectId);
  }
  return [...ids];
}

/** { required, submitted, missing[] } for the learner's course. */
export function projectRequirement(db, userId, course) {
  const req = requiredProjects(course);
  const submitted = new Set(getSubmittedProjectIds(db, userId, course));
  return { required: req.length, submitted: submitted.size, missing: req.filter(p => !submitted.has(p.id)).map(p => ({ id: p.id, title: p.title })) };
}
