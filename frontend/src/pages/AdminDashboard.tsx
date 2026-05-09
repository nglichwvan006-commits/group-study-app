import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Shield, BookOpen, MessageSquare, LogOut, Trash2, MicOff, Mic, AlertTriangle, Plus } from 'lucide-react';
import Chat from '../components/Chat';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'chat'>('users');
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <Shield size={24} /> Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User size={20} /> User Management
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'assignments' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={20} /> Assignments
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={20} /> Group Chat
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} /> Add Member
              </button>
            </div>

            {showAddMember && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-semibold mb-4">Create New Member Account</h3>
                <form onSubmit={handleCreateMember} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  />
                  <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isMuted ? (
                          <span className="flex items-center gap-1 text-red-500 text-sm">
                            <MicOff size={14} /> Muted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-500 text-sm">
                            <Mic size={14} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleMute(u.id, u.isMuted)}
                            title={u.isMuted ? 'Unmute' : 'Mute'}
                            className={`p-2 rounded-lg transition-colors ${
                              u.isMuted ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {u.isMuted ? <Mic size={18} /> : <MicOff size={18} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoading && <div className="p-8 text-center text-slate-500">Loading users...</div>}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
              <button
                onClick={() => setShowAddAssignment(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} /> Create Assignment
              </button>
            </div>

            {showAddAssignment && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Title</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-4 py-2 border rounded-lg"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      required
                      className="mt-1 block w-full px-4 py-2 border rounded-lg"
                      rows={3}
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full px-4 py-2 border rounded-lg"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddAssignment(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Post Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* List of assignments would go here */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 h-40">
                Assignments list implementation...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Group Chat</h2>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <Chat />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
