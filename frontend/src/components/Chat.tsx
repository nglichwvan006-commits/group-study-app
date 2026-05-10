import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, Shield, Trash2, MessageCircle, Plus, Hash, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [showCreateRoom, setShowAddRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', code: '' });
  const [joinCode, setJoinCode] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchRooms();
    
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: accessToken },
    });

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message_deleted', (id) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    });

    newSocket.on('error', (err) => {
      toast.error(err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!activeRoom) return;
    
    // Fetch history
    api.get(`/chat/history?roomId=${activeRoom.id}`).then((res) => setMessages(res.data)).catch(() => toast.error('Lỗi tải lịch sử chat'));
    
    // Join room
    socket?.emit('join_room', activeRoom.id);

    // Auto close sidebar on mobile after selecting a room
    if (isMobile) setIsSidebarOpen(false);
  }, [activeRoom, socket, isMobile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data);
      if (!activeRoom) {
         const general = res.data.find((r: any) => r.code === 'GENERAL');
         if (general) setActiveRoom(general);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phòng');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/chat/rooms', newRoomData);
      setRooms([res.data, ...rooms]);
      setActiveRoom(res.data);
      setShowAddRoom(false);
      setNewRoomData({ name: '', code: '' });
      toast.success('Đã tạo phòng thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo phòng');
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const loadingToast = toast.loading('Đang kiểm tra mã phòng...');
    try {
      const res = await api.post('/chat/rooms/join', { code: joinCode.trim().toUpperCase() });
      const joinedRoom = res.data;
      
      if (!rooms.find(r => r.id === joinedRoom.id)) {
        setRooms([joinedRoom, ...rooms]);
      }
      
      setActiveRoom(joinedRoom);
      setJoinCode('');
      toast.success(`Đã gia nhập phòng ${joinedRoom.name}`, { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gia nhập phòng', { id: loadingToast });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Xóa phòng sẽ mất toàn bộ tin nhắn. Bạn chắc chứ?')) return;
    try {
      await api.delete(`/chat/rooms/${id}`);
      setRooms(rooms.filter(r => r.id !== id));
      if (activeRoom?.id === id) setActiveRoom(null);
      toast.success('Đã xóa phòng');
    } catch (error) {
      toast.error('Lỗi khi xóa phòng');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeRoom) return;

    socket.emit('send_message', { content: newMessage, roomId: activeRoom.id });
    setNewMessage('');
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) return;
    try {
      await api.delete(`/chat/${id}`);
      socket?.emit('delete_message', { id, roomId: activeRoom.id });
      toast.success('Đã thu hồi tin nhắn');
    } catch (error) {
      toast.error('Lỗi khi thu hồi tin nhắn');
    }
  };

  return (
    <div className="flex h-full bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-3xl overflow-hidden relative">
      
      {/* Sidebar Rooms - Responsive */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={isMobile ? { x: -300 } : { width: 0 }}
            animate={isMobile ? { x: 0 } : { width: 'auto' }}
            exit={isMobile ? { x: -300 } : { width: 0 }}
            className={`${isMobile ? 'fixed inset-y-0 left-0 z-[60] w-64' : 'w-64 sm:w-72'} border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shadow-2xl md:shadow-none`}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-lg tracking-tighter">PHÒNG CHAT</h3>
                <div className="flex gap-1">
                  <button onClick={() => setShowAddRoom(true)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Plus size={18} /></button>
                  {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-slate-400"><X size={18} /></button>}
                </div>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <form onSubmit={handleJoinByCode} className="flex gap-2">
                  <input type="text" placeholder="Mã gia nhập..." className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] font-bold uppercase" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  <button type="submit" className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-3 py-2 rounded-lg font-black text-[10px]">GIA NHẬP</button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {rooms.map((r) => (
                  <div key={r.id} className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${activeRoom?.id === r.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setActiveRoom(r)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Hash size={18} className={activeRoom?.id === r.id ? 'text-white' : 'text-slate-400'} />
                        <div className="overflow-hidden text-left">
                            <p className="font-bold text-sm truncate">{r.name}</p>
                            <p className={`text-[10px] uppercase font-black tracking-widest ${activeRoom?.id === r.id ? 'text-indigo-200' : 'text-slate-500'}`}>{r.code}</p>
                        </div>
                      </div>
                      {(r.creatorId === user?.id || user?.role === 'ADMIN') && r.code !== 'GENERAL' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(r.id); }} className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${activeRoom?.id === r.id ? 'hover:bg-white/20 text-white' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}><X size={14} /></button>
                      )}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/20">
         {activeRoom ? (
            <>
               {/* Chat Header */}
               <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center z-20">
                  <div className="flex items-center gap-3">
                     {isMobile && <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500"><Menu size={20} /></button>}
                     <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <MessageCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <div className="text-left">
                        <h4 className="font-black text-sm uppercase tracking-tighter">{activeRoom.name}</h4>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Trực tuyến</p>
                     </div>
                  </div>
                  <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase">Code: {activeRoom.code}</div>
               </div>

               {/* Messages Area */}
               <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth z-10 custom-scrollbar">
                  {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-50">
                        <MessageCircle size={48} className="mb-4" />
                        <p className="font-bold">Bắt đầu thảo luận cùng nhóm!</p>
                     </div>
                  )}
                  
                  <AnimatePresence initial={false}>
                     {messages.map((msg) => {
                        const isMe = msg.userId === user?.id;
                        return (
                           <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{msg.user?.name || 'User'}</span>
                                 {msg.user?.role === 'ADMIN' && <Shield size={12} className="text-indigo-500" />}
                                 <span className="text-[10px] text-slate-400/70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 {(isMe || user?.role === 'ADMIN') && (
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                 )}
                              </div>
                              <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm break-words shadow-sm leading-relaxed ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}`}>
                                 {msg.content}
                              </div>
                           </motion.div>
                        );
                     })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} className="h-1" />
               </div>

               {/* Input Area */}
               <div className="p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/50 z-20">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                     <input type="text" className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner" placeholder={`Nhắn tin...`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                     <button type="submit" disabled={!newMessage.trim()} className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg flex items-center justify-center"><Send size={20} /></button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-400">
               <Hash size={64} className="mb-6 opacity-20" />
               <p className="text-xl font-black">Chọn một phòng để bắt đầu!</p>
               {isMobile && <button onClick={() => setIsSidebarOpen(true)} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Mở danh sách phòng</button>}
            </div>
         )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
         {showCreateRoom && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-2xl font-black tracking-tight">Tạo phòng mới</h3>
                     <button onClick={() => setShowAddRoom(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 text-left">Tên phòng</label>
                        <input type="text" placeholder="VD: Nhóm học JS..." required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" value={newRoomData.name} onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })} />
                     </div>
                     <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 text-left">Mã tham gia</label>
                        <input type="text" placeholder="VD: NHOM1..." required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold uppercase" value={newRoomData.code} onChange={(e) => setNewRoomData({ ...newRoomData, code: e.target.value })} />
                     </div>
                     <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddRoom(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Hủy</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">TẠO PHÒNG</button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
