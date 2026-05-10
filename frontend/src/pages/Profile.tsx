import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, School, Book, IdCard, GraduationCap, Calendar, Edit3, Camera, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PostItem } from './Feed';

const Profile: React.FC = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditData] = useState<any>({ name: '', age: '', school: '', className: '', studentId: '', gender: '', bio: '', avatarUrl: '' });
  const [isLoading, setIsLoading] = useState(true);

  const isMyProfile = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/profiles/${id}`);
      setProfile(res.data);
      setEditData({
        name: res.data.name || '',
        age: res.data.age || '',
        school: res.data.school || '',
        className: res.data.className || '',
        studentId: res.data.studentId || '',
        gender: res.data.gender || '',
        bio: res.data.bio || '',
        avatarUrl: res.data.avatarUrl || '',
      });
    } catch (error) {
      toast.error('Lỗi khi tải trang cá nhân');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/profiles/me', editForm);
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      fetchProfile();
      refreshUser();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ảnh đại diện phải dưới 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editForm, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePost = async (postId: string) => {
     if (!window.confirm('Xóa bài viết này?')) return;
     try {
       await api.delete(`/posts/${postId}`);
       setProfile({
         ...profile,
         posts: profile.posts.filter((p: any) => p.id !== postId)
       });
       toast.success('Đã xóa bài viết');
     } catch (error) {
       toast.error('Lỗi khi xóa');
     }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:text-white">Đang tải...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] pb-20 dark:text-white">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-4">
         <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
               <ChevronLeft size={20} /> QUAY LẠI
            </button>
            <h2 className="font-black tracking-tighter text-lg uppercase">Trang cá nhân</h2>
            <div className="w-20"></div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 text-slate-900 dark:text-white text-left mt-8 px-4">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
             <div className="absolute -bottom-16 left-10">
                <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl border-4 border-white dark:border-slate-800 relative group">
                   <div className="w-full h-full rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 overflow-hidden">
                      {(isEditing ? editForm.avatarUrl : profile.avatarUrl) ? (
                        <img src={isEditing ? editForm.avatarUrl : profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} />
                      )}
                   </div>
                   {isEditing && (
                     <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="text-white" size={32} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                     </label>
                   )}
                </div>
             </div>
          </div>
          
          <div className="pt-20 pb-10 px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
                <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 text-left">{profile.badge} • Cấp bậc {profile.level}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400 font-medium">
                   <span className="flex items-center gap-1.5"><Calendar size={14}/> Tham gia {new Date(profile.createdAt).toLocaleDateString()}</span>
                   <span className="flex items-center gap-1.5"><Book size={14}/> {profile.submissions?.length || 0} bài tập hoàn thành</span>
                </div>
             </div>
             {isMyProfile && (
               <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2">
                  <Edit3 size={18} /> {isEditing ? 'Hủy' : 'Chỉnh sửa'}
               </button>
             )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Thông tin</h3>
                 
                 {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4 text-slate-900 dark:text-white">
                       <input type="text" placeholder="Họ tên" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" value={editForm.name} onChange={(e) => setEditData({...editForm, name: e.target.value})} />
                       <input type="number" placeholder="Tuổi" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" value={editForm.age} onChange={(e) => setEditData({...editForm, age: e.target.value})} />
                       <input type="text" placeholder="Trường" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" value={editForm.school} onChange={(e) => setEditData({...editForm, school: e.target.value})} />
                       <input type="text" placeholder="Lớp" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" value={editForm.className} onChange={(e) => setEditData({...editForm, className: e.target.value})} />
                       <input type="text" placeholder="MSSV" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" value={editForm.studentId} onChange={(e) => setEditData({...editForm, studentId: e.target.value})} />
                       <textarea placeholder="Tiểu sử" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm" rows={3} value={editForm.bio} onChange={(e) => setEditData({...editForm, bio: e.target.value})}></textarea>
                       <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black">LƯU THAY ĐỔI</button>
                    </form>
                 ) : (
                    <div className="space-y-5">
                       <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><IdCard size={20}/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">MSSV</p><p className="font-bold">{profile.studentId || 'N/A'}</p></div>
                       </div>
                       <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><School size={20}/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">Trường</p><p className="font-bold">{profile.school || 'N/A'}</p></div>
                       </div>
                       <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl italic text-xs">
                          "{profile.bio || 'Chưa có tiểu sử.'}"
                       </div>
                    </div>
                 )}
              </motion.div>
              
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 text-left">
                 <h3 className="text-lg font-black mb-6 uppercase">Bài tập hoàn thành</h3>
                 <div className="space-y-3">
                    {profile.submissions?.map((s: any) => (
                       <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center">
                          <p className="font-bold text-xs truncate w-32">{s.assignment?.title}</p>
                          <p className="font-black text-indigo-600 text-xs">{s.score} PTS</p>
                       </div>
                    ))}
                    {(!profile.submissions || profile.submissions.length === 0) && <p className="text-xs text-slate-400 italic">Chưa có bài tập nào.</p>}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter ml-4 text-left">Bài đăng của {profile.name}</h3>
              <div className="space-y-6">
                 {profile.posts?.map((p: any) => (
                    <PostItem key={p.id} post={p} onDelete={handleDeletePost} />
                 ))}
                 {(!profile.posts || profile.posts.length === 0) && (
                    <div className="bg-white/50 dark:bg-slate-900/50 p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">Người dùng chưa đăng bài nào.</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
