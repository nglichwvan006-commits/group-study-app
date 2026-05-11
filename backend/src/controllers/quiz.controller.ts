import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { DailyQuizService } from "../services/quiz.service";

export const getTodayQuiz = async (req: any, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let quiz = await prisma.dailyQuiz.findFirst({
      where: {
        quizDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!quiz) {
      // Auto-generate if not exists
      await DailyQuizService.generateTodayQuiz();
      
      // Fetch again after generation
      quiz = await prisma.dailyQuiz.findFirst({
        where: {
          quizDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });
    }

    if (!quiz) {
      return res.status(500).json({ message: "Không thể tạo quiz hằng ngày. Vui lòng thử lại sau!" });
    }

    // Check if user already answered
    const answer = await prisma.userQuizAnswer.findUnique({
      where: {
        userId_quizId: {
          userId: req.user.id,
          quizId: quiz.id,
        },
      },
    });

    res.json({
      quiz: {
        id: quiz.id,
        question: quiz.question,
        options: JSON.parse(quiz.optionsJson),
      },
      answered: !!answer,
      result: answer ? { isCorrect: answer.isCorrect, correctAnswer: quiz.correctAnswer, explanation: quiz.explanation } : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy quiz" });
  }
};

export const answerQuiz = async (req: any, res: Response) => {
  const { quizId, answer } = req.body;
  const userId = req.user.id;

  try {
    const quiz = await prisma.dailyQuiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ message: "Không tìm thấy quiz" });

    // Check if already answered
    const existing = await prisma.userQuizAnswer.findUnique({
      where: { userId_quizId: { userId, quizId } },
    });
    if (existing) return res.status(400).json({ message: "Bạn đã trả lời quiz này rồi" });

    const isCorrect = quiz.correctAnswer === answer;
    
    // Save answer
    await prisma.userQuizAnswer.create({
      data: { userId, quizId, selectedAnswer: answer, isCorrect },
    });

    // Update Pet HP
    const pet = await prisma.pet.findUnique({ where: { userId } });
    if (pet && pet.status === "ALIVE") {
      const hpChange = isCorrect ? 50 : -50;
      const newHp = Math.max(0, Math.min(pet.maxHp, pet.hp + hpChange));
      const newStatus = newHp <= 0 ? "DEAD" : "ALIVE";

      await prisma.pet.update({
        where: { userId },
        data: { hp: newHp, status: newStatus },
      });

      const message = isCorrect 
        ? `Bạn trả lời đúng quiz hôm nay và pet được hồi 50 HP.` 
        : `Bạn trả lời sai quiz hôm nay và pet bị trừ 50 HP.`;
      
      await prisma.notification.create({
        data: { userId, title: "Kết quả Quiz", message: message + (newStatus === "DEAD" ? " Pet của bạn đã chết!" : "") },
      });
    }

    res.json({
      isCorrect,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi nộp đáp án" });
  }
};
