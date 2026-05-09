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
        throw new Error("SERVER_MISSING_API_KEY: Bạn chưa điền GEMINI_API_KEY trên Render.");
      }

      console.log(`[AI Grading] Đang xử lý bài nộp: ${submissionId}`);

      const prompt = `You are a strict programming judge.
Evaluate this ${submission.assignment.language} code.
Return ONLY valid JSON.

{
  "score": number,
  "feedback": "string"
}

Task: ${submission.assignment.description}
Max Score: ${submission.assignment.maxScore}
Code:
${submission.content}`;

      // GỌI TRỰC TIẾP API GOOGLE (Cách thô sơ nhưng ổn định nhất)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
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
        throw new Error("AI_EMPTY_RESPONSE: Google không trả về nội dung chấm điểm.");
      }

      // Trích xuất JSON an toàn
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`FORMAT_ERROR: AI trả về văn bản thay vì JSON. Nội dung: ${aiText.substring(0, 100)}`);
      }

      const result = JSON.parse(jsonMatch[0]);
      const finalScore = Math.max(0, Math.min(Number(result.score) || 0, submission.assignment.maxScore));

      // LƯU KẾT QUẢ VÀO DATABASE TRONG MỘT TRANSACTION
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

      // Gửi thông báo
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          title: "Bài tập đã được chấm điểm",
          message: `Bạn nhận được ${finalScore} điểm cho bài '${submission.assignment.title}'.`,
        },
      });

      console.log(`[AI Grading] Chấm điểm thành công: ${finalScore} pts`);

    } catch (error: any) {
      console.error(`[AI Grading] THẤT BẠI:`, error.message);
      
      // LƯU LỖI CHI TIẾT VÀO DATABASE ĐỂ NGƯỜI DÙNG XEM ĐƯỢC
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          feedback: `LỖI HỆ THỐNG: ${error.message}. 
          Chi tiết phản hồi từ Google: ${lastRawResponse.substring(0, 500)}`
        },
      });
    }
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
