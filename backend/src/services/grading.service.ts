import prisma from "../utils/prisma";

export const gradeSubmissionAsync = async (submissionId: string) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, user: true },
    });

    if (!submission || submission.status !== "PENDING") return;

    if (!process.env.GEMINI_API_KEY) {
      console.error("[AI Grading] API Key is missing.");
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "FAILED", feedback: "Lỗi: Chưa cấu hình GEMINI_API_KEY trên Render." },
      });
      return;
    }

    console.log(`[AI Grading] EVALUATING: ${submissionId} via Direct REST API (v1)`);
    
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `You are a strict programming judge.
Evaluate the following solution based on the assignment requirements.
Return ONLY a raw JSON object. NO markdown, NO \`\`\`json blocks.

{
  "score": number,
  "maxScore": number,
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}

ASSIGNMENT:
Title: ${submission.assignment.title}
Requirements: ${submission.assignment.description}
Language: ${submission.assignment.language}
Max Points: ${submission.assignment.maxScore}
Rubric: ${submission.assignment.rubric}

STUDENT SOLUTION:
${submission.content}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AI Grading] Google API Error:", response.status, errorData);
      throw new Error(`Google API trả về lỗi ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!responseText) {
      throw new Error("AI không trả về nội dung.");
    }

    console.log(`[AI Grading] Gemini Response: ${responseText.substring(0, 50)}...`);
    
    // Robust JSON extraction
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       console.error("[AI Grading] Format Error. Response was:", responseText);
       throw new Error("AI trả về định dạng không phải JSON.");
    }

    const gradingResult = JSON.parse(jsonMatch[0]);

    // Update DB
    const clampedScore = Math.max(0, Math.min(gradingResult.score, submission.assignment.maxScore));

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: clampedScore,
        feedback: gradingResult.feedback || "Hoàn thành chấm điểm.",
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    // Ranking Update
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
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge },
        });
      }
    });

    // Notify User
    await prisma.notification.create({
      data: {
        userId: submission.user.id,
        title: "Chấm điểm hoàn tất",
        message: `Kết quả: ${clampedScore}/${submission.assignment.maxScore} điểm cho bài '${submission.assignment.title}'.`,
      },
    });

    console.log("[AI Grading] DONE.");

  } catch (error: any) {
    console.error(`[AI Grading] ERROR:`, error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: "FAILED", 
        feedback: `Lỗi kết nối AI: ${error.message}` 
      },
    });
  }
};
