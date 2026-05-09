import { Router } from "express";
import { getAssignments, createAssignment, submitAssignment, getSubmissions } from "../controllers/assignment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate);

router.get("/", getAssignments);
router.post("/", authorize([Role.ADMIN]), createAssignment);
router.post("/submit", authorize([Role.MEMBER]), submitAssignment);
router.get("/:assignmentId/submissions", authorize([Role.ADMIN]), getSubmissions);

export default router;
