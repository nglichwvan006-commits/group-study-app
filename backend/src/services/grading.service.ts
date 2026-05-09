import { spawn } from "child_process";
import prisma from "../utils/prisma";

interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export class GeminiCliGradingService {
  private static MAX_RETRIES = 3;
  private static TIMEOUT_MS = 60000; // 60 seconds

  private static buildPrompt(submission: any): string {
    return `You are a strict programming judge.
Evaluate the student's code according to the assignment requirements.

Assignment Title: ${submission.assignment.title}
Assignment Description: ${submission.assignment.description}
Programming Language: ${submission.assignment.language}
Grading Rubric: ${submission.assignment.rubric}
Maximum Score: ${submission.assignment.maxScore}

Student Code:
\`\`\`${submission.assignment.language}
${submission.content}
\`\`\`

Rules:
- Return ONLY valid JSON.
- Do not include markdown or explanations.
- Score must be an integer between 0 and ${submission.assignment.maxScore}.
- Be strict but fair.

Required JSON schema:
{
  "score": number,
  "maxScore": number,
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}
`;
  }

  private static async runGeminiCli(prompt: string, model: string, attempt: number): Promise<string> {
    console.log(`[CLI Grading] Attempt ${attempt + 1} using model: ${model}`);
    
    return new Promise((resolve, reject) => {
      // Using curl as the robust CLI engine for Render/Linux environments
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const child = spawn("curl", [
        "-s", "-X", "POST", apiUrl,
        "-H", "Content-Type: application/json",
        "-d", payload
      ]);

      let stdout = "";
      let stderr = "";

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("Gemini CLI execution timed out after 60s"));
      }, this.TIMEOUT_MS);

      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });

      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error(`[CLI Grading] stderr: ${stderr.substring(0, 200)}`);
          reject(new Error(`CLI process exited with code ${code}`));
          return;
        }
        if (!stdout.trim()) {
          reject(new Error("Gemini CLI returned empty output"));
          return;
        }
        resolve(stdout);
      });
    });
  }

  private static extractJson(output: string): any {
    if (!output || typeof output !== 'string') {
      throw new Error('Gemini CLI output is invalid or empty');
    }

    // Parse the Google API response first
    let rawText = "";
    try {
      const parsedApi = JSON.parse(output);
      rawText = parsedApi.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } catch (e) {
      // If it's not a valid API JSON, maybe the CLI returned the text directly
      rawText = output.trim();
    }

    if (!rawText) throw new Error("No text content found in AI response");

    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`No JSON found in AI output. Raw text: ${rawText.substring(0, 100)}`);
    }

    try {
      return JSON.parse(match[0]);
    } catch (e) {
      throw new Error("Malformed JSON in AI response");
    }
  }

  private static validateResult(result: any, maxScore: number): GradingResult {
    const validated: GradingResult = {
      score: typeof result.score === 'number' ? result.score : 0,
      maxScore: result.maxScore || maxScore,
      feedback: result.feedback || "Đã chấm điểm xong.",
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };

    // Clamp score
    validated.score = Math.max(0, Math.min(validated.score, maxScore));
    return validated;
  }

  public static async gradeSubmission(submissionId: string) {
    let attempt = 0;
    let lastError = "";

    while (attempt < this.MAX_RETRIES) {
      try {
        const submission = await prisma.submission.findUnique({
          where: { id: submissionId },
          include: { assignment: true, user: true },
        });

        if (!submission || submission.status !== "PENDING") return;

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("Missing GEMINI_API_KEY");
        }

        const prompt = this.buildPrompt(submission);
        // Use gemini-1.5-pro for first attempt, fallback to gemini-1.5-flash
        const model = attempt === 0 ? "gemini-1.5-pro" : "gemini-1.5-flash";
        
        const output = await this.runGeminiCli(prompt, model, attempt);
        const rawJson = this.extractJson(output);
        const result = this.validateResult(rawJson, submission.assignment.maxScore);

        console.log(`[CLI Grading] Successful! Score: ${result.score}/${submission.assignment.maxScore}`);

        // Atomic Transaction
        await prisma.$transaction(async (tx) => {
          await tx.submission.update({
            where: { id: submissionId },
            data: {
              score: result.score,
              feedback: result.feedback,
              status: "GRADED",
              gradedAt: new Date(),
            },
          });

          const user = await tx.user.findUnique({ where: { id: submission.userId } });
          if (user) {
            const newPoints = user.totalPoints + result.score;
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
            title: "Kết quả chấm điểm bài tập",
            message: `Bạn đạt ${result.score}/${submission.assignment.maxScore} điểm cho bài ${submission.assignment.title}.`,
          },
        });

        return; // Success!

      } catch (error: any) {
        lastError = error.message;
        console.error(`[CLI Grading] Attempt ${attempt + 1} failed: ${lastError}`);
        attempt++;
        if (attempt < this.MAX_RETRIES) {
           // Small delay before retry
           await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    // Final failure
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "FAILED", feedback: `Lỗi chấm điểm hệ thống (CLI): ${lastError}` },
    });
  }
}

// Export for backward compatibility with existing controller
export const gradeSubmissionAsync = (id: string) => GeminiCliGradingService.gradeSubmission(id);
