// Combines the per-course enrichment files: { [courseId]: { [moduleId]: enrichment } }.
import py1 from './python-programming.part1.js';
import py2 from './python-programming.part2.js';
import py3 from './python-programming.part3.js';
import sql1 from './sql-mastery.part1.js';
import sql2 from './sql-mastery.part2.js';
import sql3 from './sql-mastery.part3.js';
import web1 from './web-development.part1.js';
import web2 from './web-development.part2.js';
import web3 from './web-development.part3.js';
import ai1 from './data-science-ai.part1.js';
import ai2 from './data-science-ai.part2.js';
import ai3 from './data-science-ai.part3.js';

const ENRICHMENT = {
  'python-programming': { ...py1, ...py2, ...py3 },
  'sql-mastery': { ...sql1, ...sql2, ...sql3 },
  'web-development': { ...web1, ...web2, ...web3 },
  'data-science-ai': { ...ai1, ...ai2, ...ai3 }
};

export default ENRICHMENT;
