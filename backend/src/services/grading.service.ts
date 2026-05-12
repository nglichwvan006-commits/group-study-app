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
- Dễ: Bài tập cơ bản, in chuỗi, tính toán đơn giản. (50 điểm)
- Trung bình: Có sử dụng vòng lặp, mảng cơ bản. (70 điểm)
- Khá: Sử dụng cấu trúc dữ liệu, thuật toán sắp xếp cơ bản. (100 điểm)
- Khó: Thuật toán phức tạp, đệ quy, xử lý file hoặc API. (150 điểm)
- Master: Thử thách cực khó, tối ưu thuật toán, kiến trúc hệ thống. (500 điểm)`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "inclusion-ai/ring-2.6-1t:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[AI Difficulty] OpenRouter Error:", data);
        return "Trung bình";
      }

      const text = data.choices?.[0]?.message?.content || "Trung bình";
      const difficulties = ["Dễ", "Trung bình", "Khá", "Khó", "Master"];
      const match = difficulties.find(d => text.includes(d));
      return match || "Trung bình";
    } catch (error) {
      return "Trung bình";
    }
  }

  public static async bulkGenerateAssignments(rawText: string): Promise<any[]> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return [];

    try {
      const prompt = `Bạn là một chuyên gia thiết kế bài tập lập trình. Hãy phân tích đoạn văn bản dưới đây và tách nó thành danh sách các bài tập lập trình cụ thể.
Văn bản:
---
${rawText}
---

Yêu cầu:
1. Tách thành các bài tập riêng lẻ.
2. Với mỗi bài tập, xác định: Tiêu đề, Mô tả chi tiết yêu cầu, và Độ khó.
3. Độ khó phải thuộc một trong các giá trị: "Dễ", "Trung bình", "Khá", "Khó", "Master".
4. Trả về kết quả DUY NHẤT ở định dạng JSON là một mảng các đối tượng có cấu trúc:
[
  {
    "title": "Tiêu đề bài tập",
    "description": "Mô tả chi tiết và yêu cầu bài tập",
    "difficulty": "Dễ/Trung bình/Khá/Khó/Master"
  }
]

Đảm bảo JSON hợp lệ và không có văn bản thừa bên ngoài.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://group-study-app.vercel.app",
          "X-Title": "Group Study App"
        },
        body: JSON.stringify({
          model: "inclusion-ai/ring-2.6-1t:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "[]";
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      
      const assignments = JSON.parse(jsonMatch[0]);
      return assignments;
    } catch (error) {
      console.error("[AI Bulk] Error:", error);
      return [];
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
2. Trả về kết quả DUY NHẤT ở định dạng JSON, không có văn bản giải thích nào khác.
3. Định dạng JSON: {"score": number, "feedback": "string tiếng Việt", "suggestedCode": "string"}.
4. Điểm số (score) phải là số nguyên từ 0 đến ${submission.assignment.maxScore}.
5. Nhận xét (feedback) cần mang tính xây dựng, chỉ ra chỗ tốt và chỗ cần cải thiện.
6. "suggestedCode": Cung cấp mã nguồn mẫu chính xác và tối ưu nhất bằng ngôn ngữ ${submission.assignment.language} cho bài tập này.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://group-study-app.vercel.app",
          "X-Title": "Group Study App"
        },
        body: JSON.stringify({
          model: "inclusion-ai/ring-2.6-1t:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("[AI Grading] OpenRouter API Error:", data);
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const aiText = data.choices?.[0]?.message?.content || "";
      console.log("[AI Grading] AI Response Text:", aiText);

      let result;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Clean up common AI artifacts like markdown blocks
          let jsonStr = jsonMatch[0].trim();
          result = JSON.parse(jsonStr);
        } else {
          throw new Error("No JSON found in AI response");
        }
      } catch (parseError) {
        console.error("[AI Grading] Failed to parse AI JSON:", parseError);
        console.log("[AI Grading] Raw AI text that failed:", aiText);
        result = { score: 0, feedback: "AI không thể phân tích bài làm do lỗi định dạng kết quả.", suggestedCode: "" };
      }

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

        // ... (Recalculate full XP logic remains same)
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

        // Random token reward: 0-50 tokens for first-time success (>50% score)
        const existingGradedCount = await (tx as any).submission.count({
          where: {
            userId: submission.userId,
            assignmentId: submission.assignmentId,
            status: "GRADED",
            id: { not: submissionId }
          }
        });

        let tokenReward = 0;
        if (existingGradedCount === 0 && finalScore >= (submission.assignment.maxScore * 0.5)) {
          tokenReward = Math.floor(Math.random() * 51);
        }

        await (tx as any).user.update({
          where: { id: submission.userId },
          data: { 
            totalPoints: newPoints, 
            level: newLevel, 
            badge: newBadge,
            skillTokens: { increment: tokenReward }
          },
        });

        // Pet Revive Logic: Check if pet is DEAD and assignment is Medium/C++
        const pet = await tx.pet.findUnique({ where: { userId: submission.userId } });
        if (pet && pet.status === "DEAD") {
           const isMedium = ["Trung bình", "Khá"].includes(submission.assignment.difficulty || "");
           const isGoodScore = finalScore >= (submission.assignment.maxScore * 0.5); // At least 50% score
           
           if (isMedium && isGoodScore) {
              const progress = await tx.petReviveProgress.findUnique({ where: { userId: submission.userId } });
              let currentIds = progress ? progress.completedAssignmentIds.split(",").filter(id => id.length > 0) : [];
              
              if (!currentIds.includes(submission.assignmentId)) {
                 currentIds.push(submission.assignmentId);
                 const newIdsStr = currentIds.join(",");
                 
                 if (progress) {
                    await tx.petReviveProgress.update({
                       where: { userId: submission.userId },
                       data: { completedAssignmentIds: newIdsStr }
                    });
                 } else {
                    await tx.petReviveProgress.create({
                       data: { userId: submission.userId, completedAssignmentIds: newIdsStr }
                    });
                 }

                 if (currentIds.length <= 3) {
                    await (tx as any).notification.create({
                       data: {
                          userId: submission.userId,
                          title: "Tiến trình hồi sinh Pet 🐱",
                          message: `Bạn đã hoàn thành ${currentIds.length}/3 bài tập Medium để hồi sinh Pet!`
                       }
                    });
                 }
              }
           }
        }

        // Enhanced Notification
        let msg = `Bài làm mới của bạn cho "${submission.assignment.title}" đạt ${finalScore}/${submission.assignment.maxScore} điểm.`;
        if (tokenReward > 0) {
           msg += `\n🎁 Bạn được thưởng **${tokenReward} Token** vì hoàn thành tốt bài tập!`;
        }
        msg += `\n\nNhận xét: ${result.feedback}`;

        // Check if code suggestions are enabled globally
        const suggestionSetting = await tx.globalSetting.findUnique({ where: { key: "enable_code_suggestions" } });
        const suggestionsEnabled = suggestionSetting ? suggestionSetting.value === "true" : true; // Default to true if not set

        if (result.suggestedCode && suggestionsEnabled) {
           msg += `\n\n💡 Gợi ý code mẫu:\n\`\`\`${submission.assignment.language}\n${result.suggestedCode}\n\`\`\``;
        }

        await (tx as any).notification.create({
          data: {
            userId: submission.userId,
            assignmentId: submission.assignmentId,
            title: "Kết quả chấm bài AI mới 📝",
            message: msg,
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
export const bulkGenerateAssignmentsAsync = (text: string) => GeminiCliGradingService.bulkGenerateAssignments(text);