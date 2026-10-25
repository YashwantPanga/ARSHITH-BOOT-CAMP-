import React from 'react';
import { BookOpen, Users, FolderGit2, Award, PencilLine } from 'lucide-react';

/** Staff-only tool bar shown above a course page (loaded only for a confirmed admin session). */
export default function AdminCourseBar({ courseId, onOpen }) {
  const tools = [
    { section: 'courses', label: 'Edit course', icon: PencilLine },
    { section: 'content', label: 'Modules & content', icon: BookOpen },
    { section: 'students', label: 'Students', icon: Users },
    { section: 'projects', label: 'Submissions', icon: FolderGit2 },
    { section: 'certificates', label: 'Certificates', icon: Award }
  ];
  return (
    <div className="bg-evergreen text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#BCD1C6] mr-2">Admin · {courseId}</span>
        {tools.map(({ section, label, icon: Icon }) => (
          <button key={section} onClick={() => onOpen(section)} className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/10 hover:bg-white/20 text-[13px] font-medium transition-colors">
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
