import React, { useState } from 'react';
import api from '../services/api';
import { Search as SearchIcon, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { PostItem } from './Feed';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState<'users' | 'posts'>('users');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      if (activeSearchTab === 'users') {
        const res = await api.get(`/profiles/search?q=${query}`);
        setUserResults(res.data);
      } else {
        const res = await api.get(`/posts/feed?q=${query}`);
        setPostResults(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] pb-20">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-4">
         <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
               <ChevronLeft size={20} /> QUAY LẠI
            </button>
            <h2 className="font-black tracking-tighter text-lg uppercase text-slate-900 dark:text-white">Tìm kiếm cộng đồng</h2>
            <div className="w-20"></div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-10 mt-10 px-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800">
          <div className="flex gap-4 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveSearchTab('users')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeSearchTab === 'users' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Thành viên
              </button>
              <button 
                onClick={() => setActiveSearchTab('posts')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeSearchTab === 'posts' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Bài viết
              </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder={activeSearchTab === 'users' ? "Nhập tên hoặc email..." : "Nhập nội dung bài viết cần tìm..."} 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-slate-900 dark:text-white"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button className="px-10 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-tighter">Tìm</button>
          </form>
        </div>

        <div className="space-y-6">
          {isLoading && <div className="text-center py-10 animate-pulse font-black text-slate-400 uppercase">Đang tìm kiếm...</div>}
          
          <AnimatePresence mode='wait'>
              {activeSearchTab === 'users' ? (
                <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {userResults.map((u, i) => (
                      <motion.div 
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group"
                      >
                          <Link to={`/profile/${u.id}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden shadow-inner">
                                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <h4 className="font-black text-lg group-hover:text-indigo-600 transition-colors text-slate-900 dark:text-white">{u.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{u.badge}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Cấp bậc {u.level}</span>
                                  </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden sm:block text-right text-slate-900 dark:text-white">
                                  <p className="font-black text-xl">{u.totalPoints}</p>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ĐIỂM TỔNG</p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                          </Link>
                      </motion.div>
                    ))}
                </motion.div>
              ) : (
                <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    {postResults.map((p) => (
                      <PostItem key={p.id} post={p} />
                    ))}
                </motion.div>
              )}
          </AnimatePresence>

          {!isLoading && query && ((activeSearchTab === 'users' && userResults.length === 0) || (activeSearchTab === 'posts' && postResults.length === 0)) && (
              <div className="text-center py-20 text-slate-400 font-bold italic">Không tìm thấy kết quả nào phù hợp.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
