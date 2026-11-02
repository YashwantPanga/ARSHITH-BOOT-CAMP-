/** Development only: remembers the email code shown on screen while SMTP is not configured. */
export const rememberDevMail = (info) => { try { sessionStorage.setItem('arb_dev_mail', JSON.stringify(info)); } catch { /* ignore */ } };
