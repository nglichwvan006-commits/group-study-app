import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User as UserIcon, Shield, BookOpen, MessageSquare, LogOut, Trash2, MicOff, Mic, Plus, FileText, Sun, Moon, Menu, X, Trophy, RefreshCw, RotateCcw, Ban, Sparkles, Clock, Key, Search, Settings as SettingsIcon } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'chat' | 'resources' | 'leaderboard' | 'posts' | 'support' | 'settings'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Settings State
  const [settings, setSettings] = useState<any>({});
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);

  // Post form
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '' });
  const [isPosting, setIsPosting] = useState(false);

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
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', maxScore: 100 });
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  // Support State
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [replyData, setReplyData] = useState({ id: '', reply: '' });
  
  useEffect(() => {
    fetchUsers();
    fetchLeaderboard();
    fetchAssignments();
    fetchSupportMessages();
    fetchSettings();
  }, []);

  const fetchSupportMessages = async () => {
    try {
      const res = await api.get('/support');
      setSupportMessages(res.data);
    } catch (error) {
      console.error('Error fetching support messages');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Error fetching settings');
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    setIsUpdatingSetting(true);
    try {
      await api.patch('/admin/settings', { key, value });
      setSettings((prev: any) => ({ ...prev, [key]: String(value) }));
      toast.success('Đã cập nhật cài đặt hệ thống!');
    } catch (error) {
      toast.error('Lỗi khi cập nhật cài đặt');
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const handleReplySupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang gửi phản hồi...');
    try {
      await api.patch(`/support/${replyData.id}/reply`, { reply: replyData.reply });
      toast.success('Đã gửi phản hồi thành công!', { id: loadingToast });
      setReplyData({ id: '', reply: '' });
      fetchSupportMessages();
    } catch (error) {
      toast.error('Lỗi khi gửi phản hồi', { id: loadingToast });
    }
  };

  const handleSelectAllAssignments = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map(a => a.id));
    }
  };

  const handleToggleAssignmentSelection = (id: string) => {
    setSelectedAssignments(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedAssignments.length} bài tập đã chọn?`)) return;

    const loadingToast = toast.loading(`Đang xóa ${selectedAssignments.length} bài tập...`);
    try {
      await api.post('/assignments/bulk-delete', { ids: selectedAssignments });
      toast.success('Đã xóa thành công!', { id: loadingToast });
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (error) {
      toast.error('Lỗi khi xóa hàng loạt', { id: loadingToast });
    }
  };

  const handleBulkHide = async (isHidden: boolean) => {
    if (selectedAssignments.length === 0) return;
    const loadingToast = toast.loading(`Đang ${isHidden ? 'ẩn' : 'hiện'} ${selectedAssignments.length} bài tập...`);
    try {
      await api.post('/assignments/bulk-hide', { ids: selectedAssignments, isHidden });
      toast.success('Đã cập nhật trạng thái!', { id: loadingToast });
      setSelectedAssignments([]);
      fetchAssignments();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái', { id: loadingToast });
    }
  };

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
    fetchSettings();
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

  const handleResetPassword = async (id: string) => {
    const newPassword = window.prompt('Nhập mật khẩu mới cho người dùng:');
    if (!newPassword || newPassword.trim().length < 6) {
      if (newPassword !== null) toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    const loadingToast = toast.loading('Đang đổi mật khẩu...');
    try {
      await api.patch(`/admin/users/${id}/password`, { password: newPassword });
      toast.success('Đã đổi mật khẩu thành công!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi đổi mật khẩu', { id: loadingToast });
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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
    const loadingToast = toast.loading(editingAssignment ? 'Đang cập nhật bài tập...' : 'Đang đăng bài tập...');

    try {
      if (editingAssignment) {
        await api.patch(`/assignments/${editingAssignment.id}`, newAssignment);
        toast.success('Đã cập nhật bài tập!', { id: loadingToast });
      } else {
        await api.post('/assignments', newAssignment);
        toast.success('Bài tập đã được đăng thành công!', { id: loadingToast });
      }
      setNewAssignment({ title: '', description: '', deadline: '', maxScore: 100 });
      fetchAssignments();
      setShowAddAssignment(false);
      setEditingAssignment(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi thao tác bài tập', { id: loadingToast });
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
      maxScore: a.maxScore,
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setIsPosting(true);
    const loadingToast = toast.loading('Đang đăng bài lên cộng đồng...');
    try {
      await api.post('/posts', newPost);
      setNewPost({ content: '', imageUrl: '' });
      toast.success('Đã đăng bài thành công và tự động ghim!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi đăng bài', { id: loadingToast });
    } finally {
      setIsPosting(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex transition-colors duration-500 overflow-hidden font-sans">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>
      <motion.div className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 md:p-8 pt-8">
           <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" /> Gõ Thủng Bàn Phím
           </h1>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hệ thống Quản trị</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem id="users" icon={UserIcon} label="Quản lý người dùng" />
          <NavItem id="assignments" icon={BookOpen} label="Hệ thống bài tập" />
          <NavItem id="posts" icon={Plus} label="Đăng tin cộng đồng" />
          <NavItem id="leaderboard" icon={Trophy} label="Bảng xếp hạng" />
          <NavItem id="resources" icon={FileText} label="Kho tài liệu" />
          <NavItem id="chat" icon={MessageSquare} label="Phòng chat" />
          <NavItem id="support" icon={Shield} label="Hỗ trợ khách" />
          <NavItem id="settings" icon={SettingsIcon} label="Cài đặt hệ thống" />
        </nav>
        <div className="p-4 m-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-xs">{darkMode ? <><Sun size={16} className="text-amber-500" /> Sáng</> : <><Moon size={16} className="text-indigo-500" /> Tối</>}</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-xs"><LogOut size={16} /> Đăng xuất</button>
        </div>
      </motion.div>

      <div className="flex-1 h-screen overflow-y-auto relative pt-16 md:pt-0">
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
           <div className="flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
             <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Gõ Thủng Bàn Phím</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={24} /></button>
        </div>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col h-full">
          <div className="flex justify-end mb-4">
             <button onClick={handleRefreshData} className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">Làm mới dữ liệu</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
              {activeTab === 'posts' && (
                <div className="max-w-3xl mx-auto space-y-6 text-left">
                   <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Đăng tin cộng đồng</h2>
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                      <form onSubmit={handleCreatePost} className="space-y-6">
                         <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nội dung bài viết</label>
                            <textarea 
                              required 
                              placeholder="Thông báo: Ngày mai hệ thống sẽ bảo trì..." 
                              className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                              rows={8} 
                              value={newPost.content} 
                              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                            ></textarea>
                         </div>
                         <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Đường dẫn ảnh (Tùy chọn)</label>
                            <input 
                              type="text" 
                              placeholder="https://example.com/image.png" 
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                              value={newPost.imageUrl} 
                              onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                            />
                         </div>
                         <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2">
                               📌 Ghi chú: Bài viết của Admin sẽ tự động được ghim lên đầu bảng tin và hiển thị danh tính Admin.
                            </p>
                         </div>
                         <button 
                           type="submit" 
                           disabled={isPosting || !newPost.content.trim()} 
                           className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                         >
                            {isPosting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG BÀI NGAY'}
                         </button>
                      </form>
                   </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Người dùng</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button onClick={handleResetAllPoints} className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><RotateCcw size={18} /> RESET TẤT CẢ ĐIỂM</button>
                      <button onClick={handleSyncXP} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><RefreshCw size={18} /> ĐỒNG BỘ ĐIỂM</button>
                      <button onClick={() => setShowAddMember(true)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><Plus size={18} /> THÊM THÀNH VIÊN</button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1 w-full">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         placeholder="Tìm kiếm theo tên hoặc email..." 
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                         value={userSearch}
                         onChange={(e) => setUserSearch(e.target.value)}
                       />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Đang hiển thị {filteredUsers.length} / {users.length} thành viên</p>
                  </div>

                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
                        <h3 className="font-bold mb-4">Tạo thành viên mới</h3>
                        <form onSubmit={handleCreateMember} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <input type="text" placeholder="Họ tên" required className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-indigo-500" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
                           <input type="email" placeholder="Email" required className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-indigo-500" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
                           <input type="password" placeholder="Mật khẩu" required className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-indigo-500" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} />
                           <div className="md:col-span-3 flex justify-end gap-2"><button type="button" onClick={() => setShowAddMember(false)} className="px-5 py-2 text-slate-500">Hủy</button><button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold">Tạo ngay</button></div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Tên / Điểm</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Email</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredUsers.map((u, i) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                              <td className="px-6 py-4 whitespace-nowrap"><p className="font-bold">{u.name}</p><p className="text-[10px] font-black text-indigo-500 uppercase">{u.totalPoints} PTS • CẤP {u.level}</p></td>
                              <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                   {u.bannedUntil && new Date(u.bannedUntil) > new Date() ? <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase border border-red-100">BỊ KHÓA ({new Date(u.bannedUntil).toLocaleDateString()})</span> : <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-100">HOẠT ĐỘNG</span>}
                                   {u.isMuted && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase border border-amber-100">CẤM CHAT</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={() => setShowSendNotification(u.id)} title="Gửi thông báo" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><MessageSquare size={16}/></button>
                                    <button onClick={() => handleResetPassword(u.id)} title="Đổi mật khẩu" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Key size={16}/></button>
                                    <button onClick={() => handleResetUserPoints(u.id, u.name)} title="Reset điểm" className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"><RotateCcw size={16}/></button>
                                    <button onClick={() => u.bannedUntil && new Date(u.bannedUntil) > new Date() ? handleUnbanUser(u.id) : setShowBanModal(u.id)} title="Khóa tài khoản" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Ban size={16}/></button>
                                    <button onClick={() => handleToggleMute(u.id, u.isMuted)} title="Cấm chat" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">{u.isMuted ? <Mic size={16}/> : <MicOff size={16}/>}</button>
                                    <button onClick={() => handleDeleteUser(u.id)} title="Xóa vĩnh viễn" className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-bold">Không tìm thấy người dùng nào phù hợp.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Bài tập Lập trình</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {selectedAssignments.length > 0 && (
                        <>
                          <button onClick={handleBulkDelete} className="flex-1 sm:flex-none bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><Trash2 size={16} /> XÓA ({selectedAssignments.length})</button>
                          <button onClick={() => handleBulkHide(true)} className="flex-1 sm:flex-none bg-slate-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><MicOff size={16} /> ẨN</button>
                          <button onClick={() => handleBulkHide(false)} className="flex-1 sm:flex-none bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-xs"><Mic size={16} /> HIỆN</button>
                        </>
                      )}
                      <button onClick={() => setShowAddAssignment(!showAddAssignment)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg font-bold text-xs hover:bg-indigo-700 transition-all"><Plus size={20} /> TẠO BÀI TẬP</button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAddAssignment && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                           <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> {editingAssignment ? 'Cập nhật bài tập' : 'Tạo thử thách mới'}</h3>
                        </div>

                        <form onSubmit={handleCreateAssignment} className="space-y-5">
                               <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Tiêu đề bài tập</label>
                                  <input type="text" required className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} />
                               </div>
                               <div>
                                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Mô tả nội dung & Yêu cầu</label>
                                  <textarea required className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" rows={5} value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}></textarea>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-xs font-black text-slate-400 uppercase mb-2">Điểm tối đa</label>
                                     <input type="number" required className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({...newAssignment, maxScore: parseInt(e.target.value)})} />
                                  </div>
                                  <div>
                                     <label className="block text-xs font-black text-slate-400 uppercase mb-2">Hạn nộp</label>
                                     <input type="datetime-local" required className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newAssignment.deadline} onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})} />
                                  </div>
                               </div>
                           <div className="flex justify-end gap-3 pt-4">
                             <button type="button" onClick={() => { setShowAddAssignment(false); setEditingAssignment(null); }} className="px-8 py-3 text-slate-500 font-bold">HỦY</button>
                             <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
                               {editingAssignment ? 'CẬP NHẬT' : 'ĐĂNG BÀI TẬP'}
                             </button>
                           </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4 w-10">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                                checked={assignments.length > 0 && selectedAssignments.length === assignments.length}
                                onChange={handleSelectAllAssignments}
                              />
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Tiêu đề / Độ khó</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Điểm tối đa</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Hạn nộp</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {assignments.map((a) => (
                            <tr key={a.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all ${selectedAssignments.includes(a.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                                  checked={selectedAssignments.includes(a.id)}
                                  onChange={() => handleToggleAssignmentSelection(a.id)}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-sm">{a.title}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  a.difficulty === 'Master' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                  a.difficulty === 'Khó' ? 'bg-red-50 text-red-600 border-red-100' :
                                  a.difficulty === 'Khá' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>{a.difficulty || 'TB'}</span>
                              </td>
                              <td className="px-6 py-4 font-black text-indigo-600 text-sm">{a.maxScore} PTS</td>
                              <td className="px-6 py-4 text-xs text-slate-500">{new Date(a.deadline).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                {a.isHidden ? (
                                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">ĐANG ẨN</span>
                                ) : (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-100">HIỂN THỊ</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={() => handleEditAssignment(a)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Plus size={14} className="rotate-45"/></button>
                                    <button onClick={() => handleDeleteAssignment(a.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={14}/></button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                          {assignments.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">Không có bài tập nào.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="space-y-6 text-left">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Bảng xếp hạng hệ thống</h2>
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden p-6 sm:p-10">
                    <div className="space-y-4">
                       {leaderboard.map((u, i) => (
                         <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all">
                            <div className="flex items-center gap-6">
                               <span className={`text-xl font-black w-8 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'}`}>#{i+1}</span>
                               <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">{u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-2 text-slate-300"/>}</div>
                                  <div><p className="font-bold">{u.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.badge} • CẤP BẬC {u.level}</p></div>
                               </div>
                            </div>
                            <p className="font-black text-2xl text-indigo-600">{u.totalPoints}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && <ResourceLibrary />}
              {activeTab === 'chat' && (
                <div className="h-[650px] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-0"><Chat /></div>
              )}

              {activeTab === 'support' && (
                <div className="space-y-6 text-left">
                   <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Hỗ trợ khách hàng</h2>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Danh sách tin nhắn</h3>
                         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                               {supportMessages.length === 0 ? (
                                 <p className="p-10 text-center text-slate-400 font-bold italic">Không có tin nhắn hỗ trợ nào.</p>
                               ) : (
                                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {supportMessages.map((m) => (
                                      <div key={m.id} onClick={() => setReplyData({ id: m.id, reply: m.reply || '' })} className={`p-6 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${replyData.id === m.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                                         <div className="flex justify-between items-start mb-2">
                                            <div>
                                               <p className="font-bold text-sm">{m.name}</p>
                                               <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${m.status === 'REPLIED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                               {m.status === 'REPLIED' ? 'ĐÃ PHẢN HỒI' : 'CHỜ XỬ LÝ'}
                                            </span>
                                         </div>
                                         <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">"{m.message}"</p>
                                         <p className="text-[8px] text-slate-400 mt-2">{new Date(m.createdAt).toLocaleString()}</p>
                                      </div>
                                    ))}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Phản hồi tin nhắn</h3>
                         {replyData.id ? (
                           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 sticky top-4">
                              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                 <p className="text-[10px] font-black text-indigo-500 uppercase mb-2">Nội dung khách gửi:</p>
                                 <p className="text-sm italic text-slate-600 dark:text-slate-400">"{supportMessages.find(m => m.id === replyData.id)?.message}"</p>
                              </div>
                              <form onSubmit={handleReplySupport} className="space-y-6">
                                 <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 px-1">Nội dung phản hồi</label>
                                    <textarea 
                                       required 
                                       placeholder="Chào bạn, vấn đề của bạn đã được giải quyết..." 
                                       className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                                       rows={10} 
                                       value={replyData.reply} 
                                       onChange={(e) => setReplyData({...replyData, reply: e.target.value})}
                                    ></textarea>
                                 </div>
                                 <div className="flex gap-3">
                                    <button type="button" onClick={() => setReplyData({ id: '', reply: '' })} className="flex-1 py-4 text-slate-500 font-bold">HỦY</button>
                                    <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all">GỬI PHẢN HỒI</button>
                                 </div>
                              </form>
                           </div>
                         ) : (
                           <div className="bg-white/50 dark:bg-slate-900/50 p-20 rounded-[2.5rem] text-center border-4 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                              Chọn một tin nhắn bên trái để xem chi tiết và phản hồi.
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-8 text-left">
                   <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">Cài đặt hệ thống</h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center opacity-60">
                         <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                            <Plus size={24} />
                         </div>
                         <p className="text-xs font-bold text-slate-400 italic">Thêm cài đặt mới trong tương lai...</p>
                      </div>
                   </div>

                   <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/10">
                      <p className="text-[11px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                         ⚠️ <strong>Lưu ý quan trọng:</strong> Các thay đổi trong phần Cài đặt hệ thống sẽ có hiệu lực ngay lập tức cho toàn bộ người dùng trên nền tảng. Hãy cân nhắc kỹ trước khi thay đổi các cấu hình quan trọng.
                      </p>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Admin Modals (Ban & Notification) - Keep same as before */}
      <AnimatePresence>
        {showBanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl text-center">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Ban size={32} /></div>
               <h3 className="text-xl font-bold mb-2">Ban tài khoản</h3>
               <p className="text-slate-500 text-sm mb-6">Chọn ngày mở khóa cho tài khoản này.</p>
               <form onSubmit={handleBanUser} className="space-y-4">
                  <input type="date" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={banDate} onChange={(e) => setBanDate(e.target.value)} />
                  <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowBanModal(null)} className="flex-1 py-3 text-slate-600 font-bold">Hủy</button><button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">XÁC NHẬN BAN</button></div>
               </form>
            </motion.div>
          </div>
        )}
        {showSendNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-indigo-500"/> Gửi thông báo hệ thống</h3>
               <form onSubmit={handleSendNotification} className="space-y-4">
                  <input type="text" placeholder="Tiêu đề" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={notificationData.title} onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })} />
                  <textarea placeholder="Nội dung thông báo..." required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" rows={4} value={notificationData.message} onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}></textarea>
                  <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowSendNotification(null)} className="px-5 py-2.5 text-slate-500 font-bold">Hủy</button><button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Gửi ngay</button></div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
