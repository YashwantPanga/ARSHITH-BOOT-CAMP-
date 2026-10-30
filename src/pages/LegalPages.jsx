import React from 'react';
import { PageTop } from '../components/ui';

const UPDATED = '24 October 2026';
const CONTACT = 'codelekho@arshithgroup.com';

/** One legal document: banner, a sticky contents list and numbered sections in a card. */
function LegalDoc({ title, intro, sections, onHome }) {
  return (
    <div className="bg-ivory">
      <PageTop title={title} crumb={title} onHome={onHome}>
        <p className="mt-3 text-charcoal/65">Last updated {UPDATED}</p>
      </PageTop>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-[250px_1fr] gap-8 items-start">
        <nav className="edu-card p-5 lg:sticky lg:top-28" aria-label="Contents">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-sage">Contents</p>
          <ol className="mt-3 space-y-1.5 text-[14px]">
            {sections.map((s, i) => (
              <li key={s.title}><a href={`#s${i + 1}`} className="flex gap-2 text-charcoal/70 hover:text-forest transition-colors"><span className="text-sage font-semibold tabular-nums">{i + 1}.</span>{s.title}</a></li>
            ))}
          </ol>
        </nav>
        <article className="edu-card p-6 sm:p-10">
          <p className="text-[15.5px] leading-relaxed text-charcoal/75">{intro}</p>
          {sections.map((s, i) => (
            <section key={s.title} id={`s${i + 1}`} className="mt-9 scroll-mt-28">
              <h2 className="flex items-baseline gap-3 text-[22px] text-evergreen"><span className="font-display text-sage">{String(i + 1).padStart(2, '0')}</span>{s.title}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-charcoal/75">
                {s.body.map((para, j) => Array.isArray(para)
                  ? <ul key={j} className="list-disc pl-5 space-y-1.5 marker:text-sage">{para.map(li => <li key={li}>{li}</li>)}</ul>
                  : <p key={j}>{para}</p>)}
              </div>
            </section>
          ))}
          <p className="mt-10 pt-6 border-t border-brand-900/10 text-[14px] text-charcoal/60">
            Questions about this document? Write to <a href={`mailto:${CONTACT}`} className="font-semibold text-forest hover:underline">{CONTACT}</a>.
          </p>
        </article>
      </div>
    </div>
  );
}

export function TermsPage({ onHome }) {
  return (
    <LegalDoc
      title="Terms of Use"
      onHome={onHome}
      intro="These Terms of Use govern your use of CodeLekho, operated by Arshith Group, Bengaluru, India. By creating an account or using the site you agree to them. If you do not agree, please do not use the site."
      sections={[
        { title: 'Your account', body: [
          'You must give your full name exactly as it appears on a government or college photo ID, and a working email address. Your name is printed on your certificate and checked against your ID before the final assessment.',
          'Keep your password private. You are responsible for activity on your account. One person may hold one account.'
        ] },
        { title: 'Courses and certificates', body: [
          'All courses are currently free, and you may take as many as you like. If paid courses are introduced, the price is shown before you enrol and payments follow the Refund and Cancellation Policy.',
          'Each course has two attempts at its final assessment. If you fail both, you can start the course again: every module quiz is reset and you get two fresh attempts. A certificate of completion is issued when you finish every module quiz, submit the required project and score at least 70% in the proctored final assessment.',
          'Certificates confirm completion of an CodeLekho course. They are not a degree, diploma or university qualification, and are not issued under UGC or AICTE approval. Each certificate has a unique ID that anyone can verify on this site.',
          'We may revoke a certificate obtained through cheating, impersonation or false information.'
        ] },
        { title: 'Proctored assessment', body: [
          'The final assessment is monitored to keep certificates trustworthy. It requires a webcam, fullscreen mode and a single browser tab. During the assessment the site checks, on your device, that the same person who started is present, that no other person, phone or hand-held device is visible, and where you are looking.',
          'Suspected violations are recorded with the time and type of event and are visible to our administrators. Repeated or serious violations may end the attempt or lead to a review of your result.'
        ] },
        { title: 'Acceptable use', body: [
          'You agree not to:',
          [
            'let anyone else take a quiz or assessment for you, or take one for someone else;',
            'share, sell or publish assessment questions or answers;',
            'copy, scrape, download in bulk, republish or redistribute course content, code or certificates;',
            'attempt to break, overload or get around the security of the site, or access other learners’ data;',
            'use the site for anything unlawful.'
          ]
        ] },
        { title: 'Intellectual property', body: [
          '© 2026 Arshith Group. All rights reserved. The course content, lessons, quizzes, diagrams, code, design, logos and certificates on this site belong to Arshith Group or its licensors and are protected by the Copyright Act, 1957 and other laws.',
          'You may read the material and download your own course PDF and certificate for personal learning only. No other copying, reproduction, adaptation or redistribution is permitted without our written permission. "CodeLekho" and its logo are brand names of Arshith Group.'
        ] },
        { title: 'Availability and changes', body: [
          'We work to keep the site available and accurate but provide it "as is". Courses, features and these terms may change; we will update the date above when they do. Continuing to use the site after a change means you accept it.'
        ] },
        { title: 'Ending your account', body: [
          'You can ask us to close your account at any time. We may suspend or close accounts that break these terms. Certificates already issued stay verifiable unless revoked for misconduct.'
        ] },
        { title: 'Liability', body: [
          'To the extent the law allows, Arshith Group is not liable for indirect or consequential loss arising from use of the site. Nothing in these terms limits rights you have under Indian consumer law.'
        ] },
        { title: 'Governing law', body: [
          'These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have jurisdiction over any dispute.'
        ] }
      ]}
    />
  );
}

export function PrivacyPage({ onHome }) {
  return (
    <LegalDoc
      title="Privacy Policy"
      onHome={onHome}
      intro="This policy explains what personal data Arshith Group collects through CodeLekho, why, and the choices you have. It is written to meet the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000."
      sections={[
        { title: 'Data we collect', body: [
          [
            'Account details: your name (as on your photo ID), email address, password (stored only as a secure hash) and your learner ID.',
            'Learning records: course enrolment, module progress, quiz and assessment scores, project links you submit and the certificates issued to you.',
            'Assessment monitoring results: whether your face checks passed, and the time and type of any suspected violations (for example another person visible or leaving fullscreen).',
            'Messages you send through the contact form.',
            'Basic technical data needed to run the site, such as your browser type and a sign-in token kept in your browser.'
          ]
        ] },
        { title: 'Camera and face images', body: [
          'Camera access is requested only for the proctored final assessment, and only with your permission. Your face reference is analysed in your browser, on your own device. The images are not uploaded or stored by us.',
          'Only the outcomes are sent to our server: whether the face checks passed and the violation events described above.'
        ] },
        { title: 'Why we use your data', body: [
          [
            'to create and secure your account and send sign-in and verification codes;',
            'to track your progress, run quizzes and assessments, and issue certificates in your name;',
            'to keep assessments fair and investigate suspected cheating;',
            'to let anyone verify a certificate ID (this shows the name, course, score and date on that certificate);',
            'to answer your questions and improve our courses.'
          ],
          'We do not sell your data or use it for advertising.'
        ] },
        { title: 'Who processes it', body: [
          'Your data is stored with our database provider (Supabase) and emails are delivered through our email provider (Brevo). Payments are handled by Razorpay, which receives your name, email and payment details directly; we receive only the payment ID and status. They process data only on our instructions. We may disclose data if the law requires it.'
        ] },
        { title: 'How long we keep it', body: [
          'Account and learning records are kept while your account is open. Certificate records are kept so certificates stay verifiable. When you ask us to delete your account we remove your personal data, except what we must keep by law or to prevent fraud.'
        ] },
        { title: 'Your rights', body: [
          'You may ask to see, correct or delete your personal data, withdraw consent for future processing, or nominate someone to act for you. Write to us at the address below; we reply within 30 days.'
        ] },
        { title: 'Security', body: [
          'Passwords are hashed, connections use HTTPS, and administrator access is restricted and time-limited. No system is perfectly secure, so please use a strong password of your own.'
        ] },
        { title: 'Children', body: [
          'The site is intended for learners aged 18 and over. Learners under 18 may use it only with the consent of a parent or guardian.'
        ] },
        { title: 'Grievance officer', body: [
          `For any privacy concern or complaint, contact the Grievance Officer, Arshith Group, Bengaluru, Karnataka, India at ${CONTACT}. If you are not satisfied with our response you may approach the Data Protection Board of India.`
        ] }
      ]}
    />
  );
}

export function RefundPage({ onHome }) {
  return (
    <LegalDoc
      title="Refund and Cancellation Policy"
      onHome={onHome}
      intro="This policy covers payments made on CodeLekho, operated by Arshith Group, Bengaluru, India. Payments are processed securely by Razorpay; we never see or store your card, UPI or bank details."
      sections={[
        { title: 'What you pay for', body: [
          'All courses on CodeLekho are currently free, so no payment is taken. This policy applies if paid courses are introduced, when the price is shown before you enrol.',
          'A payment unlocks one course for the account that paid: all its modules, quizzes, the project and the proctored final assessment. The course is unlocked as soon as the payment is confirmed, and a receipt is emailed to you.'
        ] },
        { title: 'Cancellation', body: [
          'Because the course is a digital service that is unlocked immediately, an order cannot be cancelled once the payment is successful.'
        ] },
        { title: 'Refunds', body: [
          'You can ask for a full refund within 7 days of payment if you have not yet attempted the final assessment of that course.',
          'We also refund in full if you were charged twice for the same course, or if money was taken but the course was not unlocked and we cannot fix it.',
          'Refunds are not given after a final assessment attempt, for a failed assessment, or when access was removed for breaking the Terms of Use.'
        ] },
        { title: 'How to ask', body: [
          `Email ${CONTACT} or call +91 82177 29744 with your registered email and the Razorpay payment ID from your receipt. We reply within 2 working days.`,
          'Approved refunds are sent back to the original payment method within 5-7 working days. When a refund is made, the course is locked again.'
        ] },
        { title: 'Failed payments', body: [
          'If money leaves your account but the payment fails, your bank or Razorpay normally returns it automatically within 5-7 working days. If it does not, contact us with the payment ID.'
        ] }
      ]}
    />
  );
}
