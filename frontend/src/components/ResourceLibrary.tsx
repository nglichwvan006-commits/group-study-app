import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Link as LinkIcon, Plus, Trash2, ExternalLink, Search } from 'lucide-react';

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
      console.error('Error fetching resources', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/resources', newResource);
      fetchResources();
      setShowAddModal(false);
      setNewResource({ title: '', url: '', type: 'LINK' });
    } catch (error) {
      alert('Lỗi khi thêm tài liệu');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (error) {
      alert('Lỗi khi xóa tài liệu');
    }
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-200"
        >
          <Plus size={20} /> Thêm tài liệu
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Thêm tài liệu mới</h3>
            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  value={newResource.type}
                  onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                >
                  <option value="LINK">Liên kết (URL)</option>
                  <option value="FILE">Tệp tin (Link tải)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đường dẫn / Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  value={newResource.url}
                  onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => (
          <div 
            key={res.id} 
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${res.type === 'LINK' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                {res.type === 'LINK' ? <LinkIcon size={24} /> : <FileText size={24} />}
              </div>
              {(res.userId === user?.id || user?.role === 'ADMIN') && (
                <button
                  onClick={() => handleDeleteResource(res.id)}
                  className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">{res.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
              Đăng bởi: {res.user.name}
            </p>
            <a
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800"
            >
              Mở tài liệu <ExternalLink size={16} />
            </a>
          </div>
        ))}
        {filteredResources.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Không tìm thấy tài liệu nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
