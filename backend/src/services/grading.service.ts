import prisma from "../utils/prisma";

export class GeminiCliGradingService {
  public static async gradeSubmission(submissionId: string) {
    let lastRawResponse = "";
    
    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { assignment: true },
      });

      if (!submission || submission.status !== "PENDING") return;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("SERVER_MISSING_API_KEY: Chưa điền GEMINI_API_KEY trên Render.");
      }

      console.log(`[AI Grading] Đang chấm bài bằng Gemini Pro (v1): ${submissionId}`);

      const prompt = `You are a strict programming judge.
Evaluate this ${submission.assignment.language} code.
Return ONLY a raw JSON object. No explanations.

{
  "score": number,
  "feedback": "string"
}

Task: ${submission.assignment.description}
Max Score: ${submission.assignment.maxScore}
Code:
${submission.content}`;

      // SỬ DỤNG MODEL PRO VÀ API V1 (ỔN ĐỊNH TUYỆT ĐỐI)
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data: any = await response.json();
      lastRawResponse = JSON.stringify(data);

      if (!response.ok) {
        throw new Error(`GOOGLE_API_ERROR: ${data.error?.message || response.statusText}`);
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!aiText) {
        throw new Error("AI_EMPTY_RESPONSE: AI không trả về kết quả.");
      }

      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`FORMAT_ERROR: Kết quả không phải JSON.`);
      }

      const result = JSON.parse(jsonMatch[0]);
      const finalScore = Math.max(0, Math.min(Number(result.score) || 0, submission.assignment.maxScore));

      await prisma.$transaction(async (tx) => {
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            score: finalScore,
            feedback: result.feedback || "Đã chấm xong.",
            status: "GRADED",
            gradedAt: new Date(),
          },
        });

        const user = await tx.user.findUnique({ where: { id: submission.userId } });
        if (user) {
          const newPoints = user.totalPoints + finalScore;
          const newLevel = Math.floor(newPoints / 100) + 1;
          
          let newBadge = user.badge;
          if (newPoints >= 1000) newBadge = "Master";
          else if (newPoints >= 500) newBadge = "Diamond";
          else if (newPoints >= 300) newBadge = "Platinum";
          else if (newPoints >= 150) newBadge = "Gold";
          else if (newPoints >= 50) newBadge = "Silver";

          await tx.user.update({
            where: { id: user.id },
            data: { totalPoints: newPoints, level: newLevel, badge: newBadge },
          });
        }
      });

      await prisma.notification.create({
        data: {
          userId: submission.userId,
          title: "Bài tập đã được chấm điểm",
          message: `Bạn nhận được ${finalScore} điểm cho bài '${submission.assignment.title}'.`,
        },
      });

      console.log(`[AI Grading] Thành công: ${finalScore} pts`);

    } catch (error: any) {
      console.error(`[AI Grading] THẤT BẠI:`, error.message);
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          feedback: `LỖI: ${error.message}`
        },
      });
    }
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
