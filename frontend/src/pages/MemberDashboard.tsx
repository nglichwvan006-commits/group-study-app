import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle, FileText, Sun, Moon, Menu, X, Clock, Trophy, Bell, Sparkles, RefreshCw, Search, Users, ChevronRight, LayoutList, Star, Trash2, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { useNavigate, Link } from 'react-router-dom';

const AssignmentSkeleton = () => (
  <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 animate-pulse">
    <div className="flex justify-between items-center mb-3">
      <div className="flex gap-2">
        <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </div>
    </div>
    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
      <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
      <div className="w-10 h-4 bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
    </div>
  </div>
);

const MemberDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat' | 'resources' | 'leaderboard' | 'notifications'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<string>('Dễ');
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Support State
  const [showSupport, setShowSupport] = useState(false);
  const [supportData, setSupportData] = useState({ name: '', email: '', message: '' });
  const [supportHistory, setSupportHistory] = useState<any[]>([]);
  const [isCheckingHistory, setIsCheckingHistory] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchMySubmissions();
    fetchLeaderboard();
    fetchNotifications();
    if (user) {
      setSupportData({ name: user.name || '', email: user.email || '', message: '' });
    }
  }, [user]);

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang gửi tin nhắn...');
    try {
      await api.post('/support', { ...supportData, userId: user?.id });
      toast.success('Đã gửi tin nhắn đến Admin! Admin sẽ phản hồi bạn sớm nhất có thể.', { id: loadingToast });
      setSupportData({ ...supportData, message: '' });
      fetchSupportHistory();
    } catch (error) {
      toast.error('Lỗi khi gửi tin nhắn', { id: loadingToast });
    }
  };

  const fetchSupportHistory = async () => {
    if (!user?.email) return;
    setIsCheckingHistory(true);
    try {
      const res = await api.get(`/support/check?email=${user.email}`);
      setSupportHistory(res.data);
    } catch (error) {
      console.error('Error fetching support history');
    } finally {
      setIsCheckingHistory(false);
    }
  };

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await api.get('/assignments');
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách bài tập');
    } finally {
      setIsLoadingAssignments(false);
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

  const handleNotificationClick = (n: any) => {
    if (n.assignmentId) {
      setActiveTab('assignments');
      const targetAssignment = assignments.find(a => a.id === n.assignmentId);
      if (targetAssignment) {
        setActiveDifficulty(targetAssignment.difficulty || 'Dễ');
        setSelectedAssignment(targetAssignment);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
      toast.success('Đã nộp bài thành công! Vui lòng tải lại sau vài giây để xem điểm AI.', { duration: 5000 });
      setSubmissionContent('');
      setSelectedAssignment(null);
      setTimeout(() => {
        fetchMySubmissions();
        fetchLeaderboard();
        fetchNotifications();
        refreshUser();
      }, 3000);
    } catch (error: any) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleClearNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) return;
    
    const loadingToast = toast.loading('Đang dọn dẹp hòm thư...');
    try {
      await api.delete('/ranking/notifications');
      setNotifications([]);
      toast.success('Hòm thư đã được dọn sạch!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi dọn dẹp hòm thư', { id: loadingToast });
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
        activeTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3"><Icon size={18} /> {label}</div>
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

  const difficulties = ['Dễ', 'Trung bình', 'Khá', 'Khó', 'Master'];
  const filteredAssignments = assignments.filter(a => (a.difficulty || 'Dễ') === activeDifficulty);

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
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" /> Gõ Thủng Bàn Phím
          </h1>
          <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-left">
            <Link to={`/profile/${user?.id}`} className="block group">
               <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getBadgeColor(user?.badge || 'Bronze')} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-105 transition-all overflow-hidden shadow-inner`}>
                  {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Trophy size={20} />}
               </div>
               <p className="text-sm font-black truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Trang cá nhân</p>
            </Link>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full uppercase">Cấp bậc {user?.level || 1}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{user?.badge || 'Bronze'}</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${((user?.totalPoints || 0) % 2000) / 20}%` }} className="h-full bg-indigo-500 rounded-full" />
            </div>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-2">Tổng điểm: {user?.totalPoints || 0}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 text-left">
          <NavItem id="assignments" icon={BookOpen} label="Bài tập thử thách" />
          <button onClick={() => navigate('/feed')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm"><Users size={18} /> Bảng tin</button>
          <button onClick={() => navigate('/search')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm"><Search size={18} /> Tìm kiếm</button>
          <NavItem id="leaderboard" icon={Trophy} label="Xếp hạng" />
          <NavItem id="notifications" icon={Bell} label="Thông báo" badgeCount={notifications.filter(n => !n.isRead).length} />
          <NavItem id="resources" icon={FileText} label="Tài liệu" />
          <button onClick={() => navigate('/pet-game')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm group relative overflow-hidden">
            <Sparkles size={18} className="text-amber-500" />
            <span>Pet Game</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <NavItem id="chat" icon={MessageSquare} label="Thảo luận" />

          <button
            onClick={() => { setShowSupport(true); fetchSupportHistory(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-all text-sm"
          >
            <ShieldCheck size={18} /> Liên hệ Admin
          </button>
        </nav>

        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl space-y-1.5">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-xs">{darkMode ? <><Sun size={16} className="text-amber-500" /> Sáng</> : <><Moon size={16} className="text-indigo-500" /> Tối</>}</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-xs"><LogOut size={16} /> Đăng xuất</button>
        </div>
      </motion.div>

      <div className="flex-1 h-screen overflow-y-auto relative bg-transparent scroll-smooth">
        <div className="md:hidden sticky top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-40">
           <div className="flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
             <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Gõ Thủng Bàn Phím</span>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={handleRefreshData} className="p-2 text-indigo-600"><RefreshCw size={20} /></button>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={24} /></button>
           </div>
        </div>

        <div className="p-4 sm:p-10 max-w-7xl mx-auto flex flex-col h-full min-h-screen">
          <div className="hidden md:flex justify-end mb-4">
             <button onClick={handleRefreshData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all">Làm mới dữ liệu</button>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
              
              {activeTab === 'assignments' && (
                <div className="space-y-8 text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Thử thách Lập trình</h2>
                    <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit shadow-inner">
                       {difficulties.map(d => (
                         <button 
                           key={d} 
                           onClick={() => { setActiveDifficulty(d); setSelectedAssignment(null); }}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeDifficulty === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           {d}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                      {isLoadingAssignments ? (
                        <>
                          <AssignmentSkeleton />
                          <AssignmentSkeleton />
                          <AssignmentSkeleton />
                          <AssignmentSkeleton />
                        </>
                      ) : (
                        <>
                          {filteredAssignments.map((a, index) => {
                            const mySub = mySubmissions.find(s => s.assignmentId === a.id);
                            return (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={a.id} onClick={() => { setSelectedAssignment(a); setSubmissionContent(mySub?.content || ''); setSelectedLanguage(a.language.toLowerCase()); }} className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm group ${selectedAssignment?.id === a.id ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-300'}`}>
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex gap-2">
                                   <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">{a.language}</span>
                                   <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${a.difficulty === 'Master' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{a.difficulty}</span>
                                </div>
                                {mySub && <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${mySub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{mySub.status}</span>}
                              </div>
                              <h3 className="text-lg font-extrabold line-clamp-1 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter"><Clock size={12}/> {new Date(a.deadline).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1">
                                   <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{mySub?.score || 0}</span>
                                   <span className="text-[10px] font-bold text-slate-300">/ {a.maxScore}</span>
                                </div>
                              </div>
                            </motion.div>
                          )})}
                          {filteredAssignments.length === 0 && <div className="p-10 bg-white/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold uppercase text-[10px]">Chưa có bài tập cấp độ này.</div>}
                        </>
                      )}
                    </div>

                    <div className="lg:col-span-8 h-full">
                      <AnimatePresence mode="wait">
                        {selectedAssignment ? (
                          <motion.div key={selectedAssignment.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                               <h3 className="text-2xl font-black">{selectedAssignment.title}</h3>
                               <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase">{selectedAssignment.difficulty}</span>
                                  <Star size={16} className="text-amber-400 fill-amber-400" />
                               </div>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm mb-6 whitespace-pre-wrap">{selectedAssignment.description}</div>

                            {(() => {
                              const sub = mySubmissions.find(s => s.assignmentId === selectedAssignment.id);
                              if (sub?.status === 'GRADED') {
                                return (
                                  <div className="mb-8 p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                                    <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase tracking-widest opacity-80">Kết quả AI</div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                       <span className="text-5xl font-black">{sub.score}</span>
                                       <span className="text-lg font-bold opacity-60">/ {selectedAssignment.maxScore} pts</span>
                                    </div>
                                    <p className="text-sm italic opacity-90 leading-relaxed">"{sub.feedback}"</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <form onSubmit={handleSubmitAssignment} className="space-y-6">
                              <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn ngôn ngữ gõ</label>
                                   <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                                      <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option><option value="cpp">C++</option><option value="java">Java</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option><option value="php">PHP</option>
                                   </select>
                                </div>
                                <div className="h-[450px] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner">
                                  <Editor height="100%" language={selectedLanguage} theme={darkMode ? "vs-dark" : "light"} value={submissionContent} onChange={(val) => setSubmissionContent(val || '')} options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, fontFamily: 'Fira Code, monospace', suggestOnTriggerCharacters: true, wordWrap: "on" }} />
                                </div>
                              </div>
                              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 transform hover:scale-[1.01] active:scale-95">
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} /> NỘP BÀI AI</>}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] h-[600px] text-slate-400 font-bold uppercase text-sm tracking-widest">Chọn bài tập từ danh sách bên trái</div>
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
                     <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 pt-10 px-4">
                        {leaderboard[1] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full md:w-64 p-8 rounded-[3rem] text-center border-4 border-slate-300 bg-white dark:bg-slate-900 order-2 md:order-1 h-[260px] flex flex-col justify-center shadow-xl group cursor-pointer">
                             <Link to={`/profile/${leaderboard[1].id}`} className="block">
                                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-lg font-black mb-3 border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
                                   {leaderboard[1].avatarUrl ? <img src={leaderboard[1].avatarUrl} className="w-full h-full object-cover" /> : '#2'}
                                </div>
                                <p className="font-black text-base mb-1 truncate px-2 group-hover:text-indigo-600 transition-colors">{leaderboard[1].name}</p>
                                <p className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{leaderboard[1].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{leaderboard[1].badge} • Cấp {leaderboard[1].level}</p>
                             </Link>
                          </motion.div>
                        )}
                        {leaderboard[0] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="w-full md:w-72 p-10 rounded-[3rem] text-center border-4 border-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-2xl shadow-amber-500/20 order-1 md:order-2 h-[320px] flex flex-col justify-center relative z-10 scale-105 group cursor-pointer">
                             <Link to={`/profile/${leaderboard[0].id}`} className="block">
                                <div className="w-20 h-20 mx-auto rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-2xl font-black mb-3 border-4 border-white dark:border-amber-200 shadow-xl relative z-10 overflow-hidden group-hover:scale-110 transition-transform">
                                   {leaderboard[0].avatarUrl ? <img src={leaderboard[0].avatarUrl} className="w-full h-full object-cover" /> : '#1'}
                                </div>
                                <p className="font-black text-lg mb-1 truncate px-2 relative z-10 group-hover:text-amber-600 transition-colors">{leaderboard[0].name}</p>
                                <p className="text-amber-600 dark:text-amber-400 font-black text-2xl relative z-10">{leaderboard[0].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mt-2 relative z-10">{leaderboard[0].badge} • Cấp {leaderboard[0].level}</p>
                             </Link>
                          </motion.div>
                        )}
                        {leaderboard[2] && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full md:w-60 p-8 rounded-[3rem] text-center border-4 border-amber-800 bg-white dark:bg-slate-900 order-3 md:order-3 h-[240px] flex flex-col justify-center shadow-xl group cursor-pointer">
                             <Link to={`/profile/${leaderboard[2].id}`} className="block">
                                <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/20 text-amber-800 flex items-center justify-center text-base font-black mb-3 border-4 border-white dark:border-amber-900/50 shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
                                   {leaderboard[2].avatarUrl ? <img src={leaderboard[2].avatarUrl} className="w-full h-full object-cover" /> : '#3'}
                                </div>
                                <p className="font-black text-base mb-1 truncate px-2 group-hover:text-orange-700 transition-colors">{leaderboard[2].name}</p>
                                <p className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{leaderboard[2].totalPoints} <span className="text-[8px] opacity-50 uppercase">Điểm</span></p>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-2">{leaderboard[2].badge} • Cấp {leaderboard[2].level}</p>
                             </Link>
                          </motion.div>
                        )}
                     </div>
                   )}
                   <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-10 max-w-4xl mx-auto">
                      <div className="space-y-4">
                         {leaderboard.map((u, index) => (
                           <Link key={u.id} to={`/profile/${u.id}`} className={`flex items-center justify-between p-5 rounded-2xl border transition-all group ${u.id === user?.id ? 'bg-indigo-600 text-white shadow-lg translate-x-2' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-left hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                             <div className="flex items-center gap-6">
                                <span className={`text-lg font-black w-8 ${u.id === user?.id ? 'text-white' : index < 3 ? 'text-indigo-500' : 'text-slate-300'}`}>#{index+1}</span>
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-indigo-600 overflow-hidden shadow-sm">
                                   {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                   <p className={`font-black truncate w-32 sm:w-auto group-hover:text-indigo-500 ${u.id === user?.id ? 'group-hover:text-white' : ''}`}>{u.name}</p>
                                   <p className={`text-[10px] font-bold uppercase ${u.id === user?.id ? 'text-indigo-200' : 'text-slate-400'}`}>{u.badge} • Cấp {u.level}</p>
                                </div>
                             </div>
                             <p className="font-black text-xl">{u.totalPoints}</p>
                           </Link>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6 max-w-3xl mx-auto w-full text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Thông báo hệ thống</h2>
                    {notifications.length > 0 && (
                      <button onClick={handleClearNotifications} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">
                        <Trash2 size={14} /> Dọn dẹp hòm thư
                      </button>
                    )}
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-6 rounded-[2rem] border transition-all ${!n.isRead ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-1 ring-indigo-500/20' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                      <h4 className="font-black text-lg mb-2">{n.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{n.message}</p>
                      {n.assignmentId && (
                        <button onClick={() => handleNotificationClick(n)} className="mt-4 w-full sm:w-auto px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800/50">
                           Xem chi tiết bài tập
                        </button>
                      )}
                      {n.senderId && (
                        <div className="mt-4 flex gap-2">
                          <input type="text" placeholder="Phản hồi Admin..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={replyText[n.id] || ''} onChange={(e) => setReplyText({ ...replyText, [n.id]: e.target.value })} />
                          <button onClick={() => handleReplyNotification(n.id)} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all"><Send size={14} /></button>
                        </div>
                      )}
                      <span className="block mt-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="text-center py-20 text-slate-400 font-bold italic">Hòm thư trống.</p>}
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

      {/* Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Trung tâm hỗ trợ</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gửi tin nhắn trực tiếp cho Admin</p>
                </div>
                <button onClick={() => setShowSupport(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 text-left">
                <form onSubmit={handleSendSupport} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Tên của bạn</label>
                      <input 
                        type="text" 
                        readOnly
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-500" 
                        value={supportData.name} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Email liên hệ</label>
                      <input 
                        type="email" 
                        readOnly
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-500" 
                        value={supportData.email} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Nội dung cần hỗ trợ</label>
                    <textarea 
                      placeholder="Chào Admin, mình gặp lỗi..." 
                      required 
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                      value={supportData.message} 
                      onChange={(e) => setSupportData({ ...supportData, message: e.target.value })} 
                    />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                    <Send size={18} /> GỬI TIN NHẮN
                  </button>
                  <a 
                    href="mailto:nglich.wvan006@gmail.com"
                    className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase hover:underline mt-2"
                  >
                    <Mail size={14} /> Hoặc gửi qua Email: nglich.wvan006@gmail.com
                  </a>
                </form>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-tighter">Lịch sử phản hồi</h4>
                    {isCheckingHistory && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  
                  {supportHistory.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <MessageCircle className="mx-auto mb-2 text-slate-300" size={32} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">Bạn chưa có tin nhắn hỗ trợ nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supportHistory.map((h) => (
                        <div key={h.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex justify-between items-start">
                             <p className="text-xs font-bold text-slate-700 dark:text-slate-300">"{h.message}"</p>
                             <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(h.createdAt).toLocaleDateString()}</span>
                          </div>
                          {h.reply ? (
                            <div className="pl-4 border-l-2 border-indigo-500 pt-1">
                              <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Admin phản hồi:</p>
                              <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-lg">
                                {h.reply}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 italic">
                              <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div> Đang chờ xử lý...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberDashboard;
