import React, { useState } from 'react';
import api from '../services/api';
import { Search as SearchIcon, User, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/profiles/search?q=${query}`);
      setResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pt-10 pb-20 px-4">
      <div className="text-center space-y-4">
         <h2 className="text-4xl font-black tracking-tighter">Tìm kiếm bạn đồng hành</h2>
         <p className="text-slate-500 font-medium">Tìm kiếm bạn bè bằng tên hoặc email để cùng trao đổi học tập.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800">
         <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
               <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input 
                 type="text" 
                 placeholder="Nhập tên hoặc email cần tìm..." 
                 className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
               />
            </div>
            <button className="px-10 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">TÌM</button>
         </form>
      </div>

      <div className="space-y-4">
         {isLoading && <div className="text-center py-10 animate-pulse font-black text-slate-400">ĐANG TÌM KIẾM...</div>}
         
         <AnimatePresence>
            {results.map((u, i) => (
               <motion.div 
                 key={u.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group"
               >
                  <Link to={`/profile/${u.id}`} className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                           {u.name.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-black text-lg group-hover:text-indigo-600 transition-colors">{u.name}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{u.badge}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Cấp bậc {u.level}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                           <p className="font-black text-xl text-slate-900 dark:text-white">{u.totalPoints}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase">ĐIỂM TỔNG</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                     </div>
                  </Link>
               </motion.div>
            ))}
         </AnimatePresence>

         {!isLoading && results.length === 0 && query && (
            <div className="text-center py-20 text-slate-400 font-bold italic">Không tìm thấy thành viên nào phù hợp.</div>
         )}
      </div>
    </div>
  );
};

export default Search;
