import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon, Menu, X, Clock } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài tập');
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang nộp bài...');
    try {
      await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });
      toast.success('Nộp bài thành công!', { id: loadingToast });
      setSubmissionContent('');
      setSelectedAssignment(null);
    } catch (error) {
      toast.error('Lỗi khi nộp bài', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
        activeTab === id 
          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <Icon size={20} className={activeTab === id ? "text-indigo-600 dark:text-indigo-400" : ""} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex transition-colors duration-500 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Study Space</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 md:p-8 pt-8 md:pt-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={24} /> Study Space
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{user?.name}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem id="assignments" icon={BookOpen} label="Bài tập của tôi" />
          <NavItem id="resources" icon={FileText} label="Kho tài liệu" />
          <NavItem id="chat" icon={MessageSquare} label="Chat nhóm" />
        </nav>

        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all font-medium"
          >
            {darkMode ? <><Sun size={18} className="text-amber-500" /> Sáng</> : <><Moon size={18} className="text-indigo-500" /> Tối</>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 shadow-sm transition-all font-medium"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <div className="p-4 sm:p-8 max-w-7xl mx-auto h-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bài tập của tôi</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 space-y-4">
                      {assignments.map((a, index) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={a.id}
                          onClick={() => {
                            setSelectedAssignment(a);
                            setSubmissionContent('');
                          }}
                          className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
                            selectedAssignment?.id === a.id
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                              : 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-md'
                          }`}
                        >
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{a.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 text-sm">{a.description}</p>
                          <div className="mt-5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                              <Clock size={12} /> {new Date(a.deadline).toLocaleDateString('vi-VN')}
                            </span>
                            <span className={`text-sm font-bold flex items-center gap-1.5 transition-transform ${selectedAssignment?.id === a.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1'}`}>
                              Nộp bài <Send size={14} />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      {assignments.length === 0 && (
                        <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 border-dashed">
                          <p className="text-slate-500 font-medium">Chưa có bài tập nào.</p>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7">
                      <AnimatePresence mode="wait">
                        {selectedAssignment ? (
                          <motion.div
                            key={selectedAssignment.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 sticky top-8"
                          >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                              <BookOpen size={14} /> Bài tập đang chọn
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{selectedAssignment.title}</h3>
                            <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{selectedAssignment.description}</p>
                            </div>
                            
                            <hr className="my-8 border-slate-200 dark:border-slate-800/50" />

                            <form onSubmit={handleSubmitAssignment} className="space-y-5">
                              <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Khu vực nộp bài</label>
                                <textarea
                                  required
                                  className="w-full px-5 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none shadow-sm"
                                  rows={5}
                                  placeholder="Dán đường link (Google Drive, Docs, GitHub...) hoặc nội dung bài làm của bạn vào đây..."
                                  value={submissionContent}
                                  onChange={(e) => setSubmissionContent(e.target.value)}
                                ></textarea>
                              </div>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/25 transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                              >
                                {isSubmitting ? (
                                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang gửi...</>
                                ) : (
                                  <><CheckCircle size={20} /> Nộp bài ngay</>
                                )}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <div className="hidden lg:flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl h-[600px]">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                              <BookOpen size={64} className="mb-6 opacity-20 text-indigo-500" />
                            </motion.div>
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Chọn một bài tập ở danh sách bên trái để bắt đầu</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-6 h-full flex flex-col">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kho tài liệu</h2>
                  <ResourceLibrary />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-full flex flex-col pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 sm:mb-6">Phòng Chat</h2>
                  <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden flex flex-col min-h-[500px]">
                    <Chat />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
