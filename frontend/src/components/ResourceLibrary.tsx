import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Link as LinkIcon, Plus, Trash2, ExternalLink, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ResourceLibrary: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', url: '', type: 'LINK' });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/resources');
      setResources(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách tài liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang thêm tài liệu...');
    try {
      await api.post('/resources', newResource);
      fetchResources();
      setShowAddModal(false);
      setNewResource({ title: '', url: '', type: 'LINK' });
      toast.success('Thêm tài liệu thành công!', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi thêm tài liệu', { id: loadingToast });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    const loadingToast = toast.loading('Đang xóa...');
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
      toast.success('Đã xóa tài liệu', { id: loadingToast });
    } catch (error) {
      toast.error('Lỗi khi xóa tài liệu', { id: loadingToast });
    }
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-sm">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 transform hover:scale-105 active:scale-95 font-semibold"
        >
          <Plus size={20} /> Thêm tài liệu
        </button>
      </div>

      {/* Modal Add Resource */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-slate-800 relative z-10"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Thêm tài liệu mới</h3>
              
              <form onSubmit={handleAddResource} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu đề</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại tài liệu</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                    value={newResource.type}
                    onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                  >
                    <option value="LINK">Liên kết (URL / Web)</option>
                    <option value="FILE">Tệp tin (Link tải Drive/Dropbox...)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đường dẫn (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-transform transform hover:scale-105 active:scale-95"
                  >
                    Lưu tài liệu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredResources.map((res, index) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              key={res.id} 
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3.5 rounded-2xl ${
                  res.type === 'LINK' 
                    ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 shadow-inner' 
                    : 'bg-gradient-to-br from-orange-500/10 to-rose-500/10 text-orange-600 dark:text-orange-400 shadow-inner'
                }`}>
                  {res.type === 'LINK' ? <LinkIcon size={24} /> : <FileText size={24} />}
                </div>
                {(res.userId === user?.id || user?.role === 'ADMIN') && (
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-2.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Xóa tài liệu"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white line-clamp-2 mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{res.title}</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5 uppercase tracking-wider">
                  Bởi <span className="text-slate-700 dark:text-slate-300">{res.user.name}</span>
                </p>
              </div>

              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800 group/btn"
              >
                Mở tài liệu <ExternalLink size={16} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredResources.length === 0 && !isLoading && (
          <div className="col-span-full py-24 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <FileText size={56} className="mx-auto mb-6 opacity-20 text-indigo-500" />
            </motion.div>
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Không tìm thấy tài liệu nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
