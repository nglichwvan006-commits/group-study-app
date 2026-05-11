import { Router } from "express";
import { getTodayQuiz, answerQuiz } from "../controllers/quiz.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/today", authenticate as any, getTodayQuiz as any);
router.post("/answer", authenticate as any, answerQuiz as any);

export default router;
