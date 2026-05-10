import { Router } from "express";
import { getLeaderboard, getNotifications, markNotificationsRead, replyToNotification, clearNotifications } from "../controllers/ranking.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get("/leaderboard", getLeaderboard as any);
router.get("/notifications", getNotifications as any);
router.delete("/notifications", clearNotifications as any);
router.patch("/notifications/read", markNotificationsRead as any);
router.post("/notifications/:id/reply", replyToNotification as any);

export default router;
