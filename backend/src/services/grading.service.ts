import prisma from "../utils/prisma";

export class GeminiCliGradingService {
  public static async gradeSubmission(submissionId: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission || submission.status !== "PENDING") return;

    const prompt = `You are a strict programming judge.
Evaluate this ${submission.assignment.language} code for the task: "${submission.assignment.description}".
Return ONLY a raw JSON object. No explanations.
{
  "score": number,
  "feedback": "string"
}
Max Score: ${submission.assignment.maxScore}
Student Code:
${submission.content}`;

    // DANH SÁCH THỬ NGHIỆM (FALLBACK LIST)
    const options = [
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, name: "Flash v1" },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, name: "Flash v1beta" },
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, name: "Pro 1.5 v1" },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, name: "Pro v1beta" }
    ];

    let lastError = "Không có model nào phản hồi.";

    for (const opt of options) {
      try {
        console.log(`[AI Grading] Đang thử qua: ${opt.name}`);
        const response = await fetch(opt.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (response.ok) {
          const data: any = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const jsonMatch = aiText?.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
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
                await tx.user.update({
                  where: { id: submission.userId },
                  data: { totalPoints: newPoints, level: Math.floor(newPoints / 100) + 1 },
                });
              }
            });
            console.log(`[AI Grading] THÀNH CÔNG bằng model: ${opt.name}`);
            return; // Thoát hàm nếu thành công
          }
        } else {
          const err = await response.json();
          lastError = err.error?.message || response.statusText;
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    // Nếu chạy hết danh sách mà vẫn lỗi
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "FAILED", feedback: `Lỗi AI (Đã thử 4 model): ${lastError}` },
    });
  }
}

export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
