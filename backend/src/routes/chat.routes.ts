import { Router } from "express";
import { getChatHistory, deleteMessage, getRooms, createRoom, deleteRoom } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/rooms", authenticate, getRooms);
router.post("/rooms", authenticate, createRoom);
router.delete("/rooms/:id", authenticate, deleteRoom);
router.get("/history", authenticate, getChatHistory);
router.delete("/:id", authenticate, deleteMessage);

export default router;
