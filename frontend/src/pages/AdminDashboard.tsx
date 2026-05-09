import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Shield, BookOpen, MessageSquare, LogOut, Trash2, MicOff, Mic, Plus, FileText, Sun, Moon } from 'lucide-react';
import Chat from '../components/Chat';
import ResourceLibrary from '../components/ResourceLibrary';

const AdminDashboard: React.FC = () => {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'chat' | 'resources'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' });

  // Assignment form
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newMember);
      fetchUsers();
      setShowAddMember(false);
      setNewMember({ name: '', email: '', password: '' });
    } catch (error) {
      alert('Error creating member');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', newAssignment);
      alert('Assignment created!');
      setShowAddAssignment(false);
      setNewAssignment({ title: '', description: '', deadline: '' });
    } catch (error) {
      alert('Error creating assignment');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  const handleToggleMute = async (id: string, isMuted: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/mute`, { isMuted: !isMuted });
      fetchUsers();
    } catch (error) {
      alert('Error updating mute status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <Shield size={24} /> Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <User size={20} /> Quản lý người dùng
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'assignments' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen size={20} /> Bài tập
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
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h2>
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} /> Thêm thành viên
              </button>
            </div>

            {showAddMember && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Tạo tài khoản thành viên mới</h3>
                <form onSubmit={handleCreateMember} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Họ tên"
                    required
                    className="px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className="px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    required
                    className="px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  />
                  <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Tạo tài khoản
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tên</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Vai trò</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 dark:text-white">{u.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isMuted ? (
                          <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                            <MicOff size={14} /> Bị cấm chat
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                            <Mic size={14} /> Đang hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleMute(u.id, u.isMuted)}
                            title={u.isMuted ? 'Bỏ cấm' : 'Cấm chat'}
                            className={`p-2 rounded-lg transition-colors ${
                              u.isMuted ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            }`}
                          >
                            {u.isMuted ? <Mic size={18} /> : <MicOff size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="Xóa"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoading && <div className="p-8 text-center text-slate-500 dark:text-slate-400">Đang tải danh sách...</div>}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kho tài liệu</h2>
            <ResourceLibrary />
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bài tập</h2>
              <button
                onClick={() => setShowAddAssignment(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} /> Tạo bài tập
              </button>
            </div>

            {showAddAssignment && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Tạo bài tập mới</h3>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tiêu đề</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
                    <textarea
                      required
                      className="mt-1 block w-full px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hạn chót</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddAssignment(false)}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Đăng bài tập
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 h-40 italic">
                Chưa có danh sách bài tập...
              </div>
            </div>
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

export default AdminDashboard;
