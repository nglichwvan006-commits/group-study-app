import { Router } from "express";
import { getAssignments, createAssignment, submitAssignment, getSubmissions, getMySubmissions, submitAIResult, updateAssignment, deleteAssignment } from "../controllers/assignment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate as any);

router.get("/", getAssignments as any);
router.get("/my-submissions", getMySubmissions as any);
router.post("/", authorize([Role.ADMIN]) as any, createAssignment as any);
router.patch("/:id", authorize([Role.ADMIN]) as any, updateAssignment as any);
router.delete("/:id", authorize([Role.ADMIN]) as any, deleteAssignment as any);
router.post("/submit", authorize([Role.MEMBER]) as any, submitAssignment as any);
router.patch("/submissions/:id/ai-result", authorize([Role.MEMBER]) as any, submitAIResult as any);
router.get("/:assignmentId/submissions", authorize([Role.ADMIN]) as any, getSubmissions as any);

export default router;
