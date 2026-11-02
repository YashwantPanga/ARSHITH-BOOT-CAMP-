import { describe, it, expect } from 'vitest';
import { parseBoards } from '../src/components/tutor/BoardPlayer.jsx';
import { parseAnswer } from '../src/components/tutor/tutorKit.jsx';

const LESSON = `[[BOARD why]]
## Why it matters
- Python opens data jobs.
> Everyone starts with print.
[[/BOARD]]
[[BOARD code]]
## First program
\`\`\`python
name = "CodeLekho"
print(name)
\`\`\`
@1 Stores the text in name.
@2 Shows it on the screen.
[[/BOARD]]
[[BOARD check]]
## Check yourself
[[CHECK]]
Q: What does print do?
A: It shows output on the screen.
[[/CHECK]]
[[/BOARD]]`;

describe('lesson boards', () => {
  it('reads every board, its points, code, line notes and check', () => {
    const b = parseBoards(LESSON);
    expect(b.map(x => [x.type, x.title, x.complete])).toEqual([['why', 'Why it matters', true], ['code', 'First program', true], ['check', 'Check yourself', true]]);
    expect(b[0].items).toEqual([{ kind: 'point', text: 'Python opens data jobs.' }, { kind: 'callout', text: 'Everyone starts with print.' }]);
    expect(b[1].code).toEqual(['name = "CodeLekho"', 'print(name)']);
    expect(b[1].notes).toEqual([{ line: 1, text: 'Stores the text in name.' }, { line: 2, text: 'Shows it on the screen.' }]);
    expect(b[2].check).toEqual({ q: 'What does print do?', a: 'It shows output on the screen.' });
  });

  it('shows a board that is still arriving, cut anywhere, without throwing', () => {
    for (let n = 0; n <= LESSON.length; n += 7) {
      const b = parseBoards(LESSON.slice(0, n));
      for (const x of b) expect(typeof x.title).toBe('string');
    }
    const half = parseBoards(LESSON.slice(0, LESSON.indexOf('@2')));
    expect(half.at(-1)).toMatchObject({ type: 'code', complete: false });
  });

  it('copes with unknown board types and text outside boards', () => {
    const b = parseBoards('stray text\n[[BOARD party]]\n## Hi\nplain line\n[[/BOARD]]');
    expect(b).toEqual([{ type: 'idea', title: 'Hi', items: [{ kind: 'point', text: 'plain line' }], code: null, notes: [], check: null, complete: true }]);
    expect(parseBoards('no boards at all')).toEqual([]);
  });

  it('the notes view reads boards as plain text, with check answers held back', () => {
    const { blocks, units } = parseAnswer(LESSON);
    expect(blocks.some(x => x.type === 'check')).toBe(true);
    expect(units.map(u => u.speak).join(' ')).not.toContain('[[BOARD');
    expect(units.find(u => u.speak === 'It shows output on the screen.').gate).toBeTruthy();
  });
});
