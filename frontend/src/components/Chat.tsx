import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, Shield, Trash2 } from 'lucide-react';

const Chat: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch history
    api.get('/chat/history').then((res) => setMessages(res.data));

    // Setup socket
    const newSocket = io('http://localhost:5000', {
      auth: { token: accessToken },
    });

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message_deleted', (id) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    });

    newSocket.on('error', (err) => {
      alert(err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', { content: newMessage });
    setNewMessage('');
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Bạn có muốn thu hồi tin nhắn này không?')) return;
    try {
      await api.delete(`/chat/${id}`);
      socket?.emit('delete_message', { id });
    } catch (error) {
      alert('Lỗi khi xóa tin nhắn');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-center gap-2 mb-1 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs font-semibold text-slate-600">
                {msg.user.name}
              </span>
              {msg.user.role === 'ADMIN' && (
                <Shield size={12} className="text-primary-600" />
              )}
              <span className="text-[10px] text-slate-400">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {(msg.userId === user?.id || user?.role === 'ADMIN') && (
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  title="Thu hồi tin nhắn"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${
                msg.userId === user?.id
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-900 placeholder:text-slate-400"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-lg shadow-primary-200"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
