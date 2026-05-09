import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../utils/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export const gradeSubmissionAsync = async (submissionId: string) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, user: true },
    });

    if (!submission || submission.status !== "PENDING") return;

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured.");
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: "Lỗi hệ thống: Chưa cấu hình AI." },
      });
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `You are a strict programming judge.
Evaluate the following solution based on the assignment requirements.
Return ONLY valid JSON without Markdown blocks (no \`\`\`json).

{
  "score": number,
  "maxScore": number,
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}

Input:
- Assignment: ${submission.assignment.title}
- Description: ${submission.assignment.description}
- Language: ${submission.assignment.language}
- Rubric: ${submission.assignment.rubric}
- Max Score: ${submission.assignment.maxScore}
- Student Code:
${submission.content}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       throw new Error("AI did not return valid JSON");
    }

    const gradingResult = JSON.parse(jsonMatch[0]);

    // Clamp score
    const clampedScore = Math.max(0, Math.min(gradingResult.score, submission.assignment.maxScore));

    // Update submission
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: clampedScore,
        feedback: gradingResult.feedback || "Đã chấm xong.",
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    // Update Ranking Points in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: submission.user.id } });
      if (user) {
        const newPoints = user.totalPoints + clampedScore;
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        let newBadge = user.badge;
        if (newPoints >= 1000) newBadge = "Master";
        else if (newPoints >= 500) newBadge = "Diamond";
        else if (newPoints >= 300) newBadge = "Platinum";
        else if (newPoints >= 150) newBadge = "Gold";
        else if (newPoints >= 50) newBadge = "Silver";
        else newBadge = "Bronze";

        await tx.user.update({
          where: { id: user.id },
          data: {
            totalPoints: newPoints,
            level: newLevel,
            badge: newBadge,
          },
        });
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: submission.user.id,
        title: "Đã chấm điểm bài tập",
        message: `Bài tập '${submission.assignment.title}' của bạn đã được chấm: ${clampedScore}/${submission.assignment.maxScore} điểm.`,
      },
    });

  } catch (error) {
    console.error(`Grading failed for submission ${submissionId}:`, error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "FAILED", feedback: "Lỗi trong quá trình chấm điểm bằng AI." },
    });
  }
};
