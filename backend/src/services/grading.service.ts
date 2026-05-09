import prisma from "../utils/prisma";

export class GeminiCliGradingService {
  public static async gradeSubmission(submissionId: string) {
    const apiKey = process.env.OPENROUTER_API_KEY; // Dùng key của OpenRouter
    if (!apiKey) {
      console.error("[AI] Chưa cấu hình OPENROUTER_API_KEY trên Render.");
      return;
    }

    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { assignment: true },
      });

      if (!submission || submission.status !== "PENDING") return;

      console.log(`[AI Grading] Đang chấm bài qua OpenRouter (DeepSeek/Llama): ${submissionId}`);

      const prompt = `You are a strict programming judge.
Evaluate this ${submission.assignment.language} code. 
Return ONLY a raw JSON object. No markdown.
{
  "score": number,
  "feedback": "string"
}
Task: ${submission.assignment.description}
Max Score: ${submission.assignment.maxScore}
Code:
${submission.content}`;

      // GỌI QUA OPENROUTER (CẦU NỐI AI TOÀN CẦU)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://group-study-app.vercel.app", // Định danh ứng dụng của bạn
          "X-Title": "Study Group App"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat", // Sử dụng DeepSeek cực mạnh về code
          "messages": [
            { "role": "user", "content": prompt }
          ]
        })
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText}`);
      }

      const aiText = data.choices?.[0]?.message?.content?.trim();
      if (!aiText) throw new Error("AI không trả về nội dung.");

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Định dạng AI trả về không phải JSON.");

      const result = JSON.parse(jsonMatch[0]);
      const finalScore = Math.max(0, Math.min(Number(result.score) || 0, submission.assignment.maxScore));

      await prisma.$transaction(async (tx) => {
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            score: finalScore,
            feedback: result.feedback || "Hoàn tất chấm điểm.",
            status: "GRADED",
            gradedAt: new Date(),
          },
        });

        const user = await tx.user.findUnique({ where: { id: submission.userId } });
        if (user) {
          const newPoints = user.totalPoints + finalScore;
          await tx.user.update({
            where: { id: submission.userId },
            data: { totalPoints: newPoints, level: Math.floor(newPoints / 100) + 1 },
          });
        }
      });

      await prisma.notification.create({
        data: {
          userId: submission.userId,
          title: "Bài tập đã được chấm",
          message: `Bạn đạt ${finalScore}/${submission.assignment.maxScore} điểm cho bài '${submission.assignment.title}'.`,
        },
      });

      console.log(`[AI Grading] CHẤM ĐIỂM THÀNH CÔNG: ${finalScore} pts`);

    } catch (error: any) {
      console.error(`[AI Grading] THẤT BẠI:`, error.message);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: `Lỗi AI (OpenRouter): ${error.message}` },
      });
    }
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
