"""Typesets the complete CodeLekho Cyber Security course book (A4 PDF) from the course content.

Inputs (made by the two scripts next to this one):
  course.json   node scripts/cyber-pdf/export-course.mjs course.json
  diagrams/     npx vite-node scripts/cyber-pdf/render-diagrams.jsx diagrams
Usage:
  python scripts/cyber-pdf/build_pdf.py <work-dir> <out.pdf>
Needs PyMuPDF. Fonts: Georgia (headings), Segoe UI (text) and Consolas (code), embedded as subsets.
"""
import html
import json
import os
import sys

import fitz  # PyMuPDF

WORK, OUT = sys.argv[1], sys.argv[2]
FONTS = 'C:/Windows/Fonts'
A4 = fitz.paper_rect('a4')
MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM = 56, 70, 64
FOREST, DEEP, GOLD, IVORY, INK = (0.059, 0.353, 0.271), (0.016, 0.149, 0.118), (0.753, 0.541, 0.169), (0.984, 0.973, 0.945), (0.12, 0.16, 0.15)

data = json.load(open(os.path.join(WORK, 'course.json'), encoding='utf-8'))
course, enrichment = data['course'], data['enrichment']
diagrams = json.load(open(os.path.join(WORK, 'diagrams', 'index.json'), encoding='utf-8'))

# ---------------------------------------------------------------- diagram images
img_dir = os.path.join(WORK, 'img')
os.makedirs(img_dir, exist_ok=True)
for mid, d in diagrams.items():
    for s in d['slides']:
        if s.get('file'):
            src = fitz.open(os.path.join(WORK, 'diagrams', s['file']))
            png = s['file'].replace('.svg', '.png')
            src[0].get_pixmap(dpi=150).save(os.path.join(img_dir, png))
            s['png'] = png

# ---------------------------------------------------------------- HTML helpers
e = lambda t: html.escape(str(t or ''))


def paras(text):
    return ''.join(f'<p>{e(p.strip())}</p>' for p in str(text or '').split('\n\n') if p.strip())


def table(head, rows):
    th = ''.join(f'<th>{e(h)}</th>' for h in head)
    body = ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table><tr class="head">{th}</tr>{body}</table>'


def code(src, label=''):
    lab = f'<p class="codelabel">{e(label)}</p>' if label else ''
    return f'{lab}<pre>{e(src)}</pre>'


def bullets(items):
    return '<ul>' + ''.join(f'<li>{e(i)}</li>' for i in items) + '</ul>' if items else ''


CSS = f"""
@font-face {{ font-family: Body; src: url(segoeui.ttf); }}
@font-face {{ font-family: Body; src: url(segoeuib.ttf); font-weight: bold; }}
@font-face {{ font-family: Body; src: url(segoeuii.ttf); font-style: italic; }}
@font-face {{ font-family: Head; src: url(georgiab.ttf); font-weight: bold; }}
@font-face {{ font-family: Head; src: url(georgia.ttf); }}
@font-face {{ font-family: Mono; src: url(consola.ttf); }}
* {{ font-family: Body; }}
body {{ font-size: 10.3pt; line-height: 1.5; color: #1F2A26; }}
p {{ margin: 0 0 7pt 0; }}
.kicker {{ font-size: 9pt; font-weight: bold; color: #C08A2B; letter-spacing: 2pt; margin: 0; }}
h1 {{ font-family: Head; font-weight: bold; font-size: 25pt; line-height: 1.15; color: #0F3D30; margin: 4pt 0 8pt 0; }}
.lead {{ font-size: 11.2pt; color: #3E4A46; margin-bottom: 12pt; }}
h2 {{ font-family: Head; font-weight: bold; font-size: 15pt; color: #0F5A45; margin: 18pt 0 6pt 0; }}
h3 {{ font-weight: bold; font-size: 11.5pt; color: #0F3D30; margin: 12pt 0 4pt 0; }}
ul, ol {{ margin: 0 0 8pt 0; padding-left: 16pt; }}
li {{ margin-bottom: 3pt; }}
table {{ width: 100%; border-collapse: collapse; margin: 4pt 0 10pt 0; font-size: 9pt; }}
th {{ color: #0F5A45; font-weight: bold; text-align: left; padding: 4pt 5pt; border-bottom: 1.6pt solid #0F5A45; }}
td {{ padding: 4pt 5pt; border-bottom: 0.6pt solid #D5E0DA; vertical-align: top; }}
.note {{ border-left: 3pt solid #C08A2B; padding: 3pt 0 3pt 9pt; margin: 4pt 0 10pt 0; font-size: 9.6pt; color: #3E4A46; }}
.box {{ border: 0.8pt solid #C9D8D0; border-left: 3pt solid #0F5A45; padding: 6pt 10pt; margin: 4pt 0 10pt 0; }}
pre {{ font-family: Mono; font-size: 8.1pt; line-height: 1.35; color: #13322A; border: 0.8pt solid #C9D8D0; border-left: 3pt solid #C08A2B; padding: 6pt 9pt; margin: 2pt 0 10pt 0; white-space: pre-wrap; }}
.codelabel {{ font-size: 8.5pt; font-weight: bold; color: #5A6863; margin: 6pt 0 2pt 0; }}
.fig {{ margin: 6pt 0 2pt 0; }}
.figcap {{ font-size: 8.8pt; color: #5A6863; margin: 0 0 12pt 0; }}
.objectives li {{ margin-bottom: 4pt; }}
.small {{ font-size: 9pt; color: #4C5A55; }}
.q {{ font-weight: bold; margin: 8pt 0 2pt 0; }}
.opt {{ margin: 0 0 1pt 12pt; font-size: 9.6pt; }}
"""


def module_html(i, m):
    rm = m['readingMaterial']
    en = enrichment.get(m['id'], {})
    title = m['title'].split('–', 1)[-1].strip()
    out = [f'<p class="kicker">MODULE {i:02d}</p><h1 id="m{i}">{e(title)}</h1><p class="lead">{e(m.get("description"))}</p>']
    if rm.get('objectives'):
        out.append('<div class="box"><h3>By the end of this module you will be able to</h3><ul class="objectives">' + ''.join(f'<li>{e(o)}</li>' for o in rm['objectives']) + '</ul></div>')
    out.append('<h2>Introduction</h2>' + paras(rm.get('introduction')))
    if en.get('intuition', {}).get('analogy'):
        out.append(f'<div class="note"><b>In simple words.</b> {e(en["intuition"]["analogy"])}</div>')
    if rm.get('terminology'):
        out.append('<h2>Key terms</h2>' + table(['Term', 'Meaning'], [[t['term'], t['definition']] for t in rm['terminology']]))
    for s in rm.get('sections', []):
        out.append(f'<h2>{e(s["heading"])}</h2>' + paras(s.get('text')) + bullets(s.get('bulletPoints')))
        if s.get('table'):
            out.append(table(s['table']['headers'], s['table']['rows']))
        if s.get('code'):
            out.append(code(s['code'], {'python': 'Python', 'bash': 'Terminal', 'powershell': 'PowerShell'}.get(s.get('language'), (s.get('language') or '').upper())))
        if s.get('note'):
            out.append(f'<div class="note">{e(s["note"])}</div>')
    d = diagrams.get(m['id'])
    if d:
        out.append(f'<h2>Diagrams: {e(d["title"])}</h2>')
        for k, s in enumerate(d['slides'], 1):
            cap = f'Figure {i}.{k}: {e(s["title"])}' + (f'. {e(s["text"])}' if s.get('text') else '')
            if s['type'] == 'table':
                out.append(f'<h3>{e(s["title"])}</h3>' + table(s['head'], s['rows']))
            else:
                out.append(f'<div class="fig"><img src="img/{s["png"]}" width="100%"/></div><p class="figcap">{cap}</p>')
        if d.get('note'):
            out.append(f'<div class="note">{e(d["note"])}</div>')
    wf = en.get('workflow')
    if wf:
        out.append(f'<h2>Step by step: {e(wf["title"])}</h2><ol>' + ''.join(f'<li><b>{e(n["label"])}.</b> {e(n.get("explain") or n.get("detail"))}</li>' for n in wf['nodes']) + '</ol>')
    for t in rm.get('tutorials', []):
        out.append(f'<h2>{e(t["title"])}</h2>')
        for st in t['steps']:
            out.append(f'<h3>Step {st["step"]}</h3><p>{e(st.get("instruction"))}</p>')
            if st.get('code'):
                out.append(code(st['code']))
            if st.get('explanation'):
                out.append(f'<p class="small">{e(st["explanation"])}</p>')
    if rm.get('codeExamples'):
        out.append('<h2>Code examples</h2>')
        for ex in rm['codeExamples']:
            out.append(f'<h3>{e(ex["title"])}</h3>' + code(ex['code']) + paras(ex.get('explanation')))
    cs = en.get('caseStudy')
    if cs:
        out.append(f'<h2>Case study: {e(cs["title"])}</h2><p><b>Problem.</b> {e(cs.get("problem"))}</p><ol>' + ''.join(f'<li>{e(x)}</li>' for x in cs.get('steps', [])) + f'</ol><p><b>Result.</b> {e(cs.get("result"))}</p><p class="small">{e(cs.get("limitations"))}</p>')
    if rm.get('commonMistakes'):
        out.append('<h2>Common mistakes</h2>' + bullets(rm['commonMistakes']))
    if rm.get('bestPractices'):
        out.append('<h2>Best practices</h2>' + bullets(rm['bestPractices']))
    if rm.get('practiceExercise'):
        pe = rm['practiceExercise']
        out.append(f'<h2>{e(pe.get("title"))}</h2>' + ''.join(f'<p>{e(l)}</p>' for l in str(pe.get('problem', '')).split('\n') if l.strip()))
    if rm.get('miniTask'):
        mt = rm['miniTask']
        out.append(f'<div class="box"><h3>{e(mt.get("title"))}</h3><p>{e(mt.get("objective"))}</p>' + bullets(mt.get('requirements')) + f'<p><b>Deliverable.</b> {e(mt.get("deliverable"))}</p></div>')
    kc = en.get('knowledgeCheck') or []
    if kc:
        out.append('<h2>Check your understanding</h2>')
        letters = 'ABCD'
        for n, q in enumerate(kc, 1):
            out.append(f'<p class="q">{n}. {e(q["question"])}</p>' + ''.join(f'<p class="opt">{letters[j]}. {e(o)}</p>' for j, o in enumerate(q['options'])))
        out.append('<p class="small"><b>Answers:</b> ' + '; '.join(f'{n}. {letters[q["answer"]]} ({e(q["explanation"])})' for n, q in enumerate(kc, 1)) + '</p>')
    if rm.get('keyTakeaways'):
        out.append('<h2>Key takeaways</h2>' + bullets(rm['keyTakeaways']))
    qr = (rm.get('summary') or {}).get('quickReference') or []
    if qr:
        out.append('<div class="box"><h3>Quick reference</h3>' + bullets(qr) + '</div>')
    if rm.get('references'):
        out.append('<h2>Further reading</h2><ul>' + ''.join(f'<li>{e(r["title"])}: {e(r["url"])}</li>' for r in rm['references']) + '</ul>')
    return '<body>' + ''.join(out) + '</body>'


# ---------------------------------------------------------------- typeset the body
archive = fitz.Archive()
archive.add(fitz.Archive(FONTS), path=None)
archive.add(WORK)
body_path = os.path.join(WORK, 'body.pdf')
writer = fitz.DocumentWriter(body_path)
content = fitz.Rect(MARGIN_X, MARGIN_TOP, A4.width - MARGIN_X, A4.height - MARGIN_BOTTOM)
starts, page_no = [], 0
for i, m in enumerate(course['modules'], 1):
    starts.append(page_no)
    story = fitz.Story(html=module_html(i, m), user_css=CSS, archive=archive)
    more = True
    while more:
        dev = writer.begin_page(A4)
        more, _ = story.place(content)
        story.draw(dev)
        writer.end_page()
        page_no += 1
writer.close()

# ---------------------------------------------------------------- cover, contents, headers, bookmarks
body = fitz.open(body_path)
book = fitz.open()
F_HEAD, F_BODY, F_BOLD = 'Georgia-Bold', 'Segoe', 'SegoeB'


def fonts(page):
    page.insert_font(fontname=F_HEAD, fontfile=f'{FONTS}/georgiab.ttf')
    page.insert_font(fontname=F_BODY, fontfile=f'{FONTS}/segoeui.ttf')
    page.insert_font(fontname=F_BOLD, fontfile=f'{FONTS}/segoeuib.ttf')


titles = [m['title'].split('–', 1)[-1].strip() for m in course['modules']]

# cover
p = book.new_page(width=A4.width, height=A4.height)
fonts(p)
p.draw_rect(p.rect, color=None, fill=FOREST)
p.draw_rect(fitz.Rect(0, A4.height - 150, A4.width, A4.height), color=None, fill=DEEP)
for k in range(0, 9):  # faint grid of dots
    for j in range(0, 12):
        p.draw_circle((360 + k * 26, 60 + j * 26), 1.1, color=None, fill=(0.12, 0.42, 0.33))
p.insert_text((64, 150), 'C O D E L E K H O', fontname=F_BOLD, fontsize=12, color=GOLD)
p.draw_rect(fitz.Rect(64, 160, 150, 163), color=None, fill=GOLD)
p.insert_text((64, 225), 'Cyber Security', fontname=F_HEAD, fontsize=46, color=IVORY)
p.insert_text((64, 262), 'The Complete Course Book', fontname=F_BODY, fontsize=20, color=(0.84, 0.9, 0.87))
p.insert_textbox(fitz.Rect(64, 290, 500, 360), 'From the CIA Triad to cloud security, SOC operations and a job-ready capstone. Fifteen modules with labs, diagrams, worked examples and self-checks.', fontname=F_BODY, fontsize=11.5, color=(0.78, 0.86, 0.82), lineheight=1.45)
y = 400
for n, t in enumerate(titles, 1):
    p.insert_text((64, y), f'{n:02d}', fontname=F_BOLD, fontsize=10.5, color=GOLD)
    p.insert_text((92, y), t, fontname=F_BODY, fontsize=10.5, color=IVORY)
    y += 18.5
p.insert_text((64, A4.height - 95), 'codelekho.com', fontname=F_BOLD, fontsize=13, color=IVORY)
p.insert_text((64, A4.height - 74), 'Professional Certificate course  ·  For education and authorized practice only', fontname=F_BODY, fontsize=9.5, color=(0.74, 0.82, 0.78))

# contents (one page)
FRONT = 2
c = book.new_page(width=A4.width, height=A4.height)
fonts(c)
c.draw_rect(fitz.Rect(0, 0, A4.width, 120), color=None, fill=FOREST)
c.insert_text((64, 80), 'Contents', fontname=F_HEAD, fontsize=30, color=IVORY)
y = 170
for n, (t, s) in enumerate(zip(titles, starts), 1):
    num = str(s + FRONT + 1)
    c.insert_text((64, y), f'Module {n:02d}', fontname=F_BOLD, fontsize=10.5, color=FOREST)
    c.insert_text((140, y), t, fontname=F_BODY, fontsize=11, color=INK)
    tw = fitz.get_text_length(t, fontname='helv', fontsize=11) * 1.02
    nw = fitz.get_text_length(num, fontname='helv', fontsize=11)
    c.draw_line((146 + tw, y - 3), (A4.width - 70 - nw, y - 3), color=(0.78, 0.8, 0.79), dashes='[1 3] 0', width=0.6)
    c.insert_text((A4.width - 64 - nw, y), num, fontname=F_BODY, fontsize=11, color=(0.3, 0.33, 0.32))
    y += 34
c.insert_text((64, A4.height - 60), 'Tip: the PDF bookmarks panel also lists every module.', fontname=F_BODY, fontsize=9, color=(0.45, 0.5, 0.48))

book.insert_pdf(body)
module_of_page = {}
for n, s in enumerate(starts, 1):
    end = starts[n] if n < len(starts) else len(body)
    for k in range(s, end):
        module_of_page[k] = n
for k in range(len(body)):
    pg = book[k + FRONT]
    fonts(pg)
    n = module_of_page[k]
    pg.draw_line((MARGIN_X, 44), (A4.width - MARGIN_X, 44), color=(0.85, 0.88, 0.86), width=0.6)
    pg.insert_text((MARGIN_X, 36), 'CodeLekho  ·  Cyber Security', fontname=F_BOLD, fontsize=8, color=FOREST)
    right = f'Module {n:02d}  ·  {titles[n - 1]}'
    pg.insert_text((A4.width - MARGIN_X - fitz.get_text_length(right, fontname='helv', fontsize=8), 36), right, fontname=F_BODY, fontsize=8, color=(0.42, 0.47, 0.45))
    pg.draw_line((MARGIN_X, A4.height - 40), (A4.width - MARGIN_X, A4.height - 40), color=(0.85, 0.88, 0.86), width=0.6)
    pg.insert_text((MARGIN_X, A4.height - 26), 'codelekho.com', fontname=F_BODY, fontsize=8, color=(0.42, 0.47, 0.45))
    num = str(k + FRONT + 1)
    pg.insert_text((A4.width - MARGIN_X - fitz.get_text_length(num, fontname='helv', fontsize=9), A4.height - 26), num, fontname=F_BOLD, fontsize=9, color=FOREST)

contents = book[1]
y = 170
for s in starts:
    contents.insert_link({'kind': fitz.LINK_GOTO, 'from': fitz.Rect(60, y - 14, A4.width - 60, y + 6), 'page': s + FRONT, 'zoom': 0})
    y += 34
book.set_toc([[1, 'Cover', 1], [1, 'Contents', 2]] + [[1, f'Module {n:02d}: {t}', s + FRONT + 1] for n, (t, s) in enumerate(zip(titles, starts), 1)])
book.set_metadata({'title': 'CodeLekho Cyber Security: The Complete Course Book', 'author': 'CodeLekho', 'subject': 'Cyber Security, 15 modules', 'creator': 'CodeLekho'})
book.save(OUT, garbage=4, deflate=True)
print(f'{len(book)} pages -> {OUT}')
