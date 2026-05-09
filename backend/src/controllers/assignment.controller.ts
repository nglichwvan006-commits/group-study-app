import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

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
  const { title, description, deadline } = req.body;
  const creatorId = req.user?.id;

  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
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
      },
    });
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
