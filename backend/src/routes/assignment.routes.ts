import { Router } from "express";
import { getAssignments, createAssignment, submitAssignment, getSubmissions, getMySubmissions, submitAIResult, updateAssignment, deleteAssignment } from "../controllers/assignment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate);

router.get("/", getAssignments);
router.get("/my-submissions", getMySubmissions);
router.post("/", authorize([Role.ADMIN]), createAssignment);
router.patch("/:id", authorize([Role.ADMIN]), updateAssignment);
router.delete("/:id", authorize([Role.ADMIN]), deleteAssignment);
router.post("/submit", authorize([Role.MEMBER]), submitAssignment);
router.patch("/submissions/:id/ai-result", authorize([Role.MEMBER]), submitAIResult);
router.get("/:assignmentId/submissions", authorize([Role.ADMIN]), getSubmissions);

export default router;
