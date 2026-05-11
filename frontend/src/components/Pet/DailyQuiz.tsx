import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyQuizProps {
  quizData: any;
  onAnswered: (result: any) => void;
  onRefreshPet?: () => void;
}

const DailyQuiz: React.FC<DailyQuizProps> = ({ quizData, onAnswered, onRefreshPet }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickQuiz, setQuickQuiz] = useState<any>(null);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { quiz, answered, result } = quizData;

  const currentQuiz = isQuickMode ? quickQuiz : quiz;
  const isAlreadyAnswered = isQuickMode ? (quickQuiz?.answered) : answered;
  const currentResult = isQuickMode ? (quickQuiz?.result) : result;

  const handleFetchQuickQuiz = async () => {
    setIsGenerating(true);
    setIsQuickMode(true);
    setQuickQuiz(null);
    setSelectedOption(null);
    try {
      const res = await api.get('/quizzes/quick');
      setQuickQuiz({ ...res.data, answered: false, result: null });
    } catch (error) {
      toast.error('Không thể tạo quiz nhanh. Hãy thử lại sau!');
      setIsQuickMode(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async () => {
    if (!selectedOption || isSubmitting || isAlreadyAnswered || !currentQuiz) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang kiểm tra đáp án...');
    try {
      if (isQuickMode) {
        const response = await api.post('/quizzes/quick/check', {
          answer: selectedOption,
          correctAnswer: currentQuiz.correctAnswer
        });
        
        setQuickQuiz({
          ...currentQuiz,
          answered: true,
          result: {
            isCorrect: response.data.isCorrect,
            correctAnswer: currentQuiz.correctAnswer,
            explanation: currentQuiz.explanation
          }
        });
        
        if (response.data.isCorrect) {
          toast.success('Chính xác! +30 HP cho Pet', { id: loadingToast });
        } else {
          toast.error('Sai rồi! -30 HP cho Pet', { id: loadingToast });
        }
        if (onRefreshPet) onRefreshPet();
      } else {
        const response = await api.post('/quizzes/answer', {
          quizId: quiz.id,
          answer: selectedOption,
        });
        toast.success(response.data.isCorrect ? 'Chính xác! +50 HP' : 'Sai rồi! -50 HP', { id: loadingToast });
        onAnswered(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi nộp đáp án', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10 shadow-xl text-center min-h-[400px] flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
        <p className="text-indigo-400 font-bold animate-pulse">AI đang biên soạn câu hỏi cho bạn...</p>
      </div>
    );
  }

  if (!currentQuiz && !isQuickMode) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-white/10 shadow-xl text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mx-auto mb-4">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Chưa có thử thách hôm nay</h3>
        <p className="text-slate-400 text-sm italic mb-6">Admin đang biên soạn câu hỏi mới. Hãy quay lại sau hoặc luyện tập nhanh với AI!</p>
        <button 
          onClick={handleFetchQuickQuiz}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-indigo-500/20"
        >
          <Sparkles size={18} /> Luyện tập nhanh với AI
        </button>
      </div>
    );
  }

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
            {isQuickMode ? <Sparkles size={24} /> : <HelpCircle size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{isQuickMode ? 'Luyện tập AI' : 'Thử thách C++ hằng ngày'}</h3>
            <p className="text-white/50 text-sm">Trả lời đúng để hồi máu cho Pet</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isQuickMode && (
            <button 
              onClick={() => { setIsQuickMode(false); setSelectedOption(null); }}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors"
            >
              Hằng ngày
            </button>
          )}
          <button 
            onClick={handleFetchQuickQuiz}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-indigo-400 transition-all border border-white/5"
            title="Luyện tập thêm"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg text-slate-200 font-medium leading-relaxed">
          {currentQuiz.question}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuiz.options.map((option: string, index: number) => {
          const label = labels[index];
          const isSelected = selectedOption === label;
          const isCorrect = currentResult?.correctAnswer === label;
          const isWrong = isAlreadyAnswered && selectedOption === label && !currentResult?.isCorrect;

          return (
            <button
              key={label}
              disabled={isAlreadyAnswered}
              onClick={() => setSelectedOption(label)}
              className={`
                relative p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4
                ${isAlreadyAnswered 
                  ? (isCorrect ? 'border-green-500 bg-green-500/20 text-green-300' : (isWrong ? 'border-red-500 bg-red-500/20 text-red-300' : 'border-white/5 bg-white/5 text-slate-500 opacity-50'))
                  : (isSelected ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30')
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0
                ${isAlreadyAnswered 
                  ? (isCorrect ? 'bg-green-500 text-white' : (isWrong ? 'bg-red-500 text-white' : 'bg-white/10'))
                  : (isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-white/10')
                }
              `}>
                {label}
              </div>
              <span className="font-medium">{option}</span>
              
              {isAlreadyAnswered && isCorrect && <CheckCircle2 className="ml-auto text-green-500" size={20} />}
              {isWrong && <XCircle className="ml-auto text-red-500" size={20} />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {!isAlreadyAnswered && selectedOption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={handleAnswer}
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={18} /> Xác nhận đáp án
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isAlreadyAnswered && currentResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-8 p-5 rounded-2xl border ${currentResult.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
        >
          <p className="font-bold mb-2 flex items-center gap-2">
            {currentResult.isCorrect ? <span className="text-green-400">✨ Tuyệt vời!</span> : <span className="text-red-400">💨 Rất tiếc...</span>}
          </p>
          <p className="text-slate-300 text-sm italic leading-relaxed">
            <span className="font-bold text-white block mb-1">Giải thích:</span>
            {currentResult.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default DailyQuiz;
