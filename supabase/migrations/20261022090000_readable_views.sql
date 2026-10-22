-- Readable tables for the Supabase Table Editor, built from the app_state collections.
-- Read-only: the app keeps writing to app_state; these views always show the latest data.
-- security_invoker makes them obey app_state's row level security, and the grants below
-- keep them away from the public (anon/publishable) API key, so only the dashboard and the
-- server's secret key can see emails and phone numbers.

create or replace view public.learners_view with (security_invoker = true) as
select
  l.value->>'name'          as name,
  l.key                     as email,
  l.value->>'phone'         as phone,
  l.value->>'regNo'         as reg_no,
  l.value->>'learnerId'     as learner_id,
  e.value->>'courseId'      as enrolled_course,
  case when l.value ? 'emailVerified' then (l.value->>'emailVerified')::boolean else true end as email_verified,
  (l.value->>'createdAt')::timestamptz as joined_at
from public.app_state s
cross join lateral jsonb_each(s.data) as l
left join public.app_state es on es.key = 'learnerEnrollments'
left join lateral (select es.data->l.key as value) e on true
where s.key = 'learners';

create or replace view public.certificates_view with (security_invoker = true) as
select
  c->>'certificateId'                as certificate_id,
  c->>'studentName'                  as student_name,
  coalesce(c->>'studentEmail', c->>'userId') as email,
  c->>'regNo'                        as reg_no,
  c->>'learnerId'                    as learner_id,
  c->>'courseTitle'                  as course,
  (c->>'percentage')::numeric        as percentage,
  (c->>'score')::int                 as score,
  (c->>'totalQuestions')::int        as total_questions,
  c->>'grade'                        as grade,
  c->>'status'                       as status,
  c->>'issueDate'                    as issue_date,
  c->'completionEmail'->>'status'    as completion_email,
  (c->>'createdAt')::timestamptz     as created_at
from public.app_state s
cross join lateral jsonb_array_elements(s.data) as c
where s.key = 'certificates';

create or replace view public.project_submissions_view with (security_invoker = true) as
select
  p->>'studentName'               as student_name,
  coalesce(p->>'studentEmail', p->>'userId') as email,
  p->>'courseTitle'               as course,
  p->>'projectTitle'              as project,
  p->>'githubUrl'                 as github_url,
  p->>'status'                    as status,
  (p->>'submittedAt')::timestamptz as submitted_at
from public.app_state s
cross join lateral jsonb_array_elements(s.data) as p
where s.key = 'projectSubmissions';

revoke all on public.learners_view, public.certificates_view, public.project_submissions_view from anon, authenticated;
