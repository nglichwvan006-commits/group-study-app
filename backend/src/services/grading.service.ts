import prisma from "../utils/prisma";

export class GeminiCliGradingService {
  public static async gradeSubmission(submissionId: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { assignment: true },
      });

      if (!submission || submission.status !== "PENDING") return;

      console.log(`[AI Grading] Đang chấm bài qua OpenRouter (DeepSeek): ${submissionId}`);

      const prompt = `Bạn là một giám khảo lập trình khắt khe và công tâm.
Hãy đánh giá mã nguồn ${submission.assignment.language} sau đây cho bài tập: "${submission.assignment.title}".

YÊU CẦU:
1. Trả về DUY NHẤT một đối tượng JSON nguyên bản. Không có văn bản giải thích, không có dấu nháy code \`\`\`json.
2. Toàn bộ phần 'feedback' PHẢI BẰNG TIẾNG VIỆT.
3. Điểm số (score) phải là số nguyên từ 0 đến ${submission.assignment.maxScore}.

ĐỊNH DẠNG JSON:
{
  "score": number,
  "feedback": "Nhận xét chi tiết bằng tiếng Việt ở đây"
}

ĐỀ BÀI: ${submission.assignment.description}
TIÊU CHÍ: ${submission.assignment.rubric}
ĐIỂM TỐI ĐA: ${submission.assignment.maxScore}

MÃ NGUỒN CỦA HỌC VIÊN:
${submission.content}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://group-study-app.vercel.app",
          "X-Title": "Study Group App"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat",
          "messages": [{ "role": "user", "content": prompt }]
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Lỗi OpenRouter");

      const aiText = data.choices?.[0]?.message?.content?.trim();
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI không trả về đúng định dạng.");

      const result = JSON.parse(jsonMatch[0]);
      const finalScore = Math.max(0, Math.min(Number(result.score) || 0, submission.assignment.maxScore));

      await prisma.$transaction(async (tx) => {
        // Tìm bài nộp trước đó của người dùng này cho bài tập này (nếu có)
        const previousSubmissions = await tx.submission.findMany({
          where: {
            userId: submission.userId,
            assignmentId: submission.assignmentId,
            status: "GRADED",
            id: { not: submission.id }
          },
          orderBy: { gradedAt: 'desc' },
          take: 1
        });

        const oldScore = previousSubmissions.length > 0 ? (previousSubmissions[0].score || 0) : 0;
        
        // Cập nhật bài nộp hiện tại
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            score: finalScore,
            feedback: result.feedback,
            status: "GRADED",
            gradedAt: new Date(),
          },
        });

        // Cập nhật điểm User: Lấy điểm mới nhất thay cho điểm cũ
        const user = await tx.user.findUnique({ where: { id: submission.userId } });
        if (user) {
          // Logic: Nếu làm lại, ta trừ đi điểm cũ của bài đó và cộng điểm mới vào
          const newPoints = Math.max(0, user.totalPoints - oldScore + finalScore);
          const newLevel = Math.floor(newPoints / 100) + 1;
          
          let newBadge = "Bronze";
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
          title: "🎯 Kết quả chấm điểm AI",
          message: `Bài làm mới của bạn đạt ${finalScore}/${submission.assignment.maxScore} điểm. Điểm xếp hạng đã được cập nhật!`,
        },
      });

    } catch (error: any) {
      console.error(`[AI] Lỗi:`, error.message);
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: `Đang gặp sự cố kết nối AI. Vui lòng thử lại sau.` },
      });
    }
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
