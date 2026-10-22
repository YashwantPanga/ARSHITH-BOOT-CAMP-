import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, BookOpen, Layers, HelpCircle, GraduationCap, 
  FolderCheck, Award, BarChart3, Settings, LogOut, Plus, Edit3, Trash2, 
  Copy, Eye, CheckCircle2, XCircle, AlertTriangle, Search, Filter, RefreshCw, 
  UserCheck, Shield, ChevronRight, ChevronLeft, Lock, Save, ExternalLink, Download, FileSpreadsheet, FileCheck,
  Check, X, AlertCircle, Clock, Calendar, CheckSquare, Sparkles, User, ArrowUpRight, Menu,
  ArrowUpDown, TrendingUp, Users, Github, Mail, Phone, Hash
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import AdminQuizManager from '../components/AdminQuizManager';
import AdminQuizAnalytics from '../components/AdminQuizAnalytics';

export default function AdminDashboard({ admin, onLogout, onCourseDataChanged }) {
  // Sidebar tab state: 'dashboard' | 'students' | 'progress' | 'projects' | 'certificates' | 'export' | 'courses' | 'content' | 'assessments' | 'settings'
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Database Data States
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [projectSubmissions, setProjectSubmissions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Student Search, Filter, Sort & Pagination States
  const [studentSearch, setStudentSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterProgress, setFilterProgress] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [filterCert, setFilterCert] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'email' | 'progress' | 'joinDate'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Student Profile Modal State
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  // Course Progress View Selection State
  const [selectedProgressCourseId, setSelectedProgressCourseId] = useState('');

  // Course Management Modals & State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [builderCourse, setBuilderCourse] = useState(null);

  // Module Modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  // Quiz Modal
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuizModule, setEditingQuizModule] = useState(null);

  // Project Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Certificate Generation Modal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCertStudent, setSelectedCertStudent] = useState('');
  const [selectedCertCourse, setSelectedCertCourse] = useState('');
  const [certGrade, setCertGrade] = useState('96% Distinction');
  const [forceCertOverride, setForceCertOverride] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, type: '', id: '', title: '' });

  // Notifications / Toast Feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load backend data from real database
  const refreshAllData = async () => {
    setLoadingData(true);
    try {
      const [anRes, crRes, stRes, prRes, ceRes, lgRes] = await Promise.all([
        api.getAnalytics(),
        api.getAdminCourses(),
        api.getStudents(),
        api.getProjectSubmissions(),
        api.getCertificates(),
        api.getActivityLogs()
      ]);

      if (anRes.success) setAnalytics(anRes.overview);
      if (crRes.success) {
        setCourses(crRes.courses);
        if (onCourseDataChanged) onCourseDataChanged(crRes.courses);
      }
      if (stRes.success) setStudents(stRes.students);
      if (prRes.success) setProjectSubmissions(prRes.submissions);
      if (ceRes.success) setCertificates(ceRes.certificates);
      if (lgRes.success) setActivityLogs(lgRes.logs);
    } catch (err) {
      showToast(err.message || 'Failed to load backend data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter (name, email, id)
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchesName = String(student.name || '').toLowerCase().includes(q);
        const matchesEmail = String(student.email || '').toLowerCase().includes(q);
        const matchesId = String(student.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesId) return false;
      }

      // Course filter
      if (filterCourse !== 'All') {
        const enrolled = student.enrolledCourses || [];
        const inCourse = enrolled.includes(filterCourse) || 
          student.primaryCourse === filterCourse ||
          (student.enrolledCourseDetails || []).some(cd => cd.courseId === filterCourse || cd.courseTitle === filterCourse);
        if (!inCourse) return false;
      }

      // Progress filter: Not Started (0%), In Progress (1-99%), Completed (100%)
      if (filterProgress !== 'All') {
        const prog = student.progress || 0;
        if (filterProgress === 'Not Started' && prog > 0) return false;
        if (filterProgress === 'In Progress' && (prog === 0 || prog === 100)) return false;
        if (filterProgress === 'Completed' && prog < 100) return false;
      }

      // Project Status filter
      if (filterProject !== 'All') {
        if (student.projectStatus !== filterProject) return false;
      }

      // Certificate Status filter
      if (filterCert !== 'All') {
        if (student.certificateStatus !== filterCert) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = String(a.name || '').localeCompare(String(b.name || ''));
      } else if (sortBy === 'email') {
        comparison = String(a.email || '').localeCompare(String(b.email || ''));
      } else if (sortBy === 'progress') {
        comparison = (a.progress || 0) - (b.progress || 0);
      } else if (sortBy === 'joinDate') {
        comparison = new Date(a.joinDate || 0) - new Date(b.joinDate || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [students, studentSearch, filterCourse, filterProgress, filterProject, filterCert, sortBy, sortOrder]);

  // Pagination slice
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  // Export to Excel function (.xlsx)
  const handleExportToExcel = (dataToExport) => {
    const targetList = dataToExport || filteredStudents;
    if (targetList.length === 0) {
      showToast('No student records found to export.', 'error');
      return;
    }

    const rows = [];
    targetList.forEach(s => {
      const courseDetails = s.enrolledCourseDetails || [];
      if (courseDetails.length === 0) {
        rows.push({
          'Student ID': s.id || 'N/A',
          'Student Name': s.name || 'N/A',
          'Email Address': s.email || 'N/A',
          'Enrollment Date': s.joinDate || 'N/A',
          'Course Name': 'None',
          'Completion Percentage': '0%',
          'Completed Modules': 0,
          'Total Modules': 0,
          'Project Name': 'None',
          'GitHub Repository URL': 'N/A',
          'Project Submission Date': 'N/A',
          'Project Review Status': 'Not Submitted',
          'Admin Feedback': '',
          'Certificate Status': 'Not Earned',
          'Certificate Issue Date': 'N/A'
        });
        return;
      }

      courseDetails.forEach(cd => {
        const subs = cd.projectSubmissions || [];
        if (subs.length === 0) {
          rows.push({
            'Student ID': s.id || 'N/A',
            'Student Name': s.name || 'N/A',
            'Email Address': s.email || 'N/A',
            'Enrollment Date': s.joinDate || 'N/A',
            'Course Name': cd.courseTitle || 'N/A',
            'Completion Percentage': `${cd.progress}%`,
            'Completed Modules': cd.completedModulesCount,
            'Total Modules': cd.totalModules,
            'Project Name': 'None',
            'GitHub Repository URL': 'N/A',
            'Project Submission Date': 'N/A',
            'Project Review Status': cd.projectStatus || 'Not Submitted',
            'Admin Feedback': '',
            'Certificate Status': cd.certificateStatus,
            'Certificate Issue Date': cd.certificateIssueDate ? new Date(cd.certificateIssueDate).toLocaleDateString() : 'N/A'
          });
        } else {
          subs.forEach(sub => {
            rows.push({
              'Student ID': s.id || 'N/A',
              'Student Name': s.name || 'N/A',
              'Email Address': s.email || 'N/A',
              'Enrollment Date': s.joinDate || 'N/A',
              'Course Name': cd.courseTitle || 'N/A',
              'Completion Percentage': `${cd.progress}%`,
              'Completed Modules': cd.completedModulesCount,
              'Total Modules': cd.totalModules,
              'Project Name': sub.projectTitle || sub.projectId || 'Course Project',
              'GitHub Repository URL': sub.githubUrl || 'N/A',
              'Project Submission Date': sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A',
              'Project Review Status': sub.status || 'Submitted',
              'Admin Feedback': sub.feedback || '',
              'Certificate Status': cd.certificateStatus,
              'Certificate Issue Date': cd.certificateIssueDate ? new Date(cd.certificateIssueDate).toLocaleDateString() : 'N/A'
            });
          });
        }
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws['!cols'] = [
      { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 15 }, { wch: 26 },
      { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 30 }, { wch: 45 },
      { wch: 22 }, { wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Arshith_Bootcamp_Students_${dateStr}.xlsx`);
    showToast(`Exported ${rows.length} records to Excel`);
  };

  // Handlers for Course Management
  const handleSaveCourseSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const coursePayload = {
      title: formData.get('title'),
      category: formData.get('category'),
      level: formData.get('level'),
      duration: formData.get('duration'),
      price: Number(formData.get('price')),
      isFree: formData.get('isFree') === 'true',
      status: formData.get('status'),
      featured: formData.get('featured') === 'true',
      shortDescription: formData.get('shortDescription'),
      description: formData.get('description'),
      prerequisites: formData.get('prerequisites'),
      skills: formData.get('skills') ? formData.get('skills').split(',').map(s => s.trim()) : []
    };

    try {
      if (editingCourse) {
        const res = await api.updateCourse(editingCourse.id, coursePayload);
        showToast(res.message || 'Course updated successfully');
      } else {
        const res = await api.createCourse(coursePayload);
        showToast(res.message || 'New course published successfully');
      }
      setCourseModalOpen(false);
      setEditingCourse(null);
      refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to save course', 'error');
    }
  };

  const handleDuplicateCourse = async (id) => {
    try {
      const res = await api.duplicateCourse(id);
      showToast(res.message || 'Course duplicated');
      refreshAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal.open) return;
    try {
      if (deleteConfirmModal.type === 'course') {
        await api.deleteCourse(deleteConfirmModal.id, false);
        showToast('Course permanently deleted');
      } else if (deleteConfirmModal.type === 'archive-course') {
        await api.deleteCourse(deleteConfirmModal.id, true);
        showToast('Course archived successfully');
      } else if (deleteConfirmModal.type === 'module') {
        await api.deleteModule(builderCourse.id, deleteConfirmModal.id);
        showToast('Module deleted');
      } else if (deleteConfirmModal.type === 'certificate') {
        await api.revokeCertificate(deleteConfirmModal.id);
        showToast('Certificate revoked');
      }
      setDeleteConfirmModal({ open: false, type: '', id: '', title: '' });
      refreshAllData();
      if (builderCourse) {
        const updated = await api.getPublicCourse(builderCourse.id);
        if (updated.success) setBuilderCourse(updated.course);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Module Submit
  const handleSaveModuleSubmit = async (e) => {
    e.preventDefault();
    if (!builderCourse) return;
    const formData = new FormData(e.target);
    const modPayload = {
      title: formData.get('title'),
      description: formData.get('description'),
      published: formData.get('published') === 'true'
    };

    try {
      if (editingModule) {
        await api.updateModule(builderCourse.id, editingModule.id, modPayload);
        showToast('Module updated successfully');
      } else {
        await api.addModule(builderCourse.id, modPayload);
        showToast('Module added to course');
      }
      setModuleModalOpen(false);
      setEditingModule(null);
      const res = await api.getPublicCourse(builderCourse.id);
      if (res.success) setBuilderCourse(res.course);
      refreshAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Review Project Submit
  const handleReviewProjectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    const formData = new FormData(e.target);
    const status = formData.get('status');
    const score = formData.get('score');
    const feedback = formData.get('feedback');

    try {
      await api.reviewProjectSubmission(selectedSubmission.id, status, score, feedback);
      showToast(`Project submission updated to ${status}`);
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      refreshAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Certificate Generate Submit
  const handleGenerateCertificateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCertStudent || !selectedCertCourse) {
      showToast('Select student and course.', 'error');
      return;
    }

    try {
      const res = await api.generateCertificate(selectedCertStudent, selectedCertCourse, certGrade, forceCertOverride);
      showToast(res.message || 'Certificate generated successfully!');
      setCertModalOpen(false);
      refreshAllData();
    } catch (err) {
      showToast(err.message || 'Unable to generate certificate.', 'error');
    }
  };

  // Password Change Handler
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword, confirmPassword);
      showToast(res.message || 'Password changed successfully');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Helper status color classes
  const getProgressColor = (pct) => {
    if (pct === 100) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-teal-500';
    if (pct > 0) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const getProjectStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'Under Review':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'Needs Revision':
      case 'Resubmission Required':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-200">Needs Revision</span>;
      case 'Submitted':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-rose-100 text-rose-800">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase bg-slate-100 text-slate-500">Not Submitted</span>;
    }
  };

  const getCertStatusBadge = (status, certId) => {
    if (status === 'Earned') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200" title={certId || ''}>
          <Award className="w-3 h-3 text-emerald-600" />
          <span>Earned</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase bg-slate-100 text-slate-500">
        Not Earned
      </span>
    );
  };

  // Sidebar navigation menu items matching specifications
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: students.length },
    { id: 'progress', label: 'Course Progress', icon: BarChart3 },
    { id: 'projects', label: 'Project Submissions', icon: FolderCheck, badge: projectSubmissions.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length },
    { id: 'certificates', label: 'Certificates', icon: Award, badge: certificates.length },
    { id: 'export', label: 'Export Reports', icon: FileSpreadsheet },
    { id: 'courses', label: 'Course Catalog', icon: BookOpen, badge: courses.length },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAFDFB] font-sans flex flex-col md:flex-row text-slate-900">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border-2 flex items-center gap-3 text-xs font-bold animate-bounce ${
          toast.type === 'error' 
            ? 'bg-rose-50 border-rose-300 text-rose-800' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden bg-brand-900 text-white px-4 py-3 border-b-2 border-brand-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="font-black text-sm">Arshith Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-200 hover:bg-brand-800 rounded-xl"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-900 text-slate-300 flex flex-col border-r-4 border-brand-800 transform transition-transform duration-200 md:static md:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Brand Header */}
        <div className="p-6 border-b border-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-800 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Arshith <span className="text-emerald-400">Admin</span>
              </h2>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block -mt-0.5">
                Portal Console
              </span>
            </div>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Administrator Profile Card */}
        <div className="px-6 py-4 bg-brand-950/60 border-b border-brand-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-700 text-white font-black flex items-center justify-center text-xs border border-brand-600">
            {admin?.name ? admin.name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-white truncate">{admin?.name || 'Admin User'}</p>
            <p className="text-[10px] font-extrabold text-emerald-400 tracking-wider uppercase truncate">
              ID: {admin?.adminId || 'ARB-ADMIN-001'}
            </p>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setBuilderCourse(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-brand-950 font-black shadow-md border-2 border-emerald-400 scale-[1.02]'
                    : 'text-slate-300 hover:bg-brand-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-brand-900 text-emerald-300' : 'bg-brand-800 text-emerald-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Footer Button */}
        <div className="p-4 border-t border-brand-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/80 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>

      </aside>

      {/* Main Admin Portal Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl dark-bezel shadow-sm">
          <div>
            <span className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-brand-200 inline-block mb-1">
              Real Database Backend Synchronized
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {builderCourse ? `Course Content Builder — ${builderCourse.title}` : 
                activeSection === 'dashboard' ? 'Admin Overview Dashboard' :
                activeSection === 'students' ? 'Student Management & Records' :
                activeSection === 'progress' ? 'Course Completion & Progress' :
                activeSection === 'projects' ? 'GitHub Project Submission Reviews' :
                activeSection === 'certificates' ? 'Certificate Management & Verification' :
                activeSection === 'export' ? 'Student Data Export Center' :
                activeSection === 'courses' ? 'Course Catalog Management' :
                'Admin Account Security'}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              onClick={refreshAllData}
              className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
              title="Refresh Real Application Data"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${loadingData ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Export to Excel Button visible everywhere */}
            <button
              onClick={() => handleExportToExcel()}
              className="px-4 py-2.5 text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full border-2 border-emerald-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              title="Export Current Student Data to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel</span>
            </button>

            {activeSection === 'courses' && !builderCourse && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseModalOpen(true);
                }}
                className="px-5 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-full border-2 border-brand-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Course</span>
              </button>
            )}

            {activeSection === 'certificates' && (
              <button
                onClick={() => setCertModalOpen(true)}
                className="px-5 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-full border-2 border-brand-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Generate Certificate</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: DASHBOARD OVERVIEW */}
        {/* ============================================================== */}
        {activeSection === 'dashboard' && !builderCourse && (
          <div className="space-y-8">
            
            {/* The 5 Required Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* 1. Total Registered Students */}
              <div className="bg-white p-5 rounded-3xl dark-bezel flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border-2 border-brand-200 text-brand-700 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Registered Students</p>
                  <p className="text-2xl font-black text-slate-900">{analytics?.totalStudents || students.length}</p>
                  <span className="text-[10px] font-extrabold text-emerald-600">Database Verified</span>
                </div>
              </div>

              {/* 2. Active Students */}
              <div className="bg-white p-5 rounded-3xl dark-bezel flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Students</p>
                  <p className="text-2xl font-black text-slate-900">{analytics?.activeStudents || students.filter(s => s.status === 'active').length}</p>
                  <span className="text-[10px] font-extrabold text-emerald-600">Currently Enrolled</span>
                </div>
              </div>

              {/* 3. Course Completions */}
              <div className="bg-white p-5 rounded-3xl dark-bezel flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-teal-200 text-teal-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Course Completions</p>
                  <p className="text-2xl font-black text-slate-900">{analytics?.courseCompletions || 0}</p>
                  <span className="text-[10px] font-extrabold text-teal-600">Passed Quizzes & Final</span>
                </div>
              </div>

              {/* 4. Projects Submitted */}
              <div className="bg-white p-5 rounded-3xl dark-bezel flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <FolderCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Projects Submitted</p>
                  <p className="text-2xl font-black text-slate-900">{analytics?.projectsSubmitted || projectSubmissions.length}</p>
                  <span className="text-[10px] font-extrabold text-amber-600">GitHub Repos</span>
                </div>
              </div>

              {/* 5. Certificates Earned */}
              <div className="bg-white p-5 rounded-3xl dark-bezel flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border-2 border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Certificates Earned</p>
                  <p className="text-2xl font-black text-slate-900">{analytics?.certificatesEarned || certificates.filter(c => c.status === 'active').length}</p>
                  <span className="text-[10px] font-extrabold text-purple-600">QR Code Verified</span>
                </div>
              </div>

            </div>

            {/* Quick Overview Table Snapshots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Student Roster Snapshot */}
              <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Registered Students Overview</h3>
                  <button onClick={() => setActiveSection('students')} className="text-xs font-bold text-brand-700 hover:underline">View All Students →</button>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-bold">
                  {students.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No registered students yet.</p>
                  ) : (
                    students.slice(0, 4).map(st => (
                      <div key={st.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 font-black flex items-center justify-center text-xs">
                            {st.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{st.name}</p>
                            <span className="text-[10px] text-slate-400">{st.email} • {st.primaryCourse}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-700">{st.progress || 0}%</span>
                          <button
                            onClick={() => setSelectedStudentDetail(st)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Project Submissions Snapshot */}
              <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Recent Project Submissions</h3>
                  <button onClick={() => setActiveSection('projects')} className="text-xs font-bold text-brand-700 hover:underline">View Review Queue →</button>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-bold">
                  {projectSubmissions.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No project submissions yet.</p>
                  ) : (
                    projectSubmissions.slice(0, 4).map(sub => (
                      <div key={sub.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{sub.projectTitle}</p>
                          <span className="text-[10px] text-slate-400">{sub.studentName} • {sub.courseTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getProjectStatusBadge(sub.status)}
                          <button
                            onClick={() => { setSelectedSubmission(sub); setReviewModalOpen(true); }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-brand-900 text-white rounded-lg hover:bg-brand-800"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: STUDENTS OVERVIEW TABLE */}
        {/* ============================================================== */}
        {activeSection === 'students' && (
          <div className="bg-white rounded-3xl dark-bezel p-6 space-y-6">
            
            {/* Header with Title and Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Students Directory ({filteredStudents.length} of {students.length})</h2>
                <p className="text-xs font-semibold text-slate-500">Live database student accounts, progress tracking, and submissions</p>
              </div>
              <button
                onClick={() => handleExportToExcel(filteredStudents)}
                className="px-4 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export to Excel (.xlsx)</span>
              </button>
            </div>

            {/* Filters Bar: Search, Course, Progress, Project, Certificate, Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              
              {/* Search by Name or Email */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name or email..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-900"
                />
              </div>

              {/* Filter by Course */}
              <div>
                <select
                  value={filterCourse}
                  onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="All">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Progress */}
              <div>
                <select
                  value={filterProgress}
                  onChange={(e) => { setFilterProgress(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="All">All Progress</option>
                  <option value="Not Started">Not Started (0%)</option>
                  <option value="In Progress">In Progress (1-99%)</option>
                  <option value="Completed">Completed (100%)</option>
                </select>
              </div>

              {/* Filter by Project Status */}
              <div>
                <select
                  value={filterProject}
                  onChange={(e) => { setFilterProject(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="All">All Projects</option>
                  <option value="Not Submitted">Not Submitted</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Needs Revision">Needs Revision</option>
                </select>
              </div>

              {/* Filter by Certificate Status */}
              <div>
                <select
                  value={filterCert}
                  onChange={(e) => { setFilterCert(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="All">All Certificates</option>
                  <option value="Earned">Earned</option>
                  <option value="Not Earned">Not Earned</option>
                </select>
              </div>

            </div>

            {/* Sort Controls Bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-bold gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700 outline-none"
                >
                  <option value="name">Student Name</option>
                  <option value="email">Email Address</option>
                  <option value="progress">Course Progress</option>
                  <option value="joinDate">Enrollment Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 text-slate-700"
                  title="Toggle Ascending / Descending"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>

              {(studentSearch || filterCourse !== 'All' || filterProgress !== 'All' || filterProject !== 'All' || filterCert !== 'All') && (
                <button
                  onClick={() => {
                    setStudentSearch('');
                    setFilterCourse('All');
                    setFilterProgress('All');
                    setFilterProject('All');
                    setFilterCert('All');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            {/* Student Overview Table with Exact Columns:
                | Student Name | Email ID | Enrolled Course | Progress | Project Status | Certificate Status | Action | */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/60">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email ID</th>
                    <th className="py-3 px-4">Enrolled Course</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Project Status</th>
                    <th className="py-3 px-4">Certificate Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No students found matching your search or filters.</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching with a different keyword.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => {
                      const prog = student.progress || 0;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Student Name */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 font-black flex items-center justify-center text-xs shrink-0 border border-brand-200">
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="font-black text-slate-900">{student.name}</p>
                                <span className="text-[10px] font-mono text-slate-400">{student.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Email ID */}
                          <td className="py-4 px-4 text-slate-600 font-medium font-mono text-[11px]">
                            {student.email}
                          </td>

                          {/* Enrolled Course */}
                          <td className="py-4 px-4 text-slate-800">
                            <p className="font-bold line-clamp-1">{student.primaryCourse}</p>
                            {student.enrolledCourses?.length > 1 && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                +{student.enrolledCourses.length - 1} more course(s)
                              </span>
                            )}
                          </td>

                          {/* Progress */}
                          <td className="py-4 px-4">
                            <div className="w-32 space-y-1">
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                <div className={`h-full transition-all duration-300 ${getProgressColor(prog)}`} style={{ width: `${prog}%` }}></div>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-black text-slate-700">{prog}%</span>
                                <span className={`font-semibold ${prog === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {student.completedModulesCount || 0}/{student.totalModules || 0} mods
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Project Status */}
                          <td className="py-4 px-4">
                            {getProjectStatusBadge(student.projectStatus)}
                          </td>

                          {/* Certificate Status */}
                          <td className="py-4 px-4">
                            {getCertStatusBadge(student.certificateStatus, student.certificateId)}
                          </td>

                          {/* Action */}
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedStudentDetail(student)}
                              className="px-3 py-1.5 text-xs font-black text-brand-900 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-700" />
                              <span>View Details</span>
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-bold">
                <div className="flex items-center gap-2">
                  <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="ml-2 px-2 py-1 bg-slate-100 rounded-lg text-slate-700 outline-none"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 bg-slate-50 border rounded-lg font-mono text-slate-800">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: COURSE PROGRESS BREAKDOWN */}
        {/* ============================================================== */}
        {activeSection === 'progress' && (
          <div className="space-y-6">
            
            {/* Course Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {courses.map(course => {
                const enrolled = students.filter(s => (s.enrolledCourses || []).includes(course.id));
                const completed = enrolled.filter(s => s.progress === 100 || (s.enrolledCourseDetails || []).some(cd => cd.courseId === course.id && cd.progress === 100));
                const completionRate = enrolled.length > 0 ? Math.round((completed.length / enrolled.length) * 100) : 0;
                const isSelected = selectedProgressCourseId === course.id;

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedProgressCourseId(course.id)}
                    className={`bg-white p-5 rounded-3xl dark-bezel cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-brand-900 shadow-md scale-[1.02]' : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-brand-50 text-brand-700">
                        {course.category}
                      </span>
                      <span className="text-xs font-black text-slate-900">{completionRate}% Completed</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 line-clamp-1">{course.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{course.modules?.length || 0} Modules • {enrolled.length} Enrolled</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
                      <div className="bg-brand-600 h-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Students Enrolled in Selected Course */}
            <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedProgressCourseId ? `Students in: ${courses.find(c => c.id === selectedProgressCourseId)?.title || selectedProgressCourseId}` : 'All Enrolled Course Progress'}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">Live module passing scores, quiz attempts, and final exam status</span>
                </div>
                {selectedProgressCourseId && (
                  <button onClick={() => setSelectedProgressCourseId('')} className="text-xs font-bold text-brand-700 hover:underline">
                    Show All Courses
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Enrolled Course</th>
                      <th className="py-3 px-4">Modules Passed</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Final Exam</th>
                      <th className="py-3 px-4">Certificate</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    {students.filter(s => !selectedProgressCourseId || (s.enrolledCourses || []).includes(selectedProgressCourseId)).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-700">No enrolled students in this course yet.</p>
                        </td>
                      </tr>
                    ) : (
                      students
                        .filter(s => !selectedProgressCourseId || (s.enrolledCourses || []).includes(selectedProgressCourseId))
                        .map(student => {
                          const targetDetail = (student.enrolledCourseDetails || []).find(cd => !selectedProgressCourseId || cd.courseId === selectedProgressCourseId) || student;
                          const prog = targetDetail.progress || 0;
                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4">
                                <p className="font-black text-slate-900">{student.name}</p>
                                <span className="text-[10px] text-slate-400">{student.email}</span>
                              </td>
                              <td className="py-4 px-4 text-slate-700">
                                {targetDetail.courseTitle || student.primaryCourse}
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700 text-[11px] font-extrabold">
                                  {targetDetail.completedModulesCount || 0} / {targetDetail.totalModules || 0}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="w-28 space-y-1">
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className={`h-full ${getProgressColor(prog)}`} style={{ width: `${prog}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-bold">{prog}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {targetDetail.passedFinal ? (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Passed ({targetDetail.finalScore || '92'}%)
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {getCertStatusBadge(targetDetail.certificateStatus, targetDetail.certificateId)}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => setSelectedStudentDetail(student)}
                                  className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: GITHUB PROJECT SUBMISSION REVIEWS */}
        {/* ============================================================== */}
        {activeSection === 'projects' && (
          <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Project Submissions ({projectSubmissions.length})</h2>
                <span className="text-xs font-semibold text-slate-500">Student GitHub repository capstone submissions review queue</span>
              </div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {projectSubmissions.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length} Pending Review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/60">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course & Project</th>
                    <th className="py-3 px-4">GitHub Repository</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Review Status</th>
                    <th className="py-3 px-4">Admin Feedback</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {projectSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FolderCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No project submissions available.</p>
                      </td>
                    </tr>
                  ) : (
                    projectSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Student */}
                        <td className="py-4 px-4">
                          <p className="font-black text-slate-900">{sub.studentName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{sub.studentEmail || sub.userId}</span>
                        </td>

                        {/* Course & Project */}
                        <td className="py-4 px-4">
                          <p className="text-slate-900 font-bold">{sub.projectTitle}</p>
                          <span className="text-[10px] text-slate-400">{sub.courseTitle}</span>
                        </td>

                        {/* Clickable GitHub Repository URL */}
                        <td className="py-4 px-4">
                          {sub.githubUrl ? (
                            <a
                              href={sub.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-900 font-mono text-[11px] transition-colors group"
                              title="Open GitHub Repository in new tab"
                            >
                              <Github className="w-3.5 h-3.5 text-slate-700" />
                              <span className="truncate max-w-[200px]">{sub.githubUrl.replace('https://github.com/', '')}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
                            </a>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>

                        {/* Submitted Date */}
                        <td className="py-4 px-4 text-slate-600 font-medium text-[11px]">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Review Status */}
                        <td className="py-4 px-4">
                          {getProjectStatusBadge(sub.status)}
                        </td>

                        {/* Feedback */}
                        <td className="py-4 px-4 text-slate-500 font-medium max-w-[200px] truncate" title={sub.feedback || ''}>
                          {sub.feedback || <span className="text-slate-300 italic">No feedback yet</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setReviewModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            Review / Grade
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 5: CERTIFICATE MANAGEMENT */}
        {/* ============================================================== */}
        {activeSection === 'certificates' && (
          <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Issued Certificates ({certificates.length})</h2>
                <span className="text-xs font-semibold text-slate-500">Tamper-proof verifiable credentials with public QR codes</span>
              </div>
              <button
                onClick={() => setCertModalOpen(true)}
                className="px-4 py-2 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Issue Certificate</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/60">
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Grade / Score</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                        <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No certificates issued yet.</p>
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-mono text-[11px] text-brand-900 font-extrabold">{cert.certificateId || cert.id}</td>
                        <td className="py-4 px-4 font-black text-slate-900">{cert.studentName}</td>
                        <td className="py-4 px-4 text-slate-700">{cert.courseTitle}</td>
                        <td className="py-4 px-4 font-extrabold text-emerald-700">{cert.grade || 'Passed'}</td>
                        <td className="py-4 px-4 text-slate-500 font-medium">{cert.issueDate || new Date(cert.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${
                            cert.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <a
                            href={`/verify/${cert.certificateId || cert.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 6: EXPORT REPORTS CENTER */}
        {/* ============================================================== */}
        {activeSection === 'export' && (
          <div className="bg-white rounded-3xl dark-bezel p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">Export Student Data to Excel</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Generate standardized .xlsx workbooks compatible with Microsoft Excel and Google Sheets
                </p>
              </div>
              <button
                onClick={() => handleExportToExcel(filteredStudents)}
                className="px-6 py-3 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-2xl shadow-lg transition-all flex items-center gap-2.5 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-4.5 h-4.5" />
                <span>Download Excel File (.xlsx)</span>
              </button>
            </div>

            {/* Included Columns Description Box */}
            <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-700" />
                <span>15 Standardized Export Columns Included:</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px] font-bold text-slate-700">
                <div className="p-2 bg-white rounded-xl border border-brand-100">1. Student ID</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">2. Student Name</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">3. Email Address</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">4. Enrollment Date</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">5. Course Name</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">6. Completion %</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">7. Completed Modules</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">8. Total Modules</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">9. Project Name</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">10. GitHub Repo URL</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">11. Submission Date</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">12. Review Status</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">13. Admin Feedback</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">14. Certificate Status</div>
                <div className="p-2 bg-white rounded-xl border border-brand-100">15. Issue Date</div>
              </div>
            </div>

            {/* Quick Export Filters */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Export Filter Parameters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Course</label>
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="All">All Courses ({students.length} students)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter by Progress</label>
                  <select
                    value={filterProgress}
                    onChange={(e) => setFilterProgress(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="All">All Progress States</option>
                    <option value="Not Started">Not Started (0%)</option>
                    <option value="In Progress">In Progress (1-99%)</option>
                    <option value="Completed">Completed (100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Project Status</label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="All">All Projects</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Needs Revision">Needs Revision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Certificate Status</label>
                  <select
                    value={filterCert}
                    onChange={(e) => setFilterCert(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="All">All Certificates</option>
                    <option value="Earned">Earned Only</option>
                    <option value="Not Earned">Not Earned Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Records Count and Direct Download */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Ready to export: <strong className="text-brand-900">{filteredStudents.length} student records</strong> matching selected criteria
              </span>
              <button
                onClick={() => handleExportToExcel(filteredStudents)}
                className="px-5 py-2 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export ({filteredStudents.length}) Records Now</span>
              </button>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 7: COURSE CATALOG (ORIGINAL FEATURE PRESERVED) */}
        {/* ============================================================== */}
        {activeSection === 'courses' && (
          <div className="bg-white rounded-3xl dark-bezel p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Bootcamp Courses ({courses.length})</h2>
              <button
                onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }}
                className="px-4 py-2 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase bg-brand-50 text-brand-700">
                      {course.category}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {course.modules?.length || 0} Modules
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{course.description || course.shortDescription}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => { setEditingCourse(course); setCourseModalOpen(true); }}
                      className="px-3 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicateCourse(course.id)}
                      className="px-3 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 8: ADMIN SETTINGS & SECURITY */}
        {/* ============================================================== */}
        {activeSection === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl dark-bezel p-8 space-y-6">
            <h2 className="text-xl font-black text-slate-900 pb-4 border-b border-slate-100">
              Admin Profile & Password Security
            </h2>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl border-2 border-brand-800 cursor-pointer"
              >
                Update Admin Password
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* STUDENT DETAILS MODAL (SPECIFICATION REQUIREMENT 4) */}
      {/* ============================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 dark-bezel relative max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Student Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-brand-900 text-emerald-400 font-black flex items-center justify-center text-xl shrink-0 shadow-md">
                {selectedStudentDetail.name?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{selectedStudentDetail.name}</h2>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                    selectedStudentDetail.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedStudentDetail.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedStudentDetail.email}</p>
                <p className="text-[11px] font-mono font-bold text-brand-700 mt-0.5">ID: {selectedStudentDetail.id}</p>
              </div>
            </div>

            {/* Profile Overview Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Registration No</span>
                <span className="font-extrabold text-slate-800">{selectedStudentDetail.regNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Phone</span>
                <span className="font-extrabold text-slate-800">{selectedStudentDetail.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Enrollment Date</span>
                <span className="font-extrabold text-slate-800">{selectedStudentDetail.joinDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Last Activity</span>
                <span className="font-extrabold text-slate-800">{selectedStudentDetail.lastActivity ? new Date(selectedStudentDetail.lastActivity).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            {/* Enrolled Course & Progress Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-700" />
                <span>Enrolled Course Progress</span>
              </h3>

              {(selectedStudentDetail.enrolledCourseDetails || []).map((cd) => (
                <div key={cd.courseId} className="p-5 rounded-2xl border-2 border-slate-100 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{cd.courseTitle}</h4>
                      <span className="text-[11px] font-semibold text-slate-400">{cd.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">{cd.progress}%</span>
                      <span className="text-[11px] text-slate-400 block">{cd.completedModulesCount} of {cd.totalModules} Modules Passed</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                    <div className={`h-full transition-all ${getProgressColor(cd.progress)}`} style={{ width: `${cd.progress}%` }}></div>
                  </div>

                  {/* Completed Modules List */}
                  {cd.completedModules && cd.completedModules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed Modules & Quizzes ({cd.completedModules.length}):</span>
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {cd.completedModules.map(m => (
                          <div key={m.id} className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="truncate max-w-[400px]">{m.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200/80 text-emerald-900 shrink-0">
                              Score: {m.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Modules List */}
                  {cd.pendingModules && cd.pendingModules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pending Modules ({cd.pendingModules.length}):</span>
                      </p>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {cd.pendingModules.map(m => (
                          <div key={m.id} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
                            <span className="truncate">{m.title}</span>
                            <span className="text-[10px] text-slate-400">Not Completed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Exam Status */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span>Final Assessment Status:</span>
                    {cd.passedFinal ? (
                      <span className="px-2.5 py-1 text-[11px] font-black rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Passed ({cd.finalScore || '92'}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Not yet passed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* GitHub Project Submissions Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Github className="w-4 h-4 text-brand-700" />
                <span>GitHub Capstone & Mini Projects</span>
              </h3>

              {selectedStudentDetail.projectSubmissions && selectedStudentDetail.projectSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudentDetail.projectSubmissions.map(sub => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{sub.projectTitle || sub.projectId}</span>
                        {getProjectStatusBadge(sub.status)}
                      </div>
                      
                      {/* Clickable GitHub Repo Link */}
                      {sub.githubUrl ? (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] font-bold text-slate-500">Repository:</span>
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-900 font-mono font-bold underline"
                          >
                            <span>{sub.githubUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No URL provided</span>
                      )}

                      {sub.submittedAt && (
                        <p className="text-[10px] text-slate-400">
                          Submitted on: {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      )}

                      {sub.feedback && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 mt-2">
                          <span className="font-black text-[10px] uppercase text-slate-400 block mb-0.5">Admin Feedback</span>
                          <p className="text-xs">{sub.feedback}</p>
                        </div>
                      )}

                      <button
                        onClick={() => { setSelectedSubmission(sub); setReviewModalOpen(true); }}
                        className="mt-2 px-3 py-1 bg-brand-900 text-white rounded-lg text-xs font-bold hover:bg-brand-800"
                      >
                        Review This Project
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  <p className="font-bold">No GitHub projects submitted yet.</p>
                </div>
              )}
            </div>

            {/* Certificate Details Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-700" />
                <span>Certificate Status</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">Certificate:</span>
                    {getCertStatusBadge(selectedStudentDetail.certificateStatus, selectedStudentDetail.certificateId)}
                  </div>
                  {selectedStudentDetail.certificateId && (
                    <div className="mt-1 space-y-0.5">
                      <p className="font-mono text-[11px] text-brand-900 font-bold">ID: {selectedStudentDetail.certificateId}</p>
                      <p className="text-[11px] text-slate-500">Issued: {selectedStudentDetail.certificateIssueDate || 'October 2026'} • Grade: {selectedStudentDetail.certificateGrade || 'Distinction'}</p>
                    </div>
                  )}
                </div>

                {selectedStudentDetail.certificateId && (
                  <a
                    href={`/verify/${selectedStudentDetail.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800 flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Verify Credential</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROJECT REVIEW MODAL */}
      {/* ============================================================== */}
      {reviewModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 dark-bezel relative space-y-4 shadow-2xl">
            <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900">Review Project Submission</h3>
            <p className="text-xs font-bold text-slate-600">Student: {selectedSubmission.studentName} ({selectedSubmission.studentEmail || selectedSubmission.userId})</p>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1.5">
              <p className="font-black text-slate-900">{selectedSubmission.projectTitle}</p>
              <p className="text-slate-500 font-semibold">{selectedSubmission.courseTitle}</p>
              {selectedSubmission.githubUrl && (
                <a
                  href={selectedSubmission.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-700 hover:underline font-mono text-[11px] pt-1"
                >
                  <Github className="w-3.5 h-3.5 text-slate-700" />
                  <span>{selectedSubmission.githubUrl}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            <form onSubmit={handleReviewProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Status</label>
                <select
                  name="status"
                  defaultValue={selectedSubmission.status}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Needs Revision">Needs Revision</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Score (0 - 100)</label>
                <input
                  type="number"
                  name="score"
                  defaultValue={selectedSubmission.score || 95}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback / Revision Comments</label>
                <textarea
                  name="feedback"
                  rows={3}
                  defaultValue={selectedSubmission.feedback || ''}
                  placeholder="Enter feedback or revision notes for the student..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl cursor-pointer"
              >
                Submit Review Decision
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GENERATE CERTIFICATE MODAL */}
      {/* ============================================================== */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 dark-bezel relative space-y-4 shadow-2xl">
            <button onClick={() => setCertModalOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900">Generate Student Certificate</h3>

            <form onSubmit={handleGenerateCertificateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student</label>
                <select
                  value={selectedCertStudent}
                  onChange={(e) => setSelectedCertStudent(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="">Select Student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={selectedCertCourse}
                  onChange={(e) => setSelectedCertCourse(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                >
                  <option value="">Select Course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grade / Distinction</label>
                <input
                  type="text"
                  value={certGrade}
                  onChange={(e) => setCertGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={forceCertOverride}
                  onChange={(e) => setForceCertOverride(e.target.checked)}
                  id="forceOverrideCheck"
                />
                <label htmlFor="forceOverrideCheck" className="cursor-pointer">Admin Manual Override Eligibility Check</label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl cursor-pointer"
              >
                Issue Certificate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* COURSE CREATION / EDIT MODAL */}
      {/* ============================================================== */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 dark-bezel relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setCourseModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-4">
              {editingCourse ? `Edit Course — ${editingCourse.title}` : 'Publish New Bootcamp Course'}
            </h2>

            <form onSubmit={handleSaveCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingCourse?.title || ''}
                  className="w-full px-4 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingCourse?.category || 'Programming'}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Programming">Programming</option>
                    <option value="SQL">SQL</option>
                    <option value="Web Development">Web Development</option>
                    <option value="AI">AI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingCourse?.status || 'published'}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  name="shortDescription"
                  rows={2}
                  defaultValue={editingCourse?.shortDescription || ''}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCourse?.description || ''}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-black text-white bg-brand-900 hover:bg-brand-800 rounded-xl"
              >
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {deleteConfirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 dark-bezel text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">Are you sure?</h3>
            <p className="text-xs text-slate-600">
              Action targeting <strong>{deleteConfirmModal.title}</strong> cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmModal({ open: false, type: '', id: '', title: '' })}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 rounded-xl"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
