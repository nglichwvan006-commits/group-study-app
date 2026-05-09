import { Router } from "express";
import { getChatHistory, deleteMessage } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/history", authenticate, getChatHistory);
router.delete("/:id", authenticate, deleteMessage);

export default router;
