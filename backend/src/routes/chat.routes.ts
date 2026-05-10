import { Router } from "express";
import { getChatHistory, deleteMessage, getRooms, createRoom, deleteRoom } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/rooms", authenticate as any, getRooms as any);
router.post("/rooms", authenticate as any, createRoom as any);
router.delete("/rooms/:id", authenticate as any, deleteRoom as any);
router.get("/history", authenticate as any, getChatHistory as any);
router.delete("/:id", authenticate as any, deleteMessage as any);

export default router;
