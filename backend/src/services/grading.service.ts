import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../utils/prisma";

// Use a more stable initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export const gradeSubmissionAsync = async (submissionId: string) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, user: true },
    });

    if (!submission || submission.status !== "PENDING") return;

    if (!process.env.GEMINI_API_KEY) {
      console.error("[AI Grading] GEMINI_API_KEY is not configured.");
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: "Lỗi hệ thống: Chưa cấu hình API Key cho AI." },
      });
      return;
    }

    console.log(`[AI Grading] Starting evaluation for submission: ${submissionId}`);
    
    // Try gemini-1.5-flash-latest first as it's more standard
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a strict programming judge.
Evaluate the following solution based on the assignment requirements.
IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting or \`\`\`json blocks.

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

    console.log(`[AI Grading] Sending request to Gemini...`);
    
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError: any) {
      console.error("[AI Grading] Primary model failed, trying fallback...", apiError.message);
      // Fallback to gemini-pro if flash fails
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      result = await fallbackModel.generateContent(prompt);
    }

    const responseText = result.response.text().trim();
    console.log(`[AI Grading] Received response.`);
    
    // Extract JSON from response (handling potential markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       console.error("[AI Grading] Response format error:", responseText);
       throw new Error(`Định dạng AI trả về không hợp lệ.`);
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

    // Update User Ranking
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

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: submission.user.id,
        title: "Bài tập đã được chấm",
        message: `Bạn đạt ${clampedScore}/${submission.assignment.maxScore} điểm cho bài '${submission.assignment.title}'.`,
      },
    });

    console.log("[AI Grading] Process completed successfully.");

  } catch (error: any) {
    console.error(`[AI Grading] Final failure:`, error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: "FAILED", 
        feedback: `Lỗi AI: ${error.message || "Không thể kết nối với máy chủ AI."}` 
      },
    });
  }
};
