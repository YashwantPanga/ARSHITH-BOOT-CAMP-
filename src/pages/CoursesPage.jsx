import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Lock } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { Triangles } from '../components/ui';
import { CATEGORIES } from '../data/meta';

export default function CoursesPage({ courses, enrolledCourseId, onSelectCourse, onEnrollCourse, initialSearch = '', initialCategory = 'All Categories' }) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(CATEGORIES.includes(initialCategory) ? initialCategory : 'All Categories');
  const [sort, setSort] = useState('popular');

  const enrolledTitle = courses.find(c => c.id === enrolledCourseId)?.title;

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = courses.filter(c =>
      (category === 'All Categories' || c.category === category) &&
      (!q || [c.title, c.description, c.category, c.level].join(' ').toLowerCase().includes(q))
    );
    if (sort === 'rating') out = [...out].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === 'title') out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'popular') out = [...out].sort((a, b) => (b.studentsNumeric || 0) - (a.studentsNumeric || 0));
    return out;
  }, [courses, search, category, sort]);

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Triangles />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach-400">Our services</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold">Online courses for focused learners</h1>
          <p className="mt-2 text-brand-100 max-w-2xl">Choose one course and master it. Every account can enroll in exactly one course.</p>

          <div className="mt-8 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Python, SQL, web, AI…" className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-slate-800 bg-white outline-none focus:ring-4 focus:ring-peach-300/40" />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none w-full md:w-52 pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-700 outline-none focus:ring-4 focus:ring-peach-300/40">
                <option value="popular">Most popular</option>
                <option value="rating">Highest rated</option>
                <option value="title">A – Z</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`chip whitespace-nowrap px-4 py-2 border transition ${category === c ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
              {c}
            </button>
          ))}
        </div>

        {enrolledCourseId && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-peach-50 border border-peach-200 text-sm text-brand-900">
            <Lock className="w-4 h-4 mt-0.5 text-peach-500 shrink-0" />
            <p>You are enrolled in <strong>{enrolledTitle || enrolledCourseId}</strong>. Other courses are locked for this login (one course per account).</p>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">{list.length} course{list.length !== 1 ? 's' : ''} found</p>

        {list.length === 0 ? (
          <div className="mt-6 card p-12 text-center">
            <p className="font-semibold text-brand-900">No courses match your search.</p>
            <button className="btn-outline mt-4" onClick={() => { setSearch(''); setCategory('All Categories'); }}>Clear filters</button>
          </div>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((c, i) => (
              <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CourseCard course={c} index={i} enrolledCourseId={enrolledCourseId} onSelect={onSelectCourse} onEnroll={onEnrollCourse} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
