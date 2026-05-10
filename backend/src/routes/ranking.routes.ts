import { Router } from "express";
import { getLeaderboard, getNotifications, markNotificationsRead, replyToNotification } from "../controllers/ranking.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/leaderboard", getLeaderboard);
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.post("/notifications/:id/reply", replyToNotification);

export default router;
