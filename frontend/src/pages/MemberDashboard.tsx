import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon, Menu, X, Clock, Trophy, Bell, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources' | 'leaderboard' | 'notifications'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

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

  const handleRefreshData = () => {
    fetchAssignments();
    fetchMySubmissions();
    fetchLeaderboard();
    fetchNotifications();
    refreshUser();
    toast.success('Đã làm mới dữ liệu!');
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.patch('/ranking/notifications/read');
      setNotifications(notifications.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReplyNotification = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;

    const loadingToast = toast.loading('Đang gửi phản hồi...');
    try {
      await api.post(`/ranking/notifications/${id}/reply`, { message: text });
      toast.success('Đã gửi phản hồi thành công!', { id: loadingToast });
      setReplyText({ ...replyText, [id]: '' });
    } catch (error) {
      toast.error('Lỗi khi gửi phản hồi', { id: loadingToast });
    }
  };

  // --- HÀM CHẤM ĐIỂM AI SIÊU ỔN ĐỊNH (SUPER ROBUST AI GRADING) ---
  const performAIGrading = async (content: string, assignment: any) => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) throw new Error("Vui lòng cấu hình API Key");

    const prompt = `Bạn là giám khảo lập trình. Hãy chấm bài: "${assignment.title}".
Trả về duy nhất JSON { "score": number, "feedback": "string bằng tiếng Việt" }.
Yêu cầu: ${assignment.description}. Điểm tối đa: ${assignment.maxScore}.
Code: ${content}`;

    const endpoints = [
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, name: "Flash" },
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiKey}`, name: "Pro" }
    ];

    let lastError = "";
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (response.ok) {
          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        }
      } catch (e: any) { lastError = e.message; }
    }
    throw new Error(lastError);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang gửi bài làm...');
    
    try {
      // 1. Lưu code
      await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });

      toast.success('Đã nộp bài thành công! Vui lòng tải lại trang sau vài giây để xem kết quả điểm AI.', { 
        id: loadingToast,
        duration: 5000 
      });

      setSubmissionContent('');
      setSelectedAssignment(null);
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchMySubmissions();
        fetchLeaderboard();
        fetchNotifications();
        refreshUser();
      }, 3000);
      
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message, { id: loadingToast });
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
          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/5' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={activeTab === id ? "text-indigo-600 dark:text-indigo-400" : ""} /> {label}
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">{badgeCount}</span>
      )}
    </button>
  );

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Master': return 'from-purple-500 to-indigo-600 shadow-purple-500/40';
      case 'Diamond': return 'from-blue-400 to-cyan-500 shadow-blue-400/40';
      case 'Platinum': return 'from-emerald-400 to-teal-600 shadow-emerald-400/40';
      case 'Gold': return 'from-amber-400 to-orange-500 shadow-amber-400/40';
      case 'Silver': return 'from-slate-300 to-slate-500 shadow-slate-300/40';
      default: return 'from-orange-700 to-amber-900 shadow-orange-700/40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex transition-colors duration-500 overflow-hidden font-sans text-slate-900 dark:text-white">
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 md:p-8 pt-8">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={24} /> Study Space
          </h1>
          
          <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-indigo-500/5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getBadgeColor(user?.badge || 'Bronze')} flex items-center justify-center text-white mb-3 shadow-lg`}>
              <Trophy size={24} />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full uppercase tracking-tighter">Cấp {user?.level || 1}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.badge || 'Bronze'}</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${(user?.totalPoints || 0) % 100}%` }} className="h-full bg-indigo-500 rounded-full" />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-bold text-right">{(user?.totalPoints || 0) % 100} / 100 XP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2">
          <NavItem id="assignments" icon={BookOpen} label="Bài tập thử thách" />
          <NavItem id="leaderboard" icon={Trophy} label="Bảng vàng xếp hạng" />
          <NavItem id="notifications" icon={Bell} label="Thông báo hệ thống" badgeCount={notifications.filter(n => !n.isRead).length} />
          <NavItem id="resources" icon={FileText} label="Thư viện tài liệu" />
          <NavItem id="chat" icon={MessageSquare} label="Phòng chat nhóm" />
        </nav>

        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all font-bold text-sm">
            {darkMode ? <><Sun size={18} className="text-amber-500" /> Chế độ Sáng</> : <><Moon size={18} className="text-indigo-500" /> Chế độ Tối</>}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 shadow-sm transition-all font-bold text-sm">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto relative bg-transparent scroll-smooth">
        {/* Mobile Navbar */}
        <div className="md:hidden sticky top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-40">
           <span className="font-black text-indigo-600 dark:text-indigo-400">STUDY SPACE</span>
           <div className="flex items-center gap-2">
             <button onClick={handleRefreshData} className="p-2 text-indigo-600"><RefreshCw size={20} className="hover:rotate-180 transition-transform duration-500" /></button>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={24} /></button>
           </div>
        </div>

        <div className="p-4 sm:p-10 max-w-7xl mx-auto flex flex-col h-full min-h-screen">
          {/* Desktop Header Refresh */}
          <div className="hidden md:flex justify-end mb-4">
             <button onClick={handleRefreshData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                Làm mới dữ liệu
             </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: 'circOut' }} className="flex-1 flex flex-col">
              
              {activeTab === 'assignments' && (
                <div className="space-y-8">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Thử thách Lập trình</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Hoàn thành bài tập để thăng hạng và nhận huy hiệu Master!</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                      {assignments.map((a, index) => {
                        const mySub = mySubmissions.find(s => s.assignmentId === a.id);
                        return (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={a.id} onClick={() => { setSelectedAssignment(a); setSubmissionContent(mySub?.content || ''); }} className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm group ${selectedAssignment?.id === a.id ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-slate-700'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{a.language}</span>
                            {mySub && <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${mySub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{mySub.status}</span>}
                          </div>
                          <h3 className="text-lg font-extrabold line-clamp-1">{a.title}</h3>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {new Date(a.deadline).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                               <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{mySub?.score || 0}</span>
                               <span className="text-[10px] font-bold text-slate-300">/ {a.maxScore} pts</span>
                            </div>
                          </div>
                        </motion.div>
                      )})}
                    </div>

                    <div className="lg:col-span-8 h-full">
                      <AnimatePresence mode="wait">
                        {selectedAssignment ? (
                          <motion.div key={selectedAssignment.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800/50">
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">{selectedAssignment.title}</h3>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                               <p className="font-black text-indigo-500 mb-2 uppercase text-[10px] tracking-widest">Yêu cầu đề bài</p>
                               {selectedAssignment.description}
                            </div>

                            {(() => {
                              const sub = mySubmissions.find(s => s.assignmentId === selectedAssignment.id);
                              if (sub?.status === 'GRADED') {
                                return (
                                  <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20">
                                    <div className="flex justify-between items-center mb-4">
                                       <span className="text-xs font-black uppercase tracking-widest opacity-80">Kết quả AI (Tiếng Việt)</span>
                                       <CheckCircle size={20} />
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                       <span className="text-5xl font-black">{sub.score}</span>
                                       <span className="text-lg font-bold opacity-60">/ {selectedAssignment.maxScore} pts</span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed italic opacity-90">"{sub.feedback}"</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <form onSubmit={handleSubmitAssignment} className="space-y-6">
                              <div className="h-[450px] border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl ring-8 ring-slate-100 dark:ring-slate-800/50">
                                <Editor height="100%" language={selectedAssignment.language.toLowerCase()} theme={darkMode ? "vs-dark" : "light"} value={submissionContent} onChange={(val) => setSubmissionContent(val || '')} options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 20 }, scrollBeyondLastLine: false, automaticLayout: true, fontFamily: 'Fira Code, monospace' }} />
                              </div>
                              <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/30 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={22} /> Nộp bài & Cập nhật điểm AI</>}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] h-[650px]">
                            <BookOpen size={80} className="mb-6 text-indigo-500 opacity-20" />
                            <p className="text-xl font-black text-slate-400">Chọn thử thách để khai phá!</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-10">
                   <div className="text-center">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">Bảng Vàng Danh Vọng</h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Nơi tôn vinh những Master Code xuất sắc nhất</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                      {leaderboard.slice(0, 3).map((u, i) => (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i*0.1 }} key={u.id} className={`p-8 rounded-[3rem] text-center border-4 relative overflow-hidden ${i === 0 ? 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-400 shadow-2xl shadow-amber-500/20 order-1 md:scale-110 z-10' : i === 1 ? 'bg-white dark:bg-slate-900 border-slate-300 order-0' : 'bg-white dark:bg-slate-900 border-amber-800 order-2'}`}>
                           <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-black mb-4 ${i === 0 ? 'bg-amber-400 text-amber-900 shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>#{i+1}</div>
                           <p className="font-black text-lg mb-1 truncate">{u.name}</p>
                           <p className="text-indigo-600 dark:text-indigo-400 font-black text-2xl">{u.totalPoints} <span className="text-xs opacity-50">PTS</span></p>
                           <span className="inline-block mt-4 text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{u.badge}</span>
                        </motion.div>
                      ))}
                   </div>
                   <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-10 max-w-4xl mx-auto">
                      <div className="space-y-4">
                         {leaderboard.map((u, index) => (
                           <div key={u.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${u.id === user?.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30 translate-x-2' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200'}`}>
                             <div className="flex items-center gap-6">
                                <span className={`text-lg font-black w-8 ${u.id === user?.id ? 'text-white' : 'text-slate-300'}`}>#{index+1}</span>
                                <div>
                                   <p className="font-black truncate w-32 sm:w-auto">{u.name}</p>
                                   <p className={`text-[10px] font-bold uppercase tracking-widest ${u.id === user?.id ? 'text-indigo-200' : 'text-slate-400'}`}>Huy hiệu: {u.badge}</p>
                                </div>
                             </div>
                             <p className="font-black text-xl">{u.totalPoints}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Thông báo mới nhất</h2>
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {notifications.map((n, i) => (
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i*0.05 }} key={n.id} className={`p-6 rounded-[2rem] border transition-all ${!n.isRead ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-black text-lg">{n.title}</h4>
                           {!n.isRead && <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{n.message}</p>
                        
                        {/* Reply Section */}
                        {n.senderId && (
                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Nhập phản hồi của bạn..." 
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                value={replyText[n.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [n.id]: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && handleReplyNotification(n.id)}
                              />
                              <button 
                                onClick={() => handleReplyNotification(n.id)}
                                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-tighter">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                      </motion.div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-slate-400 font-bold py-20">Hòm thư trống trơn.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && <ResourceLibrary />}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col h-[650px] max-h-[650px] mb-6 overflow-hidden">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-6">Phòng chat thảo luận</h2>
                  <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden flex flex-col min-h-0">
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
