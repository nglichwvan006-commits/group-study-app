import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Trash2, MessageSquare, Heart, Image as ImageIcon, User, X, ChevronLeft, Maximize2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const PostItem: React.FC<{ post: any; onDelete?: (id: string) => void }> = ({ post, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleToggleLike = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/toggle-like`);
      setIsLiked(res.data.liked);
      setLikeCount((prev: number) => res.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Lỗi khi thả tim');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post('/posts/comments', { content: newComment, postId: post.id });
      setComments([...comments, res.data]);
      setNewComment('');
      toast.success('Đã gửi bình luận');
    } catch (error) {
      toast.error('Lỗi khi bình luận');
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await api.delete(`/posts/comments/${id}`);
      setComments(comments.filter(c => c.id !== id));
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const isAdminPost = post.user?.role === 'ADMIN';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border ${post.isPinned ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 dark:border-slate-800'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <Link to={`/profile/${post.userId}`} className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${isAdminPost ? 'bg-indigo-600' : 'bg-indigo-50 dark:bg-indigo-900/20'} flex items-center justify-center text-white font-black text-sm overflow-hidden`}>
            {isAdminPost ? (
              <Shield size={20} />
            ) : post.user?.avatarUrl ? (
              <img src={post.user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              post.user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-sm hover:underline text-left ${isAdminPost ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                {isAdminPost ? 'ADMIN' : (post.user?.name || 'Unknown')}
              </h4>
              {isAdminPost && <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-0.5"><Shield size={8}/> QUẢN TRỊ VIÊN</span>}
              {post.isPinned && <span className="text-indigo-500 text-[8px] font-black uppercase flex items-center gap-0.5">📌 ĐÃ GHIM</span>}
            </div>
            {!isAdminPost && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">{post.user?.badge} • LV {post.user?.level}</p>}
          </div>
        </Link>
        {(post.userId === currentUser?.id || currentUser?.role === 'ADMIN') && onDelete && (
          <button onClick={() => onDelete(post.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4 text-left">{post.content}</p>
      
      {post.imageUrl && (
        <div 
          onClick={() => setShowFullImage(true)}
          className="mb-4 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50 dark:bg-slate-800 cursor-zoom-in group relative"
        >
           <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-105" />
           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Maximize2 size={24} />
           </div>
        </div>
      )}

      {/* Full Image Modal */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
            onClick={() => setShowFullImage(false)}
          >
             <button className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-[110]"><X size={24}/></button>
             <motion.img 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               src={post.imageUrl} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" alt="Enlarged view" 
             />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-6">
        <button 
          onClick={handleToggleLike}
          className={`flex items-center gap-2 text-xs font-bold transition-all ${isLiked ? 'text-rose-500 scale-110' : 'text-slate-400 hover:text-rose-500'}`}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {likeCount} Thả tim
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
          <MessageSquare size={16} /> {comments.length} Bình luận
        </button>
        <span className="ml-auto text-[9px] font-black text-slate-300 uppercase">{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 space-y-4 overflow-hidden">
            <div className="space-y-3">
               {comments.map((c: any) => {
                 const isCommentAdmin = c.user?.role === 'ADMIN';
                 return (
                   <div key={c.id} className="flex gap-3 items-start">
                      <div className={`w-7 h-7 rounded-lg ${isCommentAdmin ? 'bg-indigo-600' : 'bg-indigo-50 dark:bg-indigo-900/40'} flex items-center justify-center text-[10px] font-black text-white overflow-hidden`}>
                        {isCommentAdmin ? (
                          <Shield size={14} />
                        ) : c.user?.avatarUrl ? (
                          <img src={c.user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          c.user?.name?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl relative text-left">
                         <div className="flex items-center gap-1.5 mb-1">
                            <p className={`text-[10px] font-black ${isCommentAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'}`}>
                              {isCommentAdmin ? 'ADMIN' : c.user?.name}
                            </p>
                            {isCommentAdmin && <Shield size={8} className="text-indigo-600" />}
                         </div>
                         <p className="text-xs">{c.content}</p>
                         {(c.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                           <button onClick={() => handleDeleteComment(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X size={10}/></button>
                         )}
                      </div>
                   </div>
                 );
               })}
               {comments.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Hãy là người đầu tiên bình luận!</p>}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
               <input type="text" placeholder="Viết bình luận..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
               <button type="submit" disabled={!newComment.trim()} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"><Send size={14} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PostSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div className="space-y-2">
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
        </div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="w-full h-4 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
      <div className="w-5/6 h-4 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
    </div>
    <div className="w-full h-48 bg-slate-50 dark:bg-slate-800/30 rounded-3xl mb-4"></div>
    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-6">
      <div className="w-20 h-4 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
      <div className="w-20 h-4 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
    </div>
  </div>
);

const Feed: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts/feed');
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Lỗi khi tải bảng tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', { content: newPost, imageUrl });
      setPosts([res.data, ...posts]);
      setNewPost('');
      setImageUrl(null);
      toast.success('Đã đăng bài thành công!');
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

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] pb-20">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-4">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
               <ChevronLeft size={20} /> QUAY LẠI
            </button>
            <h2 className="font-black tracking-tighter text-lg uppercase">Bảng tin cộng đồng</h2>
            <div className="w-20"></div>
         </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 mt-8 px-4">
        {/* Create Post */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800">
           <form onSubmit={handlePost} className="space-y-4">
              <div className="flex gap-4">
                 <div className={`w-12 h-12 rounded-2xl ${isAdmin ? 'bg-indigo-600' : 'bg-indigo-100 dark:bg-indigo-900/40'} flex items-center justify-center text-white shrink-0 shadow-inner font-black overflow-hidden`}>
                    {isAdmin ? (
                      <Shield size={24} />
                    ) : currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name?.charAt(0)
                    )}
                 </div>
                 <textarea 
                   placeholder={isAdmin ? "Đăng thông báo cộng đồng..." : `${currentUser?.name || 'Bạn'} ơi, hôm nay có gì mới?`} 
                   className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                   rows={3}
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                 ></textarea>
              </div>
              
              <AnimatePresence>
                 {imageUrl && (
                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full h-64 rounded-3xl overflow-hidden border-2 border-indigo-500 bg-slate-100 shadow-inner">
                      <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImageUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all shadow-lg"><X size={16}/></button>
                   </motion.div>
                 )}
              </AnimatePresence>

              <div className="flex justify-between items-center">
                 <label className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all text-slate-500 hover:text-indigo-600">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
                 <button 
                   type="submit"
                   disabled={!newPost.trim() || isPosting}
                   className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isPosting ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
                 </button>
              </div>
           </form>
        </div>

        <div className="space-y-8">
           {isLoading ? (
             <>
               <PostSkeleton />
               <PostSkeleton />
               <PostSkeleton />
             </>
           ) : (
             <>
               {posts.map((p) => (
                 <PostItem key={p.id} post={p} onDelete={handleDeletePost} />
               ))}
               {posts.length === 0 && (
                 <div className="bg-white/50 dark:bg-slate-900/50 p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">Bảng tin đang trống.</div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
export { PostItem };
