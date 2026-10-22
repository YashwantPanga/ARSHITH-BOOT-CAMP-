// Mini-project (GitHub repository) submissions. The final assessment stays locked until the learner
// has submitted a GitHub repository for at least one of their course's mini projects (any one of them).

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

/** How many project repositories unlock the final assessment: any one project of the course. */
export const PROJECTS_NEEDED = 1;

/**
 * { required, total, submitted, missing[] } for the learner's course.
 * `required` is how many repositories are needed (1), `total` how many projects the course offers.
 * `missing` is empty once enough are submitted; until then it lists the projects to choose from.
 */
export function projectRequirement(db, userId, course) {
  const req = requiredProjects(course);
  const submitted = new Set(getSubmittedProjectIds(db, userId, course));
  const required = Math.min(PROJECTS_NEEDED, req.length);
  const missing = submitted.size >= required ? [] : req.filter(p => !submitted.has(p.id)).map(p => ({ id: p.id, title: p.title }));
  return { required, total: req.length, submitted: submitted.size, missing };
}
