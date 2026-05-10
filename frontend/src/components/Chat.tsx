import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, Shield, Trash2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // Fetch history for specific room
    api.get(`/chat/history?roomId=${roomId}`).then((res) => setMessages(res.data)).catch(() => toast.error('Lỗi tải lịch sử chat'));

    // Setup socket
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: accessToken },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', roomId);
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
  }, [accessToken, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;

    socket.emit('send_message', { content: newMessage, roomId });
    setNewMessage('');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setRoomId(joinCode.trim().toUpperCase());
  };

  const generateRandomRoom = () => {
    const code = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(code);
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) return;
    try {
      await api.delete(`/chat/${id}`);
      socket?.emit('delete_message', { id, roomId });
      toast.success('Đã thu hồi tin nhắn');
    } catch (error) {
      toast.error('Lỗi khi thu hồi tin nhắn');
    }
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
           <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={40} className="text-indigo-600 dark:text-indigo-400" />
           </div>
           <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Phòng Chat Nhóm</h2>
           <p className="text-slate-500 font-medium leading-relaxed">Tham gia phòng chat chung hoặc tạo phòng riêng để thảo luận học tập cùng bạn bè.</p>
           
           <div className="space-y-4 pt-4">
              <button 
                onClick={() => setRoomId('GENERAL')}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                VÀO PHÒNG CHUNG
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-black text-slate-300 uppercase tracking-widest">Hoặc</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Nhập mã phòng..." 
                   className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold uppercase"
                   value={joinCode}
                   onChange={(e) => setJoinCode(e.target.value)}
                 />
                 <button type="submit" className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:opacity-90 transition-all">THAM GIA</button>
              </form>
              
              <button 
                onClick={generateRandomRoom}
                className="w-full py-3 text-indigo-600 dark:text-indigo-400 text-sm font-black hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
              >
                TẠO MÃ PHÒNG NGẪU NHIÊN
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-3xl overflow-hidden relative">
      
      {/* Chat Header */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center z-20">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
               <MessageCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
               <h4 className="font-black text-sm uppercase tracking-tighter">Phòng: {roomId}</h4>
               <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Đang trực tuyến</p>
            </div>
         </div>
         <button 
           onClick={() => setRoomId(null)}
           className="px-4 py-2 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg"
         >
           THOÁT PHÒNG
         </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth z-10 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-50">
            <MessageCircle size={48} className="mb-4" />
            <p className="font-bold">Chưa có tin nhắn nào trong phòng này.</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.userId === user?.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {msg.user?.name || 'Unknown'}
                  </span>
                  {msg.user?.role === 'ADMIN' && (
                    <Shield size={12} className="text-indigo-500" />
                  )}
                  <span className="text-[10px] text-slate-400/70 dark:text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {(isMe || user?.role === 'ADMIN') && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors cursor-pointer rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Thu hồi tin nhắn"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl text-sm break-words shadow-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-700/50 shadow-slate-200/50 dark:shadow-none'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800/50 z-20">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
            placeholder="Nhập tin nhắn của bạn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none transform hover:scale-105 active:scale-95 disabled:transform-none flex items-center justify-center"
          >
            <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;