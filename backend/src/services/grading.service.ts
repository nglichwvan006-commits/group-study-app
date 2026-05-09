import { exec } from "child_process";
import { promisify } from "util";
import prisma from "../utils/prisma";

const execAsync = promisify(exec);

export const gradeSubmissionAsync = async (submissionId: string, retryCount = 0) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, user: true },
    });

    if (!submission || submission.status !== "PENDING") return;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Chưa cấu hình GEMINI_API_KEY");
    }

    console.log(`[CLI Grading] Đang chấm bài: ${submission.assignment.title} (Lần thử: ${retryCount + 1})`);

    const prompt = `You are a strict programming judge. 
Evaluate this ${submission.assignment.language} code. 
Return ONLY valid raw JSON. No markdown.

{
  "score": number,
  "feedback": "string"
}

Requirements: ${submission.assignment.description}
Max Score: ${submission.assignment.maxScore}
Student Code:
${submission.content.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$')}`;

    // Sử dụng curl (CLI) để gọi API - Đây là cách ổn định nhất trên Linux/Render
    const modelName = retryCount === 0 ? "gemini-1.5-flash" : "gemini-pro";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const curlCommand = `curl -X POST "${apiUrl}" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{ "parts": [{ "text": "${prompt.replace(/\n/g, ' ')}" }] }]
      }'`;

    const { stdout, stderr } = await execAsync(curlCommand);

    if (stderr && !stdout) {
      throw new Error(`CLI Error: ${stderr}`);
    }

    const response = JSON.parse(stdout);
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ");

    const result = JSON.parse(jsonMatch[0]);
    const clampedScore = Math.max(0, Math.min(result.score, submission.assignment.maxScore));

    // Cập nhật kết quả vào DB
    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          score: clampedScore,
          feedback: result.feedback,
          status: "GRADED",
          gradedAt: new Date(),
        },
      });

      const user = await tx.user.findUnique({ where: { id: submission.userId } });
      if (user) {
        const newPoints = user.totalPoints + clampedScore;
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

    // Tạo thông báo
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: "Bài tập đã được chấm",
        message: `Bạn đạt ${clampedScore}/${submission.assignment.maxScore} điểm cho bài ${submission.assignment.title}.`,
      },
    });

    console.log(`[CLI Grading] Hoàn tất chấm bài: ${submissionId}`);

  } catch (error: any) {
    console.error(`[CLI Grading] Lỗi:`, error.message);
    
    if (retryCount < 2) {
      console.log("[CLI Grading] Đang thử lại với model dự phòng...");
      return gradeSubmissionAsync(submissionId, retryCount + 1);
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "FAILED", feedback: `Lỗi hệ thống (CLI): ${error.message}` },
    });
  }
};
