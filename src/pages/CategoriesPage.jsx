import React from 'react';
import { Terminal, Code2, Database, Brain, ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal, PageTop } from '../components/ui';
import { categoryOf } from '../data/meta';

const META = {
  Python: { icon: Terminal, tone: 'bg-brand-900', text: 'Learn Python from first principles to object-oriented programming, files, web data and databases.' },
  SQL: { icon: Database, tone: 'bg-mint-400', text: 'Relational modeling, joins, window functions, indexing and transactions.' },
  'Web Development': { icon: Code2, tone: 'bg-peach-500', text: 'HTML, CSS, modern JavaScript, React, and Node/Express for REST APIs.' },
  'AI & Data Science': { icon: Brain, tone: 'bg-[#1E5141]', text: 'Data wrangling, statistics, machine learning and model evaluation.' },
  'Cyber Security': { icon: ShieldCheck, tone: 'bg-[#2C4A3F]', text: 'Networks, ethical hacking, SOC operations, forensics, cloud security and GRC.' }
};

export default function CategoriesPage({ courses = [], onCategorySelect, onHome }) {
  const categories = Object.keys(META);

  return (
    <div>
      <PageTop eyebrow="Categories" title="Explore by category" crumb="Categories" onHome={onHome}>
        <p className="mt-3 text-charcoal/70 max-w-xl mx-auto">Five categories. Pick the one that fits your goal.</p>
      </PageTop>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid sm:grid-cols-2 gap-6">
        {categories.map((cat, i) => {
          const m = META[cat];
          const count = courses.filter(c => categoryOf(c) === cat).length;
          return (
            <Reveal key={cat} delay={i * 80}>
              <button onClick={() => onCategorySelect(cat)} className="edu-card card-hover w-full text-left p-7 flex gap-5 items-start group">
                <span className={`w-14 h-14 rounded-2xl ${m.tone} text-white flex items-center justify-center shrink-0 shadow-lg [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]`}>
                  <m.icon className="w-6 h-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-semibold text-slate-400">Category 0{i + 1} · {count} course{count !== 1 ? 's' : ''}</span>
                  <span className="block mt-1 text-lg font-bold text-brand-900">{cat}</span>
                  <span className="block mt-1.5 text-sm text-slate-500 leading-relaxed">{m.text}</span>
                  <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-peach-500">
                    {count === 1 ? 'View course' : 'View courses'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
