import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon, Menu, X, Clock, Trophy, Bell, AlertTriangle } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources' | 'leaderboard' | 'notifications'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchMySubmissions();
    fetchLeaderboard();
    fetchNotifications();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài tập');
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await api.get('/assignments/my-submissions');
      setMySubmissions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/ranking/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/ranking/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.patch('/ranking/notifications/read');
      setNotifications(notifications.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.error(error);
    }
  };

  // --- HÀM CHẤM ĐIỂM AI SIÊU ỔN ĐỊNH (SUPER ROBUST AI GRADING) ---
  const performAIGrading = async (content: string, assignment: any) => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) throw new Error("Chưa cấu hình VITE_GEMINI_API_KEY");

    const prompt = `You are a strict programming judge.
Evaluate the code for assignment: "${assignment.title}".
Return ONLY a raw JSON object. No explanation.

{
  "score": number,
  "feedback": "string"
}

Input:
- Goal: ${assignment.description}
- Language: ${assignment.language}
- Max Points: ${assignment.maxScore}
- Student Code:
${content}`;

    // Danh sách các "đường cửa" để thử (v1beta và v1 với các model khác nhau)
    const endpoints = [
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, name: "Flash v1beta" },
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, name: "Flash v1" },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, name: "Pro v1beta" }
    ];

    let lastError = "";

    for (const endpoint of endpoints) {
      try {
        console.log(`[AI] Đang thử chấm điểm bằng: ${endpoint.name}`);
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } else {
          const errData = await response.json();
          lastError = errData.error?.message || response.statusText;
          console.warn(`[AI] ${endpoint.name} thất bại: ${lastError}`);
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[AI] ${endpoint.name} lỗi mạng: ${lastError}`);
      }
    }

    throw new Error(`Tất cả các model AI đều không phản hồi. Lỗi cuối: ${lastError}`);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang gửi bài làm...');
    
    try {
      // 1. Lưu code vào Database trước
      const saveRes = await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });
      const submissionId = saveRes.data.id;

      // 2. Tiến hành chấm điểm AI (Thử nhiều lần)
      toast.loading('AI đang phân tích (đang thử nhiều phương thức)...', { id: loadingToast });
      
      const result = await performAIGrading(submissionContent, selectedAssignment);

      // 3. Gửi kết quả về Backend
      await api.patch(`/assignments/submissions/${submissionId}/ai-result`, {
        score: Math.min(result.score, selectedAssignment.maxScore),
        feedback: result.feedback
      });

      toast.success(`Chấm điểm thành công! Bạn đạt ${result.score} điểm.`, { id: loadingToast, duration: 5000 });
      setSubmissionContent('');
      setSelectedAssignment(null);
      fetchMySubmissions();
      fetchLeaderboard();
      
    } catch (error: any) {
      console.error("Final AI Error:", error);
      toast.error(error.message, { id: loadingToast, duration: 6000 });
      fetchMySubmissions(); // Vẫn load lại để hiện bài nộp FAILED
    } finally {
      setIsSubmitting(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label, badgeCount }: { id: any, icon: any, label: string, badgeCount?: number }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
        if (id === 'notifications') handleMarkNotificationsRead();
      }}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-medium ${
        activeTab === id 
          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={activeTab === id ? "text-indigo-600 dark:text-indigo-400" : ""} /> {label}
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badgeCount}</span>
      )}
    </button>
  );

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex transition-colors duration-500 overflow-hidden font-sans text-slate-900 dark:text-white">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={16} />
          </div>
          <span className="font-bold">Study Space</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
          <Menu size={24} />
        </button>
      </div>

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
        <div className="p-6 md:p-8 pt-8 md:pt-8 flex justify-between items-center text-slate-900 dark:text-white">
          <div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={24} /> Study Space
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{user?.name} - LV {user?.level || 1} ({user?.badge || 'Bronze'})</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem id="assignments" icon={BookOpen} label="Bài tập lập trình" />
          <NavItem id="leaderboard" icon={Trophy} label="Bảng xếp hạng" />
          <NavItem id="notifications" icon={Bell} label="Thông báo" badgeCount={unreadNotifs} />
          <NavItem id="resources" icon={FileText} label="Kho tài liệu" />
          <NavItem id="chat" icon={MessageSquare} label="Chat nhóm" />
        </nav>

        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Điểm của bạn: {user?.totalPoints || 0} pts</p>
          </div>
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
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Thử thách Lập trình</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-slate-900 dark:text-white">
                    <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                      {assignments.map((a, index) => {
                        const mySub = mySubmissions.find(s => s.assignmentId === a.id);
                        return (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={a.id}
                          onClick={() => {
                            setSelectedAssignment(a);
                            setSubmissionContent(mySub ? mySub.content : '');
                          }}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
                            selectedAssignment?.id === a.id
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                              : 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{a.language}</span>
                            {mySub && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${mySub.status === 'GRADED' ? 'bg-green-100 text-green-700' : mySub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {mySub.status}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{a.title}</h3>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <Trophy size={12} className="inline mr-1 text-amber-500"/> {a.maxScore} pts
                            </span>
                            {mySub?.score !== null && mySub?.score !== undefined && (
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{mySub.score} / {a.maxScore}</span>
                            )}
                          </div>
                        </motion.div>
                      )})}
                    </div>

                    <div className="lg:col-span-8">
                      <AnimatePresence mode="wait">
                        {selectedAssignment ? (
                          <motion.div
                            key={selectedAssignment.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50"
                          >
                            <h3 className="text-xl font-extrabold tracking-tight">{selectedAssignment.title}</h3>
                            <div className="flex gap-3 mt-3 mb-4 text-xs font-bold text-slate-500">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Ngôn ngữ: {selectedAssignment.language}</span>
                              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">Max: {selectedAssignment.maxScore} pts</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded"><Clock size={12} className="inline mr-1"/>{new Date(selectedAssignment.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                              {selectedAssignment.description}
                            </div>
                            
                            {(() => {
                              const sub = mySubmissions.find(s => s.assignmentId === selectedAssignment.id);
                              if (sub) {
                                return (
                                  <div className="mb-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10 shadow-sm">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                      {sub.status === 'PENDING' && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>}
                                      {sub.status === 'GRADED' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                      Trạng thái: {sub.status === 'GRADED' ? 'Đã chấm điểm' : sub.status === 'PENDING' ? 'Đang chờ chấm' : 'Thất bại'}
                                    </h4>
                                    {sub.status === 'GRADED' && (
                                      <div className="mt-2">
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{sub.score} <span className="text-sm text-slate-500">/ {selectedAssignment.maxScore} pts</span></p>
                                        <div className="text-sm mt-2 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-indigo-100 dark:border-slate-800">
                                            <p className="font-bold text-slate-500 text-[10px] uppercase mb-1">Nhận xét từ AI:</p>
                                            <p className="text-slate-700 dark:text-slate-200 italic">"{sub.feedback}"</p>
                                        </div>
                                      </div>
                                    )}
                                    {sub.status === 'FAILED' && (
                                      <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                                        <div className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={14}/> Lỗi chấm điểm tự động</div>
                                        <p>{sub.feedback}</p>
                                        <p className="mt-2 font-medium opacity-70 italic">* Vui lòng thử nộp lại bài hoặc liên hệ Admin để chấm tay.</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <form onSubmit={handleSubmitAssignment} className="space-y-4">
                              <div className="h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner">
                                <Editor
                                  height="100%"
                                  language={selectedAssignment.language.toLowerCase()}
                                  theme={darkMode ? "vs-dark" : "light"}
                                  value={submissionContent}
                                  onChange={(val) => setSubmissionContent(val || '')}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                  }}
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/25 transform hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                              >
                                {isSubmitting ? (
                                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang xử lý...</>
                                ) : (
                                  <><CheckCircle size={20} /> Nộp bài & Chấm điểm bằng AI</>
                                )}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <div className="hidden lg:flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl h-[600px]">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                              <BookOpen size={64} className="mb-6 opacity-20 text-indigo-500" />
                            </motion.div>
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400 font-sans">Chọn một thử thách để bắt đầu code</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bảng xếp hạng toàn cầu</h2>
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden p-6 sm:p-8">
                    {leaderboard.length === 0 ? (
                      <p className="text-slate-500 text-center py-10">Chưa có ai ghi danh trên bảng vàng.</p>
                    ) : (
                      <div className="space-y-3">
                        {leaderboard.map((u, index) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={u.id} 
                            className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${u.id === user?.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}
                          >
                            <div className="flex items-center gap-4 sm:gap-6">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full font-black text-lg shadow-inner ${index === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800' : index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700' : index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-extrabold text-base sm:text-lg">{u.name} {u.id === user?.id && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-2">BẠN</span>}</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">LV.{u.level} • Huy hiệu: <span className="text-indigo-500 dark:text-indigo-400">{u.badge}</span></p>
                              </div>
                            </div>
                            <div className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                              {u.totalPoints}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Thông báo</h2>
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden p-6">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-center py-10">Bạn không có thông báo nào.</p>
                    ) : (
                      <div className="space-y-3 max-w-3xl mx-auto">
                        {notifications.map((n, i) => (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }} key={n.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                                {n.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-6 h-full flex flex-col">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Kho tài liệu</h2>
                  <ResourceLibrary />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-[calc(100vh-120px)] flex flex-col pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Phòng Chat</h2>
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
