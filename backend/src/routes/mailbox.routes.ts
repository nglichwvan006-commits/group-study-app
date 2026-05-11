import { Router } from "express";
import { getMailbox, markRead, markAllRead, deleteMail } from "../controllers/mailbox.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate as any, getMailbox as any);
router.patch("/:id/read", authenticate as any, markRead as any);
router.patch("/read-all", authenticate as any, markAllRead as any);
router.delete("/:id", authenticate as any, deleteMail as any);

export default router;
