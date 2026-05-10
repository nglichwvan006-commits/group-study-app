import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { gradeSubmissionAsync } from "../services/grading.service";

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { deadline: "asc" },
      include: { creator: { select: { name: true } } },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  const { title, description, deadline, language, maxScore, rubric } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        language: language || "javascript",
        maxScore: maxScore ? parseInt(maxScore) : 100,
        rubric: rubric || "General correctness",
        creatorId,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error creating assignment" });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  const { assignmentId, content } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const submission = await prisma.submission.create({
      data: {
        content,
        userId,
        assignmentId,
        status: "PENDING"
      },
    });
    
    // We still keep the backend async as a fallback, but the frontend will usually win
    setTimeout(() => {
      gradeSubmissionAsync(submission.id);
    }, 0);

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Error submitting assignment" });
  }
};

export const getSubmissions = async (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;

  try {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: { assignment: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const submitAIResult = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { score, feedback } = req.body;
  const userId = req.user?.id;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id, userId },
      include: { assignment: true }
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (submission.status === "GRADED") return res.status(400).json({ message: "Already graded" });

    const clampedScore = Math.max(0, Math.min(score, submission.assignment.maxScore));

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id },
        data: {
          score: clampedScore,
          feedback: feedback,
          status: "GRADED",
          gradedAt: new Date(),
        },
      });

      // Recalculate full XP for this user automatically from all best graded submissions
      const allUserSubmissions = await tx.submission.findMany({
        where: { userId, status: "GRADED" },
        select: { assignmentId: true, score: true }
      });

      const bestScores: { [key: string]: number } = {};
      allUserSubmissions.forEach(s => {
        if (!bestScores[s.assignmentId] || (s.score || 0) > bestScores[s.assignmentId]) {
          bestScores[s.assignmentId] = s.score || 0;
        }
      });

      const newPoints = Object.values(bestScores).reduce((a, b) => a + b, 0);
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      let newBadge = "Bronze";
      if (newPoints >= 1000) newBadge = "Master";
      else if (newPoints >= 500) newBadge = "Diamond";
      else if (newPoints >= 300) newBadge = "Platinum";
      else if (newPoints >= 150) newBadge = "Gold";
      else if (newPoints >= 50) newBadge = "Silver";

      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: newPoints, level: newLevel, badge: newBadge },
      });
    });

    res.json({ message: "AI score saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving AI result" });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, deadline, language, maxScore, rubric } = req.body;

  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : undefined,
        language,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        rubric,
      },
    });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment" });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const affectedUserIds = await prisma.submission.findMany({
      where: { assignmentId: id, status: "GRADED" },
      select: { userId: true }
    }).then(subs => [...new Set(subs.map(s => s.userId))]);

    await prisma.$transaction(async (tx) => {
      // 1. Delete all submissions for this assignment
      await tx.submission.deleteMany({
        where: { assignmentId: id }
      });

      // 2. Delete the assignment
      await tx.assignment.delete({
        where: { id }
      });

      // 3. Recalculate XP for all affected users automatically
      for (const userId of affectedUserIds) {
        const userSubmissions = await tx.submission.findMany({
          where: { userId, status: "GRADED" },
          select: { assignmentId: true, score: true }
        });

        const bestScores: { [key: string]: number } = {};
        userSubmissions.forEach(s => {
          if (!bestScores[s.assignmentId] || (s.score || 0) > bestScores[s.assignmentId]) {
            bestScores[s.assignmentId] = s.score || 0;
          }
        });

        const newPoints = Object.values(bestScores).reduce((a, b) => a + b, 0);
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        let newBadge = "Bronze";
        if (newPoints >= 1000) newBadge = "Master";
        else if (newPoints >= 500) newBadge = "Diamond";
        else if (newPoints >= 300) newBadge = "Platinum";
        else if (newPoints >= 150) newBadge = "Gold";
        else if (newPoints >= 50) newBadge = "Silver";

        await tx.user.update({
          where: { id: userId },
          data: { totalPoints: newPoints, level: newLevel, badge: newBadge }
        });
      }
    });

    res.json({ message: "Assignment deleted and users' XP automatically synchronized" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment" });
  }
};
