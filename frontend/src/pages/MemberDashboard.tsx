import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon, Menu, X, Clock, Trophy, Bell, Sparkles, RefreshCw, Search, Users } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { useNavigate, Link } from 'react-router-dom';

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources' | 'leaderboard' | 'notifications'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
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
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài tập');
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await api.get('/assignments/my-submissions');
      setMySubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/ranking/leaderboard');
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/ranking/notifications');
      setNotifications(Array.isArray(response.data) ? response.data : []);
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

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang gửi bài làm...');
    
    try {
      await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });

      toast.success('Đã nộp bài thành công! Vui lòng đợi vài giây để xem kết quả điểm AI.', { 
        id: loadingToast,
        duration: 5000 
      });

      setSubmissionContent('');
      setSelectedAssignment(null);
      
      setTimeout(() => {
        fetchMySubmissions();
        fetchLeaderboard();
        fetchNotifications();
        refreshUser();
      }, 3000);
      
    } catch (error: any) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message), { id: loadingToast });
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
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} /> {label}
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badgeCount}</span>
      )}
    </button>
  );

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Master': return 'from-purple-500 to-indigo-600';
      case 'Diamond': return 'from-blue-400 to-cyan-500';
      case 'Platinum': return 'from-emerald-400 to-teal-600';
      case 'Gold': return 'from-amber-400 to-orange-500';
      case 'Silver': return 'from-slate-300 to-slate-500';
      default: return 'from-orange-700 to-amber-900';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex transition-colors duration-500 overflow-hidden font-sans text-slate-900 dark:text-white">
      
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>

      <motion.div className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} /> Study Space
          </h1>
          
          <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <Link to={`/profile/${user?.id}`} className="block group">
               <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getBadgeColor(user?.badge || 'Bronze')} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-105 transition-all overflow-hidden shadow-inner`}>
                  {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Trophy size={20} />}
               </div>
               <p className="text-sm font-black truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Trang cá nhân</p>
            </Link>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full uppercase">Cấp {user?.level || 1}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{user?.badge || 'Bronze'}</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${((user?.totalPoints || 0) % 2000) / 20}%` }} className="h-full bg-indigo-500 rounded-full" />
            </div>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-2">Tổng điểm: {user?.totalPoints || 0}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 text-left">
          <NavItem id="assignments" icon={BookOpen} label="Bài tập" />
          <button onClick={() => navigate('/feed')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm">
             <Users size={18} /> Bảng tin
          </button>
          <button onClick={() => navigate('/search')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm">
             <Search size={18} /> Tìm kiếm
          </button>
          <NavItem id="leaderboard" icon={Trophy} label="Xếp hạng" />
          <NavItem id="notifications" icon={Bell} label="Thông báo" badgeCount={notifications.filter(n => !n.isRead).length} />
          <NavItem id="resources" icon={FileText} label="Tài liệu" />
          <NavItem id="chat" icon={MessageSquare} label="Phòng chat" />
        </nav>

        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl space-y-1.5">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-xs">
            {darkMode ? <><Sun size={16} className="text-amber-500" /> Sáng</> : <><Moon size={16} className="text-indigo-500" /> Tối</>}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-xs">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </motion.div>

      <div className="flex-1 h-screen overflow-y-auto relative bg-transparent scroll-smooth">
        <div className="md:hidden sticky top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-40">
           <span className="font-black text-indigo-600 dark:text-indigo-400">STUDY SPACE</span>
           <div className="flex items-center gap-2">
             <button onClick={handleRefreshData} className="p-2 text-indigo-600"><RefreshCw size={20} /></button>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={24} /></button>
           </div>
        </div>

        <div className="p-4 sm:p-10 max-w-7xl mx-auto flex flex-col h-full min-h-screen">
          <div className="hidden md:flex justify-end mb-4 text-left">
             <button onClick={handleRefreshData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all">
                Làm mới dữ liệu
             </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
              
              {activeTab === 'assignments' && (
                <div className="space-y-8 text-left">
                  <h2 className="text-3xl font-black tracking-tighter">Thử thách Lập trình</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    <div className="lg:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                      {assignments.map((a, index) => {
                        const mySub = mySubmissions.find(s => s.assignmentId === a.id);
                        return (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={a.id} onClick={() => { setSelectedAssignment(a); setSubmissionContent(mySub?.content || ''); setSelectedLanguage(a.language.toLowerCase()); }} className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm group ${selectedAssignment?.id === a.id ? 'border-indigo-500 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-300'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{a.language}</span>
                            {mySub && <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${mySub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{mySub.status}</span>}
                          </div>
                          <h3 className="text-lg font-extrabold line-clamp-1">{a.title}</h3>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {new Date(a.deadline).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                               <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{mySub?.score || 0}</span>
                               <span className="text-[10px] font-bold text-slate-300">/ {a.maxScore}</span>
                            </div>
                          </div>
                        </motion.div>
                      )})}
                    </div>
                    <div className="lg:col-span-8 h-full">
                      <AnimatePresence mode="wait">
                        {selectedAssignment ? (
                          <motion.div key={selectedAssignment.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                            <h3 className="text-2xl font-black mb-4">{selectedAssignment.title}</h3>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm mb-6 whitespace-pre-wrap">{selectedAssignment.description}</div>
                            {(() => {
                              const sub = mySubmissions.find(s => s.assignmentId === selectedAssignment.id);
                              if (sub?.status === 'GRADED') {
                                return (
                                  <div className="mb-8 p-6 rounded-2xl bg-indigo-600 text-white shadow-xl">
                                    <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase tracking-widest opacity-80">Kết quả AI</div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                       <span className="text-5xl font-black">{sub.score}</span>
                                       <span className="text-lg font-bold opacity-60">/ {selectedAssignment.maxScore} pts</span>
                                    </div>
                                    <p className="text-sm italic opacity-90">"{sub.feedback}"</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <form onSubmit={handleSubmitAssignment} className="space-y-6 text-left">
                              <div className="flex flex-col gap-4">
                                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold"><option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option><option value="cpp">C++</option><option value="java">Java</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option><option value="php">PHP</option></select>
                                <div className="h-[450px] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner">
                                  <Editor height="100%" language={selectedLanguage} theme={darkMode ? "vs-dark" : "light"} value={submissionContent} onChange={(val) => setSubmissionContent(val || '')} options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, fontFamily: 'Fira Code, monospace', suggestOnTriggerCharacters: true, wordWrap: "on" }} />
                                </div>
                              </div>
                              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50">{isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} /> Nộp bài AI</>}</button>
                            </form>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] h-[600px] text-slate-400 font-bold">Chọn thử thách để bắt đầu!</div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-10">
                   <div className="text-center">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">Bảng Vàng Danh Vọng</h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">Tôn vinh nỗ lực của mọi thành viên</p>
                   </div>
                   {leaderboard.length > 0 && (
                     <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 pt-10">
                        {/* Rank 2 */}
                        {leaderboard[1] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full md:w-64 p-8 rounded-[3rem] text-center border-4 border-slate-300 bg-white dark:bg-slate-900 order-2 md:order-1 h-[260px] flex flex-col justify-center shadow-xl">
                             <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-lg font-black mb-3 border-4 border-white dark:border-slate-700 shadow-lg">#2</div>
                             <p className="font-black text-base mb-1 truncate px-2">{leaderboard[1].name}</p>
                             <p className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{leaderboard[1].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                             <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{leaderboard[1].badge} • Cấp {leaderboard[1].level}</p>
                          </motion.div>
                        )}
                        {/* Rank 1 */}
                        {leaderboard[0] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="w-full md:w-72 p-10 rounded-[3rem] text-center border-4 border-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-2xl shadow-amber-500/20 order-1 md:order-2 h-[320px] flex flex-col justify-center relative z-10">
                             <div className="w-16 h-16 mx-auto rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-2xl font-black mb-3 border-4 border-white dark:border-amber-200 shadow-xl relative z-10">#1</div>
                             <p className="font-black text-lg mb-1 truncate px-2 relative z-10">{leaderboard[0].name}</p>
                             <p className="text-amber-600 dark:text-amber-400 font-black text-2xl relative z-10">{leaderboard[0].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                             <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mt-2 relative z-10">{leaderboard[0].badge} • Cấp {leaderboard[0].level}</p>
                          </motion.div>
                        )}
                        {/* Rank 3 */}
                        {leaderboard[2] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full md:w-60 p-8 rounded-[3rem] text-center border-4 border-amber-800 bg-white dark:bg-slate-900 order-3 md:order-3 h-[240px] flex flex-col justify-center shadow-xl">
                             <div className="w-10 h-10 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/20 text-amber-800 flex items-center justify-center text-base font-black mb-3 border-4 border-white dark:border-amber-900/50 shadow-lg">#3</div>
                             <p className="font-black text-base mb-1 truncate px-2">{leaderboard[2].name}</p>
                             <p className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{leaderboard[2].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                             <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{leaderboard[2].badge} • Cấp {leaderboard[2].level}</p>
                          </motion.div>
                        )}
                     </div>
                   )}
                   <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-10 max-w-4xl mx-auto">
                      <div className="space-y-4">
                         {leaderboard.map((u, index) => (
                           <div key={u.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${u.id === user?.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-left'}`}>
                             <div className="flex items-center gap-6">
                                <span className={`text-lg font-black w-8 ${u.id === user?.id ? 'text-white' : index < 3 ? 'text-indigo-500' : 'text-slate-300'}`}>#{index+1}</span>
                                <div className="text-left">
                                   <p className="font-black truncate w-32 sm:w-auto">{u.name}</p>
                                   <p className={`text-[10px] font-bold uppercase ${u.id === user?.id ? 'text-indigo-200' : 'text-slate-400'}`}>{u.badge} • Cấp {u.level}</p>
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
                <div className="space-y-6 max-w-3xl mx-auto w-full text-left">
                  <h2 className="text-3xl font-black tracking-tighter">Thông báo</h2>
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-6 rounded-[2rem] border ${!n.isRead ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-lg' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                      <h4 className="font-black text-lg mb-2">{n.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{n.message}</p>
                      {n.senderId && (
                        <div className="mt-4 flex gap-2">
                          <input type="text" placeholder="Phản hồi..." className="flex-1 bg-slate-50 dark:bg-slate-800 border-none px-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={replyText[n.id] || ''} onChange={(e) => setReplyText({ ...replyText, [n.id]: e.target.value })} />
                          <button onClick={() => handleReplyNotification(n.id)} className="bg-indigo-600 text-white p-2 rounded-xl"><Send size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'resources' && <ResourceLibrary />}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col h-[650px] max-h-[650px] mb-6 overflow-hidden">
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
