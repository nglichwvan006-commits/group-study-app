import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, MessageSquare, LogOut, Send, CheckCircle } from 'lucide-react';
import Chat from '../components/Chat';

const MemberDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'chat'>('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments', error);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      await api.post('/assignments/submit', {
        assignmentId: selectedAssignment.id,
        content: submissionContent,
      });
      alert('Assignment submitted successfully!');
      setSubmissionContent('');
      setSelectedAssignment(null);
    } catch (error) {
      alert('Error submitting assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">Study Group</h1>
          <p className="text-sm text-slate-500 mt-1">{user?.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'assignments' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={20} /> My Assignments
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare size={20} /> Group Chat
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className={`p-6 rounded-xl border transition-all cursor-pointer ${
                      selectedAssignment?.id === a.id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{a.title}</h3>
                    <p className="text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        Deadline: {new Date(a.deadline).toLocaleDateString()}
                      </span>
                      <span className="text-primary-600 text-sm font-semibold flex items-center gap-1">
                        View Details <Send size={14} />
                      </span>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && <p className="text-slate-500">No assignments available yet.</p>}
              </div>

              {selectedAssignment ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-8">
                  <h3 className="text-xl font-bold text-slate-900">{selectedAssignment.title}</h3>
                  <p className="text-slate-600 mt-4 whitespace-pre-wrap">{selectedAssignment.description}</p>
                  
                  <hr className="my-6 border-slate-100" />

                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Your Submission</label>
                      <textarea
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        rows={6}
                        placeholder="Paste your links or write your submission here..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : <><CheckCircle size={20} /> Submit Assignment</>}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="hidden md:flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl h-80">
                  <BookOpen size={48} className="mb-4 opacity-20" />
                  <p>Select an assignment to view details and submit</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Group Chat</h2>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <Chat />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
