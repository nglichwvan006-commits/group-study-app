import { Router } from "express";
import { 
  getAssignments, 
  createAssignment, 
  submitAssignment, 
  getSubmissions, 
  getMySubmissions, 
  updateAssignment, 
  deleteAssignment, 
  bulkDeleteAssignments,
  bulkToggleHideAssignments
} from "../controllers/assignment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate as any);

router.get("/", getAssignments as any);
router.get("/my-submissions", getMySubmissions as any);
router.post("/", authorize([Role.ADMIN]) as any, createAssignment as any);
router.post("/bulk-delete", authorize([Role.ADMIN]) as any, bulkDeleteAssignments as any);
router.post("/bulk-hide", authorize([Role.ADMIN]) as any, bulkToggleHideAssignments as any);
router.patch("/:id", authorize([Role.ADMIN]) as any, updateAssignment as any);
router.delete("/:id", authorize([Role.ADMIN]) as any, deleteAssignment as any);
router.post("/submit", authorize([Role.MEMBER]) as any, submitAssignment as any);
router.get("/:assignmentId/submissions", authorize([Role.ADMIN]) as any, getSubmissions as any);

export default router;
