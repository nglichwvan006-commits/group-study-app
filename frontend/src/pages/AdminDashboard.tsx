import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Shield, BookOpen, MessageSquare, LogOut, Trash2, MicOff, Mic, Plus, FileText, Sun, Moon, Menu, X, Trophy } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'chat' | 'resources' | 'leaderboard'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' });

  // Notification form
  const [showSendNotification, setShowSendNotification] = useState<string | null>(null); // userId
  const [notificationData, setNotificationData] = useState({ title: '', message: '' });

  // Assignment form
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', language: 'javascript', maxScore: 100, rubric: '' });

  useEffect(() => {
    fetchUsers();
    fetchLeaderboard();
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

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/ranking/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard', error);
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
    const loadingToast = toast.loading('Đang tạo bài tập...');
    try {
      await api.post('/assignments', newAssignment);
      toast.success('Bài tập đã được đăng!', { id: loadingToast });
      setShowAddAssignment(false);
      setNewAssignment({ title: '', description: '', deadline: '', language: 'javascript', maxScore: 100, rubric: '' });
    } catch (error) {
      toast.error('Lỗi khi tạo bài tập', { id: loadingToast });
    }
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
          <NavItem id="users" icon={User} label="Quản lý người dùng" />
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
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 transform hover:scale-105 active:scale-95 font-semibold"
                    >
                      <Plus size={20} /> Thêm thành viên
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800/50 mb-6">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-indigo-500" /> Tạo tài khoản thành viên mới
                          </h3>
                          <form onSubmit={handleCreateMember} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <input type="text" placeholder="Họ tên" required className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                            <input type="email" placeholder="Email" required className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
                            <input type="password" placeholder="Mật khẩu" required className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
                            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                              <button type="button" onClick={() => setShowAddMember(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">Hủy</button>
                              <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md shadow-indigo-500/20">Tạo tài khoản</button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Tên</th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Email</th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Vai trò</th>
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
                              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{u.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  u.role === 'ADMIN' ? 'bg-purple-100/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 'bg-blue-100/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {u.isMuted ? (
                                  <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-sm font-medium bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full w-fit">
                                    <MicOff size={14} /> Bị cấm
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                                    <Mic size={14} /> Hoạt động
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setShowSendNotification(u.id)} title="Gửi thông báo" className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl transition-all">
                                    <MessageSquare size={16} />
                                  </button>
                                  <button onClick={() => handleToggleMute(u.id, u.isMuted)} title={u.isMuted ? 'Bỏ cấm' : 'Cấm chat'} className={`p-2 rounded-xl transition-all ${u.isMuted ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                    {u.isMuted ? <Mic size={16} /> : <MicOff size={16} />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} title="Xóa" className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 rounded-xl transition-all">
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

                  {/* Notification Modal */}
                  <AnimatePresence>
                    {showSendNotification && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-500"/> Gửi thông báo đến {users.find(u => u.id === showSendNotification)?.name}</h3>
                           <form onSubmit={handleSendNotification} className="space-y-4">
                              <input type="text" placeholder="Tiêu đề thông báo" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={notificationData.title} onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })} />
                              <textarea placeholder="Nội dung tin nhắn..." required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={notificationData.message} onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}></textarea>
                              <div className="flex justify-end gap-3 pt-2">
                                 <button type="button" onClick={() => setShowSendNotification(null)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Hủy</button>
                                 <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">Gửi ngay</button>
                              </div>
                           </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bảng xếp hạng</h2>
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden p-6">
                    {leaderboard.length === 0 ? (
                      <p className="text-slate-500 text-center py-10">Chưa có thành viên nào trên bảng xếp hạng.</p>
                    ) : (
                      <ul className="space-y-4">
                        {leaderboard.map((u, index) => (
                          <li key={u.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <div className="flex items-center gap-4">
                              <span className={`text-xl font-black w-8 text-center ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-300'}`}>#{index + 1}</span>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-xs text-slate-500">Cấp độ {u.level} • Huy hiệu: {u.badge}</p>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{u.totalPoints} <span className="text-sm font-medium text-slate-400">pts</span></div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-6 h-full flex flex-col">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kho tài liệu</h2>
                  <ResourceLibrary />
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bài tập (Lập trình)</h2>
                    <button onClick={() => setShowAddAssignment(!showAddAssignment)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 font-semibold">
                      <Plus size={20} /> Tạo bài tập
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddAssignment && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20 dark:border-slate-800/50 mb-6">
                          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2"><BookOpen className="text-indigo-500"/> Thiết lập bài tập chấm điểm bằng AI</h3>
                          <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu đề</label>
                              <input type="text" required className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả & Yêu cầu đề bài</label>
                              <textarea required className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" rows={4} value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}></textarea>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngôn ngữ (VD: javascript, python)</label>
                              <input type="text" className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newAssignment.language} onChange={(e) => setNewAssignment({ ...newAssignment, language: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Điểm tối đa</label>
                              <input type="number" required className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) })} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu chí chấm điểm (Rubric cho AI)</label>
                              <textarea required className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" rows={2} value={newAssignment.rubric} onChange={(e) => setNewAssignment({ ...newAssignment, rubric: e.target.value })}></textarea>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hạn nộp</label>
                              <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 color-scheme-light dark:color-scheme-dark" value={newAssignment.deadline} onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                              <button type="button" onClick={() => setShowAddAssignment(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">Hủy bỏ</button>
                              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95">Đăng bài tập</button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-10 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 h-64 border-dashed">
                      <BookOpen size={48} className="mb-4 opacity-30" />
                      <p className="font-medium">Vui lòng tải lại hoặc xem danh sách bài tập (sẽ hiển thị ở đây).</p>
                    </div>
                  </div>
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

export default AdminDashboard;
