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
    // Check if user already submitted (optional based on requirements, but let's allow it or overwrite. I'll just create a new one for now)
    const submission = await prisma.submission.create({
      data: {
        content,
        userId,
        assignmentId,
        status: "PENDING"
      },
    });
    
    // Trigger async grading
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

