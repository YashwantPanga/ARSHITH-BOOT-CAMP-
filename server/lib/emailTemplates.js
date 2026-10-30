// Branded HTML emails (inline styles for email clients) in the site palette.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ title, preheader, body }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F8F5EE;font-family:'DM Sans',Segoe UI,Arial,sans-serif;color:#302B25">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5EE;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E4E0D7">
<tr><td style="background:#013A2B;padding:22px 28px;color:#FBF8F1;font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:.5px">Code<span style="color:#7CC283">Lekho</span></td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="padding:18px 28px;background:#FBF8F1;color:#7A746A;font-size:12px;line-height:1.6">You are receiving this email because an account at CodeLekho uses this address. If this wasn't you, you can ignore this message.</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href, label) => `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#013A2B;color:#FBF8F1;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${esc(label)}</a></p>`;
const codeBox = (code) => `<p style="margin:18px 0;font-family:Consolas,Menlo,monospace;font-size:30px;letter-spacing:8px;color:#013A2B;background:#EFF4F1;border-radius:12px;padding:14px 18px;text-align:center">${esc(code)}</p>`;

export function verificationEmail({ name, code, link }) {
  return {
    subject: `${code} is your CodeLekho verification code`,
    text: `Hi ${name},\n\nWelcome to CodeLekho. Your verification code is:\n\n    ${code}\n\nEnter it on the verification screen to activate your account. The code expires in 24 hours.${link ? `\n\nYou can also verify with this link: ${link}` : ''}\n\nIf you did not create an account, you can ignore this email.\n\nCodeLekho`,
    html: layout({
      title: 'Verify your email',
      preheader: `Your verification code is ${code}`,
      body: `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-weight:400;color:#013A2B;font-size:26px">Verify your email</h1>
<p style="line-height:1.7;margin:0">Hi ${esc(name)}, welcome to CodeLekho! Enter this code on the verification screen to activate your account:</p>
${codeBox(code)}
${link ? `<p style="line-height:1.7;margin:0">Or verify with one click:</p>${button(link, 'Verify my email')}` : ''}
<p style="color:#7A746A;font-size:13px;margin:0">The code expires in 24 hours. If you did not create an account, you can ignore this email.</p>`
    })
  };
}

export function resetEmail({ name, code, link }) {
  return {
    subject: `${code} is your CodeLekho password reset code`,
    text: `Hi ${name},\n\nWe received a request to reset your password. Your reset code is:\n\n    ${code}\n\nEnter it on the reset screen. It expires in 30 minutes.${link ? `\n\nYou can also open: ${link}` : ''}\n\nIf you did not ask for this, ignore this email - your password will not change.\n\nCodeLekho`,
    html: layout({
      title: 'Reset your password',
      preheader: `Your password reset code is ${code}`,
      body: `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-weight:400;color:#013A2B;font-size:26px">Reset your password</h1>
<p style="line-height:1.7;margin:0">Hi ${esc(name)}, we received a request to reset your password. Enter this code on the reset screen:</p>
${codeBox(code)}${link ? button(link, 'Choose a new password') : ''}
<p style="color:#7A746A;font-size:13px;margin:0">This code expires in 30 minutes. If you didn't ask to reset your password, you can safely ignore this email — your password won't change.</p>`
    })
  };
}

export function passwordChangedEmail({ name }) {
  return {
    subject: 'Your CodeLekho password was changed',
    text: `Hi ${name},\n\nYour password was just changed. If this wasn't you, reset your password immediately and contact support.\n\nCodeLekho`,
    html: layout({
      title: 'Password changed',
      preheader: 'Your password was changed',
      body: `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-weight:400;color:#013A2B;font-size:26px">Password changed</h1>
<p style="line-height:1.7;margin:0">Hi ${esc(name)}, your password was just changed and you were signed out of other devices. If this wasn't you, reset your password right away and contact codelekho@arshithgroup.com.</p>`
    })
  };
}

export function completionEmail({ name, courseTitle, percentage, grade, certificateId, certificateLink, verifyLink }) {
  return {
    subject: `Congratulations! You completed ${courseTitle}`,
    text: `Hi ${name},\n\nCongratulations on completing ${courseTitle} with a final score of ${percentage}% (${grade}).\nCertificate ID: ${certificateId}\nDownload your certificate: ${certificateLink}\nAnyone can verify it at: ${verifyLink}\n\nCodeLekho`,
    html: layout({
      title: 'Course completed',
      preheader: `You completed ${courseTitle} with ${percentage}%`,
      body: `<p style="margin:0;font-size:12px;letter-spacing:3px;color:#426557;font-weight:700">COURSE COMPLETED</p>
<h1 style="margin:8px 0 12px;font-family:Georgia,serif;font-weight:400;color:#013A2B;font-size:28px">Congratulations, ${esc(name)}!</h1>
<p style="line-height:1.7;margin:0">You have completed every module, every quiz, all course projects and the proctored final assessment of <strong>${esc(courseTitle)}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;background:#F8F5EE;border-radius:12px">
<tr><td style="padding:14px 18px;font-size:14px;line-height:1.9">
<strong>Final score:</strong> ${esc(percentage)}% · ${esc(grade)}<br>
<strong>Certificate ID:</strong> <span style="font-family:Consolas,Menlo,monospace">${esc(certificateId)}</span></td></tr></table>
${button(certificateLink, 'View & download your certificate')}
<p style="line-height:1.7;margin:0;font-size:14px">Employers can verify your certificate at <a href="${esc(verifyLink)}" style="color:#013A2B">${esc(verifyLink)}</a> or by scanning the QR code printed on it.</p>`
    })
  };
}
