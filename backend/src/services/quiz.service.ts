import prisma from "../utils/prisma";

export class DailyQuizService {
  public static async generateTodayQuiz() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already exists
    const existing = await prisma.dailyQuiz.findFirst({
      where: {
        quizDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) return;

    try {
      const prompt = `Bạn là một chuyên gia C++. Hãy tạo 1 câu hỏi trắc nghiệm C++ độ khó Medium.
Câu hỏi phải có:
- Nội dung câu hỏi (tiếng Việt).
- 4 đáp án (A, B, C, D).
- Đáp án đúng (A, B, C hoặc D).
- Giải thích ngắn gọn tại sao đáp án đó đúng.

Trả về DUY NHẤT định dạng JSON:
{
  "question": "Nội dung câu hỏi",
  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "correctAnswer": "A",
  "explanation": "Giải thích..."
}

Đảm bảo JSON hợp lệ.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "";
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;

      const quizData = JSON.parse(jsonMatch[0]);

      await prisma.dailyQuiz.create({
        data: {
          question: quizData.question,
          optionsJson: JSON.stringify(quizData.options),
          correctAnswer: quizData.correctAnswer,
          explanation: quizData.explanation,
          quizDate: today,
        },
      });
      console.log("[Daily Quiz] Generated successfully for", today.toDateString());
    } catch (error) {
      console.error("[Daily Quiz] Error generating quiz:", error);
    }
  }
}
