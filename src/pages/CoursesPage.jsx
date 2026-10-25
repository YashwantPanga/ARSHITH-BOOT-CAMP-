import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Lock, BookOpen } from 'lucide-react';
import { CourseTile } from '../components/CourseCard';
import { LaptopScene, ExamScene } from '../components/StudyScenes';
import { Reveal } from '../components/ui';

import { CATEGORIES } from '../data/meta';

export default function CoursesPage({ courses, enrolledCourseId, onSelectCourse, onEnrollCourse, initialSearch = '', initialCategory = 'All Categories', onHome }) {
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
    <div className="bg-ivory">
      {/* eduleb "section-top" banner */}
      <section className="relative overflow-hidden bg-cream border-b border-brand-900/10">
        {/* animated study scenes fill the banner's sides on wide screens */}
        <LaptopScene className="hidden xl:block absolute left-[2%] 2xl:left-[5%] bottom-0 w-[250px] 2xl:w-[330px] pointer-events-none" />
        <ExamScene className="hidden xl:block absolute right-[2%] 2xl:right-[5%] bottom-0 w-[250px] 2xl:w-[330px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 xl:pb-20 text-center">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Our services</p>
          <h1 className="mt-2 text-[34px] sm:text-[48px] font-bold leading-tight text-evergreen">Online courses for focused learners</h1>
          <p className="mt-3 text-charcoal/70 max-w-2xl mx-auto">Choose one course and master it. Every account can enroll in exactly one course.</p>
          <nav aria-label="Breadcrumb" className="mt-5 font-display text-[15.5px] text-evergreen">
            {onHome ? <button onClick={onHome} className="font-semibold text-sage hover:underline">Home</button> : <span className="font-semibold text-sage">Home</span>}
            <span className="mx-2 text-charcoal/40">/</span>Courses
          </nav>
          <div className="xl:hidden mt-6 flex justify-center gap-3 sm:gap-8" aria-hidden="true">
            <LaptopScene className="w-[46%] max-w-[230px]" />
            <ExamScene className="w-[46%] max-w-[230px]" />
          </div>
        </div>
      </section>

      {/* eduleb "home_course" section: toolbar, then the course grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-12 sm:pb-20">
        <div className="edu-card p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Python, SQL, web, AI…" className="w-full h-12 pl-11 pr-4 rounded-md text-charcoal bg-cream border border-brand-900/10 outline-none focus:bg-white focus:border-sage focus:ring-4 focus:ring-brand-100" />
              <Search className="w-5 h-5 text-charcoal/40 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none w-full lg:w-52 h-12 pl-11 pr-4 rounded-md bg-cream border border-brand-900/10 text-charcoal/80 outline-none focus:bg-white focus:border-sage focus:ring-4 focus:ring-brand-100">
                <option value="popular">Most popular</option>
                <option value="rating">Highest rated</option>
                <option value="title">A – Z</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 text-charcoal/40 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`font-display whitespace-nowrap rounded-full px-5 h-11 text-[14.5px] font-medium border transition ${category === c ? 'bg-forest text-ivory border-forest' : 'bg-white text-charcoal/75 border-brand-900/15 hover:border-sage hover:text-forest'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {enrolledCourseId && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-200 text-sm text-brand-900">
            <Lock className="w-4 h-4 mt-0.5 text-sage shrink-0" />
            <p>You are enrolled in <strong>{enrolledTitle || enrolledCourseId}</strong>. Other courses are locked for this login (one course per account).</p>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="edu-title text-[28px] sm:text-[34px] leading-tight">Join our <b>free certificate</b> courses</h2>
          <p className="flex items-center gap-2 text-[15px] text-charcoal/65"><BookOpen className="w-4 h-4 text-sage" />{list.length} course{list.length !== 1 ? 's' : ''} found</p>
        </div>

        {list.length === 0 ? (
          <div className="mt-8 edu-card p-12 text-center">
            <p className="font-display text-lg font-semibold text-evergreen">No courses match your search.</p>
            <button className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage mt-4 px-6 py-3" onClick={() => { setSearch(''); setCategory('All Categories'); }}>Clear filters</button>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {list.map((c, i) => (
              <Reveal key={c.id} delay={(i % 4) * 80} className="h-full">
                <CourseTile course={c} enrolledCourseId={enrolledCourseId} onSelect={onSelectCourse} onEnroll={onEnrollCourse} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
