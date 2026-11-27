const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
// "November 27, 2026" (how certificates store the date) -> { year, month }
const issued = (value) => {
  const text = String(value || '');
  const year = (text.match(/(20\d{2})/) || [])[1];
  const name = MONTHS.findIndex(m => text.toLowerCase().includes(m));
  const d = new Date(text);
  if (year && name >= 0) return { year, month: name + 1 };
  if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1 };
  return null;
};

/** LinkedIn's "Add license or certification" form, filled in: course, CodeLekho, date, ID and verify link. */
export const linkedInAddUrl = (cert, verifyUrl) => {
  const q = new URLSearchParams({ startTask: 'CERTIFICATION_NAME', name: cert.courseTitle || 'CodeLekho Certificate', organizationName: 'CodeLekho', certId: cert.certificateId || '', certUrl: verifyUrl || '' });
  const when = issued(cert.issueDate);
  if (when) { q.set('issueYear', String(when.year)); q.set('issueMonth', String(when.month)); }
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
};
export const openAddToProfile = (cert, verifyUrl) => window.open(linkedInAddUrl(cert, verifyUrl), '_blank', 'noopener');
