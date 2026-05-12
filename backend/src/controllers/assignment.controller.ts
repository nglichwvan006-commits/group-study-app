import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProblemJudgeService } from "../services/problem-judge.service";
import { cache } from "../services/cache.service";

export const getAssignments = async (req: any, res: Response) => {
  const userRole = req.user?.role;
  const cacheKey = `assignments_${userRole}`;

  try {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const assignments = await prisma.assignment.findMany({
      where: userRole === "ADMIN" ? {} : { isHidden: false },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true } } },
    });

    cache.set(cacheKey, assignments);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

export const createAssignment = async (req: any, res: Response) => {
  const { title, description, deadline, maxScore, difficulty, language, testCases, timeLimit, memoryLimit, complexity } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const finalDifficulty = difficulty || "Trung bình";

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        language: language || "javascript", 
        maxScore: maxScore ? parseInt(maxScore) : 100,
        difficulty: finalDifficulty,
        creatorId,
        isHidden: false,
        timeLimit: timeLimit ? parseInt(timeLimit) : 2000,
        memoryLimit: memoryLimit ? parseInt(memoryLimit) : 128,
        complexity: complexity || "O(n)",
        testCases: {
          create: testCases?.map((tc: any, index: number) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden || false,
            weight: tc.weight || 10,
            order: index
          }))
        }
      },
      include: { testCases: true }
    });

    // Clear cache
    cache.del("assignments_ADMIN");
    cache.del("assignments_MEMBER");

    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Error creating assignment" });
  }
};

export const bulkDeleteAssignments = async (req: any, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: "IDs array is required" });

  try {
    const affectedUserIds = await (prisma as any).submission.findMany({
      where: { assignmentId: { in: ids }, status: "GRADED" },
      select: { userId: true }
    }).then((subs: any[]) => [...new Set(subs.map(s => s.userId))]);

    await prisma.$transaction(async (tx) => {
      await (tx as any).submission.deleteMany({ where: { assignmentId: { in: ids } } });
      await tx.assignment.deleteMany({ where: { id: { in: ids } } });

      for (const userId of affectedUserIds) {
        const userSubmissions = await (tx as any).submission.findMany({
          where: { userId, status: "GRADED" },
          select: { assignmentId: true, score: true }
        });

        const bestScores: { [key: string]: number } = {};
        userSubmissions.forEach((s: any) => {
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
          where: { id: userId },
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge }
        });
      }
    });

    cache.del("assignments_ADMIN");
    cache.del("assignments_MEMBER");
    cache.del("leaderboard_top_100");

    res.json({ message: `Successfully deleted ${ids.length} assignments and updated users' XP.` });
  } catch (error) {
    res.status(500).json({ message: "Error during bulk delete" });
  }
};

export const bulkToggleHideAssignments = async (req: any, res: Response) => {
  const { ids, isHidden } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: "IDs array is required" });

  try {
    await prisma.assignment.updateMany({
      where: { id: { in: ids } },
      data: { isHidden: isHidden }
    });
    
    cache.del("assignments_ADMIN");
    cache.del("assignments_MEMBER");
    
    res.json({ message: `Successfully ${isHidden ? 'hidden' : 'shown'} ${ids.length} assignments.` });
  } catch (error) {
    res.status(500).json({ message: "Error during bulk hide/show" });
  }
};

import { judgeQueue } from "../services/queue.service";

export const submitAssignment = async (req: any, res: Response) => {
  const { assignmentId, content, language } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!assignmentId || !content || !language) {
    return res.status(400).json({ message: "Missing required fields: assignmentId, content, or language" });
  }

  try {
    // 1. Tạo bản ghi Submission với trạng thái QUEUED
    const submission = await (prisma as any).submission.create({
      data: {
        content,
        userId,
        assignmentId,
        language: language.toLowerCase(),
        status: "QUEUED"
      },
    });
    
    // 2. Đẩy vào BullMQ thay vì chạy đồng bộ
    await judgeQueue.add('judge-submission', { submissionId: submission.id });

    res.status(201).json({
      submissionId: submission.id,
      status: "QUEUED",
      message: "Submission is queued for judging."
    });
  } catch (error: any) {
    console.error("[Submit Controller] Error:", error);
    res.status(500).json({ message: "Error queuing submission: " + error.message });
  }
};

export const getSubmissions = async (req: any, res: Response) => {
  const { assignmentId } = req.params;

  try {
    const submissions = await (prisma as any).submission.findMany({
      where: { assignmentId: String(assignmentId) },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const getMySubmissions = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const submissions = await (prisma as any).submission.findMany({
      where: { userId },
      include: { assignment: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const updateAssignment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, deadline, maxScore, difficulty, language, testCases, timeLimit, memoryLimit, complexity } = req.body;

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      const updated = await tx.assignment.update({
        where: { id: String(id) },
        data: {
          title,
          description,
          deadline: deadline ? new Date(deadline) : null,
          maxScore: maxScore ? parseInt(maxScore) : undefined,
          difficulty,
          language,
          timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
          memoryLimit: memoryLimit ? parseInt(memoryLimit) : undefined,
          complexity,
        },
      });

      // 2. Cập nhật Test Cases nếu có gửi lên
      if (testCases && Array.isArray(testCases)) {
        // Xóa các test case cũ
        await tx.testCase.deleteMany({
          where: { assignmentId: String(id) }
        });

        // Tạo lại bộ test case mới
        if (testCases.length > 0) {
          await tx.testCase.createMany({
            data: testCases.map((tc: any, index: number) => ({
              assignmentId: String(id),
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden || false,
              weight: tc.weight || 10,
              order: index
            }))
          });
        }
      }

      return updated;
    });
    
    cache.del("assignments_ADMIN");
    cache.del("assignments_MEMBER");

    res.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Error updating assignment" });
  }
};

export const deleteAssignment = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const affectedUserIds = await (prisma as any).submission.findMany({
      where: { assignmentId: String(id), status: "GRADED" },
      select: { userId: true }
    }).then((subs: any[]) => [...new Set(subs.map(s => s.userId))]);

    await prisma.$transaction(async (tx) => {
      // 1. Delete all submissions for this assignment
      await (tx as any).submission.deleteMany({
        where: { assignmentId: String(id) }
      });

      // 2. Delete the assignment
      await tx.assignment.delete({
        where: { id: String(id) }
      });

      // 3. Recalculate XP for all affected users automatically
      for (const userId of affectedUserIds) {
        const userSubmissions = await (tx as any).submission.findMany({
          where: { userId, status: "GRADED" },
          select: { assignmentId: true, score: true }
        });

        const bestScores: { [key: string]: number } = {};
        userSubmissions.forEach((s: any) => {
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
          where: { id: userId },
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge }
        });
      }
    });

    cache.del("assignments_ADMIN");
    cache.del("assignments_MEMBER");
    cache.del("leaderboard_top_100"); // Clearing leaderboard as points changed

    res.json({ message: "Assignment deleted and users' XP automatically synchronized" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment" });
  }
};

import * as https from 'https';

async function callGemini(prompt: string): Promise<string> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in environment variables");

    const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                if (res.statusCode && res.statusCode !== 200) {
                    console.error(`Google API Error (Status ${res.statusCode}):`, body.substring(0, 200));
                    return reject(new Error(`API returned status ${res.statusCode}`));
                }
                try {
                    const json = JSON.parse(body);
                    if (json.error) {
                        reject(new Error(json.error.message));
                    } else {
                        let text = json.candidates[0].content.parts[0].text;
                        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        resolve(text);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

export const generateAllTestCases = async (req: any, res: Response) => {
    try {
        const assignments = await prisma.assignment.findMany({
            where: { testCases: { none: {} } }
        });

        if (assignments.length === 0) {
            return res.json({ message: "Không tìm thấy bài tập nào cần tạo test case." });
        }

        res.json({ message: `Đang bắt đầu tạo test case cho ${assignments.length} bài tập trong nền. Quá trình này có thể mất vài phút.` });

        // Chạy ngầm
        (async () => {
            for (const assignment of assignments) {
                try {
                    const prompt = `Bạn là một chuyên gia thiết kế bài tập lập trình. Hãy tạo 5 test case cho bài tập sau đây.
Tiêu đề: ${assignment.title}
Mô tả: ${assignment.description}
Ngôn ngữ: ${assignment.language}

Yêu cầu:
1. Các test case phải bao quát: cơ bản, biên (edge cases).
2. Định dạng mảng JSON: [{ "input": "chuỗi", "expectedOutput": "chuỗi", "isHidden": false, "weight": 20 }]
3. Chỉ trả về JSON. Input và Output phải là chuỗi (string).`;

                    const aiResponse = await callGemini(prompt);
                    const testCases = JSON.parse(aiResponse);

                    if (Array.isArray(testCases) && testCases.length > 0) {
                        await prisma.testCase.createMany({
                            data: testCases.map((tc, index) => ({
                                assignmentId: assignment.id,
                                input: String(tc.input),
                                expectedOutput: String(tc.expectedOutput),
                                isHidden: tc.isHidden || false,
                                weight: tc.weight || 20,
                                order: index
                            }))
                        });
                        console.log(`Successfully generated ${testCases.length} test cases for assignment ${assignment.id}`);
                    }
                } catch (error) {
                    console.error(`Failed to generate test case for ${assignment.title}:`, error);
                }
            }
        })();
    } catch (error) {
        console.error("Error initiating test case generation:", error);
        res.status(500).json({ message: "Lỗi khi bắt đầu tạo test case." });
    }
};