// Reference URLs in the original module content that no longer resolve (found by
// `node scripts/validate-content.mjs --links`). The stored content is left unchanged; the reader
// shows the current location of the same resource instead.
export const LINK_OVERRIDES = {
  'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanisms/How_does_the_Internet_work':
    'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work',
  'https://www.py4e.com/html3/16-tasks': 'https://www.py4e.com/lessons/database'
};

export const resolveLink = (url) => LINK_OVERRIDES[url] || url;
