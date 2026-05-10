import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Trash2, MessageCircle, Heart, Share2, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Feed: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/feed');
      setPosts(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải bảng tin');
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', { content: newPost });
      setPosts([res.data, ...posts]);
      setNewPost('');
      toast.success('Đã đăng bài!');
    } catch (error) {
      toast.error('Lỗi khi đăng bài');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Bạn muốn xóa bài viết này?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Đã xóa bài viết');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-10">
      
      {/* Create Post */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800">
         <form onSubmit={handlePost} className="space-y-4">
            <div className="flex gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shrink-0">
                  <User size={24} />
               </div>
               <textarea 
                 placeholder={`${currentUser?.name} ơi, hôm nay bạn học được gì mới?`} 
                 className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 rows={3}
                 value={newPost}
                 onChange={(e) => setNewPost(e.target.value)}
               ></textarea>
            </div>
            <div className="flex justify-end">
               <button 
                 disabled={!newPost.trim() || isPosting}
                 className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50"
               >
                  {isPosting ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
               </button>
            </div>
         </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
         <AnimatePresence>
            {posts.map((p) => (
               <motion.div 
                 key={p.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
               >
                  <div className="flex justify-between items-start mb-4">
                     <Link to={`/profile/${p.user.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black">
                           {p.user.name.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-bold text-sm hover:underline">{p.user.name}</h4>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.user.badge} • LV {p.user.level}</p>
                        </div>
                     </Link>
                     {(p.user.id === currentUser?.id || currentUser?.role === 'ADMIN') && (
                        <button onClick={() => handleDeletePost(p.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     )}
                  </div>
                  
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{p.content}</p>
                  
                  <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-6">
                     <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                        <Heart size={16} /> Thích
                     </button>
                     <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                        <MessageSquare size={16} /> Bình luận
                     </button>
                     <span className="ml-auto text-[9px] font-black text-slate-300 uppercase">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
         
         {posts.length === 0 && (
            <div className="text-center py-20 text-slate-400 font-bold italic">Bảng tin đang trống, hãy là người đầu tiên chia sẻ!</div>
         )}
      </div>
    </div>
  );
};

export default Feed;
