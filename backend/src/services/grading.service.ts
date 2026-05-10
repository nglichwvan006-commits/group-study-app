import prisma from "../utils/prisma";

export class GeminiCliGradingService {
  public static async classifyDifficulty(title: string, description: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return "Trung bình";

    try {
      const prompt = `Phân loại độ khó cho bài tập lập trình sau:
Tiêu đề: "${title}"
Mô tả: ${description}

Trả về DUY NHẤT một trong các từ sau: "Dễ", "Trung bình", "Khá", "Khó", "Master".
Tiêu chí:
- Dễ: Bài tập cơ bản, in chuỗi, tính toán đơn giản.
- Trung bình: Có sử dụng vòng lặp, mảng cơ bản.
- Khá: Sử dụng cấu trúc dữ liệu, thuật toán sắp xếp cơ bản.
- Khó: Thuật toán phức tạp, đệ quy, xử lý file hoặc API.
- Master: Thử thách cực khó, tối ưu thuật toán, kiến trúc hệ thống.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "Trung bình";
      const difficulties = ["Dễ", "Trung bình", "Khá", "Khó", "Master"];
      const match = difficulties.find(d => text.includes(d));
      return match || "Trung bình";
    } catch (error) {
      return "Trung bình";
    }
  }

  public static async gradeSubmission(submissionId: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[AI Grading] THIẾU OPENROUTER_API_KEY trong môi trường backend!");
      return;
    }

    try {
      const submission = await (prisma as any).submission.findUnique({
        where: { id: submissionId },
        include: { assignment: true, user: true },
      });

      if (!submission) {
        console.error(`[AI Grading] Không tìm thấy bài nộp: ${submissionId}`);
        return;
      }

      if (submission.status !== "PENDING") {
        console.log(`[AI Grading] Bài nộp ${submissionId} đã được chấm hoặc đang xử lý. Bỏ qua.`);
        return;
      }

      console.log(`[AI Grading] Bắt đầu chấm bài cho User: ${submission.user.name} (${submission.user.email})`);
      console.log(`[AI Grading] Bài tập: ${submission.assignment.title}`);

      const prompt = `Học viên: ${submission.user.name}
Bài tập: "${submission.assignment.title}"
Mô tả: ${submission.assignment.description}
Ngôn ngữ: ${submission.assignment.language}
Điểm tối đa: ${submission.assignment.maxScore}
Tiêu chí: ${submission.assignment.rubric}

Nội dung bài làm:
---
${submission.content}
---

Nhiệm vụ của bạn:
1. Đóng vai chuyên gia lập trình chấm điểm bài làm này.
2. Trả về kết quả duy nhất ở định dạng JSON: {"score": number, "feedback": "string tiếng Việt"}.
3. Điểm số (score) phải là số nguyên từ 0 đến ${submission.assignment.maxScore}.
4. Nhận xét (feedback) cần mang tính xây dựng, chỉ ra chỗ tốt và chỗ cần cải thiện.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://group-study-app.vercel.app",
          "X-Title": "Group Study App"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "";
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: "AI không thể phân tích bài làm." };

      const finalScore = Math.max(0, Math.min(Number(result.score) || 0, submission.assignment.maxScore));

      await prisma.$transaction(async (tx) => {
        await (tx as any).submission.update({
          where: { id: submissionId },
          data: {
            score: finalScore,
            feedback: result.feedback,
            status: "GRADED",
            gradedAt: new Date(),
          },
        });

        // Recalculate full XP for this user automatically
        const allUserSubmissions = await (tx as any).submission.findMany({
          where: { userId: submission.userId, status: "GRADED" },
          select: { assignmentId: true, score: true }
        });

        const bestScores: { [key: string]: number } = {};
        allUserSubmissions.forEach((s: any) => {
          if (!bestScores[s.assignmentId] || (s.score || 0) > bestScores[s.assignmentId]) {
            bestScores[s.assignmentId] = s.score || 0;
          }
        });

        const newPoints = Object.values(bestScores).reduce((a: any, b: any) => Number(a) + Number(b), 0);
        const newLevel = Math.floor(newPoints / 2000) + 1;
        
        let newBadge = "Bronze";
        if (newPoints >= 10000) newBadge = "Master";
        else if (newPoints >= 5000) newBadge = "Diamond";
        else if (newPoints >= 3000) newBadge = "Platinum";
        else if (newPoints >= 1500) newBadge = "Gold";
        else if (newPoints >= 500) newBadge = "Silver";

        await (tx as any).user.update({
          where: { id: submission.userId },
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge },
        });

        // Add notification
        await (tx as any).notification.create({
          data: {
            userId: submission.userId,
            title: "Đã có kết quả chấm điểm AI",
            message: `Bài làm mới của bạn đạt ${finalScore}/${submission.assignment.maxScore} điểm. Đã cập nhật vào thanh XP!`,
          },
        });
      });

      console.log(`[AI Grading] Hoàn tất chấm bài ${submissionId}: ${finalScore} pts`);
    } catch (error) {
      console.error("[AI Grading] LỖI:", error);
      await (prisma as any).submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: `Đang gặp sự cố kết nối AI. Vui lòng thử lại sau.` },
      });
    }
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
export const classifyDifficultyAsync = (title: string, desc: string) => GeminiCliGradingService.classifyDifficulty(title, desc);