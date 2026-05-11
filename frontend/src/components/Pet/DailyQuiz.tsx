import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DailyQuizProps {
  quizData: any;
  onAnswered: (result: any) => void;
}

const DailyQuiz: React.FC<DailyQuizProps> = ({ quizData, onAnswered }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { quiz, answered, result } = quizData;

  const handleAnswer = async () => {
    if (!selectedOption || isSubmitting || answered) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang kiểm tra đáp án...');
    try {
      const response = await api.post('/quizzes/answer', {
        quizId: quiz.id,
        answer: selectedOption,
      });
      toast.success(response.data.isCorrect ? 'Chính xác! +50 HP' : 'Sai rồi! -50 HP', { id: loadingToast });
      onAnswered(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi nộp đáp án', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quiz) return null;

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl overflow-hidden relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
          <HelpCircle size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Thử thách C++ hằng ngày</h3>
          <p className="text-white/50 text-sm">Trả lời đúng để hồi máu cho Pet</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg text-slate-200 font-medium leading-relaxed">
          {quiz.question}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quiz.options.map((option: string, index: number) => {
          const label = labels[index];
          const isSelected = selectedOption === label;
          const isCorrect = result?.correctAnswer === label;
          const isWrong = answered && selectedOption === label && !result?.isCorrect;

          return (
            <button
              key={label}
              disabled={answered}
              onClick={() => setSelectedOption(label)}
              className={`
                relative p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4
                ${answered 
                  ? (isCorrect ? 'border-green-500 bg-green-500/20 text-green-300' : (isWrong ? 'border-red-500 bg-red-500/20 text-red-300' : 'border-white/5 bg-white/5 text-slate-500 opacity-50'))
                  : (isSelected ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30')
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0
                ${answered 
                  ? (isCorrect ? 'bg-green-500 text-white' : (isWrong ? 'bg-red-500 text-white' : 'bg-white/10'))
                  : (isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-white/10')
                }
              `}>
                {label}
              </div>
              <span className="font-medium">{option}</span>
              
              {answered && isCorrect && <CheckCircle2 className="ml-auto text-green-500" size={20} />}
              {isWrong && <XCircle className="ml-auto text-red-500" size={20} />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {!answered && selectedOption && (
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

      {answered && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-8 p-5 rounded-2xl border ${result.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
        >
          <p className="font-bold mb-2 flex items-center gap-2">
            {result.isCorrect ? <span className="text-green-400">✨ Tuyệt vời!</span> : <span className="text-red-400">💨 Rất tiếc...</span>}
          </p>
          <p className="text-slate-300 text-sm italic leading-relaxed">
            <span className="font-bold text-white block mb-1">Giải thích:</span>
            {result.explanation}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default DailyQuiz;
