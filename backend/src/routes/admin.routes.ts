import { Router } from "express";
import { getUsers, createMember, deleteUser, muteUser, sendWarning, overrideScore, sendNotification, syncAllUsersXP, resetAllPoints, resetUserPoints, banUser, changeUserPassword, forceGenerateQuiz } from "../controllers/admin.controller";
import { getSettings, updateSetting } from "../controllers/settings.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate as any, authorize([Role.ADMIN]) as any);

router.get("/users", getUsers as any);
router.post("/users", createMember as any);
router.delete("/users/:id", deleteUser as any);
router.patch("/users/:id/mute", muteUser as any);
router.patch("/users/:id/ban", banUser as any);
router.patch("/users/:id/password", changeUserPassword as any);
router.post("/users/:id/reset-points", resetUserPoints as any);
router.post("/notifications", sendNotification as any);
router.post("/warnings", sendWarning as any);
router.post("/sync-xp", syncAllUsersXP as any);
router.post("/reset-all-points", resetAllPoints as any);
router.patch("/submissions/:id/override", overrideScore as any);
router.post("/quizzes/force-generate", forceGenerateQuiz as any);

// Settings
router.get("/settings", getSettings as any);
router.patch("/settings", updateSetting as any);

export default router;
