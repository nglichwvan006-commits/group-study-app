import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments', error);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });
      alert('Assignment submitted successfully!');
      setSubmissionContent('');
      setSelectedAssignment(null);
    } catch (error) {
      alert('Error submitting assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">Study Group</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'assignments' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen size={20} /> Bài tập của tôi
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'resources' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={20} /> Kho tài liệu
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare size={20} /> Chat nhóm
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <><Sun size={20} /> Chế độ sáng</> : <><Moon size={20} /> Chế độ tối</>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bài tập</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className={`p-6 rounded-xl border transition-all cursor-pointer ${
                      selectedAssignment?.id === a.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        Hạn chót: {new Date(a.deadline).toLocaleDateString()}
                      </span>
                      <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold flex items-center gap-1">
                        Xem chi tiết <Send size={14} />
                      </span>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && <p className="text-slate-500 dark:text-slate-400">Chưa có bài tập nào.</p>}
              </div>

              {selectedAssignment ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedAssignment.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-4 whitespace-pre-wrap">{selectedAssignment.description}</p>
                  
                  <hr className="my-6 border-slate-100 dark:border-slate-800" />

                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bài nộp của bạn</label>
                      <textarea
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        rows={6}
                        placeholder="Dán link hoặc nội dung bài nộp tại đây..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang nộp...' : <><CheckCircle size={20} /> Nộp bài ngay</>}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="hidden md:flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl h-80">
                  <BookOpen size={48} className="mb-4 opacity-20" />
                  <p>Chọn một bài tập để xem chi tiết và nộp bài</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kho tài liệu</h2>
            <ResourceLibrary />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-120px)] flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Chat nhóm</h2>
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              <Chat />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
