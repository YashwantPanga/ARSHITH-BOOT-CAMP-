// Interview Prep access: free for learners who hold certificates for all 4 courses (see
// interviewRoutes.js); anyone else can unlock it for interviewPrice() (₹599) through Cashfree.
const norm = (v) => String(v || '').trim().toLowerCase();

export const INTERVIEW_PRICE = 599;
/** Rupees to unlock Interview Prep. INTERVIEW_PRICE in .env overrides it (e.g. 1 to try a real payment). */
export function interviewPrice() {
  const v = Number(process.env.INTERVIEW_PRICE);
  return Number.isInteger(v) && v >= 1 ? v : INTERVIEW_PRICE;
}

export const interviewPaid = (db, email) => Boolean(db.interviewAccess?.[norm(email)]?.paidAt);

export function grantInterview(db, email, { orderId = null, by = 'cashfree' } = {}) {
  if (!db.interviewAccess) db.interviewAccess = {};
  db.interviewAccess[norm(email)] = { paidAt: new Date().toISOString(), orderId, by };
}
