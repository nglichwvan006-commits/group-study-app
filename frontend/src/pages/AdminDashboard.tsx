import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User as UserIcon, Shield, BookOpen, MessageSquare, LogOut, Trash2, MicOff, Mic, Plus, FileText, Sun, Moon, Menu, X, Trophy, RefreshCw, RotateCcw, Ban } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'chat' | 'resources' | 'leaderboard'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' });

  // Notification form
  const [showSendNotification, setShowSendNotification] = useState<string | null>(null); // userId
  const [notificationData, setNotificationData] = useState({ title: '', message: '' });

  // Ban form
  const [showBanModal, setShowBanModal] = useState<string | null>(null); // userId
  const [banDate, setBanDate] = useState('');

  // Assignment form
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', language: 'javascript', maxScore: 100, rubric: '' });

  useEffect(() => {
    fetchUsers();
    fetchLeaderboard();
    fetchAssignments();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/ranking/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard', error);
    }
  };

  const handleRefreshData = () => {
    fetchUsers();
    fetchLeaderboard();
    fetchAssignments();
    toast.success('Đã làm mới dữ liệu!');
  };

  const handleSyncXP = async () => {
    const loadingToast = toast.loading('Đang đồng bộ lại điểm toàn hệ thống...');
    try {
      await api.post('/admin/sync-xp');
      toast.success('Đồng bộ điểm thành công!', { id: loadingToast });
      fetchUsers();
      fetchLeaderboard();
    } catch (error) {
      toast.error('Lỗi khi đồng bộ điểm', { id: loadingToast });
    }
  };

  const handleResetAllPoints = async () => {
    const password = window.prompt('NHẬP MẬT KHẨU XÁC NHẬN RESET TOÀN BỘ ĐIỂM (Cảnh báo: Hành động này không thể hoàn tác!):');
    if (!password) return;

    const loadingToast = toast.loading('Đang reset điểm toàn hệ thống...');
    try {
      await api.post('/admin/reset-all-points', { password });
      toast.success('Đã reset toàn bộ điểm số về 0!', { id: loadingToast });
      fetchUsers();
      fetchLeaderboard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi reset điểm', { id: loadingToast });
    }
  };

  const handleResetUserPoints = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn reset điểm của người dùng ${name} về 0?`)) {
      const loadingToast = toast.loading('Đang reset điểm...');
      try {
        await api.post(`/admin/users/${id}/reset-points`);
        toast.success(`Đã reset điểm của ${name}`, { id: loadingToast });
        fetchUsers();
        fetchLeaderboard();
      } catch (error) {
        toast.error('Lỗi khi reset điểm', { id: loadingToast });
      }
    }
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBanModal) return;

    const loadingToast = toast.loading('Đang thực hiện Ban...');
    try {
      await api.patch(`/admin/users/${showBanModal}/ban`, { bannedUntil: banDate });
      toast.success('Đã cập nhật trạng thái Ban tài khoản', { id: loadingToast });
      setShowBanModal(null);
      setBanDate('');
      fetchUsers();
    } catch (error) {
      toast.error('Lỗi khi Ban tài khoản', { id: loadingToast });
    }
  };

  const handleUnbanUser = async (id: string) => {
    const loadingToast = toast.loading('Đang mở khóa...');
    try {
      await api.patch(`/admin/users/${id}/ban`, { bannedUntil: null });
      toast.success('Đã mở khóa tài khoản', { id: loadingToast });
      fetchUsers();
    } catch (error) {
      toast.error('Lỗi khi mở khóa', { id: loadingToast });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang tạo tài khoản...');
    try {
      await api.post('/admin/users', newMember);
      fetchUsers();
      setShowAddMember(false);
      setNewMember({ name: '', email: '', password: '' });
      toast.success('Tạo tài khoản thành công!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi tạo tài khoản', { id: loadingToast });
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSendNotification) return;

    const loadingToast = toast.loading('Đang gửi thông báo...');
    try {
      await api.post('/admin/notifications', {
        userId: showSendNotification,
        ...notificationData
      });
      setShowSendNotification(null);
      setNotificationData({ title: '', message: '' });
      toast.success('Đã gửi thông báo!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi gửi thông báo', { id: loadingToast });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingAssignment ? 'Đang cập nhật bài tập...' : 'Đang tạo bài tập...');
    try {
      if (editingAssignment) {
        await api.patch(`/assignments/${editingAssignment.id}`, newAssignment);
        toast.success('Đã cập nhật bài tập!', { id: loadingToast });
      } else {
        await api.post('/assignments', newAssignment);
        toast.success('Bài tập đã được đăng!', { id: loadingToast });
      }
      fetchAssignments();
      setShowAddAssignment(false);
      setEditingAssignment(null);
      setNewAssignment({ title: '', description: '', deadline: '', language: 'javascript', maxScore: 100, rubric: '' });
    } catch (error) {
      toast.error('Lỗi thao tác bài tập', { id: loadingToast });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      const loadingToast = toast.loading('Đang xóa bài tập...');
      try {
        await api.delete(`/assignments/${id}`);
        fetchAssignments();
        toast.success('Đã xóa bài tập thành công!', { id: loadingToast });
      } catch (error) {
        toast.error('Lỗi khi xóa bài tập', { id: loadingToast });
      }
    }
  };

  const handleEditAssignment = (a: any) => {
    setEditingAssignment(a);
    setNewAssignment({
      title: a.title,
      description: a.description,
      deadline: new Date(a.deadline).toISOString().slice(0, 16),
      language: a.language,
      maxScore: a.maxScore,
      rubric: a.rubric,
    });
    setShowAddAssignment(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      const loadingToast = toast.loading('Đang xóa...');
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
        toast.success('Đã xóa người dùng', { id: loadingToast });
      } catch (error) {
        toast.error('Lỗi khi xóa người dùng', { id: loadingToast });
      }
    }
  };

  const handleToggleMute = async (id: string, isMuted: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/mute`, { isMuted: !isMuted });
      fetchUsers();
      toast.success(isMuted ? 'Đã bỏ cấm chat' : 'Đã cấm chat');
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
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
            <Shield className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
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
              <Shield className="text-indigo-600" size={24} /> Admin
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{user?.name}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem id="users" icon={UserIcon} label="Quản lý người dùng" />
          <NavItem id="assignments" icon={BookOpen} label="Bài tập" />
          <NavItem id="leaderboard" icon={Trophy} label="Bảng xếp hạng" />
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
          {/* Header Actions */}
          <div className="flex justify-end mb-4">
             <button onClick={handleRefreshData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                Làm mới dữ liệu
             </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Người dùng</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleResetAllPoints}
                        className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/25 transform hover:scale-105 active:scale-95 font-semibold text-sm"
                      >
                        <RotateCcw size={18} /> Reset All Points
                      </button>
                      <button
                        onClick={handleSyncXP}
                        className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 transform hover:scale-105 active:scale-95 font-semibold text-sm"
                      >
                        <RefreshCw size={18} /> Đồng bộ điểm
                      </button>
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 transform hover:scale-105 active:scale-95 font-semibold text-sm"
                      >
                        <Plus size={18} /> Thêm thành viên
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Tên / Điểm</th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Email</th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-right">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                          {users.map((u, index) => (
                            <motion.tr 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              key={u.id} 
                              className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{u.totalPoints} PTS • Cấp {u.level}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {u.bannedUntil && new Date(u.bannedUntil) > new Date() ? (
                                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[10px] font-black uppercase bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full w-fit border border-red-100 dark:border-red-500/20">
                                      <Ban size={10} /> Bị khóa đến {new Date(u.bannedUntil).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit border border-emerald-100 dark:border-emerald-500/20">
                                      <Shield size={10} /> Hoạt động
                                    </span>
                                  )}
                                  {u.isMuted && (
                                    <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase bg-amber-50 px-2 py-0.5 rounded-full w-fit border border-amber-100">
                                      <MicOff size={10} /> Cấm Chat
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => setShowSendNotification(u.id)} title="Gửi thông báo" className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg transition-all">
                                    <MessageSquare size={16} />
                                  </button>
                                  <button onClick={() => handleResetUserPoints(u.id, u.name)} title="Reset điểm User" className="p-2 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 rounded-lg transition-all">
                                    <RotateCcw size={16} />
                                  </button>
                                  <button onClick={() => u.bannedUntil && new Date(u.bannedUntil) > new Date() ? handleUnbanUser(u.id) : setShowBanModal(u.id)} title={u.bannedUntil ? 'Mở khóa' : 'Ban tài khoản'} className={`p-2 rounded-lg transition-all ${u.bannedUntil && new Date(u.bannedUntil) > new Date() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700 dark:bg-red-500/10'}`}>
                                    <Ban size={16} />
                                  </button>
                                  <button onClick={() => handleToggleMute(u.id, u.isMuted)} title={u.isMuted ? 'Bỏ cấm chat' : 'Cấm chat'} className={`p-2 rounded-lg transition-all ${u.isMuted ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700 dark:bg-slate-800'}`}>
                                    {u.isMuted ? <Mic size={16} /> : <MicOff size={16} />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} title="Xóa vĩnh viễn" className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-all">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {isLoading && <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium animate-pulse">Đang tải dữ liệu...</div>}
                  </div>

                  {/* Ban Modal */}
                  <AnimatePresence>
                    {showBanModal && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
                           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Ban size={32} />
                           </div>
                           <h3 className="text-xl font-bold mb-2">Ban tài khoản</h3>
                           <p className="text-slate-500 text-sm mb-6">Chọn ngày mở khóa cho tài khoản này.</p>
                           <form onSubmit={handleBanUser} className="space-y-4">
                              <input type="date" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={banDate} onChange={(e) => setBanDate(e.target.value)} />
                              <div className="flex gap-3 pt-2">
                                 <button type="button" onClick={() => setShowBanModal(null)} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold">Hủy</button>
                                 <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20">Xác nhận Ban</button>
                              </div>
                           </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Notification Modal */}
                  <AnimatePresence>
                    {showSendNotification && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-500"/> Gửi thông báo hệ thống</h3>
                           <form onSubmit={handleSendNotification} className="space-y-4">
                              <input type="text" placeholder="Tiêu đề" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={notificationData.title} onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })} />
                              <textarea placeholder="Nội dung thông báo..." required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" rows={4} value={notificationData.message} onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}></textarea>
                              <div className="flex justify-end gap-3 pt-2">
                                 <button type="button" onClick={() => setShowSendNotification(null)} className="px-5 py-2.5 text-slate-500 font-bold">Hủy</button>
                                 <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Gửi thông báo</button>
                              </div>
                           </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Rest of tabs remain same, just ensure they are included */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bài tập (Lập trình)</h2>
                    <button onClick={() => setShowAddAssignment(!showAddAssignment)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 font-semibold">
                      <Plus size={20} /> Tạo bài tập
                    </button>
                  </div>
                  {/* ... Assignments mapping ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((a) => (
                      <motion.div key={a.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between mb-4">
                           <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{a.language}</span>
                           <div className="flex gap-2">
                              <button onClick={() => handleEditAssignment(a)} className="text-slate-400 hover:text-indigo-500"><Plus size={16} className="rotate-45" /></button>
                              <button onClick={() => handleDeleteAssignment(a.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                           </div>
                        </div>
                        <h3 className="font-bold text-lg mb-2 truncate">{a.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{a.description}</p>
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400">
                           <span>DATE: {new Date(a.deadline).toLocaleDateString()}</span>
                           <span className="text-indigo-500">{a.maxScore} PTS</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bảng vàng</h2>
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/20 dark:border-slate-800/50 p-6">
                    {leaderboard.map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                         <div className="flex items-center gap-4">
                            <span className="font-black text-slate-300 w-6">#{i+1}</span>
                            <div>
                               <p className="font-bold">{u.name}</p>
                               <p className="text-[10px] uppercase font-black text-slate-400">{u.badge} • Cấp bậc {u.level}</p>
                            </div>
                         </div>
                         <p className="font-black text-indigo-600">{u.totalPoints} PTS</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'resources' && <ResourceLibrary />}
              {activeTab === 'chat' && <div className="h-[650px] bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"><Chat /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
